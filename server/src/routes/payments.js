/**
 * DVA - Routes Paiement PayTech (version sécurisée production-ready)
 *
 * Sécurité implémentée :
 *   - Vérification SHA256 des clés API sur chaque webhook
 *   - Re-vérification PayTech API avant toute confirmation de commande
 *   - Idempotence : UPDATE WHERE payment_status = 'pending'
 *   - Comparaison montant payé vs montant commande (tolérance 1 XOF)
 *   - Expiration 15 min : refuse le paiement si fenêtre dépassée
 *   - Vérification propriété commande (utilisateur connecté ou invité + token)
 *   - /payment-success NE CONFIRME JAMAIS — webhook seul fait foi
 */
const { Router } = require('express');
const crypto = require('crypto');
const { getDb } = require('../db/database');
const { createPayTechPayment, getPayTechStatus } = require('../services/paymentService');
const { optionalAuth } = require('../middleware/auth');

const router = Router();

// ─── POST /create-payment ──────────────────────────────────────────────────────
/**
 * Initie une nouvelle session PayTech pour une commande pending existante.
 * Utilisé quand l'utilisateur veut retenter le paiement d'une commande.
 *
 * Sécurité :
 *   - Vérifie la propriété (user_id ou guest_token)
 *   - Refuse si payment_status !== 'pending'
 *   - Refuse si la fenêtre de 15 min est expirée
 */
