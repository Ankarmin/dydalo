"use client";

import { useState } from "react";
import type { AdminProduct, SizeGuideData } from "@/lib/stores/data-store.types";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/utils";

type SizeGuideMap = Record<string, Record<string, string>>;

const ropaGuia: SizeGuideMap = {
  S: { Pecho: "86-91", Cintura: "71-76", Cadera: "86-91" },
  M: { Pecho: "91-99", Cintura: "76-81", Cadera: "91-99" },
  L: { Pecho: "99-107", Cintura: "81-89", Cadera: "99-107" },
  XL: { Pecho: "107-117", Cintura: "89-99", Cadera: "107-117" },
};

const calzadoGuia: SizeGuideMap = {
  "38": { US: "6", UK: "5", CM: "24.0" },
  "39": { US: "6.5", UK: "5.5", CM: "24.5" },
  "40": { US: "7", UK: "6", CM: "25.0" },
  "41": { US: "8", UK: "7", CM: "26.0" },
  "42": { US: "8.5", UK: "7.5", CM: "26.5" },
  "43": { US: "9", UK: "8", CM: "27.0" },
};

const CLOTHING_CATEGORIES = ["ropa", "polos", "casacas", "pantalones", "shorts", "hoodies", "jeans", "camisas", "tanks"];
const tabs = ["Ropa", "Calzado"] as const;

function isClothingCategory(category: string): boolean {
  return CLOTHING_CATEGORIES.some((c) => category.toLowerCase().includes(c));
}

interface SizeGuideModalProps {
  product: AdminProduct;
  className?: string;
}

function SizeTable({ guia }: { guia: SizeGuideMap }) {
  const tallas = Object.keys(guia);
  const medidas = Object.keys(guia[tallas[0]]);
  const isRopa = medidas.includes("Pecho");

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-border text-left">
        <thead>
          <tr className="border-b border-border bg-secondary/30">
            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Talla
            </th>
            {medidas.map((medida) => (
              <th
                key={medida}
                className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
              >
                {medida}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tallas.map((talla, index) => (
            <tr
              key={talla}
              className={cn(
                "border-b border-border transition-colors hover:bg-accent/5",
                index === tallas.length - 1 && "border-b-0"
              )}
            >
              <td className="px-5 py-4 text-sm font-bold uppercase tracking-tight">{talla}</td>
              {medidas.map((medida) => (
                <td key={medida} className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
                  {guia[talla][medida]}
                  {isRopa ? " cm" : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-right text-[10px] text-muted-foreground">
        {isRopa
          ? "* Medidas en centímetros"
          : "* Medidas en centímetros. US/UK son equivalencias."}
      </p>
    </div>
  );
}

function SizeTableFromData({ data }: { data: SizeGuideData }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-border text-left">
        <thead>
          <tr className="border-b border-border bg-secondary/30">
            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Talla
            </th>
            {data.columns.map((col) => (
              <th
                key={col}
                className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, index) => (
            <tr
              key={row.size}
              className={cn(
                "border-b border-border transition-colors hover:bg-accent/5",
                index === data.rows.length - 1 && "border-b-0"
              )}
            >
              <td className="px-5 py-4 text-sm font-bold uppercase tracking-tight">{row.size}</td>
              {data.columns.map((_, ci) => (
                <td key={ci} className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
                  {row.values[ci] ?? "-"}
                  {data.unit ? ` ${data.unit}` : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-right text-[10px] text-muted-foreground">
        * Medidas en {data.unit || "centímetros"}
      </p>
    </div>
  );
}

export function SizeGuideModal({ product, className }: SizeGuideModalProps) {
  const [open, setOpen] = useState(false);

  const category = categoriesStore.getBySlug(product.category);
  const hasCustomGuide = Boolean(category?.sizeGuide?.columns?.length && category?.sizeGuide?.rows?.length);

  const defaultCategory = isClothingCategory(product.category) ? "Ropa" : "Calzado";
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>(defaultCategory);
  const guia = activeTab === "Ropa" ? ropaGuia : calzadoGuia;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          size="sm"
          className={cn("h-auto p-0 text-xs underline underline-offset-2", className)}
        >
          Guía de tallas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Guía de tallas</DialogTitle>
          <DialogDescription>
            {product.name}
          </DialogDescription>
        </DialogHeader>

        {hasCustomGuide && category?.sizeGuide ? (
          <div className="mt-2">
            <SizeTableFromData data={category.sizeGuide} />
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex gap-2" role="tablist" aria-label="Categoría de tallas">
              {tabs.map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "street"}
                  size="sm"
                  onClick={() => setActiveTab(tab)}
                  role="tab"
                  aria-selected={activeTab === tab}
                  className="uppercase tracking-[0.04em]"
                >
                  {tab}
                </Button>
              ))}
            </div>
            <div className="mt-4">
              <SizeTable guia={guia} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
