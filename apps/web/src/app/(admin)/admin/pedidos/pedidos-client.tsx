"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Eye, Plus, Download } from "lucide-react";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { usersStore } from "@/lib/stores/data-store.users";
import { seedIfEmpty } from "@/config/seed-data";
import { useStoreData } from "@/hooks/use-store-data";
import type { OrderStatus } from "@/lib/stores";
import { ORDER_STATUSES, STATUS_STYLES } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { formatPrice } from "@/lib/utils/format";
import { exportOrdersCSV } from "@/lib/utils/csv";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { SortableHeader, defaultSort, type SortState } from "@/components/admin/sortable-header";
import { AdminPagination } from "@/components/admin/admin-pagination";

const PAGE_SIZE = 15;

export function PedidosClient() {
  seedIfEmpty();
  const orders = useStoreData(() => ordersStore.getAll().toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "todos">("todos");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>(defaultSort);

  const userMap = useMemo(() => {
    const map = new Map(usersStore.getAll().map((u) => [u.id, u]));
    return map;
  }, []);

  const filtered = useMemo(() => {
    let result = orders;
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((o) => {
        const user = userMap.get(o.userId);
        return (
          o.id.toLowerCase().includes(q) ||
          user?.name.toLowerCase().includes(q) ||
          user?.email.toLowerCase().includes(q)
        );
      });
    }
    if (statusFilter !== "todos") {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (sort.field) {
      result = [...result].sort((a, b) => {
        const dir = sort.direction === "asc" ? 1 : -1;
        switch (sort.field) {
          case "id": return dir * a.id.localeCompare(b.id);
          case "cliente": {
            const ua = userMap.get(a.userId)?.name ?? "";
            const ub = userMap.get(b.userId)?.name ?? "";
            return dir * ua.localeCompare(ub);
          }
          case "fecha": return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          case "items": return dir * (a.items.length - b.items.length);
          case "total": return dir * (a.total - b.total);
          case "estado": return dir * a.status.localeCompare(b.status);
          default: return 0;
        }
      });
    }
    return result;
  }, [orders, query, statusFilter, sort, userMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleExport() {
    exportOrdersCSV(filtered, usersStore.getAll());
    notifyAdmin("CSV exportado", `${filtered.length} pedidos`, "success");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Pedidos</h1>
          <p className="text-sm text-muted-foreground">
            {query || statusFilter !== "todos"
              ? `${filtered.length} de ${orders.length} pedidos`
              : `${orders.length} pedidos totales`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-3.5" />
            Exportar CSV
          </Button>
          <Button asChild size="sm">
            <Link href={ROUTES.adminPedidoNuevo}>
              <Plus className="size-4" />
              Nuevo Pedido
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID o cliente..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(["todos", ...ORDER_STATUSES] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <SortableHeader label="Pedido" field="id" currentSort={sort} onSortChange={setSort} />
                <SortableHeader label="Cliente" field="cliente" currentSort={sort} onSortChange={setSort} />
                <SortableHeader label="Fecha" field="fecha" currentSort={sort} onSortChange={setSort} />
                <SortableHeader label="Items" field="items" currentSort={sort} onSortChange={setSort} />
                <SortableHeader label="Total" field="total" currentSort={sort} onSortChange={setSort} />
                <SortableHeader label="Estado" field="estado" currentSort={sort} onSortChange={setSort} />
                <th className="px-3 py-2 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((order) => {
                const user = userMap.get(order.userId);
                return (
                  <tr key={order.id} className="border-b border-border text-sm hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium">{user?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-4 py-3">{order.items.length}</td>
                    <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          STATUS_STYLES[order.status]
                        )}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="size-8" asChild aria-label="Ver pedido">
                        <Link href={ROUTES.adminPedidoDetalle(order.id)}>
                          <Eye className="size-3.5" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No se encontraron pedidos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
