"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/lib/api-services";
import { getErrorMessage } from "@/lib/api";

const schema = z.object({
 full_name: z.string().min(2, "Name must be at least 2 characters"),
 email: z.string().email("Valid email required"),
 password: z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[0-9]/, "At least one number"),
});
type FormData = z.infer < typeof schema > ;

const passwordRules = [
 { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
 { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
 { label: "One number", test: (v: string) => /[0-9]/.test(v) },
];

export default function RegisterPage() {
 const router = useRouter();
 const [showPassword, setShowPassword] = useState(false);
 const [error, setError] = useState("");
 const [success, setSuccess] = useState(false);
 
 const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm < FormData > ({
  resolver: zodResolver(schema),
 });
 
 const password = watch("password", "");
 
 const onSubmit = async (data: FormData) => {
  setError("");
  try {
   await authService.register(data);
   setSuccess(true);
  } catch (e) {
   setError(getErrorMessage(e));
  }
 };
 
 if (success) {
  return (
   <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border rounded-2xl p-8 shadow-sm max-w-sm w-full text-center"
        >
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Check your email</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We sent a confirmation link to your email. Click it to activate your account.
          </p>
          <Link href="/auth/login">
            <Button className="w-full">Back to sign in</Button>
          </Link>
        </motion.div>
      </div>
  );
 }
 
 return (
  <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="bg-card border rounded-2xl p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Create account</h1>
            <p className="text-sm text-muted-foreground mt-1">Start shopping today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" placeholder="John Doe" {...register("full_name")} />
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength */}
              {password && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-1 mt-2"
                >
                  {passwordRules.map((rule) => {
                    const passed = rule.test(password);
                    return (
                      <li key={rule.label} className="flex items-center gap-2 text-xs">
                        {passed
                          ? <Check className="h-3 w-3 text-green-500" />
                          : <X className="h-3 w-3 text-muted-foreground" />}
                        <span className={passed ? "text-green-600" : "text-muted-foreground"}>
                          {rule.label}
                        </span>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-foreground font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
 );
}