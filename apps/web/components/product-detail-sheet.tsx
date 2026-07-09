"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatPrice } from "@/lib/format";
import { showCartToast } from "@/components/cart-toast";
import { useCart } from "@/contexts/cart-context";
import { FALLBACK_IMAGE } from "@/lib/constants";
import { ignoreToastClicks } from "@/lib/toast-guard";
import { type Product } from "@/data/products";
import { productsStore } from "@/lib/data-store.products";
import { categoriesStore } from "@/lib/data-store.categories";

interface ProductDetailSheetProps {
  productId: number;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductDetailSheet({
  productId,
  trigger,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: ProductDetailSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [brokenImages, setBrokenImages] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      if (isControlled) {
        externalOnOpenChange?.(false);
      } else {
        setInternalOpen(false);
      }
      return;
    }
    const product = productsStore.getById(productId);
    setSelectedSize(product?.sizes?.[0] ?? null);
    setSelectedColor(product?.colors?.[0]?.name ?? null);
    setBrokenImages(false);
    if (isControlled) {
      externalOnOpenChange?.(true);
    } else {
      setInternalOpen(true);
    }
  };

  const { updateQuantity } = useCart();
  const product = productsStore.getById(productId) ?? null;

  const handleAddToCart = () => {
    if (!product) return;
    updateQuantity(product.id, 1);
    showCartToast(
      `${product.name} — ${selectedColor} / ${selectedSize}`,
      product.price,
    );
    handleOpenChange(false);
  };

  const handleInteractOutside = useCallback(ignoreToastClicks, []);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        side="right"
        className="flex w-full flex-col border-border bg-background p-0 sm:max-w-md"
        onInteractOutside={handleInteractOutside}
      >
        {product && (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>{product.name}</SheetTitle>
              <SheetDescription>
                Selecciona talla y color para {product.name}
              </SheetDescription>
            </SheetHeader>

            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={brokenImages ? FALLBACK_IMAGE : product.image}
                alt={product.name}
                width={1024}
                height={768}
                sizes="(max-width: 640px) 100vw, 448px"
                className="size-full object-cover"
                onError={() => setBrokenImages(true)}
              />
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="absolute left-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-sm transition-colors hover:bg-background/90 focus-ring"
                aria-label="Cerrar detalle del producto"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6">
              <div className="border-b border-border pb-6 pt-6">
                <p className="micro-label">{categoriesStore.getBySlug(product.category)?.name ?? product.category}</p>
                <h2 className="mt-2 text-2xl font-bold uppercase tracking-tight">
                  {product.name}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {categoriesStore.getBySlug(product.category)?.name ?? product.category}
                </p>
                <p className="mt-3 text-xl font-bold">
                  {formatPrice(product.price)}
                </p>
              </div>

              {product.sizes && product.sizes.length > 1 && (
                <div className="border-b border-border py-6">
                  <p className="mb-3 micro-text font-bold uppercase tracking-micro text-muted-foreground">
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
                        className={`flex h-10 min-w-12 items-center justify-center border px-3 text-xs font-bold uppercase transition-colors ${
                          selectedSize === size
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-b border-border py-6">
                <p className="mb-3 micro-text font-bold uppercase tracking-micro text-muted-foreground">
                  Color
                </p>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.name)}
                      aria-pressed={selectedColor === color.name}
                      aria-label={`Color ${color.name}`}
                      className="flex items-center gap-2"
                    >
                      <span
                        aria-hidden="true"
                        className={`size-7 rounded-full border-2 transition-colors ${
                          selectedColor === color.name
                            ? "border-accent"
                            : "border-border"
                        }`}
                        style={{ backgroundColor: color.hex }}
                      />
                      <span
                        className={`text-xs uppercase ${
                          selectedColor === color.name
                            ? "text-foreground font-bold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <Button
                  variant="hero"
                  size="hero"
                  className="w-full"
                  onClick={handleAddToCart}
                >
                  AÑADIR A LA BOLSA <ArrowUpRight />
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
