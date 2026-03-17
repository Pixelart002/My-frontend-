"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export function CartSidebar() {
 const { items, isOpen, setCartOpen, removeItem, updateQuantity, subtotal } = useCartStore();
 
 return (
  <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setCartOpen(false)}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-background shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-lg">Cart ({items.length})</h2>
              <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12" />
                  <p className="text-sm">Your cart is empty</p>
                  <Link href="/products" onClick={() => setCartOpen(false)}>
                    <Button variant="outline" size="sm">Browse products</Button>
                  </Link>
                </div>
              ) : (
                <ul className="flex flex-col gap-4">
                  {items.map(({ product, quantity }) => (
                    <motion.li
                      key={product.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-3"
                    >
                      {/* Image */}
                      <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(product.price)}
                        </p>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            className="h-6 w-6 rounded border text-xs flex items-center justify-center hover:bg-muted"
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                          >
                            −
                          </button>
                          <span className="text-sm w-6 text-center">{quantity}</span>
                          <button
                            className="h-6 w-6 rounded border text-xs flex items-center justify-center hover:bg-muted"
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            disabled={quantity >= product.stock}
                          >
                            +
                          </button>
                          <button
                            className="ml-auto text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(product.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t px-6 py-4 flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal())}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping and taxes calculated at checkout
                </p>
                <Link href="/checkout" onClick={() => setCartOpen(false)}>
                  <Button className="w-full">Checkout</Button>
                </Link>
                <Link href="/cart" onClick={() => setCartOpen(false)}>
                  <Button variant="outline" className="w-full">View cart</Button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
 );
}