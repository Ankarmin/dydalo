import { read, write, generateId, KEYS } from "./data-store.utils";
import type { AdminProduct, OrderItem, StockMovement, StockMovementType } from "./data-store.types";
import { productsStore } from "./data-store.products";
import { getVariantKey, summarizeItems } from "@/lib/utils/inventory";

type Actor = {
  id: string;
  name: string;
};

type CreateStockMovementInput = Omit<StockMovement, "id" | "createdAt"> & {
  createdAt?: string;
};

type CreateFromOrderDiffInput = {
  previousItems: OrderItem[];
  nextItems: OrderItem[];
  type: StockMovementType;
  orderId?: string;
  actor: Actor;
  reason?: string;
  note?: string;
};

type CreateFromProductVariantDiffInput = {
  before?: AdminProduct;
  after: AdminProduct;
  type: StockMovementType;
  actor: Actor;
  reason?: string;
  note?: string;
};

function getAll(): StockMovement[] {
  return read<StockMovement[]>(KEYS.stockMovements, []);
}

function withProductSnapshot(data: CreateStockMovementInput): CreateStockMovementInput {
  const product = productsStore.getById(data.productId);
  return {
    ...data,
    productName: product?.name ?? data.productName,
    productImage: data.productImage ?? product?.image,
    sku: product?.sku ?? data.sku,
  };
}

function create(data: CreateStockMovementInput): StockMovement {
  const movement: StockMovement = {
    ...withProductSnapshot(data),
    id: generateId(),
    createdAt: data.createdAt ?? new Date().toISOString(),
  };

  write(KEYS.stockMovements, [movement, ...getAll()]);
  return movement;
}

function createMany(items: CreateStockMovementInput[]): StockMovement[] {
  if (items.length === 0) return [];

  const now = new Date().toISOString();
  const movements = items.map((item) => ({
    ...withProductSnapshot(item),
    id: generateId(),
    createdAt: item.createdAt ?? now,
  }));

  write(KEYS.stockMovements, [...movements, ...getAll()]);
  return movements;
}

function createFromOrderDiff({
  previousItems,
  nextItems,
  type,
  orderId,
  actor,
  reason,
  note,
}: CreateFromOrderDiffInput): StockMovement[] {
  const previous = summarizeItems(previousItems);
  const next = summarizeItems(nextItems);
  const keys = new Set([...previous.keys(), ...next.keys()]);
  const movements: CreateStockMovementInput[] = [];

  for (const key of keys) {
    const nextEntry = next.get(key);
    const previousEntry = previous.get(key);
    const item = nextEntry?.item ?? previousEntry?.item;
    if (!item) continue;

    const reservedDelta = (nextEntry?.quantity ?? 0) - (previousEntry?.quantity ?? 0);
    if (reservedDelta === 0) continue;

    const product = productsStore.getById(item.productId);
    if (!product) continue;

    const variant = product.variants?.find(
      (entry) => getVariantKey(entry.size, entry.color) === getVariantKey(item.size, item.color)
    );
    if (!variant) continue;

    const quantityChange = -reservedDelta;
    const quantityAfter = variant.stock;
    const quantityBefore = quantityAfter - quantityChange;

    movements.push({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      sku: product.sku,
      variantId: variant.id,
      size: variant.size,
      color: variant.color,
      type,
      quantityBefore,
      quantityChange,
      quantityAfter,
      orderId,
      reason,
      note,
      createdBy: actor.id,
      createdByName: actor.name,
    });
  }

  return createMany(movements);
}

function createFromProductVariantDiff({
  before,
  after,
  type,
  actor,
  reason,
  note,
}: CreateFromProductVariantDiffInput): StockMovement[] {
  const beforeVariants = new Map(
    (before?.variants ?? []).map((variant) => [getVariantKey(variant.size, variant.color), variant])
  );
  const movements: CreateStockMovementInput[] = [];

  for (const variant of after.variants ?? []) {
    const previous = beforeVariants.get(getVariantKey(variant.size, variant.color));
    const quantityBefore = previous?.stock ?? 0;
    const quantityAfter = variant.stock;
    const quantityChange = quantityAfter - quantityBefore;
    if (quantityChange === 0) continue;

    movements.push({
      productId: after.id,
      productName: after.name,
      productImage: after.image,
      sku: after.sku,
      variantId: variant.id,
      size: variant.size,
      color: variant.color,
      type,
      quantityBefore,
      quantityChange,
      quantityAfter,
      reason,
      note,
      createdBy: actor.id,
      createdByName: actor.name,
    });
  }

  return createMany(movements);
}

function ensureInitialInventorySnapshot(): StockMovement[] {
  const existing = getAll();
  if (existing.length > 0) return existing;

  const movements: CreateStockMovementInput[] = productsStore
    .getAll()
    .filter((product) => product.active)
    .flatMap((product) =>
      (product.variants ?? [])
        .filter((variant) => variant.active && variant.stock > 0)
        .map((variant) => ({
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          sku: product.sku,
          variantId: variant.id,
          size: variant.size,
          color: variant.color,
          type: "purchase" as const,
          quantityBefore: 0,
          quantityChange: variant.stock,
          quantityAfter: variant.stock,
          reason: "Inventario inicial migrado",
          createdBy: "system",
          createdByName: "Sistema",
          createdAt: product.createdAt,
        }))
    );

  return createMany(movements);
}

function getByProductId(productId: string): StockMovement[] {
  return getAll().filter((movement) => movement.productId === productId);
}

function getByOrderId(orderId: string): StockMovement[] {
  return getAll().filter((movement) => movement.orderId === orderId);
}

export const stockMovementsStore = {
  getAll,
  getByProductId,
  getByOrderId,
  create,
  createMany,
  createFromOrderDiff,
  createFromProductVariantDiff,
  ensureInitialInventorySnapshot,
};
