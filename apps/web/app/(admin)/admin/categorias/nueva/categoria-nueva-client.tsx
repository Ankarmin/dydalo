"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { categoriesStore } from "@/lib/data-store.categories";
import { ROUTES } from "@/lib/routes";
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
  description: z.string().default(""),
  active: z.boolean(),
});

export function CategoriaNuevaClient() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", active: true },
  } as any);

  function onSubmit(values: any) {
    setIsPending(true);
    setTimeout(() => {
      const created = categoriesStore.create(values);
      toast.success(`Categoría "${created.name}" creada`);
      router.push(ROUTES.adminCategorias);
    }, 400);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.adminCategorias}><ArrowLeft className="size-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Nueva Categoría</h1>
          <p className="text-sm text-muted-foreground">El slug se generará automáticamente del nombre</p>
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
              Crear Categoría
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
