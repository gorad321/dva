import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import LazyImage from '../common/LazyImage';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../common/Toast';
import { formatCFA } from '../../utils/currency';

export default function CartItem({ item }) {
  const { updateItem, removeItem } = useCart();
  const toast = useToast();
  const [updating, setUpdating] = useState(false);
  const [imageUrl, setImageUrl] = useState(item.image_url);

  // Rafraîchir l'image depuis l'API (corrige les URLs en cache dans localStorage)
  useEffect(() => {
    if (!item.slug) return;
    fetch(`/api/products/${item.slug}`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const imgs = data?.product?.images;
        if (!imgs?.length) return;
        const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
        if (primary?.url) setImageUrl(primary.url);
      })
      .catch(() => {});
  }, [item.slug]);

  const handleQuantityChange = async (newQty) => {
    if (newQty < 1) return;
    setUpdating(true);
    try {
      await updateItem(item.id, newQty);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur de mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    try {
      await removeItem(item.id);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100">
      {/* Image */}
      <Link to={`/produit/${item.slug}`} className="flex-shrink-0">
        <LazyImage
          src={imageUrl}
          alt={item.name}
          className="w-20 h-20 rounded-lg"
        />
      </Link>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <Link to={`/produit/${item.slug}`}
          className="text-sm font-medium text-gray-800 hover:text-dva-blue line-clamp-2 transition-colors">
          {item.name}
        </Link>
        <p className="text-xs text-gray-500 mt-0.5">{item.brand_name}</p>

        <div className="flex items-center justify-between mt-3">
          {/* Quantité */}
          <div className={`flex items-center border border-gray-300 rounded-lg overflow-hidden ${updating ? 'opacity-50' : ''}`}>
            <button onClick={() => handleQuantityChange(item.quantity - 1)} disabled={updating}
              className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 font-bold">−</button>
            <span className="px-3 py-1.5 text-sm font-semibold border-x border-gray-300 min-w-[2.5rem] text-center">
              {item.quantity}
            </span>
            <button onClick={() => handleQuantityChange(item.quantity + 1)} disabled={updating || item.quantity >= item.stock}
              className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 font-bold">+</button>
          </div>

          {/* Prix */}
          <div className="text-right">
            <p className="font-bold text-dva-red">{formatCFA(item.price * item.quantity)}</p>
            {item.quantity > 1 && (
              <p className="text-xs text-gray-400">{formatCFA(item.price)}/unité</p>
            )}
          </div>
        </div>
      </div>

      {/* Supprimer */}
      <button onClick={handleRemove}
        className="text-gray-400 hover:text-dva-red transition-colors p-1 self-start">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
