"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { userService, orderService, paymentService } from "@/lib/api-services";
import { formatPrice } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api";
import type { Address, Order } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// DEFINITIVE FIX for "ReferenceError: location is not defined"
//
// @stripe/stripe-js module apne initialization mein `location` browser global
// access karta hai — import hote hi, loadStripe() call se bhi pehle.
// Next.js build pe /checkout static prerender hoti hai — server pe
// module load hota hai — location nahi hota — crash.
//
// next/dynamic + ssr:false = ye module server bundle mein
// exist hi nahi karega. Server ko stripe ka pata hi nahi chalega.
// ─────────────────────────────────────────────────────────────────────────────
const StripePaymentForm = dynamic(
  () => import("@/components/store/StripePaymentForm"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  
  const [selectedAddress, setSelectedAddress] = useState < string > ("");
  const [order, setOrder] = useState < Order | null > (null);
  const [clientSecret, setClientSecret] = useState < string > ("");
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [error, setError] = useState("");
  
  const { data: addresses, isLoading: loadingAddr } = useQuery({
    queryKey: ["addresses"],
    queryFn: userService.getAddresses,
  });
  
  if (items.length === 0) {
    router.replace("/cart");
    return null;
  }
  
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError("Please select a shipping address");
      return;
    }
    setCreatingOrder(true);
    setError("");
    try {
      const newOrder = await orderService.create({
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
        shipping_address_id: selectedAddress,
      });
      const { client_secret } = await paymentService.createIntent(newOrder.id);
      setOrder(newOrder);
      setClientSecret(client_secret);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setCreatingOrder(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* ── Left ────────────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {!order ? (
            <>
              <div>
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Shipping address
                </h2>

                {loadingAddr ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-20 skeleton rounded-xl" />
                    ))}
                  </div>
                ) : addresses?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No addresses saved.{" "}
                    <a href="/account/addresses" className="underline">
                      Add one
                    </a>
                  </p>
                ) : (
                  <div className="space-y-2">
                    {addresses?.map((addr: Address) => (
                      <label
                        key={addr.id}
                        className={`flex gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                          selectedAddress === addr.id
                            ? "border-foreground bg-muted"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddress === addr.id}
                          onChange={() => setSelectedAddress(addr.id)}
                          className="mt-0.5"
                        />
                        <div className="text-sm">
                          <p className="font-medium">{addr.line1}</p>
                          {addr.line2 && (
                            <p className="text-muted-foreground">{addr.line2}</p>
                          )}
                          <p className="text-muted-foreground">
                            {addr.city}, {addr.state} {addr.postal_code},{" "}
                            {addr.country}
                          </p>
                          {addr.is_default && (
                            <span className="text-xs text-blue-600 font-medium">
                              Default
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button
                className="w-full"
                onClick={handlePlaceOrder}
                disabled={creatingOrder || !selectedAddress}
              >
                {creatingOrder ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Continue to payment"
                )}
              </Button>
            </>
          ) : (
            <div>
              <h2 className="font-semibold mb-4">Payment</h2>
              {clientSecret && (
                <StripePaymentForm
                  order={order}
                  clientSecret={clientSecret}
                  onSuccess={() => {
                    clearCart();
                    router.push(`/checkout/success?order=${order.id}`);
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Right: Order summary ─────────────────────────────────────────── */}
        <div>
          <div className="border rounded-2xl p-6 bg-card sticky top-24">
            <h2 className="font-semibold mb-4">Order summary</h2>
            <ul className="space-y-3 mb-4">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {product.name} × {quantity}
                  </span>
                  <span>{formatPrice(product.price * quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{subtotal() >= 75 ? "Free" : formatPrice(9.99)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (8%)</span>
                <span>{formatPrice(subtotal() * 0.08)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total</span>
                <span>
                  {formatPrice(
                    subtotal() * 1.08 + (subtotal() >= 75 ? 0 : 9.99)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}