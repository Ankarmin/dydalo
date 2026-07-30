import { read, write, KEYS, getSeedHash, setSeedHash } from "./data-store.utils";
import type { AdminProduct, OrderItem } from "./data-store.types";
import { products as seedProducts } from "@/config/products";
import { getTotalStock, getVariantKey, normalizeProductInventory, summarizeItems } from "@/lib/utils/inventory";

const SEED_HASH = String(JSON.stringify(seedProducts).length);

function getAll(): AdminProduct[] {
  const storedHash = getSeedHash(KEYS.products);

  if (storedHash !== SEED_HASH) {
    seed(seedProducts);
    setSeedHash(KEYS.products, SEED_HASH);
    return read<AdminProduct[]>(KEYS.products, []);
  }

  const stored = read<AdminProduct[]>(KEYS.products, []);
  if (stored.length === 0) {
    seed(seedProducts);
    setSeedHash(KEYS.products, SEED_HASH);
    return read<AdminProduct[]>(KEYS.products, []);
  }

  const normalized = stored.map(normalizeProductInventory);
  if (JSON.stringify(normalized) !== JSON.stringify(stored)) {
    write(KEYS.products, normalized);
  }

  return normalized;
}

function getById(id: number): AdminProduct | undefined {
  const products = getAll();
  const map = new Map(products.map((p) => [p.id, p]));
  return map.get(id);
}

function getBySlug(slug: string): AdminProduct | undefined {
  return getAll().find((p) => p.slug === slug);
}

function create(data: Omit<AdminProduct, "id" | "createdAt" | "updatedAt" | "slug"> & { slug?: string }): AdminProduct {
  const products = getAll();
  const now = new Date().toISOString();
  const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);
  const slug = data.slug || generateSlug(data.name);

  const product = normalizeProductInventory({
    ...data,
    slug,
    id: maxId + 1,
    createdAt: now,
    updatedAt: now,
  });

  write(KEYS.products, [...products, product]);
  return product;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function update(id: number, data: Partial<AdminProduct>): AdminProduct | undefined {
  const products = getAll();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return undefined;

  const updated = normalizeProductInventory({
    ...products[index],
    ...data,
    id: products[index].id,
    createdAt: products[index].createdAt,
    updatedAt: new Date().toISOString(),
  });

  const next = [...products];
  next[index] = updated;
  write(KEYS.products, next);
  return updated;
}

function remove(id: number): boolean {
  const products = getAll();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) return false;
  write(KEYS.products, filtered);
  return true;
}

function seed(items: AdminProduct[]): void {
  write(KEYS.products, items.map(normalizeProductInventory));
}

function validateStockChange(
  previousItems: OrderItem[],
  nextItems: OrderItem[]
): { success: true } | { success: false; error: string } {
  const products = getAll();
  const productMap = new Map(products.map((product) => [product.id, product]));
  const previous = summarizeItems(previousItems);
  const next = summarizeItems(nextItems);
  const keys = new Set([...previous.keys(), ...next.keys()]);

  for (const key of keys) {
    const nextEntry = next.get(key);
    const previousEntry = previous.get(key);
    const item = nextEntry?.item ?? previousEntry?.item;
    if (!item) continue;

    const delta = (nextEntry?.quantity ?? 0) - (previousEntry?.quantity ?? 0);
    if (delta <= 0) continue;

    const product = productMap.get(item.productId);
    if (!product) return { success: false, error: `Producto no encontrado: ${item.name}` };

    const variant = product.variants?.find(
      (entry) => getVariantKey(entry.size, entry.color) === getVariantKey(item.size, item.color)
    );

    if (!variant || !variant.active) {
      return { success: false, error: `${item.name} no está disponible en ${item.color} / ${item.size}` };
    }

    if (variant.stock < delta) {
      return {
        success: false,
        error: `Solo quedan ${variant.stock} unidades de ${item.name} en ${item.color} / ${item.size}`,
      };
    }
  }

  return { success: true };
}

function applyStockChange(
  previousItems: OrderItem[],
  nextItems: OrderItem[]
): { success: true } | { success: false; error: string } {
  const validation = validateStockChange(previousItems, nextItems);
  if (!validation.success) return validation;

  const products = getAll();
  const previous = summarizeItems(previousItems);
  const next = summarizeItems(nextItems);
  const keys = new Set([...previous.keys(), ...next.keys()]);
  const now = new Date().toISOString();
  let changed = false;

  const updatedProducts = products.map((product) => {
    let updatedProduct = product;
    const updatedVariants = product.variants?.map((variant) => {
      const key = `${product.id}|${getVariantKey(variant.size, variant.color)}`;
      if (!keys.has(key)) return variant;

      const delta = (next.get(key)?.quantity ?? 0) - (previous.get(key)?.quantity ?? 0);
      if (delta === 0) return variant;

      changed = true;
      return {
        ...variant,
        stock: Math.max(0, variant.stock - delta),
        updatedAt: now,
      };
    });

    if (updatedVariants) {
      updatedProduct = { ...product, variants: updatedVariants };
      return { ...updatedProduct, stock: getTotalStock(updatedProduct), updatedAt: now };
    }

    return product;
  });

  if (changed) write(KEYS.products, updatedProducts);
  return { success: true };
}

export const productsStore = {
  getAll,
  getById,
  getBySlug,
  create,
  update,
  delete: remove,
  seed,
  validateStockChange,
  applyStockChange,
};
