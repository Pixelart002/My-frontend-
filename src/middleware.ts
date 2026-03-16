import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_ACCESS } from "@/lib/api";

// Routes that require authentication
const PROTECTED_ROUTES = ["/account", "/checkout"];

// Routes that require admin role
const ADMIN_ROUTES = ["/admin"];

// Routes only for unauthenticated users
const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/forgot-password"];

export function middleware(request: NextRequest) {
 const { pathname } = request.nextUrl;
 const accessToken = request.cookies.get(COOKIE_ACCESS)?.value;
 const isAuthenticated = !!accessToken;
 
 // Redirect authenticated users away from auth pages
 if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
  if (isAuthenticated) {
   return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
 }
 
 // Protect customer routes
 if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
  if (!isAuthenticated) {
   const url = new URL("/auth/login", request.url);
   url.searchParams.set("redirect", pathname);
   return NextResponse.redirect(url);
  }
  return NextResponse.next();
 }
 
 // Protect admin routes
 if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
  if (!isAuthenticated) {
   return NextResponse.redirect(new URL("/auth/login?redirect=/admin", request.url));
  }
  // Note: role check happens on the admin layout via API — middleware only checks auth
  return NextResponse.next();
 }
 
 return NextResponse.next();
}

export const config = {
 matcher: [
  "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
 ],
};