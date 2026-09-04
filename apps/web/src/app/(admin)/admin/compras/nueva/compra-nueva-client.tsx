"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { suppliersStore } from "@/lib/stores/data-store.suppliers";
import { purchasesStore } from "@/lib/stores/data-store.purchases";
import { productsStore } from "@/lib/stores/data-store.products";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { formatPrice } from "@/lib/utils/format";

type Line = { productId: string; quantity: number; unitCost: number };

export function CompraNuevaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state: authState } = useAuth();
  const suppliers = useMemo(() => suppliersStore.getAll().filter((s) => s.active), []);
  const products = useMemo(() => productsStore.getAll().filter((p) => p.active), []);
  const [supplierId, setSupplierId] = useState(searchParams.get("proveedor") ?? "");
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: 1, unitCost: 0 }]);
  const [note, setNote] = useState("");

  const total = lines.reduce((sum, l) => sum + (l.quantity > 0 && l.unitCost >= 0 ? l.quantity * l.unitCost : 0), 0);

  function setLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { productId: "", quantity: 1, unitCost: 0 }]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleCreate() {
    if (!supplierId) {
      notifyAdmin("Falta proveedor", "Selecciona un proveedor activo.", "error");
      return;
    }
    const valid = lines.filter((l) => l.productId && l.quantity > 0 && l.unitCost >= 0);
    if (valid.length === 0) {
      notifyAdmin("Sin líneas", "Agrega al menos un producto con cantidad y costo.", "error");
      return;
    }
    const created = purchasesStore.create({
      supplierId,
      lines: valid,
      note,
      actorId: authState.user?.id ?? "admin",
      actorName: authState.user?.name ?? "Admin",
    });
    if (!created) {
      notifyAdmin("No se pudo crear", "Revisa proveedor y líneas.", "error");
      return;
    }
    notifyAdmin("Compra creada", created.code, "success");
    router.push(ROUTES.adminCompraDetalle(created.id));
  }

  return (
    <div className="space-y-6">
      <Link href={ROUTES.adminCompras} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a compras
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-heading">Nueva compra</h1>
        <p className="text-sm text-muted-foreground">Total estimado: {formatPrice(total)}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <Label>Proveedor *</Label>
        <Select value={supplierId} onValueChange={setSupplierId}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
          <SelectContent>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {suppliers.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Sin proveedores activos. <Link href={ROUTES.adminProveedores} className="text-accent hover:underline">Crear uno</Link>
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">Líneas</h2>
        <div className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_100px_120px_auto]">
              <div>
                <Label>Producto</Label>
                <Select value={line.productId} onValueChange={(v) => setLine(i, { productId: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} · {p.sku}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cantidad</Label>
                <Input type="number" min={1} className="mt-1" value={line.quantity} onChange={(e) => setLine(i, { quantity: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Costo unit. S/</Label>
                <Input type="number" min={0} step="0.01" className="mt-1" value={line.unitCost} onChange={(e) => setLine(i, { unitCost: Number(e.target.value) })} />
              </div>
              <div className="flex items-end">
                <Button variant="ghost" size="icon" onClick={() => removeLine(i)} aria-label="Quitar línea">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addLine} className="mt-3">
          <Plus className="size-4" /> Agregar línea
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <Label>Nota (opcional)</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: entrega parcial en 2 tandas" className="mt-1" />
        <Button onClick={handleCreate} className="mt-4 w-full">Crear orden de compra</Button>
      </div>
    </div>
  );
}
