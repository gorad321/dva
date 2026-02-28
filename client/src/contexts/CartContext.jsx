/**
 * DVA - Contexte panier global
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../api/cartApi';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Charger le panier quand l'utilisateur se connecte
  useEffect(() => {
    if (user) {
      setLoading(true);
      cartApi.getCart()
        .then((res) => {
          setItems(res.data.items);
          setTotal(res.data.total);
        })
        .catch(() => {
          setItems([]);
          setTotal(0);
        })
        .finally(() => setLoading(false));
    } else {
      setItems([]);
      setTotal(0);
    }
  }, [user]);

  const addItem = useCallback(async (productId, quantity = 1) => {
    const res = await cartApi.addItem(productId, quantity);
    setItems(res.data.items);
    setTotal(res.data.total);
  }, []);

  const updateItem = useCallback(async (id, quantity) => {
    const res = await cartApi.updateItem(id, quantity);
    setItems(res.data.items);
    setTotal(res.data.total);
  }, []);

  const removeItem = useCallback(async (id) => {
    const res = await cartApi.removeItem(id);
    setItems(res.data.items);
    setTotal(res.data.total);
  }, []);

  const clearCart = useCallback(async () => {
    await cartApi.clearCart();
    setItems([]);
    setTotal(0);
  }, []);

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
