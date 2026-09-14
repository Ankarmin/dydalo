"use client";

import Image from "next/image";
import Link from "next/link";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { useMounted } from "@/hooks/use-mounted";
import { ROUTES } from "@/lib/utils/routes";
import { FALLBACK_IMAGE } from "@/config/constants";

export function HomeCategories() {
  const mounted = useMounted();
  const categories = useCategories();
  const { activeProducts } = useProducts();

  const withPhoto = categories
    .map((cat) => {
      const items = activeProducts.filter((p) => p.category === cat.slug);
      if (items.length === 0) return null;
      return {
        cat,
        image: cat.image || items[0].image || FALLBACK_IMAGE,
        count: items.length,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  if (!mounted || withPhoto.length === 0) return null;

  return (
    <section className="section-px pt-14 md:pt-20" aria-labelledby="home-categorias">
      <div id="categorias" className="mb-8 scroll-mt-20 md:mb-12">
        <p className="mb-3 text-base font-bold uppercase tracking-subhead text-accent">
          categorías
        </p>
        <h2
          id="home-categorias"
          className="text-5xl font-bold tracking-[-0.06em] md:text-7xl"
        >
          EXPLORA POR CATEGORÍA
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-4">
        {withPhoto.map(({ cat, image, count }) => (
          <Link
            key={cat.slug}
            href={ROUTES.catalogoCategory(cat.slug)}
            className="group relative block overflow-hidden rounded-xl border border-border transition-all duration-500 hover:-translate-y-1 hover:border-accent focus-ring"
          >
            <div className="relative aspect-square w-full overflow-hidden">
              <Image
                src={image}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                <p className="text-sm font-bold uppercase tracking-tight text-white md:text-base">
                  {cat.name}
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70 md:text-xs">
                  {count} {count === 1 ? "producto" : "productos"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
