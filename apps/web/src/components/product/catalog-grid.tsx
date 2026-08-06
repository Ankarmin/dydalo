"use client";

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { ProductCard } from "@/components/product/product-card";
import type { AdminProduct } from "@/lib/stores/data-store.types";

type SortKey =
  | "relevantes"
  | "az"
  | "za"
  | "precio-asc"
  | "precio-desc";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "relevantes", label: "Más relevantes" },
  { key: "az", label: "Alfabéticamente, A-Z" },
  { key: "za", label: "Alfabéticamente, Z-A" },
  { key: "precio-asc", label: "Precio, menor a mayor" },
  { key: "precio-desc", label: "Precio, mayor a menor" },
];

function sortProducts(products: AdminProduct[], sort: SortKey): AdminProduct[] {
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

export function CatalogGrid({ products }: { products: AdminProduct[] }) {
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
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-nav text-muted-foreground transition-colors hover:text-foreground"
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
                className="absolute right-0 top-full z-50 mt-2 w-56 popover-panel p-1.5 shadow-lg"
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

      <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        {sortedProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 2}
          />
        ))}
      </div>
    </div>
  );
}
