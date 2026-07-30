"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Home, Star, MapPin, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { addressesStore } from "@/lib/stores/data-store.addresses";
import type { Address } from "@/lib/stores";
import { departments, type Province } from "@/config/ubigeos";
import { Button } from "@/components/ui/button";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";
import { ROUTES } from "@/lib/utils/routes";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { cn } from "@/lib/utils/utils";
import { normalizeText } from "@/lib/validations/forms";

function labelIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("casa")) return <Home className="size-4" />;
  if (lower.includes("trabajo") || lower.includes("oficina")) return <Briefcase className="size-4" />;
  return <MapPin className="size-4" />;
}

export default function DireccionesPage() {
  const { state } = useAuth();
  const userId = state.user?.id ?? "";
  const [addresses, setAddresses] = useState<Address[]>(() =>
    userId ? addressesStore.getByUserId(userId) : []
  );
  const [editing, setEditing] = useState<Partial<Address> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");

  const deptData = selectedDept
    ? departments.find((d) => d.name === selectedDept)
    : null;
  const provinces: Province[] = deptData?.provinces ?? [];
  const selectedProvinceData = selectedProvince
    ? provinces.find((p) => p.name === selectedProvince)
    : null;
  const districts: string[] = selectedProvinceData?.districts ?? [];

  function refresh() {
    if (!userId) return;
    setAddresses(addressesStore.getByUserId(userId));
  }

  function openNew() {
    setEditing({
      userId,
      label: "",
      street: "",
      district: "",
      city: "",
      state: "",
      zip: "",
      isDefault: addresses.length === 0,
    });
    setSelectedDept("");
    setSelectedProvince("");
  }

  function openEdit(addr: Address) {
    setEditing({ ...addr });
    setSelectedDept(addr.state);
    setSelectedProvince(addr.city);
  }

  function selectDepartment(name: string) {
    setSelectedDept(name);
    setSelectedProvince("");
    setEditing((e) => e ? { ...e, state: name, city: "", district: "" } : null);
  }

  function selectProvince(name: string) {
    setSelectedProvince(name);
    setEditing((e) => e ? { ...e, city: name, district: "" } : null);
  }

  function handleSave() {
    if (!editing || !userId) return;
    const d = editing;
    if (!d.label?.trim()) {
      notifyAdmin("Error", "La etiqueta es obligatoria", "error");
      return;
    }
    if (!d.street?.trim() || !d.state?.trim() || !d.city?.trim() || !d.district?.trim()) {
      notifyAdmin("Error", "Dirección, departamento, provincia y distrito son obligatorios", "error");
      return;
    }

    setIsPending(true);
    setTimeout(() => {
      const label = d.label ?? "";
      const street = d.street ?? "";
      const district = d.district ?? "";
      const city = d.city ?? "";
      const state = d.state ?? "";
      const saveData = {
        ...d,
        userId,
        label: normalizeText(label),
        street: normalizeText(street),
        district: normalizeText(district),
        city: normalizeText(city),
        state: normalizeText(state),
        zip: d.zip ?? "",
        isDefault: addresses.length <= 1 ? true : Boolean(d.isDefault),
      };
      if ("id" in saveData && typeof saveData.id === "string") {
        addressesStore.update(saveData.id, saveData);
        if (saveData.isDefault) addressesStore.setDefault(userId, saveData.id);
      } else {
        const created = addressesStore.create(saveData as Omit<Address, "id" | "createdAt" | "updatedAt">);
        if (created.isDefault) addressesStore.setDefault(userId, created.id);
      }
      refresh();
      setEditing(null);
      setIsPending(false);
    }, 300);
  }

  function handleDelete() {
    if (!deleteId) return;
    addressesStore.delete(deleteId);
    refresh();
    setDeleteId(null);
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Home className="size-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          Inicia sesión para gestionar tus direcciones.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <PageBreadcrumbs
        className="mb-0"
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Mi cuenta", href: ROUTES.cuenta },
          { label: "Direcciones" },
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">DIRECCIONES</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {addresses.length} dirección{addresses.length !== 1 ? "es" : ""} guardada
            {addresses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="size-3.5" />
          Agregar dirección
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-card">
          <Home className="size-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No tienes direcciones</p>
          <p className="text-xs text-muted-foreground mt-1">
            Agrega una dirección para agilizar tus compras.
          </p>
          <Button size="sm" className="mt-4" onClick={openNew}>
            <Plus className="size-3.5" />
            Agregar dirección
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={cn(
                "rounded-xl border bg-card p-4 transition-colors",
                addr.isDefault ? "border-accent/40" : "border-border"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-muted-foreground mt-0.5">{labelIcon(addr.label)}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{addr.label}</p>
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                          <Star className="size-2.5 fill-accent" />
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {addr.street} · {addr.district} · {addr.city} · {addr.state}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!addr.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-accent"
                      onClick={() => {
                        addressesStore.setDefault(userId, addr.id);
                        refresh();
                      }}
                      aria-label="Marcar como principal"
                      title="Marcar como principal"
                    >
                      <Star className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => openEdit(addr)}
                    aria-label="Editar"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(addr.id)}
                    aria-label="Eliminar"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing && "id" in editing ? "Editar dirección" : "Nueva dirección"}
            </DialogTitle>
            <DialogDescription>
              Completa los campos para guardar tu dirección.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Etiqueta</Label>
                <Input
                  value={editing.label ?? ""}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  placeholder="Casa, Trabajo..."
                  disabled={isPending}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dirección</Label>
                <Input
                  value={editing.street ?? ""}
                  onChange={(e) => setEditing({ ...editing, street: e.target.value })}
                  placeholder="Av. / Jr. / Calle"
                  disabled={isPending}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Departamento</Label>
                <Select value={editing.state ?? selectedDept} onValueChange={selectDepartment} disabled={isPending}>
                  <SelectTrigger className="mt-1 w-full text-xs">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provincia</Label>
                <Select
                  value={editing.city ?? selectedProvince}
                  onValueChange={selectProvince}
                  disabled={!selectedDept || isPending}
                >
                  <SelectTrigger className="mt-1 w-full text-xs">
                    <SelectValue placeholder={selectedDept ? "Seleccionar..." : "Primero elige departamento"} />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((p) => (
                      <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Distrito</Label>
                <Select
                  value={editing.district ?? ""}
                  onValueChange={(v) => setEditing((e) => e ? { ...e, district: v } : null)}
                  disabled={!selectedProvince || isPending}
                >
                  <SelectTrigger className="mt-1 w-full text-xs">
                    <SelectValue placeholder={selectedProvince ? "Seleccionar..." : "Primero elige provincia"} />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código Postal (opcional)</Label>
                <Input
                  value={editing.zip ?? ""}
                  onChange={(e) => setEditing({ ...editing, zip: e.target.value })}
                  disabled={isPending}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="isDefault"
                  checked={editing.isDefault ?? false}
                  onCheckedChange={(c) => setEditing({ ...editing, isDefault: Boolean(c) })}
                />
                <Label htmlFor="isDefault" className="text-sm cursor-pointer">
                  Dirección principal
                </Label>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar dirección</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar esta dirección? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
