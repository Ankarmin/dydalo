"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import { productsStore } from "@/lib/data-store.products";
import type { ProductSize } from "@/lib/data-store.types";
import { categoriesStore } from "@/lib/data-store.categories";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { ImageUploader } from "@/components/admin/image-uploader";

const formSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  type: z.enum(["Ropa", "Calzado", "Accesorios", "Bling"]),
  category: z.string().min(1, "Selecciona una categoría"),
  price: z.coerce.number().positive("Debe ser mayor a 0"),
  sku: z.string().min(1, "SKU requerido"),
  stock: z.coerce.number().int().nonnegative("No puede ser negativo"),
  discount: z.coerce.number().min(0).max(100).nullish(),
  image: z.string().default(""),
  active: z.boolean(),
  featured: z.boolean(),
  sizes: z.array(z.string()).min(1, "Al menos una talla"),
  colors: z.array(z.object({ name: z.string().min(1), hex: z.string() })).min(1, "Al menos un color"),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  name: "",
  type: "Ropa",
  category: "",
  price: 0,
  sku: "",
  stock: 0,
  discount: null,
  image: "",
  active: true,
  featured: false,
  sizes: [],
  colors: [{ name: "", hex: "#1a1a1a" }],
};

export function ProductoEditarClient({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notFound_, setNotFound] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [categories] = useState(categoriesStore.getActive());
  const [newSize, setNewSize] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  useEffect(() => {
    const product = productsStore.getById(id);
    if (!product) {
      setNotFound(true);
      return;
    }
    form.reset({
      name: product.name,
      type: product.type,
      category: product.category,
      price: product.price,
      sku: product.sku,
      stock: product.stock,
      discount: product.discount ?? null,
      image: product.image,
      active: product.active,
      featured: product.featured,
      sizes: product.sizes as unknown as string[],
      colors: product.colors,
    });
    setLoading(false);
  }, [id, form]);

  const sizes = form.watch("sizes") as string[];
  const colors = form.watch("colors");

  function addSize() {
    if (!newSize.trim()) return;
    if (sizes.includes(newSize.trim())) return;
    form.setValue("sizes", [...sizes, newSize.trim().toUpperCase()], { shouldValidate: true });
    setNewSize("");
  }

  function removeSize(index: number) {
    form.setValue("sizes", sizes.filter((_: string, i: number) => i !== index), { shouldValidate: true });
  }

  function addColor() {
    form.setValue("colors", [...colors, { name: "", hex: "#1a1a1a" }] as any);
  }

  function removeColor(index: number) {
    form.setValue("colors", colors.filter((_: any, i: number) => i !== index) as any, { shouldValidate: true });
  }

  const onSubmit = form.handleSubmit((values) => {
    setIsPending(true);

    setTimeout(() => {
      const updated = productsStore.update(id, {
        ...values,
        sizes: values.sizes as unknown as ProductSize[],
        discount: values.discount ?? null,
      });

      if (updated) {
        toast.success(`Producto "${updated.name}" actualizado`);
        router.push(ROUTES.adminProductos);
      } else {
        toast.error("Error al actualizar producto");
        setIsPending(false);
      }
    }, 400);
  });

  if (notFound_) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Producto no encontrado</h2>
          <Link href={ROUTES.adminProductos} className="text-accent underline text-sm">
            Volver a productos
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.adminProductos}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Editar Producto</h1>
          <p className="text-sm text-muted-foreground">ID: {id}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Información básica</h2>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ropa">Ropa</SelectItem>
                        <SelectItem value="Calzado">Calzado</SelectItem>
                        <SelectItem value="Accesorios">Accesorios</SelectItem>
                        <SelectItem value="Bling">Bling</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.slug} value={cat.slug}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (S/)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descuento (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagen del producto</FormLabel>
                  <FormControl>
                    <ImageUploader value={field.value} onChange={field.onChange} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Tallas</h2>
            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((size: string, i: number) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1 text-sm">
                    {size}
                    <button type="button" onClick={() => removeSize(i)} className="ml-0.5 rounded-full hover:bg-muted p-0.5" disabled={isPending}>
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Escribe una talla (ej: S, M, L, XL)..."
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }}
                disabled={isPending}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={addSize} disabled={isPending}>
                <Plus className="size-3.5" /> Añadir
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Colores</h2>
              <Button type="button" variant="outline" size="sm" onClick={addColor} disabled={isPending}>
                <Plus className="size-3.5" /> Añadir color
              </Button>
            </div>
            <div className="space-y-3">
              {colors.map((color: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={color.hex}
                    onChange={(e) => {
                      const updated = [...colors];
                      updated[index] = { ...color, hex: e.target.value };
                      form.setValue("colors", updated, { shouldValidate: true });
                    }}
                    className="w-12 h-9 p-1"
                    disabled={isPending}
                  />
                  <Input
                    value={color.name}
                    onChange={(e) => {
                      const updated = [...colors];
                      updated[index] = { ...color, name: e.target.value };
                      form.setValue("colors", updated, { shouldValidate: true });
                    }}
                    className="flex-1"
                    disabled={isPending}
                  />
                  {colors.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeColor(index)}
                      disabled={isPending}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Configuración</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Activo</p>
                <p className="text-xs text-muted-foreground">Visible en el catálogo público</p>
              </div>
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                )}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Destacado</p>
                <p className="text-xs text-muted-foreground">Aparece en la homepage</p>
              </div>
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                )}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" asChild>
              <Link href={ROUTES.adminProductos}>Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
