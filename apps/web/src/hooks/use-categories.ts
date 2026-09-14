"use client";

import { useState, useEffect } from "react";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import type { CatalogCategory } from "@/lib/stores/data-store.types";
import { isApiEnabled } from "@/lib/api/client";
import { apiGetCategories } from "@/lib/api/catalog";

function localCategories(): CatalogCategory[] {
  if (typeof window === "undefined") return [];
  return categoriesStore.getActive();
}

export function useCategories(): CatalogCategory[] {
  const [categories, setCategories] = useState<CatalogCategory[]>(() => localCategories());

  useEffect(() => {
    function refreshLocal() {
      if (!isApiEnabled()) setCategories(categoriesStore.getActive());
    }
    if (typeof window !== "undefined") {
      window.addEventListener("storage", refreshLocal);
    }

    let alive = true;
    if (isApiEnabled()) {
      apiGetCategories()
        .then((list) => {
          if (alive) setCategories(list.filter((c) => c.active));
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

  return categories;
}
