"use client";

import { useSyncExternalStore } from "react";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import type { CatalogCategory } from "@/lib/stores/data-store.types";

const emptyCategories: CatalogCategory[] = [];

let cachedCategories: CatalogCategory[] | null = null;

function invalidateCache() {
  cachedCategories = null;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
    invalidateCache();
  };
}

function getSnapshot(): CatalogCategory[] {
  if (typeof window === "undefined") return emptyCategories;
  if (cachedCategories) return cachedCategories;
  cachedCategories = categoriesStore.getActive();
  return cachedCategories;
}

function getServerSnapshot(): CatalogCategory[] {
  return emptyCategories;
}

export function useCategories(): CatalogCategory[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
