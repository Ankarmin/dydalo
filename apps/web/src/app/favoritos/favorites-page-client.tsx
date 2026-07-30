"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useFavorites } from "@/contexts/favorites-context";
import { useMounted } from "@/hooks/use-mounted";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { ROUTES } from "@/lib/utils/routes";

export function FavoritesPageClient() {
  const router = useRouter();
  const { state: authState, meta: authMeta } = useAuth();
  const { favorites, favoritesCount, clearAll } = useFavorites();
  const mounted = useMounted();

  useEffect(() => {
    if (authState.status === "authenticated" && authMeta.isAdmin) {
      router.replace(ROUTES.catalogo);
    }
  }, [authMeta.isAdmin, authState.status, router]);

  if (!mounted) return null;
  if (authState.status === "loading") return null;
  if (authMeta.isAdmin) return null;

  if (favorites.length === 0) {
    return (
      <section className="section-px pt-4 flex min-h-[calc(100vh-16rem)] flex-col items-center justify-center text-center">
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
    );
  }

  return (
    <section className="section-px pt-4 pb-16">
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
  );
}
