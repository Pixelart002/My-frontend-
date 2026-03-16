"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/lib/api-services";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

export default function AdminCatalogPage() {
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const { data } = useQuery({
    queryKey: ["admin", "products", "all"],
    queryFn: () => productService.list({ page: 1, page_size: 500 }),
  });

  const products = data?.items ?? [];

  const exportExcel = async () => {
    setExporting("excel");
    try {
      const XLSX = await import("xlsx");
      const rows = products.map((p: Product) => ({
        Name: p.name,
        Slug: p.slug,
        SKU: p.sku ?? "",
        Category: p.categories?.name ?? "",
        Price: p.price,
        "Compare price": p.compare_price ?? "",
        Stock: p.stock,
        "Low stock threshold": p.low_stock_threshold,
        Active: p.is_active ? "Yes" : "No",
        "Created at": new Date(p.created_at).toLocaleDateString("en-IN"),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Products");
      XLSX.writeFile(wb, `catalog-${Date.now()}.xlsx`);
    } finally {
      setExporting(null);
    }
  };

  const exportPDF = async () => {
    setExporting("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Product Catalog", 14, 16);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")} — ${products.length} products`, 14, 23);

      autoTable(doc, {
        startY: 28,
        head: [["Name", "SKU", "Category", "Price", "Stock", "Status"]],
        body: products.map((p: Product) => [
          p.name,
          p.sku ?? "—",
          p.categories?.name ?? "—",
          formatPrice(p.price),
          p.stock,
          p.is_active ? "Active" : "Inactive",
        ]),
        headStyles: { fillColor: [30, 30, 30] },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: { 3: { halign: "right" }, 4: { halign: "center" } },
      });

      doc.save(`catalog-${Date.now()}.pdf`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Catalog export</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Download your full product catalog in Excel or PDF format.
      </p>

      <div className="flex gap-4 mb-8">
        <Button
          variant="outline"
          className="gap-2"
          onClick={exportExcel}
          disabled={!!exporting}
        >
          {exporting === "excel" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          Export Excel (.xlsx)
        </Button>

        <Button
          variant="outline"
          className="gap-2"
          onClick={exportPDF}
          disabled={!!exporting}
        >
          {exporting === "pdf" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          Export PDF
        </Button>
      </div>

      {/* Preview table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <p className="text-sm font-medium">Preview — {products.length} products</p>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.slice(0, 10).map((p: Product) => (
              <tr key={p.id} className="border-b">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2 text-muted-foreground hidden md:table-cell">{p.categories?.name ?? "—"}</td>
                <td className="px-4 py-2 text-right">{formatPrice(p.price)}</td>
                <td className="px-4 py-2 text-right">{p.stock}</td>
              </tr>
            ))}
            {products.length > 10 && (
              <tr>
                <td colSpan={4} className="px-4 py-2 text-center text-muted-foreground text-xs">
                  … and {products.length - 10} more in the export
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}