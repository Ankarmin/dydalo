"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Heart, Menu, Search, User, X } from "lucide-react";
import { ignoreToastClicks } from "@/lib/utils/toast-guard";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { HeaderNav, marcaItems } from "@/components/layout/header-nav";
import { UserButton } from "@/components/auth/user-button";
import { FavoritesSheet } from "@/components/favorites/favorites-sheet";
import { CartSheet } from "@/components/cart/cart-sheet";
import { CommandSearch } from "@/components/search/command-search";
import { useAuth } from "@/contexts/auth-context";
import { useFavorites } from "@/contexts/favorites-context";
import { useCart } from "@/contexts/cart-context";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import { catalogCategories, getProductCount } from "@/config/products";
import { socialLinks } from "@/config/social-links";
import { socialPresentation } from "@/config/social-presentation";
import { LOGO_DARK, LOGO_LIGHT } from "@/config/constants";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils/utils";
import { ROUTES } from "@/lib/utils/routes";

export function SiteHeader() {
  const { cartCount, cartItems, subtotal, updateQuantity } = useCart();
  const { state: authState, meta: authMeta } = useAuth();
  const { favoritesCount } = useFavorites();
  const mounted = useMounted();
  const canUseFavorites = authState.status !== "loading" && !authMeta.isAdmin;
  const [searchOpen, setSearchOpen] = useState(false);
  const [catalogExpanded, setCatalogExpanded] = useState(false);
  const [marcaExpanded, setMarcaExpanded] = useState(false);

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
          <SheetContent side="left" className="flex w-[280px] flex-col border-border bg-background p-0 sm:max-w-sm" onInteractOutside={ignoreToastClicks}>
            <SheetHeader className="flex h-16 shrink-0 items-center justify-between border-b-2 border-favorite bg-background/85 px-4 backdrop-blur-xl text-left">
              <div className="flex items-center gap-2">
                <Image src={LOGO_DARK} alt="DYDALO" width={120} height={28} className="h-7 w-auto logo-dark" />
                <Image src={LOGO_LIGHT} alt="DYDALO" width={120} height={28} className="h-7 w-auto logo-light" />
              </div>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" aria-label="Cerrar menú">
                  <X className="size-5" />
                </Button>
              </SheetClose>
              <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Menú móvil">
              <div className="flex flex-col gap-1">
              <SheetClose asChild>
                <Link
                  href={ROUTES.loUltimo}
                  className="flex items-center rounded-lg px-3 py-3 text-sm font-bold uppercase tracking-nav text-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                >
                  LO ÚLTIMO
                </Link>
              </SheetClose>
                <button
                  type="button"
                  onClick={() => setCatalogExpanded(!catalogExpanded)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-bold uppercase tracking-nav text-foreground transition-colors hover:bg-accent/10 hover:text-accent"
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
                <button
                  type="button"
                  onClick={() => setMarcaExpanded(!marcaExpanded)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-bold uppercase tracking-nav text-foreground transition-colors hover:bg-accent/10 hover:text-accent"
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
                {canUseFavorites && (
                  <SheetClose asChild>
                    <Link
                      href={ROUTES.favoritos}
                      className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-xs font-bold uppercase tracking-dropdown text-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                    >
                      <Heart className="size-4" />
                      FAVORITOS
                    </Link>
                  </SheetClose>
                )}
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
          {canUseFavorites && (
            <FavoritesSheet
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={mounted ? `Ver favoritos con ${favoritesCount} productos` : "Ver favoritos"}
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
          )}
          <div className="hidden xl:inline-flex">
            <UserButton />
          </div>
          <ThemeToggle />
          <CartSheet
            cartCount={cartCount}
            cartItems={cartItems}
            subtotal={subtotal}
            updateQuantity={updateQuantity}
          />
        </>
      }
    />
  );
}
