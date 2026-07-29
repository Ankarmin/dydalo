"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { usersStore } from "@/lib/stores/data-store.users";
import { seedIfEmpty } from "@/config/seed-data";
import { useStoreData } from "@/hooks/use-store-data";
import type { Order, OrderStatus } from "@/lib/stores";
import { ORDER_STATUSES, STATUS_STYLES } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { formatPrice } from "@/lib/utils/format";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 15;

export function PedidosClient() {
  seedIfEmpty();
  const orders = useStoreData(() => ordersStore.getAll().toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [] as Order[]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "todos">("todos");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = orders;
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((o) => {
        const user = usersStore.getById(o.userId);
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
    return result;
  }, [orders, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-heading">Pedidos</h1>
        <p className="text-sm text-muted-foreground">{orders.length} pedidos totales</p>
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
        <div className="flex gap-1 flex-wrap">
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
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Fecha</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((order) => {
                const user = usersStore.getById(order.userId);
                return (
                  <tr key={order.id} className="border-b border-border text-sm hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{user?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">{order.items.length}</td>
                    <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                          STATUS_STYLES[order.status]
                        )}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="size-8" asChild>
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

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent className="overflow-x-auto">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0) {
                  const prev = arr[idx - 1] as number;
                  if (p - prev > 1) acc.push("...");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <PaginationItem key={`e-${i}`}>
                    <span className="px-2 text-muted-foreground">...</span>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => setPage(p)}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
