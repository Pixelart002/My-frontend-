"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import Lenis from "lenis";

const geistSans = Geist({
 variable: "--font-geist-sans",
 subsets: ["latin"],
});

const geistMono = Geist_Mono({
 variable: "--font-geist-mono",
 subsets: ["latin"],
});

function Providers({ children }: { children: React.ReactNode }) {
 const [queryClient] = useState(
  () =>
  new QueryClient({
   defaultOptions: {
    queries: {
     staleTime: 60 * 1000,
     retry: 1,
    },
   },
  })
 );
 
 // Lenis smooth scroll init
 useEffect(() => {
  const lenis = new Lenis({
   duration: 1.2,
   easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
   smoothWheel: true,
  });
  
  function raf(time: number) {
   lenis.raf(time);
   requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  
  return () => lenis.destroy();
 }, []);
 
 return (
  <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
 );
}

export default function RootLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
  <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
 );
}