"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { stockMovementsStore } from "@/lib/stores/data-store.stock-movements";
import { auditStore } from "@/lib/stores/data-store.audit";
import { productsStore } from "@/lib/stores/data-store.products";
import type { StockMovementType } from "@/lib/stores/data-store.types";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notifyAdmin } from "@/components/admin/admin-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/utils";
import { getVariantKey } from "@/lib/utils/inventory";
import { FALLBACK_IMAGE } from "@/config/constants";

const MOVEMENT_LABELS: Record<StockMovementType, string> = {
  purchase: "Compra",
  sale: "Venta",
  manual_adjustment: "Ajuste",
  return: "Devolución",
  cancellation: "Cancelación",
  order_edit: "Edición pedido",
  variant_created: "Variante creada",
  variant_deactivated: "Variante desactivada",
};

const MOVEMENT_TYPES: Array<StockMovementType | "todos"> = [
  "todos",
  "purchase",
  "sale",
  "manual_adjustment",
  "return",
  "cancellation",
  "order_edit",
  "variant_created",
  "variant_deactivated",
];

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function InventarioClient() {
  const { state: authState } = useAuth();
  const [products, setProducts] = useState(() => productsStore.getAll());
  const [movements, setMovements] = useState(() => stockMovementsStore.ensureInitialInventorySnapshot());
  const [query, setQuery] = useState("");
  const [productFilter, setProductFilter] = useState("todos");
  const [type, setType] = useState<StockMovementType | "todos">("todos");
  const [direction, setDirection] = useState<"todos" | "entrada" | "salida">("todos");
  const [responsible, setResponsible] = useState("todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustVariantKey, setAdjustVariantKey] = useState("");
  const [adjustType, setAdjustType] = useState<"purchase" | "manual_adjustment">("purchase");
  const [adjustMode, setAdjustMode] = useState<"add" | "subtract" | "set">("add");
  const [adjustQuantity, setAdjustQuantity] = useState(1);
  const [adjustReason, setAdjustReason] = useState("");

  const actor = {
    id: authState.user?.id ?? "admin",
    name: authState.user?.name ?? "Admin",
  };

  const activeProducts = useMemo(
    () => products.filter((product) => product.active).toSorted((a, b) => a.name.localeCompare(b.name)),
    [products]
  );
  const selectedProduct = activeProducts.find((product) => String(product.id) === adjustProductId);
  const selectedVariant = selectedProduct?.variants?.find(
    (variant) => getVariantKey(variant.size, variant.color) === adjustVariantKey
  );

  const responsibleOptions = useMemo(
    () => Array.from(new Set(movements.map((movement) => movement.createdByName))).sort(),
    [movements]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTime = to ? new Date(`${to}T23:59:59`).getTime() : null;

    return movements.filter((movement) => {
      const movementTime = new Date(movement.createdAt).getTime();
      const matchesQuery = !normalizedQuery || [
        movement.productName,
        movement.sku,
        movement.color,
        movement.size,
        movement.orderId ?? "",
        movement.reason ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedQuery));

      return (
        matchesQuery &&
        (productFilter === "todos" || String(movement.productId) === productFilter) &&
        (type === "todos" || movement.type === type) &&
        (direction === "todos" || (direction === "entrada" ? movement.quantityChange > 0 : movement.quantityChange < 0)) &&
        (responsible === "todos" || movement.createdByName === responsible) &&
        (fromTime === null || movementTime >= fromTime) &&
        (toTime === null || movementTime <= toTime)
      );
    });
  }, [direction, from, movements, productFilter, query, responsible, to, type]);

  function clearFilters() {
    setQuery("");
    setProductFilter("todos");
    setType("todos");
    setDirection("todos");
    setResponsible("todos");
    setFrom("");
    setTo("");
  }

  function handleExport() {
    downloadCsv("movimientos-inventario.csv", [
      ["Fecha", "Producto", "SKU", "Variante", "Tipo", "Antes", "Cambio", "Después", "Pedido", "Responsable", "Motivo"],
      ...filtered.map((movement) => [
        movement.createdAt,
        movement.productName,
        movement.sku,
        `${movement.color} / ${movement.size}`,
        MOVEMENT_LABELS[movement.type],
        String(movement.quantityBefore),
        String(movement.quantityChange),
        String(movement.quantityAfter),
        movement.orderId ?? "",
        movement.createdByName,
        movement.reason ?? "",
      ]),
    ]);

    auditStore.create({
      actor,
      entityType: "inventory",
      entityId: "stock-movements-export",
      entityLabel: "Movimientos de inventario",
      action: "export",
      summary: `Exportó ${filtered.length} movimientos de inventario`,
    });
  }

  function handleManualMovement() {
    if (!selectedProduct || !selectedVariant) {
      notifyAdmin("Selecciona variante", "Elige un producto y una variante", "error");
      return;
    }
    if (!adjustReason.trim()) {
      notifyAdmin("Motivo requerido", "Indica por qué se mueve el stock", "error");
      return;
    }

    const quantity = Math.max(0, Math.trunc(adjustQuantity || 0));
    const quantityBefore = selectedVariant.stock;
    const quantityAfter = adjustMode === "set"
      ? quantity
      : adjustMode === "add"
        ? quantityBefore + quantity
        : Math.max(0, quantityBefore - quantity);
    const quantityChange = quantityAfter - quantityBefore;

    if (quantityChange === 0) {
      notifyAdmin("Sin cambios", "El stock queda igual", "error");
      return;
    }

    const updatedVariants = (selectedProduct.variants ?? []).map((variant) =>
      variant.id === selectedVariant.id
        ? { ...variant, stock: quantityAfter, updatedAt: new Date().toISOString() }
        : variant
    );
    const updated = productsStore.update(selectedProduct.id, { variants: updatedVariants });
    if (!updated) {
      notifyAdmin("Error", "No se pudo actualizar el inventario", "error");
      return;
    }

    stockMovementsStore.create({
      productId: updated.id,
      productName: updated.name,
      sku: updated.sku,
      variantId: selectedVariant.id,
      size: selectedVariant.size,
      color: selectedVariant.color,
      type: adjustType,
      quantityBefore,
      quantityChange,
      quantityAfter,
      reason: adjustReason.trim(),
      createdBy: actor.id,
      createdByName: actor.name,
    });
    auditStore.create({
      actor,
      entityType: "inventory",
      entityId: `${updated.id}-${selectedVariant.id}`,
      entityLabel: `${updated.name} ${selectedVariant.color} / ${selectedVariant.size}`,
      action: "stock_change",
      summary: `Ajustó stock de ${updated.name} ${selectedVariant.color} / ${selectedVariant.size}`,
      before: { stock: quantityBefore },
      after: { stock: quantityAfter },
      changes: [{ field: "stock", before: quantityBefore, after: quantityAfter }],
    });

    setProducts(productsStore.getAll());
    setMovements(stockMovementsStore.getAll());
    setAdjustQuantity(1);
    setAdjustReason("");
    notifyAdmin("Inventario actualizado", `${updated.name}: ${quantityChange > 0 ? "+" : ""}${quantityChange}`, "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Inventario</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {movements.length} movimientos registrados
          </p>
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="size-3.5" />
          Exportar CSV
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4">
          <h2 className="text-sm font-semibold">Registrar entrada o ajuste</h2>
          <p className="text-xs text-muted-foreground">Usa esta sección para compras, conteos físicos, mermas o correcciones.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:flex xl:flex-wrap xl:items-end">
          <div className="md:col-span-2 xl:min-w-[280px] xl:flex-[1.8_1_280px]">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Producto</Label>
            <Select value={adjustProductId} onValueChange={(value) => { setAdjustProductId(value); setAdjustVariantKey(""); }}>
              <SelectTrigger className="mt-1 h-12 min-w-0 text-left"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent className="min-w-[320px]">
                {activeProducts.map((product) => (
                  <SelectItem key={product.id} value={String(product.id)} className="py-2">
                    <span className="flex w-full min-w-0 items-center gap-3 text-left">
                      <span className="relative size-8 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                        <Image
                          src={product.image || FALLBACK_IMAGE}
                          alt=""
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
                        <span className="block w-full truncate text-left font-medium">{product.name}</span>
                        <span className="block w-full truncate text-left text-xs text-muted-foreground">{product.sku}</span>
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="xl:min-w-[190px] xl:flex-[1_1_190px]">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Variante</Label>
            <Select value={adjustVariantKey} onValueChange={setAdjustVariantKey} disabled={!selectedProduct}>
              <SelectTrigger className="mt-1 h-10 min-w-0 text-left"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent className="min-w-[220px]">
                {(selectedProduct?.variants ?? []).map((variant) => (
                  <SelectItem key={variant.id} value={getVariantKey(variant.size, variant.color)}>
                    {variant.color} / {variant.size} · {variant.stock}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="xl:min-w-[145px] xl:flex-[0_0_145px]">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo</Label>
            <Select value={adjustType} onValueChange={(value) => setAdjustType(value as "purchase" | "manual_adjustment")}>
              <SelectTrigger className="mt-1 h-10 min-w-0 text-left"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="purchase">Compra</SelectItem>
                <SelectItem value="manual_adjustment">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="xl:min-w-[145px] xl:flex-[0_0_145px]">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Operación</Label>
            <Select value={adjustMode} onValueChange={(value) => setAdjustMode(value as "add" | "subtract" | "set")}>
              <SelectTrigger className="mt-1 h-10 min-w-0 text-left"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Sumar</SelectItem>
                <SelectItem value="subtract">Restar</SelectItem>
                <SelectItem value="set">Fijar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="xl:min-w-[120px] xl:flex-[0_0_120px]">
            <Label htmlFor="adjust-quantity" className="text-xs uppercase tracking-wider text-muted-foreground">Cantidad</Label>
            <Input id="adjust-quantity" type="number" min="0" value={adjustQuantity} onChange={(e) => setAdjustQuantity(Number(e.target.value))} className="mt-1 h-10" />
          </div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Motivo obligatorio: compra, conteo físico, merma, corrección..." />
          <Button className="w-full whitespace-nowrap md:w-auto" onClick={handleManualMovement}>Registrar movimiento</Button>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Buscar</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Producto, SKU, pedido o motivo" className="pl-9" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:flex xl:flex-wrap xl:items-end">
          <div className="xl:min-w-[260px] xl:flex-[1.6_1_260px]">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Producto</Label>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="mt-1 h-10 min-w-0 text-left"><SelectValue placeholder="Producto" /></SelectTrigger>
              <SelectContent className="min-w-[300px]">
                <SelectItem value="todos">Todos los productos</SelectItem>
                {activeProducts.map((product) => <SelectItem key={product.id} value={String(product.id)}>{product.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="xl:min-w-[180px] xl:flex-[1_1_180px]">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo</Label>
            <Select value={type} onValueChange={(value) => setType(value as StockMovementType | "todos")}>
              <SelectTrigger className="mt-1 h-10 min-w-0 text-left"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent className="min-w-[220px]">
                {MOVEMENT_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>{item === "todos" ? "Todos los tipos" : MOVEMENT_LABELS[item]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="xl:min-w-[175px] xl:flex-[1_1_175px]">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cambio</Label>
            <Select value={direction} onValueChange={(value) => setDirection(value as "todos" | "entrada" | "salida")}>
              <SelectTrigger className="mt-1 h-10 min-w-0 text-left"><SelectValue placeholder="Cambio" /></SelectTrigger>
              <SelectContent className="min-w-[210px]">
                <SelectItem value="todos">Entradas y salidas</SelectItem>
                <SelectItem value="entrada">Solo entradas</SelectItem>
                <SelectItem value="salida">Solo salidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="xl:min-w-[220px] xl:flex-[1.2_1_220px]">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Responsable</Label>
            <Select value={responsible} onValueChange={setResponsible}>
              <SelectTrigger className="mt-1 h-10 min-w-0 text-left"><SelectValue placeholder="Responsable" /></SelectTrigger>
              <SelectContent className="min-w-[260px]">
                <SelectItem value="todos">Todos los responsables</SelectItem>
                {responsibleOptions.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="xl:min-w-[155px] xl:flex-[0_0_155px]">
            <Label htmlFor="inventory-from" className="text-xs uppercase tracking-wider text-muted-foreground">Desde</Label>
            <Input id="inventory-from" className="mt-1 h-10" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="xl:min-w-[155px] xl:flex-[0_0_155px]">
            <Label htmlFor="inventory-to" className="text-xs uppercase tracking-wider text-muted-foreground">Hasta</Label>
            <Input id="inventory-to" className="mt-1 h-10" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end md:col-span-2 xl:min-w-[160px] xl:flex-[0_0_160px]">
            <Button variant="outline" className="h-10 w-full whitespace-nowrap" onClick={clearFilters}>Limpiar filtros</Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] table-fixed text-sm">
            <colgroup>
              <col className="w-[145px]" />
              <col className="w-[245px]" />
              <col className="w-[120px]" />
              <col className="w-[125px]" />
              <col className="w-[70px]" />
              <col className="w-[80px]" />
              <col className="w-[80px]" />
              <col className="w-[95px]" />
              <col className="w-[150px]" />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Producto</th>
                <th className="px-3 py-2 font-medium">Variante</th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium text-right">Antes</th>
                <th className="px-3 py-2 font-medium text-right">Cambio</th>
                <th className="px-3 py-2 font-medium text-right">Después</th>
                <th className="px-3 py-2 font-medium">Pedido</th>
                <th className="px-3 py-2 font-medium">Responsable</th>
                <th className="px-3 py-2 font-medium">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((movement) => {
                const currentProduct = products.find((product) => product.id === movement.productId);
                const productImage = movement.productImage ?? currentProduct?.image ?? FALLBACK_IMAGE;
                return (
                <tr key={movement.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                   <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">{new Date(movement.createdAt).toLocaleString("es-PE")}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                        <Image src={productImage} alt="" fill sizes="40px" className="object-cover" />
                      </div>
                       <div className="min-w-0">
                         <Link href={ROUTES.adminProductoEditar(movement.productId)} className="block break-words font-medium text-accent hover:underline">
                           {movement.productName}
                         </Link>
                         <p className="whitespace-nowrap text-xs text-muted-foreground">{movement.sku}</p>
                       </div>
                     </div>
                   </td>
                   <td className="break-words px-3 py-2 text-xs">{movement.color} / {movement.size}</td>
                   <td className="break-words px-3 py-2 text-xs">{MOVEMENT_LABELS[movement.type]}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{movement.quantityBefore}</td>
                  <td className={cn("px-3 py-2 text-right font-semibold tabular-nums", movement.quantityChange < 0 ? "text-danger" : "text-success")}>
                    {movement.quantityChange > 0 ? "+" : ""}{movement.quantityChange}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{movement.quantityAfter}</td>
                   <td className="whitespace-nowrap px-3 py-2 text-xs">
                    {movement.orderId ? (
                      <Link href={ROUTES.adminPedidoDetalle(movement.orderId)} className="text-accent hover:underline">
                        #{movement.orderId.slice(0, 8)}
                      </Link>
                    ) : "—"}
                  </td>
                   <td className="break-words px-3 py-2 text-xs">{movement.createdByName}</td>
                   <td className="break-words px-3 py-2 text-xs leading-relaxed text-muted-foreground">{movement.reason ?? "—"}</td>
                </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-5 py-12 text-center text-sm text-muted-foreground">No hay movimientos con esos filtros</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
