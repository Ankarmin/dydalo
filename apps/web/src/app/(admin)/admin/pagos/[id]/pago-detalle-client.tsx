"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, MessageCircle, RefreshCw } from "lucide-react";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { usersStore } from "@/lib/stores/data-store.users";
import { paymentsStore } from "@/lib/stores/data-store.payments";
import { useAuth } from "@/contexts/auth-context";
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  getOrderOrigin,
  type PaymentStatus,
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

const MP_SIMULATED_STATUSES: Array<{ value: PaymentStatus; label: string }> = [
  { value: "aprobado", label: "Simular webhook: aprobado" },
  { value: "rechazado", label: "Simular webhook: rechazado" },
  { value: "in_process", label: "Simular webhook: in_process" },
  { value: "cancelado", label: "Simular webhook: cancelado" },
  { value: "reembolsado", label: "Simular webhook: reembolsado" },
  { value: "en_disputa", label: "Simular webhook: en_disputa" },
  { value: "contracargo", label: "Simular webhook: contracargo" },
];

const MP_DETAILS = [
  "accredited",
  "cc_rejected_insufficient_amount",
  "cc_rejected_call_for_authorize",
  "cc_rejected_bad_filled_card_number",
  "cc_rejected_high_risk",
  "pending_contingency",
  "pending_review_manual",
];

