"use client";

import { useMemo } from "react";
import { ProductCard } from "@/components/product/product-card";
import { productsStore } from "@/lib/stores/data-store.products";
import { useMounted } from "@/hooks/use-mounted";
import type { AdminProduct } from "@/lib/stores/data-store.types";

interface RelatedProductsProps {
  product: AdminProduct;
}

function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed * 1000 + index) * 10000;
  return x - Math.floor(x);
}

function shuffleProducts(products: AdminProduct[], seed: number): AdminProduct[] {
  const shuffled = [...products];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed, i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function RelatedProducts({ product }: RelatedProductsProps) {
  const mounted = useMounted();

  const related = useMemo(() => {
    if (!mounted) return [] as AdminProduct[];
    const all = productsStore.getAll();
    const sameCategory = all.filter(
      (p) =>
        p.active &&
        p.category === product.category &&
        p.id !== product.id,
    );

    const discounted = sameCategory.filter((p) => (p.discount ?? 0) > 0);
    const regular = sameCategory.filter((p) => !p.discount || p.discount <= 0);

    return [
      ...shuffleProducts(discounted, product.id),
      ...shuffleProducts(regular, product.id + 1),
    ].slice(0, 4);
  }, [mounted, product.id, product.category]);

  if (!mounted || related.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border pt-12">
      <p className="section-tag mb-8">También te puede gustar</p>
      <div className="grid gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
