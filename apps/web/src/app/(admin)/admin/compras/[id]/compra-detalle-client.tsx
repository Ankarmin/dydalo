"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { purchasesStore } from "@/lib/stores/data-store.purchases";
import { useAuth } from "@/contexts/auth-context";
import { PURCHASE_STATUS_LABELS, PURCHASE_STATUS_STYLES } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { cn } from "@/lib/utils/utils";
import { formatPrice } from "@/lib/utils/format";

export function CompraDetalleClient({ id }: { id: string }) {
  const { state: authState } = useAuth();
  const [order, setOrder] = useState(() => purchasesStore.getById(id));
  const [receiveQty, setReceiveQty] = useState<Record<string, number>>({});
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!order) {
    return (
      <div className="space-y-4">
        <Link href={ROUTES.adminCompras} className="text-sm text-accent hover:underline">
          ← Volver a compras
        </Link>
        <p className="text-sm text-muted-foreground">Compra no encontrada.</p>
      </div>
    );
  }

  const total = order.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
  const editable = order.status === "pendiente" || order.status === "parcial";

  function actor() {
    return { actorId: authState.user?.id ?? "admin", actorName: authState.user?.name ?? "Admin" };
  }

  function handleReceive() {
    const current = purchasesStore.getById(id);
    if (!current) return;
    const a = actor();
    const lines = current.lines
      .map((l) => ({ productId: l.productId, quantity: receiveQty[l.productId] ?? 0 }))
      .filter((l) => l.quantity > 0);
    if (lines.length === 0) {
      notifyAdmin("Sin cantidades", "Indica cuánto recibes por línea.", "error");
      return;
    }
    const result = purchasesStore.receive(current.id, { lines, actorId: a.actorId, actorName: a.actorName });
    if (!result.success) {
      notifyAdmin("No se pudo recibir", result.error, "error");
      return;
    }
    setOrder(result.data);
    setReceiveQty({});
    notifyAdmin("Recepción registrada", `${result.data.code} · ${result.data.status}`, "success");
  }

  function handleCancel() {
    const current = purchasesStore.getById(id);
    if (!current) return;
    const a = actor();
    const updated = purchasesStore.cancel(current.id, a.actorId, a.actorName);
    if (!updated) {
      notifyAdmin("No se pudo cancelar", "La compra ya está cerrada.", "error");
      return;
    }
    setOrder(updated);
    setConfirmCancel(false);
    notifyAdmin("Compra cancelada", updated.code, "success");
  }

  return (
    <div className="space-y-6">
      <Link href={ROUTES.adminCompras} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a compras
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">{order.code}</h1>
          <p className="text-sm text-muted-foreground">
            {order.supplierName} · Total {formatPrice(total)} · por {order.createdByName}
          </p>
          {order.note && <p className="text-sm text-muted-foreground">Nota: {order.note}</p>}
        </div>
        <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", PURCHASE_STATUS_STYLES[order.status])}>
          {PURCHASE_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[620px]">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Producto</th>
              <th className="px-3 py-2 font-medium">Pedidas</th>
              <th className="px-3 py-2 font-medium">Recibidas</th>
              <th className="px-3 py-2 font-medium">Costo unit.</th>
              {editable && <th className="px-3 py-2 font-medium">Recibir ahora</th>}
            </tr>
          </thead>
          <tbody>
            {order.lines.map((l) => {
              const pending = l.quantity - l.receivedQuantity;
              return (
                <tr key={l.productId} className="border-b border-border text-sm last:border-0">
                  <td className="px-3 py-2 font-medium">{l.productName}</td>
                  <td className="px-3 py-2">{l.quantity}</td>
                  <td className="px-3 py-2">{l.receivedQuantity}</td>
                  <td className="px-3 py-2">{formatPrice(l.unitCost)}</td>
                  {editable && (
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={pending}
                        value={receiveQty[l.productId] ?? ""}
                        onChange={(e) => setReceiveQty((prev) => ({ ...prev, [l.productId]: Number(e.target.value) }))}
                        placeholder={`máx ${pending}`}
                        disabled={pending === 0}
                        className="w-28"
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editable && (
        <div className="rounded-xl border border-border bg-card p-5">
          <Label>Recepción</Label>
          <p className="mb-3 text-xs text-muted-foreground">
            Recibir suma stock (reparto equitativo por variante), registra movimiento `purchase` y actualiza el costo al último recibido. Las ventas pasadas no cambian.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleReceive} className="flex-1">Registrar recepción</Button>
            <Button variant="destructive" onClick={() => setConfirmCancel(true)}>Cancelar OC</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancelar orden de compra"
        description={`Se cancelará ${order.code}. Lo pendiente ya no se podrá recibir.`}
        variant="destructive"
        onConfirm={handleCancel}
      />
    </div>
  );
}
