"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { categoriesStore } from "@/lib/data-store.categories";
import { ROUTES } from "@/lib/routes";
import { ADMIN_FORM_SIMULATED_DELAY_MS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  description: z.string(),
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
  const [loading, setLoading] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", image: "", active: true },
  });

  useEffect(() => {
    if (!isEdit) return;
    const cat = categoriesStore.getBySlug(slug);
    if (!cat) { setNotFound(true); return; }
    form.reset({ name: cat.name, description: cat.description, active: cat.active });
    setLoading(false);
  }, [slug, form, isEdit]);

  function onSubmit(values: FormValues) {
    setIsPending(true);
    setTimeout(() => {
      if (isEdit) {
        const updated = categoriesStore.update(slug!, values);
        if (updated) {
          toast.success(`Categoría "${updated.name}" actualizada`);
          router.push(ROUTES.adminCategorias);
          return;
        }
        toast.error("Error al actualizar categoría");
        setIsPending(false);
        return;
      }
      const created = categoriesStore.create(values);
      toast.success(`Categoría "${created.name}" creada`);
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

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
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
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} rows={3} disabled={isPending} /></FormControl><FormMessage /></FormItem>
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
