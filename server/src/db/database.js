/**
 * DVA - Connexion et initialisation de la base de données SQLite
 * Utilise le module node:sqlite intégré à Node.js 22+ (aucune compilation native)
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

let db;

/**
 * Retourne l'instance de la base de données (doit être initialisée avant)
 */
function getDb() {
  if (!db) throw new Error('BDD non initialisée. Appelez initDatabase() d\'abord.');
  return db;
}

/**
 * Initialise la base de données : connexion, création des tables, seed si vide
 */
async function initDatabase() {
  const dbPath = path.join(__dirname, '../../../dva.db');

  db = new DatabaseSync(dbPath);

  // Mode WAL : meilleures performances en lecture/écriture simultanées
  db.exec('PRAGMA journal_mode = WAL');
  // Activer les clés étrangères (désactivées par défaut dans SQLite)
  db.exec('PRAGMA foreign_keys = ON');

  createTables();
  runMigrations();

  // Vérifier si la BDD est vide, et peupler si nécessaire
  const count = db.prepare('SELECT COUNT(*) as c FROM products').get();
  const { seedDatabase, seedPages } = require('./seed');
  if (count.c === 0) {
    seedDatabase(db);
    console.log('✅ Base de données peuplée avec les données d\'exemple');
  } else {
    // Seed des pages si absent (nouvelle fonctionnalité sur BDD existante)
    const pagesCount = db.prepare('SELECT COUNT(*) as c FROM pages').get();
    if (pagesCount.c === 0) seedPages(db);
  }

  console.log('✅ Base de données SQLite initialisée :', dbPath);
  return db;
}

/**
 * Création de toutes les tables et index
 */
