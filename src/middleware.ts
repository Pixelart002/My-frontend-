import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: `@/lib/api` se import NAHI karna — woh axios import karta hai
// aur axios Node.js APIs use karta hai jo Edge Runtime mein exist nahi karti.
// Middleware Edge Runtime mein run hoti hai, isliye import chain tod di.
// Sirf ye ek string chahiye thi — seedha define kar diya.
// ─────────────────────────────────────────────────────────────────────────────
const COOKIE_ACCESS = "ms_access";

const PROTECTED_ROUTES = ["/account", "/checkout"];
const ADMIN_ROUTES = ["/admin"];
const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/forgot-password"];

export function middleware(request: NextRequest) {
 const { pathname } = request.nextUrl;
 const accessToken = request.cookies.get(COOKIE_ACCESS)?.value;
 const isAuthenticated = !!accessToken;
 
 // Authenticated user ko auth pages pe jaane se rokna
 if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
  if (isAuthenticated) {
   return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
 }
 
 // Customer protected routes
 if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
  if (!isAuthenticated) {
   const url = new URL("/auth/login", request.url);
   url.searchParams.set("redirect", pathname);
   return NextResponse.redirect(url);
  }
  return NextResponse.next();
 }
 
 // Admin routes
 if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
  if (!isAuthenticated) {
   return NextResponse.redirect(
    new URL("/auth/login?redirect=/admin", request.url)
   );
  }
  // Role check admin layout mein API se hoti hai — middleware sirf auth check karta hai
  return NextResponse.next();
 }
 
 return NextResponse.next();
}

export const config = {
 matcher: ["/((?!_next/static|_next/image|favicon.ico|public|api).*)"],
};