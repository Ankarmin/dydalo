import { read, write, KEYS, getSeedHash, setSeedHash } from "./data-store.utils";
import type { AdminProduct } from "./data-store.types";
import { products as seedProducts } from "@/config/products";

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

  return stored;
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

  const product: AdminProduct = {
    ...data,
    slug,
    id: maxId + 1,
    createdAt: now,
    updatedAt: now,
  };

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

function seed(items: AdminProduct[]): void {
  write(KEYS.products, items);
}

export const productsStore = { getAll, getById, getBySlug, create, update, delete: remove, seed };
