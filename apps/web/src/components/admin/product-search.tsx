"use client";

import { useState, useMemo } from "react";
import { Search, Plus, X } from "lucide-react";
import type { AdminProduct } from "@/lib/stores";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAvailableColorsForSize, getAvailableSizes, getVariantStock } from "@/lib/utils/inventory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductSearchProps {
  products: AdminProduct[];
  onAdd: (product: AdminProduct, size: string, color: string, quantity: number) => void;
  disabled?: boolean;
}

export function ProductSearch({ products, onAdd, disabled = false }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminProduct | null>(null);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products
      .filter(
        (p) =>
          p.stock > 0 &&
          (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [products, query]);

  function handleSelect(product: AdminProduct) {
    const availableSizes = getAvailableSizes(product);
    const firstSize = availableSizes[0] ?? product.sizes[0] ?? "";
    const firstColor = getAvailableColorsForSize(product, firstSize)[0] ?? product.colors[0]?.name ?? "";
    setError(null);
    setSelected(product);
    setQuery("");
    setSize(firstSize);
    setColor(firstColor);
    setQuantity(1);
  }

  function handleConfirm() {
    if (!selected) return;
    if (selected.stock <= 0) {
      setError("Producto sin stock disponible");
      return;
    }
    if (!size || !color) {
      setError("Selecciona talla y color");
      return;
    }
    const maxStock = getVariantStock(selected, size, color);
    if (quantity < 1 || quantity > maxStock) {
      setError(`Cantidad permitida: 1 a ${maxStock}`);
      return;
    }

    onAdd(selected, size, color, quantity);
    setSelected(null);
    setSize("");
    setColor("");
    setQuantity(1);
    setError(null);
  }

  function handleCancel() {
    setSelected(null);
    setSize("");
    setColor("");
    setQuantity(1);
    setError(null);
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar producto por nombre o SKU..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          disabled={disabled}
        />
        {filtered.length > 0 && (
          <div className="absolute z-10 w-full mt-1 rounded-lg border border-border bg-card shadow-lg">
            <ScrollArea className="max-h-[240px]">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className="flex w-full flex-wrap items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent/10"
                >
                  <div className="size-10 rounded-md border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">
                        {p.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-[150px] flex-1">
                    <p className="break-words font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.sku} · Stock: {p.stock}
                    </p>
                  </div>
                  <span className="text-sm font-semibold shrink-0">
                    {formatPrice(p.price)}
                  </span>
                </button>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>

      {selected && (
        (() => {
          const availableSizes = getAvailableSizes(selected);
          const availableColors = size ? getAvailableColorsForSize(selected, size) : [];
          const maxStock = size && color ? getVariantStock(selected, size, color) : 0;
          return (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">{selected.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatPrice(selected.price)} · Stock variante: {maxStock}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 self-end sm:self-auto"
              onClick={handleCancel}
              aria-label="Cancelar selección"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Talla
              </label>
              <Select
                value={size}
                onValueChange={(nextSize) => {
                  setSize(nextSize);
                  const colors = getAvailableColorsForSize(selected, nextSize);
                  if (!colors.includes(color)) setColor(colors[0] ?? "");
                  setQuantity(1);
                }}
              >
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selected.sizes.map((s) => (
                    <SelectItem key={s} value={s} disabled={!availableSizes.includes(s)}>
                      {s}{availableSizes.includes(s) ? "" : " · agotado"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Color
              </label>
              <Select value={color} onValueChange={(nextColor) => { setColor(nextColor); setQuantity(1); }}>
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selected.colors.map((c) => (
                    <SelectItem key={c.name} value={c.name} disabled={!availableColors.includes(c.name)}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full border"
                          style={{ backgroundColor: c.hex }}
                        />
                        {c.name}{availableColors.includes(c.name) ? "" : " · agotado"}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Cantidad
              </label>
              <Input
                type="number"
                min={1}
                max={maxStock}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.min(maxStock, Math.max(1, Number(e.target.value) || 1))
                  )
                }
                className="mt-1 h-9"
                disabled={disabled}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleConfirm}
              disabled={disabled || !size || !color || maxStock <= 0 || quantity > maxStock}
            >
              <Plus className="size-3.5" /> Agregar
            </Button>
          </div>
        </div>
          );
        })()
      )}
    </div>
  );
}