router.post('/create-payment', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const { order_id, guest_token } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'order_id requis' } });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    if (!order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Commande introuvable' } });
    }

    // ── Vérifier la propriété de la commande ────────────────────────────────
    if (req.user) {
      if (order.user_id !== req.user.id) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Accès refusé' } });
      }
    } else {
      // Invité : doit fournir son guest_token
      if (!guest_token || !order.guest_token || order.guest_token !== guest_token) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Accès refusé' } });
      }
    }

    // ── Vérifier que le paiement est encore possible ─────────────────────────
    if (order.payment_status !== 'pending') {
      return res.status(400).json({
        error: { code: 'NOT_PENDING', message: `Commande non payable (statut : ${order.payment_status})` },
      });
    }

    // ── Vérifier l'expiration (15 min) ───────────────────────────────────────
    if (order.expires_at && new Date() > new Date(order.expires_at)) {
      db.prepare(
        "UPDATE orders SET status = 'cancelled', payment_status = 'failed' WHERE id = ? AND payment_status = 'pending'"
      ).run(order.id);
      console.log(`[create-payment] Commande #${order.id} expirée — annulée automatiquement`);
      return res.status(400).json({
        error: { code: 'EXPIRED', message: 'Le délai de paiement a expiré. Veuillez passer une nouvelle commande.' },
      });
    }

    const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
    const result = await createPayTechPayment({
      amount:     order.total_amount,
      orderId:    order.id,
      successUrl: `${apiUrl}/api/payments/payment-success`,
      cancelUrl:  `${apiUrl}/api/payments/payment-cancel`,
      ipnUrl:     `${apiUrl}/api/payments/webhook/paytech`,
    });

    if (!result) {
      return res.status(503).json({
        error: { code: 'PAYMENT_UNAVAILABLE', message: 'Service de paiement non configuré' },
      });
    }

    db.prepare('UPDATE orders SET payment_token = ? WHERE id = ?').run(result.token, order.id);
    console.log(`[create-payment] Session PayTech créée pour commande #${order.id}`);

    return res.json({ payment_url: result.paymentUrl, token: result.token });
  } catch (err) {
    console.error('[create-payment]', err.message);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── POST /webhook/paytech ─────────────────────────────────────────────────────
/**
 * IPN (Instant Payment Notification) PayTech.
 * Seul ce webhook confirme définitivement une commande.
 *
 * Chaîne de sécurité (dans l'ordre) :
 *   1. Vérification SHA256(API_KEY) + SHA256(API_SECRET)
 *   2. Recherche commande : token_payment → ref_command → custom_field
 *   3. Incrémentation webhook_attempts (audit)
 *   4. Idempotence : payment_status !== 'pending' → ignoré
 *   5. Re-vérification auprès de l'API PayTech (getPayTechStatus)
 *   6. Comparaison montant payé (±1 XOF de tolérance)
 *   7. UPDATE atomique WHERE payment_status = 'pending' + SET paid_at
 *
 * Toujours répondre 200 pour éviter les retry infinis de PayTech.
 */
router.post('/webhook/paytech', async (req, res) => {
  // Répondre immédiatement 200 pour éviter les timeout PayTech
  res.status(200).send('OK');

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

    const apiKey    = process.env.PAYTECH_API_KEY;
    const apiSecret = process.env.PAYTECH_API_SECRET;

    // ── 1. Vérification signatures SHA256 ────────────────────────────────────
    if (apiKey && apiSecret) {
      const expectedKey    = crypto.createHash('sha256').update(apiKey).digest('hex');
      const expectedSecret = crypto.createHash('sha256').update(apiSecret).digest('hex');

      if (api_key_sha256 !== expectedKey || api_secret_sha256 !== expectedSecret) {
        console.warn('[Webhook PayTech] ❌ Signature invalide — requête ignorée');
        return;
      }
    }

    console.log(`[Webhook PayTech] Reçu : type_event=${type_event}, ref=${ref_command}`);

    // ── Gérer sale_canceled ──────────────────────────────────────────────────
    if (type_event === 'sale_canceled') {
      let cancelId;
      if (token_payment) {
        const row = db.prepare('SELECT id FROM orders WHERE payment_token = ?').get(token_payment);
        if (row) cancelId = row.id;
      }
      if (!cancelId && ref_command) {
        const parts = ref_command.split('-');
        if (parts[0] === 'DVA' && parts[1]) cancelId = parseInt(parts[1], 10);
      }
      if (cancelId) {
        db.prepare(
          "UPDATE orders SET status = 'cancelled', payment_status = 'failed' WHERE id = ? AND payment_status = 'pending'"
        ).run(cancelId);
        console.log(`[Webhook PayTech] Commande #${cancelId} annulée`);
      }
      return;
    }

    if (type_event !== 'sale_complete') {
      console.log(`[Webhook PayTech] type_event="${type_event}" ignoré`);
      return;
    }

    // ── 2. Retrouver la commande ─────────────────────────────────────────────
    let orderId;

    // Priorité 1 : token_payment (le plus fiable, stocké en BDD lors de la création)
    if (token_payment) {
      const row = db.prepare('SELECT id FROM orders WHERE payment_token = ?').get(token_payment);
      if (row) orderId = row.id;
    }

    // Priorité 2 : ref_command (format DVA-{orderId}-{timestamp})
    if (!orderId && ref_command) {
      const parts = ref_command.split('-');
      if (parts[0] === 'DVA' && parts[1]) orderId = parseInt(parts[1], 10);
    }

    // Priorité 3 : custom_field encodé Base64 par PayTech
    if (!orderId && custom_field) {
      try {
        const decoded = Buffer.from(custom_field, 'base64').toString('utf8');
        orderId = JSON.parse(decoded).order_id;
      } catch {
        console.warn('[Webhook PayTech] Erreur décodage custom_field');
      }
    }

    if (!orderId) {
      console.warn('[Webhook PayTech] ⚠️  order_id introuvable', { ref_command, token_payment });
      return;
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      console.warn(`[Webhook PayTech] ⚠️  Commande #${orderId} introuvable en BDD`);
      return;
    }

    // ── 3. Audit : incrémenter le compteur de tentatives webhook ────────────
    db.prepare(
      'UPDATE orders SET webhook_attempts = COALESCE(webhook_attempts, 0) + 1 WHERE id = ?'
    ).run(orderId);

    // ── 4. Idempotence : ne pas retraiter ────────────────────────────────────
    if (order.payment_status !== 'pending') {
      console.log(`[Webhook PayTech] ℹ️  Commande #${orderId} déjà traitée (${order.payment_status}) — ignoré`);
      return;
    }

    // ── 5. Re-vérification obligatoire auprès de l'API PayTech ──────────────
    // La signature SHA256 est nécessaire mais pas suffisante.
    // On appelle PayTech pour confirmer que le paiement est bien "completed".
    if (!token_payment || !apiKey || !apiSecret) {
      console.warn(`[Webhook PayTech] ❌ Re-vérification impossible pour #${orderId} (token ou clés absents)`);
      return;
    }

    let paytechStatus;
    try {
      paytechStatus = await getPayTechStatus(token_payment);
    } catch (verifyErr) {
      // API PayTech inaccessible — refuser pour éviter toute fraude
      console.error(`[Webhook PayTech] ❌ API inaccessible pour #${orderId}: ${verifyErr.message}`);
      return;
    }

    if (!paytechStatus || paytechStatus.success !== 1) {
      console.warn(`[Webhook PayTech] ❌ Re-vérification échouée pour #${orderId}`, paytechStatus);
      return;
    }

    // ── 6. Comparer le montant payé ──────────────────────────────────────────
    // Tolérance de 1 XOF pour les éventuels arrondis de PayTech.
    const paidAmount = parseFloat(paytechStatus.item_price ?? item_price ?? 0);
    if (paidAmount > 0 && Math.abs(paidAmount - Number(order.total_amount)) > 1) {
      console.warn(
        `[Webhook PayTech] ❌ Montant incohérent pour #${orderId}: attendu=${order.total_amount} XOF, reçu=${paidAmount} XOF`
      );
      return;
    }

    // ── 7. Confirmer la commande (UPDATE atomique) ───────────────────────────
    const update = db.prepare(
      `UPDATE orders
         SET status = 'confirmed', payment_status = 'paid', paid_at = CURRENT_TIMESTAMP
       WHERE id = ? AND payment_status = 'pending'`
    ).run(orderId);

    if (update.changes > 0) {
      console.log(`✅ [Webhook PayTech] Commande #${orderId} confirmée — ${order.total_amount} XOF`);
    } else {
      console.log(`[Webhook PayTech] Commande #${orderId} non modifiée (mise à jour concurrente ?)`);
    }

  } catch (err) {
    console.error('[Webhook PayTech] Erreur non gérée:', err.message);
  }
});

