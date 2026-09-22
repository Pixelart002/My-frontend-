/**
 * CartContext — holds the live cart returned by the backend and exposes
 * actions that call the real cart endpoints. Totals are always taken from the
 * backend response (source of truth); the UI never re-computes pricing.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

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

const getItemCount = (cart) => {
  if (!cart) return 0;
  // The UI badge is a unit count: one product with quantity 3 shows 3.
  // Deriving it from item quantities also stays correct if an older backend
  // response omits or misreports the aggregate item_count field.
  return (cart.items || []).reduce(
    (total, item) => total + Math.max(0, Number(item.quantity) || 0),
    0,
  );
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated, token } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const sessionVersion = useRef(0);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(EMPTY_CART);
      return EMPTY_CART;
    }
    const version = sessionVersion.current;
    setLoading(true);
    setError(null);
    try {
      const data = await cartService.get();
      const next = data || EMPTY_CART;
      if (version !== sessionVersion.current) return EMPTY_CART;
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
    sessionVersion.current += 1;
    setCart(EMPTY_CART);
    setError(null);
    if (isAuthenticated) load();
  }, [isAuthenticated, token, load]);

  const addItem = useCallback(
    async (productId, quantity = 1) => {
      if (!isAuthenticated) throw new Error('Please sign in to add items to your bag.');
      const version = sessionVersion.current;
      setLoading(true);
      try {
        const data = await cartService.addItem(productId, quantity);
        if (version !== sessionVersion.current) return EMPTY_CART;
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
      if (!isAuthenticated) throw new Error('Please sign in to update your bag.');
      const version = sessionVersion.current;
      setLoading(true);
      try {
        const data = await cartService.updateItem(productId, quantity);
        if (version !== sessionVersion.current) return EMPTY_CART;
        setCart(data || EMPTY_CART);
        return data;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated],
  );

  const removeItem = useCallback(async (productId) => {
    if (!isAuthenticated) throw new Error('Please sign in to update your bag.');
    const version = sessionVersion.current;
    setLoading(true);
    try {
      const data = await cartService.removeItem(productId);
      if (version !== sessionVersion.current) return EMPTY_CART;
      setCart(data || EMPTY_CART);
      return data;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const clearCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // DELETE /cart is intentionally followed by a fresh GET. This prevents
      // the UI from claiming the cart is empty when a transient request or
      // backend write leaves stale line items behind.
      const version = sessionVersion.current;
      let verifiedCart = null;
      let lastError = null;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          await cartService.clear();
          verifiedCart = await cartService.get();
          if (version !== sessionVersion.current) return EMPTY_CART;
          if (!verifiedCart?.items?.length) {
            setCart(EMPTY_CART);
            return EMPTY_CART;
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (verifiedCart?.items?.length) {
        setCart(verifiedCart);
        throw new Error('Unable to clear the cart completely. Please try again.');
      }
      throw lastError || new Error('Unable to clear the cart. Please try again.');
    } catch (err) {
      setError(err.message || 'Unable to clear the cart.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      itemCount: getItemCount(cart),
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
  if (!ctx) throw new Error('useCart must be used within CartProvider.');
  return ctx;
}
