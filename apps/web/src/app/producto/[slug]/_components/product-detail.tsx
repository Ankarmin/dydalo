"use client";

import Image from "next/image";
import { useState } from "react";
import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { formatPrice, getDisplayPrice } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/routes";
import { useCart } from "@/contexts/cart-context";
import { useFavorites } from "@/contexts/favorites-context";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import type { AdminProduct } from "@/lib/stores/data-store.types";
import { showCartToast } from "@/components/cart/cart-toast";
import { RelatedProducts } from "@/components/product/related-products";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";
import { LOW_STOCK_THRESHOLD } from "@/config/constants";

interface ProductDetailProps {
  product: AdminProduct;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { updateQuantity } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const categoryName =
    categoriesStore.getBySlug(product.category)?.name ?? product.category;
  const displayCategory =
    categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();

  const [selectedColor, setSelectedColor] = useState(
    product.colors[0] ?? null,
  );
  const [selectedSize, setSelectedSize] = useState(
    product.sizes[0] ?? null,
  );
  const [quantity, setQuantity] = useState(1);

  const favorited = product ? isFavorite(product.id) : false;
  const { final, original, hasDiscount } = getDisplayPrice(product);

  const maxQty = product.stock;

  const handleAddToCart = () => {
    if (maxQty === 0) return;
    updateQuantity(product.id, quantity);
    showCartToast(
      `${product.name} — ${selectedColor?.name ?? ""} / ${selectedSize ?? ""}`,
      final,
    );
  };

  return (
    <>
      <div className="md:grid md:grid-cols-2 md:gap-10">
        <div className="relative">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border">
            <Image
              src={product.image}
              alt={product.name}
              width={1024}
              height={1024}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="size-full object-cover"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col md:mt-0">
          <div>
            <PageBreadcrumbs
              className="mb-4"
              items={[
                { label: "Home", href: ROUTES.home },
                { label: "Catálogo", href: ROUTES.catalogo },
                { label: displayCategory, href: ROUTES.catalogoCategory(product.category) },
                { label: product.name },
              ]}
            />

            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold uppercase tracking-tight">
                {product.name}
              </h1>
              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                aria-label={
                  favorited
                    ? `Quitar ${product.name} de favoritos`
                    : `Añadir ${product.name} a favoritos`
                }
                className="shrink-0 rounded-lg p-1 transition-colors hover:bg-accent/10"
              >
                <Heart
                  className={cn(
                    "size-7",
                    favorited && "fill-favorite text-favorite",
                  )}
                />
              </button>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              {hasDiscount ? (
                <>
                  <span className="text-2xl font-bold text-accent">
                    {formatPrice(final)}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(original)}
                  </span>
                  <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                    -{product.discount}%
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold">
                  {formatPrice(original)}
                </span>
              )}
            </div>

            <div className="mt-3">
              {product.stock > LOW_STOCK_THRESHOLD ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-500">
                  <span className="size-2 rounded-full bg-green-500" />
                  En stock
                </span>
              ) : product.stock > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-yellow-500">
                  <span className="size-2 rounded-full bg-yellow-500" />
                  Quedan {product.stock}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500">
                  <span className="size-2 rounded-full bg-red-500" />
                  Agotado
                </span>
              )}
            </div>

            {product.colors.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Color — {selectedColor?.name}
                </p>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Color ${color.name}`}
                      aria-pressed={selectedColor?.name === color.name}
                      className={cn(
                        "size-8 rounded-full border-2 transition-all",
                        selectedColor?.name === color.name
                          ? "border-accent ring-1 ring-accent ring-offset-1 ring-offset-background"
                          : "border-border hover:border-muted-foreground",
                      )}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.sizes.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Talla
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      aria-pressed={selectedSize === size}
                      aria-label={`Talla ${size}`}
                      className={cn(
                        "flex h-10 min-w-12 items-center justify-center border px-3 text-xs font-bold uppercase transition-colors",
                        selectedSize === size
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border hover:border-muted-foreground",
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cantidad
              </p>
              <div className="inline-flex items-center border border-border">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Reducir cantidad"
                  className={cn(
                    "flex size-11 items-center justify-center text-sm transition-colors hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed",
                  )}
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= maxQty}
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  aria-label="Aumentar cantidad"
                  className={cn(
                    "flex size-11 items-center justify-center text-sm transition-colors hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed",
                  )}
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            {product.description && (
              <div className="mt-6 border-t border-border pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Descripción
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          <div className="mt-auto mb-2 flex flex-col gap-3 pt-6 sm:flex-row">
            <Button
              variant="hero"
              size="hero"
              disabled={maxQty === 0}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 size-4" />
              AÑADIR AL CARRITO
            </Button>
          </div>
        </div>
      </div>
      <RelatedProducts product={product} />
    </>
  );
}
