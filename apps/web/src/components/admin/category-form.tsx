"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import { useStoreData } from "@/hooks/use-store-data";
import { ROUTES } from "@/lib/utils/routes";
import { ADMIN_FORM_SIMULATED_DELAY_MS } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/admin/image-uploader";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { notifyAdmin } from "@/components/admin/admin-toast";

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  image: z.string(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface CategoryFormProps {
  slug?: string;
}

export function CategoryForm({ slug }: CategoryFormProps) {
  const router = useRouter();
  const isEdit = slug !== undefined;
  const category = useStoreData(() => isEdit ? categoriesStore.getBySlug(slug) : undefined, undefined);
  const notFound = isEdit && !category;
  const [isPending, setIsPending] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", image: "", active: true },
  });

  useEffect(() => {
    if (!category) return;
    form.reset({ name: category.name, image: category.image, active: category.active });
  }, [category, form]);

  function onSubmit(values: FormValues) {
    setIsPending(true);
    setTimeout(() => {
      if (isEdit) {
        const updated = categoriesStore.update(slug!, values);
        if (updated) {
          notifyAdmin("Categoría actualizada", updated.name, "success");
          router.push(ROUTES.adminCategorias);
          return;
        }
        notifyAdmin("Error al actualizar", "Categoría no encontrada", "error");
        setIsPending(false);
        return;
      }
      const created = categoriesStore.create(values);
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
            <FormField control={form.control} name="image" render={({ field }) => (
              <FormItem>
                <FormLabel>Imagen</FormLabel>
                <FormControl>
                  <ImageUploader value={field.value} onChange={field.onChange} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
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
