/**
 * Formate un montant en Franc CFA (XOF)
 * Exemple : formatCFA(28000) → "28 000 F CFA"
 */
export function formatCFA(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 F CFA';
  const n = Math.round(Number(amount));
  return n.toLocaleString('fr-FR') + ' F CFA';
}

/** Seuil de livraison gratuite */
export const FREE_SHIPPING_THRESHOLD = 25000;
/** Frais de livraison standard */
export const SHIPPING_COST = 2500;
