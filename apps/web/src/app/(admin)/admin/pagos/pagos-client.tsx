"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, AlertTriangle, Clock } from "lucide-react";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { usersStore } from "@/lib/stores/data-store.users";
import { paymentsStore } from "@/lib/stores/data-store.payments";
import { seedIfEmpty } from "@/config/seed-data";
import { useStoreData } from "@/hooks/use-store-data";
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  getOrderOrigin,
  getOrderOriginLabel,
  type OrderOrigin,
  type PaymentStatus,
} from "@/lib/stores";
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
import { AdminPagination } from "@/components/admin/admin-pagination";
import { cn } from "@/lib/utils/utils";
import { formatPrice } from "@/lib/utils/format";

const PAGE_SIZE = 15;
const ORIGIN_FILTERS: Array<OrderOrigin | "todos"> = ["todos", "mp_online", "manual"];
const STATUS_FILTERS: Array<PaymentStatus | "todos"> = [
  "todos",
  "pendiente",
  "in_process",
  "aprobado",
  "rechazado",
  "en_revision",
  "verificado_manual",
  "reembolsado",
  "cancelado",
  "en_disputa",
  "contracargo",
  "sin_registro",
];

function normalizePaymentStatus(value: unknown): PaymentStatus {
  return (PAYMENT_STATUS_LABELS[value as PaymentStatus] ? (value as PaymentStatus) : "sin_registro");
}

export function PagosClient() {
  seedIfEmpty();
  const [backfilled] = useState(() => {
    paymentsStore.ensureBackfillForOrders(ordersStore.getAll());
    ordersStore.expireStaleReservations();
    return true;
  });
  void backfilled;
  const orders = useStoreData(() =>
    ordersStore.getAll().toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState<OrderOrigin | "todos">("todos");
  const [status, setStatus] = useState<PaymentStatus | "todos">("todos");
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [page, setPage] = useState(1);

  const userMap = useMemo(() => new Map(usersStore.getAll().map((u) => [u.id, u])), []);

  const enriched = useMemo(
    () =>
      orders.map((o) => {
        const paymentStatus = normalizePaymentStatus(o.paymentStatus);
        const orderOrigin = getOrderOrigin(o);
        const attempts = paymentsStore.getByOrderId(o.id);
        const lastAttempt = attempts[attempts.length - 1];
        return { order: o, paymentStatus, orderOrigin, attempts, lastAttempt };
      }),
    [orders]
  );

  const stats = useMemo(() => {
    const count = (s: PaymentStatus) => enriched.filter((e) => e.paymentStatus === s).length;
    return {
      pendientes: count("pendiente"),
      rechazados: count("rechazado"),
      revision: count("en_revision") + count("in_process"),
      aprobados: count("aprobado") + count("verificado_manual"),
    };
  }, [enriched]);

  const filtered = useMemo(() => {
    let result = enriched;
    if (origin !== "todos") result = result.filter((e) => e.orderOrigin === origin);
    if (status !== "todos") result = result.filter((e) => e.paymentStatus === status);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((e) => {
        const user = userMap.get(e.order.userId);
        return (
          e.order.id.toLowerCase().includes(q) ||
          user?.name.toLowerCase().includes(q) ||
          user?.email.toLowerCase().includes(q) ||
          (e.lastAttempt?.mpPaymentId ?? "").toLowerCase().includes(q)
        );
      });
    }
    if (onlyAlerts) {
      result = result.filter(
        (e) => paymentsStore.lastRejectedWithoutRetry(e.order.id) || paymentsStore.isStuckInReview(e.order.id)
      );
    }
    return result;
  }, [enriched, origin, status, query, onlyAlerts, userMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Pagos</h1>
          <p className="text-sm text-muted-foreground">
            {stats.pendientes} pendientes · {stats.rechazados} rechazados · {stats.revision} en revisión
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyAlerts} onChange={(e) => setOnlyAlerts(e.target.checked)} />
          Solo alertas
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pendientes</p>
          <p className="text-2xl font-bold text-warning">{stats.pendientes}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Rechazados</p>
          <p className="text-2xl font-bold text-danger">{stats.rechazados}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">En revisión</p>
          <p className="text-2xl font-bold text-purple">{stats.revision}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Aprobados</p>
          <p className="text-2xl font-bold text-success">{stats.aprobados}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por pedido, cliente o ID MP..."
            className="pl-9"
          />
        </div>
        <Select value={origin} onValueChange={(v) => { setOrigin(v as OrderOrigin | "todos"); setPage(1); }}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Origen" />
          </SelectTrigger>
          <SelectContent>
            {ORIGIN_FILTERS.map((o) => (
              <SelectItem key={o} value={o}>
                {o === "todos" ? "Todos los orígenes" : o === "manual" ? "🧾 Manual" : "🌐 Online MP"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v as PaymentStatus | "todos"); setPage(1); }}>
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue placeholder="Estado pago" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "todos" ? "Todos los estados" : PAYMENT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[880px]">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Pedido</th>
              <th className="px-3 py-2 font-medium">Origen</th>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Pago</th>
              <th className="px-3 py-2 font-medium">Alerta</th>
              <th className="px-3 py-2 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(({ order, paymentStatus, orderOrigin, lastAttempt }) => {
              const user = userMap.get(order.userId);
              const stuck = paymentsStore.isStuckInReview(order.id);
              const rejectedIdle = paymentsStore.lastRejectedWithoutRetry(order.id);
              return (
                <tr key={order.id} className="border-b border-border text-sm last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Link href={ROUTES.adminPagoDetalle(order.id)} className="font-mono text-xs text-accent hover:underline">
                      #{order.id.slice(0, 8)}
                    </Link>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("es-PE")}</p>
                  </td>
                  <td className="px-3 py-2 text-xs">{orderOrigin === "manual" ? "🧾 Manual" : "🌐 Online MP"}</td>
                  <td className="px-3 py-2">{user?.name ?? "—"}</td>
                  <td className="px-3 py-2 font-medium">{formatPrice(order.total)}</td>
                  <td className="px-3 py-2">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", PAYMENT_STATUS_STYLES[paymentStatus])}>
                      {PAYMENT_STATUS_LABELS[paymentStatus]}
                    </span>
                    {lastAttempt?.mpStatusDetail && (
                      <p className="mt-1 text-xs text-muted-foreground">{paymentsStore.getMpDetailLabel(lastAttempt.mpStatusDetail)}</p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {stuck && (
                      <span className="inline-flex items-center gap-1 text-purple">
                        <Clock className="size-3" /> Revisión &gt;24h
                      </span>
                    )}
                    {rejectedIdle && (
                      <span className="inline-flex items-center gap-1 text-danger">
                        <AlertTriangle className="size-3" /> Rechazado sin reintento
                      </span>
                    )}
                    {!stuck && !rejectedIdle && <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={ROUTES.adminPagoDetalle(order.id)}>Ver</Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Sin resultados para {getOrderOriginLabel(origin === "todos" ? "mp_online" : origin)}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
