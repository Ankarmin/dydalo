"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { suppliersStore } from "@/lib/stores/data-store.suppliers";
import { purchasesStore } from "@/lib/stores/data-store.purchases";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { cn } from "@/lib/utils/utils";

export function ProveedoresClient() {
  const { state: authState } = useAuth();
  const [, setTick] = useState(0);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const suppliers = suppliersStore.getAll();
  const purchases = purchasesStore.getAll();

  function reload() {
    setTick((n) => n + 1);
  }

  function actor() {
    return { actorId: authState.user?.id ?? "admin", actorName: authState.user?.name ?? "Admin" };
  }

  function handleCreate() {
    if (!name.trim()) {
      notifyAdmin("Falta nombre", "El proveedor necesita un nombre.", "error");
      return;
    }
    suppliersStore.create({ name, contact, phone, notes, ...actor() });
    setName("");
    setContact("");
    setPhone("");
    setNotes("");
    reload();
    notifyAdmin("Proveedor creado", name.trim(), "success");
  }

  function toggleActive(id: string, active: boolean) {
    const a = actor();
    suppliersStore.update(id, { active: !active, actorId: a.actorId, actorName: a.actorName });
    reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-heading">Proveedores</h1>
        <p className="text-sm text-muted-foreground">
          {suppliers.filter((s) => s.active).length} activos · {purchases.filter((p) => p.status === "pendiente" || p.status === "parcial").length} OC por recibir
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">Nuevo proveedor</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Gamarra Juan" />
          </div>
          <div>
            <Label>Contacto</Label>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Nombre del contacto" />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+51 ..." />
          </div>
          <div>
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: entrega en 3 días" />
          </div>
        </div>
        <Button onClick={handleCreate} className="mt-4">
          <Plus className="size-4" /> Crear proveedor
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Proveedor</th>
              <th className="px-3 py-2 font-medium">Contacto</th>
              <th className="px-3 py-2 font-medium">Compras</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => {
              const count = purchases.filter((p) => p.supplierId === s.id).length;
              return (
                <tr key={s.id} className="border-b border-border text-sm last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Link href={ROUTES.adminProveedorDetalle(s.id)} className="font-medium text-accent hover:underline">
                      {s.name}
                    </Link>
                    {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {s.contact ?? "—"}
                    {s.phone && <p className="text-muted-foreground">{s.phone}</p>}
                  </td>
                  <td className="px-3 py-2">{count}</td>
                  <td className="px-3 py-2">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs", s.active ? "border bg-success/10 text-success border-success/30" : "border bg-muted/10 text-muted-foreground border-border")}>
                      {s.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Button variant="outline" size="sm" onClick={() => toggleActive(s.id, s.active)}>
                      {s.active ? "Desactivar" : "Activar"}
                    </Button>
                  </td>
                </tr>
              );
            })}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Sin proveedores. Crea el primero arriba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
