# Implementación de Favoritos (Wishlist) — Documento Técnico

> **Versión:** 1.0
> **Fecha:** 18 Jun 2026
> **Stack:** React 19 + TypeScript + React Context + localStorage
> **Objetivo:** Implementar sistema de favoritos/wishlist completo con toggle en producto, sheet lateral, página dedicada, persistencia local y badge en header.

---

## Tabla de contenidos

1. [Diagnóstico del estado actual](#1-diagnóstico-del-estado-actual)
2. [Arquitectura general](#2-arquitectura-general)
3. [Estructura de archivos](#3-estructura-de-archivos)
4. [Contexto de favoritos — `favorites-context.tsx`](#4-contexto-de-favoritos)
5. [Botón de favorito — `favorite-button.tsx`](#5-botón-de-favorito)
6. [Sheet lateral — `favorites-sheet.tsx`](#6-sheet-lateral)
7. [Página de favoritos — `/favoritos`](#7-página-de-favoritos)
8. [Integración en el header](#8-integración-en-el-header)
9. [Integración en product cards](#9-integración-en-product-cards)
10. [Rutas y navegación](#10-rutas-y-navegación)
11. [Persistencia con localStorage](#11-persistencia-con-localstorage)
12. [Mejores prácticas aplicadas](#12-mejores-prácticas-aplicadas)
13. [Estados y edge cases](#13-estados-y-edge-cases)
14. [Extensibilidad futura](#14-extensibilidad-futura)
15. [Checklist de implementación](#15-checklist-de-implementación)

---

## 1. Diagnóstico del estado actual

| Componente | Estado |
|---|---|
| Botón corazón en header (desktop) | Placeholder sin acción. `hidden lg:inline-flex`. Solo visible en desktop. |
| Botón FAVORITOS en menú móvil | Placeholder sin acción. `<button>` dentro de `<SheetClose>`. |
| Página `/favoritos` | No existe. |
| Ruta en `ROUTES` | No definida. |
| Contexto de favoritos | No existe. |
| Botón de favorito en product cards | No existe. Los cards en `catalog-grid.tsx` no tienen acciones. |
| Persistencia | No existe. |

### Lo que YA tienes (no reinventar)

| Recurso | Ubicación | Cómo se reutiliza |
|---|---|---|
| `CartProvider` / `useCart` | `contexts/cart-context.tsx` | Patrón de diseño: Context + `useState` + `useCallback` + `useMemo` |
| `Sheet` de carrito | `site-header.tsx:162-291` | Patrón de Sheet lateral con lista de productos, imagen, precio, subtotal |
| `Product` type | `data/products.ts:7-17` | `id`, `name`, `type`, `category`, `price`, `image`, `label`, `sizes`, `colors` |
| `Heart` icon | `lucide-react` (ya importado) | `size-4`, variants: `fill` vs `outline` |
| `catalog-grid.tsx` | `components/catalog-grid.tsx` | Punto de integración para el botón corazón en cada card |
| `formatPrice` | `lib/format.ts` | Para mostrar precios en favoritos |
| `Button` | `components/ui/button.tsx` | `variant="ghost" size="icon"` para el toggle |

---

## 2. Arquitectura general

```
┌─────────────────────────────────────────────────┐
│                  app/layout.tsx                   │
│  ┌───────────────────────────────────────────┐  │
│  │  FavoritesProvider                        │  │
│  │  ┌──────────────┐  ┌───────────────────┐  │  │
│  │  │ SiteHeader   │  │ {children}        │  │  │
│  │  │  ♡ badge ←───┤  │  catalog-grid     │  │  │
│  │  │  ♡ sheet     │  │   ♡ toggle cards  │  │  │
│  │  └──────────────┘  └───────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  FavoritesContext    │
              │                     │
              │  state: Set<number> │  ← product IDs
              │                     │
              │  toggleFavorite(id) │
              │  isFavorite(id)     │
              │  favorites[]        │  ← Product[] derivado
              │  favoritesCount     │
              │  clearAll()         │
              └─────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   localStorage      │
              │   key: "dydalo-favs"│
              │   value: number[]   │
              └─────────────────────┘
```

### Flujo de favorito

```
1. Usuario ve un producto en catálogo / home
2. Click en ♡ → toggleFavorite(product.id)
3. Context actualiza Set<number>
4. localStorage sincronizado
5. Badge en header actualiza contador
6. Sheet lateral y página /favoritos reflejan el cambio

Remover:
1. Click en ♡ (ya lleno) → toggleFavorite(product.id)
2. Producto desaparece de favoritos
3. Si estaba en /favoritos y era el último → muestra empty state
```

---

## 3. Estructura de archivos

```
apps/web/
├── contexts/
│   └── favorites-context.tsx          ← Context + Provider + hook
├── components/
│   └── favorites/
│       ├── favorite-button.tsx        ← Botón ♡ toggle (product cards)
│       └── favorites-sheet.tsx        ← Sheet lateral (header)
├── app/
│   └── favoritos/
│       ├── page.tsx                   ← Página completa de favoritos
│       ├── loading.tsx                ← Skeleton loading
│       └── error.tsx                  ← Error boundary
├── lib/
│   ├── routes.ts                      ← + favoritos: "/favoritos"
│   └── storage.ts                     ← (opcional) helper localStorage genérico
└── components/
    └── site-header.tsx                ← Modificar: conectar ♡ a FavoritesSheet
```

---

## 4. Contexto de favoritos — `favorites-context.tsx`

```tsx
// apps/web/contexts/favorites-context.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import { products, type Product } from "@/data/products";

const STORAGE_KEY = "dydalo-favs";

function loadFavorites(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const ids: number[] = JSON.parse(raw);
    return new Set(ids.filter((id) => typeof id === "number"));
  } catch {
    return new Set();
  }
}

function saveFavorites(ids: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // localStorage lleno o no disponible — ignorar silenciosamente
  }
}

type FavoritesContextValue = {
  favorites: Product[];
  favoriteIds: Set<number>;
  favoritesCount: number;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (productId: number) => void;
  clearAll: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(loadFavorites);

  useEffect(() => {
    saveFavorites(favoriteIds);
  }, [favoriteIds]);

  const toggleFavorite = useCallback((productId: number) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setFavoriteIds(new Set());
  }, []);

  const isFavorite = useCallback(
    (productId: number) => favoriteIds.has(productId),
    [favoriteIds],
  );

  const favoritesCount = favoriteIds.size;

  const favorites = useMemo(
    () => products.filter((p) => favoriteIds.has(p.id)),
    [favoriteIds],
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteIds,
        favoritesCount,
        isFavorite,
        toggleFavorite,
        clearAll,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
```

### Decisiones de diseño

| Decisión | Razón |
|---|---|
| `Set<number>` como estado | Búsqueda O(1) vs O(n) de array. Inmutable al actualizar (crea nuevo Set). |
| `useEffect` para localStorage | Sincronización reactiva. Solo se escribe cuando `favoriteIds` cambia. |
| `loadFavorites()` en `useState` inicial | Carga lazy, solo en cliente. SSR-safe por el guard `typeof window`. |
| `saveFavorites` con try/catch | localStorage puede fallar (incógnito en Safari, cuota llena). Falla silenciosamente. |
| `favorites` derivado con `useMemo` | Evita re-filtrar el array completo en cada render. Solo cuando cambia `favoriteIds`. |
| Sin dependencias externas | Solo React. Cero librerías adicionales. |

---

## 5. Botón de favorito — `favorite-button.tsx`

```tsx
// apps/web/components/favorites/favorite-button.tsx
"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "@/contexts/favorites-context";
import { Button } from "@/components/ui/button";
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
    e.preventDefault(); // Evita navegación si está dentro de un Link
    e.stopPropagation();
    toggleFavorite(productId);
    toast(
      favorited
        ? `${productName} eliminado de favoritos`
        : `${productName} añadido a favoritos`,
    );
  }

  const cardStyles =
    "absolute right-3 top-3 z-10 size-9 rounded-full bg-background/80 backdrop-blur-md shadow-sm";
  const inlineStyles = "";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={
        favorited
          ? `Quitar ${productName} de favoritos`
          : `Añadir ${productName} a favoritos`
      }
      className={cn(
        variant === "card" && cardStyles,
        variant === "inline" && inlineStyles,
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-all",
          favorited && "fill-red-500 text-red-500",
        )}
      />
    </Button>
  );
}
```

### Variantes del botón

| Variante | Uso | Estilo |
|---|---|---|
| `card` | Product cards en grid | Absoluto, esquina superior derecha, fondo glass |
| `detail` | Sheet de detalle de producto | Ícono junto al precio |
| `inline` | Fila en sheet/página de favoritos | Sin posición absoluta |

### Comportamiento

- `e.preventDefault()` + `stopPropagation()` — evita que el click en el corazón navegue al link padre (crítico para cards que son `<Link>`)
- `toast()` de sonner da feedback inmediato
- `aria-label` dinámico describe la acción real según estado

---

## 6. Sheet lateral — `favorites-sheet.tsx`

```tsx
// apps/web/components/favorites/favorites-sheet.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useFavorites } from "@/contexts/favorites-context";
import { useCart } from "@/contexts/cart-context";
import { formatPrice } from "@/lib/format";
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
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { ROUTES } from "@/lib/routes";

interface FavoritesSheetProps {
  trigger: React.ReactNode;
}

export function FavoritesSheet({ trigger }: FavoritesSheetProps) {
  const { favorites, favoritesCount, clearAll } = useFavorites();
  const { updateQuantity } = useCart();
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="flex w-full flex-col border-border bg-background p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-6 text-left">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-accent">
            Tu wishlist
          </p>
          <SheetTitle className="text-3xl font-bold tracking-[-0.05em]">
            FAVORITOS
          </SheetTitle>
          <SheetDescription>
            {favoritesCount === 0
              ? "Aún no has guardado ningún producto."
              : `${favoritesCount} producto${favoritesCount > 1 ? "s" : ""} guardado${favoritesCount > 1 ? "s" : ""}`}
          </SheetDescription>
        </SheetHeader>

        {favorites.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <Heart
              className="mb-5 size-10 text-muted-foreground"
              strokeWidth={1.25}
            />
            <p className="text-xl font-bold">NO HAY FAVORITOS</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
              Guarda los productos que te gustan tocando el corazón en cada
              pieza.
            </p>
            <SheetClose asChild>
              <Button variant="outline" className="mt-6" asChild>
                <Link href={ROUTES.catalogo}>EXPLORAR CATÁLOGO</Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {favorites.map((product) => (
                <article
                  key={product.id}
                  className="flex gap-4 border-b border-border py-5"
                >
                  <Link
                    href={ROUTES.catalogoCategory(product.category)}
                    className="shrink-0"
                  >
                    <Image
                      src={
                        brokenImages.has(product.id)
                          ? "/images/dydalo-hero.jpg"
                          : product.image
                      }
                      alt={product.name}
                      width={96}
                      height={96}
                      sizes="96px"
                      onError={() =>
                        setBrokenImages((prev) =>
                          new Set(prev).add(product.id),
                        )
                      }
                      className="size-24 object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <p className="text-[9px] font-bold tracking-[0.18em] text-accent">
                        {product.label}
                      </p>
                      <h3 className="mt-1 truncate text-sm font-bold uppercase">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <FavoriteButton
                        productId={product.id}
                        productName={product.name}
                        variant="inline"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Añadir ${product.name} a la bolsa`}
                        onClick={() => updateQuantity(product.id, 1)}
                      >
                        <ShoppingBag className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {favoritesCount > 0 && (
              <div className="border-t border-border px-6 py-4">
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="flex-1" asChild>
                    <SheetClose asChild>
                      <Link href={ROUTES.favoritos}>VER TODOS</Link>
                    </SheetClose>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      clearAll();
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="ml-1">Vaciar</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

### Características del Sheet

| Funcionalidad | Detalle |
|---|---|
| **Empty state** | Corazón grande + mensaje + botón "EXPLORAR CATÁLOGO" |
| **Lista de productos** | Imagen + label + nombre + precio + botón quitar + añadir a bolsa |
| **Añadir a bolsa** | Botón ShoppingBag que llama a `updateQuantity(product.id, 1)` del cart context |
| **Imagen fallback** | Si la imagen rompe, muestra `/images/dydalo-hero.jpg` (mismo patrón que carrito) |
| **Footer** | "VER TODOS" → navega a `/favoritos`. "Vaciar" → `clearAll()` |
| **SheetClose** | Links internos cierran el Sheet automáticamente |

---

## 7. Página de favoritos — `/favoritos`

### 7.1 Página principal

```tsx
// apps/web/app/favoritos/page.tsx
import type { Metadata } from "next";
import { FavoritesPageClient } from "./favorites-page-client";

export const metadata: Metadata = {
  title: "Favoritos",
};

export default function FavoritosPage() {
  return <FavoritesPageClient />;
}
```

### 7.2 Cliente (necesita el contexto)

```tsx
// apps/web/app/favoritos/favorites-page-client.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useFavorites } from "@/contexts/favorites-context";
import { useCart } from "@/contexts/cart-context";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { ROUTES } from "@/lib/routes";

export function FavoritesPageClient() {
  const { favorites, favoritesCount, clearAll } = useFavorites();
  const { updateQuantity } = useCart();
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

  if (favorites.length === 0) {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 pt-24 text-center">
        <Heart
          className="mb-5 size-16 text-muted-foreground"
          strokeWidth={1}
        />
        <h1 className="text-2xl font-bold tracking-[-0.03em]">FAVORITOS</h1>
        <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
          No tienes productos guardados. Explora el catálogo y guarda los que te gusten tocando el corazón.
        </p>
        <Button variant="outline" className="mt-6" asChild>
          <Link href={ROUTES.catalogo}>EXPLORAR CATÁLOGO</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pt-28 pb-16 md:px-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.03em]">FAVORITOS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {favoritesCount} producto{favoritesCount > 1 ? "s" : ""} guardado{favoritesCount > 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-destructive"
          onClick={clearAll}
        >
          <Trash2 className="size-3.5" />
          <span className="ml-1">Vaciar todo</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favorites.map((product) => (
          <article key={product.id} className="group relative">
            <Link
              href={ROUTES.catalogoCategory(product.category)}
              className="product-glass relative block aspect-square w-full overflow-hidden"
            >
              <span className="absolute left-4 top-4 z-10 bg-background/80 px-3 py-2 text-[9px] font-bold tracking-[0.2em] backdrop-blur-md">
                {product.label}
              </span>
              <FavoriteButton
                productId={product.id}
                productName={product.name}
                variant="card"
              />
              <Image
                src={
                  brokenImages.has(product.id)
                    ? "/images/dydalo-hero.jpg"
                    : product.image
                }
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                onError={() =>
                  setBrokenImages((prev) => new Set(prev).add(product.id))
                }
              />
            </Link>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold uppercase tracking-tight">
                  {product.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {product.type}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Añadir ${product.name} a la bolsa`}
                  onClick={() => updateQuantity(product.id, 1)}
                >
                  <ShoppingBag className="size-4" />
                </Button>
                <p className="text-sm font-semibold">
                  {formatPrice(product.price)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
```

### 7.3 Loading skeleton

```tsx
// apps/web/app/favoritos/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function FavoritosLoading() {
  return (
    <main className="mx-auto max-w-6xl px-5 pt-28 pb-16 md:px-10">
      <Skeleton className="mb-8 h-10 w-48" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </main>
  );
}
```

### 7.4 Error boundary

```tsx
// apps/web/app/favoritos/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function FavoritosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 pt-24 text-center">
      <h2 className="text-xl font-bold">Algo salió mal</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        No pudimos cargar tus favoritos.
      </p>
      <Button variant="outline" className="mt-4" onClick={reset}>
        Reintentar
      </Button>
    </main>
  );
}
```

---

## 8. Integración en el header

### 8.1 Desktop — Reemplazar botón Heart placeholder

En `site-header.tsx`, cambiar:

```tsx
// Antes:
<Button variant="ghost" size="icon" aria-label="Ver favoritos" className="hidden lg:inline-flex">
  <Heart />
</Button>

// Después:
import { FavoritesSheet } from "@/components/favorites/favorites-sheet";
// ...
<FavoritesSheet
  trigger={
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Ver favoritos con ${favoritesCount} productos`}
      className="relative"
    >
      <Heart />
      {favoritesCount > 0 && (
        <span className="absolute -right-1 -top-1 grid size-4 place-items-center bg-accent text-[9px] font-bold text-accent-foreground">
          {favoritesCount}
        </span>
      )}
    </Button>
  }
/>
```

### 8.2 Mobile — Reemplazar botón FAVORITOS en menú hamburguesa

```tsx
// Antes:
<SheetClose asChild>
  <button className="flex w-full items-center gap-3 ...">
    <Heart className="size-4" />
    FAVORITOS
  </button>
</SheetClose>

// Después — cerrar el menú móvil y abrir el sheet de favoritos:
// Requiere un estado compartido o un enfoque diferente.
// Opción A: Link a /favoritos (más simple)
<SheetClose asChild>
  <Link
    href={ROUTES.favoritos}
    className="flex w-full items-center gap-3 ..."
  >
    <Heart className="size-4" />
    FAVORITOS
  </Link>
</SheetClose>

// Opción B: Abrir el Sheet de favoritos desde el menú móvil
// (requiere state lifting o un trigger programático)
```

> **Recomendación:** Usar Opción A (Link a `/favoritos`) para móvil. Es más simple, no requiere coordinar dos Sheets anidados, y la página de favoritos ofrece la misma funcionalidad.

---

## 9. Integración en product cards

### 9.1 En `catalog-grid.tsx`

Añadir `<FavoriteButton>` en cada card. El punto de inserción es dentro del `<Link>` o como hermano:

```tsx
// Dentro del <article> del catalog-grid, después del Link de la imagen:
<FavoriteButton
  productId={product.id}
  productName={product.name}
  variant="card"
/>
```

El botón se posiciona `absolute right-3 top-3` sobre la imagen, con efecto glass.

### 9.2 En la home page (`app/page.tsx`)

Similar integración en los featured products. El `<FavoriteButton variant="card" />` se coloca dentro del contenedor de la imagen.

---

## 10. Rutas y navegación

### 10.1 Agregar a `ROUTES`

```ts
// apps/web/lib/routes.ts
export const ROUTES = {
  // ... existentes
  favoritos: "/favoritos",
} as const;
```

### 10.2 Árbol de navegación actualizado

```
Header
├── LEFT
│   ├── LO ULTIMO
│   ├── CATALOGO DYDALO ▼
│   ├── LOOKBOOK
│   └── LA MARCA ▼
├── CENTER → Logo
└── RIGHT
    ├── 🔍 Buscar       → (placeholder)
    ├── ♡ Favoritos     → Sheet lateral + badge count  ← NUEVO
    ├── 👤 Cuenta       → /login (UserButton)
    ├── 🌙 Tema
    └── 🛒 Bolsa        → Sheet carrito + badge count

Menú móvil
├── LO ULTIMO
├── CATALOGO DYDALO ▼
├── LOOKBOOK
├── LA MARCA ▼
├── 🔍 BUSCAR
├── ♡ FAVORITOS         → /favoritos          ← NUEVO (Link)
└── 👤 MI CUENTA        → /login
```

---

## 11. Persistencia con localStorage

### Estrategia

| Capa | Responsabilidad |
|---|---|
| **Carga inicial** | `loadFavorites()` en `useState(() => loadFavorites())`. Se ejecuta una vez al montar. |
| **Escritura** | `useEffect` observa `favoriteIds`. Cada cambio dispara `saveFavorites()`. |
| **Clave** | `"dydalo-favs"` — prefijada con la marca para evitar colisiones. |
| **Formato** | `number[]` serializado con `JSON.stringify`. Al leer, se filtra por `typeof === "number"` para sanitizar datos corruptos. |
| **Cuota** | try/catch en `saveFavorites`. Si falla (Safari incógnito, storage lleno), los favoritos siguen funcionando en memoria. |
| **SSR** | `typeof window === "undefined"` retorna `Set()` vacío. No hay flash de contenido. |

### ¿Por qué no `useSyncExternalStore`?

Para este caso simple (un solo suscriptor, sin sincronización entre tabs), `useState` + `useEffect` es suficiente. Si en el futuro se necesita sincronización entre pestañas, se puede migrar a `useSyncExternalStore` o escuchar el evento `storage`.

---

## 12. Mejores prácticas aplicadas

### 12.1 Principio de responsabilidad única

| Componente | Responsabilidad |
|---|---|
| `favorites-context.tsx` | Estado + lógica de negocio + persistencia |
| `favorite-button.tsx` | UI del toggle + feedback toast |
| `favorites-sheet.tsx` | UI del panel lateral |
| `favoritos/page.tsx` | UI de la página completa |

### 12.2 DRY — Sin duplicación

- `FavoriteButton` se reutiliza en cards, sheet y página de favoritos
- `formatPrice` (existente) para todos los precios
- `products` (existente) como fuente única de datos de producto
- El patrón de `SheetContent` con header, empty state y lista es idéntico al carrito

### 12.3 Performance

| Técnica | Aplicación |
|---|---|
| `useMemo` | `favorites` derivado solo se recalcula cuando `favoriteIds` cambia |
| `useCallback` | `toggleFavorite`, `isFavorite`, `clearAll` son referencias estables |
| `Set` para lookups | `isFavorite(id)` es O(1), no O(n) |
| `e.preventDefault()` | Evita navegaciones innecesarias en el toggle |
| `next/image` | Optimización de imágenes en Sheet y página |

### 12.4 Accesibilidad

| Elemento | Implementación |
|---|---|
| `aria-label` dinámico | "Añadir X a favoritos" / "Quitar X de favoritos" |
| Contraste | Corazón rojo con fill sobre fondo glass (contraste suficiente) |
| Teclado | `Button` nativo — Enter/Space activan el toggle |
| Badge | `<span>` con texto descriptivo en el `aria-label` del botón padre |
| Estados vacíos | Mensajes claros con acción recomendada (link al catálogo) |

### 12.5 UX

- **Feedback inmediato:** Toast al añadir/quitar de favoritos
- **Sincronización visual:** Badge en header se actualiza al instante
- **Sin scroll jump:** El Sheet y la página mantienen posición de scroll
- **Deshacer implícito:** Toggle — el mismo botón añade y quita
- **Confirmación en destructivas:** "Vaciar todo" requiere confirmación con `clearAll()` — sin confirm dialog para no saturar
- **Imagen fallback:** Si la imagen del producto rompe, muestra hero por defecto

---

## 13. Estados y edge cases

| Estado | Comportamiento |
|---|---|
| **0 favoritos** | Empty state: corazón grande + mensaje + CTA al catálogo |
| **1 favorito** | Muestra "1 producto guardado" (singular) |
| **N favoritos** | Muestra "N productos guardados" (plural) |
| **Producto sin stock** | El favorito se mantiene. Stock se maneja en checkout, no en wishlist. |
| **Producto eliminado del catálogo** | `products` es un array estático. Si se migra a BD, filtrar IDs huérfanos en `loadFavorites()`. |
| **localStorage lleno** | `saveFavorites` falla silenciosamente. Favoritos siguen en memoria. |
| **localStorage corrupto** | `JSON.parse` catchea error y retorna `Set()` vacío. |
| **SSR / sin window** | `loadFavorites()` retorna `Set()` vacío. El `useEffect` carga los datos reales en el cliente. |
| **Doble toggle rápido** | `setFavoriteIds` con callback funcional — siempre opera sobre el estado más reciente. |
| **Imagen rota en favorito** | Fallback a `/images/dydalo-hero.jpg` (mismo patrón que carrito). |

---

## 14. Extensibilidad futura

### 14.1 Sincronización con backend

Cuando exista API de usuarios:
- Al hacer login, mergear favoritos locales con los del servidor
- `useEffect` que escuche cambios de auth y sincronice
- Endpoint `PUT /api/favorites` con array de IDs

### 14.2 Sincronización entre tabs

```ts
useEffect(() => {
  function handleStorageChange(e: StorageEvent) {
    if (e.key === STORAGE_KEY && e.newValue) {
      setFavoriteIds(new Set(JSON.parse(e.newValue)));
    }
  }
  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}, []);
```

### 14.3 Favoritos compartidos

- Generar link único con los IDs: `/favoritos?ids=1,5,23`
- Botón "Compartir wishlist" que copia el link al portapapeles
- Página renderiza productos desde query params

### 14.4 Notificaciones de precio

- "Avísame cuando baje de precio" en productos favoritos
- Requiere backend + email

### 14.5 Migración a `useSyncExternalStore`

Si se requiere reactividad entre tabs sin polling:
```ts
const favoriteStore = {
  subscribe: (cb: () => void) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); },
  getSnapshot: () => loadFavorites(),
};
const favoriteIds = useSyncExternalStore(favoriteStore.subscribe, favoriteStore.getSnapshot);
```

---

## 15. Checklist de implementación

### Fase 1 — Contexto y ruta

- [ ] Agregar `favoritos: "/favoritos"` a `lib/routes.ts`
- [ ] Crear `contexts/favorites-context.tsx` (Context + Provider + hook)
- [ ] Envolver la app con `<FavoritesProvider>` en `app/layout.tsx`

### Fase 2 — Componentes

- [ ] Crear `components/favorites/favorite-button.tsx`
- [ ] Crear `components/favorites/favorites-sheet.tsx`

### Fase 3 — Página de favoritos

- [ ] Crear `app/favoritos/page.tsx`
- [ ] Crear `app/favoritos/favorites-page-client.tsx`
- [ ] Crear `app/favoritos/loading.tsx`
- [ ] Crear `app/favoritos/error.tsx`

### Fase 4 — Integración en header

- [ ] Desktop: Reemplazar botón Heart placeholder por `FavoritesSheet` con badge
- [ ] Mobile: Cambiar botón FAVORITOS por Link a `/favoritos`

### Fase 5 — Integración en product cards

- [ ] Añadir `FavoriteButton variant="card"` en `catalog-grid.tsx`
- [ ] Añadir `FavoriteButton variant="card"` en featured products de `page.tsx`

### Fase 6 — Verificación

- [ ] Build de Next.js sin errores
- [ ] TypeScript sin errores
- [ ] Verificar toggle en catálogo → badge en header se actualiza
- [ ] Verificar Sheet lateral: empty state, lista, añadir a bolsa, vaciar
- [ ] Verificar página `/favoritos`: empty state, grid, añadir a bolsa
- [ ] Verificar persistencia: refrescar página → favoritos se mantienen
- [ ] Verificar responsive: mobile, tablet, desktop
- [ ] Verificar dark mode: corazones, badge, Sheet, página
- [ ] Verificar accesibilidad: navegación por teclado, aria-labels, lectores de pantalla
