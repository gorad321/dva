/**
 * DVA - Routes Paiement PayTech
 * Source officielle : https://doc.intech.sn/doc_paytech.php
 *
 * Routes exposées :
 *   POST /api/payments/create-payment      → initier un paiement pour une commande existante
 *   POST /api/payments/webhook/paytech     → IPN PayTech (notification de paiement)
 *   GET  /api/payments/payment-success     → redirection après paiement réussi
 *   GET  /api/payments/payment-cancel      → redirection après annulation du paiement
 */
const { Router } = require('express');
const crypto     = require('crypto');
const { getDb }  = require('../db/database');
const { createPayTechPayment } = require('../services/paymentService');

const router = Router();

// ─── POST /create-payment ──────────────────────────────────────────────────────
/**
 * Initie une session de paiement PayTech pour une commande existante.
 * Utilisé si un client souhaite retenter le paiement d'une commande pending.
 *
 * Body : { order_id }
 * Réponse : { payment_url, token }
 */
router.post('/create-payment', async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'order_id requis' } });
    }

    const db    = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);

    if (!order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Commande introuvable' } });
    }
    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: { code: 'ALREADY_PAID', message: 'Commande déjà payée' } });
    }

    const apiUrl     = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
    const successUrl = `${apiUrl}/api/payments/payment-success`;
    const cancelUrl  = `${apiUrl}/api/payments/payment-cancel`;
    const ipnUrl     = `${apiUrl}/api/payments/webhook/paytech`;

    const result = await createPayTechPayment({
      amount:     order.total_amount,
      orderId:    order.id,
      successUrl,
      cancelUrl,
      ipnUrl,
    });

    if (!result) {
      return res.status(503).json({
        error: { code: 'PAYMENT_UNAVAILABLE', message: 'Service de paiement non configuré' },
      });
    }

    // Stocker le token PayTech pour retrouver la commande au retour
    db.prepare('UPDATE orders SET payment_token = ? WHERE id = ?').run(result.token, order.id);

    res.json({ payment_url: result.paymentUrl, token: result.token });
  } catch (err) {
    console.error('Erreur /create-payment:', err.message);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── POST /webhook/paytech ────────────────────────────────────────────────────
/**
 * IPN (Instant Payment Notification) PayTech.
 * PayTech envoie cette requête automatiquement après chaque événement de paiement.
 *
 * Vérification d'authenticité :
 *   - api_key_sha256    : SHA256(PAYTECH_API_KEY)
 *   - api_secret_sha256 : SHA256(PAYTECH_API_SECRET)
 *
 * Le champ custom_field est encodé en Base64 par PayTech dans l'IPN.
 *
 * Toujours répondre 200 pour éviter les retry infinis de PayTech.
 */
router.post('/webhook/paytech', (req, res) => {
  try {
    const db = getDb();
    const {
      type_event,
      ref_command,
      item_price,
      custom_field,
      api_key_sha256,
      api_secret_sha256,
      token_payment,
    } = req.body;

    // ── Vérifier l'authenticité via SHA256 des clés ───────────────────────────
    const apiKey    = process.env.PAYTECH_API_KEY;
    const apiSecret = process.env.PAYTECH_API_SECRET;

    if (apiKey && apiSecret) {
      const expectedKeyHash    = crypto.createHash('sha256').update(apiKey).digest('hex');
      const expectedSecretHash = crypto.createHash('sha256').update(apiSecret).digest('hex');

      if (api_key_sha256 !== expectedKeyHash || api_secret_sha256 !== expectedSecretHash) {
        console.warn('Webhook PayTech : clés SHA256 invalides');
        return res.status(403).send('Forbidden');
      }
    }

    // ── Récupérer l'ID de commande ────────────────────────────────────────────
    // 1. custom_field est encodé en Base64 par PayTech → décoder avant JSON.parse
    let orderId;
    if (custom_field) {
      try {
        const decoded = Buffer.from(custom_field, 'base64').toString('utf8');
        const cf      = JSON.parse(decoded);
        orderId = cf.order_id;
      } catch (e) {
        console.warn('Webhook PayTech : erreur décodage custom_field', e.message);
      }
    }

    // 2. Fallback : token_payment stocké en BDD
    if (!orderId && token_payment) {
      const row = db.prepare('SELECT id FROM orders WHERE payment_token = ?').get(token_payment);
      if (row) orderId = row.id;
    }

    // 3. Fallback : extraire depuis ref_command (format : DVA-{orderId}-{timestamp})
    if (!orderId && ref_command) {
      const parts = ref_command.split('-');
      if (parts[0] === 'DVA' && parts[1]) orderId = parseInt(parts[1], 10);
    }

    if (!orderId) {
      console.warn('Webhook PayTech : order_id introuvable', { ref_command, token_payment });
      return res.status(200).send('OK');
    }

    // ── Mettre à jour le statut de la commande ────────────────────────────────
    if (type_event === 'sale_complete') {
      db.prepare(
        "UPDATE orders SET status = 'confirmed', payment_status = 'paid' WHERE id = ? AND payment_status = 'pending'"
      ).run(orderId);
      console.log(`✅ Commande #${orderId} confirmée via IPN PayTech`);
    } else if (type_event === 'sale_canceled') {
      db.prepare(
        "UPDATE orders SET status = 'cancelled', payment_status = 'failed' WHERE id = ? AND payment_status = 'pending'"
      ).run(orderId);
      console.log(`❌ Commande #${orderId} annulée via IPN PayTech`);
    } else {
      console.log(`ℹ️  IPN PayTech : type_event=${type_event} pour commande #${orderId}`);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Erreur webhook PayTech:', err);
    res.status(200).send('OK'); // Toujours 200 pour éviter les retry infinis
  }
});

// ─── GET /payment-success ─────────────────────────────────────────────────────
/**
 * Redirection de PayTech après paiement réussi.
 * PayTech appelle cette URL avec ?token_payment={token} en query string.
 * Ce handler met à jour la commande (au cas où l'IPN n'est pas encore arrivé)
 * puis redirige le client vers la page de confirmation du frontend.
 */
router.get('/payment-success', (req, res) => {
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  try {
    const db           = getDb();
    const tokenPayment = req.query.token_payment || req.query.token;

    if (!tokenPayment) {
      return res.redirect(`${clientOrigin}/mon-compte?payment=success`);
    }

    const order = db.prepare('SELECT id, status, payment_status FROM orders WHERE payment_token = ?').get(tokenPayment);

    if (!order) {
      return res.redirect(`${clientOrigin}/mon-compte?payment=success`);
    }

    // Confirmer la commande si l'IPN n'est pas encore arrivé
    if (order.payment_status === 'pending') {
      db.prepare(
        "UPDATE orders SET status = 'confirmed', payment_status = 'paid' WHERE id = ? AND payment_status = 'pending'"
      ).run(order.id);
      console.log(`✅ Commande #${order.id} confirmée via payment-success redirect`);
    }

    res.redirect(`${clientOrigin}/commande/confirmation/${order.id}?payment=success`);
  } catch (err) {
    console.error('Erreur payment-success:', err);
    res.redirect(`${clientOrigin}/mon-compte`);
  }
});

// ─── GET /payment-cancel ──────────────────────────────────────────────────────
/**
 * Redirection de PayTech après annulation du paiement.
 * PayTech appelle cette URL avec ?token_payment={token} en query string.
 * Ce handler annule la commande et redirige le client vers le panier.
 */
router.get('/payment-cancel', (req, res) => {
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  try {
    const db           = getDb();
    const tokenPayment = req.query.token_payment || req.query.token;

    if (tokenPayment) {
      const order = db.prepare('SELECT id FROM orders WHERE payment_token = ?').get(tokenPayment);
      if (order) {
        db.prepare(
          "UPDATE orders SET status = 'cancelled', payment_status = 'failed' WHERE id = ? AND payment_status = 'pending'"
        ).run(order.id);
        console.log(`❌ Commande #${order.id} annulée via payment-cancel redirect`);
        return res.redirect(`${clientOrigin}/commande/confirmation/${order.id}?payment=cancelled`);
      }
    }

    res.redirect(`${clientOrigin}/panier?payment=cancelled`);
  } catch (err) {
    console.error('Erreur payment-cancel:', err);
    res.redirect(`${clientOrigin}/panier`);
  }
});

module.exports = router;
