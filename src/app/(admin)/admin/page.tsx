"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Package, ShoppingCart, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { orderService, productService, userService } from "@/lib/api-services";
import { formatPrice, formatDate, getOrderStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { data: orders }   = useQuery({ queryKey: ["admin","orders"],   queryFn: () => orderService.listAll({ page_size: 10 }) });
  const { data: products } = useQuery({ queryKey: ["admin","products"], queryFn: () => productService.list({ page_size: 100 }) });
  const { data: users }    = useQuery({ queryKey: ["admin","users"],    queryFn: () => userService.listUsers(1, 100) });

  const totalRevenue = orders?.items
    .filter((o) => ["paid","shipped","delivered"].includes(o.status))
    .reduce((s, o) => s + o.total_amount, 0) ?? 0;

  const lowStockProducts = products?.items.filter(
    (p) => p.stock <= p.low_stock_threshold && p.stock > 0
  ) ?? [];

  // Simple chart data from recent orders
  const chartData = (orders?.items ?? [])
    .slice(0, 7)
    .reverse()
    .map((o) => ({
      date: formatDate(o.created_at),
      revenue: o.status !== "cancelled" ? o.total_amount : 0,
    }));

  const STATS = [
    { label: "Total revenue", value: formatPrice(totalRevenue), icon: TrendingUp, color: "text-green-600" },
    { label: "Total orders",  value: orders?.total ?? 0,        icon: ShoppingCart, color: "text-blue-600" },
    { label: "Products",      value: products?.total ?? 0,      icon: Package,      color: "text-purple-600" },
    { label: "Users",         value: users?.total ?? 0,         icon: Users,        color: "text-amber-600" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={cn("h-4 w-4", color)} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Revenue (recent orders)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => formatPrice(v)} />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#rev)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-card border rounded-xl p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" /> Low stock ({lowStockProducts.length})
            </h2>
            <ul className="space-y-2">
              {lowStockProducts.slice(0, 5).map((p) => (
                <li key={p.id} className="flex justify-between items-center text-sm">
                  <span className="truncate">{p.name}</span>
                  <span className="text-amber-600 font-medium ml-2">{p.stock} left</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent orders */}
        <div className="bg-card border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Recent orders</h2>
          <ul className="space-y-2">
            {orders?.items.slice(0, 5).map((o) => (
              <li key={o.id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">#{o.id.slice(0, 8)}</p>
                  <p className="text-muted-foreground text-xs">{formatDate(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getOrderStatusColor(o.status))}>
                    {o.status}
                  </span>
                  <span className="font-medium">{formatPrice(o.total_amount)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}