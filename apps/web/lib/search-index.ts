import { products, catalogCategories, type Product } from "@/data/products";

export type SearchResult = Product & {
  matchScore: number;
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getCategoryName(slug: string): string {
  return catalogCategories.find((c) => c.slug === slug)?.name ?? slug;
}

export function searchProducts(query: string): SearchResult[] {
  if (!query || query.trim().length < 1) return [];

  const q = normalize(query.trim());
  const tokens = q.split(/\s+/).filter(Boolean);

  const results: SearchResult[] = [];

  for (const product of products) {
    let score = 0;

    for (const token of tokens) {
      const name = normalize(product.name);
      const label = normalize(product.label);
      const type = normalize(product.type);
      const catName = normalize(getCategoryName(product.category));

      if (name === token) {
        score += 30;
      } else if (name.includes(token)) {
        score += 10;
      }

      if (label.includes(token)) {
        score += 5;
      }
      if (type.includes(token)) {
        score += 4;
      }
      if (catName.includes(token)) {
        score += 3;
      }

      const allFields = [name, label, type, catName].join(" ");
      if (score === 0 && allFields.includes(token)) {
        score += 2;
      }
    }

    if (score > 0) {
      results.push({ ...product, matchScore: score });
    }
  }

  return results
    .sort((a, b) => b.matchScore - a.matchScore)
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
