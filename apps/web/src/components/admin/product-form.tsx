"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import { productsStore } from "@/lib/stores/data-store.products";
import { auditStore } from "@/lib/stores/data-store.audit";
import type { ProductSize, ProductVariantStock } from "@/lib/stores/data-store.types";
import { categoriesStore } from "@/lib/stores/data-store.categories";
import { ROUTES } from "@/lib/utils/routes";
import { ADMIN_FORM_SIMULATED_DELAY_MS, DEFAULT_PRODUCT_COLOR_HEX, FEATURED_PRODUCTS_COUNT, LOW_STOCK_THRESHOLD } from "@/config/constants";
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
import { notifyAdmin } from "@/components/admin/admin-toast";
import { useAuth } from "@/contexts/auth-context";
import { isValidHexColor, normalizeText } from "@/lib/validations/forms";
import { cn } from "@/lib/utils/utils";
import Link from "next/link";
import { ImageUploader } from "@/components/admin/image-uploader";
import { MultiImageUploader } from "@/components/admin/multi-image-uploader";
import {
  getVariantId,
  getVariantKey,
  getVariantLowStockThreshold,
  isLowStockVariant,
  isOutOfStockVariant,
} from "@/lib/utils/inventory";

const VALID_SIZES = ["S", "M", "L", "XL", "28", "30", "32", "34", "36", "Única"] as const;

