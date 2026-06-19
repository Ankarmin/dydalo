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
import { products, type Product } from "@/data/products";

const STORAGE_KEY = "dydalo-favs";

function loadFavorites(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const ids: number[] = JSON.parse(raw);
    return new Set(ids.filter((id) => typeof id === "number"));
  } catch {
    return new Set();
  }
}

function saveFavorites(ids: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // localStorage lleno o no disponible — ignorar silenciosamente
  }
}

type FavoritesContextValue = {
  favorites: Product[];
  favoriteIds: Set<number>;
  favoritesCount: number;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (productId: number) => void;
  clearAll: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(loadFavorites);

  useEffect(() => {
    saveFavorites(favoriteIds);
  }, [favoriteIds]);

  const toggleFavorite = useCallback((productId: number) => {
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
    (productId: number) => favoriteIds.has(productId),
    [favoriteIds],
  );

  const favoritesCount = favoriteIds.size;

  const favorites = useMemo(
    () => products.filter((p) => favoriteIds.has(p.id)),
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
