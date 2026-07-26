"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { ignoreToastClicks } from "@/lib/toast-guard";
import { categoriesStore } from "@/lib/data-store.categories";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface CartProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface CartSheetProps {
  cartCount: number;
  cartProducts: CartProduct[];
  cart: Record<number, number>;
  subtotal: number;
  updateQuantity: (productId: number, delta: number) => void;
  onCheckout?: () => void;
}

export function CartSheet({
  cartCount,
  cartProducts,
  cart,
  subtotal,
  updateQuantity,
  onCheckout,
}: CartSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Abrir carrito con ${cartCount} productos`}
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

        {cartProducts.length === 0 ? (
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
            {cartProducts.map((product) => {
              const quantity = cart[product.id] ?? 0;
              return (
                <article
                  key={product.id}
                  className="flex gap-4 border-b border-border py-5"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={112}
                    height={112}
                    sizes="112px"
                    className="size-24 object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <p className="micro-label">
                        {categoriesStore.getBySlug(product.category)?.name ?? product.category}
                      </p>
                      <h3 className="mt-1 truncate text-sm font-bold uppercase">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11 rounded-none"
                          aria-label={`Quitar una unidad de ${product.name}`}
                          onClick={() => updateQuantity(product.id, -1)}
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
                          onClick={() => updateQuantity(product.id, 1)}
                        >
                          +
                        </Button>
                      </div>
                      <p className="text-sm font-bold">
                        {formatPrice(product.price * quantity)}
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
            onClick={onCheckout}
          >
            IR AL CHECKOUT
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
