"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { productsStore } from "@/lib/stores/data-store.products";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { usersStore } from "@/lib/stores/data-store.users";
import { seedIfEmpty } from "@/config/seed-data";
import { STATUS_STYLES } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { LOW_STOCK_THRESHOLD, RECENT_ORDERS_LIMIT, PENDING_ORDERS_WARNING_THRESHOLD } from "@/config/constants";
import { cn } from "@/lib/utils/utils";
import { formatPrice } from "@/lib/utils/format";
import {
  getMoMChange,
  getStatusDistribution,
  getInventoryValue,
  getStockDistribution,
  getVariantsWithoutSales,
} from "@/lib/utils/analytics";
import { StatusDonutChart } from "@/components/admin/charts/status-donut-chart";
import { getLowStockVariants, getOutOfStockVariants } from "@/lib/utils/inventory";

seedIfEmpty();

const INVENTORY_ALERTS_LIMIT = 10;

function ClockDisplay() {
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const now = new Date();

  return (
    <p className="text-sm text-muted-foreground">
      {now.toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}{" — "}
      {clock.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </p>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  mom,
  icon: Icon,
  variant = "default",
  href,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  mom?: { change: number; trend: "up" | "down" | "flat" };
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "warning" | "success" | "danger";
  href?: string;
}) {
  const variants = {
    default: { text: "text-foreground", bg: "border-foreground/20 bg-foreground/5" },
    warning: { text: "text-(--color-warning)", bg: "border-(--color-warning)/20 bg-(--color-warning)/5" },
    success: { text: "text-(--color-success)", bg: "border-(--color-success)/20 bg-(--color-success)/5" },
    danger:  { text: "text-(--color-danger)", bg: "border-(--color-danger)/20 bg-(--color-danger)/5" },
  } as const;

  const commonProps = {
    className: cn(
      "flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors",
      href && "hover:bg-accent/5",
    ),
  };

  const inner = (
    <>
      <div className={cn("rounded-lg border p-2.5", variants[variant].text, variants[variant].bg)}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={cn("text-2xl font-bold tracking-tight", variants[variant].text)}>
          {value}
        </p>
        {mom && mom.trend !== "flat" && (
          <p className={cn(
            "mt-0.5 text-xs flex items-center gap-0.5",
            mom.trend === "up" ? "text-(--color-success)" : "text-(--color-danger)"
          )}>
            {mom.trend === "up" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {mom.change}% vs mes anterior
          </p>
        )}
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
  const [products] = useState(() => productsStore.getAll());
  const [orders] = useState(() => ordersStore.getAll());
  const now = useMemo(() => new Date(), []);

  const activeProducts = products.filter((p) => p.active).length;
  const lowStockVariants = useMemo(() => getLowStockVariants(products), [products]);
  const outOfStockVariants = useMemo(() => getOutOfStockVariants(products), [products]);
  const lowStock = new Set(lowStockVariants.map((item) => item.product.id)).size;
  const customerUsers = usersStore.getAll().filter((u) => u.role === "customer").length;

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const monthOrders = orders.filter((o) => o.createdAt >= startOfMonth);
  const prevMonthOrders = orders.filter(
    (o) => o.createdAt >= startOfPrevMonth && o.createdAt < startOfMonth
  );

  const monthRevenue = monthOrders
    .filter((o) => o.status !== "cancelado" && o.status !== "devuelto")
    .reduce((sum, o) => sum + o.total, 0);

  const prevMonthRevenue = prevMonthOrders
    .filter((o) => o.status !== "cancelado" && o.status !== "devuelto")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter((o) => o.status === "pendiente").length;
  const completedOrders = orders.filter((o) => o.status === "entregado").length;
  const totalOrders = orders.length;

  const ordersMoM = getMoMChange(monthOrders.length, prevMonthOrders.length);
  const revenueMoM = getMoMChange(monthRevenue, prevMonthRevenue);

  const recentOrders = orders
    .toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_ORDERS_LIMIT);

  const userMap = useMemo(() => new Map(usersStore.getAll().map((u) => [u.id, u])), []);
  const statusData = useMemo(() => getStatusDistribution(orders), [orders]);

  const inventoryValue = useMemo(() => getInventoryValue(products), [products]);
  const stockDist = useMemo(() => getStockDistribution(products), [products]);
  const withoutSales = useMemo(() => getVariantsWithoutSales(products, orders, 30), [products, orders]);
  const visibleOutOfStockVariants = outOfStockVariants.slice(0, INVENTORY_ALERTS_LIMIT);
  const visibleLowStockVariants = lowStockVariants.slice(
    0,
    Math.max(0, INVENTORY_ALERTS_LIMIT - visibleOutOfStockVariants.length)
  );
  const totalInventoryAlerts = outOfStockVariants.length + lowStockVariants.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-heading">Dashboard</h1>
        <ClockDisplay />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          mom={ordersMoM}
          icon={ShoppingCart}
          variant={pendingOrders > PENDING_ORDERS_WARNING_THRESHOLD ? "warning" : "default"}
          href={ROUTES.adminPedidos}
        />
        <StatCard
          title="Ingresos del Mes"
          value={formatPrice(monthRevenue)}
          subtitle={`${completedOrders} pedidos completados`}
          mom={revenueMoM}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Pedidos por Estado</h2>
          <StatusDonutChart data={statusData} />
        </div>

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
                <th className="px-3 py-2 font-medium">Pedido</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Total</th>
                <th className="px-3 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const user = userMap.get(order.userId);
                return (
                  <tr key={order.id} className="border-t border-border text-sm hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <Link
                        href={ROUTES.adminPedidoDetalle(order.id)}
                        className="font-mono text-xs text-accent hover:underline"
                      >
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{user?.name ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-3 py-2 font-medium">{formatPrice(order.total)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
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
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
        <div className="h-full rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Productos Destacados</h2>
          <div className="space-y-2">
            {products
              .filter((p) => p.featured && p.active)
              .slice(0, 6)
              .map((p) => (
                <Link
                  key={p.id}
                  href={ROUTES.adminProductoEditar(p.id)}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent/5 transition-colors"
                >
                  <div className="size-10 rounded-md border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">
                        {p.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(p.price)}</span>
                </Link>
              ))}
            {products.filter((p) => p.featured && p.active).length === 0 && (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Sin productos destacados
              </div>
            )}
          </div>
        </div>

        <div className="flex h-full flex-col rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Inventario</h2>
          <div className="grid grid-cols-2 gap-3 mb-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="text-xl font-bold text-accent">{formatPrice(inventoryValue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Agotados</p>
              <p className={cn("text-xl font-bold", stockDist.outOfStock > 0 ? "text-danger" : "text-foreground")}>
                {stockDist.outOfStock}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stock Bajo</p>
              <p className={cn("text-xl font-bold", stockDist.low > 0 ? "text-warning" : "text-foreground")}>
                {stockDist.low}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sin Ventas (30d)</p>
              <p className={cn("text-xl font-bold", withoutSales > 0 ? "text-muted-foreground" : "text-foreground")}>
                {withoutSales}
              </p>
            </div>
          </div>
          {(outOfStockVariants.length > 0 || lowStockVariants.length > 0) && (
            <>
              <div className="mb-2 border-t border-border" />
              <div className="space-y-0.5 overflow-hidden">
                {visibleOutOfStockVariants.map(({ product, variant }) => (
                  <Link
                    key={`${product.id}-${variant.id}-out`}
                    href={ROUTES.adminProductoEditar(product.id)}
                    className="flex items-center justify-between rounded-lg px-2 py-1 text-xs hover:bg-muted/30 transition-colors"
                  >
                    <span className="font-medium truncate">{product.name}</span>
                    <span className="text-xs text-danger shrink-0 ml-2">
                      {variant.color} / {variant.size}: 0
                    </span>
                  </Link>
                ))}
                {visibleLowStockVariants.map(({ product, variant, threshold }) => (
                  <Link
                    key={`${product.id}-${variant.id}-low`}
                    href={ROUTES.adminProductoEditar(product.id)}
                    className="flex items-center justify-between rounded-lg px-2 py-1 text-xs hover:bg-muted/30 transition-colors"
                  >
                    <span className="font-medium truncate">{product.name}</span>
                    <span className="text-xs text-warning shrink-0 ml-2">
                      {variant.color} / {variant.size}: {variant.stock} de {threshold}
                    </span>
                  </Link>
                ))}
                {totalInventoryAlerts > INVENTORY_ALERTS_LIMIT && (
                  <Link
                    href={ROUTES.adminProductos}
                    className="block text-center text-xs text-accent hover:underline py-1"
                  >
                    Ver todas las alertas →
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {lowStock > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/5 p-4">
          <AlertTriangle className="size-5 shrink-0 text-warning mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-warning">Atención: Stock Bajo</p>
            <p className="text-sm text-muted-foreground">
              Hay {lowStockVariants.length} variante{lowStockVariants.length > 1 ? "s" : ""} con stock bajo.
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
