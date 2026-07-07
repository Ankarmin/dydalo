"use client";

import Link from "next/link";
import { useProducts } from "@/lib/use-products";
import { CatalogGrid } from "@/components/catalog-grid";
import { ROUTES } from "@/lib/routes";

export function CategoriaClient({ slug, categoryName }: { slug: string; categoryName: string }) {
  const { activeProducts } = useProducts();
  const categoryProducts = activeProducts.filter((p) => p.category === slug);

  return (
    <div>
      <p className="text-xs font-bold tracking-micro text-muted-foreground mb-8">
        {categoryProducts.length}{" "}
        {categoryProducts.length === 1 ? "producto" : "productos"}
      </p>

      {categoryProducts.length === 0 ? (
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
        <CatalogGrid products={categoryProducts as any} />
      )}
    </div>
  );
}
