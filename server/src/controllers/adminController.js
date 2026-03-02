/**
 * DVA - Contrôleur Admin
 * Dashboard stats, CRUD produits, gestion commandes/utilisateurs/avis/promotions
 */
const { getDb } = require('../db/database');
const { invalidateCache } = require('../middleware/cache');

// ─── DASHBOARD ─────────────────────────────────────────────────────────────

function getStats(req, res, next) {
  try {
    const db = getDb();

    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) AS v FROM orders WHERE status != 'cancelled'").get().v;
    const totalOrders = db.prepare('SELECT COUNT(*) AS v FROM orders').get().v;
    const totalUsers = db.prepare('SELECT COUNT(*) AS v FROM users WHERE role = ?').get('client').v;
    const totalProducts = db.prepare('SELECT COUNT(*) AS v FROM products').get().v;

    // Commandes des 30 derniers jours groupées par jour
    const revenueByDay = db.prepare(`
      SELECT DATE(created_at) AS day, COUNT(*) AS orders, SUM(total_amount) AS revenue
      FROM orders
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `).all();

    // Top 5 produits les plus vendus
    const topProducts = db.prepare(`
      SELECT p.name, SUM(oi.quantity) AS qty_sold, SUM(oi.quantity * oi.unit_price) AS revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      GROUP BY oi.product_id
      ORDER BY qty_sold DESC
      LIMIT 5
    `).all();

    // Répartition des statuts
    const ordersByStatus = db.prepare(
      "SELECT status, COUNT(*) AS count FROM orders GROUP BY status"
    ).all();

    // 5 dernières commandes
    const recentOrders = db.prepare(`
      SELECT o.id, o.status, o.total_amount, o.created_at,
             u.first_name, u.last_name, u.email
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 5
    `).all();

    res.json({
      stats: { totalRevenue, totalOrders, totalUsers, totalProducts },
      revenueByDay,
      topProducts,
      ordersByStatus,
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
}

// ─── PRODUITS ──────────────────────────────────────────────────────────────

function getAdminProducts(req, res, next) {
  try {
    const db = getDb();
    const { page = 1, limit = 20, q = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = '';
    const params = [];
    if (q) {
      where = 'WHERE p.name LIKE ? OR p.sku LIKE ?';
      params.push(`%${q}%`, `%${q}%`);
    }

    const total = db.prepare(`SELECT COUNT(*) AS c FROM products p ${where}`).get(...params).c;
    const products = db.prepare(`
      SELECT p.*, c.name AS category_name, b.name AS brand_name,
             (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image_url
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN brands b ON b.id = p.brand_id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({ products, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    next(err);
  }
}

function createProduct(req, res, next) {
  try {
    const db = getDb();
    const { name, slug, description, short_description, price, original_price, stock, category_id, brand_id, sku, weight, is_featured } = req.body;

    // Vérifier que le slug est unique
    const existing = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
    if (existing) {
      return res.status(409).json({ error: { code: 'SLUG_TAKEN', message: 'Ce slug est déjà utilisé' } });
    }

    // brand_id optionnel : utiliser le premier disponible par défaut
    const resolvedBrandId = brand_id ? parseInt(brand_id) : (db.prepare('SELECT id FROM brands ORDER BY id ASC LIMIT 1').get()?.id || 1);

    const result = db.prepare(`
      INSERT INTO products (name, slug, description, short_description, price, original_price, stock, category_id, brand_id, sku, weight, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, slug, description || null, short_description || null, parseFloat(price), original_price ? parseFloat(original_price) : null,
      parseInt(stock || 0), parseInt(category_id), resolvedBrandId, sku || null, weight ? parseFloat(weight) : null, is_featured ? 1 : 0);

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

function updateProduct(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, slug, description, short_description, price, original_price, stock, category_id, brand_id, sku, weight, is_featured } = req.body;

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Produit introuvable' } });

    // Vérifier slug unique (sauf pour ce produit)
    const slugConflict = db.prepare('SELECT id FROM products WHERE slug = ? AND id != ?').get(slug, id);
    if (slugConflict) return res.status(409).json({ error: { code: 'SLUG_TAKEN', message: 'Ce slug est déjà utilisé' } });

    // brand_id optionnel : conserver l'existant si non fourni
    const resolvedBrandId = brand_id ? parseInt(brand_id) : (db.prepare('SELECT brand_id FROM products WHERE id = ?').get(id)?.brand_id || 1);

    db.prepare(`
      UPDATE products SET name=?, slug=?, description=?, short_description=?, price=?, original_price=?,
      stock=?, category_id=?, brand_id=?, sku=?, weight=?, is_featured=?
      WHERE id=?
    `).run(name, slug, description || null, short_description || null, parseFloat(price),
      original_price ? parseFloat(original_price) : null, parseInt(stock || 0),
      parseInt(category_id), resolvedBrandId, sku || null, weight ? parseFloat(weight) : null,
      is_featured ? 1 : 0, id);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json({ product: updated });
  } catch (err) {
    next(err);
  }
}

function deleteProduct(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Produit introuvable' } });

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

function toggleFeatured(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const product = db.prepare('SELECT id, is_featured FROM products WHERE id = ?').get(id);
    if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Produit introuvable' } });
    db.prepare('UPDATE products SET is_featured = ? WHERE id = ?').run(product.is_featured ? 0 : 1, id);
    res.json({ is_featured: !product.is_featured });
  } catch (err) {
    next(err);
  }
}

// ─── COMMANDES ─────────────────────────────────────────────────────────────

function getAdminOrders(req, res, next) {
  try {
    const db = getDb();
    const { page = 1, limit = 20, status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = '';
    const params = [];
    if (status) { where = 'WHERE o.status = ?'; params.push(status); }

    const total = db.prepare(`SELECT COUNT(*) AS c FROM orders o ${where}`).get(...params).c;
    const orders = db.prepare(`
      SELECT o.id, o.status, o.total_amount, o.shipping_amount, o.payment_method,
             o.payment_status, o.created_at,
             u.first_name, u.last_name, u.email,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ${where}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({ orders, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    next(err);
  }
}

function updateOrderStatus(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status } = req.body;

    const VALID = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!VALID.includes(status)) {
      return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Statut invalide' } });
    }

    const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Commande introuvable' } });

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    res.json({ message: 'Statut mis à jour', status });
  } catch (err) {
    next(err);
  }
}

// ─── UTILISATEURS ──────────────────────────────────────────────────────────

function getAdminUsers(req, res, next) {
  try {
    const db = getDb();
    const { page = 1, limit = 20, q = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = '';
    const params = [];
    if (q) {
      where = 'WHERE email LIKE ? OR first_name LIKE ? OR last_name LIKE ?';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const total = db.prepare(`SELECT COUNT(*) AS c FROM users ${where}`).get(...params).c;
    const users = db.prepare(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.created_at,
             COUNT(DISTINCT o.id) AS order_count,
             COALESCE(SUM(o.total_amount), 0) AS total_spent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      ${where}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({ users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    next(err);
  }
}

function updateUserRole(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { role } = req.body;

    if (!['client', 'admin'].includes(role)) {
      return res.status(400).json({ error: { code: 'INVALID_ROLE', message: 'Rôle invalide' } });
    }

    // Ne pas permettre à un admin de rétrograder son propre compte
    if (parseInt(id) === req.user.id && role === 'client') {
      return res.status(400).json({ error: { code: 'SELF_DEMOTION', message: 'Impossible de rétrograder votre propre compte' } });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    res.json({ message: 'Rôle mis à jour', role });
  } catch (err) {
    next(err);
  }
}

// ─── AVIS ──────────────────────────────────────────────────────────────────

function getAdminReviews(req, res, next) {
  try {
    const db = getDb();
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const total = db.prepare('SELECT COUNT(*) AS c FROM reviews').get().c;
    const reviews = db.prepare(`
      SELECT r.*, p.name AS product_name, p.slug AS product_slug,
             u.first_name, u.last_name, u.email
      FROM reviews r
      JOIN products p ON p.id = r.product_id
      JOIN users u ON u.id = r.user_id
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), offset);

    res.json({ reviews, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    next(err);
  }
}

function deleteReview(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const review = db.prepare('SELECT id FROM reviews WHERE id = ?').get(id);
    if (!review) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Avis introuvable' } });
    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ─── PROMOTIONS ────────────────────────────────────────────────────────────

function getAdminPromotions(req, res, next) {
  try {
    const db = getDb();
    const promotions = db.prepare('SELECT * FROM promotions ORDER BY id DESC').all();
    res.json({ promotions });
  } catch (err) {
    next(err);
  }
}

function createPromotion(req, res, next) {
  try {
    const db = getDb();
    const { code, name, discount_type, discount_value, min_order_amount, max_uses, starts_at, expires_at, is_active } = req.body;

    if (code) {
      const existing = db.prepare('SELECT id FROM promotions WHERE code = ?').get(code.toUpperCase());
      if (existing) return res.status(409).json({ error: { code: 'CODE_TAKEN', message: 'Ce code promo existe déjà' } });
    }

    const result = db.prepare(`
      INSERT INTO promotions (code, name, discount_type, discount_value, min_order_amount, max_uses, starts_at, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code ? code.toUpperCase() : null, name, discount_type, parseFloat(discount_value),
      parseFloat(min_order_amount || 0), max_uses ? parseInt(max_uses) : null,
      starts_at || null, expires_at || null, is_active !== false ? 1 : 0
    );

    const promo = db.prepare('SELECT * FROM promotions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ promotion: promo });
  } catch (err) {
    next(err);
  }
}

function updatePromotion(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { code, name, discount_type, discount_value, min_order_amount, max_uses, starts_at, expires_at, is_active } = req.body;

    const existing = db.prepare('SELECT id FROM promotions WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Promotion introuvable' } });

    if (code) {
      const conflict = db.prepare('SELECT id FROM promotions WHERE code = ? AND id != ?').get(code.toUpperCase(), id);
      if (conflict) return res.status(409).json({ error: { code: 'CODE_TAKEN', message: 'Ce code promo existe déjà' } });
    }

    db.prepare(`
      UPDATE promotions SET code=?, name=?, discount_type=?, discount_value=?, min_order_amount=?,
      max_uses=?, starts_at=?, expires_at=?, is_active=? WHERE id=?
    `).run(
      code ? code.toUpperCase() : null, name, discount_type, parseFloat(discount_value),
      parseFloat(min_order_amount || 0), max_uses ? parseInt(max_uses) : null,
      starts_at || null, expires_at || null, is_active !== false ? 1 : 0, id
    );

    const updated = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id);
    res.json({ promotion: updated });
  } catch (err) {
    next(err);
  }
}

function deletePromotion(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const promo = db.prepare('SELECT id FROM promotions WHERE id = ?').get(id);
    if (!promo) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Promotion introuvable' } });
    db.prepare('DELETE FROM promotions WHERE id = ?').run(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ─── DÉTAIL COMMANDE ADMIN ─────────────────────────────────────────────────

function getAdminOrderDetails(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const order = db.prepare(`
      SELECT o.*, u.first_name, u.last_name, u.email, u.phone AS user_phone
      FROM orders o LEFT JOIN users u ON u.id = o.user_id
      WHERE o.id = ?
    `).get(id);
    if (!order) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Commande introuvable' } });
    const items = db.prepare(`
      SELECT oi.*,
        (SELECT url FROM product_images WHERE product_id = oi.product_id AND is_primary = 1 LIMIT 1) AS image_url
      FROM order_items oi WHERE oi.order_id = ?
    `).all(id);
    res.json({ order: { ...order, shipping_address: JSON.parse(order.shipping_address || '{}'), items } });
  } catch (err) { next(err); }
}

// ─── IMAGES / SPECS / COMPAT PRODUIT ──────────────────────────────────────

function getProductDetails(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Produit introuvable' } });
    const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC').all(id);
    const specs = db.prepare('SELECT * FROM product_specs WHERE product_id = ?').all(id);
    const compat = db.prepare('SELECT * FROM vehicle_compatibility WHERE product_id = ?').all(id);
    res.json({ product, images, specs, compat });
  } catch (err) { next(err); }
}

function addProductImage(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { url, alt_text, is_primary } = req.body;
    if (!url) return res.status(400).json({ error: { code: 'MISSING_URL', message: 'URL requise' } });
    if (is_primary) db.prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = ?').run(id);
    const sortOrder = (db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM product_images WHERE product_id = ?').get(id).m) + 1;
    const result = db.prepare('INSERT INTO product_images (product_id, url, alt_text, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)').run(id, url, alt_text || null, is_primary ? 1 : 0, sortOrder);
    res.status(201).json({ image: db.prepare('SELECT * FROM product_images WHERE id = ?').get(result.lastInsertRowid) });
  } catch (err) { next(err); }
}

function deleteProductImage(req, res, next) {
  try {
    const db = getDb();
    const { imageId } = req.params;
    db.prepare('DELETE FROM product_images WHERE id = ?').run(imageId);
    res.status(204).send();
  } catch (err) { next(err); }
}

function addProductSpec(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { spec_key, spec_value } = req.body;
    if (!spec_key || !spec_value) return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Clé et valeur requises' } });
    const result = db.prepare('INSERT INTO product_specs (product_id, spec_key, spec_value) VALUES (?, ?, ?)').run(id, spec_key, spec_value);
    res.status(201).json({ spec: db.prepare('SELECT * FROM product_specs WHERE id = ?').get(result.lastInsertRowid) });
  } catch (err) { next(err); }
}

function deleteProductSpec(req, res, next) {
  try {
    const db = getDb();
    db.prepare('DELETE FROM product_specs WHERE id = ?').run(req.params.specId);
    res.status(204).send();
  } catch (err) { next(err); }
}

function addProductCompat(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { make, model, year_from, year_to, engine } = req.body;
    if (!make || !model) return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Marque et modèle requis' } });
    const result = db.prepare('INSERT INTO vehicle_compatibility (product_id, make, model, year_from, year_to, engine) VALUES (?, ?, ?, ?, ?, ?)').run(id, make, model, year_from || null, year_to || null, engine || null);
    res.status(201).json({ compat: db.prepare('SELECT * FROM vehicle_compatibility WHERE id = ?').get(result.lastInsertRowid) });
  } catch (err) { next(err); }
}

function deleteProductCompat(req, res, next) {
  try {
    const db = getDb();
    db.prepare('DELETE FROM vehicle_compatibility WHERE id = ?').run(req.params.compatId);
    res.status(204).send();
  } catch (err) { next(err); }
}

// ─── CATÉGORIES & MARQUES ──────────────────────────────────────────────────

function createCategory(req, res, next) {
  try {
    const db = getDb();
    const { name, slug, description, icon } = req.body;
    const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
    if (existing) return res.status(409).json({ error: { code: 'SLUG_TAKEN', message: 'Ce slug existe déjà' } });
    const result = db.prepare('INSERT INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)').run(name, slug, description || null, icon || null);
    const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    invalidateCache('categories');
    res.status(201).json({ category: cat });
  } catch (err) { next(err); }
}

function updateCategory(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, slug, description, icon } = req.body;
    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Catégorie introuvable' } });
    const conflict = db.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').get(slug, id);
    if (conflict) return res.status(409).json({ error: { code: 'SLUG_TAKEN', message: 'Ce slug existe déjà' } });
    db.prepare('UPDATE categories SET name=?, slug=?, description=?, icon=? WHERE id=?').run(name, slug, description || null, icon || null, id);
    invalidateCache('categories');
    res.json({ category: db.prepare('SELECT * FROM categories WHERE id = ?').get(id) });
  } catch (err) { next(err); }
}

function deleteCategory(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const withProducts = req.query.withProducts === 'true';
    const hasProducts = db.prepare('SELECT COUNT(*) AS c FROM products WHERE category_id = ?').get(id).c;
    if (hasProducts > 0 && !withProducts) {
      return res.status(400).json({ error: { code: 'HAS_PRODUCTS', message: `Cette catégorie contient ${hasProducts} produit(s). Confirmez la suppression avec les produits.` } });
    }
    if (withProducts) {
      db.prepare('DELETE FROM products WHERE category_id = ?').run(id);
    }
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    invalidateCache('categories');
    res.status(204).send();
  } catch (err) { next(err); }
}

function getHeroSlides(req, res, next) {
  try {
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'hero_slides'").get();
    res.json({ slides: row ? JSON.parse(row.value) : [] });
  } catch (err) { next(err); }
}

function updateHeroSlides(req, res, next) {
  try {
    const db = getDb();
    const { slides } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('hero_slides', ?)").run(JSON.stringify(slides));
    res.json({ slides });
  } catch (err) { next(err); }
}

function getFooterSettings(req, res, next) {
  try {
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'footer'").get();
    res.json({ footer: row ? JSON.parse(row.value) : {} });
  } catch (err) { next(err); }
}

function updateFooterSettings(req, res, next) {
  try {
    const db = getDb();
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('footer', ?)").run(JSON.stringify(req.body));
    res.json({ footer: req.body });
  } catch (err) { next(err); }
}

function getPaymentSettings(req, res, next) {
  try {
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'payment_settings'").get();
    const defaults = { wave_number: '', orange_money_number: '' };
    res.json({ payment: row ? { ...defaults, ...JSON.parse(row.value) } : defaults });
  } catch (err) { next(err); }
}

function updatePaymentSettings(req, res, next) {
  try {
    const db = getDb();
    const { wave_number, orange_money_number } = req.body;
    const data = { wave_number: wave_number || '', orange_money_number: orange_money_number || '' };
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('payment_settings', ?)").run(JSON.stringify(data));
    res.json({ payment: data });
  } catch (err) { next(err); }
}

function createBrand(req, res, next) {
  try {
    const db = getDb();
    const { name, slug, logo_url } = req.body;
    const existing = db.prepare('SELECT id FROM brands WHERE slug = ?').get(slug);
    if (existing) return res.status(409).json({ error: { code: 'SLUG_TAKEN', message: 'Ce slug existe déjà' } });
    const result = db.prepare('INSERT INTO brands (name, slug, logo_url) VALUES (?, ?, ?)').run(name, slug, logo_url || null);
    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ brand });
  } catch (err) { next(err); }
}

function updateBrand(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, slug, logo_url } = req.body;
    const existing = db.prepare('SELECT id FROM brands WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Marque introuvable' } });
    const conflict = db.prepare('SELECT id FROM brands WHERE slug = ? AND id != ?').get(slug, id);
    if (conflict) return res.status(409).json({ error: { code: 'SLUG_TAKEN', message: 'Ce slug existe déjà' } });
    db.prepare('UPDATE brands SET name=?, slug=?, logo_url=? WHERE id=?').run(name, slug, logo_url || null, id);
    res.json({ brand: db.prepare('SELECT * FROM brands WHERE id = ?').get(id) });
  } catch (err) { next(err); }
}

function deleteBrand(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const hasProducts = db.prepare('SELECT COUNT(*) AS c FROM products WHERE brand_id = ?').get(id).c;
    if (hasProducts > 0) return res.status(400).json({ error: { code: 'HAS_PRODUCTS', message: `Impossible : ${hasProducts} produit(s) utilisent cette marque` } });
    db.prepare('DELETE FROM brands WHERE id = ?').run(id);
    res.status(204).send();
  } catch (err) { next(err); }
}

// ─── PAGES INFORMATIONS ────────────────────────────────────────────────────

function getAdminPages(req, res, next) {
  try {
    const db = getDb();
    const pages = db.prepare('SELECT * FROM pages ORDER BY id ASC').all();
    res.json({ pages });
  } catch (err) { next(err); }
}

function updatePage(req, res, next) {
  try {
    const db = getDb();
    const { slug } = req.params;
    const { title, content } = req.body;
    const existing = db.prepare('SELECT id FROM pages WHERE slug = ?').get(slug);
    if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Page introuvable' } });
    db.prepare('UPDATE pages SET title=?, content=?, updated_at=CURRENT_TIMESTAMP WHERE slug=?').run(title, content, slug);
    const page = db.prepare('SELECT * FROM pages WHERE slug = ?').get(slug);
    res.json({ page });
  } catch (err) { next(err); }
}

// ─── EXPORT CSV ────────────────────────────────────────────────────────────

function toCSV(rows, columns) {
  const header = columns.map((c) => `"${c.label}"`).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => {
      const val = row[c.key] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [header, ...lines].join('\r\n');
}

function exportProducts(req, res, next) {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT p.id, p.name, p.sku, p.price, p.original_price, p.stock, c.name AS category, b.name AS brand, p.is_featured, p.created_at
      FROM products p JOIN categories c ON c.id = p.category_id JOIN brands b ON b.id = p.brand_id
      ORDER BY p.id ASC
    `).all();
    const csv = toCSV(rows, [
      { key: 'id', label: 'ID' }, { key: 'name', label: 'Nom' }, { key: 'sku', label: 'SKU' },
      { key: 'price', label: 'Prix (FCFA)' }, { key: 'original_price', label: 'Prix barré (FCFA)' },
      { key: 'stock', label: 'Stock' }, { key: 'category', label: 'Catégorie' },
      { key: 'brand', label: 'Marque' }, { key: 'is_featured', label: 'Vedette' }, { key: 'created_at', label: 'Créé le' },
    ]);
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="produits.csv"');
    res.send('\uFEFF' + csv);
  } catch (err) { next(err); }
}

function exportOrders(req, res, next) {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT o.id, o.status, o.total_amount, o.shipping_amount, o.payment_method, o.payment_status,
             u.first_name, u.last_name, u.email, o.created_at
      FROM orders o LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.id ASC
    `).all();
    const csv = toCSV(rows, [
      { key: 'id', label: 'N° Commande' }, { key: 'status', label: 'Statut' },
      { key: 'total_amount', label: 'Total (FCFA)' }, { key: 'shipping_amount', label: 'Livraison (FCFA)' },
      { key: 'payment_method', label: 'Paiement' }, { key: 'payment_status', label: 'Statut paiement' },
      { key: 'first_name', label: 'Prénom' }, { key: 'last_name', label: 'Nom' },
      { key: 'email', label: 'Email' }, { key: 'created_at', label: 'Date' },
    ]);
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="commandes.csv"');
    res.send('\uFEFF' + csv);
  } catch (err) { next(err); }
}

function exportUsers(req, res, next) {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role,
             COUNT(o.id) AS orders, COALESCE(SUM(o.total_amount), 0) AS total_spent, u.created_at
      FROM users u LEFT JOIN orders o ON o.user_id = u.id
      GROUP BY u.id ORDER BY u.id ASC
    `).all();
    const csv = toCSV(rows, [
      { key: 'id', label: 'ID' }, { key: 'email', label: 'Email' },
      { key: 'first_name', label: 'Prénom' }, { key: 'last_name', label: 'Nom' },
      { key: 'phone', label: 'Téléphone' }, { key: 'role', label: 'Rôle' },
      { key: 'orders', label: 'Nb commandes' }, { key: 'total_spent', label: 'Total dépensé (FCFA)' },
      { key: 'created_at', label: 'Inscrit le' },
    ]);
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="utilisateurs.csv"');
    res.send('\uFEFF' + csv);
  } catch (err) { next(err); }
}

module.exports = {
  getStats,
  getAdminProducts, createProduct, updateProduct, deleteProduct, toggleFeatured,
  getProductDetails, addProductImage, deleteProductImage,
  addProductSpec, deleteProductSpec,
  addProductCompat, deleteProductCompat,
  getAdminOrders, updateOrderStatus, getAdminOrderDetails,
  getAdminUsers, updateUserRole,
  getAdminReviews, deleteReview,
  getAdminPromotions, createPromotion, updatePromotion, deletePromotion,
  createCategory, updateCategory, deleteCategory,
  createBrand, updateBrand, deleteBrand,
  exportProducts, exportOrders, exportUsers,
  getFooterSettings, updateFooterSettings,
  getHeroSlides, updateHeroSlides,
  getAdminPages, updatePage,
  getPaymentSettings, updatePaymentSettings,
};
