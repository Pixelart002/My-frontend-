"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
 Elements,
 PaymentElement,
 useStripe,
 useElements,
} from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

// Safe hai — ye file sirf browser pe load hoti hai (ssr:false dynamic import)
const stripePromise = loadStripe(
 process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

function PaymentForm({
 order,
 onSuccess,
}: {
 order: Order;
 onSuccess: () => void;
}) {
 const stripe = useStripe();
 const elements = useElements();
 const [error, setError] = useState("");
 const [processing, setProcessing] = useState(false);
 
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!stripe || !elements) return;
  setProcessing(true);
  setError("");
  
  const { error: stripeError } = await stripe.confirmPayment({
   elements,
   confirmParams: {
    return_url: `${window.location.origin}/checkout/success?order=${order.id}`,
   },
  });
  
  if (stripeError) {
   setError(stripeError.message ?? "Payment failed");
   setProcessing(false);
  } else {
   onSuccess();
  }
 };
 
 return (
  <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={!stripe || processing}>
        {processing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          `Pay ${formatPrice(order.total_amount)}`
        )}
      </Button>
    </form>
 );
}

export default function StripePaymentForm({
 order,
 clientSecret,
 onSuccess,
}: {
 order: Order;
 clientSecret: string;
 onSuccess: () => void;
}) {
 return (
  <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm order={order} onSuccess={onSuccess} />
    </Elements>
 );
}