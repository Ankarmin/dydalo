"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useFavorites } from "@/contexts/favorites-context";
import { useCart } from "@/contexts/cart-context";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { showCartToast } from "@/components/cart-toast";
import { ROUTES } from "@/lib/routes";

export function FavoritesPageClient() {
  const { favorites, favoritesCount, clearAll } = useFavorites();
  const { updateQuantity } = useCart();
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

  if (favorites.length === 0) {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 pt-24 text-center">
        <Heart
          className="mb-5 size-16 text-muted-foreground"
          strokeWidth={1}
        />
        <h1 className="text-2xl font-bold tracking-[-0.03em]">FAVORITOS</h1>
        <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
          No tienes productos guardados. Explora el catálogo y guarda los que te gusten tocando el corazón.
        </p>
        <Button variant="outline" className="mt-6" asChild>
          <Link href={ROUTES.catalogo}>EXPLORAR CATÁLOGO</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl section-px page-top page-bottom">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.03em]">FAVORITOS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {favoritesCount} producto{favoritesCount > 1 ? "s" : ""} guardado{favoritesCount > 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-destructive"
          onClick={clearAll}
        >
          <Trash2 className="size-3.5" />
          <span className="ml-1">Vaciar todo</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favorites.map((product) => (
          <article key={product.id} className="group relative">
            <Link
              href={ROUTES.catalogoCategory(product.category)}
              className="product-glass relative block aspect-square w-full overflow-hidden"
            >
              <span className="absolute left-4 top-4 z-10 product-label">
                {product.label}
              </span>
              <FavoriteButton
                productId={product.id}
                productName={product.name}
                variant="card"
              />
              <Image
                src={
                  brokenImages.has(product.id)
                    ? "/images/dydalo-hero.jpg"
                    : product.image
                }
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                onError={() =>
                  setBrokenImages((prev) => new Set(prev).add(product.id))
                }
              />
            </Link>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold uppercase tracking-tight">
                  {product.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {product.type}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Añadir ${product.name} a la bolsa`}
                  onClick={() => {
                    updateQuantity(product.id, 1);
                    showCartToast(product.name, product.price);
                  }}
                >
                  <ShoppingBag className="size-4" />
                </Button>
                <p className="text-sm font-semibold">
                  {formatPrice(product.price)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
