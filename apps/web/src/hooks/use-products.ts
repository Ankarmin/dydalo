"use client";

import { useSyncExternalStore, useCallback } from "react";
import { productsStore } from "@/lib/stores/data-store.products";
import { seedIfEmpty } from "@/config/seed-data";
import type { AdminProduct } from "@/lib/stores/data-store.types";

let didSeed = false;

function ensureSeed() {
  if (typeof window === "undefined") return;
  if (didSeed) return;
  didSeed = true;
  seedIfEmpty();
}

const emptyProducts: AdminProduct[] = [];

let cachedProducts: AdminProduct[] | null = null;

function invalidateCache() {
  cachedProducts = null;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
    invalidateCache();
  };
}

function getSnapshot(): AdminProduct[] {
  if (typeof window === "undefined") return emptyProducts;
  if (cachedProducts) return cachedProducts;
  ensureSeed();
  cachedProducts = productsStore.getAll();
  return cachedProducts;
}

function getServerSnapshot(): AdminProduct[] {
  return emptyProducts;
}

export function useProducts() {
  const products = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const getById = useCallback((id: number) => products.find((p) => p.id === id) ?? null, [products]);

  return {
    products,
    activeProducts: products.filter((p) => p.active),
    featuredProducts: products.filter((p) => p.featured && p.active),
    getById,
  };
}
