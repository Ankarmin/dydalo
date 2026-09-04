import { read, write, generateId, KEYS } from "./data-store.utils";
import type { Order, OrderOrigin, OrderStatus, CreateOrderInput, Address, PaymentStatus, FulfillmentType, ShipmentStatus } from "./data-store.types";
import { VALID_TRANSITIONS, SHIPMENT_TRANSITIONS, getReservationExpiry, isReservationExpired } from "./data-store.types";
import { productsStore } from "./data-store.products";
import { stockMovementsStore } from "./data-store.stock-movements";
import { auditStore } from "./data-store.audit";
import { paymentsStore } from "./data-store.payments";
import { shipmentsStore } from "./data-store.shipments";

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

function resolveOrigin(data: CreateOrderInput): OrderOrigin {
  if (data.origin) return data.origin;
  return data.source === "admin" ? "manual" : "mp_online";
}

function create(data: CreateOrderInput & { shippingAddressSnapshot: Address }): Order {
  invalidateCache();
  const orders = getAll();
  const now = new Date().toISOString();
  const id = generateId();
  const origin = resolveOrigin(data);

  const order: Order = {
    ...data,
    origin,
    reservationExpiryAt: data.reservationExpiryAt ?? getReservationExpiry(origin, new Date(now)),
    paymentStatus: data.paymentStatus ?? "sin_registro",
    id,
    status: "pendiente",
    statusHistory: [{ from: "pendiente", to: "pendiente", at: now, by: data.createdBy ?? data.userId }],
    createdAt: now,
    updatedAt: now,
  };

  write(KEYS.orders, [...orders, order]);

  if (order.paymentStatus && order.paymentStatus !== "sin_registro") {
    paymentsStore.createAttempt({
      orderId: id,
      status: order.paymentStatus as PaymentStatus,
      amount: order.total,
      method: order.paymentMethod,
      mpPaymentId: order.mpPaymentId,
      reason: origin === "manual" ? "Pedido manual creado por admin" : "Intento inicial checkout MP",
      actorId: data.createdBy ?? data.userId,
      actorName: data.createdBy ?? data.userId,
    });
  }
  return getById(id) ?? order;
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

function updatePaymentStatus(
  id: string,
  input: {
    status: PaymentStatus;
    method?: string;
    mpPaymentId?: string;
    mpStatusDetail?: string;
    reason?: string;
    evidence?: string;
    actorId: string;
    actorName: string;
  }
): Order | undefined {
  const order = getById(id);
  if (!order) return undefined;
  if (input.status === "en_revision" || input.status === "verificado_manual") {
    if (!input.reason?.trim()) return undefined;
  }
  if (input.status === "verificado_manual" && !input.evidence?.trim() && !order.paymentMethod) {
    return undefined;
  }
  const updated = update(id, {
    paymentStatus: input.status,
    paymentMethod: input.method ?? order.paymentMethod,
    mpPaymentId: input.mpPaymentId ?? order.mpPaymentId,
  });
  if (!updated) return undefined;
  paymentsStore.createAttempt({
    orderId: id,
    status: input.status,
    amount: updated.total,
    method: input.method ?? updated.paymentMethod,
    mpPaymentId: input.mpPaymentId ?? updated.mpPaymentId,
    mpStatusDetail: input.mpStatusDetail,
    reason: input.reason,
    evidence: input.evidence,
    actorId: input.actorId,
    actorName: input.actorName,
  });
  if (input.status === "aprobado" || input.status === "verificado_manual") {
    auditStore.create({
      actor: { id: input.actorId, name: input.actorName },
      entityType: "order",
      entityId: id,
      entityLabel: `#${id.slice(0, 8)}`,
      action: "status_change",
      summary: `Reserva convertida en venta definitiva (${input.status})`,
      before: { reservation: true },
      after: { sale: true },
      changes: [{ field: "paymentStatus", before: order.paymentStatus ?? "sin_registro", after: input.status }],
    });
  }
  return getById(id);
}

const EXPIRABLE_PAYMENT_STATUSES: Array<string | undefined> = [
  "sin_registro",
  "pendiente",
  "in_process",
  "rechazado",
  "en_revision",
];

function expireStaleReservations(now: Date = new Date()): Order[] {
  const expired = getAll().filter(
    (order) =>
      order.status === "pendiente" &&
      order.stockReserved &&
      isReservationExpired(order.reservationExpiryAt, now) &&
      EXPIRABLE_PAYMENT_STATUSES.includes(order.paymentStatus)
  );
  const released: Order[] = [];
  for (const order of expired) {
    const stockUpdate = productsStore.applyStockChange(order.items, []);
    if (!stockUpdate.success) continue;
    const updated = update(order.id, {
      status: "cancelado",
      stockReserved: false,
      statusHistory: [
        ...order.statusHistory,
        { from: order.status, to: "cancelado" as const, at: now.toISOString(), by: "sistema" },
      ],
    });
    if (!updated) continue;
    stockMovementsStore.createFromOrderDiff({
      previousItems: order.items,
      nextItems: [],
      type: "release_reservation",
      orderId: order.id,
      actor: { id: "sistema", name: "Sistema" },
      reason: "Reserva expirada sin pago",
    });
    auditStore.create({
      actor: { id: "sistema", name: "Sistema" },
      entityType: "order",
      entityId: order.id,
      entityLabel: `#${order.id.slice(0, 8)}`,
      action: "status_change",
      summary: "Reserva expirada sin pago: pedido cancelado y stock liberado",
      before: { status: order.status, stockReserved: order.stockReserved },
      after: { status: "cancelado", stockReserved: false },
      changes: [
        { field: "status", before: order.status, after: "cancelado" },
        { field: "stockReserved", before: order.stockReserved, after: false },
      ],
    });
    paymentsStore.createAttempt({
      orderId: order.id,
      status: "cancelado",
      amount: order.total,
      method: order.paymentMethod,
      reason: "Reserva expirada sin pago",
      actorId: "sistema",
      actorName: "Sistema",
    });
    const current = getById(order.id);
    if (current) released.push(current);
  }
  return released;
}

function updateShipment(
  id: string,
  input: {
    fulfillmentType?: FulfillmentType;
    status: ShipmentStatus;
    courier?: string;
    trackingCode?: string;
    realShippingCost?: number;
    pickupName?: string;
    pickupDni?: string;
    note?: string;
    evidence?: string;
    actorId: string;
    actorName: string;
  }
): { success: true; data: Order } | { success: false; error: string } {
  const order = getById(id);
  if (!order) return { success: false, error: "Pedido no encontrado" };
  const fulfillmentType = input.fulfillmentType ?? order.fulfillmentType ?? "LIMA_APP";
  const currentStatus = order.shipmentStatus ?? "pendiente";
  const allowed = SHIPMENT_TRANSITIONS[fulfillmentType][currentStatus] ?? [];
  if (!allowed.includes(input.status)) {
    return { success: false, error: `No se puede pasar de "${currentStatus}" a "${input.status}" en ${fulfillmentType}` };
  }
  if (fulfillmentType === "PROVINCIA_OLVA" && input.status === "en_agencia" && !input.trackingCode?.trim() && !order.trackingCode) {
    return { success: false, error: "Olva exige código de guía para marcar en agencia." };
  }
  if (fulfillmentType === "LIMA_APP" && input.status === "entregado" && !input.evidence?.trim()) {
    return { success: false, error: "App exige evidencia de entrega (captura o foto)." };
  }
  if (fulfillmentType === "RECOJO" && input.status === "entregado") {
    const dni = input.pickupDni ?? order.pickupDni;
    if (!dni?.trim()) return { success: false, error: "Recojo exige DNI verificado para entregar." };
  }
  const updated = update(id, {
    fulfillmentType,
    shipmentStatus: input.status,
    courier: input.courier ?? order.courier,
    trackingCode: input.trackingCode ?? order.trackingCode,
    realShippingCost: input.realShippingCost ?? order.realShippingCost,
    pickupName: input.pickupName ?? order.pickupName,
    pickupDni: input.pickupDni ?? order.pickupDni,
  });
  if (!updated) return { success: false, error: "Error al actualizar envío" };
  shipmentsStore.recordEvent({
    orderId: id,
    status: input.status,
    fulfillmentType,
    courier: input.courier ?? order.courier,
    trackingCode: input.trackingCode ?? order.trackingCode,
    note: input.note,
    evidence: input.evidence,
    actorId: input.actorId,
    actorName: input.actorName,
  });
  return { success: true, data: getById(id) ?? updated };
}

function transitionStatus(
  id: string,
  newStatus: OrderStatus,
  userId: string,
  userName?: string,
  options?: { via?: "rma" }
): { success: true; data: Order } | { success: false; error: string } {
  invalidateCache();
  const order = getById(id);
  if (!order) return { success: false, error: "Pedido no encontrado" };

  if (newStatus === "devuelto" && options?.via !== "rma") {
    return { success: false, error: "El estado devuelto solo se genera al cerrar una devolución en /admin/devoluciones" };
  }

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
  updatePaymentStatus,
  updateShipment,
  expireStaleReservations,
  transitionStatus,
  delete: remove,
  seed,
};
