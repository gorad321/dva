import React, { useState } from 'react';
import { Tag } from 'lucide-react';
import Button from '../common/Button';
import { ordersApi } from '../../api/ordersApi';
import { useToast } from '../common/Toast';
import { formatCFA, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../../utils/currency';

export default function OrderSummary({ total, onCheckout, showPromo = true }) {
  const toast = useToast();
  const [promoCode, setPromoCode] = useState('');
  const [promo, setPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const discount = promo ? promo.discount_amount : 0;
  const finalTotal = Math.max(0, total - discount + shipping);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await ordersApi.validatePromo(promoCode, total);
      setPromo(res.data.promo);
      toast.success(`Code "${promoCode}" appliqué : -${formatCFA(res.data.promo.discount_amount)}`);
    } catch (err) {
      setPromo(null);
      toast.error(err.response?.data?.error?.message || 'Code promo invalide');
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-5 sticky top-24">
      <h3 className="font-bold text-gray-800 text-lg mb-5">Récapitulatif</h3>

      <div className="space-y-3 text-sm mb-5">
        <div className="flex justify-between text-gray-600">
          <span>Sous-total</span>
          <span>{formatCFA(total)}</span>
        </div>
        {promo && (
          <div className="flex justify-between text-green-600">
            <span>Code promo ({promo.code})</span>
            <span>-{formatCFA(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Livraison</span>
          <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
            {shipping === 0 ? 'Gratuite' : formatCFA(shipping)}
          </span>
        </div>
        {shipping > 0 && (
          <p className="text-xs text-dva-blue">
            Encore {formatCFA(FREE_SHIPPING_THRESHOLD - total)} pour la livraison gratuite
          </p>
        )}
        <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t border-gray-100">
          <span>Total TTC</span>
          <span className="text-dva-red text-lg">{formatCFA(finalTotal)}</span>
        </div>
      </div>

      {/* Code promo */}
      {showPromo && !promo && (
        <div className="mb-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Code promo"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="input-dva pl-9"
              />
            </div>
            <Button variant="outline" onClick={handleApplyPromo} loading={promoLoading} disabled={!promoCode}>
              OK
            </Button>
          </div>
        </div>
      )}
      {promo && (
        <div className="mb-5 bg-green-50 rounded-lg p-3 flex items-center justify-between text-sm">
          <span className="text-green-700">Code <strong>{promo.code}</strong> appliqué</span>
          <button onClick={() => { setPromo(null); setPromoCode(''); }} className="text-green-600 hover:underline text-xs">Retirer</button>
        </div>
      )}

      <Button onClick={() => onCheckout({ promo, finalTotal })} size="lg" className="w-full">
        Commander →
      </Button>

      <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
        🔒 Paiement 100% sécurisé
      </p>
    </div>
  );
}
