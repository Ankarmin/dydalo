"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { purchasesStore } from "@/lib/stores/data-store.purchases";
import { PURCHASE_STATUS_LABELS, PURCHASE_STATUS_STYLES, type PurchaseStatus } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/utils";
import { formatPrice } from "@/lib/utils/format";

export function ComprasClient() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PurchaseStatus | "todos">("todos");

  const purchases = purchasesStore.getAll();

  const filtered = useMemo(() => {
    let result = purchases;
    if (status !== "todos") result = result.filter((p) => p.status === status);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) => p.code.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [purchases, status, query]);

  function totalOf(code: string): number {
    const found = purchases.find((p) => p.code === code);
    if (!found) return 0;
    return found.lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Compras</h1>
          <p className="text-sm text-muted-foreground">
            {purchases.filter((p) => p.status === "pendiente").length} pendientes · {purchases.filter((p) => p.status === "parcial").length} parciales
          </p>
        </div>
        <Button asChild>
          <Link href={`${ROUTES.adminCompras}/nueva`}>
            <Plus className="size-4" /> Nueva compra
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por código o proveedor..." className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as PurchaseStatus | "todos")}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
            <SelectItem value="recibida">Recibida</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[680px]">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">OC</th>
              <th className="px-3 py-2 font-medium">Proveedor</th>
              <th className="px-3 py-2 font-medium">Avance</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const ordered = p.lines.reduce((s, l) => s + l.quantity, 0);
              const received = p.lines.reduce((s, l) => s + l.receivedQuantity, 0);
              return (
                <tr key={p.id} className="border-b border-border text-sm last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Link href={ROUTES.adminCompraDetalle(p.id)} className="font-mono text-xs text-accent hover:underline">
                      {p.code}
                    </Link>
                    <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("es-PE")}</p>
                  </td>
                  <td className="px-3 py-2">{p.supplierName}</td>
                  <td className="px-3 py-2 text-xs">{received}/{ordered} uds</td>
                  <td className="px-3 py-2 font-medium">{formatPrice(totalOf(p.code))}</td>
                  <td className="px-3 py-2">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs", PURCHASE_STATUS_STYLES[p.status])}>
                      {PURCHASE_STATUS_LABELS[p.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Sin compras para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
