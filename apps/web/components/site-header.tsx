"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, ChevronDown, Menu, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderNav } from "@/components/header-nav";
import { useCart } from "@/contexts/cart-context";
import { catalogCategories, products } from "@/data/products";
import { socialLinks } from "@/lib/social-links";
import { socialPresentation } from "@/lib/social-presentation";
import { cn } from "@/lib/utils";

function getProductCount(slug: string): number {
  return products.filter((p) => p.category === slug).length;
}

export function SiteHeader() {
  const { cartCount, cartProducts, cart, subtotal, updateQuantity } = useCart();
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());
  const [catalogExpanded, setCatalogExpanded] = useState(false);

  return (
    <HeaderNav
      left={
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Abrir menu"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-full flex-col border-border bg-background p-0 sm:max-w-sm">
            <SheetHeader className="border-b border-border px-6 py-6 text-left">
              <SheetTitle className="text-2xl logo-oblique">
                DYDALO
              </SheetTitle>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Menu movil">
              <SheetClose asChild>
                <Link
                  href="/#lo-ultimo"
                  className="flex items-center py-4 text-sm font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:text-accent"
                >
                  LO ULTIMO
                </Link>
              </SheetClose>
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setCatalogExpanded(!catalogExpanded)}
                  className="flex w-full items-center justify-between py-4 text-sm font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:text-accent"
                >
                  CATALOGO DYDALO
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      catalogExpanded && "rotate-180",
                    )}
                  />
                </button>
                {catalogExpanded && (
                  <div className="flex flex-col gap-1 pb-4">
                    {catalogCategories.map((cat) => {
                      const count = getProductCount(cat.slug);
                      return (
                        <SheetClose key={cat.slug} asChild>
                          <Link
                            href={`/catalogo/${cat.slug}`}
                            className={cn(
                              "flex items-center justify-between rounded-sm px-3 py-2.5 text-xs uppercase tracking-[0.12em] transition-colors hover:bg-accent/10 hover:text-accent",
                              count === 0 && "pointer-events-none opacity-40",
                            )}
                          >
                            <span>{cat.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {count}
                            </span>
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
            <div className="border-t border-border px-4 py-4">
              <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Redes
              </p>
              <div className="flex justify-center gap-3">
                {socialLinks.map((link) => {
                  const { icon: Icon, gradient } = socialPresentation[link.key];
                  return (
                    <a
                      key={link.key}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg transition-transform hover:scale-110",
                        "bg-gradient-to-br",
                        gradient,
                      )}
                    >
                      <Icon className="size-4 text-white" />
                    </a>
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      }
      right={
        <>
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Abrir bolsa con ${cartCount} productos`}
                className="relative"
              >
                <ShoppingBag />
                <span className="absolute -right-1 -top-1 grid size-4 place-items-center bg-accent text-[9px] font-bold text-accent-foreground">
                  {cartCount}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col border-border bg-background p-0 sm:max-w-md">
              <SheetHeader className="border-b border-border px-6 py-6 text-left">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-accent">
                  Tu seleccion
                </p>
                <SheetTitle className="text-3xl font-bold tracking-[-0.05em]">
                  TU BOLSA
                </SheetTitle>
                <SheetDescription>
                  {cartCount === 0
                    ? "Todavia no elegiste tu flow."
                    : `${cartCount} piezas seleccionadas`}
                </SheetDescription>
              </SheetHeader>

              {cartProducts.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                  <ShoppingBag
                    className="mb-5 size-10 text-muted-foreground"
                    strokeWidth={1.25}
                  />
                  <p className="text-xl font-bold">LA BOLSA ESTA VACIA</p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                    Encuentra una pieza que hable por ti y añadela a tu
                    seleccion.
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
                          src={
                            brokenImages.has(product.id)
                              ? "/images/dydalo-hero.jpg"
                              : product.image
                          }
                          alt={product.name}
                          width={112}
                          height={112}
                          sizes="112px"
                          onError={() =>
                            setBrokenImages((prev) =>
                              new Set(prev).add(product.id),
                            )
                          }
                          className="size-24 object-cover"
                        />
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            <p className="text-[9px] font-bold tracking-[0.18em] text-accent">
                              {product.label}
                            </p>
                            <h3 className="mt-1 truncate text-sm font-bold uppercase">
                              {product.name}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              ${product.price}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-border">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-none"
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
                                className="size-10 rounded-none"
                                aria-label={`Añadir una unidad de ${product.name}`}
                                onClick={() => updateQuantity(product.id, 1)}
                              >
                                +
                              </Button>
                            </div>
                            <p className="text-sm font-bold">
                              ${product.price * quantity}
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
                    <p className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground">
                      SUBTOTAL
                    </p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">
                      ${subtotal}
                    </p>
                  </div>
                  <p className="text-right text-[10px] leading-4 text-muted-foreground">
                    ENVIO CALCULADO
                    <br />
                    EN EL CHECKOUT
                  </p>
                </div>
                <Button
                  variant="hero"
                  size="hero"
                  className="w-full"
                  disabled={!cartCount}
                  onClick={() =>
                    toast("Checkout en construccion. Pronto disponible.")
                  }
                >
                  FINALIZAR COMPRA <ArrowUpRight />
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </>
      }
    />
  );
}
