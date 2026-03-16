"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/lib/api-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, formatDate, getOrderStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

const STATUSES = ["", "pending", "paid", "shipped", "delivered", "cancelled", "refunded"];

export default function AdminOrdersPage() {
 const qc = useQueryClient();
 const [page, setPage] = useState(1);
 const [statusFilter, setStatusFilter] = useState("");
 const [trackingInputs, setTrackingInputs] = useState < Record < string, string >> ({});
 
 const { data, isLoading } = useQuery({
  queryKey: ["admin", "orders", page, statusFilter],
  queryFn: () => orderService.listAll({ page, page_size: 20, status_filter: statusFilter || undefined }),
 });
 
 const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: string;data: { status ? : string;tracking_number ? : string } }) =>
   orderService.adminUpdate(id, data),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
 });
 
 return (
  <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        {data && <p className="text-sm text-muted-foreground">{data.total} total</p>}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUSES.map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s || "All"}
          </Button>
        ))}
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tracking</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {[1,2,3,4,5,6].map((c) => (
                      <td key={c} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>
                    ))}
                  </tr>
                ))
              : data?.items.map((order: Order) => {
                  const tracking = trackingInputs[order.id] ?? order.tracking_number ?? "";
                  return (
                    <tr key={order.id} className="border-b hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {order.users?.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getOrderStatusColor(order.status))}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatPrice(order.total_amount)}</td>
                      <td className="px-4 py-3">
                        <Input
                          placeholder="Add tracking..."
                          className="h-7 text-xs w-36"
                          value={tracking}
                          onChange={(e) => setTrackingInputs((p) => ({ ...p, [order.id]: e.target.value }))}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {["paid","shipped","delivered","cancelled"].map((s) => {
                            if (s === order.status) return null;
                            return (
                              <Button
                                key={s}
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() =>
                                  updateMutation.mutate({
                                    id: order.id,
                                    data: { status: s, tracking_number: tracking || undefined },
                                  })
                                }
                              >
                                {s}
                              </Button>
                            );
                          })}
                          {tracking !== (order.tracking_number ?? "") && (
                            <Button
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() =>
                                updateMutation.mutate({ id: order.id, data: { tracking_number: tracking } })
                              }
                            >
                              Save
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {data.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
 );
}