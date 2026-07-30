"use client";

import { Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, LogOut, User, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useAdminLayout } from "./admin-layout";
import { showLogoutToast } from "@/components/auth/auth-toast";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/utils/routes";
import { cn } from "@/lib/utils/utils";

function AdminBreadcrumb() {
  const pathname = usePathname();

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .slice(1);

  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Dashboard</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-sm min-w-0 overflow-hidden">
      <span className="text-muted-foreground shrink-0">Admin</span>
      {segments.map((segment, i) => {
        const isLast = i === segments.length - 1;
        const label = segment.charAt(0).toUpperCase() + segment.slice(1);
        return (
          <div key={segment} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="size-3 text-muted-foreground shrink-0" />
            <span className={cn("truncate", isLast ? "font-medium" : "text-muted-foreground")}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function BreadcrumbSkeleton() {
  return <div className="h-5 w-40 animate-pulse rounded bg-muted" />;
}

export function AdminHeader() {
  const { state: layoutState, actions: layoutActions } = useAdminLayout();
  const { state: authState, actions: authActions } = useAuth();
  const router = useRouter();

  function handleLogout() {
    authActions.logout();
    showLogoutToast();
    router.push(ROUTES.home);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b-2 border-favorite bg-background/85 backdrop-blur-xl px-4 lg:px-6">
      
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => layoutActions.setMobileSidebarOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </Button>

      
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:flex"
        onClick={layoutActions.toggleSidebar}
        aria-label={layoutState.sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {layoutState.sidebarCollapsed ? (
          <PanelLeftOpen className="size-5" />
        ) : (
          <PanelLeftClose className="size-5" />
        )}
      </Button>

      
      <div className="flex-1 min-w-0">
        <Suspense fallback={<BreadcrumbSkeleton />}>
          <AdminBreadcrumb />
        </Suspense>
      </div>

      
      <ThemeToggle />

      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Menú de usuario">
            <User className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {authState.user && (
            <>
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">{authState.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{authState.user.email}</p>
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem asChild>
            <a href={ROUTES.home} className="cursor-pointer">
              Ver tienda
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="size-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