function createTables() {
  db.exec(`
    -- ─── Utilisateurs ────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      first_name    TEXT    NOT NULL,
      last_name     TEXT    NOT NULL,
      phone         TEXT,
      role          TEXT    DEFAULT 'client' CHECK(role IN ('client', 'admin')),
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    -- ─── Tokens de réinitialisation de mot de passe ───────────────────────────
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT    NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used       INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_reset_tokens_hash ON password_reset_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);

    -- ─── Refresh tokens (sécurité JWT renforcée) ─────────────────────────────
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash  TEXT    NOT NULL UNIQUE,
      expires_at  DATETIME NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

    -- ─── Catégories ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS categories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      slug        TEXT UNIQUE NOT NULL,
      description TEXT,
      icon        TEXT,
      parent_id   INTEGER REFERENCES categories(id)
    );
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

    -- ─── Marques ─────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS brands (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);

    -- ─── Produits ─────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS products (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      name              TEXT    NOT NULL,
      slug              TEXT    UNIQUE NOT NULL,
      description       TEXT,
      short_description TEXT,
      price             REAL    NOT NULL,
      original_price    REAL,
      stock             INTEGER DEFAULT 0,
      category_id       INTEGER NOT NULL REFERENCES categories(id),
      brand_id          INTEGER NOT NULL REFERENCES brands(id),
      sku               TEXT    UNIQUE,
      weight            REAL,
      is_featured       INTEGER DEFAULT 0,
      created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_products_slug     ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_brand    ON products(brand_id);
    CREATE INDEX IF NOT EXISTS idx_products_price    ON products(price);
    CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
    CREATE INDEX IF NOT EXISTS idx_products_name     ON products(name);

    -- ─── Images produits ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS product_images (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      url         TEXT    NOT NULL,
      alt_text    TEXT,
      is_primary  INTEGER DEFAULT 0,
      sort_order  INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

    -- ─── Caractéristiques techniques ──────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS product_specs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      spec_key    TEXT NOT NULL,
      spec_value  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_product_specs_product ON product_specs(product_id);

    -- ─── Compatibilité véhicule ───────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS vehicle_compatibility (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      make        TEXT NOT NULL,
      model       TEXT NOT NULL,
      year_from   INTEGER,
      year_to     INTEGER,
      engine      TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_compat_product   ON vehicle_compatibility(product_id);
    CREATE INDEX IF NOT EXISTS idx_compat_make_model ON vehicle_compatibility(make, model);

    -- ─── Panier ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS cart_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
      product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity    INTEGER DEFAULT 1,
      UNIQUE(user_id, product_id)
    );
    CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

    -- ─── Commandes ────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS orders (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id          INTEGER REFERENCES users(id),
      status           TEXT    DEFAULT 'confirmed',
      total_amount     REAL    NOT NULL,
      shipping_amount  REAL    DEFAULT 0,
      shipping_address TEXT    NOT NULL,
      payment_method   TEXT,
      payment_status   TEXT    DEFAULT 'paid',
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

    -- ─── Lignes de commande ───────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS order_items (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id   INTEGER,
      product_name TEXT    NOT NULL,
      quantity     INTEGER NOT NULL,
      unit_price   REAL    NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

    -- ─── Avis clients ─────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS reviews (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id     INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
      rating      INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      title       TEXT,
      comment     TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

    -- ─── Promotions ───────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS promotions (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      code              TEXT UNIQUE,
      name              TEXT NOT NULL,
      discount_type     TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
      discount_value    REAL NOT NULL CHECK(discount_value > 0),
      min_order_amount  REAL DEFAULT 0,
      max_uses          INTEGER,
      used_count        INTEGER DEFAULT 0,
      starts_at         DATETIME,
      expires_at        DATETIME,
      is_active         INTEGER DEFAULT 1,
      applies_to        TEXT DEFAULT 'all'
    );
    CREATE INDEX IF NOT EXISTS idx_promotions_code   ON promotions(code);
    CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active, expires_at);

    -- ─── Pages informations (Mentions légales, CGV, etc.) ────────────────────
    CREATE TABLE IF NOT EXISTS pages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      slug       TEXT UNIQUE NOT NULL,
      title      TEXT NOT NULL,
      content    TEXT NOT NULL DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ─── Paramètres du site ───────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- ─── Images uploadées (BLOB en BDD, persiste sur Railway) ────────────────
    CREATE TABLE IF NOT EXISTS image_blobs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      mime_type  TEXT NOT NULL,
      data       BLOB NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Migrations : ajouts de colonnes sur BDD existante (idempotentes)
 */
function runMigrations() {
  // Ajouter colonne role si elle n'existe pas encore
  const cols = db.prepare("PRAGMA table_info(users)").all();
  const hasRole = cols.some((c) => c.name === 'role');
  if (!hasRole) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client'");
    console.log('✅ Migration : colonne role ajoutée à users');
  }
  // Index sur role (après migration éventuelle)
  try {
    db.exec("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)");
  } catch {}

  // Créer la table pages si elle n'existe pas (BDD existante sans cette table)
  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      slug       TEXT UNIQUE NOT NULL,
      title      TEXT NOT NULL,
      content    TEXT NOT NULL DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ajouter colonne payment_token si elle n'existe pas encore (intégration PayTech)
  const orderCols = db.prepare('PRAGMA table_info(orders)').all();
  const hasPaymentToken = orderCols.some((c) => c.name === 'payment_token');
  if (!hasPaymentToken) {
    db.exec('ALTER TABLE orders ADD COLUMN payment_token TEXT');
    try {
      db.exec('CREATE INDEX IF NOT EXISTS idx_orders_payment_token ON orders(payment_token)');
    } catch {}
    console.log('✅ Migration : colonne payment_token ajoutée à orders');
  }

  // Ajouter colonne logo_url sur brands (pour le bandeau défilant)
  const brandCols = db.prepare('PRAGMA table_info(brands)').all();
  if (!brandCols.some((c) => c.name === 'logo_url')) {
    db.exec('ALTER TABLE brands ADD COLUMN logo_url TEXT');
    console.log('✅ Migration : colonne logo_url ajoutée à brands');
  }

  // Colonnes pour commandes invité (guest checkout)
  const hasGuestEmail = orderCols.some((c) => c.name === 'guest_email');
  if (!hasGuestEmail) {
    db.exec('ALTER TABLE orders ADD COLUMN guest_email TEXT');
    console.log('✅ Migration : colonne guest_email ajoutée à orders');
  }
  const hasGuestToken = orderCols.some((c) => c.name === 'guest_token');
  if (!hasGuestToken) {
    db.exec('ALTER TABLE orders ADD COLUMN guest_token TEXT');
    try {
      db.exec('CREATE INDEX IF NOT EXISTS idx_orders_guest_token ON orders(guest_token)');
    } catch {}
    console.log('✅ Migration : colonne guest_token ajoutée à orders');
  }

  // Expiration paiement mobile (15 min), horodatage confirmation, compteur IPN
  if (!orderCols.some((c) => c.name === 'expires_at')) {
    db.exec('ALTER TABLE orders ADD COLUMN expires_at DATETIME');
    console.log('✅ Migration : colonne expires_at ajoutée à orders');
  }
  if (!orderCols.some((c) => c.name === 'paid_at')) {
    db.exec('ALTER TABLE orders ADD COLUMN paid_at DATETIME');
    console.log('✅ Migration : colonne paid_at ajoutée à orders');
  }
  if (!orderCols.some((c) => c.name === 'webhook_attempts')) {
    db.exec('ALTER TABLE orders ADD COLUMN webhook_attempts INTEGER DEFAULT 0');
    console.log('✅ Migration : colonne webhook_attempts ajoutée à orders');
  }

  // Remplacer les URLs picsum.photos (lentes/bloquées) par placehold.co (CDN Cloudflare)
  const picsumImages = db.prepare(
    "SELECT pi.id, p.name FROM product_images pi JOIN products p ON pi.product_id = p.id WHERE pi.url LIKE '%picsum.photos%'"
  ).all();
  if (picsumImages.length > 0) {
    const updateImg = db.prepare('UPDATE product_images SET url = ? WHERE id = ?');
    picsumImages.forEach(({ id, name }) => {
      const text = encodeURIComponent(name.substring(0, 24).replace(/\s+/g, '+'));
      updateImg.run(`https://placehold.co/600x400/E8EEF8/003DA5?text=${text}`, id);
    });
    console.log(`✅ Migration : ${picsumImages.length} URLs picsum.photos remplacées par placehold.co`);
  }
}

module.exports = { getDb, initDatabase };
