import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

interface CartState {
 items: CartItem[];
 isOpen: boolean;
 
 addItem: (product: Product, quantity ? : number) => void;
 removeItem: (productId: string) => void;
 updateQuantity: (productId: string, quantity: number) => void;
 clearCart: () => void;
 toggleCart: () => void;
 setCartOpen: (open: boolean) => void;
 
 // Computed
 totalItems: () => number;
 subtotal: () => number;
 itemCount: (productId: string) => number;
}

export const useCartStore = create < CartState > ()(
 persist(
  (set, get) => ({
   items: [],
   isOpen: false,
   
   addItem: (product, quantity = 1) => {
    const { items } = get();
    const existing = items.find((i) => i.product.id === product.id);
    if (existing) {
     set({
      items: items.map((i) =>
       i.product.id === product.id ?
       { ...i, quantity: Math.min(i.quantity + quantity, product.stock) } :
       i
      ),
      isOpen: true,
     });
    } else {
     set({ items: [...items, { product, quantity }], isOpen: true });
    }
   },
   
   removeItem: (productId) =>
    set({ items: get().items.filter((i) => i.product.id !== productId) }),
   
   updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
     get().removeItem(productId);
     return;
    }
    set({
     items: get().items.map((i) =>
      i.product.id === productId ? { ...i, quantity } : i
     ),
    });
   },
   
   clearCart: () => set({ items: [] }),
   toggleCart: () => set({ isOpen: !get().isOpen }),
   setCartOpen: (isOpen) => set({ isOpen }),
   
   totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
   subtotal: () =>
    get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
   itemCount: (productId) =>
    get().items.find((i) => i.product.id === productId)?.quantity ?? 0,
  }),
  {
   name: "ms-cart",
   partialize: (state) => ({ items: state.items }),
  }
 )
);