export function PagoDetalleClient({ id }: { id: string }) {
  const { state: authState } = useAuth();
  const [order, setOrder] = useState(() => ordersStore.getById(id));
  const [mpStatus, setMpStatus] = useState<PaymentStatus>("aprobado");
  const [mpDetail, setMpDetail] = useState("accredited");
  const [mpId, setMpId] = useState("");
  const [manualStatus, setManualStatus] = useState<PaymentStatus>("verificado_manual");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");

  const attempts = useMemo(() => (order ? paymentsStore.getByOrderId(order.id) : []), [order]);
  const user = useMemo(() => (order ? usersStore.getById(order.userId) : undefined), [order]);

  if (!order) {
    return (
      <div className="space-y-4">
        <Link href={ROUTES.adminPagos} className="text-sm text-accent hover:underline">
          ← Volver a pagos
        </Link>
        <p className="text-sm text-muted-foreground">Pedido no encontrado.</p>
      </div>
    );
  }

  const origin = getOrderOrigin(order);
  const paymentStatus = (PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus]
    ? (order.paymentStatus as PaymentStatus)
    : "sin_registro") as PaymentStatus;
  const retryLink = paymentsStore.buildRetryLink(order.id, attempts.length + 1);
  const helpMsg = paymentsStore.buildHelpWhatsAppMessage(
    `#${order.id.slice(0, 8)}`,
    reason || paymentsStore.getMpDetailLabel(attempts[attempts.length - 1]?.mpStatusDetail),
    retryLink
  );

  function actor() {
    return {
      id: authState.user?.id ?? "admin",
      name: authState.user?.name ?? "Admin",
    };
  }

  function simulateMp() {
    const current = ordersStore.getById(id);
    if (!current) return;
    const a = actor();
    const updated = ordersStore.updatePaymentStatus(current.id, {
      status: mpStatus,
      method: current.paymentMethod ?? "Tarjeta MP",
      mpPaymentId: mpId || `MP-${Date.now().toString().slice(-8)}`,
      mpStatusDetail: mpDetail,
      reason: `Webhook MP simulado: ${mpStatus}`,
      actorId: "sistema_mp",
      actorName: "MercadoPago",
    });
    void a;
    if (updated) {
      setOrder(updated);
      notifyAdmin("Webhook MP registrado", mpStatus, "success");
    }
  }

  function applyManual() {
    const current = ordersStore.getById(id);
    if (!current) return;
    if (!reason.trim()) {
      notifyAdmin("Falta motivo", "En revisión y verificado exigen motivo.", "error");
      return;
    }
    if (manualStatus === "verificado_manual" && !evidence.trim() && !current.paymentMethod) {
      notifyAdmin("Falta evidencia", "Adjunta referencia del voucher.", "error");
      return;
    }
    const a = actor();
    const updated = ordersStore.updatePaymentStatus(current.id, {
      status: manualStatus,
      reason: reason.trim(),
      evidence: evidence.trim() || undefined,
      actorId: a.id,
      actorName: a.name,
    });
    if (updated) {
      setOrder(updated);
      setReason("");
      setEvidence("");
      notifyAdmin("Pago actualizado", manualStatus, "success");
    } else {
      notifyAdmin("No se pudo actualizar", "Revisa motivo y evidencia.", "error");
    }
  }

  function retryAttempt() {
    const current = ordersStore.getById(id);
    if (!current) return;
    const a = actor();
    const updated = ordersStore.updatePaymentStatus(current.id, {
      status: "pendiente",
      reason: `Reintento ${attempts.length + 1} generado para el cliente`,
      actorId: a.id,
      actorName: a.name,
    });
    if (updated) {
      setOrder(updated);
      notifyAdmin("Reintento creado", retryLink, "success");
    }
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
      <Link href={ROUTES.adminPagos} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a pagos
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Pago #{order.id.slice(0, 8)}</h1>
          <p className="text-sm text-muted-foreground">
            {origin === "manual" ? "🧾 Manual" : "🌐 Online MP"} · {user?.name ?? "—"} · {formatPrice(order.total)}
          </p>
        </div>
        <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", PAYMENT_STATUS_STYLES[paymentStatus])}>
          {PAYMENT_STATUS_LABELS[paymentStatus]}
        </span>
      </div>

      {(paymentsStore.isStuckInReview(order.id) || paymentsStore.lastRejectedWithoutRetry(order.id)) && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
          {paymentsStore.isStuckInReview(order.id) && <p>⚠️ Revisión &gt;24h sin resolver. Contacta al cliente o cancela.</p>}
          {paymentsStore.lastRejectedWithoutRetry(order.id) && <p>⚠️ Rechazado hace &gt;2h sin reintento. Envía WhatsApp con link.</p>}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">Timeline de intentos ({attempts.length})</h2>
        <div className="space-y-2">
          {attempts.map((a) => (
            <div key={a.id} className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  Intento {a.attemptNumber} · {PAYMENT_STATUS_LABELS[a.status]} · {formatPrice(a.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString("es-PE")} · por {a.actorName}
                  {a.mpPaymentId ? ` · MP ${a.mpPaymentId}` : ""}
                  {a.mpStatusDetail ? ` · ${paymentsStore.getMpDetailLabel(a.mpStatusDetail)}` : ""}
                </p>
                {a.reason && <p className="text-xs">Motivo: {a.reason}</p>}
                {a.status === "rechazado" && (
                  <p className="text-xs text-muted-foreground">{paymentsStore.getFriendlyRejectionMessage(a.mpStatusDetail)}</p>
                )}
              </div>
              <span className={cn("inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs", PAYMENT_STATUS_STYLES[a.status])}>
                {PAYMENT_STATUS_LABELS[a.status]}
              </span>
            </div>
          ))}
          {attempts.length === 0 && <p className="text-sm text-muted-foreground">Sin intentos. Primer cambio creará el intento 1.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold">Simular webhook MercadoPago</h2>
          <p className="mb-4 text-xs text-muted-foreground">Solo mock frontend. En backend será webhook real firmado.</p>
          <div className="space-y-3">
            <div>
              <Label>Estado MP</Label>
              <Select value={mpStatus} onValueChange={(v) => setMpStatus(v as PaymentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MP_SIMULATED_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Detalle MP</Label>
              <Select value={mpDetail} onValueChange={setMpDetail}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MP_DETAILS.map((d) => (
                    <SelectItem key={d} value={d}>{d} — {paymentsStore.getMpDetailLabel(d)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ID pago MP (opcional)</Label>
              <Input value={mpId} onChange={(e) => setMpId(e.target.value)} placeholder="MP-12345678" />
            </div>
            <Button onClick={simulateMp} className="w-full">Registrar webhook simulado</Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold">Acción manual Diego</h2>
          <p className="mb-4 text-xs text-muted-foreground">Revisión y verificado exigen motivo. Verificado exige evidencia.</p>
          <div className="space-y-3">
            <div>
              <Label>Estado manual</Label>
              <Select value={manualStatus} onValueChange={(v) => setManualStatus(v as PaymentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_revision">En revisión</SelectItem>
                  <SelectItem value="verificado_manual">Verificado manual</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="reembolsado">Reembolsado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Motivo obligatorio</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: voucher Yape 123 borroso, se pidió foto clara" />
            </div>
            <div>
              <Label>Evidencia / referencia</Label>
              <Input value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Ej: foto voucher, operación 456" />
            </div>
            <Button onClick={applyManual} className="w-full">Guardar acción manual</Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">Ayudar al cliente</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={retryAttempt}>
            <RefreshCw className="size-4" /> Crear reintento
          </Button>
          <Button variant="outline" onClick={() => copy(retryLink, "Link de reintento")}>
            <Copy className="size-4" /> Copiar link
          </Button>
          <Button variant="outline" onClick={() => copy(helpMsg, "Mensaje WhatsApp")}>
            <MessageCircle className="size-4" /> Copiar WhatsApp
          </Button>
          <Button variant="outline" asChild>
            <Link href={ROUTES.adminPedidoDetalle(order.id)}>Ver pedido</Link>
          </Button>
        </div>
        <p className="mt-3 break-all text-xs text-muted-foreground">{retryLink}</p>
      </div>
    </div>
  );
}
