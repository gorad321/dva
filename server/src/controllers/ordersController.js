/**
 * DVA - Contrôleur commandes
 */
const { getDb } = require('../db/database');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const { initiatePayment } = require('../services/paymentService');

/**
 * POST /api/orders  — Créer une commande (checkout)
 */
async function createOrder(req, res, next) {
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
    const shippingAmount = 0; // Livraison gérée séparément après paiement
    const totalAmount = subtotal;

    // Statut selon méthode de paiement
    const isCashOnDelivery = payment_method === 'cash_on_delivery';
    const isMobilePay = payment_method === 'wave' || payment_method === 'orange_money';
    const orderStatus = (isCashOnDelivery || isMobilePay) ? 'pending' : 'confirmed';
    const paymentStatus = (isCashOnDelivery || isMobilePay) ? 'pending' : 'paid';

    // Créer la commande dans une transaction manuelle (node:sqlite n'a pas .transaction())
    let orderId;
    db.exec('BEGIN');
    try {
      const orderResult = db.prepare(`
        INSERT INTO orders (user_id, status, total_amount, shipping_amount, shipping_address, payment_method, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.user.id,
        orderStatus,
        Math.round(totalAmount * 100) / 100,
        shippingAmount,
        JSON.stringify(shipping_address),
        payment_method,
        paymentStatus
      );
      orderId = orderResult.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const item of cartItems) {
        insertItem.run(orderId, item.product_id, item.name, item.quantity, item.price);
        db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id);
      }

      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    // Envoyer email de confirmation (non bloquant)
    sendOrderConfirmationEmail(req.user.email, req.user.first_name, { ...order, items }).catch(() => {});

    // Initier le paiement mobile (Wave / Orange Money) via PayTech
    let paymentUrl = null;
    if (isMobilePay) {
      try {
        const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
        const result = await initiatePayment({ amount: totalAmount, orderId, apiUrl });
        if (result?.paymentUrl) {
          paymentUrl = result.paymentUrl;
          // Stocker le token PayTech pour identifier la commande au retour (webhook / redirect)
          if (result.token) {
            db.prepare('UPDATE orders SET payment_token = ? WHERE id = ?').run(result.token, orderId);
          }
        }
      } catch (payErr) {
        console.error('Erreur initiation paiement:', payErr.message);
        // Ne pas bloquer — la commande est créée, l'admin peut traiter manuellement
      }
    }

    return res.status(201).json({ order: { ...order, items }, payment_url: paymentUrl });
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
