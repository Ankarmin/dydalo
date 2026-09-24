"use client";

import { CatalogGrouped } from "@/components/product/catalog-grouped";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/use-products";

function CatalogSkeleton() {
  return (
    <div className="space-y-24" aria-hidden="true">
      {Array.from({ length: 2 }).map((_, ci) => (
        <div key={ci}>
          <Skeleton className="mb-1 h-8 w-32" />
          <Skeleton className="mb-8 h-3 w-20" />

          <div className="grid gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, pi) => (
              <div key={pi} className="space-y-4">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CatalogoClient() {
  const { activeProducts, loaded } = useProducts();

  // Skeleton idéntico en servidor y primer render: evita el mensaje de vacío
  // falso y el mismatch de hidratación.
  if (!loaded) {
    return <CatalogSkeleton />;
  }

  if (activeProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-6xl font-black text-muted-foreground/10">—</p>
        <p className="mt-6 text-sm font-bold uppercase tracking-micro text-muted-foreground">
          No hay productos disponibles
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pronto llegará nuevo stock.
        </p>
      </div>
    );
  }

  return <CatalogGrouped products={activeProducts} />;
}
