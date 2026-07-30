"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { productsStore } from "@/lib/stores/data-store.products";
import { usersStore } from "@/lib/stores/data-store.users";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { addressesStore } from "@/lib/stores/data-store.addresses";
import { stockMovementsStore } from "@/lib/stores/data-store.stock-movements";
import { auditStore } from "@/lib/stores/data-store.audit";
import type { Address, AdminProduct } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { ADMIN_FORM_SIMULATED_DELAY_MS } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductSearch } from "@/components/admin/product-search";
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
import { useAuth } from "@/contexts/auth-context";
import { departments, type Province } from "@/config/ubigeos";
import {
  isValidPhone,
  normalizeEmail,
  normalizePhone,
  normalizeText,
} from "@/lib/validations/forms";
import { composeFullName } from "@/lib/utils/user-name";

const formSchema = z
  .object({
    customerMode: z.enum(["existing", "new"]),
    existingUserId: z.string().optional(),
    newCustomerFirstName: z.string().trim().optional(),
    newCustomerLastName: z.string().trim().optional(),
    newCustomerEmail: z.string().trim().optional(),
    newCustomerPhone: z.string().trim().optional(),

    addressMode: z.enum(["existing", "new"]),
    existingAddressId: z.string().optional(),
    addressLabel: z.string().optional(),
    saveAddress: z.boolean(),

    fullName: z.string().trim().optional(),
    street: z.string().trim(),
    district: z.string().trim().optional(),
    city: z.string().trim(),
    state: z.string().trim(),
    zip: z.string().optional(),
    country: z.string().trim().optional(),
    phone: z.string().trim().optional(),

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
    if (
      data.customerMode === "existing" &&
      data.addressMode === "existing" &&
      !data.existingAddressId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona una dirección",
        path: ["existingAddressId"],
      });
    }
    if (data.addressMode === "new") {
      if (data.street.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mínimo 5 caracteres",
          path: ["street"],
        });
      }
      if (!data.state.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecciona un departamento",
          path: ["state"],
        });
      }
      if (!data.city.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecciona una provincia",
          path: ["city"],
        });
      }
      if (!data.district?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Distrito requerido",
          path: ["district"],
        });
      }
    }
    if (data.customerMode === "new") {
      if (!data.newCustomerFirstName || data.newCustomerFirstName.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mínimo 2 caracteres",
          path: ["newCustomerFirstName"],
        });
      }
      if (!data.newCustomerLastName || data.newCustomerLastName.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mínimo 2 caracteres",
          path: ["newCustomerLastName"],
        });
      }
      if (
        !data.newCustomerEmail ||
        !z.string().email().safeParse(data.newCustomerEmail.trim()).success
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email inválido",
          path: ["newCustomerEmail"],
        });
      }
      if (data.newCustomerPhone && !isValidPhone(data.newCustomerPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Teléfono inválido",
          path: ["newCustomerPhone"],
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  customerMode: "existing",
  existingUserId: "",
  newCustomerFirstName: "",
  newCustomerLastName: "",
  newCustomerEmail: "",
  newCustomerPhone: "",
  addressMode: "new",
  existingAddressId: "",
  addressLabel: "",
  saveAddress: true,
  fullName: "",
  street: "",
  district: "",
  city: "",
  state: "",
  zip: "",
  country: "Perú",
  phone: "",
  items: [],
  shipping: 0,
  discount: 0,
};

function formatAddressLabel(address: Address): string {
  return `${address.street}, ${address.district}, ${address.city}, ${address.state}`;
}

export function CreateOrderForm() {
  const router = useRouter();
  const { state: authState } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const customers = useMemo(
    () => usersStore.getAll().filter((u) => u.role === "customer"),
    []
  );

  const activeProducts = useMemo(
    () => productsStore.getAll().filter((p) => p.active),
    []
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const customerMode = useWatch({ control: form.control, name: "customerMode" });
  const existingUserId = useWatch({ control: form.control, name: "existingUserId" });
  const existingAddressId = useWatch({ control: form.control, name: "existingAddressId" });
  const addressMode = useWatch({ control: form.control, name: "addressMode" });
  const selectedDepartment = useWatch({ control: form.control, name: "state" });
  const selectedProvince = useWatch({ control: form.control, name: "city" });
  const items = useWatch({ control: form.control, name: "items" });
  const shipping = useWatch({ control: form.control, name: "shipping" });
  const discount = useWatch({ control: form.control, name: "discount" });

  const customerAddresses = useMemo(() => {
    if (!existingUserId) return [];
    const seen = new Set<string>();
    return addressesStore.getByUserId(existingUserId).filter((address) => {
      const key = `${address.street}|${address.district}|${address.city}|${address.state}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [existingUserId]);
  const isUsingSavedAddress =
    customerMode === "existing" &&
    addressMode === "existing" &&
    customerAddresses.length > 0;
  const selectedSavedAddress = useMemo(
    () => customerAddresses.find((address) => address.id === existingAddressId),
    [customerAddresses, existingAddressId]
  );
  const departmentData = useMemo(
    () => departments.find((department) => department.name === selectedDepartment),
    [selectedDepartment]
  );
  const provinces: Province[] = useMemo(
    () => departmentData?.provinces ?? [],
    [departmentData]
  );
  const provinceData = useMemo(
    () => provinces.find((province) => province.name === selectedProvince),
    [provinces, selectedProvince]
  );
  const districts = provinceData?.districts ?? [];

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => Math.max(0, subtotal + shipping - discount),
    [subtotal, shipping, discount]
  );

  const findMatchingAddress = useCallback(
    (userId: string, street: string, district: string, city: string, state: string) =>
      addressesStore
        .getByUserId(userId)
        .find(
          (address) =>
            address.street.trim().toLowerCase() === street.trim().toLowerCase() &&
            address.district.trim().toLowerCase() === district.trim().toLowerCase() &&
            address.city.trim().toLowerCase() === city.trim().toLowerCase() &&
            address.state.trim().toLowerCase() === state.trim().toLowerCase()
        ),
    []
  );

  const fillAddress = useCallback(
    (address: Address) => {
      form.setValue("street", address.street, { shouldValidate: true });
      form.setValue("state", address.state, { shouldValidate: true });
      form.setValue("city", address.city, { shouldValidate: true });
      form.setValue("district", address.district, { shouldValidate: true });
      form.setValue("zip", address.zip ?? "", { shouldValidate: true });
      form.clearErrors(["street", "state", "city", "district", "zip"]);
    },
    [form]
  );

  const handleCustomerSelect = useCallback(
    (userId: string) => {
      const user = customers.find((u) => u.id === userId);
      if (user) {
        form.setValue("fullName", user.name, { shouldValidate: false });
        form.setValue("phone", user.phone ?? "", { shouldValidate: false });

        const addresses = addressesStore.getByUserId(userId);
        const preferredAddress =
          addresses.find((address) => address.isDefault) ?? addresses[0];

        if (preferredAddress) {
          form.setValue("addressMode", "existing", { shouldValidate: false });
          form.setValue("existingAddressId", preferredAddress.id, {
            shouldValidate: true,
          });
          fillAddress(preferredAddress);
        } else {
          form.setValue("addressMode", "new", { shouldValidate: false });
          form.setValue("existingAddressId", "", { shouldValidate: false });
          form.setValue("street", "", { shouldValidate: false });
          form.setValue("district", "", { shouldValidate: false });
          form.setValue("city", "", { shouldValidate: false });
          form.setValue("state", "", { shouldValidate: false });
          form.setValue("zip", "", { shouldValidate: false });
        }
      }
    },
    [customers, fillAddress, form]
  );

  const handleAddressSelect = useCallback(
    (addressId: string) => {
      const address = addressesStore.getById(addressId);
      if (!address) return;
      fillAddress(address);
    },
    [fillAddress]
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

  const onSubmit = form.handleSubmit((rawValues) => {
    const values = {
      ...rawValues,
      newCustomerFirstName: rawValues.newCustomerFirstName
        ? normalizeText(rawValues.newCustomerFirstName)
        : rawValues.newCustomerFirstName,
      newCustomerLastName: rawValues.newCustomerLastName
        ? normalizeText(rawValues.newCustomerLastName)
        : rawValues.newCustomerLastName,
      newCustomerEmail: rawValues.newCustomerEmail
        ? normalizeEmail(rawValues.newCustomerEmail)
        : rawValues.newCustomerEmail,
      newCustomerPhone: rawValues.newCustomerPhone
        ? normalizePhone(rawValues.newCustomerPhone)
        : rawValues.newCustomerPhone,
      fullName: rawValues.fullName ? normalizeText(rawValues.fullName) : "",
      street: normalizeText(rawValues.street),
      district: rawValues.district ? normalizeText(rawValues.district) : "",
      city: normalizeText(rawValues.city),
      state: normalizeText(rawValues.state),
      country: rawValues.country ? normalizeText(rawValues.country) : "Perú",
      phone: rawValues.phone ? normalizePhone(rawValues.phone) : "",
    };
    if (
      values.customerMode === "new" &&
      values.newCustomerEmail &&
      usersStore
        .getAll()
        .some((user) => user.email.toLowerCase() === values.newCustomerEmail?.toLowerCase())
    ) {
      form.setError("newCustomerEmail", {
        message: "Ya existe una cuenta con este email",
      });
      return;
    }

    setIsPending(true);

    setTimeout(() => {
      let userId = "";
      let shippingAddressId: string | undefined;
      let selectedAddress: Address | undefined;
      let customerFullName = values.fullName;
      let customerPhone = values.phone;

      if (values.customerMode === "existing" && values.existingUserId) {
        userId = values.existingUserId;
        const customer = usersStore.getById(userId);
        customerFullName = customer?.name ?? customerFullName;
        customerPhone = customer?.phone ?? customerPhone;
        selectedAddress =
          values.addressMode === "existing" && values.existingAddressId
            ? addressesStore.getById(values.existingAddressId)
            : undefined;

        if (selectedAddress?.userId === userId) {
          shippingAddressId = selectedAddress.id;
        } else {
          selectedAddress = undefined;
        }

        if (values.addressMode === "new" && values.saveAddress) {
          const existingAddresses = addressesStore.getByUserId(userId);
          const matchingAddress = findMatchingAddress(
            userId,
            values.street,
            values.district ?? "",
            values.city,
            values.state
          );

          if (matchingAddress) {
            shippingAddressId = matchingAddress.id;
          } else {
            const createdAddress = addressesStore.create({
              userId,
              label: values.addressLabel?.trim() || "Dirección",
              street: values.street,
              district: values.district ?? "",
              city: values.city,
              state: values.state,
              zip: values.zip ?? "",
              isDefault: existingAddresses.length === 0,
            });
            shippingAddressId = createdAddress.id;
          }
        }
      } else {
        const created = usersStore.create({
          name: composeFullName(values.newCustomerFirstName!, values.newCustomerLastName!),
          firstName: values.newCustomerFirstName!,
          lastName: values.newCustomerLastName!,
          email: values.newCustomerEmail!,
          role: "customer",
          phone: values.newCustomerPhone || undefined,
          password: "Dydalo123",
        });
        userId = created.id;
        customerFullName = created.name;
        customerPhone = created.phone ?? "";

        const matchingAddress = findMatchingAddress(
          userId,
          values.street,
          values.district ?? "",
          values.city,
          values.state
        );
        const createdAddress = matchingAddress ?? addressesStore.create({
          userId,
          label: values.addressLabel?.trim() || "Dirección",
          street: values.street,
          district: values.district ?? "",
          city: values.city,
          state: values.state,
          zip: values.zip ?? "",
          isDefault: true,
        });
        shippingAddressId = createdAddress.id;
      }

      const shippingAddress = {
        fullName: customerFullName,
        street: selectedAddress?.street ?? values.street,
        district: selectedAddress?.district ?? values.district ?? "",
        city: selectedAddress?.city ?? values.city,
        state: selectedAddress?.state ?? values.state,
        zip: selectedAddress?.zip ?? values.zip ?? "",
        country: "Perú",
        phone: customerPhone,
      };
      const orderItems = values.items.map((item) => ({ ...item }));
      const stockValidation = productsStore.validateStockChange([], orderItems);
      if (!stockValidation.success) {
        notifyAdmin("Stock insuficiente", stockValidation.error, "error");
        setIsPending(false);
        return;
      }

      const stockUpdate = productsStore.applyStockChange([], orderItems);
      if (!stockUpdate.success) {
        notifyAdmin("Stock insuficiente", stockUpdate.error, "error");
        setIsPending(false);
        return;
      }

      const order = ordersStore.create({
        userId,
        shippingAddressId,
        source: "admin",
        createdBy: authState.user?.id ?? "admin",
        stockReserved: true,
        items: orderItems,
        subtotal,
        shipping: values.shipping,
        discount: values.discount,
        total,
        shippingAddress,
      });

      const actor = {
        id: authState.user?.id ?? "admin",
        name: authState.user?.name ?? "Admin",
      };

      stockMovementsStore.createFromOrderDiff({
        previousItems: [],
        nextItems: orderItems,
        type: "sale",
        orderId: order.id,
        actor,
        reason: "Pedido manual admin",
      });

      auditStore.create({
        actor,
        entityType: "order",
        entityId: order.id,
        entityLabel: `#${order.id.slice(0, 8)}`,
        action: "create",
        summary: `Creó pedido manual para ${customerFullName}`,
        after: order,
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
                        form.setValue("addressMode", "new", { shouldValidate: false });
                        form.setValue("existingAddressId", "", { shouldValidate: false });
                        form.setValue("addressLabel", "", { shouldValidate: false });
                        form.clearErrors([
                          "existingUserId",
                          "newCustomerFirstName",
                          "newCustomerLastName",
                          "newCustomerEmail",
                          "existingAddressId",
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="newCustomerFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombres</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Nombres"
                          autoComplete="given-name"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newCustomerLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellidos</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Apellidos"
                          autoComplete="family-name"
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

            {customerMode === "existing" && customerAddresses.length > 0 && (
              <FormField
                control={form.control}
                name="addressMode"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          if (v === "new") {
                            form.setValue("existingAddressId", "", {
                              shouldValidate: false,
                            });
                            form.setValue("addressLabel", "", { shouldValidate: false });
                            form.setValue("street", "", { shouldValidate: false });
                            form.setValue("district", "", { shouldValidate: false });
                            form.setValue("city", "", { shouldValidate: false });
                            form.setValue("state", "", { shouldValidate: false });
                            form.setValue("zip", "", { shouldValidate: false });
                          }
                        }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="existing" id="address-existing" />
                          <label
                            htmlFor="address-existing"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Usar dirección guardada
                          </label>
                        </div>

                        {addressMode === "existing" && (
                          <FormField
                            control={form.control}
                            name="existingAddressId"
                            render={({ field: addressField }) => (
                              <FormItem className="sm:pl-6">
                                <Select
                                  onValueChange={(v) => {
                                    addressField.onChange(v);
                                    handleAddressSelect(v);
                                    form.clearErrors([
                                      "existingAddressId",
                                      "street",
                                      "state",
                                      "city",
                                      "district",
                                    ]);
                                  }}
                                  value={addressField.value}
                                  disabled={isPending}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar dirección..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {customerAddresses.map((address) => (
                                      <SelectItem key={address.id} value={address.id}>
                                        {formatAddressLabel(address)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="new" id="address-new" />
                          <label
                            htmlFor="address-new"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Ingresar nueva dirección
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isUsingSavedAddress && selectedSavedAddress ? (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <p className="font-medium">{formatAddressLabel(selectedSavedAddress)}</p>
                {selectedSavedAddress.zip && (
                  <p className="mt-1 text-muted-foreground">
                    Código postal: {selectedSavedAddress.zip}
                  </p>
                )}
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Av. Principal 123"
                        disabled={isPending || isUsingSavedAddress}
                      />
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
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        form.setValue("state", value, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                        form.setValue("city", "", { shouldValidate: false });
                        form.setValue("district", "", { shouldValidate: false });
                        form.clearErrors(["state", "city", "district"]);
                      }}
                      disabled={isPending || isUsingSavedAddress}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar departamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem key={department.name} value={department.name}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provincia</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        form.setValue("city", value, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                        form.setValue("district", "", { shouldValidate: false });
                        form.clearErrors(["city", "district"]);
                      }}
                      disabled={isPending || isUsingSavedAddress || !selectedDepartment}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedDepartment ? "Seleccionar provincia" : "Elige departamento"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem key={province.name} value={province.name}>
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distrito</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) => {
                        form.setValue("district", value, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                        form.clearErrors("district");
                      }}
                      disabled={isPending || isUsingSavedAddress || !selectedProvince}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedProvince ? "Seleccionar distrito" : "Elige provincia"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código postal (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending || isUsingSavedAddress}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(customerMode === "new" || addressMode === "new") && (
                <>
                  <FormField
                    control={form.control}
                    name="addressLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Etiqueta</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Etiqueta opcional"
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {customerMode === "existing" && (
                    <FormField
                      control={form.control}
                      name="saveAddress"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 pt-6">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer text-sm font-normal">
                            Guardar esta dirección en el cliente
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
            </div>
            )}
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
