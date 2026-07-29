"use client";

import { createContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { use } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

type AdminLayoutState = {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
};

type AdminLayoutActions = {
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
};

type AdminLayoutContextValue = {
  state: AdminLayoutState;
  actions: AdminLayoutActions;
};

const AdminLayoutContext = createContext<AdminLayoutContextValue | null>(null);

export function useAdminLayout(): AdminLayoutContextValue {
  const ctx = use(AdminLayoutContext);
  if (!ctx) throw new Error("useAdminLayout debe usarse dentro de AdminLayout");
  return ctx;
}

export function AdminLayout({ children }: { children: ReactNode }) {
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
      <div className="fixed inset-0 flex bg-background z-30">
        <AdminSidebar />
        <div className="flex flex-1 flex-col min-w-0 min-h-0">
          <AdminHeader />
          <main className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </AdminLayoutContext>
  );
}
