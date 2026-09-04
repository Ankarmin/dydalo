"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { paymentsStore } from "@/lib/stores/data-store.payments";
import { returnsStore } from "@/lib/stores/data-store.returns";
import { seedIfEmpty } from "@/config/seed-data";
import { PAYMENT_STATUS_LABELS, SHIPMENT_STATUS_LABELS, FULFILLMENT_SHORT_LABELS, RETURN_REASON_LABELS, RETURN_STATUS_LABELS, type PaymentStatus, type FulfillmentType, type ShipmentStatus, type ReturnReason, type Order } from "@/lib/stores";
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
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";
import { formatPrice } from "@/lib/utils/format";

export function CuentaPedidosClient() {
  seedIfEmpty();
  const [housekeeping] = useState(() => {
    ordersStore.expireStaleReservations();
    return true;
  });
  void housekeeping;
  const { state } = useAuth();
  const userId = state.user?.id ?? "";
  const userName = state.user?.name ?? "Cliente";
  const [openReturn, setOpenReturn] = useState<string | null>(null);
  const [returnSel, setReturnSel] = useState<Record<string, { checked: boolean; quantity: number; reason: ReturnReason; note: string }>>({});
  const [returnMsg, setReturnMsg] = useState<Record<string, string>>({});
  const orders = userId
    ? ordersStore.getByUserId(userId).toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  function toggleReturnForm(order: Order) {
    if (openReturn === order.id) {
      setOpenReturn(null);
      return;
    }
    const init: Record<string, { checked: boolean; quantity: number; reason: ReturnReason; note: string }> = {};
    for (const item of order.items) {
      init[`${item.productId}|${item.variantId}`] = { checked: false, quantity: 1, reason: "talla", note: "" };
    }
    setReturnSel(init);
    setOpenReturn(order.id);
  }

  function submitReturn(order: Order) {
    const items = order.items
      .filter((item) => returnSel[`${item.productId}|${item.variantId}`]?.checked)
      .map((item) => {
        const sel = returnSel[`${item.productId}|${item.variantId}`];
        return {
          productId: item.productId,
          variantId: item.variantId,
          quantity: sel.quantity,
          reason: sel.reason,
          reasonNote: sel.note,
        };
      });
    if (items.length === 0) {
      setReturnMsg((prev) => ({ ...prev, [order.id]: "Marca al menos un item." }));
      return;
    }
    const result = returnsStore.create({
      orderId: order.id,
      userId,
      origin: "web",
      items,
      actorId: userId,
      actorName: userName,
    });
    if (!result.success) {
      setReturnMsg((prev) => ({ ...prev, [order.id]: result.error }));
      return;
    }
    setOpenReturn(null);
    setReturnMsg((prev) => ({ ...prev, [order.id]: `Solicitud ${result.data.code} enviada. Te avisaremos por WhatsApp.` }));
  }

  return (
    <div className="space-y-8 pt-4">
      <PageBreadcrumbs
        className="mb-0"
        items={[
          { label: "Inicio", href: ROUTES.home },
          { label: "Mi cuenta", href: ROUTES.cuenta },
          { label: "Mis pedidos" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold tracking-heading">MIS PEDIDOS</h1>
        <p className="mt-1 text-sm text-muted-foreground">Historial de tus compras en DYDALO.</p>
      </div>

      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <p className="text-lg font-bold">NO TIENES PEDIDOS</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Aún no has realizado ninguna compra. Explora el catálogo y encuentra tu flow.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href={ROUTES.catalogo}>VER CATÁLOGO</Link>
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => {
          const status = (PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus]
            ? (order.paymentStatus as PaymentStatus)
            : "sin_registro") as PaymentStatus;
          const attempts = paymentsStore.getByOrderId(order.id);
          const last = attempts[attempts.length - 1];
          const fulfillmentType = (order.fulfillmentType ?? "LIMA_APP") as FulfillmentType;
          const shipmentStatus = (order.shipmentStatus ?? "pendiente") as ShipmentStatus;
          const myReturns = returnsStore.getByOrderId(order.id);
          const eligibleReturn = order.status === "entregado" && returnsStore.isWithinSla(order.id);
          return (
            <div key={order.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-mono text-sm font-bold">#{order.id.slice(0, 8)}</p>
                <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("es-PE")}</p>
              </div>
              <p className="mt-2 text-sm">
                Estado: <span className="font-medium">{order.status}</span> · Pago:{" "}
                <span className="font-medium">{PAYMENT_STATUS_LABELS[status]}</span> · Total:{" "}
                <span className="font-bold">{formatPrice(order.total)}</span>
                {order.couponCode ? ` · Cupón ${order.couponCode} −${formatPrice(order.discount)}` : ""}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Entrega: {FULFILLMENT_SHORT_LABELS[fulfillmentType]} · {SHIPMENT_STATUS_LABELS[shipmentStatus]}
                {order.trackingCode ? ` · Guía: ${order.trackingCode}` : ""}
                {fulfillmentType === "LIMA_APP" ? " · La pagas al conductor al recibir" : ""}
                {fulfillmentType === "RECOJO" ? " · Coordinamos por WhatsApp" : ""}
              </p>
              {status === "rechazado" && (
                <div className="mt-3 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm">
                  <p>{paymentsStore.getFriendlyRejectionMessage(last?.mpStatusDetail)}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" asChild>
                      <Link href={paymentsStore.buildRetryLink(order.id, attempts.length + 1)}>Reintentar pago</Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={ROUTES.contacto}>Ayuda por WhatsApp</Link>
                    </Button>
                  </div>
                </div>
              )}
              {(status === "pendiente" || status === "in_process" || status === "en_revision") && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Estamos verificando tu pago. Te avisaremos cuando se confirme.
                </p>
              )}
              {myReturns.length > 0 && (
                <div className="mt-3 space-y-1">
                  {myReturns.map((r) => (
                    <p key={r.id} className="text-sm text-muted-foreground">
                      Devolución {r.code}: <span className="font-medium">{RETURN_STATUS_LABELS[r.status]}</span>
                    </p>
                  ))}
                </div>
              )}
              {eligibleReturn && (
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={() => toggleReturnForm(order)}>
                    {openReturn === order.id ? "Cerrar" : "Solicitar devolución"}
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">Tienes 7 días desde la entrega. Prenda sin usar y con etiquetas.</p>
                </div>
              )}
              {openReturn === order.id && eligibleReturn && (
                <div className="mt-3 space-y-3 rounded-lg border border-border p-3">
                  {order.items.map((item) => {
                    const key = `${item.productId}|${item.variantId}`;
                    const sel = returnSel[key] ?? { checked: false, quantity: 1, reason: "talla" as ReturnReason, note: "" };
                    return (
                      <div key={key} className="rounded-md border border-border p-2">
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={sel.checked}
                            onChange={(e) => setReturnSel((prev) => ({ ...prev, [key]: { ...sel, checked: e.target.checked } }))}
                          />
                          {item.name} · {item.size}/{item.color} × {item.quantity}
                        </label>
                        {sel.checked && (
                          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <div>
                              <Label>Cantidad</Label>
                              <Input type="number" min={1} max={item.quantity} className="mt-1 h-8" value={sel.quantity} onChange={(e) => setReturnSel((prev) => ({ ...prev, [key]: { ...sel, quantity: Number(e.target.value) } }))} />
                            </div>
                            <div>
                              <Label>Motivo</Label>
                              <Select value={sel.reason} onValueChange={(v) => setReturnSel((prev) => ({ ...prev, [key]: { ...sel, reason: v as ReturnReason } }))}>
                                <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {(Object.keys(RETURN_REASON_LABELS) as ReturnReason[]).map((r) => (
                                    <SelectItem key={r} value={r}>{RETURN_REASON_LABELS[r]}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Nota</Label>
                              <Input className="mt-1 h-8" value={sel.note} onChange={(e) => setReturnSel((prev) => ({ ...prev, [key]: { ...sel, note: e.target.value } }))} placeholder="Opcional" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {returnMsg[order.id] && <p className="text-sm text-muted-foreground">{returnMsg[order.id]}</p>}
                  <Button size="sm" onClick={() => submitReturn(order)}>Enviar solicitud</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
