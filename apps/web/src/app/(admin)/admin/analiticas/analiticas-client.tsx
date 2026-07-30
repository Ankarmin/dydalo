"use client";

import { useState, useMemo } from "react";
import { productsStore } from "@/lib/stores/data-store.products";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { seedIfEmpty } from "@/config/seed-data";
import {
  getMonthlyRevenue,
  getTopProducts,
  getCategorySales,
  getMonthlyOrdersByStatus,
  getCustomerAcquisition,
} from "@/lib/utils/analytics";
import { usersStore } from "@/lib/stores/data-store.users";
import { RevenueChart } from "@/components/admin/charts/revenue-chart";
import { TopProductsChart } from "@/components/admin/charts/top-products-chart";
import { CategoryChart } from "@/components/admin/charts/category-chart";
import { SimpleBarChart } from "@/components/admin/charts/simple-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AnaliticasClient() {
  seedIfEmpty();
  const [products] = useState(() => productsStore.getAll());
  const [orders] = useState(() => ordersStore.getAll());
  const [users] = useState(() => usersStore.getAll());

  const monthlyRevenue = useMemo(() => getMonthlyRevenue(orders, 12), [orders]);
  const topProducts = useMemo(() => getTopProducts(orders, products, 10), [orders, products]);
  const categorySales = useMemo(() => getCategorySales(orders, products), [orders, products]);
  const ordersByStatus = useMemo(() => getMonthlyOrdersByStatus(orders, 12), [orders]);
  const customers = useMemo(() => getCustomerAcquisition(users, 12), [users]);

  const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0);
  const totalOrders = orders.length;
  const activeProducts = products.filter((p) => p.active).length;
  const customerCount = users.filter((u) => u.role === "customer").length;

  const completedByMonth = ordersByStatus.map((m) => ({
    label: m.label,
    value: m.completados + m.pendientes,
  }));

  const customersByMonth = customers.map((m) => ({
    label: m.label,
    value: m.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-heading">Analíticas</h1>
        <p className="text-sm text-muted-foreground">
          Últimos 12 meses · {totalOrders} pedidos · {activeProducts} productos activos
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Resumen General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Ingresos Totales</p>
              <p className="text-2xl font-bold text-accent">
                S/ {totalRevenue.toLocaleString("es-PE")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pedidos</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Productos</p>
              <p className="text-2xl font-bold">{activeProducts}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clientes</p>
              <p className="text-2xl font-bold">{customerCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Ingresos Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={monthlyRevenue} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Evolución de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={completedByMonth}
              color="var(--chart-4)"
              valueLabel="Pedidos"
              height="h-[300px]"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top 10 Productos por Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <TopProductsChart data={topProducts} />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                Sin datos de ventas aún
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Ventas por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {categorySales.length > 0 ? (
              <CategoryChart data={categorySales} />
            ) : (
              <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                Sin datos de ventas aún
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Adquisición de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleBarChart
            data={customersByMonth}
            color="var(--chart-3)"
            valueLabel="Clientes"
            height="h-[220px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
