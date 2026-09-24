"use client";

import Link from "next/link";
import { useProducts } from "@/hooks/use-products";
import { CatalogGrid } from "@/components/product/catalog-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/utils/routes";

export function CategoriaClient({ slug, categoryName }: { slug: string; categoryName: string }) {
  const { activeProducts, loaded } = useProducts();
  const categoryProducts = activeProducts.filter((p) => p.category === slug);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold uppercase tracking-tight">
          {categoryName}
        </h1>
        {loaded && (
          <p className="mt-1 text-xs font-bold tracking-[0.16em] text-muted-foreground">
            {categoryProducts.length}{" "}
            {categoryProducts.length === 1 ? "producto" : "productos"}
          </p>
        )}
      </div>

      {!loaded ? (
        <div className="grid gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, pi) => (
            <div key={pi} className="space-y-4">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : categoryProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-6xl font-black text-muted-foreground/10">—</p>
          <p className="mt-6 text-sm font-bold uppercase tracking-micro text-muted-foreground">
            No hay productos en {categoryName}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Pronto llegará nuevo stock.
          </p>
          <Link
            href={ROUTES.catalogo}
            className="mt-6 inline-flex items-center gap-2 border-b border-accent pb-1 text-xs font-bold uppercase tracking-micro text-accent transition-colors hover:text-accent/80"
          >
            Ver catálogo completo
          </Link>
        </div>
      ) : (
        <CatalogGrid products={categoryProducts} />
      )}
    </div>
  );
}
