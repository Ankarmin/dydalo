"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Calendar, ShoppingCart, DollarSign, Pencil, Save, X, MapPin, Plus, Trash2, Star, Home, Briefcase } from "lucide-react";
import { useStoreData } from "@/hooks/use-store-data";
import { useAuth } from "@/contexts/auth-context";
import { usersStore } from "@/lib/stores/data-store.users";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { addressesStore } from "@/lib/stores/data-store.addresses";
import { auditStore } from "@/lib/stores/data-store.audit";
import type { Address } from "@/lib/stores";
import { STATUS_STYLES } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { departments, type Province } from "@/config/ubigeos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { formatPrice } from "@/lib/utils/format";
import { normalizeText } from "@/lib/validations/forms";

function labelIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("casa")) return <Home className="size-4" />;
  if (lower.includes("trabajo") || lower.includes("oficina")) return <Briefcase className="size-4" />;
  return <MapPin className="size-4" />;
}

export function UsuarioDetalleClient({ id }: { id: string }) {
  const { state: authState } = useAuth();
  const user = useStoreData(() => usersStore.getById(id));
  const orders = useStoreData(() => ordersStore.getByUserId(id).toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  const [addresses, setAddresses] = useState<Address[]>(() => addressesStore.getByUserId(id));
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [addrEditing, setAddrEditing] = useState<Partial<Address> | null>(null);
  const [addrDeleteId, setAddrDeleteId] = useState<string | null>(null);
  const [addrPending, setAddrPending] = useState(false);
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

  function refreshAddresses() {
    setAddresses(addressesStore.getByUserId(id));
  }

  function openAddrNew() {
    setAddrEditing({
      userId: id,
      fullName: user?.name ?? "",
      country: "Perú",
      phone: user?.phone ?? "",
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

  function openAddrEdit(addr: Address) {
    setAddrEditing({ ...addr });
    setSelectedDept(addr.state);
    setSelectedProvince(addr.city);
  }

  function selectDepartment(name: string) {
    setSelectedDept(name);
    setSelectedProvince("");
    setAddrEditing((e) => e ? { ...e, state: name, city: "", district: "" } : null);
  }

  function selectProvince(name: string) {
    setSelectedProvince(name);
    setAddrEditing((e) => e ? { ...e, city: name, district: "" } : null);
  }

  function handleAddrSave() {
    if (!addrEditing) return;
    const d = addrEditing;
    if (!d.fullName?.trim()) {
      notifyAdmin("Error", "El nombre completo es obligatorio", "error");
      return;
    }
    if (!d.phone?.trim()) {
      notifyAdmin("Error", "El teléfono es obligatorio", "error");
      return;
    }
    if (!d.label?.trim()) {
      notifyAdmin("Error", "La etiqueta es obligatoria", "error");
      return;
    }
    if (!d.street?.trim() || !d.state?.trim() || !d.city?.trim() || !d.district?.trim()) {
      notifyAdmin("Error", "Dirección, departamento, provincia y distrito son obligatorios", "error");
      return;
    }

    const actor = {
      id: authState.user?.id ?? "admin",
      name: authState.user?.name ?? "Admin",
    };

    setAddrPending(true);
    setTimeout(() => {
      const label = d.label ?? "";
      const street = d.street ?? "";
      const district = d.district ?? "";
      const city = d.city ?? "";
      const state = d.state ?? "";
      const saveData = {
        ...d,
        userId: id,
        label: normalizeText(label),
        street: normalizeText(street),
        district: normalizeText(district),
        city: normalizeText(city),
        state: normalizeText(state),
        zip: d.zip ?? "",
        isDefault: addresses.length === 0 ? true : Boolean(d.isDefault),
      };

      const isNew = !("id" in saveData) || !saveData.id;

      if ("id" in saveData && typeof saveData.id === "string" && saveData.id) {
        addressesStore.update(saveData.id, saveData);
        if (saveData.isDefault) addressesStore.setDefault(id, saveData.id);

        auditStore.create({
          actor,
          entityType: "user",
          entityId: id,
          entityLabel: user?.name ?? "",
          action: "update",
          summary: `Editó dirección de ${saveData.label}`,
          changes: [{ field: "address", before: d.label, after: saveData.label }],
        });
      } else {
        const created = addressesStore.create(saveData as Omit<Address, "id" | "createdAt" | "updatedAt">);
        if (created.isDefault) addressesStore.setDefault(id, created.id);

        auditStore.create({
          actor,
          entityType: "user",
          entityId: id,
          entityLabel: user?.name ?? "",
          action: "update",
          summary: `Agregó dirección ${saveData.label}`,
          after: { label: saveData.label, district, city, state },
        });
      }

      refreshAddresses();
      setAddrEditing(null);
      setAddrPending(false);
      notifyAdmin(isNew ? "Dirección agregada" : "Dirección actualizada", "", "success");
    }, 300);
  }

  function handleAddrDelete() {
    if (!addrDeleteId) return;
    const actor = {
      id: authState.user?.id ?? "admin",
      name: authState.user?.name ?? "Admin",
    };
    const addr = addresses.find((a) => a.id === addrDeleteId);

    addressesStore.delete(addrDeleteId);

    if (addr) {
      auditStore.create({
        actor,
        entityType: "user",
        entityId: id,
        entityLabel: user?.name ?? "",
        action: "update",
        summary: `Eliminó dirección ${addr.label}`,
        before: { label: addr.label, district: addr.district, city: addr.city, state: addr.state },
      });
    }

    refreshAddresses();
    setAddrDeleteId(null);
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Cliente no encontrado</h2>
          <Link href={ROUTES.adminUsuarios} className="text-accent underline text-sm">
            Volver a clientes
          </Link>
        </div>
      </div>
    );
  }

  const totalSpent = orders
    .filter((o) => o.status !== "cancelado" && o.status !== "devuelto")
    .reduce((sum, o) => sum + o.total, 0);

  const completedOrders = orders.filter((o) => o.status === "entregado").length;

  function startEditing() {
    if (!user) return;
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone ?? "");
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
  }

  function saveChanges() {
    if (!user || !editName.trim() || !editEmail.trim()) return;
    setIsSaving(true);

    const actor = {
      id: authState.user?.id ?? "admin",
      name: authState.user?.name ?? "Admin",
    };

    const before = { name: user.name, email: user.email, phone: user.phone ?? "" };
    const updated = usersStore.update(id, {
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim() || undefined,
    });

    if (updated) {
      const changes = auditStore.diffFields(
        before as unknown as Record<string, unknown>,
        { name: updated.name, email: updated.email, phone: updated.phone ?? "" } as unknown as Record<string, unknown>,
        ["name", "email", "phone"]
      );

      if (changes.length > 0) {
        auditStore.create({
          actor,
          entityType: "user",
          entityId: updated.id,
          entityLabel: updated.name,
          action: "update",
          summary: `Editó datos del cliente ${updated.name}`,
          before,
          after: { name: updated.name, email: updated.email, phone: updated.phone ?? "" },
          changes,
        });
      }
      notifyAdmin("Cliente actualizado", updated.name, "success");
    }

    setIsSaving(false);
    setIsEditing(false);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.adminUsuarios}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-heading">{user.name}</h1>
          <p className="text-sm text-muted-foreground">
            Cliente desde {new Date(user.createdAt).toLocaleDateString("es-PE", { dateStyle: "long" })}
          </p>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil className="size-3.5" />
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Pedidos</span>
          </div>
          <p className="text-2xl font-bold">{orders.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{completedOrders} completados</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="size-4 text-success" />
            <span className="text-xs text-muted-foreground">Total Gastado</span>
          </div>
          <p className="text-2xl font-bold text-success">{formatPrice(totalSpent)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Último Pedido</span>
          </div>
          <p className="text-sm font-medium">
            {orders.length > 0
              ? new Date(orders[0].createdAt).toLocaleDateString("es-PE")
              : "—"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">Información de Contacto</h2>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                disabled={isSaving}
                placeholder="Sin teléfono"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isSaving}>
                <X className="size-3.5" />
                Cancelar
              </Button>
              <Button size="sm" onClick={saveChanges} disabled={isSaving || !editName.trim() || !editEmail.trim()}>
                <Save className="size-3.5" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
            )}
            {!user.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4" />
                <span className="italic">Sin teléfono</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Direcciones ({addresses.length})</h2>
          <Button size="sm" variant="outline" onClick={openAddrNew}>
            <Plus className="size-3.5" />
            Agregar dirección
          </Button>
        </div>
        {addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin direcciones registradas</p>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={cn(
                  "rounded-lg border bg-background p-3",
                  addr.isDefault ? "border-accent/40" : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-muted-foreground mt-0.5">{labelIcon(addr.label)}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{addr.label}</p>
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
                  <div className="flex items-center gap-0.5 shrink-0">
                    {!addr.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-accent"
                        onClick={() => {
                          addressesStore.setDefault(id, addr.id);
                          refreshAddresses();
                          auditStore.create({
                            actor: {
                              id: authState.user?.id ?? "admin",
                              name: authState.user?.name ?? "Admin",
                            },
                            entityType: "user",
                            entityId: id,
                            entityLabel: user?.name ?? "",
                            action: "update",
                            summary: `Marcó dirección ${addr.label} como principal`,
                            changes: [{ field: "isDefault", before: false, after: true }],
                          });
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
                      onClick={() => openAddrEdit(addr)}
                      aria-label="Editar dirección"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => setAddrDeleteId(addr.id)}
                      aria-label="Eliminar dirección"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 pb-3">
          <h2 className="text-sm font-semibold">Historial de Pedidos ({orders.length})</h2>
        </div>
        {orders.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No hay pedidos aún
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Pedido</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Items</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-border text-sm hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <Link
                        href={ROUTES.adminPedidoDetalle(order.id)}
                        className="font-mono text-xs text-accent hover:underline"
                      >
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-5 py-3">{order.items.length}</td>
                    <td className="px-5 py-3 font-medium">{formatPrice(order.total)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          STATUS_STYLES[order.status]
                        )}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={addrEditing !== null} onOpenChange={(o) => { if (!o) setAddrEditing(null); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {addrEditing && "id" in addrEditing && addrEditing.id ? "Editar dirección" : "Nueva dirección"}
            </DialogTitle>
            <DialogDescription>
              Completa los campos para guardar la dirección del cliente.
            </DialogDescription>
          </DialogHeader>

          {addrEditing && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre completo</Label>
                <Input
                  value={addrEditing.fullName ?? ""}
                  onChange={(e) => setAddrEditing({ ...addrEditing, fullName: e.target.value })}
                  placeholder="Nombre y apellidos"
                  disabled={addrPending}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">País</Label>
                <Input
                  value={addrEditing.country ?? "Perú"}
                  onChange={(e) => setAddrEditing({ ...addrEditing, country: e.target.value })}
                  placeholder="Perú"
                  disabled={addrPending}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teléfono</Label>
                <Input
                  type="tel"
                  value={addrEditing.phone ?? ""}
                  onChange={(e) => setAddrEditing({ ...addrEditing, phone: e.target.value })}
                  placeholder="+51 999 999 999"
                  disabled={addrPending}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Etiqueta</Label>
                <Input
                  value={addrEditing.label ?? ""}
                  onChange={(e) => setAddrEditing({ ...addrEditing, label: e.target.value })}
                  placeholder="Casa, Trabajo..."
                  disabled={addrPending}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dirección</Label>
                <Input
                  value={addrEditing.street ?? ""}
                  onChange={(e) => setAddrEditing({ ...addrEditing, street: e.target.value })}
                  placeholder="Av. / Jr. / Calle"
                  disabled={addrPending}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Departamento</Label>
                <Select value={addrEditing.state ?? selectedDept} onValueChange={selectDepartment} disabled={addrPending}>
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
                  value={addrEditing.city ?? selectedProvince}
                  onValueChange={selectProvince}
                  disabled={!selectedDept || addrPending}
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
                  value={addrEditing.district ?? ""}
                  onValueChange={(v) => setAddrEditing((e) => e ? { ...e, district: v } : null)}
                  disabled={!selectedProvince || addrPending}
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
                  value={addrEditing.zip ?? ""}
                  onChange={(e) => setAddrEditing({ ...addrEditing, zip: e.target.value })}
                  disabled={addrPending}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="addrIsDefault"
                  checked={addrEditing.isDefault ?? false}
                  onCheckedChange={(c) => setAddrEditing({ ...addrEditing, isDefault: Boolean(c) })}
                />
                <Label htmlFor="addrIsDefault" className="text-sm cursor-pointer">
                  Dirección principal
                </Label>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddrEditing(null)} disabled={addrPending}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAddrSave} disabled={addrPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addrDeleteId !== null} onOpenChange={(o) => { if (!o) setAddrDeleteId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar dirección</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar esta dirección del cliente? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddrDeleteId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleAddrDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
