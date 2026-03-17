"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────────────────────────────
// FIX: useSearchParams() Suspense boundary ke andar hona MANDATORY hai.
// Same issue jo login page mein tha — Next.js 15 build crash karta tha.
// ─────────────────────────────────────────────────────────────────────────────
function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="text-center max-w-md"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="h-10 w-10 text-green-600" />
      </motion.div>

      <h1 className="text-3xl font-bold mb-2">Order confirmed!</h1>
      <p className="text-muted-foreground mb-2">
        Thank you for your purchase. We&apos;ll send you a confirmation email
        shortly.
      </p>
      {orderId && (
        <p className="text-sm text-muted-foreground mb-8">
          Order ID:{" "}
          <span className="font-mono font-medium">
            #{orderId.slice(0, 8).toUpperCase()}
          </span>
        </p>
      )}

      <div className="flex gap-3 justify-center">
        <Link href="/account/orders">
          <Button className="gap-2">
            <Package className="h-4 w-4" /> View my orders
          </Button>
        </Link>
        <Link href="/products">
          <Button variant="outline">Continue shopping</Button>
        </Link>
      </div>
    </motion.div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────
export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}