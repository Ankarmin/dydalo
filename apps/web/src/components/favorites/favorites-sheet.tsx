"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { useFavorites } from "@/contexts/favorites-context";
import { formatPrice } from "@/lib/utils/format";
import { FALLBACK_IMAGE } from "@/config/constants";
import { ignoreToastClicks } from "@/lib/utils/toast-guard";
import { Button } from "@/components/ui/button";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { ROUTES } from "@/lib/utils/routes";

interface FavoritesSheetProps {
  trigger: React.ReactNode;
}

export function FavoritesSheet({ trigger }: FavoritesSheetProps) {
  const { favorites, favoritesCount, clearAll } = useFavorites();
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="flex w-full flex-col border-border bg-background p-0 sm:max-w-md" onInteractOutside={ignoreToastClicks}>
        <SheetHeader className="border-b border-border px-6 py-6 text-left">
          <p className="text-sm font-bold uppercase tracking-subhead text-accent">
            Tu wishlist
          </p>
          <SheetTitle className="text-3xl font-bold tracking-[-0.05em]">
            FAVORITOS
          </SheetTitle>
          <SheetDescription>
            {favoritesCount === 0
              ? "Aún no has guardado ningún producto."
              : `${favoritesCount} producto${favoritesCount > 1 ? "s" : ""} guardado${favoritesCount > 1 ? "s" : ""}`}
          </SheetDescription>
        </SheetHeader>

        {favorites.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <Heart
              className="mb-5 size-10 text-muted-foreground"
              strokeWidth={1.25}
            />
            <p className="text-xl font-bold">NO HAY FAVORITOS</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
              Guarda los productos que te gustan tocando el corazón en cada
              pieza.
            </p>
            <SheetClose asChild>
              <Button variant="outline" className="mt-6" asChild>
                <Link href={ROUTES.catalogo}>EXPLORAR CATÁLOGO</Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {favorites.map((product) => (
                <article
                  key={product.id}
                  className="flex gap-4 border-b border-border py-5"
                >
                  <Link
                    href={ROUTES.catalogoCategory(product.category)}
                    className="shrink-0"
                  >
                    <Image
                      src={
                        brokenImages.has(product.id)
                          ? FALLBACK_IMAGE
                          : product.image
                      }
                      alt={product.name}
                      width={96}
                      height={96}
                      sizes="96px"
                      onError={() =>
                        setBrokenImages((prev) =>
                          new Set(prev).add(product.id),
                        )
                      }
                      className="size-24 object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <p className="micro-label">
                      {categoriesStore.getBySlug(product.category)?.name ?? product.category}
                    </p>
                    <h3 className="mt-1 truncate text-sm font-bold uppercase">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <FavoriteButton
                      productId={product.id}
                      productName={product.name}
                      variant="inline"
                    />
                  </div>
                </article>
              ))}
            </div>

            {favoritesCount > 0 && (
              <div className="border-t border-border px-6 py-4">
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="flex-1" asChild>
                    <SheetClose asChild>
                      <Link href={ROUTES.favoritos}>VER TODOS</Link>
                    </SheetClose>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={clearAll}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="ml-1">Vaciar</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
