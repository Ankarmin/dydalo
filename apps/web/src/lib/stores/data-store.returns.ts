import { read, write, generateId, KEYS } from "./data-store.utils";
import type { OrderItem, ReturnItem, ReturnReason, ReturnRequest, ReturnStatus } from "./data-store.types";
import { RETURN_SLA_DAYS } from "./data-store.types";
import { ordersStore } from "./data-store.orders";
import { productsStore } from "./data-store.products";
import { stockMovementsStore } from "./data-store.stock-movements";
import { auditStore } from "./data-store.audit";

const RETURNS_KEY = (KEYS as Record<string, string>).returns ?? "dydalo_returns";

function getAll(): ReturnRequest[] {
  return read<ReturnRequest[]>(RETURNS_KEY, []);
}

function getById(id: string): ReturnRequest | undefined {
  return getAll().find((r) => r.id === id);
}

function getByOrderId(orderId: string): ReturnRequest[] {
  return getAll().filter((r) => r.orderId === orderId);
}

function nextCode(): string {
  const count = getAll().length + 1;
  return `RMA-${String(count).padStart(3, "0")}`;
}

function deliveredAt(orderId: string): string | null {
  const order = ordersStore.getById(orderId);
  if (!order) return null;
  const last = [...order.statusHistory].reverse().find((h) => h.to === "entregado");
  return last?.at ?? null;
}

function isWithinSla(orderId: string, now: Date = new Date()): boolean {
  const at = deliveredAt(orderId);
  if (!at) return false;
  const ageMs = now.getTime() - new Date(at).getTime();
  return ageMs <= RETURN_SLA_DAYS * 24 * 60 * 60 * 1000;
}

function alreadyReturnedQty(orderId: string, productId: string, variantId: string): number {
  return getByOrderId(orderId)
    .filter((r) => r.status !== "rechazada")
    .flatMap((r) => r.items)
    .filter((i) => i.productId === productId && i.variantId === variantId)
    .reduce((sum, i) => sum + i.quantity, 0);
}

function persist(request: ReturnRequest): void {
  write(RETURNS_KEY, getAll().map((r) => (r.id === request.id ? request : r)));
}

function log(request: ReturnRequest, action: "create" | "update" | "status_change", summary: string, actor: { id: string; name: string }, before?: unknown, after?: unknown): void {
  auditStore.create({
    actor,
    entityType: "order",
    entityId: request.orderId,
    entityLabel: request.code,
    action,
    summary,
    before,
    after,
  });
}

function create(input: {
  orderId: string;
  userId: string;
  origin: "web" | "admin";
  items: Array<{ productId: string; variantId: string; quantity: number; reason: ReturnReason; reasonNote?: string }>;
  actorId: string;
  actorName: string;
}): { success: true; data: ReturnRequest } | { success: false; error: string } {
  const order = ordersStore.getById(input.orderId);
  if (!order) return { success: false, error: "Pedido no encontrado" };
  if (order.status !== "entregado") return { success: false, error: "Solo pedidos entregados admiten devolución" };
  if (!isWithinSla(input.orderId)) return { success: false, error: `Fuera del plazo de ${RETURN_SLA_DAYS} días` };
  if (input.items.length === 0) return { success: false, error: "Elige al menos un item" };
  const items: ReturnItem[] = [];
  for (const req of input.items) {
    const orderItem = order.items.find((i) => i.productId === req.productId && i.variantId === req.variantId);
    if (!orderItem) return { success: false, error: "Item no pertenece al pedido" };
    if (req.quantity <= 0) return { success: false, error: "Cantidad inválida" };
    const available = orderItem.quantity - alreadyReturnedQty(input.orderId, req.productId, req.variantId);
    if (req.quantity > available) return { success: false, error: `Solo quedan ${available} uds devolvibles de ${orderItem.name}` };
    if (!req.reasonNote?.trim() && req.reason === "otro") return { success: false, error: "Describe el motivo" };
    items.push({
      productId: orderItem.productId,
      variantId: orderItem.variantId,
      name: orderItem.name,
      size: orderItem.size,
      color: orderItem.color,
      price: orderItem.price,
      unitCost: orderItem.unitCost,
      quantity: req.quantity,
      reason: req.reason,
      reasonNote: req.reasonNote?.trim() || undefined,
      receivedQuantity: 0,
      restockQuantity: 0,
      damageQuantity: 0,
    });
  }
  const now = new Date().toISOString();
  const request: ReturnRequest = {
    id: generateId(),
    code: nextCode(),
    orderId: input.orderId,
    userId: input.userId,
    origin: input.origin,
    status: input.origin === "admin" ? "aprobada" : "solicitada",
    items,
    createdBy: input.actorId,
    createdByName: input.actorName,
    createdAt: now,
    updatedAt: now,
  };
  write(RETURNS_KEY, [request, ...getAll()]);
  const actor = { id: input.actorId, name: input.actorName };
  log(request, "create", `${request.code} ${input.origin === "admin" ? "creada por admin" : "solicitada por cliente"} (${items.length} líneas)`, actor, undefined, request);
  return { success: true, data: request };
}

