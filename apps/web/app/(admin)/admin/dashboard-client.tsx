"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { productsStore } from "@/lib/data-store.products";
import { ordersStore } from "@/lib/data-store.orders";
import { usersStore } from "@/lib/data-store.users";
import { seedIfEmpty } from "@/lib/seed-data";
import type { AdminProduct, Order } from "@/lib/data-store";
import { ROUTES } from "@/lib/routes";
import { LOW_STOCK_THRESHOLD, RECENT_ORDERS_LIMIT, PENDING_ORDERS_WARNING_THRESHOLD } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  href,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "warning" | "success" | "danger";
  href?: string;
}) {
  const colors = {
    default: "text-foreground",
    warning: "text-yellow-400",
    success: "text-green-400",
    danger: "text-red-400",
  };

  const commonProps = {
    className: cn(
      "flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors",
      href && "hover:bg-accent/5"
    ),
  };

  const inner = (
    <>
      <div className={cn("rounded-lg border bg-background p-2.5", colors[variant], "border-current/20 bg-current/5")}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={cn("text-2xl font-bold tracking-tight", colors[variant])}>
          {value}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {href && (
        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
      )}
    </>
  );

  if (href) {
    return <Link href={href} {...commonProps}>{inner}</Link>;
  }

  return <div {...commonProps}>{inner}</div>;
}

export function DashboardClient() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedIfEmpty();
    setProducts(productsStore.getAll());
    setOrders(ordersStore.getAll());
    setLoading(false);
  }, []);

  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-heading">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[104px] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const activeProducts = products.filter((p) => p.active).length;
  const lowStock = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD && p.active).length;
  const customerUsers = usersStore.getAll().filter((u) => u.role === "customer").length;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthOrders = orders.filter((o) => o.createdAt >= startOfMonth);
  const monthRevenue = monthOrders
    .filter((o) => o.status !== "cancelado" && o.status !== "devuelto")
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "pendiente").length;
  const completedOrders = orders.filter((o) => o.status === "entregado").length;
  const totalOrders = orders.length;

  const recentOrders = orders
    .toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_ORDERS_LIMIT);

  const userMap = new Map(usersStore.getAll().map((u) => [u.id, u]));

  const STATUS_STYLES: Record<string, string> = {
    pendiente: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    confirmado: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    enviado: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    entregado: "bg-green-500/10 text-green-400 border-green-500/20",
    cancelado: "bg-red-500/10 text-red-400 border-red-500/20",
    devuelto: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-heading">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {now.toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}{" — "}
          {clock.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Productos Activos"
          value={activeProducts}
          subtitle={`${lowStock} con stock bajo`}
          icon={Package}
          variant={lowStock > LOW_STOCK_THRESHOLD ? "warning" : "default"}
          href={ROUTES.adminProductos}
        />
        <StatCard
          title="Pedidos del Mes"
          value={monthOrders.length}
          subtitle={`${pendingOrders} pendientes`}
          icon={ShoppingCart}
          variant={pendingOrders > PENDING_ORDERS_WARNING_THRESHOLD ? "warning" : "default"}
          href={ROUTES.adminPedidos}
        />
        <StatCard
          title="Ingresos del Mes"
          value={formatPrice(monthRevenue)}
          subtitle={`${completedOrders} pedidos completados`}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Clientes"
          value={customerUsers}
          subtitle={`${totalOrders} pedidos totales`}
          icon={Users}
          href={ROUTES.adminUsuarios}
        />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Resumen de Pedidos por Estado</h2>
          <div className="space-y-3">
            {(["pendiente", "confirmado", "enviado", "entregado", "cancelado"] as const).map((status) => {
              const count = orders.filter((o) => o.status === status).length;
              const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-muted-foreground capitalize">{status}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          status === "entregado" ? "#22c55e" :
                          status === "cancelado" ? "#ef4444" :
                          status === "enviado" ? "#a855f7" :
                          status === "confirmado" ? "#3b82f6" :
                          "#eab308",
                      }}
                    />
                  </div>
                  <span className="w-8 text-xs text-muted-foreground text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Productos Destacados</h2>
          <div className="space-y-2">
            {products
              .filter((p) => p.featured && p.active)
              .slice(0, 5)
              .map((p) => (
                <Link
                  key={p.id}
                  href={ROUTES.adminProductoEditar(p.id)}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent/5 transition-colors"
                >
                  <div className="size-10 rounded-md border bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {p.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(p.price)}</span>
                </Link>
              ))}
          </div>
        </div>
      </div>

      {/* Últimos pedidos */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="text-sm font-semibold">Últimos Pedidos</h2>
          <Link
            href={ROUTES.adminPedidos}
            className="text-xs text-accent hover:underline"
          >
            Ver todos
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Pedido</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const user = userMap.get(order.userId);
                return (
                  <tr key={order.id} className="border-t border-border text-sm hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <Link
                        href={ROUTES.adminPedidoDetalle(order.id)}
                        className="font-mono text-xs text-accent hover:underline"
                      >
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{user?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-5 py-3 font-medium">{formatPrice(order.total)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          STATUS_STYLES[order.status]
                        )}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No hay pedidos aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerta de stock bajo */}
      {lowStock > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <AlertTriangle className="size-5 shrink-0 text-yellow-400 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-400">Atención: Stock Bajo</p>
            <p className="text-sm text-muted-foreground">
              Hay {lowStock} producto{lowStock > 1 ? "s" : ""} con stock bajo (≤ {LOW_STOCK_THRESHOLD} unidades).
            </p>
            <Link href={ROUTES.adminProductos} className="text-xs text-accent hover:underline mt-1 inline-block">
              Revisar productos
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
