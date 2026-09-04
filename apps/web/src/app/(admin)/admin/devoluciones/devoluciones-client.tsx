"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { returnsStore } from "@/lib/stores/data-store.returns";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { usersStore } from "@/lib/stores/data-store.users";
import { useEffect, useRef } from "react";
import { notifyAdmin } from "@/components/admin/admin-toast";
import {
  RETURN_STATUS_LABELS,
  RETURN_STATUS_STYLES,
  type ReturnStatus,
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

const PAGE_SIZE = 15;

export function DevolucionesClient() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ReturnStatus | "todos">("todos");
  const [page, setPage] = useState(1);
  const backfilled = useRef(false);
  useEffect(() => {
    if (backfilled.current) return;
    backfilled.current = true;
    const result = returnsStore.ensureDamageBackfill();
    if (result.fixed > 0) {
      notifyAdmin("Mermas recuperadas", `${result.fixed} RMA(s) sin movimiento damage`, "success");
    }
  }, []);

  const returns = useMemo(
    () => returnsStore.getAll().toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    []
  );
  const userMap = useMemo(() => new Map(usersStore.getAll().map((u) => [u.id, u])), []);

  const pending = returns.filter((r) => r.status === "solicitada" || r.status === "aprobada").length;

  const filtered = useMemo(() => {
    let result = returns;
    if (status !== "todos") result = result.filter((r) => r.status === status);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((r) => {
        const user = userMap.get(r.userId);
        const order = ordersStore.getById(r.orderId);
        return (
          r.code.toLowerCase().includes(q) ||
          r.orderId.toLowerCase().includes(q) ||
          user?.name.toLowerCase().includes(q) ||
          order?.id.toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [returns, status, query, userMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Devoluciones</h1>
          <p className="text-sm text-muted-foreground">
            {pending > 0 ? `${pending} por atender` : "Sin pendientes"} · Plazo 7 días desde la entrega.
          </p>
        </div>
        <Button asChild>
          <Link href={`${ROUTES.adminDevoluciones}/nueva`}>
            <Plus className="size-4" /> Nueva devolución
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Buscar por RMA, pedido o cliente..." className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v as ReturnStatus | "todos"); setPage(1); }}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="solicitada">Solicitada</SelectItem>
            <SelectItem value="aprobada">Aprobada</SelectItem>
            <SelectItem value="recibida">Recibida</SelectItem>
            <SelectItem value="inspeccionada">Inspeccionada</SelectItem>
            <SelectItem value="cerrada">Cerrada</SelectItem>
            <SelectItem value="rechazada">Rechazada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">RMA</th>
              <th className="px-3 py-2 font-medium">Pedido</th>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">Vía</th>
              <th className="px-3 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((r) => {
              const user = userMap.get(r.userId);
              return (
                <tr key={r.id} className="border-b border-border text-sm last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Link href={ROUTES.adminDevolucionDetalle(r.id)} className="font-mono text-xs font-bold text-accent hover:underline">
                      {r.code}
                    </Link>
                    <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("es-PE")}</p>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">#{r.orderId.slice(0, 8)}</td>
                  <td className="px-3 py-2">{user?.name ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{r.origin === "admin" ? "🧾 Diego" : "🌐 Web"}</td>
                  <td className="px-3 py-2">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs", RETURN_STATUS_STYLES[r.status])}>
                      {RETURN_STATUS_LABELS[r.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Sin devoluciones para este filtro.
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
