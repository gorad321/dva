/**
 * DVA - Contrôleur commandes
 */
const { getDb } = require('../db/database');
const { sendOrderConfirmationEmail } = require('../services/emailService');

/**
 * POST /api/orders  — Créer une commande (checkout)
 */
function createOrder(req, res, next) {
  try {
    const db = getDb();
    const { shipping_address, payment_method = 'card' } = req.body;

    // Récupérer le panier
    const cartItems = db.prepare(`
      SELECT ci.quantity, p.id AS product_id, p.name, p.price, p.stock
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.user_id = ?
    `).all(req.user.id);

    if (cartItems.length === 0) {
      return res.status(400).json({
        error: { code: 'EMPTY_CART', message: 'Le panier est vide' },
      });
    }

    // Vérifier le stock pour chaque produit
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        return res.status(400).json({
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Stock insuffisant pour "${item.name}" (disponible : ${item.stock})`,
          },
        });
      }
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingAmount = subtotal >= 25000 ? 0 : 2500; // Livraison gratuite dès 25 000 F CFA
    const totalAmount = subtotal + shippingAmount;

    // Créer la commande dans une transaction (atomique)
    const createOrderTx = db.transaction(() => {
      // Insérer la commande
      const orderResult = db.prepare(`
        INSERT INTO orders (user_id, status, total_amount, shipping_amount, shipping_address, payment_method, payment_status)
        VALUES (?, 'confirmed', ?, ?, ?, ?, 'paid')
      `).run(
        req.user.id,
        Math.round(totalAmount * 100) / 100,
        shippingAmount,
        JSON.stringify(shipping_address),
        payment_method
      );
      const orderId = orderResult.lastInsertRowid;

      // Insérer les lignes de commande
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const item of cartItems) {
        insertItem.run(orderId, item.product_id, item.name, item.quantity, item.price);
        // Décrémenter le stock
        db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id);
      }

      // Vider le panier
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);

      return orderId;
    });

    const orderId = createOrderTx();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    // Envoyer email de confirmation (non bloquant)
    sendOrderConfirmationEmail(req.user.email, req.user.first_name, { ...order, items }).catch(() => {});

    return res.status(201).json({ order: { ...order, items } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders  — Historique commandes
 */
function getOrders(req, res, next) {
  try {
    const db = getDb();
    const orders = db.prepare(`
      SELECT o.*,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.id);

    return res.json({ orders });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/:id  — Détail commande
 */
function getOrderById(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Commande introuvable' } });
    }

    const items = db.prepare(`
      SELECT oi.*,
             (SELECT url FROM product_images WHERE product_id = oi.product_id AND is_primary = 1 LIMIT 1) AS image_url
      FROM order_items oi WHERE oi.order_id = ?
    `).all(order.id);

    return res.json({
      order: {
        ...order,
        shipping_address: JSON.parse(order.shipping_address),
        items,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getOrders, getOrderById };
