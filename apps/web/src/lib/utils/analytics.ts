import type { Order, AdminProduct, User } from "@/lib/stores/data-store.types";

export type MonthlyData = {
  month: string;
  label: string;
  revenue: number;
  orderCount: number;
};

export type StatusDistribution = {
  status: string;
  count: number;
};

export type TopProduct = {
  productId: number;
  name: string;
  units: number;
  revenue: number;
  category: string;
};

export type CategorySales = {
  category: string;
  units: number;
  revenue: number;
};

export type MoMChange = {
  current: number;
  previous: number;
  change: number;
  trend: "up" | "down" | "flat";
};

const MONTH_NAMES: string[] = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export function getMonthlyRevenue(orders: Order[], months: number = 12): MonthlyData[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const validOrders = orders.filter(
    (o) => o.status !== "cancelado" && o.status !== "devuelto"
  );

  const buckets = new Map<string, { revenue: number; orderCount: number }>();

  const cursor = new Date(start);
  while (cursor <= now) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { revenue: 0, orderCount: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const order of validOrders) {
    const d = new Date(order.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = buckets.get(key);
    if (entry) {
      entry.revenue += order.total;
      entry.orderCount += 1;
    }
  }

  return Array.from(buckets.entries()).map(([month, data]) => ({
    month,
    label: `${MONTH_NAMES[parseInt(month.split("-")[1]) - 1]}`,
    revenue: data.revenue,
    orderCount: data.orderCount,
  }));
}

export function getStatusDistribution(orders: Order[]): StatusDistribution[] {
  const counts: Record<string, number> = {};

  for (const order of orders) {
    counts[order.status] = (counts[order.status] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([status, count]) => ({
      status,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export function getTopProducts(
  orders: Order[],
  products: AdminProduct[],
  limit: number = 5
): TopProduct[] {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const sales: Record<number, { units: number; revenue: number }> = {};

  for (const order of orders) {
    if (order.status === "cancelado") continue;
    for (const item of order.items) {
      if (!sales[item.productId]) {
        sales[item.productId] = { units: 0, revenue: 0 };
      }
      sales[item.productId].units += item.quantity;
      sales[item.productId].revenue += item.price * item.quantity;
    }
  }

  return Object.entries(sales)
    .map(([productId, data]) => {
      const product = productMap.get(Number(productId));
      return {
        productId: Number(productId),
        name: product?.name ?? `Producto #${productId}`,
        units: data.units,
        revenue: data.revenue,
        category: product?.category ?? "desconocido",
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function getCategorySales(
  orders: Order[],
  products: AdminProduct[]
): CategorySales[] {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const categoryData: Record<string, { units: number; revenue: number }> = {};

  for (const order of orders) {
    if (order.status === "cancelado") continue;
    for (const item of order.items) {
      const product = productMap.get(item.productId);
      const category = product?.category ?? "sin categoría";
      if (!categoryData[category]) {
        categoryData[category] = { units: 0, revenue: 0 };
      }
      categoryData[category].units += item.quantity;
      categoryData[category].revenue += item.price * item.quantity;
    }
  }

  return Object.entries(categoryData)
    .map(([category, data]) => ({
      category,
      units: data.units,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function getMoMChange(current: number, previous: number): MoMChange {
  if (previous === 0) {
    return { current, previous, change: current > 0 ? 100 : 0, trend: current > 0 ? "up" : "flat" };
  }
  const change = Math.round(((current - previous) / previous) * 100);
  return {
    current,
    previous,
    change,
    trend: change > 0 ? "up" : change < 0 ? "down" : "flat",
  };
}

export function getMonthlyOrdersByStatus(
  orders: Order[],
  months: number = 12
): { month: string; label: string; pendientes: number; completados: number; cancelados: number }[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const buckets = new Map<string, { pendientes: number; completados: number; cancelados: number }>();

  const cursor = new Date(start);
  while (cursor <= now) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { pendientes: 0, completados: 0, cancelados: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const order of orders) {
    const d = new Date(order.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = buckets.get(key);
    if (!entry) continue;

    if (order.status === "entregado" || order.status === "enviado") {
      entry.completados += 1;
    } else if (order.status === "cancelado" || order.status === "devuelto") {
      entry.cancelados += 1;
    } else {
      entry.pendientes += 1;
    }
  }

  return Array.from(buckets.entries()).map(([month, data]) => ({
    month,
    label: `${MONTH_NAMES[parseInt(month.split("-")[1]) - 1]}`,
    ...data,
  }));
}

export function getCustomerAcquisition(users: User[], months: number = 12): { month: string; label: string; count: number }[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const buckets = new Map<string, number>();

  const cursor = new Date(start);
  while (cursor <= now) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const customers = users.filter((u) => u.role === "customer");

  for (const user of customers) {
    const d = new Date(user.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = buckets.get(key);
    if (entry !== undefined) {
      buckets.set(key, entry + 1);
    }
  }

  return Array.from(buckets.entries()).map(([month, count]) => ({
    month,
    label: `${MONTH_NAMES[parseInt(month.split("-")[1]) - 1]}`,
    count,
  }));
}
