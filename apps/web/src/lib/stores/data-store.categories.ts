import { read, write, KEYS } from "./data-store.utils";
import type { CatalogCategory } from "./data-store.types";
import { catalogCategories as seedCategories } from "@/config/products";

function getAll(): CatalogCategory[] {
  const stored = read<CatalogCategory[]>(KEYS.categories, []);
  if (stored.length === 0) {
    seed(seedCategories);
    return read<CatalogCategory[]>(KEYS.categories, []);
  }
  return stored;
}

function getBySlug(slug: string): CatalogCategory | undefined {
  return getAll().find((c) => c.slug === slug);
}

function getActive(): CatalogCategory[] {
  return getAll().filter((c) => c.active).toSorted((a, b) => a.order - b.order);
}

function create(data: Omit<CatalogCategory, "slug" | "order"> & { order?: number }): CatalogCategory {
  const categories = getAll();
  const slug = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const maxOrder = categories.reduce((max, c) => Math.max(max, c.order), 0);

  const category: CatalogCategory = {
    ...data,
    slug,
    order: data.order ?? maxOrder + 1,
  };

  write(KEYS.categories, [...categories, category]);
  return category;
}

function update(slug: string, data: Partial<CatalogCategory>): CatalogCategory | undefined {
  const categories = getAll();
  const index = categories.findIndex((c) => c.slug === slug);
  if (index === -1) return undefined;

  const updated: CatalogCategory = { ...categories[index], ...data, slug };
  const next = [...categories];
  next[index] = updated;
  write(KEYS.categories, next);
  return updated;
}

function remove(slug: string): boolean {
  const categories = getAll();
  const filtered = categories.filter((c) => c.slug !== slug);
  if (filtered.length === categories.length) return false;
  write(KEYS.categories, filtered);
  return true;
}

function reorder(slugs: string[]): void {
  const categories = getAll();
  const map = new Map(categories.map((c) => [c.slug, c]));
  const reordered = slugs
    .map((slug, i) => {
      const cat = map.get(slug);
      if (!cat) return null;
      return { ...cat, order: i + 1 };
    })
    .filter((c): c is CatalogCategory => c !== null);
  write(KEYS.categories, reordered);
}

function seed(items: CatalogCategory[]): void {
  write(KEYS.categories, items);
}

export const categoriesStore = { getAll, getBySlug, getActive, create, update, delete: remove, reorder, seed };
