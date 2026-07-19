"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import {
  type Product,
  catalogCategories,
} from "@/data/products";
import { categoriesStore } from "@/lib/data-store.categories";

const MAX_PER_CATEGORY = 4;

function getProductsForCategory(products: Product[], slug: string): Product[] {
  return products.filter((p) => p.category === slug);
}

export function CatalogGrouped({ products }: { products: Product[] }) {
  return (
    <div className="space-y-24">
      {(categoriesStore.getActive().length > 0 ? categoriesStore.getActive() : catalogCategories).map((cat) => {
        const categoryProducts = getProductsForCategory(products, cat.slug);
        if (categoryProducts.length === 0) return null;

        const displayed = categoryProducts.slice(0, MAX_PER_CATEGORY);
        const remaining = categoryProducts.length - MAX_PER_CATEGORY;

        return (
          <section key={cat.slug}>
            <div className="mb-8">
              <h2 className="text-xl font-bold uppercase tracking-tight">
                {cat.name}
              </h2>
              <p className="mt-1 text-xs font-bold tracking-[0.16em] text-muted-foreground">
                {categoryProducts.length}{" "}
                {categoryProducts.length === 1
                  ? "producto"
                  : "productos"}
              </p>
            </div>

            <div className="grid gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayed.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Button
                size="sm"
                className="border border-accent text-accent bg-transparent hover:bg-accent hover:text-accent-foreground"
                asChild
              >
                <Link href={ROUTES.catalogoCategory(cat.slug)}>
                  VER MÁS{" "}
                  {remaining > 0 && `(${remaining})`}
                  <ArrowUpRight />
                </Link>
              </Button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
