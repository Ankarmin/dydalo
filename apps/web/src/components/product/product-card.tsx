"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatPrice, getDisplayPrice } from "@/lib/utils/format";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import { ROUTES } from "@/lib/utils/routes";
import { cn } from "@/lib/utils/utils";

interface ProductCardData {
  id: number;
  name: string;
  slug?: string;
  category: string;
  price: number;
  discount: number | null | undefined;
  image: string;
  images?: string[];
  colors?: { name: string; hex: string }[];
}

function getProductImages(product: ProductCardData): string[] {
  return [product.image, ...(product.images ?? [])].filter(
    (image, index, images): image is string => Boolean(image) && images.indexOf(image) === index,
  );
}

function getProductSlug(product: ProductCardData): string {
  if (product.slug) return product.slug;
  return product.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface ProductCardProps {
  product: ProductCardData;
  priority?: boolean;
}

export function ProductCard({ product, priority }: ProductCardProps) {
  const categoryName =
    categoriesStore.getBySlug(product.category)?.name ?? product.category;
  const { final, hasDiscount } = getDisplayPrice(product);
  const productImages = getProductImages(product);
  const primaryImage = productImages[0] ?? product.image;
  const [isCyclingImages, setIsCyclingImages] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previousImageIndex, setPreviousImageIndex] = useState(0);
  const [isAnimatingImage, setIsAnimatingImage] = useState(false);
  const activeImageIndexRef = useRef(0);
  const animationTimeoutRef = useRef<number | null>(null);
  const activeImage = productImages[activeImageIndex] ?? primaryImage;
  const previousImage = productImages[previousImageIndex] ?? primaryImage;
  const hasMultipleImages = productImages.length > 1;

  useEffect(() => {
    activeImageIndexRef.current = activeImageIndex;
  }, [activeImageIndex]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) window.clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  const cycleToNextImage = useCallback(() => {
    if (!hasMultipleImages) return;

    const currentIndex = activeImageIndexRef.current;
    const nextIndex = (currentIndex + 1) % productImages.length;

    setPreviousImageIndex(currentIndex);
    activeImageIndexRef.current = nextIndex;
    setActiveImageIndex(nextIndex);
    setIsAnimatingImage(true);

    if (animationTimeoutRef.current) window.clearTimeout(animationTimeoutRef.current);
    animationTimeoutRef.current = window.setTimeout(() => {
      setIsAnimatingImage(false);
    }, 500);
  }, [hasMultipleImages, productImages.length]);

  useEffect(() => {
    if (!isCyclingImages || !hasMultipleImages) return;

    const interval = window.setInterval(() => {
      cycleToNextImage();
    }, 1200);

    return () => window.clearInterval(interval);
  }, [cycleToNextImage, isCyclingImages, hasMultipleImages]);

  function startImageCycle() {
    if (!hasMultipleImages || isCyclingImages) return;
    setIsCyclingImages(true);
    cycleToNextImage();
  }

  function stopImageCycle() {
    if (animationTimeoutRef.current) window.clearTimeout(animationTimeoutRef.current);
    setIsCyclingImages(false);
    setIsAnimatingImage(false);
    setPreviousImageIndex(0);
    activeImageIndexRef.current = 0;
    setActiveImageIndex(0);
  }

  return (
    <article className="group relative">
      <Link
        href={ROUTES.producto(getProductSlug(product))}
        onMouseEnter={startImageCycle}
        onMouseLeave={stopImageCycle}
        onFocus={startImageCycle}
        onBlur={stopImageCycle}
        className="product-glass relative block aspect-square w-full overflow-hidden border border-border text-left transition-all duration-500 cursor-pointer group-hover:-translate-y-2 group-hover:border-accent focus-ring"
      >
        <span className="absolute left-4 top-4 z-10 product-label">
          {categoryName}
        </span>
        <FavoriteButton
          productId={product.id}
          productName={product.name}
          variant="card"
        />
        <div className="absolute inset-0 overflow-hidden">
          {isAnimatingImage && previousImage !== activeImage && (
            <Image
              key={`previous-${previousImageIndex}-${previousImage}`}
              src={previousImage}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="absolute inset-0 size-full object-cover animate-out slide-out-to-left duration-500 ease-out group-hover:scale-105"
            />
          )}
          <Image
            key={`active-${activeImageIndex}-${activeImage}`}
            src={activeImage}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className={cn(
              "absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105",
              isAnimatingImage && "animate-in slide-in-from-right duration-500 ease-out",
            )}
          />
        </div>
        {product.discount != null && product.discount > 0 && (
          <span className="absolute bottom-4 right-4 z-10 rounded-full bg-accent px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-accent-foreground">
            -{product.discount}%
          </span>
        )}
      </Link>

      {product.colors && product.colors.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5">
          {product.colors.map((color) => (
            <span
              key={color.name}
              className="size-4 rounded-full border border-border"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold uppercase tracking-tight">
            {product.name}
          </h3>
        </div>
        <div className="shrink-0 text-right">
          {hasDiscount ? (
            <>
              <p className="text-sm font-semibold tabular-nums text-accent">
                {formatPrice(final)}
              </p>
              <p className="text-xs text-muted-foreground line-through tabular-nums">
                {formatPrice(product.price)}
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold tabular-nums">
              {formatPrice(product.price)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
