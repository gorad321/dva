/**
 * DVA - Contrôleur commandes
 * Supporte les commandes connectées et les commandes invité (guest checkout)
 */
const crypto = require('crypto');
const { getDb } = require('../db/database');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const { initiatePayment } = require('../services/paymentService');

/**
 * POST /api/orders  — Créer une commande (checkout connecté ou invité)
 */
async function createOrder(req, res, next) {
  try {
    const db = getDb();
    const { shipping_address, payment_method = 'card', guest_email, items: guestItems } = req.body;
    const isGuest = !req.user;

    // ── Récupérer les articles ──────────────────────────────────────────────
    let cartItems;
    if (isGuest) {
      // Invité : articles envoyés dans le body, prix re-lus depuis la BDD
      if (!guestItems || guestItems.length === 0) {
        return res.status(400).json({ error: { code: 'EMPTY_CART', message: 'Le panier est vide' } });
      }
      cartItems = [];
      for (const item of guestItems) {
        const productId = parseInt(item.product_id);
        if (!productId || productId <= 0 || isNaN(productId)) {
          return res.status(400).json({
            error: { code: 'INVALID_PRODUCT', message: 'Identifiant produit invalide dans le panier. Videz votre panier et réessayez.' },
          });
        }
        const product = db.prepare('SELECT id, name, price, stock FROM products WHERE id = ?').get(productId);
        if (!product) {
          return res.status(400).json({ error: { code: 'PRODUCT_NOT_FOUND', message: 'Produit introuvable' } });
        }
        const qty = Math.max(1, parseInt(item.quantity) || 1);
        cartItems.push({ product_id: product.id, name: product.name, price: product.price, stock: product.stock, quantity: qty });
      }
    } else {
      // Connecté : articles depuis le panier BDD
      cartItems = db.prepare(`
        SELECT ci.quantity, p.id AS product_id, p.name, p.price, p.stock
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = ?
      `).all(req.user.id);
    }

    if (cartItems.length === 0) {
      return res.status(400).json({ error: { code: 'EMPTY_CART', message: 'Le panier est vide' } });
    }

    // ── Vérifier le stock ───────────────────────────────────────────────────
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        return res.status(400).json({
          error: { code: 'INSUFFICIENT_STOCK', message: `Stock insuffisant pour "${item.name}" (disponible : ${item.stock})` },
        });
      }
    }

    const totalAmount = Math.round(cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;
    const shippingAmount = 0;

    const isCashOnDelivery = payment_method === 'cash_on_delivery';
    const isMobilePay = payment_method === 'wave' || payment_method === 'orange_money';
    const orderStatus = (isCashOnDelivery || isMobilePay) ? 'pending' : 'confirmed';
    const paymentStatus = (isCashOnDelivery || isMobilePay) ? 'pending' : 'paid';

    // Token sécurisé pour les invités (256 bits)
    const guestToken = isGuest ? crypto.randomBytes(32).toString('hex') : null;

    // ── Transaction ─────────────────────────────────────────────────────────
    let orderId;
    db.exec('BEGIN');
    try {
      const orderResult = db.prepare(`
        INSERT INTO orders (user_id, status, total_amount, shipping_amount, shipping_address, payment_method, payment_status, guest_email, guest_token)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        isGuest ? null : req.user.id,
        orderStatus,
        totalAmount,
        shippingAmount,
        JSON.stringify(shipping_address),
        payment_method,
        paymentStatus,
        isGuest ? (guest_email ?? null) : null,
        guestToken
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

      // Vider le panier BDD uniquement pour les connectés
      if (!isGuest) {
        db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
      }

      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    // Email de confirmation
    const emailTo = isGuest ? guest_email : req.user.email;
    const firstName = isGuest ? (shipping_address.first_name || 'Client') : req.user.first_name;
    sendOrderConfirmationEmail(emailTo, firstName, { ...order, items }).catch(() => {});

    // Paiement mobile via PayTech
    let paymentUrl = null;
    if (isMobilePay) {
      try {
        const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
        const result = await initiatePayment({ amount: totalAmount, orderId, apiUrl });
        if (result?.paymentUrl) {
          paymentUrl = result.paymentUrl;
          if (result.token) {
            db.prepare('UPDATE orders SET payment_token = ? WHERE id = ?').run(result.token, orderId);
          }
        }
      } catch (payErr) {
        console.error('Erreur initiation paiement:', payErr.message);
      }
    }

    return res.status(201).json({
      order: { ...order, items },
      payment_url: paymentUrl,
      ...(isGuest && { guest_token: guestToken }),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders  — Historique commandes (connecté uniquement)
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
 * Connecté : vérifie user_id | Invité : vérifie ?token=
 */
function getOrderById(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { token } = req.query;

    let order;
    if (req.user) {
      order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, req.user.id);
    } else if (token) {
      order = db.prepare('SELECT * FROM orders WHERE id = ? AND guest_token = ?').get(id, token);
    } else {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentification requise' } });
    }

    if (!order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Commande introuvable' } });
    }

    const items = db.prepare(`
      SELECT oi.*,
             (SELECT url FROM product_images WHERE product_id = oi.product_id AND is_primary = 1 LIMIT 1) AS image_url
      FROM order_items oi WHERE oi.order_id = ?
    `).all(order.id);

    // Ne pas exposer le guest_token dans la réponse
    const { guest_token: _gt, ...orderData } = order;
    return res.json({
      order: {
        ...orderData,
        shipping_address: JSON.parse(order.shipping_address),
        items,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/guest/:token  — Commande par token invité
 */
function getOrderByGuestToken(req, res, next) {
  try {
    const db = getDb();
    const { token } = req.params;

    const order = db.prepare('SELECT * FROM orders WHERE guest_token = ?').get(token);
    if (!order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Commande introuvable' } });
    }

    const items = db.prepare(`
      SELECT oi.*,
             (SELECT url FROM product_images WHERE product_id = oi.product_id AND is_primary = 1 LIMIT 1) AS image_url
      FROM order_items oi WHERE oi.order_id = ?
    `).all(order.id);

    const { guest_token: _gt, ...orderData } = order;
    return res.json({
      order: {
        ...orderData,
        shipping_address: JSON.parse(order.shipping_address),
        items,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getOrders, getOrderById, getOrderByGuestToken };
