"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, LogOut, Package, MapPin, Loader2, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { showLogoutToast } from "@/components/auth/auth-toast";
import { useMounted } from "@/hooks/use-mounted";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/utils/routes";

export function UserButton() {
  const { state, meta, actions } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const mounted = useMounted();

  const isAuthenticated = mounted && state.status === "authenticated";

  function handleLogout() {
    setIsLoggingOut(true);
    actions.logout();
    showLogoutToast();
    router.push(ROUTES.home);
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Iniciar sesión" disabled>
        <User />
      </Button>
    );
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
          <p className="text-xs text-muted-foreground truncate">
            {state.user.email}
          </p>
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
        {!meta.isAdmin && (
          <>
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
          </>
        )}
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
