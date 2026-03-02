import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import LazyImage from '../common/LazyImage';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../common/Toast';
import { formatCFA } from '../../utils/currency';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [bouncing, setBouncing] = useState(false);

  const hasPromo = product.original_price && product.original_price > product.price;
  const discount = hasPromo
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    setAdding(true);
    setBouncing(true);
    try {
      await addItem(product.id, 1, {
        name: product.name,
        slug: product.slug,
        price: product.price,
        original_price: product.original_price,
        stock: product.stock,
        image_url: product.image_url,
        brand_name: product.brand_name,
      });
      toast.success(`"${product.name}" ajouté au panier`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de l\'ajout');
    } finally {
      setAdding(false);
      setTimeout(() => setBouncing(false), 400);
    }
  };

  return (
    <Link to={`/produit/${product.slug}`} className="product-card group block">
      {/* Image avec zoom + overlay au survol */}
      <div className="relative product-img-wrap">
        <LazyImage
          src={product.image_url || 'https://picsum.photos/seed/default/400/300'}
          alt={product.image_alt || product.name}
          className="h-44 w-full"
        />
        {/* Overlay "Voir le produit" */}
        <div className="product-overlay absolute inset-0 bg-dva-blue/10 flex items-center justify-center">
          <span className="bg-white/90 text-dva-blue text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <Eye className="w-3.5 h-3.5" /> Voir le produit
          </span>
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasPromo && <span className="badge-promo">-{discount}%</span>}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="badge-stock-low">Stock limité</span>
          )}
          {product.stock === 0 && (
            <span className="bg-gray-500 text-white text-xs font-bold px-2 py-0.5 rounded">Indisponible</span>
          )}
        </div>
      </div>

      {/* Infos */}
      <div className="p-3">
        <p className="text-xs text-gray-500 mb-0.5">{product.brand_name}</p>
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-dva-blue transition-colors">
          {product.name}
        </h3>

        {/* Note */}
        {product.avg_rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.round(product.avg_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.review_count})</span>
          </div>
        )}

        {/* Prix */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-lg font-bold text-dva-red">{formatCFA(product.price)}</span>
            {hasPromo && (
              <span className="text-xs text-gray-400 line-through ml-1.5">{formatCFA(product.original_price)}</span>
            )}
          </div>

          {/* Bouton panier */}
          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className={`bg-dva-blue hover:bg-dva-blue-dark text-white rounded-lg p-2 transition-colors disabled:opacity-50 ${bouncing ? 'cart-btn-bounce' : ''}`}
            title="Ajouter au panier"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
