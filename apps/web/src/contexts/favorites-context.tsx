"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import { productsStore } from "@/lib/stores/data-store.products";
import type { AdminProduct } from "@/lib/stores/data-store.types";
import { isCookieAllowed } from "@/contexts/cookie-consent-context";

const STORAGE_KEY = "dydalo-favs";

function loadFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const ids: string[] = JSON.parse(raw);
    return new Set(ids.filter((id) => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function saveFavorites(ids: Set<string>) {
  if (!isCookieAllowed("functional")) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {

  }
}

type FavoritesContextValue = {
  favorites: AdminProduct[];
  favoriteIds: Set<string>;
  favoritesCount: number;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  clearAll: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(loadFavorites);

  useEffect(() => {
    saveFavorites(favoriteIds);
  }, [favoriteIds]);

  const toggleFavorite = useCallback((productId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setFavoriteIds(new Set());
  }, []);

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds],
  );

  const favoritesCount = favoriteIds.size;

  const favorites = useMemo(
    () => productsStore.getAll().filter((p) => favoriteIds.has(p.id)),
    [favoriteIds],
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteIds,
        favoritesCount,
        isFavorite,
        toggleFavorite,
        clearAll,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
