"use client";

import NextImage, { type ImageProps } from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { cleanImageUrl, SHIMMER_PLACEHOLDER, PRODUCT_CARD_SIZES } from "@/lib/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit < ImageProps, "src" | "placeholder" | "blurDataURL" > {
 src: string | null | undefined;
 fallbackClassName ? : string;
}

/**
 * Optimized image with:
 * - Auto URL cleaning (Supabase trailing ?)
 * - Shimmer placeholder during load
 * - Graceful fallback on error
 * - Lazy loading by default
 */
export function OptimizedImage({
 src,
 alt,
 className,
 fallbackClassName,
 sizes = PRODUCT_CARD_SIZES,
 ...props
}: OptimizedImageProps) {
 const [error, setError] = useState(false);
 const cleanSrc = cleanImageUrl(src);
 
 if (!cleanSrc || error) {
  return (
   <div
        className={cn(
          "flex items-center justify-center bg-muted",
          fallbackClassName ?? className
        )}
      >
        <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
      </div>
  );
 }
 
 return (
  <NextImage
      src={cleanSrc}
      alt={alt}
      className={className}
      sizes={sizes}
      placeholder="blur"
      blurDataURL={SHIMMER_PLACEHOLDER}
      onError={() => setError(true)}
      loading={props.priority ? "eager" : "lazy"}
      {...props}
    />
 );
}

// ── Product image variants ─────────────────────────────────────────────────────

/** Card thumbnail — aspect-square, cover */
export function ProductImage({
 src,
 alt,
 priority = false,
 className,
}: {
 src: string | null | undefined;
 alt: string;
 priority ? : boolean;
 className ? : string;
}) {
 return (
  <div className={cn("relative aspect-square overflow-hidden bg-muted", className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        priority={priority}
      />
    </div>
 );
}

/** Detail hero — large, priority */
export function ProductDetailImage({
 src,
 alt,
}: {
 src: string | null | undefined;
 alt: string;
}) {
 return (
  <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
        priority
        fallbackClassName="h-full w-full"
      />
    </div>
 );
}

/** Admin thumbnail — tiny, 40×40 */
export function AdminThumb({
 src,
 alt,
 className,
}: {
 src: string | null | undefined;
 alt: string;
 className ? : string;
}) {
 return (
  <div className={cn("relative h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0", className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes="40px"
        className="object-cover"
        fallbackClassName="h-full w-full"
      />
    </div>
 );
}