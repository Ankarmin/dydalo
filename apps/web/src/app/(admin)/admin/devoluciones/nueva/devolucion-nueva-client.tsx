"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { returnsStore } from "@/lib/stores/data-store.returns";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { usersStore } from "@/lib/stores/data-store.users";
import { useAuth } from "@/contexts/auth-context";
import { RETURN_REASON_LABELS, type ReturnReason } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { formatPrice } from "@/lib/utils/format";

type Sel = { productId: string; variantId: string; quantity: number; reason: ReturnReason; reasonNote: string; checked: boolean };

export function DevolucionNuevaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state: authState } = useAuth();
  const [orderId, setOrderId] = useState(searchParams.get("pedido") ?? "");
  const [sel, setSel] = useState<Sel[]>([]);

  const eligible = useMemo(
    () =>
      ordersStore
        .getAll()
        .filter((o) => o.status === "entregado" && returnsStore.isWithinSla(o.id))
        .toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    []
  );
  const userMap = useMemo(() => new Map(usersStore.getAll().map((u) => [u.id, u])), []);
  const order = orderId ? ordersStore.getById(orderId) : undefined;

  function pickOrder(id: string) {
    setOrderId(id);
    const o = ordersStore.getById(id);
    setSel(
      (o?.items ?? []).map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: 1,
        reason: "talla" as ReturnReason,
        reasonNote: "",
        checked: false,
      }))
    );
  }

  function setLine(productId: string, variantId: string, patch: Partial<Sel>) {
    setSel((prev) => prev.map((l) => (l.productId === productId && l.variantId === variantId ? { ...l, ...patch } : l)));
  }

  function handleCreate() {
    if (!order) {
      notifyAdmin("Falta pedido", "Elige un pedido entregado dentro del plazo.", "error");
      return;
    }
    const items = sel
      .filter((l) => l.checked)
      .map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity, reason: l.reason, reasonNote: l.reasonNote }));
    if (items.length === 0) {
      notifyAdmin("Sin items", "Marca al menos un item a devolver.", "error");
      return;
    }
    const result = returnsStore.create({
      orderId: order.id,
      userId: order.userId,
      origin: "admin",
      items,
      actorId: authState.user?.id ?? "admin",
      actorName: authState.user?.name ?? "Admin",
    });
    if (!result.success) {
      notifyAdmin("No se pudo crear", result.error, "error");
      return;
    }
    notifyAdmin("Devolución creada", `${result.data.code} · aprobada directo`, "success");
    router.push(ROUTES.adminDevolucionDetalle(result.data.id));
  }

  return (
    <div className="space-y-6">
      <Link href={ROUTES.adminDevoluciones} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a devoluciones
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-heading">Nueva devolución</h1>
        <p className="text-sm text-muted-foreground">Vía WhatsApp o tienda: nace aprobada directo por Diego.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <Label>Pedido entregado (≤7 días)</Label>
        <Select value={orderId} onValueChange={pickOrder}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
          <SelectContent>
            {eligible.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                #{o.id.slice(0, 8)} · {userMap.get(o.userId)?.name ?? "—"} · {formatPrice(o.total)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {eligible.length === 0 && <p className="mt-2 text-xs text-muted-foreground">Sin pedidos elegibles.</p>}
      </div>

      {order && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Items a devolver</h2>
          <div className="space-y-3">
            {order.items.map((item) => {
              const line = sel.find((l) => l.productId === item.productId && l.variantId === item.variantId);
              if (!line) return null;
              return (
                <div key={`${item.productId}-${item.variantId}`} className="rounded-lg border border-border p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={line.checked} onChange={(e) => setLine(item.productId, item.variantId, { checked: e.target.checked })} />
                    {item.name} · {item.size}/{item.color} × {item.quantity} · {formatPrice(item.price)}
                  </label>
                  {line.checked && (
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <Label>Cantidad</Label>
                        <Input type="number" min={1} max={item.quantity} className="mt-1" value={line.quantity} onChange={(e) => setLine(item.productId, item.variantId, { quantity: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Motivo</Label>
                        <Select value={line.reason} onValueChange={(v) => setLine(item.productId, item.variantId, { reason: v as ReturnReason })}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(RETURN_REASON_LABELS) as ReturnReason[]).map((r) => (
                              <SelectItem key={r} value={r}>{RETURN_REASON_LABELS[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Nota</Label>
                        <Input className="mt-1" value={line.reasonNote} onChange={(e) => setLine(item.productId, item.variantId, { reasonNote: e.target.value })} placeholder="Opcional" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Button onClick={handleCreate} className="mt-4 w-full">Crear devolución aprobada</Button>
        </div>
      )}
    </div>
  );
}
