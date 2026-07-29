"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { usersStore } from "@/lib/stores/data-store.users";
import { useStoreData } from "@/hooks/use-store-data";
import type { Order, OrderStatus } from "@/lib/stores";
import { VALID_TRANSITIONS, STATUS_STYLES } from "@/lib/stores";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/utils";
import { formatPrice } from "@/lib/utils/format";
import { toast } from "sonner";

export function PedidoDetalleClient({ id }: { id: string }) {
  const { state: authState } = useAuth();
  const order = useStoreData(() => ordersStore.getById(id), undefined as Order | undefined);
  const [updating, setUpdating] = useState(false);

  function handleStatusChange(newStatus: OrderStatus) {
    if (!order || !authState.user) return;
    setUpdating(true);

    setTimeout(() => {
      const result = ordersStore.transitionStatus(order.id, newStatus, authState.user!.id);
      if (result.success) {
        toast.success(`Pedido actualizado a "${newStatus}"`);
      } else {
        toast.error(result.error);
      }
      setUpdating(false);
    }, 400);
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Pedido no encontrado</h2>
          <Link href={ROUTES.adminPedidos} className="text-accent underline text-sm">
            Volver a pedidos
          </Link>
        </div>
      </div>
    );
  }

  const user = usersStore.getById(order.userId);
  const allowedTransitions = VALID_TRANSITIONS[order.status];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.adminPedidos}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-heading">
            Pedido #{order.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("es-PE", {
              dateStyle: "long",
            })}
          </p>
        </div>
      </div>

      {/* Estado y acciones */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Estado:</span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                STATUS_STYLES[order.status]
              )}
            >
              {order.status}
            </span>
          </div>
          {allowedTransitions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Cambiar a:</span>
              <Select onValueChange={(v) => handleStatusChange(v as OrderStatus)} disabled={updating}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {allowedTransitions.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Cliente */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">Cliente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Nombre</p>
            <p className="font-medium">{user?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Teléfono</p>
            <p className="font-medium">{order.shippingAddress.phone || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Dirección</p>
            <p className="font-medium">
              {order.shippingAddress.street}, {order.shippingAddress.city}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">Productos ({order.items.length})</h2>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-2 bg-muted/30">
              <Package className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  Talla: {item.size} · Color: {item.color}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatPrice(item.price)}</p>
                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Envío</span>
            <span>{formatPrice(order.shipping)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Descuento</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Historial de estados */}
      {order.statusHistory.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-3">Historial de Cambios</h2>
          <div className="space-y-2">
            {order.statusHistory.map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="size-2 rounded-full bg-muted-foreground shrink-0" />
                <span className="text-muted-foreground text-xs w-28">
                  {new Date(h.at).toLocaleString("es-PE")}
                </span>
                <span className="text-muted-foreground capitalize">{h.from}</span>
                <span>→</span>
                <span className="font-medium capitalize">{h.to}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
