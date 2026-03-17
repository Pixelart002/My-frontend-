"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductCardSkeleton } from "@/components/store/ProductCard";
import { productService } from "@/lib/api-services";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
 { icon: Zap, title: "Fast delivery", desc: "Same day in select cities" },
 { icon: Shield, title: "Secure payments", desc: "100% protected checkout" },
 { icon: Truck, title: "Free shipping", desc: "On orders above ₹75" },
];

export default function HomePage() {
 const heroRef = useRef < HTMLDivElement > (null);
 const headingRef = useRef < HTMLHeadingElement > (null);
 const subRef = useRef < HTMLParagraphElement > (null);
 const ctaRef = useRef < HTMLDivElement > (null);
 
 // Featured products
 const { data, isLoading } = useQuery({
  queryKey: ["products", "featured"],
  queryFn: () => productService.list({ page: 1, page_size: 4, in_stock: true }),
 });
 
 // GSAP hero animation
 useEffect(() => {
  if (!headingRef.current) return;
  const ctx = gsap.context(() => {
   const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
   tl.from(headingRef.current, { y: 60, opacity: 0, duration: 1 })
    .from(subRef.current, { y: 40, opacity: 0, duration: 0.8 }, "-=0.6")
    .from(ctaRef.current, { y: 30, opacity: 0, duration: 0.6 }, "-=0.5");
  }, heroRef);
  return () => ctx.revert();
 }, []);
 
 // GSAP scroll animations for features
 useEffect(() => {
  const ctx = gsap.context(() => {
   gsap.from(".feature-card", {
    scrollTrigger: {
     trigger: ".features-section",
     start: "top 80%",
    },
    y: 40,
    opacity: 0,
    duration: 0.6,
    stagger: 0.15,
    ease: "power2.out",
   });
   gsap.from(".product-card-anim", {
    scrollTrigger: {
     trigger: ".products-section",
     start: "top 80%",
    },
    y: 50,
    opacity: 0,
    duration: 0.5,
    stagger: 0.1,
    ease: "power2.out",
   });
  });
  return () => ctx.revert();
 }, [data]);
 
 return (
  <div>
      {/* Hero */}
      <section
        ref={heroRef}
        className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background to-muted"
      >
        {/* Animated background dots */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-foreground"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <h1
            ref={headingRef}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            Shop the future.{" "}
            <span className="text-muted-foreground">Today.</span>
          </h1>
          <p
            ref={subRef}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Discover curated products with seamless checkout, fast delivery, and
            exceptional quality.
          </p>
          <div ref={ctaRef} className="flex items-center justify-center gap-4">
            <Link href="/products">
              <Button size="lg" className="gap-2">
                Shop now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/categories">
              <Button variant="outline" size="lg">Browse categories</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="feature-card flex flex-col items-center text-center gap-3 p-6 rounded-2xl border bg-card"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="products-section container mx-auto px-4 pb-24">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold">Featured products</h2>
          <Link href="/products">
            <Button variant="ghost" className="gap-2">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : data?.items.map((product) => (
                <div key={product.id} className="product-card-anim">
                  <ProductCard product={product} />
                </div>
              ))}
        </div>
      </section>
    </div>
 );
}