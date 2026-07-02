"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, User as UserIcon } from "lucide-react";
import { usersStore } from "@/lib/data-store.users";
import { ordersStore } from "@/lib/data-store.orders";
import type { User } from "@/lib/data-store";
import { ROUTES } from "@/lib/routes";
import { Badge } from "@/components/ui/badge";

export function UsuariosClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUsers(usersStore.getAll());
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  const customerUsers = users.filter((u) => u.role === "customer");
  const adminUsers = users.filter((u) => u.role === "admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-heading">Clientes</h1>
        <p className="text-sm text-muted-foreground">{users.length} clientes registrados</p>
      </div>

      {/* Admin */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 pb-3">
          <h2 className="text-sm font-semibold">Administradores ({adminUsers.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Registro</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((user) => (
                <tr key={user.id} className="border-t border-border text-sm hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-accent/10 flex items-center justify-center">
                        <UserIcon className="size-4 text-accent" />
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="default" className="text-xs">Admin</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {new Date(user.createdAt).toLocaleDateString("es-PE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clientes */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 pb-3">
          <h2 className="text-sm font-semibold">Clientes ({customerUsers.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Pedidos</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Registro</th>
              </tr>
            </thead>
            <tbody>
              {customerUsers.map((user) => {
                const userOrders = ordersStore.getByUserId(user.id);
                return (
                  <tr key={user.id} className="border-t border-border text-sm hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={ROUTES.adminUsuarioDetalle(user.id)} className="flex items-center gap-3 hover:text-accent">
                      <div className="size-9 rounded-full bg-muted flex items-center justify-center">
                        <UserIcon className="size-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </Link>
                  </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{user.email}</td>
                    <td className="px-4 py-3">{userOrders.length}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
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
