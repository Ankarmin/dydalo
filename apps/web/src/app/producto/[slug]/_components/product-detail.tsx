"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Minus, Pencil, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { formatPrice, getDisplayPrice } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/routes";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { useFavorites } from "@/contexts/favorites-context";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import type { AdminProduct } from "@/lib/stores/data-store.types";
import { showCartToast } from "@/components/cart/cart-toast";
import { RelatedProducts } from "@/components/product/related-products";
import { SizeGuideModal } from "@/components/product/size-guide-modal";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";
import { LOW_STOCK_THRESHOLD } from "@/config/constants";
import { getAvailableColorsForSize, getAvailableSizes, getVariantStock } from "@/lib/utils/inventory";

interface ProductDetailProps {
  product: AdminProduct;
}

function getProductImages(product: AdminProduct): string[] {
  return [product.image, ...(product.images ?? [])].filter(
    (image, index, images): image is string => Boolean(image) && images.indexOf(image) === index,
  );
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { updateQuantity } = useCart();
  const { state: authState, meta: authMeta } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const categoryName =
    categoriesStore.getBySlug(product.category)?.name ?? product.category;
  const displayCategory =
    categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();
  const initialAvailableSize = getAvailableSizes(product)[0] ?? product.sizes[0] ?? null;
  const initialAvailableColorName = initialAvailableSize
    ? getAvailableColorsForSize(product, initialAvailableSize)[0]
    : undefined;

  const [selectedColor, setSelectedColor] = useState<AdminProduct["colors"][number] | null>(
    product.colors.find((color) => color.name === initialAvailableColorName) ?? product.colors[0] ?? null,
  );
  const [selectedSize, setSelectedSize] = useState(
    initialAvailableSize,
  );
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const favorited = product ? isFavorite(product.id) : false;
  const { final, original, hasDiscount } = getDisplayPrice(product);
  const productImages = getProductImages(product);
  const activeImage = productImages[activeImageIndex] ?? product.image;
  const hasGallery = productImages.length > 1;
  const availableSizes = getAvailableSizes(product);
  const availableColorsForSelectedSize = selectedSize
    ? getAvailableColorsForSize(product, selectedSize)
    : [];

  const maxQty = selectedSize && selectedColor
    ? getVariantStock(product, selectedSize, selectedColor.name)
    : 0;
  const selectedQuantity = Math.min(quantity, Math.max(1, maxQty));

  const showPreviousImage = () => {
    setActiveImageIndex((index) => (index === 0 ? productImages.length - 1 : index - 1));
  };

  const showNextImage = () => {
    setActiveImageIndex((index) => (index + 1) % productImages.length);
  };

  const handleAddToCart = () => {
    if (authState.status === "loading") return;
    if (authMeta.isAdmin) return;
    if (maxQty === 0) return;
    if (!selectedSize || !selectedColor) return;
    updateQuantity(product.id, selectedQuantity, { size: selectedSize, color: selectedColor.name });
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
              src={activeImage}
              alt={`${product.name} — imagen ${activeImageIndex + 1}`}
              width={1024}
              height={1024}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="size-full object-cover"
            />
            {hasGallery && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  aria-label="Ver imagen anterior"
                  className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  aria-label="Ver imagen siguiente"
                  className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <ChevronRight className="size-5" />
                </button>
                <span className="absolute bottom-3 right-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-bold tabular-nums text-foreground backdrop-blur md:bottom-auto md:top-3">
                  {activeImageIndex + 1}/{productImages.length}
                </span>
              </>
            )}
          </div>
          {hasGallery && (
            <div className="mt-3 overflow-x-auto pb-1 md:absolute md:inset-x-0 md:bottom-0 md:z-10 md:mt-0 md:overflow-visible md:px-3 md:pb-3 md:pt-24 md:opacity-0 md:transition-opacity md:duration-200 md:hover:opacity-100 md:focus-within:opacity-100">
              <div className="flex gap-2 md:rounded-lg md:bg-background/70 md:p-2 md:backdrop-blur">
                {productImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`Ver imagen ${index + 1}`}
                    aria-pressed={activeImageIndex === index}
                    className={cn(
                      "relative size-16 shrink-0 overflow-hidden rounded-md border transition-colors sm:size-20 md:size-14",
                      activeImageIndex === index ? "border-accent" : "border-border hover:border-muted-foreground",
                    )}
                  >
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
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
              <div className="flex shrink-0 items-center gap-1">
                {authState.status === "loading" ? null : authMeta.isAdmin ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-lg border border-border bg-background/80"
                    asChild
                  >
                    <Link
                      href={ROUTES.adminProductoEditar(product.id)}
                      aria-label="Editar producto"
                    >
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleFavorite(product.id)}
                    aria-label={
                      favorited
                        ? `Quitar ${product.name} de favoritos`
                        : `Añadir ${product.name} a favoritos`
                    }
                    className="rounded-lg p-1 transition-colors hover:bg-accent/10"
                  >
                    <Heart
                      className={cn(
                        "size-7",
                        favorited && "fill-favorite text-favorite",
                      )}
                    />
                  </button>
                )}
              </div>
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
              {maxQty > 0 ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm font-medium",
                    maxQty > LOW_STOCK_THRESHOLD ? "text-success" : "text-warning"
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      maxQty > LOW_STOCK_THRESHOLD ? "bg-success" : "bg-warning"
                    )}
                  />
                  {maxQty} disponible{maxQty !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-danger">
                  <span className="size-2 rounded-full bg-danger" />
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
                  {product.colors.map((color) => {
                    const available = selectedSize
                      ? availableColorsForSelectedSize.includes(color.name)
                      : getVariantStock(product, product.sizes[0] ?? "Única", color.name) > 0;
                    return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => {
                        if (!available) return;
                        setSelectedColor(color);
                        setQuantity(1);
                      }}
                      disabled={!available}
                      aria-label={`Color ${color.name}`}
                      aria-pressed={selectedColor?.name === color.name}
                      className={cn(
                        "size-8 rounded-full border-2 transition-all",
                        selectedColor?.name === color.name
                          ? "border-accent ring-1 ring-accent ring-offset-1 ring-offset-background"
                          : "border-border hover:border-muted-foreground",
                        !available && "cursor-not-allowed opacity-30",
                      )}
                      style={{ backgroundColor: color.hex }}
                    />
                    );
                  })}
                </div>
              </div>
            )}

            {product.sizes.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Talla
                  </p>
                  <SizeGuideModal product={product} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const available = availableSizes.includes(size);
                    return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        if (!available) return;
                        setSelectedSize(size);
                        const colorsForSize = getAvailableColorsForSize(product, size);
                        if (selectedColor && !colorsForSize.includes(selectedColor.name)) {
                          const nextColor = product.colors.find((color) => colorsForSize.includes(color.name));
                          setSelectedColor(nextColor ?? null);
                        }
                        setQuantity(1);
                      }}
                      disabled={!available}
                      aria-pressed={selectedSize === size}
                      aria-label={`Talla ${size}`}
                      className={cn(
                        "flex h-10 min-w-12 items-center justify-center border px-3 text-xs font-bold uppercase transition-colors",
                        selectedSize === size
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border hover:border-muted-foreground",
                        !available && "cursor-not-allowed opacity-30",
                      )}
                    >
                      {size}
                    </button>
                    );
                  })}
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
                  {selectedQuantity}
                </span>
                <button
                  type="button"
                  disabled={selectedQuantity >= maxQty}
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
          </div>

          <div className="mt-auto mb-2 flex flex-col gap-3 pt-6 sm:flex-row">
            <Button
              variant="hero"
              size="hero"
              disabled={authState.status === "loading" || authMeta.isAdmin || maxQty === 0}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 size-4" />
              {authMeta.isAdmin
                ? "COMPRA DESACTIVADA"
                : "AÑADIR AL CARRITO"}
            </Button>
          </div>
        </div>
      </div>
      <RelatedProducts product={product} />
    </>
  );
}
