"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { returnsStore } from "@/lib/stores/data-store.returns";
import { usersStore } from "@/lib/stores/data-store.users";
import { useAuth } from "@/contexts/auth-context";
import {
  RETURN_REASON_LABELS,
  RETURN_STATUS_LABELS,
  RETURN_STATUS_STYLES,
} from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { cn } from "@/lib/utils/utils";
import { formatPrice } from "@/lib/utils/format";

export function DevolucionDetalleClient({ id }: { id: string }) {
  const { state: authState } = useAuth();
  const [request, setRequest] = useState(() => returnsStore.getById(id));
  const [inspectQty, setInspectQty] = useState<Record<string, { restock: number; damage: number }>>({});
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  const user = useMemo(() => (request ? usersStore.getById(request.userId) : undefined), [request]);

  if (!request) {
    return (
      <div className="space-y-4">
        <Link href={ROUTES.adminDevoluciones} className="text-sm text-accent hover:underline">
          ← Volver a devoluciones
        </Link>
        <p className="text-sm text-muted-foreground">Devolución no encontrada.</p>
      </div>
    );
  }

  const approvedTotal = request.items.reduce((s, i) => s + i.price * i.quantity, 0);

  function actor() {
    return { id: authState.user?.id ?? "admin", name: authState.user?.name ?? "Admin" };
  }

  function decide(status: "aprobada" | "rechazada") {
    if (status === "rechazada" && !rejectNote.trim()) {
      notifyAdmin("Falta motivo", "Rechazar exige motivo.", "error");
      return;
    }
    const current = returnsStore.getById(id);
    if (!current) return;
    const a = actor();
    const updated = returnsStore.setStatus(current.id, status, { id: a.id, name: a.name }, status === "rechazada" ? rejectNote.trim() : "Aprobada por Diego");
    if (!updated) {
      notifyAdmin("No se pudo", "Transición inválida.", "error");
      return;
    }
    setRequest(updated);
    setRejectNote("");
    notifyAdmin("Actualizado", status, "success");
  }

  function receiveAll() {
    const current = returnsStore.getById(id);
    if (!current) return;
    const a = actor();
    const result = returnsStore.receive(current.id, {
      lines: current.items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      actorId: a.id,
      actorName: a.name,
    });
    if (!result.success) {
      notifyAdmin("No se pudo recibir", result.error, "error");
      return;
    }
    setRequest(result.data);
    notifyAdmin("Recibida", "Mercadería en almacén.", "success");
  }

  function inspectLines() {
    const current = returnsStore.getById(id);
    if (!current) return;
    const a = actor();
    const result = returnsStore.inspect(current.id, {
      lines: current.items.map((i) => {
        const q = inspectQty[`${i.productId}|${i.variantId}`] ?? { restock: i.receivedQuantity, damage: 0 };
        return { productId: i.productId, variantId: i.variantId, restock: q.restock, damage: q.damage };
      }),
      actorId: a.id,
      actorName: a.name,
    });
    if (!result.success) {
      notifyAdmin("Inspección inválida", result.error, "error");
      return;
    }
    setRequest(result.data);
    notifyAdmin("Inspeccionada", "Stock actualizado.", "success");
  }

  function closeRequest() {
    const current = returnsStore.getById(id);
    if (!current) return;
    const a = actor();
    const result = returnsStore.close(current.id, {
      refundAmount: refundAmount.trim() ? Number(refundAmount) : 0,
      refundNote: refundNote.trim() || undefined,
      actorId: a.id,
      actorName: a.name,
    });
    if (!result.success) {
      notifyAdmin("No se pudo cerrar", result.error, "error");
      return;
    }
    setRequest(result.data);
    if (result.warnings.length > 0) {
      notifyAdmin("Cerrada con observaciones", result.warnings.join("; "), "error");
    } else {
      notifyAdmin("Cerrada", `Reembolso S/${Number(refundAmount || 0).toFixed(2)}`, "success");
    }
  }

  return (
    <div className="space-y-6">
      <Link href={ROUTES.adminDevoluciones} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a devoluciones
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">{request.code}</h1>
          <p className="text-sm text-muted-foreground">
            Pedido #{request.orderId.slice(0, 8)} · {user?.name ?? "—"} · {request.origin === "admin" ? "🧾 Diego" : "🌐 Web"} · máx reembolso {formatPrice(approvedTotal)}
          </p>
        </div>
        <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", RETURN_STATUS_STYLES[request.status])}>
          {RETURN_STATUS_LABELS[request.status]}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 font-medium">Motivo</th>
              <th className="px-3 py-2 font-medium">Cant.</th>
              <th className="px-3 py-2 font-medium">Recibido</th>
              <th className="px-3 py-2 font-medium">Reingresa / Damage</th>
            </tr>
          </thead>
          <tbody>
            {request.items.map((i) => (
              <tr key={`${i.productId}-${i.variantId}`} className="border-b border-border text-sm last:border-0">
                <td className="px-3 py-2 font-medium">
                  {i.name} <span className="text-xs text-muted-foreground">{i.size}/{i.color}</span>
                  <p className="text-xs font-normal">{formatPrice(i.price)} c/u</p>
                </td>
                <td className="px-3 py-2 text-xs">
                  {RETURN_REASON_LABELS[i.reason]}
                  {i.reasonNote && <p className="text-muted-foreground">{i.reasonNote}</p>}
                </td>
                <td className="px-3 py-2">{i.quantity}</td>
                <td className="px-3 py-2">{i.receivedQuantity}</td>
                <td className="px-3 py-2 text-xs">
                  {i.restockQuantity + i.damageQuantity > 0 ? (
                    <span>{i.restockQuantity} / {i.damageQuantity}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {request.status === "solicitada" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Decidir solicitud</h2>
          <Label>Motivo de rechazo (obligatorio para rechazar)</Label>
          <Input className="mt-1" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Ej: fuera de plazo, prenda usada" />
          <div className="mt-3 flex gap-2">
            <Button onClick={() => decide("aprobada")} className="flex-1">Aprobar</Button>
            <Button variant="destructive" onClick={() => decide("rechazada")} className="flex-1">Rechazar</Button>
          </div>
        </div>
      )}

      {request.status === "aprobada" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold">Recibir mercadería</h2>
          <p className="mb-3 text-xs text-muted-foreground">Confirma que el cliente entregó todo en almacén u oficina.</p>
          <Button onClick={receiveAll} className="w-full">Marcar recibida</Button>
        </div>
      )}

      {request.status === "recibida" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold">Inspeccionar por item</h2>
          <p className="mb-3 text-xs text-muted-foreground">Reingreso + damage debe sumar lo recibido de cada línea.</p>
          <div className="space-y-3">
            {request.items.map((i) => {
              const key = `${i.productId}|${i.variantId}`;
              const q = inspectQty[key] ?? { restock: i.receivedQuantity, damage: 0 };
              return (
                <div key={key} className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-3">
                  <p className="text-sm font-medium">{i.name} <span className="text-xs text-muted-foreground">recibido: {i.receivedQuantity}</span></p>
                  <div>
                    <Label>Reingresa vendible</Label>
                    <Input type="number" min={0} max={i.receivedQuantity} className="mt-1" value={q.restock} onChange={(e) => setInspectQty((prev) => ({ ...prev, [key]: { ...q, restock: Number(e.target.value) } }))} />
                  </div>
                  <div>
                    <Label>Damage</Label>
                    <Input type="number" min={0} max={i.receivedQuantity} className="mt-1" value={q.damage} onChange={(e) => setInspectQty((prev) => ({ ...prev, [key]: { ...q, damage: Number(e.target.value) } }))} />
                  </div>
                </div>
              );
            })}
          </div>
          <Button onClick={inspectLines} className="mt-4 w-full">Guardar inspección</Button>
        </div>
      )}

      {request.status === "inspeccionada" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Cerrar con reembolso</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Monto S/ (máx {formatPrice(approvedTotal)})</Label>
              <Input type="number" min={0} step="0.01" className="mt-1" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="0 si no aplica" />
            </div>
            <div>
              <Label>Nota de crédito</Label>
              <Input className="mt-1" value={refundNote} onChange={(e) => setRefundNote(e.target.value)} placeholder="Ej: NC-014" />
            </div>
          </div>
          <div className="mt-3">
            <Label>Motivo / detalle</Label>
            <Textarea className="mt-1" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Detalle del cierre (opcional)" />
          </div>
          <Button onClick={closeRequest} className="mt-4 w-full">Cerrar devolución</Button>
        </div>
      )}

      {request.status === "cerrada" && request.refundAmount !== undefined && (
        <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-sm">
          Cerrada con reembolso de {formatPrice(request.refundAmount)}{request.refundNote ? ` · ${request.refundNote}` : ""}.
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href={ROUTES.adminPedidoDetalle(request.orderId)}>Ver pedido</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ROUTES.adminPagoDetalle(request.orderId)}>Ver pago</Link>
        </Button>
      </div>
    </div>
  );
}
