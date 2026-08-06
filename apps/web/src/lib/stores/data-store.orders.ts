import { read, write, generateId, KEYS } from "./data-store.utils";
import type { Order, OrderStatus, CreateOrderInput, Address } from "./data-store.types";
import { VALID_TRANSITIONS } from "./data-store.types";
import { productsStore } from "./data-store.products";
import { stockMovementsStore } from "./data-store.stock-movements";
import { auditStore } from "./data-store.audit";

let ordersByUserCache: Map<string, Order[]> | null = null;

function invalidateCache(): void {
  ordersByUserCache = null;
}

function getAll(): Order[] {
  return read<Order[]>(KEYS.orders, []);
}

function getById(id: string): Order | undefined {
  const orders = getAll();
  return orders.find((o) => o.id === id);
}

function getByUserId(userId: string): Order[] {
  if (!ordersByUserCache) {
    const all = getAll();
    const map = new Map<string, Order[]>();
    for (const order of all) {
      const existing = map.get(order.userId) ?? [];
      existing.push(order);
      map.set(order.userId, existing);
    }
    ordersByUserCache = map;
  }
  return ordersByUserCache.get(userId) ?? [];
}

function create(data: CreateOrderInput & { shippingAddressSnapshot: Address }): Order {
  invalidateCache();
  const orders = getAll();
  const now = new Date().toISOString();
  const id = generateId();

  const order: Order = {
    ...data,
    id,
    status: "pendiente",
    statusHistory: [{ from: "pendiente", to: "pendiente", at: now, by: data.createdBy ?? data.userId }],
    createdAt: now,
    updatedAt: now,
  };

  write(KEYS.orders, [...orders, order]);
  return order;
}

function update(id: string, data: Partial<Order>): Order | undefined {
  invalidateCache();
  const orders = getAll();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return undefined;

  const updated: Order = {
    ...orders[index],
    ...data,
    id: orders[index].id,
    createdAt: orders[index].createdAt,
    updatedAt: new Date().toISOString(),
  };

  const next = [...orders];
  next[index] = updated;
  write(KEYS.orders, next);
  return updated;
}

function transitionStatus(
  id: string,
  newStatus: OrderStatus,
  userId: string,
  userName?: string
): { success: true; data: Order } | { success: false; error: string } {
  invalidateCache();
  const order = getById(id);
  if (!order) return { success: false, error: "Pedido no encontrado" };

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error: `No se puede cambiar de "${order.status}" a "${newStatus}"`,
    };
  }

  const now = new Date().toISOString();
  const actor = { id: userId, name: userName ?? userId };
  const shouldRestoreStock = order.stockReserved && (newStatus === "cancelado" || newStatus === "devuelto");
  if (shouldRestoreStock) {
    const stockUpdate = productsStore.applyStockChange(order.items, []);
    if (!stockUpdate.success) return stockUpdate;
  }

  const updated = update(id, {
    status: newStatus,
    stockReserved: shouldRestoreStock ? false : order.stockReserved,
    statusHistory: [
      ...order.statusHistory,
      { from: order.status, to: newStatus, at: now, by: userId },
    ],
  });

  if (!updated) return { success: false, error: "Error al actualizar pedido" };
  if (shouldRestoreStock) {
    stockMovementsStore.createFromOrderDiff({
      previousItems: order.items,
      nextItems: [],
      type: newStatus === "cancelado" ? "cancellation" : "return",
      orderId: order.id,
      actor,
      reason: newStatus === "cancelado" ? "Pedido cancelado" : "Pedido devuelto",
    });
  }
  auditStore.create({
    actor,
    entityType: "order",
    entityId: order.id,
    entityLabel: `#${order.id.slice(0, 8)}`,
    action: "status_change",
    summary: `Cambió el estado del pedido de ${order.status} a ${newStatus}`,
    before: { status: order.status, stockReserved: order.stockReserved },
    after: { status: updated.status, stockReserved: updated.stockReserved },
    changes: [
      { field: "status", before: order.status, after: newStatus },
      ...(order.stockReserved !== updated.stockReserved
        ? [{ field: "stockReserved", before: order.stockReserved, after: updated.stockReserved }]
        : []),
    ],
  });
  return { success: true, data: updated };
}

function remove(id: string): boolean {
  invalidateCache();
  const orders = getAll();
  const filtered = orders.filter((o) => o.id !== id);
  if (filtered.length === orders.length) return false;
  write(KEYS.orders, filtered);
  return true;
}

function seed(items: Order[]): void {
  write(KEYS.orders, items);
}

export const ordersStore = {
  getAll,
  getById,
  getByUserId,
  create,
  update,
  transitionStatus,
  delete: remove,
  seed,
};
