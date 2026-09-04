import { read, write, generateId, KEYS } from "./data-store.utils";
import type { OrderItem, PurchaseLine, PurchaseOrder } from "./data-store.types";
import { productsStore } from "./data-store.products";
import { stockMovementsStore } from "./data-store.stock-movements";
import { auditStore } from "./data-store.audit";
import { suppliersStore } from "./data-store.suppliers";

const PURCHASES_KEY = (KEYS as Record<string, string>).purchases ?? "dydalo_purchases";

function getAll(): PurchaseOrder[] {
  return read<PurchaseOrder[]>(PURCHASES_KEY, []);
}

function getById(id: string): PurchaseOrder | undefined {
  return getAll().find((p) => p.id === id);
}

function nextCode(): string {
  const count = getAll().length + 1;
  return `OC-${String(count).padStart(3, "0")}`;
}

function create(data: {
  supplierId: string;
  lines: Array<{ productId: string; quantity: number; unitCost: number }>;
  note?: string;
  actorId: string;
  actorName: string;
}): PurchaseOrder | undefined {
  const supplier = suppliersStore.getById(data.supplierId);
  if (!supplier) return undefined;
  const products = new Map(productsStore.getAll().map((p) => [p.id, p]));
  const lines: PurchaseLine[] = [];
  for (const line of data.lines) {
    const product = products.get(line.productId);
    if (!product || line.quantity <= 0 || line.unitCost < 0) return undefined;
    lines.push({
      productId: product.id,
      productName: product.name,
      quantity: line.quantity,
      receivedQuantity: 0,
      unitCost: line.unitCost,
    });
  }
  if (lines.length === 0) return undefined;
  const now = new Date().toISOString();
  const order: PurchaseOrder = {
    id: generateId(),
    code: nextCode(),
    supplierId: supplier.id,
    supplierName: supplier.name,
    status: "pendiente",
    lines,
    note: data.note?.trim() || undefined,
    createdBy: data.actorId,
    createdByName: data.actorName,
    createdAt: now,
    updatedAt: now,
  };
  write(PURCHASES_KEY, [order, ...getAll()]);
  auditStore.create({
    actor: { id: data.actorId, name: data.actorName },
    entityType: "inventory",
    entityId: order.id,
    entityLabel: order.code,
    action: "create",
    summary: `Creó ${order.code} a ${supplier.name} (${lines.length} líneas)`,
    after: order,
  });
  return order;
}

function receive(
  id: string,
  input: { lines: Array<{ productId: string; quantity: number }>; actorId: string; actorName: string }
): { success: true; data: PurchaseOrder } | { success: false; error: string } {
  const order = getById(id);
  if (!order) return { success: false, error: "Compra no encontrada" };
  if (order.status === "recibida" || order.status === "cancelada") {
    return { success: false, error: `La compra ya está ${order.status}` };
  }
  const actor = { id: input.actorId, name: input.actorName };
  const updatedLines = order.lines.map((line) => {
    const req = input.lines.find((l) => l.productId === line.productId);
    if (!req || req.quantity <= 0) return line;
    const pending = line.quantity - line.receivedQuantity;
    const qty = Math.min(req.quantity, pending);
    if (qty <= 0) return line;
    return { ...line, receivedQuantity: line.receivedQuantity + qty };
  });

  const receivedNow = updatedLines.reduce((sum, l, i) => sum + (l.receivedQuantity - order.lines[i].receivedQuantity), 0);
  if (receivedNow === 0) return { success: false, error: "Sin cantidades pendientes por recibir" };

  applyReception(updatedLines, order.lines, actor, `Recepción ${order.code}`);

  const allReceived = updatedLines.every((l) => l.receivedQuantity >= l.quantity);
  const updated: PurchaseOrder = {
    ...order,
    lines: updatedLines,
    status: allReceived ? "recibida" : "parcial",
    updatedAt: new Date().toISOString(),
  };
  const all = getAll();
  write(
    PURCHASES_KEY,
    all.map((p) => (p.id === id ? updated : p))
  );
  auditStore.create({
    actor,
    entityType: "inventory",
    entityId: id,
    entityLabel: order.code,
    action: "update",
    summary: `Recibió ${receivedNow} uds de ${order.code} (${updated.status})`,
    before: { status: order.status },
    after: { status: updated.status },
    changes: [{ field: "status", before: order.status, after: updated.status }],
  });
  return { success: true, data: updated };
}

function applyReception(
  updatedLines: PurchaseLine[],
  previousLines: PurchaseLine[],
  actor: { id: string; name: string },
  reason: string
): void {
  const now = new Date().toISOString();
  for (let i = 0; i < updatedLines.length; i += 1) {
    const delta = updatedLines[i].receivedQuantity - previousLines[i].receivedQuantity;
    if (delta <= 0) continue;
    const product = productsStore.getById(updatedLines[i].productId);
    if (!product || !product.variants || product.variants.length === 0) continue;
    const active = product.variants.filter((v) => v.active);
    const targets = active.length > 0 ? active : product.variants;
    const perVariant = Math.floor(delta / targets.length);
    const remainder = delta % targets.length;
    const items: OrderItem[] = targets.map((v, vi) => ({
      productId: product.id,
      variantId: v.id,
      name: product.name,
      quantity: perVariant + (vi < remainder ? 1 : 0),
      price: 0,
      size: v.size,
      color: v.color,
    })).filter((item) => item.quantity > 0);
    const validation = productsStore.applyStockChange(items, []);
    if (!validation.success) continue;
    stockMovementsStore.createFromOrderDiff({
      previousItems: items,
      nextItems: [],
      type: "purchase",
      actor,
      reason: `${reason} · ${product.name}`,
    });
    productsStore.update(product.id, { costPrice: updatedLines[i].unitCost, updatedAt: now });
    auditStore.create({
      actor,
      entityType: "product",
      entityId: product.id,
      entityLabel: product.name,
      action: "update",
      summary: `Actualizó costo de ${product.name} por ${reason}`,
      before: { costPrice: product.costPrice },
      after: { costPrice: updatedLines[i].unitCost },
      changes: [{ field: "costPrice", before: product.costPrice ?? null, after: updatedLines[i].unitCost }],
    });
  }
}

function cancel(id: string, actorId: string, actorName: string): PurchaseOrder | undefined {
  const order = getById(id);
  if (!order || order.status === "recibida" || order.status === "cancelada") return undefined;
  const updated: PurchaseOrder = { ...order, status: "cancelada", updatedAt: new Date().toISOString() };
  write(
    PURCHASES_KEY,
    getAll().map((p) => (p.id === id ? updated : p))
  );
  auditStore.create({
    actor: { id: actorId, name: actorName },
    entityType: "inventory",
    entityId: id,
    entityLabel: order.code,
    action: "status_change",
    summary: `Canceló ${order.code}`,
    before: { status: order.status },
    after: { status: "cancelada" },
    changes: [{ field: "status", before: order.status, after: "cancelada" }],
  });
  return updated;
}

export const purchasesStore = {
  getAll,
  getById,
  create,
  receive,
  cancel,
};
