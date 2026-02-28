import React, { useState } from 'react';
import { ShoppingCart, Star, Check, AlertTriangle, Shield } from 'lucide-react';
import Button from '../common/Button';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/Toast';
import { Link } from 'react-router-dom';
import { formatCFA } from '../../utils/currency';

export default function ProductInfo({ product }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const hasPromo = product.original_price && product.original_price > product.price;
  const discount = hasPromo ? Math.round((1 - product.price / product.original_price) * 100) : 0;

  const handleAdd = async () => {
    if (!user) { toast.info('Connectez-vous pour ajouter au panier'); return; }
    setAdding(true);
    try {
      await addItem(product.id, quantity);
      toast.success(`${quantity}x "${product.name}" ajouté au panier`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de l\'ajout');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Marque + catégorie */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold bg-dva-blue-muted text-dva-blue px-2 py-0.5 rounded">
          {product.brand_name}
        </span>
        <span className="text-xs text-gray-500">{product.category_name}</span>
        <span className="text-xs text-gray-400">Réf. {product.sku}</span>
      </div>

      {/* Titre */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>

      {/* Note */}
      {product.avg_rating > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < Math.round(product.avg_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            ))}
          </div>
          <span className="text-sm text-gray-600">{product.avg_rating.toFixed(1)} ({product.review_count} avis)</span>
        </div>
      )}

      {/* Prix */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black text-dva-red">{formatCFA(product.price)}</span>
          {hasPromo && (
            <>
              <span className="text-lg text-gray-400 line-through">{formatCFA(product.original_price)}</span>
              <span className="badge-promo text-sm">-{discount}%</span>
            </>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">TVA incluse · Livraison calculée au checkout</p>
      </div>

      {/* Stock */}
      <div className={`flex items-center gap-2 text-sm font-medium ${
        product.stock > 5 ? 'text-green-600' :
        product.stock > 0 ? 'text-orange-500' : 'text-red-600'
      }`}>
        {product.stock > 5 ? (
          <><Check className="w-4 h-4" /> En stock ({product.stock} disponibles)</>
        ) : product.stock > 0 ? (
          <><AlertTriangle className="w-4 h-4" /> Stock limité : {product.stock} restant{product.stock > 1 ? 's' : ''}</>
        ) : (
          <><AlertTriangle className="w-4 h-4" /> Rupture de stock</>
        )}
      </div>

      {/* Quantité + Panier */}
      {product.stock > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2.5 text-gray-600 hover:bg-gray-50 font-bold text-lg leading-none">−</button>
            <span className="px-4 py-2.5 text-sm font-semibold border-x border-gray-300 min-w-[3rem] text-center">
              {quantity}
            </span>
            <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              className="px-3 py-2.5 text-gray-600 hover:bg-gray-50 font-bold text-lg leading-none">+</button>
          </div>

          {user ? (
            <Button onClick={handleAdd} loading={adding} size="lg" className="flex-1">
              <ShoppingCart className="w-5 h-5" /> Ajouter au panier
            </Button>
          ) : (
            <Link to="/connexion" className="btn-primary flex-1 text-center flex items-center justify-center gap-2">
              <ShoppingCart className="w-5 h-5" /> Se connecter pour commander
            </Link>
          )}
        </div>
      )}

      {/* Réassurance */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Shield className="w-4 h-4 text-dva-blue flex-shrink-0" />
          Pièce d'origine certifiée
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
          Retours 30 jours sans justificatif
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Shield className="w-4 h-4 text-dva-blue flex-shrink-0" />
          Paiement 100% sécurisé
        </div>
      </div>
    </div>
  );
}
