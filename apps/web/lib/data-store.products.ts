import { read, write, KEYS } from "./data-store.utils";
import type { AdminProduct } from "./data-store.types";
import { products as hardcodedProducts } from "@/data/products";

function getAll(): AdminProduct[] {
  const stored = read<AdminProduct[]>(KEYS.products, []);
  if (stored.length === 0) {
    seedFromHardcoded();
    return read<AdminProduct[]>(KEYS.products, []);
  }
  return stored;
}

function getById(id: number): AdminProduct | undefined {
  const products = getAll();
  const map = new Map(products.map((p) => [p.id, p]));
  return map.get(id);
}

function create(data: Omit<AdminProduct, "id" | "createdAt" | "updatedAt">): AdminProduct {
  const products = getAll();
  const now = new Date().toISOString();
  const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);

  const product: AdminProduct = {
    ...data,
    id: maxId + 1,
    createdAt: now,
    updatedAt: now,
  };

  write(KEYS.products, [...products, product]);
  return product;
}

function update(id: number, data: Partial<AdminProduct>): AdminProduct | undefined {
  const products = getAll();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return undefined;

  const updated: AdminProduct = {
    ...products[index],
    ...data,
    id: products[index].id,
    createdAt: products[index].createdAt,
    updatedAt: new Date().toISOString(),
  };

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

function seedFromHardcoded(): void {
  const now = new Date().toISOString();
  const adminProducts: AdminProduct[] = hardcodedProducts.map((p, i) => ({
    ...p,
    stock: 50,
    active: true,
    featured: i < 8,
    discount: i % 5 === 0 ? 15 : null,
    sku: `DYD-${p.type.slice(0, 3).toUpperCase()}-${String(p.id).padStart(4, "0")}`,
    createdAt: now,
    updatedAt: now,
    label: undefined as never,
  } as AdminProduct));
  write(KEYS.products, adminProducts);
}

function seed(items: AdminProduct[]): void {
  write(KEYS.products, items);
}

export const productsStore = { getAll, getById, create, update, delete: remove, seed };
