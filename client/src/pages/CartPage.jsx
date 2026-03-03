import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Loader2 } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import CartItem from '../components/cart/CartItem';
import OrderSummary from '../components/cart/OrderSummary';
import { ToastProvider } from '../components/common/Toast';
import { useCart } from '../contexts/CartContext';
import Spinner from '../components/common/Spinner';

export default function CartPage() {
  const { items, total, loading } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => navigate('/commande');

  return (
    <ToastProvider>
      <SEOMeta title="Mon panier" description="Votre panier DVA Auto" />
      <div className="container-main py-8">

        {/* Titre */}
        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart className="w-7 h-7 text-dva-blue flex-shrink-0" />
          <h1 className="section-title mb-0">Mon panier</h1>
          {items.length > 0 && (
            <span className="text-base font-normal text-gray-500">
              ({items.length} article{items.length > 1 ? 's' : ''})
            </span>
          )}
          {loading && (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>

        {/* Contenu */}
        {items.length > 0 ? (
          /* Articles + récapitulatif */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-card divide-y divide-gray-100">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
              <div className="mt-4">
                <Link to="/catalogue" className="btn-ghost inline-flex items-center gap-2">
                  ← Continuer les achats
                </Link>
              </div>
            </div>
            <div>
              <OrderSummary total={total} onCheckout={handleCheckout} />
            </div>
          </div>
        ) : loading ? (
          /* Chargement initial (panier encore inconnu) */
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          /* Panier vide */
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Votre panier est vide</h2>
            <p className="text-gray-500 mb-8">Découvrez notre catalogue de pièces automobiles</p>
            <Link to="/catalogue" className="btn-primary">Voir le catalogue</Link>
          </div>
        )}

      </div>
    </ToastProvider>
  );
}
