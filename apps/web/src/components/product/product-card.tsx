"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/format";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import { ROUTES } from "@/lib/utils/routes";

interface ProductCardData {
  id: number;
  name: string;
  slug?: string;
  category: string;
  price: number;
  image: string;
}

function getProductSlug(product: ProductCardData): string {
  if (product.slug) return product.slug;
  return product.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface ProductCardProps {
  product: ProductCardData;
  priority?: boolean;
}

export function ProductCard({ product, priority }: ProductCardProps) {
  const categoryName =
    categoriesStore.getBySlug(product.category)?.name ?? product.category;

  return (
    <article className="group relative">
      <Link
        href={ROUTES.producto(getProductSlug(product))}
        className="product-glass relative block aspect-square w-full overflow-hidden border border-border text-left transition-all duration-500 cursor-pointer group-hover:-translate-y-2 group-hover:border-accent focus-ring"
      >
        <span className="absolute left-4 top-4 z-10 product-label">
          {categoryName}
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
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold uppercase tracking-tight">
            {product.name}
          </h3>
        </div>
        <p className="shrink-0 text-sm font-semibold tabular-nums">
          {formatPrice(product.price)}
        </p>
      </div>
    </article>
  );
}
