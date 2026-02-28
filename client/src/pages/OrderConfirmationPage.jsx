import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import Spinner from '../components/common/Spinner';
import { ordersApi } from '../api/ordersApi';
import { formatCFA } from '../utils/currency';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getOrderById(id)
      .then((res) => setOrder(res.data.order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <>
      <SEOMeta title={`Commande confirmée #${id}`} />
      <div className="container-main py-12 max-w-2xl mx-auto text-center">
        {/* Icône succès */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-2">Commande confirmée !</h1>
        <p className="text-gray-500 mb-8">
          Merci pour votre commande. Vous recevrez un email de confirmation.
        </p>

        {/* Numéro de commande */}
        <div className="bg-dva-blue-muted rounded-xl p-5 mb-8">
          <p className="text-sm text-gray-600">Numéro de commande</p>
          <p className="text-2xl font-black text-dva-blue">#{String(id).padStart(6, '0')}</p>
        </div>

        {/* Étapes de suivi */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: CheckCircle, label: 'Confirmée', done: true },
            { icon: Package, label: 'En préparation', done: false },
            { icon: Truck, label: 'Livraison', done: false },
          ].map(({ icon: Icon, label, done }) => (
            <div key={label} className="text-center">
              <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2 ${done ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Icon className={`w-6 h-6 ${done ? 'text-green-500' : 'text-gray-400'}`} />
              </div>
              <p className={`text-sm font-medium ${done ? 'text-green-600' : 'text-gray-400'}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Récapitulatif commande */}
        {order && (
          <div className="bg-white rounded-xl shadow-card p-5 mb-8 text-left">
            <h3 className="font-bold text-gray-800 mb-4">Récapitulatif</h3>
            <div className="space-y-2 text-sm mb-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between gap-2">
                  <span className="text-gray-600">{item.product_name} ×{item.quantity}</span>
                  <span className="font-medium">{formatCFA(item.unit_price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span className={order.shipping_amount === 0 ? 'text-green-600' : ''}>
                  {order.shipping_amount === 0 ? 'Gratuite' : formatCFA(order.shipping_amount)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-gray-900">
                <span>Total payé</span>
                <span className="text-dva-red">{formatCFA(order.total_amount)}</span>
              </div>
            </div>
            {order.shipping_address && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Livraison à :</p>
                <p className="text-sm text-gray-700">
                  {order.shipping_address.first_name} {order.shipping_address.last_name}<br />
                  {order.shipping_address.address1}<br />
                  {order.shipping_address.postal_code} {order.shipping_address.city}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/mon-compte" className="btn-secondary flex items-center justify-center gap-2">
            <Package className="w-4 h-4" /> Mes commandes
          </Link>
          <Link to="/" className="btn-outline flex items-center justify-center gap-2">
            <Home className="w-4 h-4" /> Retour à l'accueil
          </Link>
        </div>
      </div>
    </>
  );
}
