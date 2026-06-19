# Implementación del Buscador — Documento Técnico

> **Versión:** 1.0
> **Fecha:** 18 Jun 2026
> **Stack:** cmdk + shadcn/ui Command + Next.js 16
> **Objetivo:** Implementar búsqueda global de productos con CommandDialog, resultados agrupados, navegación directa, atajo de teclado y accesibilidad completa.

---

## Tabla de contenidos

1. [Diagnóstico del estado actual](#1-diagnóstico-del-estado-actual)
2. [Stack y herramientas disponibles](#2-stack-y-herramientas-disponibles)
3. [Arquitectura general](#3-arquitectura-general)
4. [Índice de búsqueda — `search-index.ts`](#4-índice-de-búsqueda)
5. [Componente CommandSearch — `command-search.tsx`](#5-componente-commandsearch)
6. [Integración en el header](#6-integración-en-el-header)
7. [Lógica de búsqueda y ranking](#7-lógica-de-búsqueda-y-ranking)
8. [Atajo de teclado global](#8-atajo-de-teclado-global)
9. [Mejores prácticas aplicadas](#9-mejores-prácticas-aplicadas)
10. [Estados y edge cases](#10-estados-y-edge-cases)
11. [Extensibilidad futura](#11-extensibilidad-futura)
12. [Checklist de implementación](#12-checklist-de-implementación)

---

## 1. Diagnóstico del estado actual

| Componente | Estado |
|---|---|
| `cmdk` | Instalado (`^1.1.1` en `package.json`) |
| `CommandDialog` (shadcn/ui) | Componente completo en `components/ui/command.tsx` (143 líneas) |
| Botón Search en header desktop | Placeholder sin acción (`className="hidden lg:inline-flex"`) |
| Botón BUSCAR en menú móvil | Placeholder, solo cierra el Sheet |
| Componente de búsqueda | No existe |
| Índice de búsqueda | No existe |
| Resultados visuales | No existen |

### Lo que YA tienes (no reinventar)

| Recurso | Ubicación | Cómo se reutiliza |
|---|---|---|
| `CommandDialog` | `components/ui/command.tsx` | Modal con `Command` + `CommandInput` + `CommandList` + `CommandEmpty` + `CommandGroup` + `CommandItem` |
| `CommandShortcut` | `components/ui/command.tsx` | Badge de atajo (⌘K) |
| `Product` type | `data/products.ts:7-17` | `id`, `name`, `label`, `type`, `category`, `price`, `image` |
| `catalogCategories` | `data/products.ts:141-152` | Mapeo `slug → name` para nombres de categoría legibles |
| `formatPrice` | `lib/format.ts` | Para mostrar precios en los resultados |
| `ROUTES` | `lib/routes.ts` | `catalogoCategory(slug)` para navegar desde resultados |
| `Search` icon | `lucide-react` (ya importado) | Icono de lupa |
| `Button` | `components/ui/button.tsx` | `variant="ghost" size="icon"` para triggers |

---

## 2. Stack y herramientas disponibles

| Herramienta | Versión | Uso |
|---|---|---|
| `cmdk` | 1.1.1 | Motor de command palette: input, lista virtualizada, navegación por teclado |
| `@radix-ui/react-dialog` | (dependencia de shadcn) | Modal accesible que envuelve el Command |
| `lucide-react` | 1.18.0 | Íconos: `Search`, `CornerDownLeft` |
| `next/image` | 16 | Imágenes de producto en resultados |

**No se necesitan dependencias nuevas.**

---

## 3. Arquitectura general

```
┌──────────────────────────────────────────────────────┐
│  Search button (header desktop + mobile menu)        │
│  onClick → setIsOpen(true)                           │
│  Keyboard shortcut: ⌘K / Ctrl+K                     │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│  CommandSearch (Dialog + Command)                    │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  CommandInput                                  │  │
│  │  "Buscar productos..."                         │  │
│  │  autoFocus, placeholder                        │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │  CommandList                                   │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │  CommandEmpty                            │  │  │
│  │  │  "No se encontraron productos para X"    │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │  CommandGroup heading="POLOS (5)"        │  │  │
│  │  │  ├─ CommandItem → Heavy Cotton Polo $89 │  │  │
│  │  │  ├─ CommandItem → Signature Stripe $104 │  │  │
│  │  │  └─ ...                                  │  │  │
│  │  ├──────────────────────────────────────────┤  │  │
│  │  │  CommandGroup heading="HOODIES (3)"      │  │  │
│  │  │  ├─ CommandItem → Shadow Oversized $128 │  │  │
│  │  │  └─ ...                                  │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
           router.push(ROUTES.catalogoCategory(category))
```

### Flujo de búsqueda

```
1. Usuario presiona ⌘K o click en 🔍
2. CommandDialog se abre con foco en el input
3. Usuario escribe "polo"
4. searchProducts("polo") filtra y rankea
5. Resultados se agrupan por categoría
6. Usuario navega con ↑↓ o sigue escribiendo
7. Enter o click → cierra dialog, navega a /catalogo/{categoria}
```

---

## 4. Índice de búsqueda — `search-index.ts`

```ts
// apps/web/lib/search-index.ts
import { products, catalogCategories, type Product } from "@/data/products";

export type SearchResult = Product & {
  matchScore: number;
  matchReason: string[];
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Quita acentos
}

function getCategoryName(slug: string): string {
  return catalogCategories.find((c) => c.slug === slug)?.name ?? slug;
}

export function searchProducts(query: string): SearchResult[] {
  if (!query || query.trim().length < 1) return [];

  const q = normalize(query.trim());
  const tokens = q.split(/\s+/);

  const results: SearchResult[] = [];

  for (const product of products) {
    const searchableFields = [
      normalize(product.name),
      normalize(product.label),
      normalize(product.type),
      normalize(getCategoryName(product.category)),
    ];

    let score = 0;
    const reasons: string[] = [];

    for (const token of tokens) {
      // Coincidencia exacta en nombre → mayor score
      if (normalize(product.name).includes(token)) {
        score += 10;
        if (normalize(product.name) === token) score += 20;
        if (reasons.length === 0) reasons.push("nombre");
      }

      // Coincidencia en label
      if (normalize(product.label).includes(token)) {
        score += 5;
        if (!reasons.includes("label")) reasons.push("label");
      }

      // Coincidencia en tipo (Ropa, Calzado, Accesorios, Bling)
      if (normalize(product.type).includes(token)) {
        score += 4;
        if (!reasons.includes("tipo")) reasons.push("tipo");
      }

      // Coincidencia en categoría
      if (normalize(getCategoryName(product.category)).includes(token)) {
        score += 3;
        if (!reasons.includes("categoría")) reasons.push("categoría");
      }

      // Coincidencia parcial (character-level)
      if (score === 0) {
        const fields = searchableFields.join(" ");
        if (fields.includes(token)) {
          score += 2;
          reasons.push("general");
        }
      }
    }

    if (score > 0) {
      results.push({ ...product, matchScore: score, matchReason: reasons });
    }
  }

  return results
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 15); // Máximo 15 resultados para no saturar
}

export function groupResultsByCategory(
  results: SearchResult[],
): Map<string, SearchResult[]> {
  const groups = new Map<string, SearchResult[]>();
  for (const r of results) {
    const catName = getCategoryName(r.category);
    const existing = groups.get(catName) ?? [];
    existing.push(r);
    groups.set(catName, existing);
  }
  return groups;
}
```

### Decisiones de diseño

| Decisión | Razón |
|---|---|
| **Normalización con NFD** | "polos" == "polós" — insensitive a acentos |
| **Búsqueda por tokens** | "polo negro" busca "polo" Y "negro" por separado |
| **Score multinivel** | Nombre exacto (30pts) > nombre parcial (10pts) > label (5pts) > tipo (4pts) > categoría (3pts) > general (2pts) |
| **Límite de 15 resultados** | Evita scroll infinito en el CommandList |
| **Agrupación por categoría** | El usuario ve contexto. "POLOS (5)" agrupa visualmente |
| **Sin dependencias** | Solo `products` y `catalogCategories` — ya importados |

---

## 5. Componente CommandSearch — `command-search.tsx`

```tsx
// apps/web/components/search/command-search.tsx
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, CornerDownLeft } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  searchProducts,
  groupResultsByCategory,
} from "@/lib/search-index";
import { formatPrice } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = searchProducts(query);
  const grouped = groupResultsByCategory(results);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    [],
  );

  // Atajo de teclado global: ⌘K / Ctrl+K
  useKeyboardShortcut("k", () => setOpen((prev) => !prev));

  return (
    <>
      {/* Trigger desktop */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Buscar productos"
        className="hidden lg:inline-flex"
        onClick={() => setOpen(true)}
      >
        <Search />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar productos..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query && results.length === 0 && (
            <CommandEmpty>
              No se encontraron productos para{" "}
              <span className="font-bold">&quot;{query}&quot;</span>
            </CommandEmpty>
          )}

          {!query && (
            <CommandEmpty className="flex flex-col items-center gap-3 py-8">
              <Search className="size-8 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">
                Escribe para buscar productos
              </p>
            </CommandEmpty>
          )}

          {[...grouped.entries()].map(([category, items]) => (
            <CommandGroup
              key={category}
              heading={`${category} (${items.length})`}
            >
              {items.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.label} ${category}`}
                  onSelect={() =>
                    runCommand(() =>
                      router.push(
                        ROUTES.catalogoCategory(product.category),
                      ),
                    )
                  }
                  className="flex items-center gap-3"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="size-10 shrink-0 rounded-sm object-cover"
                  />
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold uppercase">
                        {product.name}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {product.label} · {product.type}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs font-semibold text-muted-foreground">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

function useKeyboardShortcut(
  key: string,
  callback: () => void,
) {
  if (typeof window === "undefined") return;

  import("react").then(({ useEffect }) => {
    useEffect(() => {
      function handleKeyDown(e: KeyboardEvent) {
        if (
          e.key.toLowerCase() === key &&
          (e.metaKey || e.ctrlKey) &&
          !e.repeat
        ) {
          e.preventDefault();
          callback();
        }
      }
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);
  });
}
```

> **Nota sobre el hook de atajo:** El `useKeyboardShortcut` se implementa realmente así:

```ts
"use client";

import { useEffect } from "react";

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        (e.metaKey || e.ctrlKey) &&
        !e.repeat
      ) {
        e.preventDefault();
        callback();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [key, callback]);
}
```

---

## 6. Integración en el header

### 6.1 Desktop — Reemplazar botón Search placeholder

En `site-header.tsx`:

```tsx
// Antes:
<Button variant="ghost" size="icon" aria-label="Buscar productos" className="hidden lg:inline-flex">
  <Search />
</Button>

// Después:
import { CommandSearch } from "@/components/search/command-search";
// ...
<CommandSearch />
```

> **El `CommandSearch` ya incluye su propio trigger desktop.** Solo hay que reemplazar el botón placeholder entero por `<CommandSearch />`.

### 6.2 Mobile — Conectar el botón BUSCAR del menú hamburguesa

El botón BUSCAR en el menú móvil actualmente solo cierra el Sheet sin abrir la búsqueda. Para conectarlo:

```tsx
// En site-header.tsx, el componente CommandSearch expone el estado `open`
// Opción A: Pasar una prop `triggerRef` o usar un callback
// Opción B (recomendada): El CommandSearch se abre también con ⌘K en mobile,
// y el botón BUSCAR navega a una página de búsqueda dedicada

// Opción A — Modificar CommandSearch para exponer setOpen:
// En CommandSearch, añadir:
export function CommandSearch({ triggerRef }: { triggerRef?: React.RefObject<() => void> }) {
  // ...
  if (triggerRef) {
    triggerRef.current = () => setOpen(true);
  }
}

// Luego en site-header.tsx:
const searchTriggerRef = useRef<() => void>(null);

<SheetClose asChild>
  <button
    onClick={() => {
      searchTriggerRef.current?.();
    }}
    ...
  >
    <Search className="size-4" />
    BUSCAR
  </button>
</SheetClose>
```

> **Recomendación:** Usar Opción B — el botón BUSCAR en el menú móvil dispara exactamente el mismo `CommandSearch`. Se puede lograr con un callback ref o un pequeño estado global.

---

## 7. Lógica de búsqueda y ranking

### Algoritmo de scoring

| Coincidencia | Peso | Ejemplo |
|---|---|---|
| Nombre exacto | 30 | "Heavy Cotton Polo" == "heavy cotton polo" |
| Nombre parcial | 10 | "Heavy Cotton Polo" contiene "cotton" |
| Label | 5 | "SIGNATURE" contiene "sign" |
| Tipo | 4 | "Ropa" contiene "rop" |
| Categoría | 3 | "POLOS" contiene "polo" |
| General (substring en cualquier campo) | 2 | "algodón" aparece en el nombre |

### Ordenamiento

1. Score descendente
2. Máximo 15 resultados (truncado después de ordenar)
3. Agrupado por categoría en el CommandList

### Normalización

La función `normalize()`:
1. Convierte a minúsculas
2. Descompone caracteres Unicode (NFD): `"á"` → `"a" + "◌́"`
3. Elimina marcas diacríticas: `"polós"` → `"polos"`
4. Preserva espacios y guiones

---

## 8. Atajo de teclado global

```ts
// ⌘K (Mac) / Ctrl+K (Windows/Linux)
// Abre/cierra el buscador desde cualquier página
```

| Sistema | Tecla |
|---|---|
| macOS | ⌘ + K |
| Windows/Linux | Ctrl + K |

El listener se registra en `useEffect` dentro de `CommandSearch` y se limpia al desmontar. Usa `e.preventDefault()` para evitar que el navegador capture el atajo.

---

## 9. Mejores prácticas aplicadas

### 9.1 Performance

| Técnica | Detalle |
|---|---|
| **Búsqueda síncrona** | 100 productos caben en memoria. Sin debounce necesario — el filtrado es instantáneo. |
| **Límite de resultados** | Máximo 15. Evita DOM inflado en el CommandList. |
| **Sin re-renders innecesarios** | `searchProducts()` es una función pura. Solo se ejecuta cuando `query` cambia. |
| **useCallback en runCommand** | Referencia estable para el callback de `onSelect`. |
| **next/image** | Imágenes de 40x40 optimizadas en resultados. |

### 9.2 UX

| Patrón | Implementación |
|---|---|
| **Auto-foco** | El input recibe foco automáticamente al abrir el dialog (`autoFocus` nativo de cmdk). |
| **Navegación por teclado** | ↑↓ para moverse entre resultados, Enter para seleccionar, Escape para cerrar. Nativos de cmdk. |
| **Búsqueda instantánea** | Resultados aparecen al primer carácter. Sin botón "Buscar". |
| **Empty state contextual** | Si no hay query: "Escribe para buscar". Si hay query sin resultados: "No se encontraron productos para X". |
| **Imagen + precio** | Cada resultado muestra thumbnail, nombre, label, tipo y precio. |
| **Agrupación visual** | Resultados agrupados por categoría con heading "POLOS (5)". |

### 9.3 Accesibilidad

| Criterio | Implementación |
|---|---|
| **Dialog role** | `@radix-ui/react-dialog` maneja `role="dialog"`, `aria-modal`, foco atrapado. |
| **Listbox role** | `cmdk` maneja `role="listbox"` en CommandList y `role="option"` en CommandItem. |
| **Anuncios a screen readers** | cmdk anuncia "N results" al escribir. |
| **Teclado completo** | Abrir (⌘K), navegar (↑↓), seleccionar (Enter), cerrar (Escape). |
| **aria-label en trigger** | "Buscar productos" + atajo visual ⌘K. |

### 9.4 Estilo visual

| Elemento | Clases |
|---|---|
| CommandDialog | `sm:max-w-[475px]` — ancho máximo en desktop |
| Thumbnail | `size-10 rounded-sm object-cover` — consistente con el diseño DYDALO |
| Precio | `text-xs font-semibold text-muted-foreground` |
| Nombre | `text-sm font-bold uppercase` |
| Metadata | `text-[10px] text-muted-foreground` |

---

## 10. Estados y edge cases

| Estado | Comportamiento |
|---|---|
| **Query vacío** | Muestra "Escribe para buscar productos" con icono de lupa |
| **Sin resultados** | Muestra "No se encontraron productos para 'X'" |
| **Query de 1 carácter** | Filtra normalmente (sin umbral mínimo — 100 productos es manejable) |
| **Query con espacios** | Se tokeniza: "polo negro" busca "polo" Y "negro" |
| **Caracteres especiales** | `normalize()` elimina acentos. ñ se mantiene (el español lo requiere) |
| **Query muy largo** | Se trunca visualmente en el CommandInput |
| **Click fuera del dialog** | Cierra el dialog (comportamiento nativo de Radix Dialog) |
| **Múltiples aperturas rápidas** | `setOpen` usa callback funcional, sin race conditions |
| **Navegación a categoría** | `router.push` cierra el dialog y navega. La página de categoría ya existe. |
| **Sin categoría definida** | Si un producto tiene `category` que no está en `catalogCategories`, `getCategoryName` devuelve el slug como fallback |

---

## 11. Extensibilidad futura

### 11.1 Búsqueda en servidor

Cuando los productos migren a base de datos:

```ts
// Reemplazar searchProducts() por fetch al API
const results = await fetch(`/api/search?q=${encodeURIComponent(query)}`).then(r => r.json());
```

La UI no cambia. Solo se reemplaza la fuente de datos.

### 11.2 Debounce para búsquedas remotas

```ts
import { useDebouncedCallback } from "use-debounce";

const debouncedSearch = useDebouncedCallback((q: string) => {
  fetchResults(q);
}, 300);
```

### 11.3 Búsqueda por voz / imagen

- Web Speech API para "buscar con voz"
- CLIP embeddings para búsqueda visual (largo plazo)

### 11.4 Historial de búsqueda

```ts
// Guardar últimas 5 búsquedas en localStorage
// Mostrar como sugerencias antes de escribir
const RECENT_KEY = "dydalo-recent-searches";
```

### 11.5 Resultados enriquecidos

- Mostrar badge de "Nuevo" / "Más vendido" en resultados
- Mostrar disponibilidad de tallas
- Mostrar colores disponibles como dots

---

## 12. Checklist de implementación

### Fase 1 — Lógica de búsqueda

- [ ] Crear `lib/search-index.ts` con `searchProducts()` y `groupResultsByCategory()`
- [ ] Probar la función con queries de ejemplo en consola

### Fase 2 — Componente CommandSearch

- [ ] Crear `components/search/command-search.tsx`
- [ ] Integrar `CommandDialog` + `CommandInput` + `CommandList`
- [ ] Implementar resultados agrupados con `CommandGroup` + `CommandItem`
- [ ] Mostrar thumbnail, nombre, label, tipo, precio en cada item
- [ ] Implementar empty states (sin query / sin resultados)
- [ ] Implementar atajo de teclado ⌘K / Ctrl+K

### Fase 3 — Integración en header

- [ ] Desktop: Reemplazar botón Search placeholder por `<CommandSearch />`
- [ ] Mobile: Conectar botón BUSCAR del menú hamburguesa al `CommandSearch`
- [ ] Verificar que el buscador se abre desde ambos triggers

### Fase 4 — Verificación

- [ ] Build de Next.js sin errores
- [ ] TypeScript sin errores
- [ ] Probar búsqueda: escribir "polo" → ver resultados agrupados
- [ ] Probar navegación: seleccionar resultado → navega a `/catalogo/{categoria}`
- [ ] Probar atajo ⌘K / Ctrl+K en desktop
- [ ] Probar vacío: escribir query sin resultados → ver empty state
- [ ] Probar responsive: mobile abre desde menú, desktop desde ícono
- [ ] Verificar accesibilidad: teclado, screen reader, foco atrapado
