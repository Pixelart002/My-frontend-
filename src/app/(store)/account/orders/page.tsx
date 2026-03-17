"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, ChevronRight } from "lucide-react";
import { orderService } from "@/lib/api-services";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate, getOrderStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

export default function AccountOrdersPage() {
 const qc = useQueryClient();
 const [page, setPage] = useState(1);
 
 const { data, isLoading } = useQuery({
  queryKey: ["my-orders", page],
  queryFn: () => orderService.myOrders(page, 10),
 });
 
 const cancelMutation = useMutation({
  mutationFn: orderService.cancelOrder,
  onSuccess: () => qc.invalidateQueries({ queryKey: ["my-orders"] }),
 });
 
 return (
  <div className="container mx-auto px-4 py-10 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">My orders</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3" />
          <p className="mb-4">No orders yet</p>
          <Link href="/products"><Button variant="outline">Start shopping</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((order: Order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.order_items?.length ?? 0} item(s) · {formatPrice(order.total_amount)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getOrderStatusColor(order.status))}>
                    {order.status}
                  </span>
                  {order.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-destructive border-destructive/30"
                      onClick={() => cancelMutation.mutate(order.id)}
                      disabled={cancelMutation.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
              {order.tracking_number && (
                <p className="text-xs text-muted-foreground mt-2">
                  Tracking: {order.tracking_number}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
 );
}