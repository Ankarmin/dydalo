"use client";

import { useState, useMemo, useDeferredValue, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, Download, Upload } from "lucide-react";
import { productsStore } from "@/lib/stores/data-store.products";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import { seedIfEmpty } from "@/config/seed-data";
import type { AdminProduct } from "@/lib/stores/data-store.types";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { exportProductsCSV, importProductsFromCSV } from "@/lib/utils/csv";
import { FEATURED_PRODUCTS_COUNT } from "@/config/constants";
import { notifyAdmin } from "@/components/admin/admin-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { cn } from "@/lib/utils/utils";
import { formatPrice } from "@/lib/utils/format";
import { SortableHeader, defaultSort, type SortState } from "@/components/admin/sortable-header";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 15;

export function ProductosClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<AdminProduct[]>(() => {
    seedIfEmpty();
    return productsStore.getAll();
  });
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>(defaultSort);

  const deferredQuery = useDeferredValue(query);

  const featuredCount = useMemo(
    () => products.filter((p) => p.featured).length,
    [products]
  );

  const filtered = useMemo(() => {
    let result = products;
    if (deferredQuery) {
      const q = deferredQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "todas") {
      result = result.filter((p) => p.category === categoryFilter);
    }
    if (sort.field) {
      result = [...result].sort((a, b) => {
        const dir = sort.direction === "asc" ? 1 : -1;
        switch (sort.field) {
          case "name": return dir * a.name.localeCompare(b.name);
          case "sku": return dir * a.sku.localeCompare(b.sku);
          case "category": return dir * a.category.localeCompare(b.category);
          case "price": return dir * (a.price - b.price);
          case "stock": return dir * (a.stock - b.stock);
          default: return 0;
        }
      });
    }
    return result;
  }, [products, deferredQuery, categoryFilter, sort]);

  const isStale = query !== deferredQuery;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleActive(product: AdminProduct) {
    const updated = productsStore.update(product.id, { active: !product.active });
    if (updated) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      notifyAdmin(updated.active ? "Producto activado" : "Producto desactivado");
    }
  }

  function toggleFeatured(product: AdminProduct) {
    if (!product.featured && featuredCount >= FEATURED_PRODUCTS_COUNT) {
      notifyAdmin("Límite alcanzado", `Máximo ${FEATURED_PRODUCTS_COUNT} productos destacados`, "error");
      return;
    }
    const updated = productsStore.update(product.id, { featured: !product.featured });
    if (updated) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
    }
  }

  function handleDelete() {
    if (deleteId === null) return;
    const ok = productsStore.delete(deleteId);
    if (ok) {
      setProducts((prev) => prev.filter((p) => p.id !== deleteId));
      notifyAdmin("Producto eliminado");
    }
    setDeleteId(null);
  }

  function handleExport() {
    exportProductsCSV(filtered);
    notifyAdmin("CSV exportado", `${filtered.length} productos`, "success");
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== "string") return;

      const result = importProductsFromCSV(text, (data) =>
        productsStore.create(data)
      );

      setProducts(productsStore.getAll());

      if (result.errors.length > 0) {
        notifyAdmin(
          "Importación parcial",
          `${result.created} creados, ${result.errors.length} errores`,
          "error"
        );
      } else {
        notifyAdmin("Importación completa", `${result.created} productos importados`, "success");
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Productos</h1>
          <p className="text-sm text-muted-foreground">
            {categoryFilter !== "todas" || query
              ? `${filtered.length} de ${products.length} productos`
              : `${products.length} productos totales`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-3.5" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-3.5" />
            Importar CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
          <Button asChild>
            <Link href={ROUTES.adminProductoNuevo}>
              <Plus className="size-4" />
              Nuevo Producto
            </Link>
          </Button>
        </div>
      </div>

      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setPage(1); }}>
          <SelectTrigger className="w-[200px] h-9 text-xs">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {categoriesStore.getActive().map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      
      <div
        className={cn(
          "rounded-xl border border-border bg-card overflow-hidden transition-opacity",
          isStale && "opacity-70"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <SortableHeader label="Producto" field="name" currentSort={sort} onSortChange={setSort} />
                <SortableHeader label="SKU" field="sku" currentSort={sort} onSortChange={setSort} />
                <SortableHeader label="Categoría" field="category" currentSort={sort} onSortChange={setSort} />
                <SortableHeader label="Precio" field="price" currentSort={sort} onSortChange={setSort} />
                <SortableHeader label="Stock" field="stock" currentSort={sort} onSortChange={setSort} />
                <th className="px-3 py-2 font-medium">Activo</th>
                <th className="px-3 py-2 font-medium">Destacado</th>
                <th className="px-3 py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((product) => (
                <tr key={product.id} className="border-b border-border text-sm hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-md border bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image} alt="" className="size-full object-cover rounded-md" />
                        ) : (
                          product.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{product.sku}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="capitalize text-xs">
                      {product.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {product.discount ? (
                      <div>
                        <span>{formatPrice(product.price * (1 - product.discount / 100))}</span>
                        <span className="ml-1 text-xs text-muted-foreground line-through">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    ) : (
                      formatPrice(product.price)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "font-medium",
                        product.stock === 0 ? "text-danger" : product.stock <= 5 ? "text-warning" : ""
                      )}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={product.active}
                      onCheckedChange={() => toggleActive(product)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {featuredCount >= FEATURED_PRODUCTS_COUNT && !product.featured ? (
                      <span
                        title={`Máximo ${FEATURED_PRODUCTS_COUNT} productos destacados`}
                        className="inline-block cursor-not-allowed"
                      >
                        <Switch checked={false} disabled className="opacity-30" />
                      </span>
                    ) : (
                      <Switch
                        checked={product.featured}
                        onCheckedChange={() => toggleFeatured(product)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => router.push(ROUTES.adminProductoEditar(product.id))}
                        aria-label="Editar"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(product.id)}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    {query || categoryFilter !== "todas"
                      ? "No se encontraron productos con los filtros actuales"
                      : "No hay productos. ¡Crea el primero!"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent className="overflow-x-auto">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0) {
                  const prev = arr[idx - 1] as number;
                  if (p - prev > 1) acc.push("...");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <PaginationItem key={`e-${i}`}>
                    <span className="px-2 text-muted-foreground">...</span>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => setPage(p)}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={handleDelete}
        title="Eliminar producto"
        description="¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer."
        variant="destructive"
      />
    </div>
  );
}
