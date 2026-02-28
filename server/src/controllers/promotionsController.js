/**
 * DVA - Contrôleur promotions / codes promo
 */
const { getDb } = require('../db/database');

/**
 * POST /api/promotions/validate
 * Body: { code, cart_total }
 */
function validatePromo(req, res, next) {
  try {
    const { code, cart_total } = req.body;
    const db = getDb();

    const promo = db.prepare(`
      SELECT * FROM promotions
      WHERE code = ?
        AND is_active = 1
        AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP)
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        AND (max_uses IS NULL OR used_count < max_uses)
    `).get(code.toUpperCase().trim());

    if (!promo) {
      return res.status(404).json({
        error: { code: 'INVALID_PROMO', message: 'Code promo invalide ou expiré' },
      });
    }

    const total = parseFloat(cart_total);
    if (total < promo.min_order_amount) {
      return res.status(400).json({
        error: {
          code: 'MIN_ORDER_NOT_MET',
          message: `Montant minimum de commande non atteint (${promo.min_order_amount}€ requis)`,
        },
      });
    }

    // Calculer la réduction
    let discount = 0;
    if (promo.discount_type === 'percentage') {
      discount = Math.round(total * (promo.discount_value / 100) * 100) / 100;
    } else {
      discount = Math.min(promo.discount_value, total); // Ne pas dépasser le total
    }

    return res.json({
      promo: {
        id: promo.id,
        code: promo.code,
        name: promo.name,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        discount_amount: discount,
        new_total: Math.round((total - discount) * 100) / 100,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { validatePromo };
