"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { suppliersStore } from "@/lib/stores/data-store.suppliers";
import { purchasesStore } from "@/lib/stores/data-store.purchases";
import { PURCHASE_STATUS_LABELS, PURCHASE_STATUS_STYLES } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";

export function ProveedorDetalleClient({ id }: { id: string }) {
  const [, setTick] = useState(0);
  const supplier = suppliersStore.getById(id);
  const orders = purchasesStore.getAll().filter((p) => p.supplierId === id);

  if (!supplier) {
    return (
      <div className="space-y-4">
        <Link href={ROUTES.adminProveedores} className="text-sm text-accent hover:underline">
          ← Volver a proveedores
        </Link>
        <p className="text-sm text-muted-foreground">Proveedor no encontrado.</p>
      </div>
    );
  }
  void setTick;

  return (
    <div className="space-y-6">
      <Link href={ROUTES.adminProveedores} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a proveedores
      </Link>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">{supplier.name}</h1>
          <p className="text-sm text-muted-foreground">
            {supplier.contact ?? "—"} {supplier.phone ? `· ${supplier.phone}` : ""}
          </p>
          {supplier.notes && <p className="text-sm text-muted-foreground">{supplier.notes}</p>}
        </div>
        <Button asChild>
          <Link href={`${ROUTES.adminCompras}/nueva?proveedor=${supplier.id}`}>Nueva compra</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">OC</th>
              <th className="px-3 py-2 font-medium">Líneas</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border text-sm last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2">
                  <Link href={ROUTES.adminCompraDetalle(o.id)} className="font-mono text-xs text-accent hover:underline">
                    {o.code}
                  </Link>
                </td>
                <td className="px-3 py-2">{o.lines.length}</td>
                <td className="px-3 py-2">
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs", PURCHASE_STATUS_STYLES[o.status])}>
                    {PURCHASE_STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("es-PE")}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Sin compras a este proveedor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
