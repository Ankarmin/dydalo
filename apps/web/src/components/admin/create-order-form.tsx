"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { productsStore } from "@/lib/stores/data-store.products";
import { usersStore } from "@/lib/stores/data-store.users";
import { ordersStore } from "@/lib/stores/data-store.orders";
import type { AdminProduct } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { ADMIN_FORM_SIMULATED_DELAY_MS } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { formatPrice } from "@/lib/utils/format";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z
  .object({
    customerMode: z.enum(["existing", "new"]),
    existingUserId: z.string().optional(),
    newCustomerName: z.string().optional(),
    newCustomerEmail: z.string().optional(),
    newCustomerPhone: z.string().optional(),

    fullName: z.string().min(3, "Mínimo 3 caracteres"),
    street: z.string().min(5, "Mínimo 5 caracteres"),
    city: z.string().min(2, "Mínimo 2 caracteres"),
    state: z.string().min(2, "Mínimo 2 caracteres"),
    zip: z.string().min(3, "Mínimo 3 caracteres"),
    country: z.string().min(2, "Mínimo 2 caracteres"),
    phone: z.string().min(6, "Mínimo 6 caracteres"),

    items: z
      .array(
        z.object({
          productId: z.number(),
          name: z.string(),
          price: z.number(),
          size: z.string().min(1, "Selecciona talla"),
          color: z.string().min(1, "Selecciona color"),
          quantity: z.number().min(1),
        })
      )
      .min(1, "Agrega al menos un producto"),

    shipping: z.number().min(0, "No puede ser negativo"),
    discount: z.number().min(0, "No puede ser negativo"),
  })
  .superRefine((data, ctx) => {
    if (data.customerMode === "existing" && !data.existingUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona un cliente",
        path: ["existingUserId"],
      });
    }
    if (data.customerMode === "new") {
      if (!data.newCustomerName || data.newCustomerName.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mínimo 3 caracteres",
          path: ["newCustomerName"],
        });
      }
      if (
        !data.newCustomerEmail ||
        !z.string().email().safeParse(data.newCustomerEmail).success
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email inválido",
          path: ["newCustomerEmail"],
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  customerMode: "existing",
  existingUserId: "",
  newCustomerName: "",
  newCustomerEmail: "",
  newCustomerPhone: "",
  fullName: "",
  street: "",
  city: "Lima",
  state: "Lima",
  zip: "",
  country: "Perú",
  phone: "",
  items: [],
  shipping: 0,
  discount: 0,
};

