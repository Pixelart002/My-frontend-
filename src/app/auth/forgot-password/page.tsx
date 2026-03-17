"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/lib/api-services";

const schema = z.object({ email: z.string().email("Valid email required") });
type FormData = z.infer < typeof schema > ;

export default function ForgotPasswordPage() {
 const [sent, setSent] = useState(false);
 
 const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm < FormData > ({
  resolver: zodResolver(schema),
 });
 
 const onSubmit = async (data: FormData) => {
  await authService.forgotPassword(data.email);
  setSent(true); // Always show success — anti-enumeration
 };
 
 return (
  <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="bg-card border rounded-2xl p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <MailCheck className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
              <p className="text-sm text-muted-foreground mb-6">
                If that email exists, a reset link has been sent.
              </p>
              <Link href="/auth/login">
                <Button className="w-full">Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="flex items-center gap-2 text-sm text-muted-foreground mb-6 hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
              <h1 className="text-2xl font-bold mb-1">Forgot password?</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your email and we&apos;ll send a reset link.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
 );
}