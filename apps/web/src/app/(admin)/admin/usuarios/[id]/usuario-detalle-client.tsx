"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Phone, Calendar, ShoppingCart, DollarSign } from "lucide-react";
import { useStoreData } from "@/hooks/use-store-data";
import { usersStore } from "@/lib/stores/data-store.users";
import { ordersStore } from "@/lib/stores/data-store.orders";
import type { User as UserType, Order } from "@/lib/stores/data-store.types";
import { STATUS_STYLES } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { formatPrice } from "@/lib/utils/format";

export function UsuarioDetalleClient({ id }: { id: string }) {
  const user = useStoreData(() => usersStore.getById(id), undefined as UserType | undefined);
  const orders = useStoreData(() => ordersStore.getByUserId(id).toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [] as Order[]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Cliente no encontrado</h2>
          <Link href={ROUTES.adminUsuarios} className="text-accent underline text-sm">
            Volver a clientes
          </Link>
        </div>
      </div>
    );
  }

  const totalSpent = orders
    .filter((o) => o.status !== "cancelado" && o.status !== "devuelto")
    .reduce((sum, o) => sum + o.total, 0);

  const completedOrders = orders.filter((o) => o.status === "entregado").length;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.adminUsuarios}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-heading">{user.name}</h1>
          <p className="text-sm text-muted-foreground">
            Cliente desde {new Date(user.createdAt).toLocaleDateString("es-PE", { dateStyle: "long" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Pedidos</span>
          </div>
          <p className="text-2xl font-bold">{orders.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{completedOrders} completados</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="size-4 text-green-400" />
            <span className="text-xs text-muted-foreground">Total Gastado</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatPrice(totalSpent)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Último Pedido</span>
          </div>
          <p className="text-sm font-medium">
            {orders.length > 0
              ? new Date(orders[0].createdAt).toLocaleDateString("es-PE")
              : "—"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">Información de Contacto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <span>{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" />
              <span>{user.phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 pb-3">
          <h2 className="text-sm font-semibold">Historial de Pedidos ({orders.length})</h2>
        </div>
        {orders.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No hay pedidos aún
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Pedido</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Fecha</th>
                  <th className="px-5 py-3 font-medium">Items</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-border text-sm hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <Link
                        href={ROUTES.adminPedidoDetalle(order.id)}
                        className="font-mono text-xs text-accent hover:underline"
                      >
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                      {new Date(order.createdAt).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-5 py-3">{order.items.length}</td>
                    <td className="px-5 py-3 font-medium">{formatPrice(order.total)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                          STATUS_STYLES[order.status]
                        )}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
