# Implementación Visual de Login y Cuenta — Documento Técnico (Frontend Only)

> **Versión:** 2.0
> **Fecha:** 18 Jun 2026
> **Stack:** Next.js 16 (App Router) + react-hook-form + zod + shadcn/ui
> **Objetivo:** Construir toda la capa visual de autenticación y cuenta de usuario. Sin backend, sin base de datos, sin Auth.js. Los formularios son UI funcional con validación que muestra toasts simulando acciones. El backend se integrará en iteración futura sin cambiar la UI.

---

## Tabla de contenidos

1. [Visión general](#1-visión-general)
2. [Rutas nuevas](#2-rutas-nuevas)
3. [Estructura de archivos](#3-estructura-de-archivos)
4. [Componentes a crear](#4-componentes-a-crear)
5. [Layout de auth — `(auth)/layout.tsx`](#5-layout-de-auth)
6. [Login — `(auth)/login/page.tsx`](#6-login)
7. [Registro — `(auth)/registro/page.tsx`](#7-registro)
8. [Recuperar password — `(auth)/recuperar-password/page.tsx`](#8-recuperar-password)
9. [Layout de cuenta — `(cuenta)/layout.tsx`](#9-layout-de-cuenta)
10. [Mi Cuenta — `(cuenta)/cuenta/page.tsx`](#10-mi-cuenta)
11. [Pedidos — `(cuenta)/cuenta/pedidos/page.tsx`](#11-pedidos)
12. [Direcciones — `(cuenta)/cuenta/direcciones/page.tsx`](#12-direcciones)
13. [UserButton — Reemplazo del icono placeholder en el header](#13-userbutton)
14. [Integración en el header](#14-integración-en-el-header)
15. [Checklist de implementación](#15-checklist-de-implementación)

---

## 1. Visión general

Todo el sistema visual de login y cuenta se construye como **UI pura** con formularios funcionales (validación, estados de carga simulados, toasts). Cuando llegue el backend, solo habrá que:

1. Cambiar los `onSubmit` por Server Actions reales
2. Reemplazar datos mock por `auth()` / `useSession()`
3. Activar `middleware.ts`

La UI no cambia. Cero refactor.

### Principios

| Principio | Aplicación |
|---|---|
| **Validación real** | `react-hook-form` + `zod` en todos los formularios |
| **Toasts simulados** | `sonner` (ya instalado) para feedback de acciones |
| **Estados visuales** | Loading spinners, mensajes de error, disabled states |
| **Dark mode** | Todos los componentes funcionan con el tema actual |
| **Responsive** | Funciona en mobile, tablet y desktop |
| **Sin dependencias nuevas** | Solo se usa lo ya instalado |

---

## 2. Rutas nuevas

Ya agregadas a `lib/routes.ts`:

```ts
// Auth
login: "/login"
registro: "/registro"
recuperarPassword: "/recuperar-password"
nuevaPassword: "/nueva-password"

// Cuenta (protegidas en el futuro)
cuenta: "/cuenta"
pedidos: "/cuenta/pedidos"
direcciones: "/cuenta/direcciones"

// Admin (futuro)
admin: "/admin"
adminProductos: "/admin/productos"
adminPedidos: "/admin/pedidos"
```

### Route groups de Next.js

```
app/
├── (auth)/                    # Layout con logo centrado, fondo neutro
│   ├── login/page.tsx
│   ├── registro/page.tsx
│   └── recuperar-password/page.tsx
└── (cuenta)/                  # Layout con sidebar de navegación
    └── cuenta/
        ├── page.tsx           # Perfil / dashboard
        ├── pedidos/page.tsx
        └── direcciones/page.tsx
```

---

## 3. Estructura de archivos

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── registro/
│   │   │   └── page.tsx
│   │   └── recuperar-password/
│   │       └── page.tsx
│   └── (cuenta)/
│       ├── layout.tsx
│       └── cuenta/
│           ├── page.tsx
│           ├── pedidos/
│           │   └── page.tsx
│           └── direcciones/
│               └── page.tsx
├── components/
│   └── auth/
│       ├── login-form.tsx
│       ├── register-form.tsx
│       ├── recover-password-form.tsx
│       └── user-button.tsx
└── lib/
    └── validations/
        └── auth.ts           # Schemas Zod (solo validación, sin BD)
```

---

## 4. Componentes a crear

| Componente | Archivo | Tipo |
|---|---|---|
| `AuthLayout` | `app/(auth)/layout.tsx` | Server Component |
| `LoginPage` | `app/(auth)/login/page.tsx` | Server Component (wrapper) |
| `LoginForm` | `components/auth/login-form.tsx` | Client Component |
| `RegisterPage` | `app/(auth)/registro/page.tsx` | Server Component (wrapper) |
| `RegisterForm` | `components/auth/register-form.tsx` | Client Component |
| `RecoverPasswordPage` | `app/(auth)/recuperar-password/page.tsx` | Server Component (wrapper) |
| `RecoverPasswordForm` | `components/auth/recover-password-form.tsx` | Client Component |
| `CuentaLayout` | `app/(cuenta)/layout.tsx` | Server Component |
| `CuentaPage` | `app/(cuenta)/cuenta/page.tsx` | Server Component |
| `PedidosPage` | `app/(cuenta)/cuenta/pedidos/page.tsx` | Server Component |
| `DireccionesPage` | `app/(cuenta)/cuenta/direcciones/page.tsx` | Server Component |
| `UserButton` | `components/auth/user-button.tsx` | Client Component |
| `authSchemas` | `lib/validations/auth.ts` | Zod schemas |

---

## 5. Layout de auth — `(auth)/layout.tsx`

```tsx
// apps/web/app/(auth)/layout.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LOGO_DARK, LOGO_LIGHT } from "@/lib/constants";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: {
    template: "%s — DYDALO",
    default: "Cuenta — DYDALO",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-20">
      <div className="w-full max-w-md space-y-8">
        <Link
          href={ROUTES.home}
          className="mx-auto block w-fit"
          aria-label="DYDALO inicio"
        >
          <Image
            src={LOGO_DARK}
            alt="DYDALO"
            width={160}
            height={37}
            className="h-9 w-auto logo-dark"
          />
          <Image
            src={LOGO_LIGHT}
            alt="DYDALO"
            width={160}
            height={37}
            className="h-9 w-auto logo-light"
          />
        </Link>
        {children}
      </div>
    </main>
  );
}
```

---

## 6. Login — `(auth)/login/page.tsx`

### 6.1 Página wrapper

```tsx
// apps/web/app/(auth)/login/page.tsx
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar Sesión",
};

export default function LoginPage() {
  return <LoginForm />;
}
```

### 6.2 LoginForm — `components/auth/login-form.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/lib/routes";

const MOCK_CREDENTIALS = { email: "demo@dydalo.com", password: "Demo1234" };

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginInput) {
    setError(null);
    setIsPending(true);

    setTimeout(() => {
      if (
        values.email === MOCK_CREDENTIALS.email &&
        values.password === MOCK_CREDENTIALS.password
      ) {
        toast.success("Iniciaste sesión correctamente");
        router.push(ROUTES.cuenta);
      } else {
        setError("Email o contraseña incorrectos");
        setIsPending(false);
      }
    }, 1200);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-[-0.03em]">
          INICIAR SESIÓN
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bienvenido de vuelta a tu flow.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Contraseña</FormLabel>
                  <Link
                    href={ROUTES.recuperarPassword}
                    className="text-[11px] text-muted-foreground underline underline-offset-4 hover:text-accent"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isPending}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            INICIAR SESIÓN
          </Button>
        </form>
      </Form>

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          O
        </span>
      </div>

      <Button variant="outline" className="w-full" disabled>
        <svg className="mr-2 size-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continuar con Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link
          href={ROUTES.registro}
          className="font-bold underline underline-offset-4 hover:text-accent"
        >
          REGÍSTRATE
        </Link>
      </p>
    </div>
  );
}
```

---

## 7. Registro — `(auth)/registro/page.tsx`

### 7.1 Página wrapper

```tsx
// apps/web/app/(auth)/registro/page.tsx
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Crear Cuenta",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
```

### 7.2 RegisterForm — `components/auth/register-form.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/lib/routes";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  function onSubmit(_values: RegisterInput) {
    setIsPending(true);

    setTimeout(() => {
      toast.success("Cuenta creada correctamente");
      router.push(ROUTES.cuenta);
    }, 1200);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-[-0.03em]">
          CREAR CUENTA
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Únete al flow de DYDALO.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Tu nombre"
                    autoComplete="name"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      disabled={isPending}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar contraseña</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            CREAR CUENTA
          </Button>
        </form>
      </Form>

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          O
        </span>
      </div>

      <Button variant="outline" className="w-full" disabled>
        <svg className="mr-2 size-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continuar con Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link
          href={ROUTES.login}
          className="font-bold underline underline-offset-4 hover:text-accent"
        >
          INICIAR SESIÓN
        </Link>
      </p>
    </div>
  );
}
```

---

## 8. Recuperar password — `(auth)/recuperar-password/page.tsx`

### 8.1 Página wrapper

```tsx
// apps/web/app/(auth)/recuperar-password/page.tsx
import type { Metadata } from "next";
import { RecoverPasswordForm } from "@/components/auth/recover-password-form";

export const metadata: Metadata = {
  title: "Recuperar Contraseña",
};

export default function RecoverPasswordPage() {
  return <RecoverPasswordForm />;
}
```

### 8.2 RecoverPasswordForm — `components/auth/recover-password-form.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/routes";

export function RecoverPasswordForm() {
  const [sent, setSent] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(_values: ResetPasswordInput) {
    setIsPending(true);

    setTimeout(() => {
      toast.success("Email enviado. Revisa tu bandeja de entrada.");
      setSent(true);
      setIsPending(false);
    }, 1500);
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <Mail className="mx-auto size-12 text-accent" strokeWidth={1.5} />
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.03em]">
            REVISA TU EMAIL
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Te enviamos un link para restablecer tu contraseña. Si no lo ves,
            revisa tu carpeta de spam.
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
          Reenviar email
        </Button>
        <Link
          href={ROUTES.login}
          className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-accent"
        >
          <ArrowLeft className="size-4" />
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-[-0.03em]">
          RECUPERAR CONTRASEÑA
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ingresa tu email y te enviaremos un link para restablecerla.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            ENVIAR LINK
          </Button>
        </form>
      </Form>

      <Link
        href={ROUTES.login}
        className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-accent"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio de sesión
      </Link>
    </div>
  );
}
```

---

## 9. Layout de cuenta — `(cuenta)/layout.tsx`

```tsx
// apps/web/app/(cuenta)/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { User, Package, MapPin } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: {
    template: "%s — DYDALO",
    default: "Mi Cuenta — DYDALO",
  },
};

const accountNav = [
  { href: ROUTES.cuenta, label: "Mi Cuenta", icon: User },
  { href: ROUTES.pedidos, label: "Mis Pedidos", icon: Package },
  { href: ROUTES.direcciones, label: "Direcciones", icon: MapPin },
];

export default function CuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-24 md:px-10">
      <div className="flex flex-col gap-8 md:flex-row">
        <nav
          className="w-full shrink-0 md:w-56"
          aria-label="Navegación de cuenta"
        >
          <h2 className="mb-6 text-xl font-bold tracking-[-0.03em]">
            MI CUENTA
          </h2>
          <div className="flex flex-row gap-2 md:flex-col">
            {accountNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold uppercase tracking-[0.12em] transition-colors hover:bg-accent/10 hover:text-accent",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
```

---

## 10. Mi Cuenta — `(cuenta)/cuenta/page.tsx`

```tsx
// apps/web/app/(cuenta)/cuenta/page.tsx
import type { Metadata } from "next";
import { Mail, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Mi Cuenta",
};

export default function CuentaPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.03em]">MI PERFIL</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona tu información personal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold uppercase tracking-[0.1em]">
            Información personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="size-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Nombre de usuario</p>
              <p className="text-sm text-muted-foreground">
                Disponible al conectar con backend
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="size-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                Disponible al conectar con backend
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold uppercase tracking-[0.1em]">
            Pedidos recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aún no tienes pedidos. Cuando realices tu primera compra aparecerán aquí.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={ROUTES.catalogo}>VER CATÁLOGO</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 11. Pedidos — `(cuenta)/cuenta/pedidos/page.tsx`

```tsx
// apps/web/app/(cuenta)/cuenta/pedidos/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Mis Pedidos",
};

export default function PedidosPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.03em]">MIS PEDIDOS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historial de tus compras en DYDALO.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-border py-16 text-center">
        <Package
          className="mb-4 size-12 text-muted-foreground"
          strokeWidth={1.25}
        />
        <p className="text-lg font-bold">NO TIENES PEDIDOS</p>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Aún no has realizado ninguna compra. Explora el catálogo y encuentra tu flow.
        </p>
        <Button variant="outline" className="mt-6" asChild>
          <Link href={ROUTES.catalogo}>VER CATÁLOGO</Link>
        </Button>
      </div>
    </div>
  );
}
```

---

## 12. Direcciones — `(cuenta)/cuenta/direcciones/page.tsx`

```tsx
// apps/web/app/(cuenta)/cuenta/direcciones/page.tsx
import type { Metadata } from "next";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Direcciones",
};

export default function DireccionesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.03em]">
            DIRECCIONES
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona tus direcciones de envío.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nueva</span>
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-border py-16 text-center">
        <MapPin
          className="mb-4 size-12 text-muted-foreground"
          strokeWidth={1.25}
        />
        <p className="text-lg font-bold">NO TIENES DIRECCIONES</p>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Agrega una dirección para agilizar tus compras futuras.
        </p>
        <Button variant="outline" className="mt-6" disabled>
          <Plus className="size-4" />
          AGREGAR DIRECCIÓN
        </Button>
      </div>
    </div>
  );
}
```

---

## 13. UserButton — Reemplazo del icono placeholder en el header

```tsx
// apps/web/components/auth/user-button.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { User, LogOut, Package, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/routes";

export function UserButton() {
  const [isLoggedIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function handleLogout() {
    setIsLoggingOut(true);
    setTimeout(() => {
      toast.success("Sesión cerrada");
      setIsLoggingOut(false);
    }, 800);
  }

  if (!isLoggedIn) {
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
          <p className="text-sm font-medium truncate">Usuario DYDALO</p>
          <p className="text-xs text-muted-foreground truncate">
            usuario@dydalo.com
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ROUTES.cuenta} className="cursor-pointer">
            <User className="size-4" />
            Mi Cuenta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUTES.pedidos} className="cursor-pointer">
            <Package className="size-4" />
            Mis Pedidos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUTES.direcciones} className="cursor-pointer">
            <MapPin className="size-4" />
            Direcciones
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer"
        >
          {isLoggingOut ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 14. Integración en el header

### 14.1 Reemplazar el botón User placeholder

En `site-header.tsx`, cambiar:

```tsx
// Antes:
<Button variant="ghost" size="icon" aria-label="Mi cuenta" className="hidden lg:inline-flex">
  <User />
</Button>

// Después:
import { UserButton } from "@/components/auth/user-button";
// ...
<UserButton />
```

> **Nota:** `UserButton` ya incluye su propio `Button` wrapper, por lo que no necesita el `className="hidden lg:inline-flex"` — se muestra en todos los breakpoints. El botón redirige a `/login` si no hay sesión.

### 14.2 Actualizar menú móvil (Sheet)

Los botones BUSCAR y FAVORITOS se mantienen igual. MI CUENTA debe redirigir a `/login`:

```tsx
// En el menú móvil, cambiar el botón MI CUENTA por un Link:
<SheetClose asChild>
  <Link
    href={ROUTES.login}
    className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-accent/10 hover:text-accent"
  >
    <User className="size-4" />
    MI CUENTA
  </Link>
</SheetClose>
```

### 14.3 Validaciones Zod (`lib/validations/auth.ts`)

```ts
// apps/web/lib/validations/auth.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Email inválido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(50, "El nombre no puede exceder 50 caracteres"),
    email: z
      .string()
      .min(1, "El email es requerido")
      .email("Email inválido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[0-9]/, "Debe contener al menos un número"),
    confirmPassword: z
      .string()
      .min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Email inválido"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

---

## 15. Checklist de implementación

### Fase 1 — Schemas y validaciones

- [ ] Crear `lib/validations/auth.ts` con schemas Zod

### Fase 2 — Páginas de auth

- [ ] Crear `app/(auth)/layout.tsx`
- [ ] Crear `app/(auth)/login/page.tsx`
- [ ] Crear `components/auth/login-form.tsx`
- [ ] Crear `app/(auth)/registro/page.tsx`
- [ ] Crear `components/auth/register-form.tsx`
- [ ] Crear `app/(auth)/recuperar-password/page.tsx`
- [ ] Crear `components/auth/recover-password-form.tsx`

### Fase 3 — UserButton

- [ ] Crear `components/auth/user-button.tsx`
- [ ] Reemplazar botón User placeholder en `site-header.tsx`
- [ ] Actualizar enlace MI CUENTA en el menú móvil (Sheet)

### Fase 4 — Páginas de cuenta

- [ ] Crear `app/(cuenta)/layout.tsx`
- [ ] Crear `app/(cuenta)/cuenta/page.tsx`
- [ ] Crear `app/(cuenta)/cuenta/pedidos/page.tsx`
- [ ] Crear `app/(cuenta)/cuenta/direcciones/page.tsx`

### Fase 5 — Verificación

- [ ] Build de Next.js sin errores
- [ ] TypeScript sin errores
- [ ] Verificar responsive en mobile, tablet y desktop
- [ ] Verificar dark mode en todas las páginas nuevas
- [ ] Verificar que el flujo visual es correcto (navegación entre páginas)

---

## Referencias

- [React Hook Form Docs](https://react-hook-form.com/get-started)
- [Zod Docs](https://zod.dev)
- [shadcn/ui Form Component](https://ui.shadcn.com/docs/components/form)
- [Sonner Toast](https://sonner.emilkowal.ski)
