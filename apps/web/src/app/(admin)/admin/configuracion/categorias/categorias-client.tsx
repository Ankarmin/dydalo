"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import { auditStore } from "@/lib/stores/data-store.audit";
import type { CatalogCategory } from "@/lib/stores/data-store.types";
import { ROUTES } from "@/lib/utils/routes";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { notifyAdmin } from "@/components/admin/admin-toast";

export function CategoriasClient() {
  const router = useRouter();
  const { state: authState } = useAuth();
  const actor = { id: authState.user?.id ?? "admin", name: authState.user?.name ?? "Admin" };
  const [categories, setCategories] = useState<CatalogCategory[]>(() => categoriesStore.getAll());
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);

  function toggleActive(cat: CatalogCategory) {
    const updated = categoriesStore.update(cat.slug, { active: !cat.active });
    if (updated) {
      setCategories((prev) => prev.map((c) => (c.slug === cat.slug ? updated : c)));
      auditStore.create({
        actor,
        entityType: "category",
        entityId: cat.slug,
        entityLabel: cat.name,
        action: updated.active ? "activate" : "deactivate",
        summary: `${updated.active ? "Activó" : "Desactivó"} categoría ${cat.name}`,
        before: { active: cat.active },
        after: { active: updated.active },
        changes: [{ field: "active", before: cat.active, after: updated.active }],
      });
      notifyAdmin(updated.active ? "Categoría activada" : "Categoría desactivada");
    }
  }

  function handleDelete() {
    if (!deleteSlug) return;
    const cat = categoriesStore.getBySlug(deleteSlug);
    categoriesStore.delete(deleteSlug);
    setCategories((prev) => prev.filter((c) => c.slug !== deleteSlug));
    if (cat) {
      auditStore.create({
        actor,
        entityType: "category",
        entityId: cat.slug,
        entityLabel: cat.name,
        action: "delete",
        summary: `Eliminó categoría ${cat.name}`,
        before: cat,
      });
    }
    notifyAdmin("Categoría eliminada");
    setDeleteSlug(null);
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const reordered = [...categories];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    const slugs = reordered.map((c) => c.slug);
    categoriesStore.reorder(slugs);
    setCategories(reordered.map((c, i) => ({ ...c, order: i + 1 })));
    const cat = reordered[index - 1];
    auditStore.create({
      actor,
      entityType: "category",
      entityId: cat.slug,
      entityLabel: cat.name,
      action: "update",
      summary: `Reordenó categorías (subió ${cat.name})`,
      changes: [{ field: "order", before: index + 1, after: index }],
    });
    notifyAdmin("Orden actualizado");
  }

  function moveDown(index: number) {
    if (index === categories.length - 1) return;
    const reordered = [...categories];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    const slugs = reordered.map((c) => c.slug);
    categoriesStore.reorder(slugs);
    setCategories(reordered.map((c, i) => ({ ...c, order: i + 1 })));
    const cat = reordered[index + 1];
    auditStore.create({
      actor,
      entityType: "category",
      entityId: cat.slug,
      entityLabel: cat.name,
      action: "update",
      summary: `Reordenó categorías (bajó ${cat.name})`,
      changes: [{ field: "order", before: index + 1, after: index + 2 }],
    });
    notifyAdmin("Orden actualizado");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Categorías</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categorías</p>
        </div>
        <Button asChild>
          <Link href={ROUTES.adminCategoriaNueva}>
            <Plus className="size-4" /> Nueva Categoría
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium w-10">#</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Activo</th>
              <th className="px-4 py-3 font-medium">Productos</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories
              .toSorted((a, b) => a.order - b.order)
              .map((cat, index) => {
                return (
                  <tr key={cat.slug} className="border-b border-border text-sm hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-xs w-6">{cat.order}</span>
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveUp(index)}
                          className="text-muted-foreground hover:text-foreground text-sm leading-none px-1 py-0.5"
                          aria-label="Subir"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveDown(index)}
                          className="text-muted-foreground hover:text-foreground text-sm leading-none px-1 py-0.5"
                          aria-label="Bajar"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={ROUTES.adminCategoriaEditar(cat.slug)}
                        className="hover:text-accent"
                      >
                        {cat.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {cat.slug}
                    </td>
                    <td className="px-4 py-3">
                      <Switch checked={cat.active} onCheckedChange={() => toggleActive(cat)} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <Link
                        href={`${ROUTES.adminProductos}?category=${cat.slug}`}
                        className="text-xs hover:text-accent"
                      >
                        Ver productos →
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => router.push(ROUTES.adminCategoriaEditar(cat.slug))}
                          aria-label="Editar"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteSlug(cat.slug)}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No hay categorías. ¡Crea la primera!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteSlug !== null}
        onOpenChange={(open) => { if (!open) setDeleteSlug(null); }}
        onConfirm={handleDelete}
        title="Eliminar categoría"
        description="¿Estás seguro de eliminar esta categoría? Los productos en esta categoría no se eliminarán."
        variant="destructive"
      />
    </div>
  );
}
