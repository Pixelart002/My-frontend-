"use client";

import { useState } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

export default function AdminBillingPage() {
  const [customerName, setCustomerName]   = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddr, setCustomerAddr]   = useState("");
  const [invoiceNo, setInvoiceNo]         = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [items, setItems]                 = useState<InvoiceItem[]>([
    { description: "", quantity: 1, price: 0 },
  ]);
  const [generating, setGenerating]       = useState(false);

  const addRow = () =>
    setItems([...items, { description: "", quantity: 1, price: 0 }]);

  const updateItem = (idx: number, field: keyof InvoiceItem, value: string | number) =>
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));

  const removeRow = (idx: number) =>
    setItems(items.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const tax      = subtotal * 0.18; // GST 18%
  const total    = subtotal + tax;

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.width;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("TAX INVOICE", pageW / 2, 20, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice No: ${invoiceNo}`, 14, 35);
      doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 14, 42);

      // Bill to
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", 14, 55);
      doc.setFont("helvetica", "normal");
      doc.text(customerName || "—", 14, 62);
      doc.text(customerEmail || "—", 14, 68);
      if (customerAddr) doc.text(customerAddr, 14, 74);

      // Items table
      autoTable(doc, {
        startY: 85,
        head: [["Description", "Qty", "Unit price", "Amount"]],
        body: items
          .filter((i) => i.description)
          .map((i) => [
            i.description,
            i.quantity,
            formatPrice(i.price),
            formatPrice(i.quantity * i.price),
          ]),
        foot: [
          ["", "", "Subtotal", formatPrice(subtotal)],
          ["", "", "GST (18%)", formatPrice(tax)],
          ["", "", "Total", formatPrice(total)],
        ],
        footStyles: { fontStyle: "bold" },
        headStyles: { fillColor: [40, 40, 40] },
      });

      doc.save(`${invoiceNo}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileText className="h-6 w-6" /> Manual bill generator
      </h1>

      <div className="space-y-6">
        {/* Invoice details */}
        <div className="bg-card border rounded-xl p-4 grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Invoice number</Label>
            <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Customer name</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Rahul Sharma" />
          </div>
          <div className="space-y-1.5">
            <Label>Customer email</Label>
            <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="rahul@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input value={customerAddr} onChange={(e) => setCustomerAddr(e.target.value)} placeholder="Mumbai, MH" />
          </div>
        </div>

        {/* Line items */}
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground w-20">Qty</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground w-28">Price (₹)</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground w-28">Amount</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-2 py-2">
                    <Input
                      className="h-8"
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      placeholder="Product or service"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      className="h-8 text-right"
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      className="h-8 text-right"
                      type="number"
                      min={0}
                      value={item.price}
                      onChange={(e) => updateItem(idx, "price", Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatPrice(item.quantity * item.price)}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(idx)}
                      disabled={items.length <= 1}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t">
            <Button variant="outline" size="sm" onClick={addRow}>+ Add row</Button>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-card border rounded-xl p-4 ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST (18%)</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <Button className="gap-2 w-full md:w-auto" onClick={generatePDF} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download PDF invoice
        </Button>
      </div>
    </div>
  );
}