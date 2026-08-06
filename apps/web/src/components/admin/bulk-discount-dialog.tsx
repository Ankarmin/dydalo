"use client";

import { useState } from "react";
import { Percent } from "lucide-react";
import { productsStore } from "@/lib/stores/data-store.products";
import { auditStore } from "@/lib/stores/data-store.audit";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { Button } from "@/components/ui/button";
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

interface BulkDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productIds: string[];
  actor: { id: string; name: string };
  onApplied: () => void;
}

export function BulkDiscountDialog({
  open,
  onOpenChange,
  productIds,
  actor,
  onApplied,
}: BulkDiscountDialogProps) {
  const [porcentaje, setPorcentaje] = useState(20);
  const [quitar, setQuitar] = useState(false);
  const [pending, setPending] = useState(false);
  const invalidPercentage = !quitar && (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100);

  function handleApply() {
    if (productIds.length === 0) {
      notifyAdmin("Sin productos", "Selecciona al menos un producto", "error");
      return;
    }
    if (invalidPercentage) {
      notifyAdmin("Descuento inválido", "Ingresa un valor entre 0 y 100", "error");
      return;
    }

    setPending(true);
    setTimeout(() => {
      const discountValue = quitar ? null : porcentaje;

      for (const id of productIds) {
        const before = productsStore.getById(id);
        const updated = productsStore.update(id, { discount: discountValue });
        if (!before || !updated || before.discount === updated.discount) continue;

        auditStore.create({
          actor,
          entityType: "discount",
          entityId: String(updated.id),
          entityLabel: updated.name,
          action: "discount_change",
          summary: `${quitar ? "Quitó" : "Aplicó"} descuento en ${updated.name}`,
          before: { discount: before.discount },
          after: { discount: updated.discount },
          changes: [{ field: "discount", before: before.discount, after: updated.discount }],
        });
      }

      onApplied();

      notifyAdmin(
        quitar
          ? "Descuentos eliminados"
          : `${porcentaje}% de descuento aplicado`,
        `${productIds.length} producto${productIds.length !== 1 ? "s" : ""}`,
        "success"
      );

      setPending(false);
      onOpenChange(false);
    }, 300);
  }

  return (
    <Dialog key={`discount-${open}`} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle className="flex items-center justify-center sm:justify-start gap-2">
            <Percent className="size-5 text-accent" />
            {quitar ? "Quitar Descuentos" : "Aplicar Descuento"}
          </DialogTitle>
          <DialogDescription>
            {productIds.length} producto{productIds.length !== 1 ? "s" : ""} seleccionado
            {productIds.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="porcentaje"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Descuento (%)
            </Label>
            <Input
              id="porcentaje"
              type="number"
              min={0}
              max={100}
              value={porcentaje}
              onChange={(e) =>
                setPorcentaje(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
              }
              disabled={quitar}
              className={quitar ? "opacity-50" : ""}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="quitar"
              checked={quitar}
              onCheckedChange={(c) => setQuitar(Boolean(c))}
            />
            <Label
              htmlFor="quitar"
              className="text-sm cursor-pointer text-muted-foreground"
            >
              Quitar descuentos (dejar sin oferta)
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 sm:space-x-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button size="sm" className="w-full sm:w-auto" onClick={handleApply} disabled={pending || productIds.length === 0 || invalidPercentage}>
            {quitar ? "Quitar descuentos" : `Aplicar ${porcentaje}%`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
