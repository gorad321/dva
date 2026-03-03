import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  // Refs pour éviter les setState après démontage et les doubles appels
  const abortRef      = useRef(null);
  const debounceRef   = useRef(null);
  const pendingQtyRef = useRef(null);

  // ── Rafraîchir l'image uniquement si elle est absente ───────────────────────
  // Si image_url existe déjà dans le panier → pas de fetch inutile
  useEffect(() => {
    if (!item.slug || item.image_url) return;

    abortRef.current = new AbortController();

    fetch(`/api/products/${item.slug}`, {
      credentials: 'include',
      signal: abortRef.current.signal,
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const imgs = data?.product?.images;
        if (!imgs?.length) return;
        const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
        if (primary?.url) setImageUrl(primary.url);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('[CartItem] fetch image échoué :', err.message);
        }
      });

    return () => abortRef.current?.abort();
  }, [item.slug, item.image_url]);

  // Nettoyage global au démontage
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Changement de quantité avec debounce 300ms ───────────────────────────────
  // Les clics rapides (+/-) consolident en un seul appel API
  const handleQuantityChange = useCallback((newQty) => {
    if (newQty < 1 || newQty > item.stock) return;

    pendingQtyRef.current = newQty;
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const qty = pendingQtyRef.current;
      pendingQtyRef.current = null;
      setUpdating(true);
      try {
        await updateItem(item.id, qty);
      } catch (err) {
        const msg = err.response?.data?.error?.message;
        toast.error(msg || 'Erreur de mise à jour de la quantité');
        console.error('[CartItem] updateItem :', err);
      } finally {
        setUpdating(false);
      }
    }, 300);
  }, [item.id, item.stock, updateItem, toast]);

  const handleRemove = async () => {
    try {
      await removeItem(item.id);
    } catch (err) {
      toast.error('Erreur lors de la suppression');
      console.error('[CartItem] removeItem :', err);
    }
  };

  const atMaxStock = item.quantity >= item.stock;

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
          {/* Quantité + indicateur stock max */}
          <div className="flex flex-col items-start gap-1">
            <div className={`flex items-center border border-gray-300 rounded-lg overflow-hidden ${updating ? 'opacity-50' : ''}`}>
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={updating || item.quantity <= 1}
                className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 font-bold disabled:opacity-40">
                −
              </button>
              <span className="px-3 py-1.5 text-sm font-semibold border-x border-gray-300 min-w-[2.5rem] text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={updating || atMaxStock}
                className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 font-bold disabled:opacity-40">
                +
              </button>
            </div>
            {atMaxStock && (
              <p className="text-xs text-orange-500">Stock max atteint</p>
            )}
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
