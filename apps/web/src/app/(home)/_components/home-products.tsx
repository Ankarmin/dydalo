"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { useProducts } from "@/hooks/use-products";
import { FEATURED_PRODUCTS_COUNT } from "@/config/constants";
import { ROUTES } from "@/lib/utils/routes";

export function HomeProducts() {
  const { featuredProducts } = useProducts();
  const displayedProducts = featuredProducts.slice(0, FEATURED_PRODUCTS_COUNT);

  return (
    <section className="section-px section-lg">
      <div id="lo-ultimo" className="mb-12 scroll-mt-20">
        <p className="mb-3 text-base font-bold uppercase tracking-subhead text-accent">
          novedades
        </p>
        <h2 className="text-5xl font-bold tracking-[-0.06em] md:text-7xl">
          LO ÚLTIMO
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayedProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index === 0}
          />
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <Button asChild variant="hero" size="hero">
          <Link href={ROUTES.catalogo}>
            VER CATÁLOGO COMPLETO <ArrowUpRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
