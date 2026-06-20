# Panel de Administración — Documento Técnico (Local / Frontend Only)

> **Versión:** 2.0
> **Fecha:** 16 Jul 2026
> **Stack:** Next.js 16 (App Router) + React 19 + Context + localStorage + shadcn/ui + recharts
> **Objetivo:** Sistema de login con cuenta admin (`admin@dydalo.com` / `admin`) y panel de administración completo con gestión de productos, pedidos, usuarios, contenido y configuración. Todo local, sin backend en `apps/api/`. Datos persistidos en `localStorage` con versionado de esquema.

**Principios aplicados:** [React Composition Patterns](https://github.com/anomalyco/opencode) · [Vercel React Best Practices](https://vercel.com) · [Next.js Best Practices](https://nextjs.org/docs) · TypeScript advanced types

---

## Tabla de contenidos

1. [Visión general](#1-visión-general)
2. [Arquitectura de autenticación local](#2-arquitectura-de-autenticación-local)
3. [Modelo de datos local](#3-modelo-de-datos-local)
4. [Estructura de archivos](#4-estructura-de-archivos)
5. [AuthContext — Interfaz genérica state/actions/meta](#5-authcontext--interfaz-genérica-stateactionsmeta)
6. [Modificaciones al login existente](#6-modificaciones-al-login-existente)
7. [Modificaciones al UserButton](#7-modificaciones-al-userbutton)
8. [Protección de rutas — Layout guard + error boundaries](#8-protección-de-rutas--layout-guard--error-boundaries)
9. [Layout del panel admin — Compound components](#9-layout-del-panel-admin--compound-components)
10. [Dashboard — Server Component + deferred charts](#10-dashboard--server-component--deferred-charts)
11. [Gestión de Productos — CRUD completo](#11-gestión-de-productos--crud-completo)
12. [Gestión de Pedidos](#12-gestión-de-pedidos)
13. [Gestión de Usuarios](#13-gestión-de-usuarios)
14. [Gestión de Contenido (Blog, Lookbook)](#14-gestión-de-contenido-blog-lookbook)
15. [Configuración General del sitio](#15-configuración-general-del-sitio)
16. [DataStore — Capa de persistencia con mejores prácticas](#16-datastore--capa-de-persistencia-con-mejores-prácticas)
17. [Rutas del panel admin](#17-rutas-del-panel-admin)
18. [Fases de implementación](#18-fases-de-implementación)
19. [Checklist de implementación](#19-checklist-de-implementación)
20. [Apéndice A: Decisiones de arquitectura y trade-offs](#apéndice-a-decisiones-de-arquitectura-y-trade-offs)
21. [Apéndice B: Migración futura a backend real](#apéndice-b-migración-futura-a-backend-real)

---

## 1. Visión general

Se construye un sistema completo de login y panel de administración **sin dependencias externas de autenticación ni backend**. Toda la lógica corre en el frontend con Next.js 16 (App Router) usando React 19. Los datos se persisten en `localStorage` mediante una capa de abstracción (`DataStore`) que simula un backend CRUD.

### Principios de diseño

| Principio | Aplicación |
|---|---|
| **Sin backend** | Cero cambios en `apps/api/`. Todo en `apps/web/`. |
| **React 19 APIs** | `use()` en lugar de `useContext()`, `ref` como prop sin `forwardRef`. |
| **Context genérico** | Interfaz `state/actions/meta` para dependency injection (composition patterns). |
| **RSC first** | Server Components por defecto. `"use client"` solo donde es necesario. |
| **Persistencia versionada** | `localStorage` con keys versionadas (`:v1`), try-catch en cada operación. |
| **Suspense boundaries** | Granularidad fina para evitar CSR bailout en rutas estáticas. |
| **Sin dependencias nuevas** | Solo lo ya instalado: react-hook-form, zod, sonner, recharts, lucide-react, shadcn/ui. |
| **Error boundaries** | `error.tsx` por segmento de ruta para contención de fallos. |
| **Bundle optimization** | `optimizePackageImports` en next.config, `next/dynamic` para gráficas pesadas. |

### Flujo de usuario

```
Usuario visita /login
  → Ingresa admin@dydalo.com / admin
    → AuthContext.actions.login() guarda sesión en localStorage (key versionada)
      → Redirige a /admin (dashboard)
        → AdminLayout (guard de ruta + error boundary)
          → Sidebar con navegación
            → CRUD de cada entidad vía DataStore
        → Logout destruye sesión y redirige a /
```

---

## 2. Arquitectura de autenticación local

### 2.1 Credenciales — Módulo estático

```ts
// lib/auth-constants.ts (nuevo)
export const ADMIN_CREDENTIALS = {
  email: "admin@dydalo.com",
  password: "admin",
} as const;

export const AUTH_STORAGE_KEY = "dydalo_auth:v1" as const;
```

### 2.2 AuthContext — Interfaz genérica state/actions/meta

Siguiendo el patrón de composition: el provider es el único lugar que sabe cómo se gestiona el estado. La UI consume la interfaz, no la implementación. Esto permite cambiar de localStorage → JWT/backend sin tocar ningún componente consumidor.

```ts
// La interfaz genérica — contrato entre provider y consumidores
interface AuthState {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
}

interface AuthActions {
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

interface AuthMeta {
  isAdmin: boolean;
}

interface AuthContextValue {
  state: AuthState;
  actions: AuthActions;
  meta: AuthMeta;
}

type LoginResult =
  | { success: true }
  | { success: false; error: string };
```

```tsx
// contexts/auth-context.tsx (nuevo)
"use client";

import { createContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { ADMIN_CREDENTIALS, AUTH_STORAGE_KEY } from "@/lib/auth-constants";
import type { User, LoginResult } from "@/lib/data-store";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    // Lazy initialization: localStorage solo se lee en mount inicial
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as User;
        return { user, status: "authenticated" };
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    return { user: null, status: "unauthenticated" };
  });

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    await new Promise((r) => setTimeout(r, 800));

    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      const user: User = {
        id: "admin-001",
        name: "Administrador",
        email: ADMIN_CREDENTIALS.email,
        role: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } catch { /* quota exceeded o incognito */ }
      setState({ user, status: "authenticated" });
      return { success: true };
    }

    return { success: false, error: "Email o contraseña incorrectos" };
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch { /* ignorar error en incognito */ }
    setState({ user: null, status: "unauthenticated" });
  }, []);

  const isAdmin = state.user?.role === "admin";

  return (
    <AuthContext value={{ state, actions: { login, logout }, meta: { isAdmin } }}>
      {children}
    </AuthContext>
  );
}
```

### 2.3 Hook consumidor — `use()` de React 19

```ts
// contexts/auth-context.tsx (continuación)
import { use } from "react";

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext); // React 19: use() reemplaza useContext()
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
```

**Ventaja de `use()` sobre `useContext()`**: Puede llamarse condicionalmente (en loops, early returns). En React 19, `use()` es el camino recomendado para leer contexto.

### 2.4 Integración en `app/layout.tsx`

```tsx
// app/layout.tsx (modificar)
import { AuthProvider } from "@/contexts/auth-context";

// Envolver en orden: Theme → Auth → Cart → Favorites
<ThemeProvider>
  <AuthProvider>
    <CartProvider>
      <FavoritesProvider>
        <SiteHeader />
        <Suspense fallback={null}>{children}</Suspense>
        <Toaster />
        <SocialWidget />
      </FavoritesProvider>
    </CartProvider>
  </AuthProvider>
</ThemeProvider>
```

---

## 3. Modelo de datos local

### 3.1 Tipos base con discriminadores

```ts
// lib/data-store.ts (nuevo — tipos)

// ── User ──
type UserRole = "admin" | "customer";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt: string;  // ISO 8601 — siempre string en client boundary
  updatedAt: string;
};

// ── Product (extiende el existente de data/products.ts) ──
// NOTA: NO extender via & en RSC→client. Usar tipo independiente.
type AdminProduct = {
  id: number;
  name: string;
  type: ProductType;
  category: string;
  price: number;
  image: string;
  label: string;
  sizes: ProductSize[];
  colors: { name: string; hex: string }[];
  // ── Campos admin ──
  stock: number;
  active: boolean;
  featured: boolean;
  discount: number | null;
  sku: string;
  createdAt: string;
  updatedAt: string;
};

// ── Order + status machine ──
const ORDER_STATUSES = [
  "pendiente", "confirmado", "enviado", "entregado", "cancelado", "devuelto"
] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

type StatusTransition = {
  from: OrderStatus;
  to: OrderStatus;
  at: string;
  by: string; // userId
};

type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: ShippingAddress;
  trackingNumber: string | null;
  notes: string | null;
  statusHistory: StatusTransition[];
  createdAt: string;
  updatedAt: string;
};

// Transiciones válidas entre estados
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["enviado", "cancelado"],
  enviado: ["entregado"],
  entregado: ["devuelto"],
  cancelado: [],
  devuelto: [],
};

// ── Blog ──
type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

// ── Lookbook ──
type LookbookEntry = {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  productIds: number[];
  order: number;
  published: boolean;
  createdAt: string;
};

// ── Site Config ──
type SiteConfig = {
  siteName: string;
  siteDescription: string;
  brandSubtitle: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: Partial<Record<"instagram" | "tiktok" | "youtube" | "twitter", string>>;
  shippingInfo: string;
  returnPolicy: string;
  sizeGuide: string;
  faq: Array<{ question: string; answer: string }>;
  heroSettings: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    backgroundImage: string;
  };
  maintenanceMode: boolean;
};

// ── Resultados genéricos ──
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### 3.2 Discriminación de tipos — Best practice TypeScript

```ts
// En lugar de boolean flags dispersos, usar discriminated unions para el estado del panel:

type PanelTab =
  | { type: "dashboard" }
  | { type: "productos"; view: "list" | "create" | { edit: number } }
  | { type: "pedidos"; view: "list" | { detail: string } }
  | { type: "usuarios"; view: "list" | { detail: string } }
  | { type: "contenido"; section: "blog" | "lookbook"; view: "list" | "create" | { edit: string } }
  | { type: "configuracion" }
  | { type: "analytics" };

// Esto evita estados imposibles y permite narrowing exhaustivo en switch.
```

---

## 4. Estructura de archivos

```
apps/web/
├── next.config.ts                        # MODIFICAR: optimizePackageImports
├── app/
│   ├── layout.tsx                        # MODIFICAR: añadir AuthProvider
│   ├── error.tsx                         # NUEVO: global error boundary (client)
│   │
│   ├── (auth)/                           # Existente — sin cambios estructurales
│   │   └── login/page.tsx                # MODIFICAR: server wrapper → client form
│   │
│   └── (admin)/                          # NUEVO: route group para admin
│       ├── layout.tsx                    # Server: metadata. Client wrapper debajo.
│       ├── error.tsx                     # NUEVO: admin error boundary
│       ├── not-found.tsx                 # NUEVO: 404 admin
│       └── admin/
│           ├── page.tsx                  # Server shell → client dashboard
│           ├── loading.tsx               # NUEVO: skeleton para admin
│           ├── productos/
│           │   ├── page.tsx              # Server shell → client table
│           │   ├── loading.tsx
│           │   ├── nuevo/page.tsx
│           │   └── [id]/page.tsx
│           ├── pedidos/
│           │   ├── page.tsx
│           │   └── [id]/page.tsx
│           ├── usuarios/
│           │   ├── page.tsx
│           │   └── [id]/page.tsx
│           ├── contenido/
│           │   ├── page.tsx
│           │   ├── blog/
│           │   │   ├── page.tsx
│           │   │   ├── nuevo/page.tsx
│           │   │   └── [id]/page.tsx
│           │   └── lookbook/
│           │       ├── page.tsx
│           │       ├── nuevo/page.tsx
│           │       └── [id]/page.tsx
│           ├── configuracion/
│           │   └── page.tsx
│           └── analytics/
│               └── page.tsx
│
├── components/
│   └── admin/
│       ├── admin-layout.tsx              # Compound: AdminLayout.Sidebar, .Header, .Main
│       ├── admin-sidebar.tsx
│       ├── admin-header.tsx
│       ├── stat-card.tsx
│       ├── data-table.tsx                # Genérico <TData, TValue>
│       ├── product-form.tsx
│       ├── order-status-badge.tsx
│       ├── order-detail.tsx
│       ├── blog-post-form.tsx
│       ├── lookbook-form.tsx
│       ├── site-config-form.tsx
│       ├── image-uploader.tsx
│       └── confirm-dialog.tsx
│
├── contexts/
│   ├── auth-context.tsx                  # NUEVO: AuthProvider + useAuth (use() React 19)
│   └── data-store-context.tsx            # NUEVO: provee DataStore a todo el admin
│
├── lib/
│   ├── auth-constants.ts                 # NUEVO
│   ├── data-store.ts                     # NUEVO: tipos + store versionado
│   ├── data-store.products.ts            # NUEVO: módulo productos
│   ├── data-store.orders.ts              # NUEVO: módulo pedidos
│   ├── data-store.users.ts               # NUEVO: módulo usuarios
│   ├── data-store.blog.ts                # NUEVO: módulo blog
│   ├── data-store.lookbook.ts            # NUEVO: módulo lookbook
│   ├── data-store.config.ts              # NUEVO: módulo configuración
│   ├── data-store.utils.ts               # NUEVO: read/write/generateId versionados
│   ├── seed-data.ts                      # NUEVO: seed inicial
│   └── admin-permissions.ts              # NUEVO: matriz de permisos por rol
│
└── data/
    └── products.ts                       # SIN MODIFICAR: datos hardcodeados originales
```

**Nota sobre barrel exports:** NO se usará un `index.ts` barrel en `lib/`. Cada consumidor importa directamente del módulo específico (`import { productsStore } from "@/lib/data-store.products"`). Esto evita que el bundler cargue toda la superficie del DataStore cuando una página solo necesita, por ejemplo, productos.

---

## 5. AuthContext — Interfaz genérica state/actions/meta

### Principio: Decouple state from UI

El provider (`AuthProvider`) es el **único** lugar que sabe cómo se persiste la sesión (localStorage, JWT, cookie). Los componentes consumidores (`UserButton`, `LoginForm`, `AdminLayout`) solo conocen la interfaz `{ state, actions, meta }`. Cuando llegue el backend real, se cambia **solo el provider**. La UI no se toca.

### Implementación completa

Ver sección 2.2 arriba. Puntos clave de buenas prácticas aplicados:

1. **Lazy state initialization** (`useState(() => ...)`) — `localStorage.getItem` solo se ejecuta en mount inicial, no en cada render.
2. **Versioned keys** — `dydalo_auth:v1` permite migración de esquema futura.
3. **try-catch en cada operación localStorage** — Safari incognito, quota exceeded, storage disabled.
4. **`use()` en vez de `useContext()`** — React 19 API.
5. **`useCallback` estable** — `login` y `logout` tienen `[]` de dependencias porque usan constantes de módulo, no state.
6. **Result type discriminado** — `LoginResult` es `{ success: true } | { success: false; error: string }`, evita chequear `result.error` sin verificar `success`.

### Contracto para el futuro

```ts
// Hoy: localStorage
// Mañana: API NestJS
// La interfaz no cambia:

// Versión localStorage (hoy):
<AuthProvider>
  <App />
</AuthProvider>

// Versión JWT/backend (futuro):
<AuthProvider backend="nest">  // mismo contrato, distinta implementación
  <App />
</AuthProvider>
```

---

## 6. Modificaciones al login existente

### Archivo: `components/auth/login-form.tsx`

```tsx
"use client";

import { useAuth } from "@/contexts/auth-context";
// ... resto de imports igual

export function LoginForm() {
  const { actions: { login } } = useAuth();
  // NOTA: se desestructura actions, no se hace destructure plano del contexto.
  // Esto cumple con "defer reads" — solo se subscribe a actions.

  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ... form setup igual ...

  async function onSubmit(values: LoginInput) {
    setError(null);
    setIsPending(true);

    const result = await login(values.email, values.password);

    if (result.success) {
      showLoginSuccessToast();
      router.push(ROUTES.admin);    // <-- admin, no cuenta
    } else {
      setError(result.error);       // TypeScript narrows: result.error existe
      setIsPending(false);
    }
  }

  // ... JSX sin cambios estructurales ...
}
```

**Mejores prácticas aplicadas:**
- `actions.login` en vez de renombrar: claridad sobre qué parte del contexto se usa.
- `result.error` solo se accede tras `!result.success` — narrowing de TypeScript.
- `isPending` se resetea solo en error. En éxito, el redirect hace unmount natural.

### Archivo: `lib/validations/auth.ts`

No requiere cambios. `loginSchema` ya acepta `"admin"` como password (mínimo 1 carácter requerido). El schema no impone complejidad de password para login (eso es para registro).

---

## 7. Modificaciones al UserButton

```tsx
"use client";

import { useAuth } from "@/contexts/auth-context";

export function UserButton() {
  const { state, meta, actions } = useAuth();
  const router = useRouter();

  // Derived state durante render — no necesita useState/useEffect
  const isAuthenticated = state.status === "authenticated";

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function handleLogout() {
    setIsLoggingOut(true);
    actions.logout();
    showLogoutToast();
    router.push(ROUTES.home);
    // setIsLoggingOut(false) innecesario: el unmount/redirect lo limpia
  }

  if (!isAuthenticated || !state.user) {
    return (
      <Button variant="ghost" size="icon" aria-label="Iniciar sesión" asChild>
        <Link href={ROUTES.login}>
          <User />
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Mi cuenta">
          <User />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">{state.user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{state.user.email}</p>
        </div>
        <DropdownMenuSeparator />
        {meta.isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href={ROUTES.admin} className="cursor-pointer">
                <LayoutDashboard className="size-4" />
                Panel Admin
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {/* ... resto igual ... */}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="size-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Mejores prácticas aplicadas:**
- `state.status` derivado en render, no duplicado en estado.
- `meta.isAdmin` en vez de derivar `state.user?.role === "admin"` en el consumidor: el provider expone el dato ya computado.
- Sin `setTimeout` en logout: `actions.logout()` es síncrono (localStorage), no necesita delay artificial.

---

## 8. Protección de rutas — Layout guard + error boundaries

### 8.1 Layout Server Component + Client Wrapper

Siguiendo el patrón Next.js: server component para metadata, client component interno para el guard:

```tsx
// app/(admin)/layout.tsx — SERVER COMPONENT
import type { Metadata } from "next";
import { AdminLayoutClient } from "./admin-layout-client";

export const metadata: Metadata = {
  title: { template: "%s — Admin DYDALO", default: "Admin — DYDALO" },
  robots: { index: false, follow: false }, // No indexar admin
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
```

```tsx
// app/(admin)/admin-layout-client.tsx — CLIENT COMPONENT
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ROUTES } from "@/lib/routes";
import { Loader2 } from "lucide-react";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const { state, meta } = useAuth();
  const router = useRouter();

  // Guard: early return de la verificación
  const isAuthorized = state.status === "authenticated" && meta.isAdmin;

  useEffect(() => {
    if (state.status === "unauthenticated" || (state.status === "authenticated" && !meta.isAdmin)) {
      router.replace(ROUTES.login);
    }
  }, [state.status, meta.isAdmin, router]);

  // Loading state mientras se hidrata el auth desde localStorage
  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthorized) return null; // será redirigido por el useEffect

  return <AdminLayout>{children}</AdminLayout>;
}
```

### 8.2 Error boundaries

```tsx
// app/(admin)/error.tsx
"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="size-12 mx-auto text-destructive" />
        <h2 className="text-xl font-bold">Error en el panel</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "Ocurrió un error inesperado."}
        </p>
        <Button onClick={reset} variant="outline">
          Reintentar
        </Button>
      </div>
    </div>
  );
}
```

```tsx
// app/(admin)/not-found.tsx
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">Sección no encontrada</p>
        <Link href={ROUTES.admin} className="text-accent underline">
          Volver al dashboard
        </Link>
      </div>
    </div>
  );
}
```

**Mejores prácticas aplicadas:**
- Server/Client split: metadata en server, lógica de guard en client.
- `error.tsx` y `not-found.tsx` por segmento: errores contenidos al admin, no afectan el sitio público.
- `robots: { index: false }` en metadata: SEO — no indexar rutas admin.
- Verificación `state.status === "loading"` para hidratación inicial desde localStorage.

---

## 9. Layout del panel admin — Compound components

### Patrón: Compound components con AdminLayout

En lugar de un layout monolítico con props booleanas (`collapsed`, `mobile`, etc.), se usa composición:

```tsx
// components/admin/admin-layout.tsx
"use client";

import { createContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

// ── Interfaz genérica del layout ──
interface AdminLayoutState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
}

interface AdminLayoutActions {
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

interface AdminLayoutContextValue {
  state: AdminLayoutState;
  actions: AdminLayoutActions;
}

const AdminLayoutContext = createContext<AdminLayoutContextValue | null>(null);

// ── Provider ──
function AdminLayoutRoot({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminLayoutState>({
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
  });

  const toggleSidebar = useCallback(() => {
    setState((s) => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed }));
  }, []);

  const setMobileSidebarOpen = useCallback((open: boolean) => {
    setState((s) => ({ ...s, mobileSidebarOpen: open }));
  }, []);

  return (
    <AdminLayoutContext value={{ state, actions: { toggleSidebar, setMobileSidebarOpen } }}>
      <div className="flex min-h-screen">{children}</div>
    </AdminLayoutContext>
  );
}

// ── Sub-componentes ──
function AdminLayoutSidebar() { /* usa use(AdminLayoutContext) */ }
function AdminLayoutHeader() { /* breadcrumb + toggle */ }
function AdminLayoutMain({ children }: { children: ReactNode }) {
  return <main className="flex-1 p-6 bg-muted/30 overflow-auto">{children}</main>;
}

// ── Export como compound ──
export const AdminLayout = {
  Root: AdminLayoutRoot,
  Sidebar: AdminLayoutSidebar,
  Header: AdminLayoutHeader,
  Main: AdminLayoutMain,
};
```

Uso:

```tsx
<AdminLayout.Root>
  <AdminLayout.Sidebar />
  <div className="flex-1 flex flex-col">
    <AdminLayout.Header />
    <AdminLayout.Main>{children}</AdminLayout.Main>
  </div>
</AdminLayout.Root>
```

**Mejores prácticas aplicadas:**
- **Compound components** — composición sobre boolean props (evita `<Layout collapsed showHeader={false} />`).
- **Interfaz state/actions** — el sidebar, header y main comparten estado vía contexto sin prop drilling.
- **Functional setState** — `setState((s) => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed }))` evita stale closure.

### 9.1 AdminSidebar — Navegación

Estructura del sidebar con subitems colapsables. Usa `Collapsible` de shadcn/ui.

```
┌─ LOGO DYDALO ──────────────────────────┐
│ Dashboard                                │
│ Productos                          ▶     │
│   ├ Todos                                │
│   └ + Nuevo                              │
│ Pedidos                                  │
│ Usuarios                                 │
│ Contenido                          ▶     │
│   ├ Blog                                 │
│   └ Lookbook                             │
│ Configuración                            │
│ Analytics                                │
├──────────────────────────────────────────┤
│ ← Volver a la tienda                     │
│ Cerrar sesión                            │
└──────────────────────────────────────────┘
```

Responsive: `< lg` → sidebar se oculta y se muestra vía `Sheet` (drawer lateral). `≥ lg` → sidebar fijo 240px, colapsable a 60px (solo iconos con `Tooltip`).

### 9.2 AdminHeader

- **Breadcrumb** automático vía `usePathname()`. Necesita `Suspense` porque la ruta admin no es dinámica (sin `generateStaticParams`).
- **Toggle sidebar** (mobile + desktop collapse).
- **User menu** inline (mismos datos que UserButton).

```tsx
// El breadcrumb usa usePathname → necesita Suspense
import { Suspense } from "react";

function AdminHeader() {
  return (
    <header className="...">
      <Suspense fallback={<BreadcrumbSkeleton />}>
        <AdminBreadcrumb />
      </Suspense>
      {/* ... */}
    </header>
  );
}
```

---

## 10. Dashboard — Server Component + deferred charts

### Arquitectura

```tsx
// app/(admin)/admin/page.tsx — SERVER COMPONENT
import type { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { StatCards } from "./stat-cards";
import { RecentOrders } from "./recent-orders";
import { DashboardSkeleton } from "./dashboard-skeleton";

export const metadata: Metadata = { title: "Dashboard" };

// Charts: lazy load con next/dynamic — no bloquean el primer render
const SalesChart = dynamic(
  () => import("./sales-chart").then((m) => m.SalesChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const OrderStatusChart = dynamic(
  () => import("./order-status-chart").then((m) => m.OrderStatusChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-heading">Dashboard</h1>

      <Suspense fallback={<StatsSkeleton />}>
        <StatCards />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart />
        <OrderStatusChart />
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />
      </Suspense>
    </div>
  );
}
```

**Mejores prácticas aplicadas:**
- **Server Component shell** — metadata y estructura en server, datos en client.
- **`next/dynamic` con `ssr: false`** — recharts es pesado (~150KB), solo se carga en cliente y bajo demanda.
- **Suspense granular** — stat cards, charts y tabla reciente tienen sus propios fallbacks. La página pinta progresivamente.
- **`loading.tsx`** a nivel de segmento como fallback mientras se carga el JS del dashboard.

### KPIs del dashboard

Derivados en render desde DataStore, no almacenados en estado:

```tsx
"use client";

function StatCards() {
  const products = DataStore.products.getAll();

  // Derived state en render — no necesita useState/useEffect
  const activeProducts = products.filter((p) => p.active).length;
  const lowStock = products.filter((p) => p.stock <= 5).length;
  const featured = products.filter((p) => p.featured).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Productos Activos" value={activeProducts} />
      <StatCard title="Stock Bajo" value={lowStock} variant="warning" />
      <StatCard title="Destacados" value={featured} />
      <StatCard title="Pedidos Hoy" value={/* ... */} />
    </div>
  );
}
```

---

## 11. Gestión de Productos — CRUD completo

### 11.1 Listado — `app/(admin)/admin/productos/page.tsx`

Server shell + client table con filtrado optimizado:

```tsx
// Server Component
import { Suspense } from "react";
import { ProductsTable } from "./products-table";
import { ProductsTableSkeleton } from "./products-table-skeleton";

export default function ProductosPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        {/* Link a /admin/productos/nuevo */}
      </div>
      <Suspense fallback={<ProductsTableSkeleton />}>
        <ProductsTable />
      </Suspense>
    </div>
  );
}
```

### 11.2 DataTable genérico con tipos

```tsx
// components/admin/data-table.tsx
"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";  // NOTA: requeriría instalar @tanstack/react-table
// Alternativa sin dependencia nueva: implementación manual con useMemo + sort/filter

import type { ColumnDef, SortingState } from "@tanstack/react-table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  // ... renderizado de tabla
}
```

**Alternativa sin dependencia `@tanstack/react-table`**: Implementar una tabla con filtrado/sort manual usando `useMemo` + `useDeferredValue` para mantener la UI responsive durante búsquedas:

```tsx
function ProductsTable() {
  const allProducts = DataStore.products.getAll();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    if (!deferredQuery) return allProducts;
    const q = deferredQuery.toLowerCase();
    return allProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [allProducts, deferredQuery]);

  const isStale = query !== deferredQuery;

  return (
    <div style={{ opacity: isStale ? 0.7 : 1 }}>
      {/* tabla con filtered */}
    </div>
  );
}
```

### 11.3 Formulario de producto

```tsx
// components/admin/product-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const productFormSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  type: z.enum(["Ropa", "Calzado", "Accesorios", "Bling"]),
  category: z.string().min(1, "Selecciona una categoría"),
  price: z.coerce.number().positive("Debe ser mayor a 0"),
  sku: z.string().min(1, "SKU requerido"),
  stock: z.coerce.number().int().nonnegative("No puede ser negativo"),
  discount: z.coerce.number().min(0).max(100).nullable(),
  label: z.string().min(1, "Label requerido"),
  active: z.boolean(),
  featured: z.boolean(),
  sizes: z.array(z.string()).min(1, "Al menos una talla"),
  colors: z.array(z.object({ name: z.string().min(1), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) })).min(1, "Al menos un color"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const DEFAULT_VALUES: ProductFormValues = {
  name: "",
  type: "Ropa",
  category: "",
  price: 0,
  sku: "",
  stock: 0,
  discount: null,
  label: "",
  active: true,
  featured: false,
  sizes: [],
  colors: [{ name: "", hex: "#1a1a1a" }],
};

export function ProductForm({
  product,
  onSubmit,
}: {
  product?: AdminProduct;
  onSubmit: (data: ProductFormValues) => void;
}) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? { /* mapear product → form values */ }
      : DEFAULT_VALUES,
  });

  // ... renderizado del formulario
}
```

**Mejores prácticas aplicadas en el formulario:**
- **`DEFAULT_VALUES` a nivel de módulo** — evita recreación en cada render (non-primitive default extraction).
- **`z.coerce.number()`** — convierte strings de inputs number automáticamente.
- **Validación de hex color con regex** — `#[0-9a-fA-F]{6}`.
- **`nullable()` en discount** — permite `null` (sin descuento), distinguible de `0` (gratis).

### 11.4 ImageUploader

Simula subida convirtiendo a base64. En producción se reemplaza por Cloudinary/S3.

```tsx
"use client";

function ImageUploader({ value, onChange }: { value: string; onChange: (b64: string) => void }) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Lazy load FileReader — solo se usa cuando hay archivo
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-lg border">
          <img src={value} alt="Preview" className="object-cover w-full h-full" />
        </div>
      ) : null}
      <Input type="file" accept="image/*" onChange={handleFile} />
    </div>
  );
}
```

---

## 12. Gestión de Pedidos

### 12.1 Máquina de estados — Transiciones válidas

Las transiciones se validan contra `VALID_TRANSITIONS` (definido en sección 3.1). No se permite cualquier cambio de estado:

```ts
function transitionOrder(order: Order, newStatus: OrderStatus, userId: string): ActionResult<Order> {
  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error: `No se puede cambiar de "${order.status}" a "${newStatus}". Transiciones válidas: ${allowed.join(", ")}`,
    };
  }

  const updated: Order = {
    ...order,
    status: newStatus,
    statusHistory: [
      ...order.statusHistory,
      { from: order.status, to: newStatus, at: new Date().toISOString(), by: userId },
    ],
    updatedAt: new Date().toISOString(),
  };

  DataStore.orders.update(order.id, updated);
  return { success: true, data: updated };
}
```

### 12.2 Detalle de pedido

```tsx
// app/(admin)/admin/pedidos/[id]/page.tsx
import { notFound } from "next/navigation";

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>; // Next.js 16: params es Promise
}) {
  const { id } = await params;
  const order = DataStore.orders.getById(id);

  if (!order) notFound(); // Renderiza not-found.tsx del admin

  return <OrderDetailClient order={order} />;
}
```

### 12.3 OrderStatusBadge — Variantes explícitas

En lugar de un componente con prop `status` + lógica interna de colores, usar variantes explícitas (composition pattern):

```tsx
// components/admin/order-status-badge.tsx
const STATUS_STYLES: Record<OrderStatus, string> = {
  pendiente: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  confirmado: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  enviado: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  entregado: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelado: "bg-red-500/10 text-red-400 border-red-500/20",
  devuelto: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
```

El lookup `STATUS_STYLES[status]` es O(1) y type-safe: TypeScript garantiza que todas las variantes de `OrderStatus` tienen entrada.

---

## 13. Gestión de Usuarios

### 13.1 Matriz de permisos

```ts
// lib/admin-permissions.ts (nuevo)
const PERMISSIONS = {
  "admin": ["products:crud", "orders:crud", "users:crud", "content:crud", "config:write", "analytics:read"],
  "customer": [],
} as const satisfies Record<UserRole, string[]>;

export function can(userRole: UserRole, permission: string): boolean {
  return (PERMISSIONS[userRole] as readonly string[]).includes(permission);
}
```

### 13.2 Listado y detalle

Similar a productos y pedidos: server shell + client table. El detalle muestra historial de pedidos del usuario (derivado de `DataStore.orders.getByUserId()`).

---

## 14. Gestión de Contenido (Blog, Lookbook)

### 14.1 Blog — Slug autogenerado con `useDeferredValue`

```tsx
function BlogPostForm() {
  const form = useForm<BlogPostFormValues>({ /* ... */ });
  const title = form.watch("title");
  const deferredTitle = useDeferredValue(title);

  const autoSlug = useMemo(() =>
    deferredTitle
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar tildes
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    [deferredTitle]
  );

  // Sincronizar slug solo si no fue editado manualmente
  // ...
}
```

---

## 15. Configuración General del sitio

Formulario unificado con tabs. Los cambios se persisten en `DataStore.config`. Las páginas públicas leen de `DataStore.config.get()` para mostrar contenido dinámico (hero, FAQ, envíos, etc.).

### Secciones del formulario

| Tab | Campos |
|---|---|
| General | siteName, siteDescription, brandSubtitle, logo |
| Contacto | contactEmail, contactPhone, address |
| Redes | socialLinks (instagram, tiktok, youtube, twitter) |
| Hero | heroSettings (title, subtitle, ctaText, ctaLink, backgroundImage) |
| Páginas | shippingInfo, returnPolicy, sizeGuide (markdown) |
| FAQ | Lista dinámica [{ question, answer }] |
| Mantenimiento | maintenanceMode (switch) |

---

## 16. DataStore — Capa de persistencia con mejores prácticas

### 16.1 Diseño modular — Sin barrel exports

Cada dominio tiene su propio módulo. Esto permite importar solo lo necesario:

```
lib/
├── data-store.utils.ts      # read/write/generateId versionados
├── data-store.products.ts   # importa utils
├── data-store.orders.ts     # importa utils
├── data-store.users.ts      # importa utils
├── data-store.blog.ts       # importa utils
├── data-store.lookbook.ts   # importa utils
├── data-store.config.ts     # importa utils
└── data-store.ts            # re-exporta tipos + objeto compuesto
```

### 16.2 Utilidades versionadas

```ts
// lib/data-store.utils.ts

const SCHEMA_VERSION = "v1";

// Mapa de keys → prefijo versionado
const KEYS = {
  products: `dydalo_products:${SCHEMA_VERSION}`,
  orders: `dydalo_orders:${SCHEMA_VERSION}`,
  users: `dydalo_users:${SCHEMA_VERSION}`,
  blog: `dydalo_blog:${SCHEMA_VERSION}`,
  lookbook: `dydalo_lookbook:${SCHEMA_VERSION}`,
  config: `dydalo_config:${SCHEMA_VERSION}`,
  images: `dydalo_images:${SCHEMA_VERSION}`,
} as const;

export function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, data: T): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false; // quota exceeded, incognito, disabled
  }
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export { KEYS };
```

### 16.3 Módulo de ejemplo: Products

```ts
// lib/data-store.products.ts
import { read, write, generateId, KEYS } from "./data-store.utils";
import type { AdminProduct } from "./data-store";

function getAll(): AdminProduct[] {
  return read<AdminProduct[]>(KEYS.products, []);
}

function getById(id: number): AdminProduct | undefined {
  // Construir Map para lookup O(1) en vez de .find() O(n)
  const products = getAll();
  const map = new Map(products.map((p) => [p.id, p] as const));
  return map.get(id);
}

function create(data: Omit<AdminProduct, "id" | "createdAt" | "updatedAt">): AdminProduct {
  const products = getAll();
  const now = new Date().toISOString();
  const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);

  const product: AdminProduct = {
    ...data,
    id: maxId + 1,
    createdAt: now,
    updatedAt: now,
  };

  write(KEYS.products, [...products, product]);
  return product;
}

function update(id: number, data: Partial<AdminProduct>): AdminProduct | undefined {
  const products = getAll();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return undefined;

  const updated: AdminProduct = {
    ...products[index],
    ...data,
    id: products[index].id, // id inmutable
    createdAt: products[index].createdAt, // createdAt inmutable
    updatedAt: new Date().toISOString(),
  };

  const next = [...products];
  next[index] = updated;
  write(KEYS.products, next);
  return updated;
}

function remove(id: number): boolean {
  const products = getAll();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) return false;
  write(KEYS.products, filtered);
  return true;
}

// Seed: reemplazo masivo (solo en inicialización)
function seed(items: AdminProduct[]): void {
  write(KEYS.products, items);
}

export const productsStore = { getAll, getById, create, update, delete: remove, seed };
```

### 16.4 Objeto compuesto DataStore (para conveniencia)

```ts
// lib/data-store.ts
export { productsStore } from "./data-store.products";
export { ordersStore } from "./data-store.orders";
export { usersStore } from "./data-store.users";
export { blogStore } from "./data-store.blog";
export { lookbookStore } from "./data-store.lookbook";
export { configStore } from "./data-store.config";
export type { /* todos los tipos */ } from "./data-store.types";
```

### 16.5 Index maps para consultas frecuentes

```ts
// lib/data-store.orders.ts

// Cache en módulo — se invalida en cada write
let ordersByUserCache: Map<string, Order[]> | null = null;

function invalidateCache() {
  ordersByUserCache = null;
}

function getByUserId(userId: string): Order[] {
  if (!ordersByUserCache) {
    const all = getAll();
    ordersByUserCache = new Map();
    for (const order of all) {
      const existing = ordersByUserCache.get(order.userId) ?? [];
      existing.push(order);
      ordersByUserCache.set(order.userId, existing);
    }
  }
  return ordersByUserCache.get(userId) ?? [];
}

// Cada mutación invalida el cache
function create(data: CreateOrderInput): Order {
  invalidateCache();
  // ...
}
```

**Mejores prácticas aplicadas en DataStore:**
- **Keys versionadas** (`:v1`) — migración de esquema posible sin perder datos.
- **try-catch en cada read/write** — robustez en incognito/quota exceeded.
- **Sin barrel imports** — cada módulo se importa directamente.
- **Index maps** — O(1) lookups para `getById`, `getByUserId`, etc.
- **Cache en módulo** — invalidation en writes, evita re-leer localStorage en cada render.
- **`crypto.randomUUID()`** con fallback a timestamp — IDs únicos sin dependencia.
- **`toSorted()` / spread** — nunca mutar arrays del store. Siempre crear copias.
- **`Map` para lookups** — `new Map(products.map(p => [p.id, p]))` es O(1) vs `.find()` O(n).

### 16.6 Claves de localStorage

| Key | Contenido | Migración |
|---|---|---|
| `dydalo_auth:v1` | `User \| null` autenticado | v1: datos planos |
| `dydalo_products:v1` | `AdminProduct[]` | v1: 100 productos seed |
| `dydalo_orders:v1` | `Order[]` | v1: incluye statusHistory |
| `dydalo_users:v1` | `User[]` | v1: clientes registrados |
| `dydalo_blog:v1` | `BlogPost[]` | v1: contenido markdown |
| `dydalo_lookbook:v1` | `LookbookEntry[]` | v1: entradas con productIds |
| `dydalo_config:v1` | `SiteConfig` | v1: configuración completa |
| `dydalo_images:v1` | `Record<string, string>` | v1: id → base64 |

### 16.7 Seed inicial

Al primer acceso a cualquier store (si `getAll().length === 0`), ejecutar seed:

```ts
// lib/seed-data.ts
import { productsStore } from "./data-store.products";
import { ordersStore } from "./data-store.orders";
// ...

export function seedIfEmpty(): void {
  const existingProducts = productsStore.getAll();
  if (existingProducts.length > 0) return; // Ya inicializado

  // Productos: 100 del catálogo hardcodeado → AdminProduct
  const adminProducts: AdminProduct[] = rawProducts.map((p, i) => ({
    ...p,
    stock: 50,
    active: true,
    featured: i < 8,
    discount: i % 5 === 0 ? 15 : null,
    sku: `DYD-${p.type.slice(0, 3).toUpperCase()}-${String(p.id).padStart(4, "0")}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  productsStore.seed(adminProducts);

  // Usuarios demo (5)
  // Pedidos demo (10 con estados variados)
  // Blog posts demo (3)
  // Lookbook entries demo (3)
  // SiteConfig default
}
```

---

## 17. Rutas del panel admin

```ts
// lib/routes.ts — añadir al objeto ROUTES existente

// Admin - genérico
admin: "/admin",
adminAnalytics: "/admin/analytics",
adminConfiguracion: "/admin/configuracion",

// Admin - Productos
adminProductos: "/admin/productos",
adminProductoNuevo: "/admin/productos/nuevo",
adminProductoEditar: (id: number) => `/admin/productos/${id}`,

// Admin - Pedidos
adminPedidos: "/admin/pedidos",
adminPedidoDetalle: (id: string) => `/admin/pedidos/${id}`,

// Admin - Usuarios
adminUsuarios: "/admin/usuarios",
adminUsuarioDetalle: (id: string) => `/admin/usuarios/${id}`,

// Admin - Contenido
adminContenido: "/admin/contenido",
adminBlog: "/admin/contenido/blog",
adminBlogNuevo: "/admin/contenido/blog/nuevo",
adminBlogEditar: (id: string) => `/admin/contenido/blog/${id}`,
adminLookbook: "/admin/contenido/lookbook",
adminLookbookNuevo: "/admin/contenido/lookbook/nuevo",
adminLookbookEditar: (id: string) => `/admin/contenido/lookbook/${id}`,
```

### Tabla de rutas completa

| Ruta | Tipo | Descripción |
|---|---|---|
| `/admin` | Server shell | Dashboard + KPIs + charts (lazy) |
| `/admin/productos` | Server shell | Tabla productos con filtros |
| `/admin/productos/nuevo` | Client | Form crear producto |
| `/admin/productos/[id]` | Server → Client | Form editar producto |
| `/admin/pedidos` | Server shell | Tabla pedidos + filtros |
| `/admin/pedidos/[id]` | Server → Client | Detalle pedido + transiciones |
| `/admin/usuarios` | Server shell | Tabla usuarios |
| `/admin/usuarios/[id]` | Server → Client | Detalle usuario + historial |
| `/admin/contenido` | Client | Landing contenido |
| `/admin/contenido/blog` | Server shell | Tabla posts |
| `/admin/contenido/blog/nuevo` | Client | Crear post |
| `/admin/contenido/blog/[id]` | Client | Editar post |
| `/admin/contenido/lookbook` | Server shell | Tabla lookbook |
| `/admin/contenido/lookbook/nuevo` | Client | Crear entrada |
| `/admin/contenido/lookbook/[id]` | Client | Editar entrada |
| `/admin/configuracion` | Client | Form tabs configuración |
| `/admin/analytics` | Server shell | Gráficas avanzadas (lazy) |

---

## 18. Fases de implementación

### Fase 1 — Auth y Layout Base (Core)

| # | Tarea | Archivo | Práctica clave |
|---|---|---|---|
| 1 | Crear `auth-constants.ts` | `lib/auth-constants.ts` | Módulo estático, no estado |
| 2 | Crear `AuthContext` con interfaz state/actions/meta | `contexts/auth-context.tsx` | Lazy init, try-catch, versioned keys, `use()` React 19 |
| 3 | Integrar `AuthProvider` en root layout | `app/layout.tsx` | Orden: Theme → Auth → Cart → Favorites |
| 4 | Modificar `login-form.tsx` | `components/auth/login-form.tsx` | `actions.login()`, discriminated result, narrowing |
| 5 | Modificar `user-button.tsx` | `components/auth/user-button.tsx` | `meta.isAdmin`, derived state en render |
| 6 | Crear admin layout + guard + error/not-found | `app/(admin)/` | Server/Client split, Suspense, error boundaries |
| 7 | Crear `AdminLayout` compound component | `components/admin/admin-layout.tsx` | Compound, state/actions/meta, functional setState |
| 8 | Crear sidebar + header | `components/admin/admin-sidebar.tsx`, `admin-header.tsx` | `usePathname()` con Suspense |
| 9 | Añadir rutas admin a `lib/routes.ts` | `lib/routes.ts` | Funciones helper para rutas dinámicas |

### Fase 2 — DataStore (Core)

| # | Tarea | Archivo | Práctica clave |
|---|---|---|---|
| 1 | Crear tipos en módulo dedicado | `lib/data-store.types.ts` | Discriminated unions, `as const`, `satisfies` |
| 2 | Implementar utilidades versionadas | `lib/data-store.utils.ts` | Versioned keys, try-catch, `crypto.randomUUID()` |
| 3 | Implementar `productsStore` | `lib/data-store.products.ts` | Map para O(1) lookups, immutabilidad |
| 4 | Implementar `ordersStore` | `lib/data-store.orders.ts` | Cache con invalidación, máquina de estados |
| 5 | Implementar `usersStore`, `blogStore`, `lookbookStore`, `configStore` | `lib/data-store.*.ts` | Mismo patrón |
| 6 | Crear seed data | `lib/seed-data.ts` | Lazy seed, solo si vacío |
| 7 | Crear `admin-permissions.ts` | `lib/admin-permissions.ts` | Matriz `satisfies Record<UserRole, string[]>` |

### Fase 3 — Dashboard

| # | Tarea | Práctica clave |
|---|---|---|
| 1 | `StatCard` component | Props tipadas, sin inline components |
| 2 | Dashboard page (server shell) | Metadata + Suspense + `next/dynamic` |
| 3 | KPIs | Derived state en render, sin useState/useEffect |
| 4 | Charts (lazy) | `dynamic(() => import(...), { ssr: false })` |
| 5 | Recent orders table | Client component con Suspense propio |
| 6 | `loading.tsx` | Skeleton para dashboard |

### Fases 4-9 — CRUD, Contenido, Configuración, Analytics, Refinamiento

(Mantener la estructura de fases del plan v1, aplicando las mismas prácticas: server shell + client content, Suspense granular, formularios con zod + react-hook-form, DataTable genérico, estados loading/empty/error en cada página.)

### Fase 10 — next.config.ts optimization

```ts
// next.config.ts — añadir
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-tooltip",
    ],
  },
};

export default nextConfig;
```

---

## 19. Checklist de implementación

### Auth
- [ ] `lib/auth-constants.ts` — credenciales + key versionada
- [ ] `contexts/auth-context.tsx` — state/actions/meta + `use()` React 19
- [ ] `app/layout.tsx` — AuthProvider en jerarquía de providers
- [ ] `components/auth/login-form.tsx` — `actions.login()`, discriminated result
- [ ] `components/auth/user-button.tsx` — `meta.isAdmin`, derived state

### Layout Admin
- [ ] `app/(admin)/layout.tsx` — Server metadata + client wrapper
- [ ] `app/(admin)/admin-layout-client.tsx` — Guard con loading/unauthenticated/authorized
- [ ] `app/(admin)/error.tsx` — Error boundary
- [ ] `app/(admin)/not-found.tsx` — 404 específico del admin
- [ ] `components/admin/admin-layout.tsx` — Compound components
- [ ] `components/admin/admin-sidebar.tsx` — Navegación + responsive
- [ ] `components/admin/admin-header.tsx` — Breadcrumb con Suspense

### Data Layer
- [ ] `lib/data-store.types.ts` — Todos los tipos
- [ ] `lib/data-store.utils.ts` — read/write/generateId versionados
- [ ] `lib/data-store.products.ts` — Products store
- [ ] `lib/data-store.orders.ts` — Orders store con máquina de estados
- [ ] `lib/data-store.users.ts` — Users store
- [ ] `lib/data-store.blog.ts` — Blog store
- [ ] `lib/data-store.lookbook.ts` — Lookbook store
- [ ] `lib/data-store.config.ts` — Config store
- [ ] `lib/seed-data.ts` — Seed inicial
- [ ] `lib/admin-permissions.ts` — Matriz de permisos

### Dashboard
- [ ] `app/(admin)/admin/page.tsx` — Server shell
- [ ] `app/(admin)/admin/loading.tsx` — Skeleton
- [ ] `components/admin/stat-card.tsx`
- [ ] Charts: `next/dynamic`, `ssr: false`

### Productos
- [ ] `app/(admin)/admin/productos/page.tsx`
- [ ] `app/(admin)/admin/productos/nuevo/page.tsx`
- [ ] `app/(admin)/admin/productos/[id]/page.tsx`
- [ ] `components/admin/data-table.tsx`
- [ ] `components/admin/product-form.tsx`
- [ ] `components/admin/image-uploader.tsx`
- [ ] `components/admin/confirm-dialog.tsx`

### Pedidos
- [ ] `app/(admin)/admin/pedidos/page.tsx`
- [ ] `app/(admin)/admin/pedidos/[id]/page.tsx`
- [ ] `components/admin/order-status-badge.tsx`
- [ ] `components/admin/order-detail.tsx`

### Usuarios
- [ ] `app/(admin)/admin/usuarios/page.tsx`
- [ ] `app/(admin)/admin/usuarios/[id]/page.tsx`

### Contenido
- [ ] `app/(admin)/admin/contenido/page.tsx`
- [ ] `app/(admin)/admin/contenido/blog/*` (3 páginas)
- [ ] `app/(admin)/admin/contenido/lookbook/*` (3 páginas)
- [ ] `components/admin/blog-post-form.tsx`
- [ ] `components/admin/lookbook-form.tsx`

### Configuración y Analytics
- [ ] `app/(admin)/admin/configuracion/page.tsx`
- [ ] `app/(admin)/admin/analytics/page.tsx`
- [ ] `components/admin/site-config-form.tsx`

### Optimización
- [ ] `next.config.ts` — `optimizePackageImports`
- [ ] `loading.tsx` en cada segmento de ruta admin
- [ ] `error.tsx` en cada segmento con operaciones riesgosas

---

## Apéndice A: Decisiones de arquitectura y trade-offs

### ¿Por qué no NextAuth/Auth.js?

Para este caso (admin local, sin backend), NextAuth sería sobre-ingeniería. No hay base de datos, no hay OAuth providers, no hay sesiones de servidor. Un Context + localStorage es más simple, más rápido de implementar, y más fácil de reemplazar cuando llegue el backend.

**Migración futura**: Cambiar `AuthProvider` interno para llamar a la API de NestJS. La interfaz `{ state, actions, meta }` no cambia.

### ¿Por qué `use()` en vez de `useContext()`?

React 19 recomienda `use()` para leer contexto. Ventajas:
- Puede usarse en condicionales y loops.
- Señal al compilador de React de que es una lectura de contexto pura.
- Preparado para el futuro (React Forget/compiler).

### ¿Por qué Server Components como shell?

- **SEO/metadata**: admin no necesita SEO, pero la práctica de server shell es consistente con el resto de la app.
- **Bundle size**: el JS del dashboard/charts no se envía hasta que `next/dynamic` lo carga en cliente.
- **Suspense granular**: la estructura de la página (sidebar, header, título) se renderiza instantáneamente. Solo los datos esperan.

### ¿Por qué DataStore modular sin barrel?

`import { productsStore } from "@/lib/data-store.products"` solo carga ~2KB de JS. Si usáramos `import { DataStore } from "@/lib/data-store"`, el bundler tendría que incluir TODOS los módulos (products, orders, users, blog, lookbook, config) aunque la página solo necesite productos.

### ¿Por qué no `@tanstack/react-table`?

Sería óptimo para tablas complejas, pero el principio es **sin dependencias nuevas**. Se puede implementar filtrado, sort y paginación con `useMemo` + `useDeferredValue`. Si en el futuro se instala, reemplazar la implementación manual sin cambiar la API del componente `DataTable`.

---

## Apéndice B: Migración futura a backend real

Cuando `apps/api/` (NestJS) tenga endpoints reales, estos son los únicos archivos que cambian:

| Capa | Cambio | Impacto |
|---|---|---|
| `AuthProvider` | `login()` → `POST /api/auth/login`, `logout()` → `POST /api/auth/logout` | 1 archivo |
| `DataStore.products` | `getAll()` → `fetch("/api/products")` con SWR | 1 archivo por módulo |
| `DataStore.*` | Cada método → llamada HTTP correspondiente | Solo lib/data-store.*.ts |
| `AdminLayout` | Sin cambios (lee contexto, no implementación) | 0 archivos |
| `LoginForm`, `UserButton` | Sin cambios (consumen interfaz) | 0 archivos |
| Páginas admin | Server Components pueden hacer fetch directo | Migración progresiva |

**Estrategia**: Implementar un adapter pattern donde `DataStore` internamente decide si usar localStorage o HTTP según una variable de entorno. Esto permite migrar módulo por módulo sin romper nada.

---

> **Próximo paso**: Iniciar implementación por **Fase 1** (Auth + Layout Base). Seguir el patrón: server shell → client content, Suspense granular, formularios con zod, y `optimizePackageImports` desde el día 1.
