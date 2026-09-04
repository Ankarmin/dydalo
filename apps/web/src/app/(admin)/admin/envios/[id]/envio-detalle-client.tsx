"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { usersStore } from "@/lib/stores/data-store.users";
import { shipmentsStore } from "@/lib/stores/data-store.shipments";
import { useAuth } from "@/contexts/auth-context";
import {
  FULFILLMENT_LABELS,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_STYLES,
  SHIPMENT_TRANSITIONS,
  type FulfillmentType,
  type ShipmentStatus,
} from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { cn } from "@/lib/utils/utils";
import { formatPrice } from "@/lib/utils/format";

export function EnvioDetalleClient({ id }: { id: string }) {
  const { state: authState } = useAuth();
  const [order, setOrder] = useState(() => ordersStore.getById(id));
  const [nextStatus, setNextStatus] = useState<ShipmentStatus | "">("");
  const [courier, setCourier] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [realCost, setRealCost] = useState("");
  const [pickupName, setPickupName] = useState("");
  const [pickupDni, setPickupDni] = useState("");
  const [note, setNote] = useState("");
  const [evidence, setEvidence] = useState("");

  const events = useMemo(() => (order ? shipmentsStore.getByOrderId(order.id) : []), [order]);
  const user = useMemo(() => (order ? usersStore.getById(order.userId) : undefined), [order]);

  if (!order) {
    return (
      <div className="space-y-4">
        <Link href={ROUTES.adminEnvios} className="text-sm text-accent hover:underline">
          ← Volver a envíos
        </Link>
        <p className="text-sm text-muted-foreground">Pedido no encontrado.</p>
      </div>
    );
  }

  const fulfillmentType = (order.fulfillmentType ?? "LIMA_APP") as FulfillmentType;
  const currentStatus = (order.shipmentStatus ?? "pendiente") as ShipmentStatus;
  const nextOptions = SHIPMENT_TRANSITIONS[fulfillmentType][currentStatus] ?? [];
  const losing =
    fulfillmentType === "PROVINCIA_OLVA" &&
    order.realShippingCost !== undefined &&
    order.realShippingCost > order.shipping;

  function advance() {
    if (!nextStatus) {
      notifyAdmin("Sin estado", "Elige el siguiente estado.", "error");
      return;
    }
    const current = ordersStore.getById(id);
    if (!current) return;
    const result = ordersStore.updateShipment(current.id, {
      status: nextStatus as ShipmentStatus,
      courier: courier.trim() || undefined,
      trackingCode: trackingCode.trim() || undefined,
      realShippingCost: realCost.trim() ? Number(realCost) : undefined,
      pickupName: pickupName.trim() || undefined,
      pickupDni: pickupDni.trim() || undefined,
      note: note.trim() || undefined,
      evidence: evidence.trim() || undefined,
      actorId: authState.user?.id ?? "admin",
      actorName: authState.user?.name ?? "Admin",
    });
    if (!result.success) {
      notifyAdmin("No se pudo avanzar", result.error, "error");
      return;
    }
    setOrder(result.data);
    setNextStatus("");
    setCourier("");
    setTrackingCode("");
    setRealCost("");
    setPickupName("");
    setPickupDni("");
    setNote("");
    setEvidence("");
    notifyAdmin("Envío actualizado", SHIPMENT_STATUS_LABELS[nextStatus as ShipmentStatus], "success");
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      notifyAdmin("Copiado", label, "success");
    } catch {
      notifyAdmin("No se pudo copiar", label, "error");
    }
  }

  return (
    <div className="space-y-6">
      <Link href={ROUTES.adminEnvios} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a envíos
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Envío #{order.id.slice(0, 8)}</h1>
          <p className="text-sm text-muted-foreground">
            {FULFILLMENT_LABELS[fulfillmentType]} · {user?.name ?? "—"} · {formatPrice(order.total)}
          </p>
        </div>
        <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", SHIPMENT_STATUS_STYLES[currentStatus])}>
          {SHIPMENT_STATUS_LABELS[currentStatus]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Courier</p>
          <p className="text-sm font-bold">{order.courier ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Guía / Dato</p>
          <p className="font-mono text-sm font-bold">{order.trackingCode ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Cobrado al cliente</p>
          <p className="text-sm font-bold">{formatPrice(order.shipping)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Costo real</p>
          <p className={cn("text-sm font-bold", losing && "text-danger")}>
            {order.realShippingCost !== undefined ? formatPrice(order.realShippingCost) : "—"}
          </p>
        </div>
      </div>

      {losing && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm">
          ⚠️ El costo real supera lo cobrado. Diferencia: {formatPrice((order.realShippingCost ?? 0) - order.shipping)}.
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">Timeline ({events.length})</h2>
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.id} className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{SHIPMENT_STATUS_LABELS[e.status]}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString("es-PE")} · por {e.actorName}
                  {e.courier ? ` · ${e.courier}` : ""}
                  {e.trackingCode ? ` · ${e.trackingCode}` : ""}
                </p>
                {e.note && <p className="text-xs">Nota: {e.note}</p>}
                {e.evidence && <p className="text-xs text-muted-foreground">Evidencia: {e.evidence}</p>}
              </div>
              <span className={cn("inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs", SHIPMENT_STATUS_STYLES[e.status])}>
                {SHIPMENT_STATUS_LABELS[e.status]}
              </span>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm text-muted-foreground">Sin movimientos. El primer avance creará el evento 1.</p>}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-1 text-sm font-semibold">Avanzar estado</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {fulfillmentType === "PROVINCIA_OLVA" && "En agencia exige guía. "}
          {fulfillmentType === "LIMA_APP" && "Entregar exige evidencia. El cliente paga al conductor al recibir. "}
          {fulfillmentType === "RECOJO" && "Entregar exige DNI verificado. Recojo gratis según disponibilidad. "}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Siguiente estado</Label>
            <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as ShipmentStatus)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {nextOptions.map((s) => (
                  <SelectItem key={s} value={s}>{SHIPMENT_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Courier / aplicativo</Label>
            <Input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder={fulfillmentType === "PROVINCIA_OLVA" ? "Olva" : fulfillmentType === "LIMA_APP" ? "inDriver / Uber" : "Oficina"} />
          </div>
          <div>
            <Label>{fulfillmentType === "PROVINCIA_OLVA" ? "Código de guía" : "Placa / dato servicio"}</Label>
            <Input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="Obligatorio según estado" />
          </div>
          {fulfillmentType === "PROVINCIA_OLVA" && (
            <div>
              <Label>Costo real pagado (S/)</Label>
              <Input value={realCost} onChange={(e) => setRealCost(e.target.value)} inputMode="decimal" placeholder="Ej: 18.50" />
            </div>
          )}
          {fulfillmentType === "RECOJO" && (
            <>
              <div>
                <Label>Quien recoge</Label>
                <Input value={pickupName} onChange={(e) => setPickupName(e.target.value)} placeholder="Nombre" />
              </div>
              <div>
                <Label>DNI verificado</Label>
                <Input value={pickupDni} onChange={(e) => setPickupDni(e.target.value)} placeholder="Obligatorio para entregar" />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <Label>Nota interna</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: llevado a agencia Olva Los Olivos" />
          </div>
          <div className="sm:col-span-2">
            <Label>Evidencia / referencia</Label>
            <Input value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Foto guía, captura tarifa, firma" />
          </div>
        </div>
        <Button onClick={advance} className="mt-4 w-full">Guardar avance</Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {order.trackingCode && (
          <Button variant="outline" onClick={() => copy(order.trackingCode ?? "", "Guía / dato")}>
            <Copy className="size-4" /> Copiar guía
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href={ROUTES.adminPedidoDetalle(order.id)}>Ver pedido</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ROUTES.adminPagoDetalle(order.id)}>Ver pago</Link>
        </Button>
      </div>
    </div>
  );
}
