/**
 * DVA - Service Paiement PayTech
 * Source officielle : https://doc.intech.sn/doc_paytech.php
 *
 * Variables d'environnement requises :
 *   PAYTECH_API_KEY    — clé API (tableau de bord paytech.sn → API)
 *   PAYTECH_API_SECRET — secret API
 *   API_URL            — URL publique du serveur (requis en production pour les webhooks)
 */

const PAYTECH_BASE_URL = 'https://paytech.sn/api';

/**
 * Crée une session de paiement via PayTech
 * Supporte Wave, Orange Money, et autres méthodes disponibles sur PayTech
 *
 * @param {Object} params
 * @param {number} params.amount       Montant en XOF (entier)
 * @param {number} params.orderId      ID de la commande
 * @param {string} params.successUrl   URL backend de redirection après paiement réussi
 * @param {string} params.cancelUrl    URL backend de redirection après annulation
 * @param {string} params.ipnUrl       URL du webhook IPN PayTech
 *
 * @returns {{ paymentUrl: string, token: string, refCommand: string }|null}
 *          null si les clés API ne sont pas configurées
 */
async function createPayTechPayment({ amount, orderId, successUrl, cancelUrl, ipnUrl }) {
  const apiKey    = process.env.PAYTECH_API_KEY;
  const apiSecret = process.env.PAYTECH_API_SECRET;

  if (!apiKey || !apiSecret) return null;

  const refCommand    = `DVA-${orderId}-${Date.now()}`;
  const amountRounded = Math.round(amount);

  const body = {
    item_name:    `Commande DVA #${orderId}`,
    item_price:   amountRounded,
    currency:     'XOF',
    ref_command:  refCommand,
    command_name: `Commande DVA #${orderId}`,
    env:          process.env.PAYTECH_ENV || 'prod',
    success_url:  successUrl,
    cancel_url:   cancelUrl,
    ipn_url:      ipnUrl,
    // custom_field est renvoyé encodé en Base64 dans l'IPN PayTech
    custom_field: JSON.stringify({ order_id: orderId }),
  };

  const resp = await fetch(`${PAYTECH_BASE_URL}/payment/request-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API_KEY':    apiKey,
      'API_SECRET': apiSecret,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`PayTech HTTP ${resp.status}: ${text}`);
  }

  const data = await resp.json();

  if (data.success !== 1) {
    const msg = Array.isArray(data.errors)
      ? data.errors.join(', ')
      : JSON.stringify(data);
    throw new Error(`PayTech: ${msg}`);
  }

  return {
    paymentUrl: data.redirect_url,
    token:      data.token,
    refCommand,
  };
}

/**
 * Vérifie le statut d'un paiement PayTech via token
 *
 * @param {string} tokenPayment  Token retourné lors de la création du paiement
 * @returns {Object}  Réponse brute de l'API PayTech
 */
async function getPayTechStatus(tokenPayment) {
  const apiKey    = process.env.PAYTECH_API_KEY;
  const apiSecret = process.env.PAYTECH_API_SECRET;

  if (!apiKey || !apiSecret) return null;

  const resp = await fetch(
    `${PAYTECH_BASE_URL}/payment/get-status?token_payment=${encodeURIComponent(tokenPayment)}`,
    {
      method: 'GET',
      headers: {
        'API_KEY':    apiKey,
        'API_SECRET': apiSecret,
      },
    }
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`PayTech status HTTP ${resp.status}: ${text}`);
  }

  return resp.json();
}

/**
 * Point d'entrée principal : initie un paiement PayTech pour une commande
 * Les URLs de retour pointent vers les handlers backend (/api/payments/payment-success|cancel)
 *
 * @param {Object} params
 * @param {number} params.amount   Montant en XOF
 * @param {number} params.orderId  ID de la commande
 * @param {string} params.apiUrl   URL publique du serveur API
 *
 * @returns {{ paymentUrl: string, token: string, refCommand: string }|null}
 */
async function initiatePayment({ amount, orderId, apiUrl }) {
  const successUrl = `${apiUrl}/api/payments/payment-success`;
  const cancelUrl  = `${apiUrl}/api/payments/payment-cancel`;
  const ipnUrl     = `${apiUrl}/api/payments/webhook/paytech`;

  return createPayTechPayment({ amount, orderId, successUrl, cancelUrl, ipnUrl });
}

module.exports = { initiatePayment, createPayTechPayment, getPayTechStatus };
