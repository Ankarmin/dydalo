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
    <div className="mx-auto max-w-6xl section-px py-24">
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
                  "flex items-center gap-2 sm:gap-3 rounded-md px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-[0.12em] transition-colors hover:bg-accent/10 hover:text-accent",
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
