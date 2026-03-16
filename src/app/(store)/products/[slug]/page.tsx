"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShoppingCart, Minus, Plus, ArrowLeft, Package } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { productService } from "@/lib/api-services";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Product3DViewer } from "@/components/3d/Product3DViewer";
import { formatPrice, getDiscountPercent } from "@/lib/utils";

export default function ProductDetailPage() {
 const { slug } = useParams < { slug: string } > ();
 const [quantity, setQuantity] = useState(1);
 const [added, setAdded] = useState(false);
 const { addItem, itemCount } = useCartStore();
 
 const { data: product, isLoading } = useQuery({
  queryKey: ["product", slug],
  queryFn: () => productService.getBySlug(slug),
 });
 
 if (isLoading) {
  return (
   <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 skeleton rounded" />
            <div className="h-4 w-1/3 skeleton rounded" />
            <div className="h-6 w-1/4 skeleton rounded" />
            <div className="h-20 skeleton rounded" />
          </div>
        </div>
      </div>
  );
 }
 
 if (!product) {
  return (
   <div className="container mx-auto px-4 py-20 text-center">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Product not found</h2>
        <Link href="/products">
          <Button variant="outline">Browse products</Button>
        </Link>
      </div>
  );
 }
 
 const discount = product.compare_price ?
  getDiscountPercent(product.price, product.compare_price) :
  null;
 
 const isOutOfStock = product.stock === 0;
 const inCart = itemCount(product.id);
 
 const handleAddToCart = () => {
  addItem(product, quantity);
  setAdded(true);
  setTimeout(() => setAdded(false), 1500);
 };
 
 return (
  <div className="container mx-auto px-4 py-10">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image / 3D Viewer */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="aspect-square rounded-2xl overflow-hidden border bg-muted relative">
            {product.image_url ? (
              <Image
                src={product.image_url.replace("?", "")}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <Suspense fallback={<div className="h-full w-full skeleton" />}>
                <Product3DViewer name={product.name} />
              </Suspense>
            )}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-6"
        >
          {product.categories && (
            <Link
              href={`/categories/${product.categories.slug}`}
              className="text-sm text-muted-foreground hover:text-foreground w-fit"
            >
              {product.categories.name}
            </Link>
          )}

          <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.compare_price && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.compare_price)}
                </span>
                <span className="bg-red-100 text-red-700 text-sm font-medium px-2 py-0.5 rounded-full">
                  -{discount}%
                </span>
              </>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isOutOfStock ? "bg-red-500" :
                product.stock <= product.low_stock_threshold ? "bg-amber-500" : "bg-green-500"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {isOutOfStock
                ? "Out of stock"
                : product.stock <= product.low_stock_threshold
                ? `Only ${product.stock} left`
                : "In stock"}
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {/* Quantity + Add to cart */}
          {!isOutOfStock && (
            <div className="flex gap-3">
              <div className="flex items-center border rounded-xl">
                <button
                  className="px-3 py-2 hover:bg-muted"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 text-sm font-medium">{quantity}</span>
                <button
                  className="px-3 py-2 hover:bg-muted"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                className="flex-1 gap-2"
                onClick={handleAddToCart}
                disabled={added}
              >
                {added ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    Added to cart!
                  </motion.span>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    {inCart > 0 ? `Add more (${inCart} in cart)` : "Add to cart"}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* SKU */}
          {product.sku && (
            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
          )}
        </motion.div>
      </div>
    </div>
 );
}