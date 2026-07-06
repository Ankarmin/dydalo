"use client";

import { useEffect, useState } from "react";
import { CatalogGrouped } from "@/components/catalog-grouped";
import { useProducts } from "@/lib/use-products";

export function CatalogoClient() {
  const { activeProducts } = useProducts();

  if (activeProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-6xl font-black text-muted-foreground/10">—</p>
        <p className="mt-6 text-sm font-bold uppercase tracking-micro text-muted-foreground">
          No hay productos disponibles
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pronto llegará nuevo stock.
        </p>
      </div>
    );
  }

  return <CatalogGrouped products={activeProducts as any} />;
}
