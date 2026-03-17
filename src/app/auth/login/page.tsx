"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService, userService } from "@/lib/api-services";
import { setAuthCookies, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer < typeof schema > ;

// ─────────────────────────────────────────────────────────────────────────────
// FIX: useSearchParams() ko Suspense boundary ke andar wale component mein
// rakhna MANDATORY hai Next.js 15 mein — warna static prerendering ke time
// build crash hota hai. Isliye form alag component mein nikaala.
// ─────────────────────────────────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm < FormData > ({ resolver: zodResolver(schema) });
  
  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const res = await authService.login(data);
      setAuthCookies(res);
      const profile = await userService.getMe();
      setUser(profile);
      router.push(redirect);
      router.refresh();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };
  
  return (
    <div className="bg-card border rounded-2xl p-8 shadow-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Server error */}
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
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="text-foreground font-medium hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Suspense
          fallback={
            <div className="bg-card border rounded-2xl p-8 shadow-sm space-y-4">
              <div className="h-7 w-36 skeleton rounded" />
              <div className="h-4 w-52 skeleton rounded" />
              <div className="h-9 skeleton rounded-md" />
              <div className="h-9 skeleton rounded-md" />
              <div className="h-9 skeleton rounded-md" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </motion.div>
    </div>
  );
}