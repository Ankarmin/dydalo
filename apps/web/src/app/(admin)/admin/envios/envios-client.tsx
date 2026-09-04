"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Download } from "lucide-react";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { usersStore } from "@/lib/stores/data-store.users";
import { shipmentsStore } from "@/lib/stores/data-store.shipments";
import { seedIfEmpty } from "@/config/seed-data";
import { useStoreData } from "@/hooks/use-store-data";
import {
  FULFILLMENT_SHORT_LABELS,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_STYLES,
  type FulfillmentType,
  type ShipmentStatus,
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
import { notifyAdmin } from "@/components/admin/admin-toast";
import { cn } from "@/lib/utils/utils";
import { formatPrice } from "@/lib/utils/format";

const PAGE_SIZE = 15;
const TYPE_FILTERS: Array<FulfillmentType | "todos"> = ["todos", "LIMA_APP", "PROVINCIA_OLVA", "RECOJO"];

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function EnviosClient() {
  seedIfEmpty();
  const [housekeeping] = useState(() => {
    ordersStore.expireStaleReservations();
    return true;
  });
  void housekeeping;
  const orders = useStoreData(() =>
    ordersStore.getAll().toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [query, setQuery] = useState("");
  const [type, setType] = useState<FulfillmentType | "todos">("todos");
  const [page, setPage] = useState(1);

  const userMap = useMemo(() => new Map(usersStore.getAll().map((u) => [u.id, u])), []);

  const enriched = useMemo(
    () =>
      orders.map((o) => ({
        order: o,
        fulfillmentType: (o.fulfillmentType ?? "LIMA_APP") as FulfillmentType,
        shipmentStatus: (o.shipmentStatus ?? "pendiente") as ShipmentStatus,
        events: shipmentsStore.getByOrderId(o.id),
      })),
    [orders]
  );

  const stats = useMemo(
    () => ({
      app: enriched.filter((e) => e.fulfillmentType === "LIMA_APP").length,
      olva: enriched.filter((e) => e.fulfillmentType === "PROVINCIA_OLVA").length,
      recojo: enriched.filter((e) => e.fulfillmentType === "RECOJO").length,
      pendientes: enriched.filter((e) => e.shipmentStatus === "pendiente").length,
    }),
    [enriched]
  );

  const filtered = useMemo(() => {
    let result = enriched;
    if (type !== "todos") result = result.filter((e) => e.fulfillmentType === type);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((e) => {
        const user = userMap.get(e.order.userId);
        return (
          e.order.id.toLowerCase().includes(q) ||
          (e.order.trackingCode ?? "").toLowerCase().includes(q) ||
          (e.order.courier ?? "").toLowerCase().includes(q) ||
          user?.name.toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [enriched, type, query, userMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleExport() {
    const rows = [
      ["pedido", "tipo", "estado_envio", "courier", "guia", "cobrado", "real", "cliente", "fecha"],
      ...filtered.map((e) => {
        const user = userMap.get(e.order.userId);
        return [
          e.order.id,
          e.fulfillmentType,
          e.shipmentStatus,
          e.order.courier ?? "",
          e.order.trackingCode ?? "",
          String(e.order.shipping),
          String(e.order.realShippingCost ?? ""),
          user?.name ?? "",
          e.order.createdAt,
        ];
      }),
    ];
    downloadCsv(`envios-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    notifyAdmin("Exportado", `${filtered.length} envíos`, "success");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Envíos</h1>
          <p className="text-sm text-muted-foreground">
            {stats.pendientes} pendientes · {stats.app} App · {stats.olva} Olva · {stats.recojo} Recojo
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="size-3.5" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">App Lima</p>
          <p className="text-2xl font-bold">{stats.app}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Olva</p>
          <p className="text-2xl font-bold">{stats.olva}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Recojo</p>
          <p className="text-2xl font-bold">{stats.recojo}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pendientes</p>
          <p className="text-2xl font-bold text-warning">{stats.pendientes}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Buscar por pedido, guía, courier o cliente..."
            className="pl-9"
          />
        </div>
        <Select value={type} onValueChange={(v) => { setType(v as FulfillmentType | "todos"); setPage(1); }}>
          <SelectTrigger className="w-full lg:w-52">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTERS.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "todos" ? "Todos los tipos" : t === "LIMA_APP" ? "🛵 App Lima" : t === "PROVINCIA_OLVA" ? "📦 Olva" : "🏬 Recojo"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Pedido</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Estado envío</th>
              <th className="px-3 py-2 font-medium">Guía / Dato</th>
              <th className="px-3 py-2 font-medium">Cobrado vs real</th>
              <th className="px-3 py-2 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(({ order, fulfillmentType, shipmentStatus }) => {
              const losing =
                fulfillmentType === "PROVINCIA_OLVA" &&
                order.realShippingCost !== undefined &&
                order.realShippingCost > order.shipping;
              return (
                <tr key={order.id} className="border-b border-border text-sm last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Link href={ROUTES.adminEnvioDetalle(order.id)} className="font-mono text-xs text-accent hover:underline">
                      #{order.id.slice(0, 8)}
                    </Link>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("es-PE")}</p>
                  </td>
                  <td className="px-3 py-2 text-xs">{FULFILLMENT_SHORT_LABELS[fulfillmentType]}</td>
                  <td className="px-3 py-2">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", SHIPMENT_STATUS_STYLES[shipmentStatus])}>
                      {SHIPMENT_STATUS_LABELS[shipmentStatus]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {order.trackingCode ? <span className="font-mono">{order.trackingCode}</span> : <span className="text-muted-foreground">—</span>}
                    {order.courier && <p className="text-muted-foreground">{order.courier}</p>}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {fulfillmentType === "PROVINCIA_OLVA" ? (
                      <span className={cn(losing && "font-bold text-danger")}>
                        {formatPrice(order.shipping)} vs {order.realShippingCost !== undefined ? formatPrice(order.realShippingCost) : "—"}
                      </span>
                    ) : fulfillmentType === "RECOJO" ? (
                      <span className="text-muted-foreground">Gratis</span>
                    ) : (
                      <span className="text-muted-foreground">Paga al recibir</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={ROUTES.adminEnvioDetalle(order.id)}>Ver</Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Sin envíos para este filtro.
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
