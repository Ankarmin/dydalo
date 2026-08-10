"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LOGO_DARK, LOGO_LIGHT } from "@/config/constants";
import {
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  MessageCircle,
  Package,
  ShieldCheck,
  Tags,
  FileText,
  ShoppingCart,
  Users,
  ArrowLeft,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useAdminLayout } from "./admin-layout";
import { showLogoutToast } from "@/components/auth/auth-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/lib/utils/routes";
import { cn } from "@/lib/utils/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Panel",
    href: ROUTES.admin,
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Analíticas",
    href: ROUTES.adminAnaliticas,
    icon: BarChart3,
  },
  {
    label: "Inventario",
    href: ROUTES.adminInventario,
    icon: ClipboardList,
  },
  {
    label: "Productos",
    href: ROUTES.adminProductos,
    icon: Package,
  },
  {
    label: "Categorías",
    href: ROUTES.adminCategorias,
    icon: Tags,
  },
  {
    label: "Pedidos",
    href: ROUTES.adminPedidos,
    icon: ShoppingCart,
  },
  {
    label: "Clientes",
    href: ROUTES.adminUsuarios,
    icon: Users,
  },
  {
    label: "Auditoría",
    href: ROUTES.adminAuditoria,
    icon: ShieldCheck,
  },
  {
    label: "FAQ",
    href: ROUTES.adminFaq,
    icon: MessageCircle,
  },
  {
    label: "Blog",
    href: ROUTES.adminBlog,
    icon: FileText,
  },
] as const;

export function AdminSidebar() {
  const { state: layoutState, actions: layoutActions } = useAdminLayout();
  const { actions: authActions } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = layoutState.sidebarCollapsed;

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  function handleLogout() {
    authActions.logout();
    showLogoutToast();
    router.push(ROUTES.home);
  }

  const sidebarContent = (
    <div className={cn("flex h-full flex-col", collapsed && "items-center")}>
      <ScrollArea className="flex-1 min-h-0 px-2 py-3">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => layoutActions.setMobileSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/10 hover:text-accent",
                collapsed && "justify-center px-2",
                isActive(item.href, item.exact)
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      <div className={cn("flex flex-col gap-1 p-2 shrink-0", collapsed && "items-center")}>
        <Link
          href={ROUTES.home}
          onClick={() => layoutActions.setMobileSidebarOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent",
            collapsed && "justify-center px-2"
          )}
        >
          <ArrowLeft className="size-4 shrink-0" />
          {!collapsed && <span>Volver a la tienda</span>}
        </Link>
        <button
          type="button"
          onClick={() => { layoutActions.setMobileSidebarOpen(false); handleLogout(); }}
          aria-label="Cerrar sesión"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive w-full",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-background transition-all duration-200",
          collapsed ? "w-[60px]" : "w-[240px]"
        )}
      >
        <div className={cn("flex h-16 items-center justify-center gap-2 px-4 shrink-0 border-b-2 border-favorite bg-background/85 backdrop-blur-xl", collapsed && "px-3")}>
          {!collapsed && (
            <Link href={ROUTES.home} className="flex items-center gap-2">
              <Image src={LOGO_DARK} alt="DYDALO" width={120} height={28} className="h-7 w-auto logo-dark" />
              <Image src={LOGO_LIGHT} alt="DYDALO" width={120} height={28} className="h-7 w-auto logo-light" />
              <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">
                ADMIN
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href={ROUTES.home} className="flex items-center justify-center">
              <Image src={LOGO_DARK} alt="DYDALO" width={36} height={9} className="h-2.5 w-auto logo-dark" />
              <Image src={LOGO_LIGHT} alt="DYDALO" width={36} height={9} className="h-2.5 w-auto logo-light" />
            </Link>
          )}
        </div>
        {sidebarContent}
      </aside>

      
      {layoutState.mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-overlay"
            onClick={() => layoutActions.setMobileSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-background shadow-xl animate-in slide-in-from-left duration-200 sm:w-[320px]">
            <div className="flex h-16 shrink-0 items-center justify-between border-b-2 border-favorite bg-background/85 px-4 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <Image src={LOGO_DARK} alt="DYDALO" width={120} height={28} className="h-7 w-auto logo-dark" />
                <Image src={LOGO_LIGHT} alt="DYDALO" width={120} height={28} className="h-7 w-auto logo-light" />
                <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">
                  ADMIN
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => layoutActions.setMobileSidebarOpen(false)}
                aria-label="Cerrar menú"
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="flex-1 min-h-0">{sidebarContent}</div>
          </aside>
        </div>
      )}
    </>
  );
}
