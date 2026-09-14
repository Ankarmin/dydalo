"use client";

import { useState, useEffect, useCallback } from "react";
import { productsStore } from "@/lib/stores/data-store.products";
import { seedIfEmpty } from "@/config/seed-data";
import type { AdminProduct } from "@/lib/stores/data-store.types";
import { isApiEnabled } from "@/lib/api/client";
import { apiGetProducts } from "@/lib/api/catalog";

function localProducts(): AdminProduct[] {
  if (typeof window === "undefined") return [];
  seedIfEmpty();
  return productsStore.getAll();
}

export function useProducts() {
  const [products, setProducts] = useState<AdminProduct[]>(() => localProducts());

  useEffect(() => {
    function refreshLocal() {
      if (!isApiEnabled()) setProducts(productsStore.getAll());
    }
    if (typeof window !== "undefined") {
      window.addEventListener("storage", refreshLocal);
    }

    let alive = true;
    // Vía API: el backend es la fuente (precios/stock reales).
    // Si falla, se conserva lo local ya cargado.
    if (isApiEnabled()) {
      apiGetProducts()
        .then((list) => {
          if (alive) setProducts(list);
        })
        .catch(() => {});
    }
    return () => {
      alive = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", refreshLocal);
      }
    };
  }, []);

  const getById = useCallback((id: string) => products.find((p) => p.id === id) ?? null, [products]);

  return {
    products,
    activeProducts: products.filter((p) => p.active),
    featuredProducts: products.filter((p) => p.featured && p.active),
    getById,
  };
}
