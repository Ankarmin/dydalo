"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { formatPrice } from "@/lib/format";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { ProductDetailSheet } from "@/components/product-detail-sheet";
import { Button } from "@/components/ui/button";
import {
  type Product,
  catalogCategories,
} from "@/data/products";
import { categoriesStore } from "@/lib/data-store.categories";

const MAX_PER_CATEGORY = 4;

function padIndex(n: number): string {
  return n.toString().padStart(2, "0");
}

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
              {displayed.map((product, index) => (
                <article key={product.id} className="group relative">
                  <ProductDetailSheet
                    productId={product.id}
                    trigger={
                      <button
                        type="button"
                        className="product-glass relative block aspect-square w-full overflow-hidden border border-border text-left transition-all duration-500 cursor-pointer group-hover:-translate-y-2 group-hover:border-accent focus-ring"
                        aria-label={`Ver detalles de ${product.name}`}
                      >
                        <span className="absolute left-4 top-4 z-10 product-label">
                          {categoriesStore.getBySlug(product.category)?.name ?? product.category}
                        </span>
                        <span className="absolute right-3 top-2 z-10 text-lg font-bold tracking-tight text-foreground/20">
                          {padIndex(index + 1)}
                        </span>
                        <FavoriteButton
                          productId={product.id}
                          productName={product.name}
                          variant="card"
                        />
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={1024}
                          height={1024}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      </button>
                    }
                  />
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold uppercase tracking-tight">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {product.type}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </article>
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
