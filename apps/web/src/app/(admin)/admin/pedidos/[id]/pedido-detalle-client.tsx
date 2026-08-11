"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Pencil, Trash2 } from "lucide-react";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { usersStore } from "@/lib/stores/data-store.users";
import { productsStore } from "@/lib/stores/data-store.products";
import { addressesStore } from "@/lib/stores/data-store.addresses";
import { stockMovementsStore } from "@/lib/stores/data-store.stock-movements";
import { auditStore } from "@/lib/stores/data-store.audit";
import type { Address, Order, OrderStatus, OrderItem, ProductVariantStock } from "@/lib/stores";
import { VALID_TRANSITIONS, STATUS_STYLES } from "@/lib/stores";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProductSearch } from "@/components/admin/product-search";
import { cn } from "@/lib/utils/utils";
import { formatPrice } from "@/lib/utils/format";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { departments, type Province } from "@/config/ubigeos";
import { normalizeText } from "@/lib/validations/forms";

function formatAddressLabel(address: Address): string {
  return [address.street, address.district, address.city, address.state]
    .filter(Boolean)
    .join(", ");
}

export function PedidoDetalleClient({ id }: { id: string }) {
  const { state: authState } = useAuth();
  const [order, setOrder] = useState<Order | undefined>(() => ordersStore.getById(id));
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [editedShipping, setEditedShipping] = useState(0);
  const [editedDiscount, setEditedDiscount] = useState(0);
  const [editedPaymentMethod, setEditedPaymentMethod] = useState("");
  const [editedPaymentStatus, setEditedPaymentStatus] = useState("");
  const [editedTrackingNumber, setEditedTrackingNumber] = useState("");
  const [editedAddressMode, setEditedAddressMode] = useState<"existing" | "new">("new");
  const [editedAddressId, setEditedAddressId] = useState("");
  const [editedAddressLabel, setEditedAddressLabel] = useState("");
  const [editedAddress, setEditedAddress] = useState<Pick<Address, "fullName" | "street" | "district" | "city" | "state" | "zip" | "country" | "phone">>({
    fullName: "",
    street: "",
    district: "",
    city: "",
    state: "",
    zip: "",
    country: "Perú",
    phone: "",
  });

  const customerAddresses = useMemo(() => {
    if (!order) return [];
    const seen = new Set<string>();
    return addressesStore.getByUserId(order.userId).filter((address) => {
      const key = `${address.street}|${address.district}|${address.city}|${address.state}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [order]);

  const selectedEditedAddress = useMemo(
    () => customerAddresses.find((address) => address.id === editedAddressId),
    [customerAddresses, editedAddressId]
  );

  const editedDepartmentData = useMemo(
    () => departments.find((department) => department.name === editedAddress.state),
    [editedAddress.state]
  );
  const editedProvinces: Province[] = useMemo(
    () => editedDepartmentData?.provinces ?? [],
    [editedDepartmentData]
  );
  const editedProvinceData = useMemo(
    () => editedProvinces.find((province) => province.name === editedAddress.city),
    [editedProvinces, editedAddress.city]
  );
  const editedDistricts = editedProvinceData?.districts ?? [];

  function fillEditedAddress(address: Address) {
    setEditedAddress((current) => ({
      ...current,
      street: address.street,
      district: address.district,
      city: address.city,
      state: address.state,
      zip: address.zip ?? "",
      country: "Perú",
    }));
  }

  function findMatchingAddress(street: string, district: string, city: string, state: string) {
    if (!order) return undefined;
    return addressesStore
      .getByUserId(order.userId)
      .find(
        (address) =>
          address.street.trim().toLowerCase() === street.trim().toLowerCase() &&
          address.district.trim().toLowerCase() === district.trim().toLowerCase() &&
          address.city.trim().toLowerCase() === city.trim().toLowerCase() &&
          address.state.trim().toLowerCase() === state.trim().toLowerCase()
      );
  }

  function enterEditMode() {
    if (!order) return;
    setEditedItems([...order.items]);
    setEditedShipping(order.shipping);
    setEditedDiscount(order.discount);
    setEditedPaymentMethod(order.paymentMethod ?? "");
    setEditedPaymentStatus(order.paymentStatus ?? "");
    setEditedTrackingNumber(order.trackingNumber ?? "");
    setEditedAddress({ ...order.shippingAddressSnapshot });
    const linked = order.shippingAddressId
      ? addressesStore.getById(order.shippingAddressId)
      : undefined;
    if (linked?.userId === order.userId) {
      setEditedAddressMode("existing");
      setEditedAddressId(linked.id);
      setEditedAddressLabel("");
      fillEditedAddress(linked);
    } else {
      setEditedAddressMode("new");
      setEditedAddressId("");
      setEditedAddressLabel("");
    }
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
  }

  const activeProducts = useMemo(
    () => productsStore.getAll().filter((p) => p.active),
    []
  );

  const recalculatedSubtotal = useMemo(
    () => editedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [editedItems]
  );

  const recalculatedTotal = useMemo(
    () => Math.max(0, recalculatedSubtotal + editedShipping - editedDiscount),
    [recalculatedSubtotal, editedShipping, editedDiscount]
  );

  function addItem(product: { id: string; name: string; price: number; sizes: string[]; colors: { name: string; hex: string }[]; variants?: ProductVariantStock[] }, size: string, color: string, quantity: number) {
    const variant = product.variants?.find((v) => v.size === size && v.color === color);
    const variantId = variant?.id ?? `${product.id}-${size}-${color}`;
    setEditedItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === product.id && i.size === size && i.color === color
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && i.size === size && i.color === color
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId,
          name: product.name,
          price: product.price,
          size,
          color,
          quantity,
        },
      ];
    });
  }

  function removeItem(index: number) {
    setEditedItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItemQuantity(index: number, quantity: number) {
    setEditedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  }

  function hasChanges(): boolean {
    if (!order) return false;
    return (
      JSON.stringify(editedItems) !== JSON.stringify(order.items) ||
      editedShipping !== order.shipping ||
      editedDiscount !== order.discount ||
      editedPaymentMethod !== (order.paymentMethod ?? "") ||
      editedPaymentStatus !== (order.paymentStatus ?? "") ||
      editedTrackingNumber !== (order.trackingNumber ?? "") ||
      editedAddressMode !== (order.shippingAddressId ? "existing" : "new") ||
      editedAddressId !== (order.shippingAddressId ?? "") ||
      editedAddressLabel.trim().length > 0 ||
      JSON.stringify(editedAddress) !== JSON.stringify(order.shippingAddressSnapshot)
    );
  }

  function handleSave() {
    if (!order || !hasChanges()) return;
    if (editedItems.length === 0) {
      notifyAdmin("Error", "El pedido debe tener al menos un producto", "error");
      return;
    }
    if (!Number.isFinite(editedShipping) || editedShipping < 0) {
      notifyAdmin("Error", "El envío no puede ser negativo", "error");
      return;
    }
    if (!Number.isFinite(editedDiscount) || editedDiscount < 0) {
      notifyAdmin("Error", "El descuento no puede ser negativo", "error");
      return;
    }
    let nextShippingAddressId: string | undefined;
    let addressSource: Pick<Address, "id" | "street" | "district" | "city" | "state" | "zip" | "createdAt"> | undefined;

    if (editedAddressMode === "existing") {
      if (!selectedEditedAddress || selectedEditedAddress.userId !== order.userId) {
        notifyAdmin("Error", "Selecciona una dirección guardada", "error");
        return;
      }
      nextShippingAddressId = selectedEditedAddress.id;
      addressSource = selectedEditedAddress;
    } else {
      if (editedAddress.street.trim().length < 5) {
        notifyAdmin("Error", "La dirección debe tener al menos 5 caracteres", "error");
        return;
      }
      if (!editedAddress.state.trim() || !editedAddress.city.trim() || !editedAddress.district?.trim()) {
        notifyAdmin("Error", "Departamento, provincia y distrito son obligatorios", "error");
        return;
      }

      const street = normalizeText(editedAddress.street);
      const district = normalizeText(editedAddress.district ?? "");
      const city = normalizeText(editedAddress.city);
      const state = normalizeText(editedAddress.state);
      const existingAddress = findMatchingAddress(street, district, city, state);
      const savedAddress = existingAddress ?? addressesStore.create({
        userId: order.userId,
        label: editedAddressLabel.trim() || "Dirección",
        fullName: order.shippingAddressSnapshot.fullName,
        street,
        district,
        city,
        state,
        zip: editedAddress.zip?.trim() ?? "",
        country: "Perú",
        phone: order.shippingAddressSnapshot.phone || "",
        isDefault: customerAddresses.length === 0,
      });

      nextShippingAddressId = savedAddress.id;
      addressSource = savedAddress;
    }

    if (!addressSource) {
      notifyAdmin("Error", "No se pudo preparar la dirección", "error");
      return;
    }

    const normalizedAddress: Address = {
      id: nextShippingAddressId || addressSource.id || "",
      userId: order.userId,
      label: editedAddressLabel.trim() || "Dirección",
      fullName: editedAddress.fullName || user?.name || "Cliente",
      street: addressSource.street,
      district: addressSource.district,
      city: addressSource.city,
      state: addressSource.state,
      zip: addressSource.zip ?? "",
      country: "Perú",
      phone: editedAddress.phone || user?.phone || "",
      isDefault: false,
      createdAt: addressSource.createdAt ?? order.createdAt,
      updatedAt: new Date().toISOString(),
    };
    const previousStockItems = order.stockReserved ? order.items : [];
    const stockValidation = productsStore.validateStockChange(previousStockItems, editedItems);
    if (!stockValidation.success) {
      notifyAdmin("Stock insuficiente", stockValidation.error, "error");
      return;
    }

    setIsPending(true);
    setTimeout(() => {
      const stockUpdate = productsStore.applyStockChange(previousStockItems, editedItems);
      if (!stockUpdate.success) {
        notifyAdmin("Stock insuficiente", stockUpdate.error, "error");
        setIsPending(false);
        return;
      }

      const updated = ordersStore.update(order.id, {
        items: editedItems,
        subtotal: recalculatedSubtotal,
        total: recalculatedTotal,
        shipping: editedShipping,
        discount: editedDiscount,
        paymentMethod: editedPaymentMethod || undefined,
        paymentStatus: editedPaymentStatus || undefined,
        trackingNumber: editedTrackingNumber || undefined,
        shippingAddressId: nextShippingAddressId,
        shippingAddressSnapshot: normalizedAddress,
        stockReserved: true,
      });

      if (updated) {
        const actor = {
          id: authState.user?.id ?? "admin",
          name: authState.user?.name ?? "Admin",
        };

        stockMovementsStore.createFromOrderDiff({
          previousItems: previousStockItems,
          nextItems: editedItems,
          type: "order_edit",
          orderId: order.id,
          actor,
          reason: "Edición de pedido",
        });
        auditStore.create({
          actor,
          entityType: "order",
          entityId: order.id,
          entityLabel: `#${order.id.slice(0, 8)}`,
          action: "update",
          summary: `Editó el pedido #${order.id.slice(0, 8)}`,
          before: {
            items: order.items,
            subtotal: order.subtotal,
            total: order.total,
            shipping: order.shipping,
            discount: order.discount,
              shippingAddress: order.shippingAddressSnapshot,
            },
            after: {
              items: updated.items,
              subtotal: updated.subtotal,
              total: updated.total,
              shipping: updated.shipping,
              discount: updated.discount,
              shippingAddress: updated.shippingAddressSnapshot,
          },
        });
        setOrder(updated);
        setEditMode(false);
        notifyAdmin("Pedido actualizado", `#${order.id.slice(0, 8)}`, "success");
      } else {
        productsStore.applyStockChange(editedItems, previousStockItems);
        notifyAdmin("Error", "No se pudo actualizar el pedido", "error");
      }
      setIsPending(false);
    }, 400);
  }

  function handleStatusChange(newStatus: OrderStatus) {
    if (!order || !authState.user) return;
    setUpdating(true);
    setTimeout(() => {
      const result = ordersStore.transitionStatus(order.id, newStatus, authState.user!.id, authState.user!.name);
      if (result.success) {
        setOrder({ ...result.data });
        notifyAdmin("Pedido actualizado", `${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
      } else {
        notifyAdmin("Error", result.error, "error");
      }
      setUpdating(false);
    }, 400);
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Pedido no encontrado</h2>
          <Link href={ROUTES.adminPedidos} className="text-accent underline text-sm">
            Volver a pedidos
          </Link>
        </div>
      </div>
    );
  }

  const user = usersStore.getById(order.userId);
  const creator = order.createdBy ? usersStore.getById(order.createdBy) : undefined;
  const sourceLabel =
    order.source === "admin"
      ? "Admin"
      : order.source === "checkout"
        ? "Checkout"
        : "Sin registrar";
  const creatorLabel = creator?.name ?? order.createdBy ?? "—";
  const allowedTransitions = VALID_TRANSITIONS[order.status];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.adminPedidos}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-heading">
            Pedido #{order.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("es-PE", {
              dateStyle: "long",
            })}
          </p>
        </div>
        {!editMode && (
          <Button variant="outline" size="sm" onClick={enterEditMode}>
            <Pencil className="size-3.5" />
            Editar
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Estado:</span>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                STATUS_STYLES[order.status]
              )}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          {allowedTransitions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Cambiar a:</span>
              <Select onValueChange={(v) => handleStatusChange(v as OrderStatus)} disabled={updating}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {allowedTransitions.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">Trazabilidad</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Origen</p>
            <p className="font-medium">{sourceLabel}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Creado por</p>
            <p className="font-medium">{creatorLabel}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">Cliente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Nombre</p>
            <p className="font-medium">{user?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Teléfono</p>
            <p className="font-medium">{order.shippingAddressSnapshot.phone || user?.phone || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Dirección</p>
            <p className="font-medium">{formatAddressLabel(editMode ? editedAddress as Address : order.shippingAddressSnapshot) || "—"}</p>
            {(editMode ? editedAddress.zip : order.shippingAddressSnapshot.zip) && (
              <p className="text-xs text-muted-foreground">
                CP: {editMode ? editedAddress.zip : order.shippingAddressSnapshot.zip}
              </p>
            )}
          </div>
        </div>
      </div>

      {!editMode && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-3">Pago y Envío</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Método de pago</p>
              <p className="font-medium">{order.paymentMethod || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Estado de pago</p>
              <p className="font-medium">{order.paymentStatus || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">N° de seguimiento</p>
              <p className="font-medium">{order.trackingNumber || "-"}</p>
            </div>
          </div>
        </div>
      )}

      {editMode && (<>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Dirección de Envío</h2>
          <div className="space-y-4">
            {customerAddresses.length > 0 && (
              <RadioGroup
                value={editedAddressMode}
                onValueChange={(value) => {
                  const nextMode = value as "existing" | "new";
                  setEditedAddressMode(nextMode);

                  if (nextMode === "existing") {
                    const nextAddress = selectedEditedAddress ?? customerAddresses[0];
                    setEditedAddressId(nextAddress.id);
                    fillEditedAddress(nextAddress);
                  } else {
                    setEditedAddressId("");
                    setEditedAddressLabel("");
                    setEditedAddress((current) => ({
                      ...current,
                      street: "",
                      district: "",
                      city: "",
                      state: "",
                      zip: "",
                      country: "Perú",
                    }));
                  }
                }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="existing" id="edit-address-existing" />
                  <label htmlFor="edit-address-existing" className="cursor-pointer text-sm font-medium">
                    Usar dirección guardada
                  </label>
                </div>

                {editedAddressMode === "existing" && (
                  <div className="space-y-3 sm:pl-6">
                    <Select
                      value={editedAddressId}
                      onValueChange={(value) => {
                        setEditedAddressId(value);
                        const address = customerAddresses.find((item) => item.id === value);
                        if (address) fillEditedAddress(address);
                      }}
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar dirección..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customerAddresses.map((address) => (
                          <SelectItem key={address.id} value={address.id}>
                            {formatAddressLabel(address)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedEditedAddress && (
                      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                        <p className="font-medium">{formatAddressLabel(selectedEditedAddress)}</p>
                        {selectedEditedAddress.zip && (
                          <p className="mt-1 text-muted-foreground">
                            Código postal: {selectedEditedAddress.zip}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <RadioGroupItem value="new" id="edit-address-new" />
                  <label htmlFor="edit-address-new" className="cursor-pointer text-sm font-medium">
                    Ingresar nueva dirección
                  </label>
                </div>
              </RadioGroup>
            )}

            {(editedAddressMode === "new" || customerAddresses.length === 0) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dirección</label>
                  <Input
                    value={editedAddress.street}
                    onChange={(e) => setEditedAddress((a) => ({ ...a, street: e.target.value }))}
                    className="mt-1"
                    disabled={isPending}
                    placeholder="Av. / Jr. / Calle"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Departamento</label>
                  <Select
                    value={editedAddress.state}
                    onValueChange={(value) => {
                      setEditedAddress((current) => ({
                        ...current,
                        state: value,
                        city: "",
                        district: "",
                      }));
                    }}
                    disabled={isPending}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department.name} value={department.name}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provincia</label>
                  <Select
                    value={editedAddress.city}
                    onValueChange={(value) => {
                      setEditedAddress((current) => ({
                        ...current,
                        city: value,
                        district: "",
                      }));
                    }}
                    disabled={isPending || !editedAddress.state}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={editedAddress.state ? "Seleccionar provincia" : "Elige departamento"} />
                    </SelectTrigger>
                    <SelectContent>
                      {editedProvinces.map((province) => (
                        <SelectItem key={province.name} value={province.name}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Distrito</label>
                  <Select
                    value={editedAddress.district ?? ""}
                    onValueChange={(value) => {
                      setEditedAddress((current) => ({ ...current, district: value }));
                    }}
                    disabled={isPending || !editedAddress.city}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={editedAddress.city ? "Seleccionar distrito" : "Elige provincia"} />
                    </SelectTrigger>
                    <SelectContent>
                      {editedDistricts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código postal (opcional)</label>
                  <Input
                    value={editedAddress.zip}
                    onChange={(e) => setEditedAddress((a) => ({ ...a, zip: e.target.value }))}
                    className="mt-1"
                    disabled={isPending}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Etiqueta opcional</label>
                  <Input
                    value={editedAddressLabel}
                    onChange={(e) => setEditedAddressLabel(e.target.value)}
                    className="mt-1"
                    disabled={isPending}
                    placeholder="Etiqueta opcional"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Pago y Envío</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Método de pago</label>
              <Select
                value={editedPaymentMethod}
                onValueChange={setEditedPaymentMethod}
                disabled={isPending}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin registro</SelectItem>
                  <SelectItem value="Yape">Yape</SelectItem>
                  <SelectItem value="Plin">Plin</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado de pago</label>
              <Select
                value={editedPaymentStatus}
                onValueChange={setEditedPaymentStatus}
                disabled={isPending}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin registro</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="reembolsado">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">N° de seguimiento</label>
              <Input
                value={editedTrackingNumber}
                onChange={(e) => setEditedTrackingNumber(e.target.value)}
                className="mt-1"
                disabled={isPending}
                placeholder="Opcional"
              />
            </div>
          </div>
        </div>
      </>)}

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Productos ({editMode ? editedItems.length : order.items.length})</h2>
        </div>

        {editMode && (
          <div className="mb-4">
            <ProductSearch
              products={activeProducts}
              onAdd={(product, size, color, quantity) => addItem(product, size, color, quantity)}
              disabled={isPending}
            />
          </div>
        )}

        <div className="space-y-2">
          {(editMode ? editedItems : order.items).map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-2 bg-muted/30">
              <Package className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  Talla: {item.size} · Color: {item.color}
                </p>
              </div>
              {editMode ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItemQuantity(i, Number(e.target.value) || 1)}
                    className="w-16 h-7 text-xs text-center"
                    disabled={isPending}
                  />
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={() => removeItem(i)}
                    disabled={isPending}
                    aria-label={`Eliminar ${item.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatPrice(item.price)}</p>
                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </>
              )}
            </div>
          ))}
          {(editMode ? editedItems.length === 0 : order.items.length === 0) && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Sin productos
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(editMode ? recalculatedSubtotal : order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Envío</span>
            {editMode ? (
              <Input
                type="number"
                min={0}
                value={editedShipping}
                onChange={(e) => setEditedShipping(Number(e.target.value) || 0)}
                className="w-24 h-7 text-xs text-right"
                disabled={isPending}
              />
            ) : (
              <span>{formatPrice(order.shipping)}</span>
            )}
          </div>
          {(editMode || order.discount > 0) && (
            <div className="flex justify-between text-muted-foreground">
              <span>Descuento</span>
              {editMode ? (
                <Input
                  type="number"
                  min={0}
                  value={editedDiscount}
                  onChange={(e) => setEditedDiscount(Number(e.target.value) || 0)}
                  className="w-24 h-7 text-xs text-right"
                  disabled={isPending}
                />
              ) : (
                <span>-{formatPrice(order.discount)}</span>
              )}
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span>{formatPrice(editMode ? recalculatedTotal : order.total)}</span>
          </div>
        </div>
      </div>

      {editMode && (
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={cancelEdit} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending || !hasChanges()}>
            Guardar Cambios
          </Button>
        </div>
      )}

      {!editMode && order.statusHistory.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-3">Historial de Cambios</h2>
          <div className="space-y-2">
            {order.statusHistory.map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="size-2 rounded-full bg-muted-foreground shrink-0" />
                <span className="text-muted-foreground text-xs w-28">
                  {new Date(h.at).toLocaleString("es-PE")}
                </span>
                <span className="text-muted-foreground capitalize">{h.from}</span>
                <span>→</span>
                <span className="font-medium capitalize">{h.to}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
