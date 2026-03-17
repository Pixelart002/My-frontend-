"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  BarChart3, Warehouse, FileText, Download, Shield, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { clearAuthCookies } from "@/lib/api";
import { authService } from "@/lib/api-services";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/admin",             icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/products",    icon: Package,         label: "Products" },
  { href: "/admin/inventory",   icon: Warehouse,       label: "Inventory" },
  { href: "/admin/orders",      icon: ShoppingCart,    label: "Orders" },
  { href: "/admin/users",       icon: Users,           label: "Users" },
  { href: "/admin/analytics",   icon: BarChart3,       label: "Analytics" },
  { href: "/admin/billing",     icon: FileText,        label: "Billing" },
  { href: "/admin/catalog",     icon: Download,        label: "Catalog export" },
  { href: "/admin/permissions", icon: Shield,          label: "Permissions" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Role guard
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, router]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    clearAuthCookies();
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-card flex flex-col flex-shrink-0">
        <div className="p-4 border-b">
          <Link href="/admin" className="font-semibold text-sm">
            {process.env.NEXT_PUBLIC_APP_NAME} Admin
          </Link>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, icon: Icon, label }) => {
            const isActive =
              href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t">
          <div className="text-xs text-muted-foreground mb-2 px-2 truncate">
            {user?.email}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
          <Link href="/" className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            ← Back to store
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-muted/20">
        {children}
      </main>
    </div>
  );
}