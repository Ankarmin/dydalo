"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/contexts/favorites-context";
import { showFavoriteToast } from "@/components/favorites/favorite-toast";
import { cn } from "@/lib/utils";

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
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(productId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(productId);
    showFavoriteToast(productName, !favorited);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(productId);
      showFavoriteToast(productName, !favorited);
    }
  }

  const cardStyles =
    "absolute right-3 top-3 z-10 size-9 rounded-full chip-label shadow-sm";
  const inlineStyles = "";

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
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
    </span>
  );
}