function setStatus(
  id: string,
  status: ReturnStatus,
  actor: { id: string; name: string },
  note?: string
): ReturnRequest | undefined {
  const request = getById(id);
  if (!request) return undefined;
  const allowed: Record<ReturnStatus, ReturnStatus[]> = {
    solicitada: ["aprobada", "rechazada"],
    aprobada: ["recibida", "rechazada"],
    recibida: ["inspeccionada"],
    inspeccionada: ["cerrada"],
    rechazada: [],
    cerrada: [],
  };
  if (!allowed[request.status].includes(status)) return undefined;
  const updated: ReturnRequest = { ...request, status, updatedAt: new Date().toISOString() };
  persist(updated);
  log(updated, "status_change", `${request.code}: ${request.status} → ${status}${note ? ` — ${note}` : ""}`, actor, { status: request.status }, { status });
  return updated;
}

function receive(
  id: string,
  input: { lines: Array<{ productId: string; variantId: string; quantity: number }>; actorId: string; actorName: string }
): { success: true; data: ReturnRequest } | { success: false; error: string } {
  const request = getById(id);
  if (!request || request.status !== "aprobada") return { success: false, error: "La devolución debe estar aprobada" };
  const items = request.items.map((item) => {
    const req = input.lines.find((l) => l.productId === item.productId && l.variantId === item.variantId);
    const qty = Math.min(req?.quantity ?? item.quantity, item.quantity);
    return { ...item, receivedQuantity: qty };
  });
  if (items.every((i) => i.receivedQuantity === 0)) return { success: false, error: "Indica lo recibido por línea" };
  const updated: ReturnRequest = { ...request, items, status: "recibida", updatedAt: new Date().toISOString() };
  persist(updated);
  log(updated, "status_change", `${request.code} recibida en almacén`, { id: input.actorId, name: input.actorName }, { status: request.status }, { status: "recibida" });
  return { success: true, data: updated };
}

function inspect(
  id: string,
  input: {
    lines: Array<{ productId: string; variantId: string; restock: number; damage: number; evidence?: string }>;
    actorId: string;
    actorName: string;
  }
): { success: true; data: ReturnRequest } | { success: false; error: string } {
  const request = getById(id);
  if (!request || request.status !== "recibida") return { success: false, error: "La devolución debe estar recibida" };
  const actor = { id: input.actorId, name: input.actorName };
  for (const item of request.items) {
    const req = input.lines.find((l) => l.productId === item.productId && l.variantId === item.variantId);
    const restock = req?.restock ?? 0;
    const damage = req?.damage ?? 0;
    if (restock < 0 || damage < 0 || restock + damage !== item.receivedQuantity) {
      return { success: false, error: `En ${item.name}: reingreso + damage debe sumar lo recibido (${item.receivedQuantity})` };
    }
  }
  const items = request.items.map((item) => {
    const req = input.lines.find((l) => l.productId === item.productId && l.variantId === item.variantId);
    return {
      ...item,
      restockQuantity: req?.restock ?? 0,
      damageQuantity: req?.damage ?? 0,
      evidence: req?.evidence?.trim() || item.evidence,
    };
  });
  for (const item of items) {
    if (item.restockQuantity > 0) {
      const product = productsStore.getById(item.productId);
      const variant = product?.variants?.find((v) => v.id === item.variantId);
      if (product && variant) {
        const entry: OrderItem = {
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          quantity: item.restockQuantity,
          price: 0,
          size: variant.size,
          color: variant.color,
        };
        const validation = productsStore.applyStockChange([entry], []);
        if (validation.success) {
          stockMovementsStore.createFromOrderDiff({
            previousItems: [entry],
            nextItems: [],
            type: "return",
            orderId: request.orderId,
            actor,
            reason: `${request.code} · ${item.name}`,
          });
        }
      }
    }
  }
  const updated: ReturnRequest = { ...request, items, status: "inspeccionada", updatedAt: new Date().toISOString() };
  persist(updated);
  const restocked = items.reduce((s, i) => s + i.restockQuantity, 0);
  const damaged = items.reduce((s, i) => s + i.damageQuantity, 0);
  log(updated, "status_change", `${request.code} inspeccionada: ${restocked} reingresan, ${damaged} a damage`, actor, { status: request.status }, { status: "inspeccionada" });
  return { success: true, data: updated };
}

