/**
 * DVA - Contexte panier global
 * Deux couches : invité → localStorage | connecté → API
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../api/cartApi';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const GUEST_CART_KEY = 'dva_guest_cart';

function readGuestCart() {
  try { return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]'); }
  catch { return []; }
}

function writeGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function calcTotal(items) {
  return Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  // Initialisation synchrone depuis localStorage pour éviter le flash d'état vide
  const [items, setItems] = useState(readGuestCart);
  const [total, setTotal] = useState(() => calcTotal(readGuestCart()));
  const [loading, setLoading] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Charger le panier BDD
  const loadDbCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cartApi.getCart();
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fusionner le panier invité dans le panier BDD après connexion
  const mergePendingGuestCart = useCallback(async () => {
    const guestItems = readGuestCart();
    if (guestItems.length === 0) {
      await loadDbCart();
      return;
    }
    try {
      const res = await cartApi.mergeCart(
        guestItems.map(({ product_id, quantity }) => ({ product_id, quantity }))
      );
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      await loadDbCart();
    } finally {
      localStorage.removeItem(GUEST_CART_KEY);
    }
  }, [loadDbCart]);

  // Écouter l'événement de connexion pour déclencher la fusion
  useEffect(() => {
    const handler = () => mergePendingGuestCart();
    window.addEventListener('dva:auth:loggedin', handler);
    return () => window.removeEventListener('dva:auth:loggedin', handler);
  }, [mergePendingGuestCart]);

  // Basculer entre panier invité et panier BDD selon l'état d'authentification
  useEffect(() => {
    if (authLoading) return; // Attendre la résolution de l'auth
    if (user) {
      loadDbCart(); // Connecté : charger le panier BDD
    } else {
      // Invité : rafraîchir depuis localStorage (déjà initialisé dans useState)
      const guestItems = readGuestCart();
      setItems(guestItems);
      setTotal(calcTotal(guestItems));
    }
  }, [user, authLoading]);

  const addItem = useCallback(async (productId, quantity = 1, productData = null) => {
    if (!user) {
      // Invité : mise à jour du localStorage
      const current = readGuestCart();
      const idx = current.findIndex((i) => i.product_id === productId);
      if (idx >= 0) {
        current[idx] = {
          ...current[idx],
          quantity: Math.min(current[idx].quantity + quantity, productData?.stock ?? 99),
        };
      } else if (productData) {
        current.push({
          id: productId,
          product_id: productId,
          name: productData.name,
          slug: productData.slug || '',
          price: productData.price,
          original_price: productData.original_price ?? null,
          stock: productData.stock,
          image_url: productData.image_url ?? null,
          brand_name: productData.brand_name ?? '',
          quantity,
        });
      }
      writeGuestCart(current);
      setItems(current);
      setTotal(calcTotal(current));
      return;
    }
    const res = await cartApi.addItem(productId, quantity);
    setItems(res.data.items);
    setTotal(res.data.total);
  }, [user]);

  const updateItem = useCallback(async (id, quantity) => {
    if (!user) {
      const current = readGuestCart().map((i) =>
        i.id === id ? { ...i, quantity: Math.min(quantity, i.stock) } : i
      );
      writeGuestCart(current);
      setItems(current);
      setTotal(calcTotal(current));
      return;
    }
    const res = await cartApi.updateItem(id, quantity);
    setItems(res.data.items);
    setTotal(res.data.total);
  }, [user]);

  const removeItem = useCallback(async (id) => {
    if (!user) {
      const current = readGuestCart().filter((i) => i.id !== id);
      writeGuestCart(current);
      setItems(current);
      setTotal(calcTotal(current));
      return;
    }
    const res = await cartApi.removeItem(id);
    setItems(res.data.items);
    setTotal(res.data.total);
  }, [user]);

  const clearCart = useCallback(async () => {
    if (!user) {
      localStorage.removeItem(GUEST_CART_KEY);
      setItems([]);
      setTotal(0);
      return;
    }
    await cartApi.clearCart();
    setItems([]);
    setTotal(0);
  }, [user]);

  return (
    <CartContext.Provider value={{ items, total, itemCount, loading, addItem, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans CartProvider');
  return ctx;
}
