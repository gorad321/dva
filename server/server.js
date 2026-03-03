/**
 * DVA E-Commerce - Serveur Express.js principal
 * Configuration : sécurité, CORS, rate limiting, routes API
 */
require('dotenv').config();

const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { initDatabase } = require('./src/db/database');
const authRoutes = require('./src/routes/auth');
const productsRoutes = require('./src/routes/products');
const categoriesRoutes = require('./src/routes/categories');
const brandsRoutes = require('./src/routes/brands');
const cartRoutes = require('./src/routes/cart');
const ordersRoutes = require('./src/routes/orders');
const accountRoutes = require('./src/routes/account');
const reviewsRoutes = require('./src/routes/reviews');
const promotionsRoutes = require('./src/routes/promotions');
const adminRoutes = require('./src/routes/admin');
const vehicleRoutes = require('./src/routes/vehicle');
const paymentsRoutes = require('./src/routes/payments');
const errorHandler = require('./src/middleware/errorHandler');

const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Trust proxy (Railway, Render, etc.) ──────────────────────────────────────
app.set('trust proxy', 1);

// ─── Compression gzip (réduit de 70-85% la taille des réponses JSON/HTML) ────
app.use(compression());

// ─── Sécurité HTTP (Helmet) ───────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:', 'http:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", process.env.CLIENT_ORIGIN],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [process.env.CLIENT_ORIGIN || 'http://localhost:5173'];
const isDev = process.env.NODE_ENV !== 'production';

app.use(
  cors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (ex: Postman, mobile apps)
      if (!origin) return callback(null, true);
      // En développement : autoriser tous les ports localhost (5173, 5174, 3000, etc.)
      if (isDev && /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
      // En production : uniquement l'origine configurée
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Origine non autorisée par CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Fichiers statiques (uploads) ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ─── Parsers ──────────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Protection CSRF : validation Origin sur les mutations ───────────────────
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.origin;
    // En développement, autoriser les requêtes sans origin (Postman)
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Origine non autorisée' },
      });
    }
  }
  next();
});

// ─── Rate Limiting global ─────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Trop de requêtes, réessayez dans 1 minute' },
  },
});

// Rate limiters spécifiques aux endpoints sensibles
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Trop de tentatives de connexion, réessayez dans 1 minute' },
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Trop de tentatives d\'inscription, réessayez dans 1 minute' },
  },
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Trop de requêtes de rafraîchissement' },
  },
});

const promoLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Trop de tentatives de validation de code promo' },
  },
});

app.use('/api/', globalLimiter);

// ─── Images uploadées (BLOB SQLite, public, mise en cache 1 an) ───────────────
app.get('/api/images/:id', (req, res, next) => {
  try {
    const { getDb } = require('./src/db/database');
    const blob = getDb().prepare('SELECT mime_type, data FROM image_blobs WHERE id = ?').get(req.params.id);
    if (!blob) return res.status(404).end();
    res.set('Content-Type', blob.mime_type);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(Buffer.from(blob.data));
  } catch (err) { next(err); }
});

// ─── Routes API ───────────────────────────────────────────────────────────────
// Appliquer les rate limiters spécifiques avant les routers
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/refresh', refreshLimiter);
app.use('/api/promotions/validate', promoLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vehicle', vehicleRoutes);
app.use('/api/payments', paymentsRoutes);

// Route publique hero slides
app.get('/api/settings/hero', (_req, res, next) => {
  try {
    const { getDb } = require('./src/db/database');
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'hero_slides'").get();
    res.json({ slides: row ? JSON.parse(row.value) : [] });
  } catch (err) { next(err); }
});

// Routes publiques pages informations
app.get('/api/pages', (_req, res, next) => {
  try {
    const { getDb } = require('./src/db/database');
    const db = getDb();
    const pages = db.prepare('SELECT id, slug, title, updated_at FROM pages ORDER BY id ASC').all();
    res.json({ pages });
  } catch (err) { next(err); }
});

app.get('/api/pages/:slug', (req, res, next) => {
  try {
    const { getDb } = require('./src/db/database');
    const db = getDb();
    const page = db.prepare('SELECT * FROM pages WHERE slug = ?').get(req.params.slug);
    if (!page) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Page introuvable' } });
    res.json({ page });
  } catch (err) { next(err); }
});

// Route publique paiement settings
app.get('/api/settings/payment', (_req, res, next) => {
  try {
    const { getDb } = require('./src/db/database');
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'payment_settings'").get();
    const defaults = { wave_number: '', orange_money_number: '' };
    res.json({ payment: row ? { ...defaults, ...JSON.parse(row.value) } : defaults });
  } catch (err) { next(err); }
});

// Route publique footer settings
app.get('/api/settings/footer', (_req, res, next) => {
  try {
    const { getDb } = require('./src/db/database');
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'footer'").get();
    res.json({ footer: row ? JSON.parse(row.value) : {} });
  } catch (err) { next(err); }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── Frontend React (production uniquement) ───────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');

  // Assets avec hash (JS, CSS, images) → cache 1 an immuable
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    immutable: true,
  }));

  // Autres fichiers statiques (favicon, logo...) → cache 1 heure
  app.use(express.static(distPath, {
    maxAge: '1h',
    index: false,
  }));

  // Toutes les routes React → index.html sans cache (SPA)
  app.get('*', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── Gestionnaire d'erreurs global (doit être en dernier) ────────────────────
app.use(errorHandler);

// ─── Initialisation BDD et démarrage ─────────────────────────────────────────
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚗 DVA API démarré sur http://localhost:${PORT}`);
      console.log(`📦 Environnement : ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 CORS autorisé pour : ${allowedOrigins.join(', ')}\n`);
    });
  })
  .catch((err) => {
    console.error('❌ Échec d\'initialisation de la base de données :', err);
    process.exit(1);
  });

module.exports = app;
