/**
 * DVA E-Commerce - Serveur Express.js principal
 * Configuration : sécurité, CORS, rate limiting, routes API
 */
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { initDatabase } = require('./src/db/database');
const authRoutes = require('./src/routes/auth');
const productsRoutes = require('./src/routes/products');
const categoriesRoutes = require('./src/routes/categories');
const cartRoutes = require('./src/routes/cart');
const ordersRoutes = require('./src/routes/orders');
const accountRoutes = require('./src/routes/account');
const reviewsRoutes = require('./src/routes/reviews');
const promotionsRoutes = require('./src/routes/promotions');
const adminRoutes = require('./src/routes/admin');
const vehicleRoutes = require('./src/routes/vehicle');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Sécurité HTTP (Helmet) ───────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://picsum.photos', 'https://images.unsplash.com'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: [ "'self'",process.env.CLIENT_ORIGIN],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [process.env.CLIENT_ORIGIN || 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (ex: Postman, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origine non autorisée par CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

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

// ─── Routes API ───────────────────────────────────────────────────────────────
// Appliquer les rate limiters spécifiques avant les routers
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/refresh', refreshLimiter);
app.use('/api/promotions/validate', promoLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vehicle', vehicleRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

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
