"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { User as UserIcon } from "lucide-react";
import { useStoreData } from "@/hooks/use-store-data";
import { usersStore } from "@/lib/stores/data-store.users";
import { ordersStore } from "@/lib/stores/data-store.orders";
import type { User } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { Badge } from "@/components/ui/badge";
import { SortableHeader, defaultSort, type SortState } from "@/components/admin/sortable-header";

export function UsuariosClient() {
  const users = useStoreData(() => usersStore.getAll(), [] as User[]);
  const [adminSort, setAdminSort] = useState<SortState>(defaultSort);
  const [customerSort, setCustomerSort] = useState<SortState>(defaultSort);

  const orderCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of ordersStore.getAll()) {
      map.set(order.userId, (map.get(order.userId) ?? 0) + 1);
    }
    return map;
  }, []);

  const adminUsers = useMemo(() => {
    let result = users.filter((u) => u.role === "admin");
    if (adminSort.field) {
      result = [...result].sort((a, b) => {
        const dir = adminSort.direction === "asc" ? 1 : -1;
        switch (adminSort.field) {
          case "name": return dir * a.name.localeCompare(b.name);
          case "email": return dir * a.email.localeCompare(b.email);
          case "role": return dir * a.role.localeCompare(b.role);
          case "createdAt": return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          default: return 0;
        }
      });
    }
    return result;
  }, [users, adminSort]);

  const customerUsers = useMemo(() => {
    let result = users.filter((u) => u.role === "customer");
    if (customerSort.field) {
      result = [...result].sort((a, b) => {
        const dir = customerSort.direction === "asc" ? 1 : -1;
        switch (customerSort.field) {
          case "name": return dir * a.name.localeCompare(b.name);
          case "email": return dir * a.email.localeCompare(b.email);
          case "pedidos": {
            const ca = orderCountMap.get(a.id) ?? 0;
            const cb = orderCountMap.get(b.id) ?? 0;
            return dir * (ca - cb);
          }
          case "createdAt": return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          default: return 0;
        }
      });
    }
    return result;
  }, [users, customerSort, orderCountMap]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-heading">Clientes</h1>
        <p className="text-sm text-muted-foreground">{users.length} clientes registrados</p>
      </div>

      
      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 pb-3">
          <h2 className="text-sm font-semibold">Administradores ({adminUsers.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-border text-left text-xs text-muted-foreground">
                <SortableHeader label="Usuario" field="name" currentSort={adminSort} onSortChange={setAdminSort} />
                <SortableHeader label="Email" field="email" currentSort={adminSort} onSortChange={setAdminSort} />
                <SortableHeader label="Rol" field="role" currentSort={adminSort} onSortChange={setAdminSort} />
                <SortableHeader label="Registro" field="createdAt" currentSort={adminSort} onSortChange={setAdminSort} />
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((user) => (
                <tr key={user.id} className="border-t border-border text-sm hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-accent/10 flex items-center justify-center">
                        <UserIcon className="size-4 text-accent" />
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{user.email}</td>
                  <td className="px-3 py-2">
                    <Badge variant="default" className="text-xs">Admin</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("es-PE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      
      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 pb-3">
          <h2 className="text-sm font-semibold">Clientes ({customerUsers.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-border text-left text-xs text-muted-foreground">
                <SortableHeader label="Usuario" field="name" currentSort={customerSort} onSortChange={setCustomerSort} />
                <SortableHeader label="Email" field="email" currentSort={customerSort} onSortChange={setCustomerSort} />
                <SortableHeader label="Pedidos" field="pedidos" currentSort={customerSort} onSortChange={setCustomerSort} />
                <SortableHeader label="Registro" field="createdAt" currentSort={customerSort} onSortChange={setCustomerSort} />
              </tr>
            </thead>
            <tbody>
              {customerUsers.map((user) => {
                const userOrderCount = orderCountMap.get(user.id) ?? 0;
                return (
                  <tr key={user.id} className="border-t border-border text-sm hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Link href={ROUTES.adminUsuarioDetalle(user.id)} className="flex items-center gap-3 hover:text-accent">
                      <div className="size-9 rounded-full bg-muted flex items-center justify-center">
                        <UserIcon className="size-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </Link>
                  </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{user.email}</td>
                    <td className="px-3 py-2">{userOrderCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("es-PE")}
                    </td>
                  </tr>
                );
              })}
              {customerUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No hay clientes registrados aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
