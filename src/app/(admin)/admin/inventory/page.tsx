"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Package, CheckCircle } from "lucide-react";
import { productService } from "@/lib/api-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/types";

export default function AdminInventoryPage() {
  const qc = useQueryClient();
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
  const [thresholdInputs, setThresholdInputs] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["admin", "products", "inventory"],
    queryFn: () => productService.list({ page: 1, page_size: 200 }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { stock?: number; low_stock_threshold?: number } }) =>
      productService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });

  const products = data?.items ?? [];
  const lowStock = products.filter((p) => p.stock <= p.low_stock_threshold && p.stock > 0);
  const outOfStock = products.filter((p) => p.stock === 0);
  const healthy = products.filter((p) => p.stock > p.low_stock_threshold);

  const handleSave = (product: Product) => {
    const newStock = stockInputs[product.id];
    const newThreshold = thresholdInputs[product.id];
    if (!newStock && !newThreshold) return;
    updateMutation.mutate({
      id: product.id,
      data: {
        ...(newStock !== undefined ? { stock: Number(newStock) } : {}),
        ...(newThreshold !== undefined ? { low_stock_threshold: Number(newThreshold) } : {}),
      },
    });
    setStockInputs((p) => { const n = {...p}; delete n[product.id]; return n; });
    setThresholdInputs((p) => { const n = {...p}; delete n[product.id]; return n; });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Inventory management</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 dark:bg-red-950 dark:border-red-800">
          <p className="text-sm text-red-600 font-medium mb-1 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Out of stock
          </p>
          <p className="text-2xl font-bold text-red-700">{outOfStock.length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 dark:bg-amber-950 dark:border-amber-800">
          <p className="text-sm text-amber-600 font-medium mb-1 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Low stock
          </p>
          <p className="text-2xl font-bold text-amber-700">{lowStock.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 dark:bg-green-950 dark:border-green-800">
          <p className="text-sm text-green-600 font-medium mb-1 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" /> Healthy
          </p>
          <p className="text-2xl font-bold text-green-700">{healthy.length}</p>
        </div>
      </div>

      {/* All products inventory table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Current stock</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Set stock</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Threshold</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {[...outOfStock, ...lowStock, ...healthy].map((product: Product) => {
              const isOut = product.stock === 0;
              const isLow = !isOut && product.stock <= product.low_stock_threshold;
              const hasChanges = stockInputs[product.id] !== undefined || thresholdInputs[product.id] !== undefined;

              return (
                <tr key={product.id} className="border-b hover:bg-muted/10">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-center">
                    {isOut ? (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Out of stock</span>
                    ) : isLow ? (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Low</span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">OK</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    <span className={isOut ? "text-red-600" : isLow ? "text-amber-600" : ""}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Input
                      type="number"
                      className="h-7 w-20 text-center mx-auto"
                      placeholder={String(product.stock)}
                      value={stockInputs[product.id] ?? ""}
                      onChange={(e) =>
                        setStockInputs((p) => ({ ...p, [product.id]: e.target.value }))
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Input
                      type="number"
                      className="h-7 w-20 text-center mx-auto"
                      placeholder={String(product.low_stock_threshold)}
                      value={thresholdInputs[product.id] ?? ""}
                      onChange={(e) =>
                        setThresholdInputs((p) => ({ ...p, [product.id]: e.target.value }))
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      disabled={!hasChanges || updateMutation.isPending}
                      onClick={() => handleSave(product)}
                    >
                      Update
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}