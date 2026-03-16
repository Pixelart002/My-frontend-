"use client";

import Link from "next/link";
import { ShoppingCart, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/OptimizedImage";
import { cn, formatPrice, getDiscountPercent } from "@/lib/utils";

interface ProductCardProps {
 product: Product;
 className ? : string;
 priority ? : boolean;
}

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
 const { addItem, itemCount } = useCartStore();
 const [isAdding, setIsAdding] = useState(false);
 const inCart = itemCount(product.id) > 0;
 
 const handleAddToCart = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsAdding(true);
  addItem(product);
  setTimeout(() => setIsAdding(false), 600);
 };
 
 const discountPct = product.compare_price ? getDiscountPercent(product.price, product.compare_price) : null;
 const isLowStock = product.stock > 0 && product.stock <= product.low_stock_threshold;
 const isOutOfStock = product.stock === 0;
 
 return (
  <Link href={`/products/${product.slug}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn("group relative rounded-2xl border bg-card overflow-hidden hover:shadow-lg transition-shadow", className)}
      >
        {/* Image — lazy loaded, shimmer placeholder, auto WebP */}
        <div className="relative overflow-hidden">
          <ProductImage src={product.image_url} alt={product.name} priority={priority} />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {discountPct && (
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">-{discountPct}%</span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">Low stock</span>
            )}
            {isOutOfStock && (
              <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">Out of stock</span>
            )}
          </div>

          {/* Hover actions */}
          <div className="absolute bottom-2 inset-x-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Button size="sm" className="flex-1 text-xs" onClick={handleAddToCart} disabled={isOutOfStock || isAdding}>
              {isAdding ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs">Added!</motion.span>
              ) : (
                <><ShoppingCart className="h-3 w-3 mr-1" />{inCart ? "Add more" : "Add to cart"}</>
              )}
            </Button>
            <Button size="sm" variant="secondary" className="px-2"><Eye className="h-3 w-3" /></Button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          {product.categories && (
            <p className="text-xs text-muted-foreground mb-1">{product.categories.name}</p>
          )}
          <h3 className="font-medium text-sm leading-tight mb-2 line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{formatPrice(product.price)}</span>
            {product.compare_price && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compare_price)}</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
 );
}

export function ProductCardSkeleton() {
 return (
  <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-16 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-4 w-2/3 skeleton rounded" />
        <div className="h-5 w-20 skeleton rounded" />
      </div>
    </div>
 );
}