"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown, Heart, Menu, Search, User } from "lucide-react";
import { ignoreToastClicks } from "@/lib/toast-guard";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderNav, marcaItems } from "@/components/header-nav";
import { UserButton } from "@/components/auth/user-button";
import { FavoritesSheet } from "@/components/favorites/favorites-sheet";
import { CartSheet } from "@/components/cart-sheet";
import { CommandSearch } from "@/components/search/command-search";
import { useFavorites } from "@/contexts/favorites-context";
import { useCart } from "@/contexts/cart-context";
import { products } from "@/data/products";
import { categoriesStore } from "@/lib/data-store.categories";
import { catalogCategories } from "@/data/products";
import { socialLinks } from "@/lib/social-links";
import { socialPresentation } from "@/lib/social-presentation";
import { LOGO_DARK, LOGO_LIGHT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";

function getProductCount(slug: string): number {
  return products.filter((p) => p.category === slug).length;
}

export function SiteHeader() {
  const { cartCount, cartProducts, cart, subtotal, updateQuantity } = useCart();
  const { favoritesCount } = useFavorites();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catalogExpanded, setCatalogExpanded] = useState(false);
  const [marcaExpanded, setMarcaExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <HeaderNav
      left={
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              aria-label="Abrir menú"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-full flex-col border-border bg-background p-0 sm:max-w-sm" onInteractOutside={ignoreToastClicks}>
            <SheetHeader className="border-b border-border px-6 py-6 text-left">
              <SheetTitle>
                <Image src={LOGO_DARK} alt="DYDALO" width={120} height={28} className="h-7 w-auto logo-dark" />
                <Image src={LOGO_LIGHT} alt="DYDALO" width={120} height={28} className="h-7 w-auto logo-light" />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Menú móvil">
              <SheetClose asChild>
                <Link
                  href={ROUTES.loUltimo}
                  className="flex items-center py-4 text-sm font-bold uppercase tracking-nav text-foreground transition-colors hover:text-accent"
                >
                  LO ÚLTIMO
                </Link>
              </SheetClose>
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setCatalogExpanded(!catalogExpanded)}
                  className="flex w-full items-center justify-between py-4 text-sm font-bold uppercase tracking-nav text-foreground transition-colors hover:text-accent"
                >
                  CATÁLOGO DYDALO
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      catalogExpanded && "rotate-180",
                    )}
                  />
                </button>
                {catalogExpanded && (
                  <div className="flex flex-col gap-1 pb-4">
                    {(categoriesStore.getActive().length > 0 ? categoriesStore.getActive() : catalogCategories).map((cat) => {
                      const count = getProductCount(cat.slug);
                      return (
                        <SheetClose key={cat.slug} asChild>
                          <Link
                            href={ROUTES.catalogoCategory(cat.slug)}
                            className={cn(
                              "flex items-center justify-between rounded-sm px-3 py-2.5 text-xs uppercase tracking-dropdown transition-colors hover:bg-accent/10 hover:text-accent",
                              count === 0 && "pointer-events-none opacity-40",
                            )}
                          >
                            <span>{cat.name}</span>
                            <span className="micro-text text-muted-foreground">
                              {count}
                            </span>
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </div>
                )}
              </div>
              <SheetClose asChild>
                <Link
                  href={ROUTES.lookbook}
                  className="flex items-center border-t border-border py-4 text-sm font-bold uppercase tracking-nav text-foreground transition-colors hover:text-accent"
                >
                  LOOKBOOK
                </Link>
              </SheetClose>
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setMarcaExpanded(!marcaExpanded)}
                  className="flex w-full items-center justify-between py-4 text-sm font-bold uppercase tracking-nav text-foreground transition-colors hover:text-accent"
                >
                  LA MARCA
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      marcaExpanded && "rotate-180",
                    )}
                  />
                </button>
                {marcaExpanded && (
                  <div className="flex flex-col gap-1 pb-4">
                    {marcaItems.map((item) => (
                      <SheetClose key={item.href} asChild>
                        <Link
                          href={item.href}
                          className="flex items-center rounded-sm px-3 py-2.5 text-xs uppercase tracking-dropdown transition-colors hover:bg-accent/10 hover:text-accent"
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                )}
              </div>
            </nav>
            <div className="border-t border-border px-4 py-4">
              <div className="mb-4 space-y-1">
                <SheetClose asChild>
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-xs font-bold uppercase tracking-dropdown text-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                  >
                    <Search className="size-4" />
                    BUSCAR
                  </button>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href={ROUTES.favoritos}
                    className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-xs font-bold uppercase tracking-dropdown text-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                  >
                    <Heart className="size-4" />
                    FAVORITOS
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href={ROUTES.login}
                    className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-xs font-bold uppercase tracking-dropdown text-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                  >
                    <User className="size-4" />
                    MI CUENTA
                  </Link>
                </SheetClose>
              </div>
              <p className="mb-3 text-center micro-text font-bold uppercase tracking-micro text-muted-foreground">
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
          <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
          <FavoritesSheet
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Ver favoritos con ${favoritesCount} productos`}
                className="relative hidden xl:inline-flex"
              >
                <Heart />
                {mounted && favoritesCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid size-4 place-items-center bg-accent text-[9px] font-bold text-accent-foreground">
                    {favoritesCount}
                  </span>
                )}
              </Button>
            }
          />
          <div className="hidden xl:inline-flex">
            <UserButton />
          </div>
          <ThemeToggle />
          <CartSheet
            cartCount={cartCount}
            cartProducts={cartProducts}
            cart={cart}
            subtotal={subtotal}
            updateQuantity={updateQuantity}
          />
        </>
      }
    />
  );
}
