/**
 * DVA - Contrôleur avis clients
 */
const { getDb } = require('../db/database');

/**
 * GET /api/reviews/:slug  — Avis d'un produit
 */
function getProductReviews(req, res, next) {
  try {
    const db = getDb();
    const { slug } = req.params;

    const product = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
    if (!product) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Produit introuvable' } });
    }

    const reviews = db.prepare(`
      SELECT r.id, r.rating, r.title, r.comment, r.is_verified, r.created_at,
             u.first_name, LEFT(u.last_name, 1) || '.' AS last_initial
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `).all(product.id);

    // SQLite ne supporte pas LEFT() — utiliser SUBSTR
    const reviewsSafe = db.prepare(`
      SELECT r.id, r.rating, r.title, r.comment, r.is_verified, r.created_at,
             u.first_name,
             SUBSTR(u.last_name, 1, 1) || '.' AS last_initial
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `).all(product.id);

    const stats = db.prepare(`
      SELECT AVG(rating) AS avg_rating, COUNT(*) AS total
      FROM reviews WHERE product_id = ?
    `).get(product.id);

    return res.json({ reviews: reviewsSafe, stats });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/reviews/:slug  — Poster un avis (acheteur vérifié)
 */
function createReview(req, res, next) {
  try {
    const db = getDb();
    const { slug } = req.params;
    const { rating, title, comment } = req.body;

    const product = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
    if (!product) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Produit introuvable' } });
    }

    // Vérifier achat vérifié
    const hasPurchased = db.prepare(`
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ?
    `).get(req.user.id, product.id);

    // Vérifier si déjà noté
    const existing = db.prepare(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?'
    ).get(product.id, req.user.id);

    if (existing) {
      return res.status(409).json({
        error: { code: 'ALREADY_REVIEWED', message: 'Vous avez déjà noté ce produit' },
      });
    }

    const result = db.prepare(`
      INSERT INTO reviews (product_id, user_id, rating, title, comment, is_verified)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(product.id, req.user.id, parseInt(rating), title?.trim() || null, comment?.trim() || null, hasPurchased ? 1 : 0);

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProductReviews, createReview };
