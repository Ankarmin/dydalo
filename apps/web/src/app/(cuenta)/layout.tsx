"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, User, Package, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useMounted } from "@/hooks/use-mounted";
import { ROUTES } from "@/lib/utils/routes";
import { cn } from "@/lib/utils/utils";

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
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();
  const { state, meta } = useAuth();

  useEffect(() => {
    if (!mounted) return;
    if (state.status === "authenticated" && meta.isAdmin) {
      router.replace(ROUTES.admin);
    }
    if (state.status === "unauthenticated") {
      router.replace(ROUTES.login);
    }
  }, [mounted, state.status, meta.isAdmin, router]);

  const canShowAccount = mounted && state.status === "authenticated" && !meta.isAdmin;

  if (!canShowAccount) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl section-px py-24">
      <div className="flex flex-col gap-8 md:flex-row">
        <nav
          className="w-full shrink-0 md:w-56"
          aria-label="Navegación de cuenta"
        >
          <h2 className="mb-6 text-xl font-bold tracking-heading border-b-2 border-favorite pb-3">
            MI CUENTA
          </h2>
          <div className="flex flex-row gap-2 md:flex-col">
            {accountNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 rounded-md px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-dropdown transition-colors hover:bg-accent/10 hover:text-accent",
                    isActive && "bg-accent/10 text-accent",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
