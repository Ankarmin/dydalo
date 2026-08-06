"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import { auditStore } from "@/lib/stores/data-store.audit";
import type { SizeGuideData } from "@/lib/stores/data-store.types";
import { useStoreData } from "@/hooks/use-store-data";
import { ROUTES } from "@/lib/utils/routes";
import { ADMIN_FORM_SIMULATED_DELAY_MS } from "@/config/constants";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { normalizeText } from "@/lib/validations/forms";

const schema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(60, "Máximo 60 caracteres"),
  active: z.boolean(),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type FormValues = z.infer<typeof schema>;

function emptyGuide(): SizeGuideData {
  return { columns: [], unit: "cm", rows: [] };
}

interface CategoryFormProps {
  slug?: string;
}

export function CategoryForm({ slug }: CategoryFormProps) {
  const router = useRouter();
  const { state: authState } = useAuth();
  const isEdit = slug !== undefined;
  const category = useStoreData(() => isEdit ? categoriesStore.getBySlug(slug) : undefined);
  const notFound = isEdit && !category;
  const [isPending, setIsPending] = useState(false);

  const [hasGuide, setHasGuide] = useState(false);
  const [guide, setGuide] = useState<SizeGuideData>(emptyGuide());
  const [newColumn, setNewColumn] = useState("");

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", active: true },
  });

  useEffect(() => {
    if (!category) return;
    form.reset({ name: category.name, active: category.active });
    if (category.sizeGuide) {
      setHasGuide(true);
      setGuide(category.sizeGuide);
    }
  }, [category, form]);

  function addColumn() {
    const trimmed = newColumn.trim();
    if (!trimmed) return;
    if (guide.columns.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return;
    setGuide((g) => {
      const columns = [...g.columns, trimmed];
      const rows = g.rows.map((row) => ({ ...row, values: [...row.values, ""] }));
      return { ...g, columns, rows };
    });
    setNewColumn("");
  }

  function removeColumn(index: number) {
    setGuide((g) => {
      const columns = g.columns.filter((_, i) => i !== index);
      const rows = g.rows.map((row) => {
        const values = row.values.filter((_, i) => i !== index);
        return { ...row, values };
      });
      return { ...g, columns, rows };
    });
  }

  function addRow() {
    setGuide((g) => {
      const values = g.columns.map(() => "");
      return { ...g, rows: [...g.rows, { size: "", values }] };
    });
  }

  function removeRow(index: number) {
    setGuide((g) => {
      const rows = g.rows.filter((_, i) => i !== index);
      return { ...g, rows };
    });
  }

  function updateRowSize(index: number, size: string) {
    setGuide((g) => {
      const rows = [...g.rows];
      rows[index] = { ...rows[index], size };
      return { ...g, rows };
    });
  }

  function updateRowValue(rowIndex: number, colIndex: number, value: string) {
    setGuide((g) => {
      const rows = [...g.rows];
      const values = [...rows[rowIndex].values];
      values[colIndex] = value;
      rows[rowIndex] = { ...rows[rowIndex], values };
      return { ...g, rows };
    });
  }

  function toggleHasGuide(enabled: boolean) {
    setHasGuide(enabled);
    if (!enabled) setGuide(emptyGuide());
  }

  function onSubmit(values: FormValues) {
    const normalizedValues: { name: string; active: boolean; sizeGuide?: SizeGuideData } = {
      ...values,
      name: normalizeText(values.name),
    };

    if (hasGuide) {
      const validGuide: SizeGuideData = {
        columns: guide.columns.filter((c) => c.trim()),
        unit: guide.unit || "cm",
        rows: guide.rows
          .filter((r) => r.size.trim())
          .map((r) => ({
            size: r.size.trim(),
            values: r.values.map((v) => v.trim()),
          })),
      };
      if (validGuide.columns.length > 0 && validGuide.rows.length > 0) {
        normalizedValues.sizeGuide = validGuide;
      } else {
        normalizedValues.sizeGuide = undefined;
      }
    } else {
      normalizedValues.sizeGuide = undefined;
    }

    const nextSlug = generateSlug(values.name);
    const duplicate = categoriesStore
      .getAll()
      .some(
        (existingCategory) =>
          existingCategory.slug !== slug &&
          (existingCategory.slug === nextSlug ||
            existingCategory.name.toLowerCase() === values.name.toLowerCase())
      );

    if (duplicate) {
      form.setError("name", { message: "Ya existe una categoría con este nombre" });
      return;
    }

    setIsPending(true);
    setTimeout(() => {
      const actor = {
        id: authState.user?.id ?? "admin",
        name: authState.user?.name ?? "Admin",
      };

      if (isEdit) {
        const before = category;
        const updated = categoriesStore.update(slug!, normalizedValues);
        if (updated) {
          const changes = before
            ? auditStore.diffFields(
                before as unknown as Record<string, unknown>,
                updated as unknown as Record<string, unknown>,
                ["name", "active", "sizeGuide"]
              )
            : [];

          if (changes.length > 0) {
            auditStore.create({
              actor,
              entityType: "category",
              entityId: updated.slug,
              entityLabel: updated.name,
              action: "update",
              summary: `Editó categoría ${updated.name}`,
              before,
              after: updated,
              changes,
            });
          }
          notifyAdmin("Categoría actualizada", updated.name, "success");
          router.push(ROUTES.adminCategorias);
          return;
        }
        notifyAdmin("Error al actualizar", "Categoría no encontrada", "error");
        setIsPending(false);
        return;
      }
      const created = categoriesStore.create(normalizedValues);
      auditStore.create({
        actor,
        entityType: "category",
        entityId: created.slug,
        entityLabel: created.name,
        action: "create",
        summary: `Creó categoría ${created.name}`,
        after: created,
      });
      notifyAdmin("Categoría creada", created.name, "success");
      router.push(ROUTES.adminCategorias);
    }, ADMIN_FORM_SIMULATED_DELAY_MS);
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Categoría no encontrada</h2>
          <Link href={ROUTES.adminCategorias} className="text-accent underline text-sm">Volver a categorías</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.adminCategorias}><ArrowLeft className="size-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-heading">
            {isEdit ? "Editar Categoría" : "Nueva Categoría"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? `Slug: ${slug}` : "El slug se generará automáticamente del nombre"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} placeholder="NOMBRE CATEGORÍA" disabled={isPending} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Guía de tallas</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Define las columnas y filas con las medidas para esta categoría.
                </p>
              </div>
              <Switch
                checked={hasGuide}
                onCheckedChange={toggleHasGuide}
                disabled={isPending}
              />
            </div>

            {hasGuide && (
              <div className="space-y-4 pt-2">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Unidad de medida
                  </p>
                  <Input
                    value={guide.unit}
                    onChange={(e) => setGuide((g) => ({ ...g, unit: e.target.value }))}
                    placeholder="cm"
                    disabled={isPending}
                    className="max-w-[120px]"
                  />
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Columnas
                  </p>
                  {guide.columns.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {guide.columns.map((col, i) => (
                        <Badge key={i} variant="secondary" className="gap-1 pr-1 text-sm">
                          {col}
                          <button
                            type="button"
                            onClick={() => removeColumn(i)}
                            className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                            disabled={isPending}
                            aria-label={`Eliminar columna ${col}`}
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ej: Pecho, Cintura..."
                      value={newColumn}
                      onChange={(e) => setNewColumn(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColumn(); } }}
                      disabled={isPending}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addColumn} disabled={isPending}>
                      <Plus className="size-3.5" /> Añadir
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Tallas ({guide.rows.length})
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRow}
                      disabled={isPending}
                    >
                      <Plus className="size-3.5" /> Añadir talla
                    </Button>
                  </div>

                  {guide.rows.length > 0 && guide.columns.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-xs text-muted-foreground">
                            <th className="px-3 py-2 font-medium">Talla</th>
                            {guide.columns.map((col, i) => (
                              <th key={i} className="px-3 py-2 font-medium">{col}</th>
                            ))}
                            <th className="px-3 py-2 w-10" />
                          </tr>
                        </thead>
                        <tbody>
                          {guide.rows.map((row, ri) => (
                            <tr key={ri} className="border-b border-border last:border-0">
                              <td className="px-2 py-1.5">
                                <Input
                                  value={row.size}
                                  onChange={(e) => updateRowSize(ri, e.target.value)}
                                  placeholder="S"
                                  disabled={isPending}
                                  className="h-8 w-16 text-xs"
                                />
                              </td>
                              {guide.columns.map((_, ci) => (
                                <td key={ci} className="px-2 py-1.5">
                                  <Input
                                    value={row.values[ci] ?? ""}
                                    onChange={(e) => updateRowValue(ri, ci, e.target.value)}
                                    placeholder="-"
                                    disabled={isPending}
                                    className="h-8 w-20 text-xs"
                                  />
                                </td>
                              ))}
                              <td className="px-2 py-1.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                  onClick={() => removeRow(ri)}
                                  disabled={isPending}
                                >
                                  <X className="size-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {guide.rows.length > 0 && guide.columns.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Agrega al menos una columna para definir las medidas.
                    </p>
                  )}

                  {guide.rows.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Agrega tallas con sus medidas. Si no agregas ninguna, se usará la guía por defecto.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Activo</p><p className="text-xs text-muted-foreground">Visible en el catálogo público</p></div>
              <FormField control={form.control} name="active" render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
              )} />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" asChild><Link href={ROUTES.adminCategorias}>Cancelar</Link></Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Guardar Cambios" : "Crear Categoría"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