export function CreateOrderForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const customers = useMemo(
    () => usersStore.getAll().filter((u) => u.role === "customer"),
    []
  );

  const activeProducts = useMemo(
    () => productsStore.getAll().filter((p) => p.active),
    []
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const customerMode = useWatch({ control: form.control, name: "customerMode" });
  const items = useWatch({ control: form.control, name: "items" });
  const shipping = useWatch({ control: form.control, name: "shipping" });
  const discount = useWatch({ control: form.control, name: "discount" });

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => Math.max(0, subtotal + shipping - discount),
    [subtotal, shipping, discount]
  );

  const handleCustomerSelect = useCallback(
    (userId: string) => {
      const user = customers.find((u) => u.id === userId);
      if (user) {
        form.setValue("fullName", user.name, { shouldValidate: false });
        form.setValue("phone", user.phone ?? "", { shouldValidate: false });
      }
    },
    [customers, form]
  );

  const removeItem = useCallback(
    (index: number) => {
      const updated = items.filter((_, i) => i !== index);
      form.setValue("items", updated, { shouldValidate: true });
    },
    [items, form]
  );

  const addItem = useCallback(
    (product: AdminProduct, size: string, color: string, quantity: number) => {
      const existing = items.find(
        (i) =>
          i.productId === product.id && i.size === size && i.color === color
      );
      if (existing) {
        const updated = items.map((i) =>
          i.productId === product.id &&
          i.size === size &&
          i.color === color
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
        form.setValue("items", updated, { shouldValidate: true });
      } else {
        form.setValue(
          "items",
          [
            ...items,
            {
              productId: product.id,
              name: product.name,
              price: product.price,
              size,
              color,
              quantity,
            },
          ],
          { shouldValidate: true }
        );
      }
    },
    [items, form]
  );

  const onSubmit = form.handleSubmit((values) => {
    setIsPending(true);

    setTimeout(() => {
      let userId = "";

      if (values.customerMode === "existing" && values.existingUserId) {
        userId = values.existingUserId;
      } else {
        const created = usersStore.create({
          name: values.newCustomerName!,
          email: values.newCustomerEmail!,
          role: "customer",
          phone: values.newCustomerPhone || undefined,
        });
        userId = created.id;
      }

      const order = ordersStore.create({
        userId,
        items: values.items.map((item) => ({ ...item })),
        subtotal,
        shipping: values.shipping,
        discount: values.discount,
        total,
        shippingAddress: {
          fullName: values.fullName,
          street: values.street,
          city: values.city,
          state: values.state,
          zip: values.zip,
          country: values.country,
          phone: values.phone,
        },
        trackingNumber: null,
        notes: null,
      });

      notifyAdmin("Pedido creado", `#${order.id.slice(0, 8)}`, "success");
      router.push(ROUTES.adminPedidoDetalle(order.id));
    }, ADMIN_FORM_SIMULATED_DELAY_MS);
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.adminPedidos}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-heading">
            Nuevo Pedido Manual
          </h1>
          <p className="text-sm text-muted-foreground">
            Registra un pedido en tienda
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Cliente */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Cliente</h2>

            <FormField
              control={form.control}
              name="customerMode"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.clearErrors([
                          "existingUserId",
                          "newCustomerName",
                          "newCustomerEmail",
                        ]);
                      }}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="existing" id="existing" />
                        <label
                          htmlFor="existing"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Cliente existente
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="new" id="new" />
                        <label
                          htmlFor="new"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Nuevo cliente
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {customerMode === "existing" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="existingUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seleccionar cliente</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          handleCustomerSelect(v);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Buscar cliente..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} — {c.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="newCustomerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Nombre completo"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newCustomerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="email"
                          placeholder="cliente@email.com"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newCustomerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="+51 999 999 999"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Dirección de Envío */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Dirección de Envío</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+51 999 999 999" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Av. Principal 123" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cód. Postal</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Productos */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Productos</h2>
            <ProductSearch products={activeProducts} onAdd={addItem} disabled={isPending} />

            {items.length > 0 && (
              <div className="space-y-2 mt-4">
                {items.map((item, i) => (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/20"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.size} · {item.color} · x{item.quantity}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.price)} c/u
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => removeItem(i)}
                      disabled={isPending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {form.formState.errors.items && (
              <p className="text-sm text-destructive">
                {form.formState.errors.items.message}
              </p>
            )}
          </div>

          {/* Totales */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Totales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-xs">Subtotal</label>
                <p className="text-lg font-bold mt-1">{formatPrice(subtotal)}</p>
              </div>
              <FormField
                control={form.control}
                name="shipping"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Envío (S/)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descuento (S/)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-xl font-bold text-accent">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" asChild>
              <Link href={ROUTES.adminPedidos}>Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Crear Pedido
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function ProductSearch({
  products,
  onAdd,
  disabled,
}: {
  products: AdminProduct[];
  onAdd: (product: AdminProduct, size: string, color: string, quantity: number) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminProduct | null>(null);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [products, query]);

  function handleSelect(product: AdminProduct) {
    setSelected(product);
    setQuery("");
    setSize(product.sizes.length > 0 ? product.sizes[0] : "");
    setColor(product.colors.length > 0 ? product.colors[0].name : "");
    setQuantity(1);
  }

  function handleConfirm() {
    if (!selected || !size || !color || quantity < 1) return;
    onAdd(selected, size, color, quantity);
    setSelected(null);
    setSize("");
    setColor("");
    setQuantity(1);
  }

  function handleCancel() {
    setSelected(null);
    setSize("");
    setColor("");
    setQuantity(1);
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar producto por nombre o SKU..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          disabled={disabled}
        />
        {filtered.length > 0 && (
          <div className="absolute z-10 w-full mt-1 rounded-lg border border-border bg-card shadow-lg">
            <ScrollArea className="max-h-[240px]">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className="flex items-center gap-3 w-full px-3 py-2 text-left text-sm hover:bg-accent/10 transition-colors"
                >
                  <div className="size-10 rounded-md border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">
                        {p.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.sku} · Stock: {p.stock}
                    </p>
                  </div>
                  <span className="text-sm font-semibold shrink-0">
                    {formatPrice(p.price)}
                  </span>
                </button>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>

      {selected && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{selected.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatPrice(selected.price)} · Stock: {selected.stock}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleCancel}
              aria-label="Cancelar selección"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Talla
              </label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selected.sizes.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Color
              </label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selected.colors.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full border"
                          style={{ backgroundColor: c.hex }}
                        />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Cantidad
              </label>
              <Input
                type="number"
                min={1}
                max={selected.stock}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value) || 1))
                }
                className="h-8 mt-1"
                disabled={disabled}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={disabled || !size || !color}
            >
              <Plus className="size-3.5" /> Agregar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
