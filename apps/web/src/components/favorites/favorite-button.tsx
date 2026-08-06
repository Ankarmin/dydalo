"use client";

import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useFavorites } from "@/contexts/favorites-context";
import { showFavoriteToast } from "@/components/favorites/favorite-toast";
import { cn } from "@/lib/utils/utils";

interface FavoriteButtonProps {
  productId: number;
  productName: string;
  variant?: "card" | "detail" | "inline";
}

export function FavoriteButton({
  productId,
  productName,
  variant = "card",
}: FavoriteButtonProps) {
  const { state: authState, meta: authMeta } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(productId);

  if (authState.status === "loading" || authMeta.isAdmin) return null;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(productId);
    showFavoriteToast(productName, !favorited);
  }

  const cardStyles =
    "absolute right-2 top-2 md:right-3 md:top-3 z-10 size-7 md:size-9 rounded-full chip-label shadow-sm";
  const inlineStyles = "";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        favorited
          ? `Quitar ${productName} de favoritos`
          : `Añadir ${productName} a favoritos`
      }
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors hover:text-accent-foreground select-none",
        variant === "card" && cardStyles,
        variant === "inline" && inlineStyles,
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-all",
          favorited && "fill-favorite text-favorite",
        )}
      />
    </button>
  );
}