const formSchema = z.object({
  name: z.string().trim().min(3, "Mínimo 3 caracteres").max(100, "Máximo 100 caracteres"),
  category: z.string().min(1, "Selecciona una categoría"),
  price: z.number().finite("Precio inválido").positive("Debe ser mayor a 0"),
  sku: z.string().trim().min(1, "SKU requerido").max(40, "Máximo 40 caracteres"),
  stock: z.number().finite("Stock inválido").int("Debe ser entero").nonnegative("No puede ser negativo"),
  variants: z.array(z.object({
    id: z.string(),
    size: z.enum(VALID_SIZES),
    color: z.string(),
    stock: z.number().finite("Stock inválido").int("Debe ser entero").nonnegative("No puede ser negativo"),
    active: z.boolean(),
    lowStockThreshold: z.number().optional(),
    updatedAt: z.string(),
  })),
  discount: z.number().finite("Descuento inválido").min(0).max(100).nullable(),
  image: z.string().min(1, "Imagen requerida"),
  images: z.array(z.string()),
  active: z.boolean(),
  featured: z.boolean(),
  sizes: z.array(z.string()).min(1, "Al menos una talla").superRefine((val, ctx) => {
    val.forEach((s, i) => {
      if (!(VALID_SIZES as readonly string[]).includes(s)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Talla "${s}" no es válida`, path: [i] });
      }
    });
  }),
  colors: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Nombre requerido"),
        hex: z.string().refine(isValidHexColor, "Color inválido"),
      })
    )
    .min(1, "Al menos un color"),
});

type FormValues = z.infer<typeof formSchema>;

type ColorItem = FormValues["colors"][number];

const defaultValues: FormValues = {
  name: "",
  category: "",
  price: 0,
  sku: "",
  stock: 0,
  variants: [],
  discount: null,
  image: "",
  images: [],
  active: true,
  featured: false,
  sizes: [],
  colors: [],
};

interface ProductFormProps {
  productId?: number;
}

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const { state: authState } = useAuth();
  const isEdit = productId !== undefined;
  const product = useMemo(
    () => (isEdit ? productsStore.getById(productId!) : undefined),
    [isEdit, productId],
  );
  const notFound = isEdit && !product;
  const [isPending, setIsPending] = useState(false);

  const [categories] = useState(categoriesStore.getActive());
  const [newSize, setNewSize] = useState("");
  const featuredCount = productsStore.getAll().filter((p) => p.featured).length;
  const featuredLimitReached = featuredCount >= FEATURED_PRODUCTS_COUNT;

  const isCurrentlyFeatured = product?.featured ?? false;

  const featuredBlocked = featuredLimitReached && !isCurrentlyFeatured;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!product) return;
    form.reset({
      name: product.name,
      category: product.category,
      price: product.price,
      sku: product.sku,
      stock: product.stock,
      variants: product.variants ?? [],
      discount: product.discount,
      image: product.image,
      images: product.images ?? [],
      active: product.active,
      featured: product.featured,
      sizes: product.sizes as unknown as string[],
      colors: product.colors,
    });
  }, [product, form]);

  const sizes = useWatch({ control: form.control, name: "sizes" });
  const colors = useWatch({ control: form.control, name: "colors" });
  const variants = useWatch({ control: form.control, name: "variants" });

  function syncVariants(
    nextSizes: string[],
    nextColors: ColorItem[],
    currentVariants: ProductVariantStock[] = variants as ProductVariantStock[]
  ) {
    const now = new Date().toISOString();
    const current = new Map(
      currentVariants.map((variant) => [getVariantKey(variant.size, variant.color), variant])
    );
    const nextVariants = nextSizes.flatMap((size) =>
      nextColors.map((color) => {
        const key = getVariantKey(size, color.name);
        const existing = current.get(key);
        return {
          id: existing?.id ?? getVariantId(size, color.name),
          size: size as ProductSize,
          color: color.name,
          stock: existing?.stock ?? 0,
          active: existing?.active ?? true,
          lowStockThreshold: existing?.lowStockThreshold ?? LOW_STOCK_THRESHOLD,
          updatedAt: existing?.updatedAt ?? now,
        } satisfies ProductVariantStock;
      })
    );

    form.setValue("variants", nextVariants, { shouldValidate: true, shouldDirty: true });
    form.setValue("stock", nextVariants.reduce((sum, variant) => sum + (variant.active ? variant.stock : 0), 0), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  useEffect(() => {
    if (variants.length === 0 && sizes.length > 0 && colors.length > 0) {
      syncVariants(sizes, colors, []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants.length, sizes.length, colors.length]);

  function addSize() {
    if (!newSize.trim()) return;
    if (sizes.includes(newSize.trim())) return;
    const nextSizes = [...sizes, newSize.trim().toUpperCase()];
    form.setValue("sizes", nextSizes, { shouldValidate: true });
    syncVariants(nextSizes, colors);
    setNewSize("");
  }

  function removeSize(index: number) {
    const size = sizes[index];
    const hasStock = variants.some((variant) => variant.size === size && variant.stock > 0);
    if (hasStock) {
      notifyAdmin("Stock activo", "Primero deja esta talla en 0 desde Inventario", "error");
      return;
    }
    const nextSizes = sizes.filter((_, i) => i !== index);
    form.setValue("sizes", nextSizes, { shouldValidate: true });
    syncVariants(nextSizes, colors);
  }

  function addColor() {
    const nextColors = [...colors, { name: "", hex: DEFAULT_PRODUCT_COLOR_HEX }];
    form.setValue("colors", nextColors, { shouldValidate: true });
    syncVariants(sizes, nextColors);
  }

  function removeColor(index: number) {
    const color = colors[index];
    const hasStock = variants.some((variant) => variant.color === color?.name && variant.stock > 0);
    if (hasStock) {
      notifyAdmin("Stock activo", "Primero deja este color en 0 desde Inventario", "error");
      return;
    }
    const nextColors = colors.filter((_, i) => i !== index);
    form.setValue("colors", nextColors, { shouldValidate: true });
    syncVariants(sizes, nextColors);
  }

  function toggleVariantActive(index: number, active: boolean) {
    const variant = variants[index];
    if (variant?.active && !active && variant.stock > 0) {
      notifyAdmin("Stock activo", "Primero deja esta variante en 0 desde Inventario", "error");
      return;
    }
    const nextVariants = variants.map((variant, i) =>
      i === index ? { ...variant, active, updatedAt: new Date().toISOString() } : variant
    );
    form.setValue("variants", nextVariants, { shouldValidate: true, shouldDirty: true });
    form.setValue("stock", nextVariants.reduce((sum, variant) => sum + (variant.active ? variant.stock : 0), 0), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  const onSubmit = form.handleSubmit((values) => {
    const normalizedValues = {
      ...values,
      name: normalizeText(values.name),
      sku: values.sku.trim().toUpperCase(),
      colors: values.colors.map((color) => ({
        ...color,
        name: normalizeText(color.name),
      })),
      variants: values.variants.map((variant) => ({
        ...variant,
        color: normalizeText(variant.color),
        stock: Math.max(0, Math.trunc(variant.stock)),
      })),
    };
    normalizedValues.stock = normalizedValues.variants.reduce(
      (sum, variant) => sum + (variant.active ? variant.stock : 0),
      0
    );
    const skuExists = productsStore
      .getAll()
      .some(
        (existingProduct) =>
          existingProduct.id !== productId &&
          existingProduct.sku.toLowerCase() === normalizedValues.sku.toLowerCase()
      );

    if (skuExists) {
      form.setError("sku", { message: "Ya existe un producto con este SKU" });
      return;
    }

    if (normalizedValues.featured && featuredBlocked) {
      notifyAdmin("Límite alcanzado", `Máximo ${FEATURED_PRODUCTS_COUNT} productos destacados`, "error");
      return;
    }

    setIsPending(true);

    setTimeout(() => {
      const actor = {
        id: authState.user?.id ?? "admin",
        name: authState.user?.name ?? "Admin",
      };

      if (isEdit) {
        const before = product;
        const updated = productsStore.update(productId!, {
          ...normalizedValues,
          sizes: normalizedValues.sizes as unknown as ProductSize[],
        });
        if (updated) {
          const changes = before
            ? auditStore.diffFields(
                before as unknown as Record<string, unknown>,
                updated as unknown as Record<string, unknown>,
                ["name", "category", "price", "sku", "discount", "active", "featured", "sizes", "colors", "variants"]
              )
            : [];

          if (changes.length > 0) {
            auditStore.create({
              actor,
              entityType: "product",
              entityId: String(updated.id),
              entityLabel: updated.name,
              action: changes.some((change) => change.field === "discount") ? "discount_change" : "update",
              summary: `Editó producto ${updated.name}`,
              before,
              after: updated,
              changes,
            });
          }
          notifyAdmin("Producto actualizado", updated.name, "success");
        }
      } else {
        const created = productsStore.create({
          ...normalizedValues,
          sizes: normalizedValues.sizes as unknown as ProductSize[],
        });
        auditStore.create({
          actor,
          entityType: "product",
          entityId: String(created.id),
          entityLabel: created.name,
          action: "create",
          summary: `Creó producto ${created.name}`,
          after: created,
        });
        notifyAdmin("Producto creado", created.name, "success");
      }
      router.push(ROUTES.adminProductos);
    }, ADMIN_FORM_SIMULATED_DELAY_MS);
  });

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-muted-foreground">Producto no encontrado.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={ROUTES.adminProductos}>Volver a productos</Link>
        </Button>
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
          <h1 className="text-2xl font-bold tracking-heading">
            {isEdit ? "Editar Producto" : "Nuevo Producto"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? "Modifica los campos del producto" : "Completa los campos para crear un producto"}
          </p>
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
                    <Input {...field} placeholder="Heavy Cotton Polo" disabled={isPending} />
                  </FormControl>
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
                        <SelectValue placeholder="Seleccionar..." />
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
                      <Input {...field} placeholder="DYD-ROP-0101" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <p className="text-sm font-medium">Stock total</p>
                <div className="mt-2 flex h-9 items-center rounded-md border border-border bg-muted/30 px-3 text-sm font-semibold">
                  {variants.reduce((sum, variant) => sum + (variant.active ? variant.stock : 0), 0)} unidades
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Se calcula desde las variantes.</p>
              </div>
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

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Galería de imágenes</FormLabel>
                  <FormControl>
                    <MultiImageUploader value={field.value} onChange={field.onChange} disabled={isPending} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Estas imágenes aparecerán al pasar el mouse por la card y en el carrusel del detalle.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Tallas</h2>
            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((size, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1 text-sm">
                    {size}
                    <button type="button" onClick={() => removeSize(i)} className="ml-0.5 rounded-full hover:bg-muted p-0.5" disabled={isPending} aria-label={`Eliminar talla ${size}`}>
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Escribe una talla (ej: S, M, L, XL)..."
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }}
                disabled={isPending}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={addSize} disabled={isPending}>
                <Plus className="size-3.5" /> Añadir
              </Button>
            </div>
            {form.formState.errors.sizes && (
              <p className="text-sm text-destructive">{form.formState.errors.sizes.message}</p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold">Colores</h2>
              <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={addColor} disabled={isPending}>
                <Plus className="size-3.5" /> Añadir color
              </Button>
            </div>
            <div className="space-y-3">
              {colors.map((color: ColorItem, index: number) => (
                <div key={index} className="grid grid-cols-[3rem_1fr_auto] items-center gap-3">
                  <Input
                    type="color"
                    value={color.hex}
                    onChange={(e) => {
                      const updated = [...colors];
                      updated[index] = { ...color, hex: e.target.value };
                      form.setValue("colors", updated, { shouldValidate: true });
                      syncVariants(sizes, updated);
                    }}
                    className="h-9 w-12 p-1"
                    disabled={isPending}
                  />
                  <Input
                    placeholder="Nombre del color"
                    value={color.name}
                    onChange={(e) => {
                      const hasStock = variants.some((variant) => variant.color === color.name && variant.stock > 0);
                      if (hasStock && e.target.value !== color.name) {
                        notifyAdmin("Stock activo", "Primero deja este color en 0 desde Inventario", "error");
                        return;
                      }
                      const updated = [...colors];
                      updated[index] = { ...color, name: e.target.value };
                      form.setValue("colors", updated, { shouldValidate: true });
                      syncVariants(sizes, updated);
                    }}
                    className="min-w-0"
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
            {form.formState.errors.colors && (
              <p className="text-sm text-destructive">{form.formState.errors.colors.message}</p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold">Inventario por variante</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  El stock es de solo lectura. Las entradas y ajustes se registran desde Inventario.
                </p>
              </div>
              {isEdit && (
                <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                  <Link href={ROUTES.adminInventario}>Gestionar stock</Link>
                </Button>
              )}
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Talla</th>
                    <th className="px-3 py-2 font-medium">Color</th>
                    <th className="px-3 py-2 font-medium">Stock</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                    <th className="px-3 py-2 font-medium text-right">Activo</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant, index) => {
                    const status = isOutOfStockVariant(variant)
                      ? "Agotado"
                      : isLowStockVariant(variant)
                        ? "Bajo"
                        : variant.active
                          ? "OK"
                          : "Inactivo";
                    return (
                    <tr key={`${variant.id}-${index}`} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-medium">{variant.size}</td>
                      <td className="px-3 py-2">{variant.color || "Sin nombre"}</td>
                      <td className="px-3 py-2">
                        <span className="font-semibold tabular-nums">{variant.stock}</span>
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            status === "Agotado" && "text-danger",
                            status === "Bajo" && "text-warning",
                            status === "OK" && "text-success"
                          )}
                        >
                          {status}
                        </Badge>
                        {status === "Bajo" && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Límite: {getVariantLowStockThreshold(variant)}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Switch
                          checked={variant.active}
                          onCheckedChange={(checked) => toggleVariantActive(index, checked)}
                          disabled={isPending}
                        />
                      </td>
                    </tr>
                    );
                  })}
                  {variants.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">
                        Agrega al menos una talla y un color para generar inventario.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                <p className="text-xs text-muted-foreground">
                  {featuredBlocked
                    ? `Límite de ${FEATURED_PRODUCTS_COUNT} productos destacados alcanzado`
                    : "Aparece en la homepage"}
                </p>
              </div>
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={featuredBlocked || isPending}
                    className={featuredBlocked ? "opacity-30" : ""}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:flex sm:justify-end">
            <Button variant="outline" type="button" className="w-full sm:w-auto" asChild>
              <Link href={ROUTES.adminProductos}>Cancelar</Link>
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
