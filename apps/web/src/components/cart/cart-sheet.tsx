"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { formatPrice, getDisplayPrice } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/routes";
import { ignoreToastClicks } from "@/lib/utils/toast-guard";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import { useMounted } from "@/hooks/use-mounted";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { CartLine } from "@/contexts/cart-context";
import { getVariantStock } from "@/lib/utils/inventory";

interface CartSheetProps {
  cartCount: number;
  cartItems: CartLine[];
  subtotal: number;
  updateQuantity: (productId: number, delta: number, variant?: { size?: string; color?: string }) => void;
}

export function CartSheet({
  cartCount,
  cartItems,
  subtotal,
  updateQuantity,
}: CartSheetProps) {
  const router = useRouter();
  const mounted = useMounted();
  const { state: authState, meta: authMeta } = useAuth();
  const [open, setOpen] = useState(false);

  function handleGoToCart() {
    setOpen(false);
    if (!authState.user) {
      router.push(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.carrito)}`);
      return;
    }
    if (authMeta.isAdmin) {
      router.push(ROUTES.catalogo);
      return;
    }
    router.push(ROUTES.carrito);
  }

  if (authState.status === "loading" || authMeta.isAdmin) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={mounted ? `Abrir carrito con ${cartCount} productos` : "Abrir carrito"}
          className="relative"
        >
          <ShoppingCart />
          <span className="absolute -right-1 -top-1 grid size-4 place-items-center bg-accent text-[9px] font-bold text-accent-foreground">
            {cartCount}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col border-border bg-background p-0 sm:max-w-md" onInteractOutside={ignoreToastClicks}>
        <SheetHeader className="border-b border-border px-6 py-6 text-left">
          <p className="text-sm font-bold uppercase tracking-subhead text-accent">
            Tu selección
          </p>
          <SheetTitle className="text-3xl font-bold tracking-[-0.05em]">
            TU CARRITO
          </SheetTitle>
          <SheetDescription>
            {cartCount === 0
              ? "Todavía no elegiste tu flow."
              : `${cartCount} piezas seleccionadas`}
          </SheetDescription>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <ShoppingCart
              className="mb-5 size-10 text-muted-foreground"
              strokeWidth={1.25}
            />
            <p className="text-xl font-bold">EL CARRITO ESTÁ VACÍO</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
              Encuentra una pieza que hable por ti y añádela a tu selección.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6">
            {cartItems.map((item) => {
              const product = item.product;
              const quantity = item.quantity;
              const maxStock = getVariantStock(product, item.size, item.color);
              const priceData = getDisplayPrice(product);
              return (
                <article
                  key={item.key}
                  className="flex gap-4 border-b border-border py-5"
                >
                  <SheetClose asChild>
                    <Link
                      href={ROUTES.producto(product.slug)}
                      className="shrink-0"
                    >
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={112}
                        height={112}
                        sizes="112px"
                        className="size-24 object-cover"
                      />
                    </Link>
                  </SheetClose>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <p className="micro-label">
                        {categoriesStore.getBySlug(product.category)?.name ?? product.category}
                      </p>
                      <h3 className="mt-1 truncate text-sm font-bold uppercase">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.color} / {item.size}
                      </p>
                      <p className="mt-1 text-xs">
                        {priceData.hasDiscount ? (
                          <span>
                            <span className="text-accent font-semibold">{formatPrice(priceData.final)}</span>{" "}
                            <span className="text-muted-foreground line-through">{formatPrice(priceData.original)}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{formatPrice(priceData.original)}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11 rounded-none"
                          aria-label={`Quitar una unidad de ${product.name}`}
                          onClick={() => updateQuantity(product.id, -1, item)}
                        >
                          −
                        </Button>
                        <span className="w-7 text-center text-xs font-bold">
                          {quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11 rounded-none"
                          aria-label={`Añadir una unidad de ${product.name}`}
                          onClick={() => updateQuantity(product.id, 1, item)}
                          disabled={quantity >= maxStock}
                        >
                          +
                        </Button>
                      </div>
                      <p className="text-sm font-bold">
                        {formatPrice(priceData.final * quantity)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="border-t border-border bg-secondary/40 p-6">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="micro-text font-bold tracking-[0.18em] text-muted-foreground">
                SUBTOTAL
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {formatPrice(subtotal)}
              </p>
            </div>
            <p className="text-right micro-text leading-4 text-muted-foreground">
              ENVÍO CALCULADO
              <br />
              EN EL CHECKOUT
            </p>
          </div>
          <Button
            variant="hero"
            size="hero"
            className="w-full"
            disabled={!cartCount}
            onClick={handleGoToCart}
          >
            VER CARRITO
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
