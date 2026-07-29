import { productsStore } from "@/lib/stores/data-store.products";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import type { AdminProduct } from "@/lib/stores/data-store.types";

export type SearchResult = AdminProduct & {
  matchScore: number;
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getCategoryName(slug: string): string {
  return categoriesStore.getBySlug(slug)?.name ?? slug;
}

export function searchProducts(query: string): SearchResult[] {
  if (!query || query.trim().length < 1) return [];

  const q = normalize(query.trim());
  const tokens = q.split(/\s+/).filter(Boolean);
  const products = productsStore.getAll().filter((p) => p.active);

  const results: SearchResult[] = [];

  for (const product of products) {
    let score = 0;

    for (const token of tokens) {
      const name = normalize(product.name);
      const catName = normalize(getCategoryName(product.category));
      const sku = normalize(product.sku);

      if (name === token) {
        score += 30;
      } else if (name.includes(token)) {
        score += 10;
      }

      if (catName.includes(token)) {
        score += 3;
      }
      if (sku.includes(token)) {
        score += 4;
      }

      const allFields = [name, catName, sku].join(" ");
      if (score === 0 && allFields.includes(token)) {
        score += 2;
      }
    }

    if (score > 0) {
      results.push({ ...product, matchScore: score });
    }
  }

  return results
    .toSorted((a, b) => b.matchScore - a.matchScore)
    .slice(0, 15);
}

export function groupResultsByCategory(
  results: SearchResult[],
): Map<string, SearchResult[]> {
  const groups = new Map<string, SearchResult[]>();
  for (const r of results) {
    const catName = getCategoryName(r.category);
    const existing = groups.get(catName) ?? [];
    existing.push(r);
    groups.set(catName, existing);
  }
  return groups;
}
