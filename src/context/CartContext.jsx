/**
 * CartContext — holds the live cart returned by the backend and exposes
 * actions that call the real cart endpoints. Totals are always taken from the
 * backend response (source of truth); the UI never re-computes pricing.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { cartService } from '../services/cart';
import { useAuth } from './AuthContext';

const EMPTY_CART = {
  items: [],
  item_count: 0,
  subtotal: 0,
  shipping_cost: 0,
  tax_amount: 0,
  total_amount: 0,
  free_shipping_eligible: false,
  amount_to_free_shipping: 0,
  free_shipping_threshold: 0,
  has_unavailable_items: false,
  currency: 'INR',
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated, token } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(EMPTY_CART);
      return EMPTY_CART;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await cartService.get();
      const next = data || EMPTY_CART;
      setCart(next);
      return next;
    } catch (err) {
      setError(err.message || 'Unable to load your cart.');
      return EMPTY_CART;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setCart(EMPTY_CART);
    if (isAuthenticated) load();
  }, [isAuthenticated, token, load]);

  const addItem = useCallback(
    async (productId, quantity = 1) => {
      if (!isAuthenticated) throw new Error('Please sign in to add items to your bag.');
      setLoading(true);
      try {
        const data = await cartService.addItem(productId, quantity);
        setCart(data || EMPTY_CART);
        return data;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated],
  );

  const updateItem = useCallback(
    async (productId, quantity) => {
      setLoading(true);
      try {
        const data = await cartService.updateItem(productId, quantity);
        setCart(data || EMPTY_CART);
        return data;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const removeItem = useCallback(async (productId) => {
    setLoading(true);
    try {
      const data = await cartService.removeItem(productId);
      setCart(data || EMPTY_CART);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      await cartService.clear();
      setCart(EMPTY_CART);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      itemCount: cart?.item_count || 0,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      reload: load,
    }),
    [cart, loading, error, addItem, updateItem, removeItem, clearCart, load],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider.');
  return ctx;
}
