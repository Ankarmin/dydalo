"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/data/products";

type SortKey =
  | "relevantes"
  | "vendidos"
  | "az"
  | "za"
  | "precio-asc"
  | "precio-desc"
  | "fecha-asc"
  | "fecha-desc";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "relevantes", label: "Mas relevantes" },
  { key: "vendidos", label: "Mas vendidos" },
  { key: "az", label: "Alfabeticamente, A-Z" },
  { key: "za", label: "Alfabeticamente, Z-A" },
  { key: "precio-asc", label: "Precio, menor a mayor" },
  { key: "precio-desc", label: "Precio, mayor a menor" },
  { key: "fecha-asc", label: "Fecha: antiguo(a) a reciente" },
  { key: "fecha-desc", label: "Fecha: reciente a antiguo(a)" },
];

function sortProducts(products: Product[], sort: SortKey): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "az":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "za":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "precio-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "precio-desc":
      return sorted.sort((a, b) => b.price - a.price);
    default:
      return sorted;
  }
}

function padIndex(n: number): string {
  return n.toString().padStart(2, "0");
}

export function CatalogGrid({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<SortKey>("relevantes");
  const [open, setOpen] = useState(false);

  const sortedProducts = useMemo(
    () => sortProducts(products, sort),
    [products, sort],
  );

  const activeLabel =
    sortOptions.find((o) => o.key === sort)?.label ?? "Ordenar";

  return (
    <div>
      <div className="mb-8 flex items-center justify-end">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={`Ordenar: ${activeLabel}`}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
          >
            {activeLabel}
            <ChevronDown
              className={cn(
                "size-3 transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
          {open && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
                aria-hidden="true"
              />
              <div
                role="listbox"
                aria-label="Opciones de orden"
                className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur-xl"
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    role="option"
                    aria-selected={sort === option.key}
                    onClick={() => {
                      setSort(option.key);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full rounded-sm px-3 py-2 text-left text-xs uppercase tracking-[0.08em] transition-colors",
                      sort === option.key
                        ? "bg-accent text-accent-foreground font-bold"
                        : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedProducts.map((product, index) => (
          <article key={product.id} className="group relative">
            <Link
              href={ROUTES.catalogoCategory(product.category)}
              className="product-glass relative block aspect-square w-full overflow-hidden border border-border text-left transition-all duration-500 cursor-pointer group-hover:-translate-y-2 group-hover:border-accent focus-ring"
              aria-label={`Ver ${product.name}`}
            >
              <span className="absolute left-4 top-4 z-10 bg-background/80 px-3 py-2 text-[9px] font-bold tracking-[0.2em] backdrop-blur-md">
                {product.label}
              </span>
              <span className="absolute right-3 top-2 z-10 text-lg font-bold tracking-tight text-foreground/20">
                {padIndex(index + 1)}
              </span>
              <Image
                src={product.image}
                alt={product.name}
                width={1024}
                height={1024}
                priority={index < 2}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
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
              <p className="shrink-0 text-sm font-semibold">
                {formatPrice(product.price)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
