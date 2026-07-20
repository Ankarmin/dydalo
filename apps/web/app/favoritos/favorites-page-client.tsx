"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { useFavorites } from "@/contexts/favorites-context";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { ROUTES } from "@/lib/routes";

export function FavoritesPageClient() {
  const { favorites, favoritesCount, clearAll } = useFavorites();

  if (favorites.length === 0) {
    return (
      <main className="page-root">
        <section className="section-px page-top flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
          <Heart
            className="mb-5 size-16 text-muted-foreground"
            strokeWidth={1}
          />
          <h1 className="text-2xl font-bold tracking-heading">FAVORITOS</h1>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
            No tienes productos guardados. Explora el catálogo y guarda los que te gusten tocando el corazón.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href={ROUTES.catalogo}>EXPLORAR CATÁLOGO</Link>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-root">
      <section className="section-px page-top pb-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-heading">FAVORITOS</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {favoritesCount} producto{favoritesCount > 1 ? "s" : ""} guardado{favoritesCount > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground/70"
            onClick={clearAll}
          >
            <Trash2 className="size-3.5" />
            <span className="ml-1">Vaciar todo</span>
          </Button>
        </div>

        <div className="grid gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
