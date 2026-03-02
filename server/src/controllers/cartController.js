/**
 * DVA - Contrôleur panier
 */
const { getDb } = require('../db/database');

const CART_ITEM_SQL = `
  SELECT ci.id, ci.quantity,
         p.id AS product_id, p.name, p.slug, p.price, p.original_price, p.stock,
         (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image_url,
         b.name AS brand_name
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
  JOIN brands b ON b.id = p.brand_id
  WHERE ci.user_id = ?
  ORDER BY ci.id ASC
`;

/**
 * GET /api/cart
 */
function getCart(req, res, next) {
  try {
    const items = getDb().prepare(CART_ITEM_SQL).all(req.user.id);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return res.json({ items, total: Math.round(total * 100) / 100 });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/cart/items
 */
function addItem(req, res, next) {
  try {
    const db = getDb();
    const { product_id, quantity = 1 } = req.body;
    const qty = Math.max(1, parseInt(quantity));

    // Vérifier que le produit existe et est en stock
    const product = db.prepare('SELECT id, stock FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Produit introuvable' } });
    }

    // Vérifier le stock disponible
    const existing = db.prepare('SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?')
      .get(req.user.id, product_id);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty + qty > product.stock) {
      return res.status(400).json({
        error: { code: 'INSUFFICIENT_STOCK', message: `Stock insuffisant (disponible : ${product.stock})` },
      });
    }

    // Insérer ou mettre à jour (UPSERT)
    db.prepare(`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + excluded.quantity
    `).run(req.user.id, product_id, qty);

    const items = db.prepare(CART_ITEM_SQL).all(req.user.id);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return res.status(201).json({ items, total: Math.round(total * 100) / 100 });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/cart/items/:id
 */
function updateItem(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity);

    if (qty < 1) {
      return res.status(400).json({ error: { code: 'INVALID_QUANTITY', message: 'La quantité doit être >= 1' } });
    }

    // Vérifier que la ligne appartient à l'utilisateur
    const item = db.prepare('SELECT ci.*, p.stock FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.id = ? AND ci.user_id = ?')
      .get(id, req.user.id);

    if (!item) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ligne panier introuvable' } });
    }

    if (qty > item.stock) {
      return res.status(400).json({
        error: { code: 'INSUFFICIENT_STOCK', message: `Stock insuffisant (disponible : ${item.stock})` },
      });
    }

    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?').run(qty, id, req.user.id);

    const items = db.prepare(CART_ITEM_SQL).all(req.user.id);
    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

    return res.json({ items, total: Math.round(total * 100) / 100 });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/cart/items/:id
 */
function removeItem(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;

    db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(id, req.user.id);

    const items = db.prepare(CART_ITEM_SQL).all(req.user.id);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return res.json({ items, total: Math.round(total * 100) / 100 });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/cart
 */
function clearCart(req, res, next) {
  try {
    getDb().prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/cart/merge
 * Fusionne le panier invité (localStorage) dans le panier BDD après connexion
 * Utilise MAX(qty, excluded.qty) pour ne pas écraser des quantités supérieures déjà en BDD
 */
function mergeCart(req, res, next) {
  try {
    const db = getDb();
    const { items } = req.body;

    if (items && items.length > 0) {
      for (const item of items) {
        const productId = parseInt(item.product_id);
        const qty = Math.max(1, parseInt(item.quantity) || 1);
        if (!productId) continue;

        const product = db.prepare('SELECT id, stock FROM products WHERE id = ?').get(productId);
        if (!product) continue;

        const safeQty = Math.min(qty, product.stock);
        db.prepare(`
          INSERT INTO cart_items (user_id, product_id, quantity)
          VALUES (?, ?, ?)
          ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = MAX(quantity, excluded.quantity)
        `).run(req.user.id, productId, safeQty);
      }
    }

    const cartItems = db.prepare(CART_ITEM_SQL).all(req.user.id);
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return res.json({ items: cartItems, total: Math.round(total * 100) / 100 });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, mergeCart };