// ─── GET /payment-success ─────────────────────────────────────────────────────
/**
 * Redirection PayTech après paiement réussi.
 *
 * ⚠️  Ce handler NE CONFIRME JAMAIS la commande.
 * La confirmation dépend UNIQUEMENT du webhook IPN (/webhook/paytech).
 *
 * Il redirige le client vers la page de confirmation frontend qui poll
 * le statut de la commande toutes les 5 secondes jusqu'à confirmation.
 * Le guest_token est transmis pour les invités.
 */
router.get('/payment-success', (req, res) => {
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  try {
    const db = getDb();
    const tokenPayment = req.query.token_payment || req.query.token;

    if (!tokenPayment) {
      return res.redirect(`${clientOrigin}/?payment=success`);
    }

    const order = db.prepare('SELECT id, guest_token FROM orders WHERE payment_token = ?').get(tokenPayment);
    if (!order) {
      return res.redirect(`${clientOrigin}/?payment=success`);
    }

    // Inclure le guest_token pour que les invités accèdent à leur commande
    const guestParam = order.guest_token ? `&token=${order.guest_token}` : '';

    // ?payment=pending : le frontend poll jusqu'à confirmation par webhook
    console.log(`[payment-success] Redirection vers confirmation commande #${order.id}`);
    return res.redirect(`${clientOrigin}/commande/confirmation/${order.id}?payment=pending${guestParam}`);
  } catch (err) {
    console.error('[payment-success]', err.message);
    return res.redirect(`${clientOrigin}/`);
  }
});

// ─── GET /payment-cancel ──────────────────────────────────────────────────────
/**
 * Redirection PayTech après annulation.
 * Annule la commande et redirige vers la page de confirmation (état annulé).
 */
router.get('/payment-cancel', (req, res) => {
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  try {
    const db = getDb();
    const tokenPayment = req.query.token_payment || req.query.token;

    if (tokenPayment) {
      const order = db.prepare('SELECT id, guest_token FROM orders WHERE payment_token = ?').get(tokenPayment);
      if (order) {
        db.prepare(
          "UPDATE orders SET status = 'cancelled', payment_status = 'failed' WHERE id = ? AND payment_status = 'pending'"
        ).run(order.id);
        console.log(`[payment-cancel] Commande #${order.id} annulée`);

        const guestParam = order.guest_token ? `&token=${order.guest_token}` : '';
        return res.redirect(`${clientOrigin}/commande/confirmation/${order.id}?payment=cancelled${guestParam}`);
      }
    }

    return res.redirect(`${clientOrigin}/panier?payment=cancelled`);
  } catch (err) {
    console.error('[payment-cancel]', err.message);
    return res.redirect(`${clientOrigin}/panier`);
  }
});

module.exports = router;