function recordDamage(
  request: ReturnRequest,
  actor: { id: string; name: string }
): string[] {
  const warnings: string[] = [];
  const order = ordersStore.getById(request.orderId);
  const nettable = order?.status === "devuelto";
  for (const item of request.items) {
    if (item.damageQuantity <= 0) continue;
    const product = productsStore.getById(item.productId);
    const variant = product?.variants?.find((v) => v.id === item.variantId);
    if (!product || !variant) {
      warnings.push(`Sin merma en kardex para ${item.name}: producto o variante no encontrado`);
      continue;
    }
    const entry: OrderItem = {
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      quantity: item.damageQuantity,
      price: 0,
      size: variant.size,
      color: variant.color,
    };
    if (nettable) {
      const applied = productsStore.applyStockChange([], [entry]);
      if (!applied.success) {
        warnings.push(`Sin merma en kardex para ${item.name}: ${applied.error}`);
        continue;
      }
      stockMovementsStore.createFromOrderDiff({
        previousItems: [],
        nextItems: [entry],
        type: "damage",
        orderId: request.orderId,
        actor,
        reason: `${request.code} · merma no vendible`,
      });
    } else {
      stockMovementsStore.create({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        sku: product.sku,
        variantId: variant.id,
        size: variant.size,
        color: variant.color,
        type: "damage",
        quantityBefore: variant.stock,
        quantityChange: 0,
        quantityAfter: variant.stock,
        orderId: request.orderId,
        reason: `${request.code} · merma no vendible (informativa, sin stock que netear)`,
        createdBy: actor.id,
        createdByName: actor.name,
      });
    }
  }
  return warnings;
}

function close(
  id: string,
  input: { refundAmount: number; refundNote?: string; actorId: string; actorName: string }
): { success: true; data: ReturnRequest; warnings: string[] } | { success: false; error: string } {
  const request = getById(id);
  if (!request || request.status !== "inspeccionada") return { success: false, error: "La devolución debe estar inspeccionada" };
  const approvedTotal = request.items.reduce((s, i) => s + i.price * i.quantity, 0);
  if (input.refundAmount < 0 || input.refundAmount > approvedTotal) {
    return { success: false, error: `Reembolso máximo S/${approvedTotal.toFixed(2)}` };
  }
  const actor = { id: input.actorId, name: input.actorName };
  const order = ordersStore.getById(request.orderId);
  const allReturned =
    order?.items.every((oi) => {
      const totalReturned = getByOrderId(request.orderId)
        .filter((r) => r.status === "cerrada" || r.id === request.id)
        .flatMap((r) => r.items)
        .filter((i) => i.productId === oi.productId && i.variantId === oi.variantId)
        .reduce((s, i) => s + i.quantity, 0);
      return totalReturned >= oi.quantity;
    }) ?? false;
  if (allReturned && order && order.status === "entregado") {
    ordersStore.transitionStatus(order.id, "devuelto", actor.id, actor.name, { via: "rma" });
  }
  const damageWarnings = recordDamage(request, actor);
  if (input.refundAmount > 0) {
    ordersStore.updatePaymentStatus(order?.id ?? request.orderId, {
      status: "reembolsado",
      reason: `${request.code}: reembolso S/${input.refundAmount.toFixed(2)}${input.refundNote ? ` — ${input.refundNote}` : ""}`,
      actorId: actor.id,
      actorName: actor.name,
    });
  }
  const updated: ReturnRequest = {
    ...request,
    status: "cerrada",
    refundAmount: input.refundAmount,
    refundNote: input.refundNote?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };
  persist(updated);
  const damageSummary =
    damageWarnings.length > 0
      ? ` Advertencias: ${damageWarnings.join("; ")}`
      : request.items.some((i) => i.damageQuantity > 0)
        ? ` (${request.items.reduce((s, i) => s + i.restockQuantity, 0)} reingresan, ${request.items.reduce((s, i) => s + i.damageQuantity, 0)} a merma)`
        : "";
  log(updated, "status_change", `${request.code} cerrada con reembolso S/${input.refundAmount.toFixed(2)}${damageSummary}`, actor, { status: request.status }, { status: "cerrada" });
  return { success: true, data: updated, warnings: damageWarnings };
}

export const returnsStore = {
  getAll,
  getById,
  getByOrderId,
  deliveredAt,
  isWithinSla,
  create,
  setStatus,
  receive,
  inspect,
  close,
  ensureDamageBackfill,
};

function ensureDamageBackfill(): { fixed: number; warnings: string[] } {
  const actor = { id: "sistema", name: "Sistema" };
  const movements = stockMovementsStore.getAll().filter((m) => m.type === "damage");
  let fixed = 0;
  const warnings: string[] = [];
  for (const request of getAll().filter((r) => r.status === "cerrada" && r.items.some((i) => i.damageQuantity > 0))) {
    const exists = movements.some((m) => m.orderId === request.orderId && (m.reason ?? "").includes(request.code));
    if (exists) continue;
    const issues = recordDamage(request, actor);
    if (issues.length > 0) {
      warnings.push(`${request.code}: ${issues.join("; ")}`);
      continue;
    }
    auditStore.create({
      actor,
      entityType: "order",
      entityId: request.orderId,
      entityLabel: request.code,
      action: "update",
      summary: `${request.code}: backfill de merma en kardex`,
    });
    fixed += 1;
  }
  return { fixed, warnings };
}
