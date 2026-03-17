import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "INR"): string {
 return new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
 }).format(amount);
}

export function formatDate(dateStr: string): string {
 return new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
 }).format(new Date(dateStr));
}

export function truncate(str: string, length: number): string {
 if (str.length <= length) return str;
 return str.slice(0, length) + "…";
}

export function getDiscountPercent(price: number, comparePrice: number): number {
 return Math.round(((comparePrice - price) / comparePrice) * 100);
}

export function getOrderStatusColor(status: string): string {
 const map: Record < string, string > = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
 };
 return map[status] ?? "bg-gray-100 text-gray-800";
}

export function slugify(str: string): string {
 return str
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, "")
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-")
  .trim();
}