/**
 * CartContext
 *
 * Owns the live cart returned by the backend.
 *
 * Important:
 * - Backend is the source of truth for pricing.
 * - Frontend never calculates subtotal, tax, shipping or total.
 * - Stale requests cannot overwrite a newer auth session.
 * - Concurrent cart operations are tracked safely.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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
  if (!cart?.items?.length) {
    return 0;
  }

  return cart.items.reduce(
    (total, item) =>
      total + Math.max(0, Number(item?.quantity) || 0),
    0,
  );
};

const normalizeCart = (data) => {
  if (!data || typeof data !== 'object') {
    return EMPTY_CART;
  }

  return {
    ...EMPTY_CART,
    ...data,
    items: Array.isArray(data.items) ? data.items : [],
  };
};

const getErrorMessage = (error, fallback) => {
  if (
    error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState(EMPTY_CART);
  const [loadingCount, setLoadingCount] = useState(0);
  const [error, setError] = useState(null);

  const sessionVersion = useRef(0);
  const loading = loadingCount > 0;

  const startOperation = useCallback(() => {
    setLoadingCount((count) => count + 1);

    return () => {
      setLoadingCount((count) => Math.max(0, count - 1));
    };
  }, []);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(EMPTY_CART);
      setError(null);
      return EMPTY_CART;
    }

    const version = sessionVersion.current;
    const stopLoading = startOperation();

    setError(null);

    try {
      const data = await cartService.get();

      if (version !== sessionVersion.current) {
        return EMPTY_CART;
      }

      const next = normalizeCart(data);
      setCart(next);

      return next;
    } catch (err) {
      if (version === sessionVersion.current) {
        setError(
          getErrorMessage(err, 'Unable to load your cart.'),
        );
      }

      return EMPTY_CART;
    } finally {
      stopLoading();
    }
  }, [isAuthenticated, startOperation]);

  /*
   * Authentication identity changes reset the cart.
   * Access-token rotation must not reload the cart: the same
   * authenticated user still owns the same server-side cart.
   */
  useEffect(() => {
    sessionVersion.current += 1;
    setCart(EMPTY_CART);
    setError(null);

    if (isAuthenticated) {
      load();
    }
  }, [isAuthenticated, load]);

  const addItem = useCallback(
    async (productId, quantity = 1) => {
      if (!isAuthenticated) {
        throw new Error('Please sign in to add items to your bag.');
      }

      if (!productId) {
        throw new Error('A valid product is required.');
      }

      const version = sessionVersion.current;
      const stopLoading = startOperation();
      setError(null);

      try {
        const data = await cartService.addItem(productId, quantity);

        if (version !== sessionVersion.current) {
          return EMPTY_CART;
        }

        const next = normalizeCart(data);
        setCart(next);
        return next;
      } catch (err) {
        if (version === sessionVersion.current) {
          setError(
            getErrorMessage(
              err,
              'Unable to add this item to your cart.',
            ),
          );
        }

        throw err;
      } finally {
        stopLoading();
      }
    },
    [isAuthenticated, startOperation],
  );

  const updateItem = useCallback(
    async (productId, quantity) => {
      if (!isAuthenticated) {
        throw new Error('Please sign in to update your bag.');
      }

      if (!productId) {
        throw new Error('A valid product is required.');
      }

      const version = sessionVersion.current;
      const stopLoading = startOperation();
      setError(null);

      try {
        const data = await cartService.updateItem(productId, quantity);

        if (version !== sessionVersion.current) {
          return EMPTY_CART;
        }

        const next = normalizeCart(data);
        setCart(next);
        return next;
      } catch (err) {
        if (version === sessionVersion.current) {
          setError(
            getErrorMessage(err, 'Unable to update your bag.'),
          );
        }

        throw err;
      } finally {
        stopLoading();
      }
    },
    [isAuthenticated, startOperation],
  );

  const removeItem = useCallback(
    async (productId) => {
      if (!isAuthenticated) {
        throw new Error('Please sign in to update your bag.');
      }

      if (!productId) {
        throw new Error('A valid product is required.');
      }

      const version = sessionVersion.current;
      const stopLoading = startOperation();
      setError(null);

      try {
        const data = await cartService.removeItem(productId);

        if (version !== sessionVersion.current) {
          return EMPTY_CART;
        }

        const next = normalizeCart(data);
        setCart(next);
        return next;
      } catch (err) {
        if (version === sessionVersion.current) {
          setError(
            getErrorMessage(err, 'Unable to remove this item.'),
          );
        }

        throw err;
      } finally {
        stopLoading();
      }
    },
    [isAuthenticated, startOperation],
  );

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to clear your bag.');
    }

    const version = sessionVersion.current;
    const stopLoading = startOperation();

    setError(null);

    let lastError = null;
    let verifiedCart = null;

    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          await cartService.clear();

          verifiedCart = normalizeCart(await cartService.get());

          if (version !== sessionVersion.current) {
            return EMPTY_CART;
          }

          if (verifiedCart.items.length === 0) {
            setCart(EMPTY_CART);
            return EMPTY_CART;
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (verifiedCart?.items?.length) {
        setCart(verifiedCart);
        throw new Error(
          'Unable to clear the cart completely. Please try again.',
        );
      }

      throw (
        lastError ||
        new Error('Unable to clear the cart. Please try again.')
      );
    } catch (err) {
      if (version === sessionVersion.current) {
        setError(
          getErrorMessage(err, 'Unable to clear the cart.'),
        );
      }

      throw err;
    } finally {
      stopLoading();
    }
  }, [isAuthenticated, startOperation]);

  const itemCount = useMemo(() => getItemCount(cart), [cart]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      itemCount,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      reload: load,
    }),
    [
      cart,
      loading,
      error,
      itemCount,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      load,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within CartProvider.');
  }

  return context;
}
