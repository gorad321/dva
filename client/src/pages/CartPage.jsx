import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import CartItem from '../components/cart/CartItem';
import OrderSummary from '../components/cart/OrderSummary';
import { ToastProvider } from '../components/common/Toast';
import { useCart } from '../contexts/CartContext';
import Spinner from '../components/common/Spinner';

export default function CartPage() {
  const { items, total, loading } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/commande');
  };

  return (
    <ToastProvider>
      <SEOMeta title="Mon panier" description="Votre panier DVA Auto" />
      <div className="container-main py-8">
        <h1 className="section-title mb-6 flex items-center gap-3">
          <ShoppingCart className="w-7 h-7 text-dva-blue" />
          Mon panier
          {items.length > 0 && (
            <span className="text-base font-normal text-gray-500">({items.length} article{items.length > 1 ? 's' : ''})</span>
          )}
        </h1>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Votre panier est vide</h2>
            <p className="text-gray-500 mb-8">Découvrez notre catalogue de pièces automobiles</p>
            <Link to="/catalogue" className="btn-primary">Voir le catalogue</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Articles */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-card p-5">
                {items.map((item) => <CartItem key={item.id} item={item} />)}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Link to="/catalogue" className="btn-ghost flex items-center gap-2">
                  ← Continuer les achats
                </Link>
              </div>
            </div>

            {/* Récapitulatif */}
            <div>
              <OrderSummary total={total} onCheckout={handleCheckout} />
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}
