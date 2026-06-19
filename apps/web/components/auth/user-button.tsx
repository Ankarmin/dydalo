"use client";

import { useState } from "react";
import Link from "next/link";
import { User, LogOut, Package, MapPin, Loader2 } from "lucide-react";
import { showLogoutToast } from "@/components/auth/auth-toast";
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
      showLogoutToast();
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
