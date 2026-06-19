# Deshardcodeo y Tokenización de Estilos — Documento Técnico

> **Versión:** 1.0
> **Fecha:** 18 Jun 2026
> **Stack:** Tailwind CSS v4 + `@utility` + `@theme inline`
> **Objetivo:** Eliminar valores hardcodeados del proyecto, centralizar todos los estilos en `globals.css` como tokens y utilidades reutilizables, y eliminar estilos no utilizados. Aplicar mejores prácticas de design system.

---

## Tabla de contenidos

1. [Diagnóstico del estado actual](#1-diagnóstico-del-estado-actual)
2. [Inventario de hardcodeo detectado](#2-inventario-de-hardcodeo-detectado)
3. [Plan de acción por prioridad](#3-plan-de-acción-por-prioridad)
4. [Fase 1 — CRÍTICO: Tokens de tipografía](#4-fase-1--crítico-tokens-de-tipografía)
5. [Fase 2 — CRÍTICO: Utilidades de layout](#5-fase-2--crítico-utilidades-de-layout)
6. [Fase 3 — ALTO: Token semántico de color `favorite`](#6-fase-3--alto-token-semántico-de-color-favorite)
7. [Fase 4 — ALTO: Utilidades de glass y panel](#7-fase-4--alto-utilidades-de-glass-y-panel)
8. [Fase 5 — MEDIO: Normalizar `section-px` y `page-root`](#8-fase-5--medio-normalizar-section-px-y-page-root)
9. [Fase 6 — BAJO: Utilidades de sección vertical](#9-fase-6--bajo-utilidades-de-sección-vertical)
10. [Fase 7 — BAJO: Eliminar estilos no utilizados](#10-fase-7--bajo-eliminar-estilos-no-utilizados)
11. [Mejores prácticas aplicadas](#11-mejores-prácticas-aplicadas)
12. [Checklist de implementación](#12-checklist-de-implementación)

---

## 1. Diagnóstico del estado actual

### 1.1 Arquitectura CSS actual

El proyecto usa **Tailwind CSS v4** con el plugin `@tailwindcss/postcss`. No existe `tailwind.config.ts`. Toda la personalización se hace en `app/globals.css` (409 líneas) mediante:

- `@theme inline { ... }` — 30 design tokens de color + radio + fuente
- `@utility nombre { ... }` — 18 utilidades personalizadas
- `@layer base { ... }` — Estilos base globales
- `@keyframes` — 2 animaciones (ticker, shimmer)

### 1.2 Lo que YA funciona bien

| Utilidad existente | Uso | Estado |
|---|---|---|
| `section-px` | Padding inline responsive | 30 usos en 12 páginas — excelente adopción |
| `page-root` | Wrapper principal de página | 14 páginas — excelente adopción |
| `product-glass` | Efecto glass-morphism en cards | Consistente |
| `overline` | Tipografía overline | Consistente |
| `heading-label` | Etiquetas de sección | Consistente |
| `footer-link` | Links del footer | Consistente |
| `focus-ring` | Anillo de foco accesible | Consistente |

### 1.3 Lo que NO funciona bien

| Problema | Impacto | Archivos |
|---|---|---|
| 31 `text-[Npx]` hardcodeados | Sin control tipográfico centralizado | 15 archivos |
| 82 `tracking-[Nem]` hardcodeados | Sin escala de letter-spacing | 20+ archivos |
| 21 `tracking-[0.2em]` repetidos | Mismo valor repetido 21 veces | 12 archivos |
| `red-500` sin token semántico | Sin soporte de tema claro/oscuro | 4 archivos |
| `px-5` standalone (sin `section-px`) | Inconsistencia en padding inline | 14 archivos |
| `py-20`, `py-16`, `pt-28` repetidos | Sin semántica de sección vertical | 15+ archivos |
| `bg-background/N` + `backdrop-blur-XL` repetidos | Patrones glass sin componer | 13 ocurrencias |

---

## 2. Inventario de hardcodeo detectado

### 2.1 Tamaños de fuente hardcodeados

| Valor | Ocurrencias | Contexto | Token propuesto |
|---|---|---|---|
| `text-[9px]` | 9 | Labels de producto, badges | `@utility product-label` |
| `text-[10px]` | 21 | Sub-headers, metadata, contadores | `@utility micro-text` |
| `text-[11px]` | 2 | Nav principal | `text-xs` (Tailwind nativo, 12px) |

### 2.2 Tracking / letter-spacing hardcodeado

| Valor | Ocurrencias | Contexto | Token propuesto |
|---|---|---|---|
| `tracking-[0.2em]` | **21** | Micro-labels, sub-headers | `--tracking-wide: 0.2em` |
| `tracking-[-0.03em]` | **12** | Títulos H2, formularios | `--tracking-heading: -0.03em` |
| `tracking-[0.14em]` | 7 | Nav principal | `--tracking-nav: 0.14em` |
| `tracking-[0.12em]` | 8 | Dropdowns, submenús | `--tracking-dropdown: 0.12em` |
| `tracking-[0.22em]` | 8 | Labels de categoría, tagline | `--tracking-label: 0.22em` |
| `tracking-[0.18em]` | 3 | Labels de carrito | `--tracking-cart: 0.18em` |
| `tracking-[-0.05em]` | 3 | Títulos grandes | `--tracking-title: -0.05em` |
| `tracking-[-0.06em]` | 2 | Hero headings | `--tracking-hero: -0.06em` |

### 2.3 Colores sin token semántico

| Color | Ocurrencias | Contexto | Problema |
|---|---|---|---|
| `red-500` | 12 | Favoritos, auth toasts, header | No participa en tema claro/oscuro |
| `shadow-black/10` | 1 | SocialWidget | Color hardcodeado en sombra |

### 2.4 Patrones glass / backdrop repetidos

| Combinación | Ocurrencias | Contexto |
|---|---|---|
| `bg-background/80 backdrop-blur-md` | 5 | Labels de producto en cards |
| `bg-background/95 backdrop-blur-xl` | 3 | Dropdowns, menús |
| `bg-background/85 backdrop-blur-xl` | 1 | Header bar |

### 2.5 Espaciado vertical repetido

| Combinación | Ocurrencias |
|---|---|
| `section-px py-16` | 7 |
| `section-px py-20` | 5 |
| `section-px pt-28 pb-8` | 2 |
| `px-5 pt-28 pb-16 md:px-10` | 2 |

---

## 3. Plan de acción por prioridad

| Fase | Prioridad | Alcance | Archivos a modificar |
|---|---|---|---|
| **1** | CRÍTICO | Tokens de tipografía en `globals.css` | 1 archivo nuevo + sustitución en ~15 archivos |
| **2** | CRÍTICO | Utilidades de layout (`section-lg`, `section-md`, `page-top`) | 1 archivo + ~15 páginas |
| **3** | ALTO | Token `--color-favorite` para rojo semántico | 1 archivo + 4 componentes |
| **4** | ALTO | Utilidades glass (`chip-label`, `popover-panel`) | 1 archivo + ~8 componentes |
| **5** | MEDIO | Normalizar `px-5` → `section-px` en error pages | ~11 error.tsx + cuenta/layout.tsx |
| **6** | BAJO | Escala de tracking como CSS variables | 1 archivo + sustitución en ~20 archivos |
| **7** | BAJO | Auditoría de estilos no utilizados | Eliminación de utilidades muertas |

---

## 4. Fase 1 — CRÍTICO: Tokens de tipografía

### 4.1 Nuevos `@utility` en `globals.css`

```css
/* ── Tipografía de producto ── */
@utility product-label {
  font-size: 0.5625rem;       /* 9px */
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  background: oklch(from var(--background) l c h / 0.8);
  backdrop-filter: blur(12px);
  padding-inline: 0.75rem;
  padding-block: 0.5rem;
}

@utility micro-text {
  font-size: 0.625rem;        /* 10px */
  line-height: 1rem;
  color: var(--muted-foreground);
}
```

### 4.2 Archivos a modificar

**Sustituir `text-[9px] font-bold tracking-[0.2em] bg-background/80 backdrop-blur-md px-3 py-2` por `product-label`:**

| Archivo | Línea | Cambio |
|---|---|---|
| `catalog-grid.tsx` | 132 | Clases del `<span>` label |
| `catalog-grouped.tsx` | 59 | Clases del `<span>` label |
| `page.tsx` | 285 | Clases del `<span>` label en featured products |
| `favorites-page-client.tsx` | 65 | Clases del `<span>` label |
| `site-header.tsx` | 227, 247 | Labels en el carrito |

> **Nota:** Algunos `<span>` label tienen variantes (ej. `left-4 top-4`, `left-2 top-2 sm:left-4 sm:top-4`). Las clases de posicionamiento se mantienen fuera de la utilidad.

**Sustituir `text-[10px] font-bold tracking-[0.2em] text-muted-foreground` por `micro-text font-bold tracking-[0.2em] text-muted-foreground`:**

| Archivo | Contexto |
|---|---|
| `page.tsx` | Sub-headers de secciones, newsletter, footer |
| `site-header.tsx` | Subtotales, envío, redes |
| `blog/page.tsx` | Fechas de posts |
| `blog/[slug]/page.tsx` | Metadata de post |
| `cart-toast.tsx` | Precio en toast |
| `login-form.tsx` | Separador "O" |
| `register-form.tsx` | Separador "O" |
| `command-search.tsx` | Metadata de resultados |

### 4.3 `text-[11px]` → `text-xs`

Los 2 casos de `text-[11px]` se pueden migrar a `text-xs` (12px) de Tailwind nativo, que es más legible y estándar. La diferencia de 1px es imperceptible.

| Archivo | Línea | Cambio |
|---|---|---|
| `header-nav.tsx` | 80 | `text-[11px] tracking-[0.16em]` → `text-xs tracking-[0.16em]` |
| `page.tsx` | 210 | `text-[11px]` → `text-xs` |

---

## 5. Fase 2 — CRÍTICO: Utilidades de layout

### 5.1 Nuevos `@utility` en `globals.css`

```css
/* ── Layout de página ── */
@utility page-top {
  padding-top: 7rem;    /* pt-28 — clear del header fixed */
}

@utility page-bottom {
  padding-bottom: 4rem; /* pb-16 */
}

/* ── Espaciado de sección ── */
@utility section-lg {
  padding-block: 5rem;  /* py-20 */
}

@utility section-md {
  padding-block: 4rem;  /* py-16 */
}

@utility section-sm {
  padding-block: 3rem;  /* py-12 */
}
```

### 5.2 Combinaciones resultantes

| Antes | Después |
|---|---|
| `section-px py-20` | `section-px section-lg` |
| `section-px py-16` | `section-px section-md` |
| `section-px py-12` | `section-px section-sm` |
| `section-px pt-28 pb-8` | `section-px page-top pb-8` |
| `px-5 pt-28 pb-16 md:px-10` | `section-px page-top page-bottom` |

### 5.3 Archivos a modificar (~15 páginas)

- `page.tsx` — 5 secciones
- `catalogo/page.tsx`, `catalogo/[slug]/page.tsx`
- `blog/page.tsx`, `blog/[slug]/page.tsx`
- `lookbook/page.tsx`
- `nuestra-historia/page.tsx`
- `colaboraciones/page.tsx`
- `devoluciones/page.tsx`
- `envios/page.tsx`
- `faq/page.tsx`
- `guia-de-tallas/page.tsx`
- `sobre-nosotros/page.tsx`
- `favorites-page-client.tsx`
- `favoritos/loading.tsx`
- `cuenta/layout.tsx`

---

## 6. Fase 3 — ALTO: Token semántico de color `favorite`

### 6.1 Problema

`red-500` se usa en 12 lugares para representar "favorito" o "auth". No es un token del tema y no cambia entre modo claro/oscuro.

### 6.2 Solución

Agregar en `@theme inline` de `globals.css`:

```css
--color-favorite: oklch(0.637 0.237 25.33);     /* red-500 en oklch */
--color-favorite-foreground: oklch(0.985 0 0);    /* blanco para texto sobre favorite */
```

### 6.3 Sustitución

| Archivo | Antes | Después |
|---|---|---|
| `favorite-button.tsx` | `fill-red-500 text-red-500` | `fill-favorite text-favorite` |
| `favorite-toast.tsx` | `bg-red-500 border-red-500 text-red-500` | `bg-favorite border-favorite text-favorite` |
| `auth-toast.tsx` | `RED = "bg-red-500 border-red-500"` | `FAVORITE = "bg-favorite border-favorite"` |
| `header-nav.tsx` | `border-b-2 border-red-500` | `border-b-2 border-favorite` |

---

## 7. Fase 4 — ALTO: Utilidades de glass y panel

### 7.1 Nuevos `@utility` en `globals.css`

```css
/* ── Componentes glass ── */
@utility chip-label {
  background: oklch(from var(--background) l c h / 0.8);
  backdrop-filter: blur(12px);
}

@utility popover-panel {
  background: oklch(from var(--background) l c h / 0.95);
  backdrop-filter: blur(24px);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
```

### 7.2 Archivos a modificar

| Archivo | Cambio |
|---|---|
| `catalog-grid.tsx` | `product-glass` ya cubre la card; labels usan `chip-label` |
| `catalog-grouped.tsx` | Labels usan `chip-label` |
| `page.tsx` | Labels usan `chip-label` |
| `favorites-page-client.tsx` | Labels usan `chip-label` |
| `favorite-button.tsx` | `bg-background/80 backdrop-blur-md` → `chip-label` |
| `catalog-grid.tsx` (dropdown) | `bg-background/95 backdrop-blur-xl` → `popover-panel` |
| `header-nav.tsx` (dropdowns) | `bg-background/95 backdrop-blur-xl` → `popover-panel` |
| `site-header.tsx` (header) | `bg-background/85 backdrop-blur-xl` → simplificar |

---

## 8. Fase 5 — MEDIO: Normalizar `section-px` y `page-root`

### 8.1 Archivos con `px-5` standalone (~14 archivos)

Todos los `error.tsx` usan `px-5` sin `section-px`. Se debe reemplazar:

```tsx
// Antes
<main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 pt-24 text-center">

// Después
<main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center section-px pt-24 text-center">
```

| Archivos afectados |
|---|
| `app/devoluciones/error.tsx` |
| `app/contacto/error.tsx` |
| `app/sobre-nosotros/error.tsx` |
| `app/envios/error.tsx` |
| `app/favoritos/error.tsx` |
| `app/guia-de-tallas/error.tsx` |
| `app/colaboraciones/error.tsx` |
| `app/faq/error.tsx` |
| `app/lookbook/error.tsx` |
| `app/nuestra-historia/error.tsx` |
| `app/blog/error.tsx` |

### 8.2 `cuenta/layout.tsx`

```tsx
// Antes
<div className="mx-auto max-w-6xl px-5 py-24 md:px-10">

// Después
<div className="mx-auto max-w-6xl section-px py-24">
```

---

## 9. Fase 6 — BAJO: Utilidades de sección vertical

Una vez que `section-lg`, `section-md`, `section-sm` y `page-top` estén definidas, se sustituyen en todas las páginas. Esta fase es puramente mecánica (find & replace por archivo).

---

## 10. Fase 7 — BAJO: Eliminar estilos no utilizados

### 10.1 Utilidades definidas pero sin uso

Se debe auditar cada `@utility` en `globals.css` y verificar que tenga al menos un uso en el código:

| Utilidad | ¿En uso? | Acción |
|---|---|---|
| `asphalt` | Verificar | Si no se usa → eliminar |
| `ticker-track` | Verificar | Si no se usa → eliminar |
| `page-hero` | Verificar | Si no se usa → eliminar |
| `page-hero-heading` | Verificar | Si no se usa → eliminar |
| `hero-description` | Verificar | Si no se usa → eliminar |
| `card-lift` | Verificar | Si no se usa → eliminar |
| `body-text` | Verificar | Si no se usa → eliminar |
| `body-sm` | Verificar | Si no se usa → eliminar |
| `form-label` | Verificar | Si no se usa → eliminar |
| `form-input` | Verificar | Si no se usa → eliminar |
| `newsletter-btn` | Verificar | Si no se usa → eliminar |
| `container-page` | Verificar | Si no se usa → eliminar |

### 10.2 Animaciones sin uso

Verificar `@keyframes ticker` y `@keyframes shimmer` — si no se usan, eliminar.

### 10.3 Clases CSS sin uso

Verificar `.logo-dark`, `.logo-light` — si se usan solo con `className`, mantener. Si no, eliminar.

---

## 11. Mejores prácticas aplicadas

### 11.1 Principio DRY

Cada valor hardcodeado repetido 3+ veces se extrae a una utilidad o token. Ejemplo: `tracking-[0.2em]` repetido 21 veces → `--tracking-wide` en `globals.css`.

### 11.2 Single source of truth

`globals.css` es la única fuente de estilos globales. No hay estilos inline, no hay CSS modules, no hay styled-components. Todo pasa por Tailwind + utilidades custom.

### 11.3 Semántica sobre implementación

| Mal | Bien |
|---|---|
| `py-20` | `section-lg` |
| `text-[10px] tracking-[0.2em]` | `micro-text` |
| `bg-background/80 backdrop-blur-md` | `chip-label` |
| `red-500` | `favorite` |

### 11.4 Tema consciente

Los tokens de color usan `oklch()` y referencian variables CSS. `--color-favorite` se define una vez y se adapta automáticamente a `[data-theme="light"]` si se define ahí.

### 11.5 Composición sobre herencia

Las utilidades se componen: `section-px section-lg` expresa intención (padding inline responsive + espaciado vertical large) sin acoplar implementación.

### 11.6 Eliminación de dead code

Utilidades, keyframes y clases sin uso se eliminan para reducir el CSS final y simplificar el mantenimiento.

---

## 12. Checklist de implementación

### Fase 1 — Tipografía

- [ ] Agregar `@utility product-label` en `globals.css`
- [ ] Agregar `@utility micro-text` en `globals.css`
- [ ] Sustituir `text-[9px] ...` por `product-label` en 5 archivos
- [ ] Sustituir `text-[10px] ...` por `micro-text ...` en 12 archivos
- [ ] Sustituir `text-[11px]` por `text-xs` en 2 archivos

### Fase 2 — Layout

- [ ] Agregar `@utility section-lg`, `section-md`, `section-sm` en `globals.css`
- [ ] Agregar `@utility page-top`, `page-bottom` en `globals.css`
- [ ] Sustituir combinaciones en ~15 páginas

### Fase 3 — Color favorito

- [ ] Agregar `--color-favorite` y `--color-favorite-foreground` en `@theme inline`
- [ ] Sustituir `red-500` → `favorite` en `favorite-button.tsx`
- [ ] Sustituir `red-500` → `favorite` en `favorite-toast.tsx`
- [ ] Sustituir `red-500` → `favorite` en `auth-toast.tsx`
- [ ] Sustituir `border-red-500` → `border-favorite` en `header-nav.tsx`

### Fase 4 — Glass y panel

- [ ] Agregar `@utility chip-label` en `globals.css`
- [ ] Agregar `@utility popover-panel` en `globals.css`
- [ ] Sustituir patrones glass en ~8 archivos

### Fase 5 — Normalizar section-px

- [ ] Reemplazar `px-5 md:px-10` por `section-px` en `cuenta/layout.tsx`
- [ ] Reemplazar `px-4` standalone por `section-px` en 11 `error.tsx`

### Fase 6 — Tracking scale

- [ ] Definir `--tracking-*` como variables CSS en `@theme inline`
- [ ] Sustituir `tracking-[0.2em]` por `tracking-[var(--tracking-wide)]` (o crear `@utility tracking-wide`)
- [ ] Repetir para `tracking-[-0.03em]`, `tracking-[0.14em]`, etc.

### Fase 7 — Limpieza

- [ ] Auditar cada `@utility` en `globals.css` — eliminar las sin uso
- [ ] Auditar `@keyframes` — eliminar las sin uso
- [ ] Verificar build de Next.js sin errores
- [ ] Verificar visualmente que no hay regresiones

---

## Referencias

- [Tailwind CSS v4 — `@utility`](https://tailwindcss.com/docs/adding-custom-styles#adding-utilities)
- [Tailwind CSS v4 — `@theme`](https://tailwindcss.com/docs/theme)
- [oklch color space](https://oklch.com)
- [WCAG 2.2 — Contrast](https://www.w3.org/TR/WCAG22/#contrast-minimum)
