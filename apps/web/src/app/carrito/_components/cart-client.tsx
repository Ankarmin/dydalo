"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, Trash2, ArrowRight, ArrowLeft, MapPin, CreditCard, Check } from "lucide-react";
import { showOrderConfirmedToast } from "@/components/cart/order-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/utils";
import { formatPrice, getDisplayPrice } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/routes";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { productsStore } from "@/lib/stores/data-store.products";
import { stockMovementsStore } from "@/lib/stores/data-store.stock-movements";
import { addressesStore } from "@/lib/stores/data-store.addresses";
import { couponsStore } from "@/lib/stores/data-store.coupons";
import type { Address } from "@/lib/stores";
import { departments, type Province } from "@/config/ubigeos";
import { SHIPPING_PROVINCIA_PRICE } from "@/config/constants";
import { getVariantStock } from "@/lib/utils/inventory";
import { ApiError, isApiEnabled } from "@/lib/api/client";
import {
  apiCreateOrder,
  apiMpPreference,
  apiValidateCoupon,
  type ApiCheckoutItem,
} from "@/lib/api/orders";
import { apiCreateAddress, apiGetAddresses } from "@/lib/api/addresses";

const STEPS = [
  { num: 1, label: "Carrito", icon: ShoppingCart },
  { num: 2, label: "Envío", icon: MapPin },
  { num: 3, label: "Pago", icon: CreditCard },
] as const;

const PAYMENT_METHODS = [
  { value: "mercadopago", label: "Tarjeta online (MercadoPago)", disabled: false },
] as const;

const checkoutLabelClass =
  "text-[11px] leading-relaxed uppercase tracking-[0.14em] sm:text-xs sm:tracking-wider";

function ProgressSteps({ current }: { current: number }) {
  return (
    <nav aria-label="Progreso del checkout" className="mb-8 sm:mb-12">
      <ol className="flex items-center justify-center gap-0">
        {STEPS.map((step, i) => {
          const isActive = step.num === current;
          const isCompleted = step.num < current;
          const isLast = i === STEPS.length - 1;

          return (
            <li key={step.num} className="flex items-center">
              <div
                className={cn(
                  "flex flex-col items-center gap-1.5",
                  (isActive || isCompleted) ? "text-accent" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all sm:size-10",
                    isActive && "border-accent bg-accent text-accent-foreground",
                    isCompleted && "border-accent bg-accent text-accent-foreground",
                    !isActive && !isCompleted && "border-muted-foreground/30",
                  )}
                >
                  {isCompleted ? <Check className="size-4" /> : step.num}
                </span>
                <span className="w-16 text-center text-[9px] font-bold uppercase leading-tight tracking-[0.12em] sm:text-[10px] sm:tracking-wider">
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "mx-1 h-0.5 w-4 rounded-full transition-colors sm:mx-2 sm:w-16",
                    step.num < current ? "bg-accent" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function CartClient() {
  const router = useRouter();
  const { state, meta } = useAuth();
  const { cartItems, cartCount, subtotal, catalogLive, retryCatalog, updateQuantity, clearCart } = useCart();

  const [step, setStep] = useState(1);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    if (state.status === "loading") return;
    if (!state.user) {
      router.replace(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.carrito)}`);
      return;
    }
    if (meta.isAdmin) {
      router.replace(ROUTES.catalogo);
    }
  }, [meta.isAdmin, router, state.status, state.user]);

  const [department, setDepartment] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mercadopago");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [addressLabel, setAddressLabel] = useState("");
  const [addressMode, setAddressMode] = useState<"saved" | "new">(
    state.user && addressesStore.getByUserId(state.user.id).length > 0 ? "saved" : "new"
  );
  const [fulfillmentType, setFulfillmentType] = useState<"LIMA_APP" | "PROVINCIA_OLVA" | "RECOJO">("LIMA_APP");
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [phone, setPhone] = useState("");
  const apiMode = isApiEnabled();

  const deptData = useMemo(
    () => departments.find((d) => d.name === department),
    [department]
  );
  const checkoutProvinces: Province[] = useMemo(
    () => deptData?.provinces ?? [],
    [deptData]
  );
  const checkoutProvinceData = useMemo(
    () => checkoutProvinces.find((p) => p.name === selectedProvince),
    [checkoutProvinces, selectedProvince]
  );
  const checkoutDistricts: string[] = checkoutProvinceData?.districts ?? [];

  // En modo API las guardadas viven en el backend (GET /addresses); en mock,
  // en el store local. Se guarda el dueño para no mostrar lista ajena al
  // cambiar de usuario sin recargar (derivación en render, sin efectos).
  const userId = state.user?.id;
  const [remote, setRemote] = useState<{ userId: string; list: Address[] } | null>(null);
  useEffect(() => {
    if (!apiMode || !userId) return;
    let alive = true;
    const owner = userId;
    apiGetAddresses()
      .then((list) => {
        if (alive) setRemote({ userId: owner, list });
      })
      .catch(() => {
        if (alive) setRemote({ userId: owner, list: [] });
      });
    return () => {
      alive = false;
    };
  }, [apiMode, userId]);
  const remoteAddresses = remote && remote.userId === userId ? remote.list : null;

  const savedAddresses: Address[] = useMemo(() => {
    if (!state.user) return [];
    if (apiMode) return remoteAddresses ?? [];
    return addressesStore.getByUserId(state.user.id);
  }, [apiMode, remoteAddresses, state.user]);
  const selectedSavedAddress = savedAddresses.find(
    (savedAddress) => savedAddress.id === selectedAddressId
  );

  // Prefill del teléfono con el del perfil (el backend lo exige: 9-15 dígitos).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- precarga puntual al cargar el usuario, no suscripción reactiva
    if (state.user?.phone) setPhone((current) => current || state.user?.phone || "");
  }, [state.user]);

  function fillFromAddress(addr: Address) {
    setAddress(addr.street);
    setDepartment(addr.state);
    setSelectedProvince(addr.city);
    setSelectedDistrict(addr.district);
    setPhone(addr.phone);
    setReference("");
  }
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const shippingCost = fulfillmentType === "PROVINCIA_OLVA" ? SHIPPING_PROVINCIA_PRICE : 0;
  const fulfillmentNote =
    fulfillmentType === "LIMA_APP"
      ? "Lo pagas al conductor al recibir. Desde S/10 aprox."
      : fulfillmentType === "PROVINCIA_OLVA"
        ? `Olva desde S/${SHIPPING_PROVINCIA_PRICE}*. Se confirma por WhatsApp.`
        : "Gratis. Coordinamos por WhatsApp según disponibilidad.";

  async function applyCoupon() {
    if (!state.user) return;
    // Vía API: el backend valida (vigencia, usos, mínimo) y calcula.
    if (isApiEnabled()) {
      try {
        const result = await apiValidateCoupon(couponInput, subtotal);
        if (!result.valid) {
          setCouponError(result.error ?? "Cupón no válido.");
          return;
        }
        setCouponCode(couponInput.trim().toUpperCase().replace(/\s+/g, ""));
        setCouponDiscount(result.discount ?? 0);
        setCouponError("");
      } catch (error) {
        setCouponError(error instanceof Error ? error.message : "Cupón no válido.");
      }
      return;
    }
    const result = couponsStore.validate(couponInput, {
      userId: state.user.id,
      email: state.user.email,
      subtotal,
    });
    if (!result.valid) {
      setCouponError(result.error);
      return;
    }
    setCouponCode(result.coupon.code);
    setCouponDiscount(result.discount);
    setCouponError("");
  }

  function removeCoupon() {
    setCouponCode(null);
    setCouponDiscount(0);
    setCouponError("");
    setCouponInput("");
  }

  if (state.status === "loading" || !state.user || meta.isAdmin) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Preparando tu sesión...
      </div>
    );
  }

  const isCartValid = cartCount > 0;
  // Sin catálogo del backend no se puede pagar: los ids provisorios el
  // backend los rechaza ("Producto no encontrado"). Se reintenta solo.
  const catalogBlocked = apiMode && !catalogLive;
  const canGoToStep2 = isCartValid && !catalogBlocked;
  const phoneDigits = phone.replace(/\D/g, "");
  // El backend exige teléfono válido en el snapshot del pedido (vía mock no se valida).
  const phoneValidationError =
    apiMode && (phoneDigits.length < 9 || phoneDigits.length > 15)
      ? "Ingresa un teléfono válido (9 a 15 dígitos)."
      : null;
  const shippingValidationError =
    addressMode === "saved"
      ? selectedSavedAddress
        ? null
        : "Selecciona una dirección guardada para continuar."
      : !department.trim()
        ? "Selecciona un departamento."
        : !selectedProvince.trim()
          ? "Selecciona una provincia."
          : !selectedDistrict.trim()
            ? "Selecciona un distrito."
            : !address.trim()
              ? "Ingresa una dirección."
              : phoneValidationError;
  const isShippingValid = shippingValidationError === null;
  const canGoToStep3 = canGoToStep2 && isShippingValid;

  const handleRemoveItem = (item: (typeof cartItems)[number]) => {
    updateQuantity(item.productId, -item.quantity, item);
  };

  // El backend habla técnico ("Producto no encontrado: <id>"): al cliente se
  // le muestra causa humana y el link a Mis pedidos que ya acompaña el error.
  function friendlyOrderError(error: unknown): string {
    if (error instanceof ApiError && error.status === 404) {
      return "Uno de tus productos ya no está disponible. Revisa tu carrito e inténtalo de nuevo.";
    }
    return error instanceof Error ? error.message : "No se pudo crear el pedido";
  }

  // Checkout contra el backend (Fase 7): el servidor tasa, reserva stock,
  // valida el cupón y crea el intento en una transacción. Luego pide la
  // preferencia MP: si hay token redirige a MercadoPago, si no (mock)
  // confirma como hoy y el pago se concilia por webhook/simulador.
  async function submitApiOrder() {
    if (!state.user) return;
    // Ids reales del backend (el carrito resuelve contra la lista fusionada
    // API-primero): el servidor resuelve cada variante por talla/color.
    const items: ApiCheckoutItem[] = cartItems.map((cartItem) => ({
      productId: cartItem.product.id,
      size: cartItem.size,
      color: cartItem.color,
      quantity: cartItem.quantity,
    }));

    // Dirección: las guardadas del backend tienen id real; una nueva solo se
    // persiste si el usuario lo pide (nunca se manda un id local al backend).
    let shippingAddressId: string | undefined;
    let snapshot: Address;
    if (addressMode === "saved" && selectedSavedAddress) {
      shippingAddressId = selectedSavedAddress.id;
      snapshot = { ...selectedSavedAddress, userId: state.user.id };
    } else {
      snapshot = {
        id: "",
        userId: state.user.id,
        label: addressLabel.trim() || "Envío",
        fullName: state.user.name,
        street: address,
        district: selectedDistrict,
        city: selectedProvince,
        state: department,
        zip: "",
        country: "Perú",
        phone,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (saveAddress) {
        try {
          const created = await apiCreateAddress({
            label: snapshot.label,
            fullName: snapshot.fullName,
            street: snapshot.street,
            district: snapshot.district,
            city: snapshot.city,
            state: snapshot.state,
            country: snapshot.country,
            phone: snapshot.phone,
          });
          shippingAddressId = created.id;
          const owner = state.user.id;
          setRemote((prev) =>
            prev && prev.userId === owner
              ? { ...prev, list: [...prev.list, created] }
              : { userId: owner, list: [created] },
          );
        } catch (error) {
          setSubmitError(error instanceof Error ? error.message : "No pudimos guardar tu dirección.");
          setSubmitting(false);
          return;
        }
      }
    }

    let order: Awaited<ReturnType<typeof apiCreateOrder>>;
    try {
      order = await apiCreateOrder({
        items,
        fulfillmentType,
        couponCode: couponCode ?? undefined,
        paymentMethod,
        shippingAddressId,
        shippingAddress: snapshot,
      });
    } catch (error) {
      setSubmitError(friendlyOrderError(error));
      setSubmitting(false);
      return;
    }
    clearCart();
    try {
      const preference = await apiMpPreference(order.id);
      if (!preference.mock) {
        window.location.assign(preference.initPoint);
        return;
      }
    } catch {
      // El pedido ya quedó creado y reservado: se paga después.
      setSubmitError("No pudimos abrir MercadoPago. Tu pedido quedó guardado, complétalo desde Mis pedidos.");
      setSubmitting(false);
      return;
    }
    showOrderConfirmedToast(order.id, order.total);
    router.push(`${ROUTES.pedidoConfirmado}?orderId=${order.id}`);
  }

  const handleSubmit = () => {
    if (!isShippingValid || submitting) return;
    if (catalogBlocked) {
      setSubmitError("Sin conexión con el servidor. Revisa tu conexión y reintenta.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");

    // Vía API: el backend tasa, reserva stock, valida el cupón y audita en
    // una transacción. Nada de stores locales en esta vía (sus ids no existen
    // en la DB y rompían el pago con "Producto no encontrado").
    if (apiMode) {
      void submitApiOrder();
      return;
    }

    let shippingAddressId: string | undefined;

    if (state.user && addressMode === "saved" && selectedSavedAddress) {
      shippingAddressId = selectedSavedAddress.id;
    }

    if (state.user && addressMode === "new" && saveAddress) {
      const createdAddress = addressesStore.create({
        userId: state.user.id,
        label: addressLabel.trim() || "Casa",
        fullName: state.user.name,
        street: address,
        district: selectedDistrict,
        city: selectedProvince,
        state: department,
        zip: "",
        country: "Perú",
        phone,
        isDefault: false,
      });
      shippingAddressId = createdAddress.id;
    }

    const orderItems = cartItems.map((item) => {
      const priceData = getDisplayPrice(item.product);
      const variant = item.product.variants?.find((v) => v.size === item.size && v.color === item.color);
      return {
        productId: item.product.id,
        variantId: variant?.id ?? `${item.product.id}-${item.size}-${item.color}`,
        name: item.product.name,
        quantity: item.quantity,
        price: priceData.final,
        unitCost: item.product.costPrice,
        size: item.size,
        color: item.color,
      };
    });
    const stockValidation = productsStore.validateStockChange([], orderItems);
    if (!stockValidation.success) {
      setSubmitting(false);
      window.alert(stockValidation.error);
      return;
    }

    const stockUpdate = productsStore.applyStockChange([], orderItems);
    if (!stockUpdate.success) {
      setSubmitting(false);
      window.alert(stockUpdate.error);
      return;
    }

    let finalDiscount = 0;
    let finalCoupon: string | undefined;
    if (couponCode && state.user) {
      const recheck = couponsStore.validate(couponCode, {
        userId: state.user.id,
        email: state.user.email,
        subtotal,
      });
      if (!recheck.valid) {
        setSubmitting(false);
        setCouponError(recheck.error);
        setCouponCode(null);
        setCouponDiscount(0);
        window.alert(recheck.error);
        return;
      }
      finalDiscount = recheck.discount;
      finalCoupon = recheck.coupon.code;
    }

    const snapshot: Address = {
      id: shippingAddressId ?? "",
      userId: state.user?.id ?? "guest",
      label: addressLabel.trim() || "Envío",
      fullName: state.user?.name ?? "Cliente",
      street: selectedSavedAddress?.street ?? address,
      district: selectedSavedAddress?.district ?? selectedDistrict,
      city: selectedSavedAddress?.city ?? selectedProvince,
      state: selectedSavedAddress?.state ?? department,
      zip: selectedSavedAddress?.zip ?? "",
      country: "Perú",
      phone,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const order = ordersStore.create({
      userId: state.user?.id ?? "guest",
      shippingAddressId,
      source: "checkout",
      origin: "mp_online",
      createdBy: state.user?.id ?? "guest",
      stockReserved: true,
      items: orderItems,
      subtotal,
      shipping: shippingCost,
      discount: finalDiscount,
      couponCode: finalCoupon,
      total: subtotal + shippingCost - finalDiscount,
      paymentMethod: "Tarjeta MP",
      paymentStatus: "pendiente",
      fulfillmentType,
      shipmentStatus: "pendiente",
      shippingAddressSnapshot: snapshot,
    });

    stockMovementsStore.createFromOrderDiff({
      previousItems: [],
      nextItems: orderItems,
      type: "reservation",
      orderId: order.id,
      actor: {
        id: state.user!.id,
        name: state.user!.name,
      },
      reason: "Reserva temporal checkout (expira en 24h sin pago)",
    });

    clearCart();

    if (finalCoupon && state.user) {
      const used = couponsStore.getByCode(finalCoupon);
      if (used) {
        couponsStore.registerUse(used.id, {
          userId: state.user.id,
          email: state.user.email,
          orderId: order.id,
        });
      }
    }

    showOrderConfirmedToast(order.id, order.total);
    router.push(`${ROUTES.pedidoConfirmado}?orderId=${order.id}`);
  };

  if (cartItems.length === 0 && step === 1) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShoppingCart className="mb-6 size-16 text-muted-foreground" strokeWidth={1} />
        <h2 className="text-2xl font-bold uppercase tracking-tight">
          Tu carrito está vacío
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Agrega productos para empezar tu selección.
        </p>
        <Button asChild variant="hero" size="hero" className="mt-8">
          <Link href={ROUTES.catalogo}>
            Ver Catálogo <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <ProgressSteps current={step} />

      {step === 1 && (
        <div>
          {catalogBlocked && (
            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-snug">
                <span className="font-bold">Sin conexión con el servidor.</span>{" "}
                Tus productos se guardan igual, pero no podemos cobrar hasta reconectar.
              </p>
              <Button variant="outline" size="sm" className="shrink-0" onClick={retryCatalog}>
                Reintentar conexión
              </Button>
            </div>
          )}
          <ul className="divide-y divide-border border-y border-border">
            {cartItems.map((item) => {
              const product = item.product;
              const quantity = item.quantity;
              const maxStock = getVariantStock(product, item.size, item.color);
              const priceData = getDisplayPrice(product);
              return (
                <li key={item.key} className="flex gap-3 py-5 sm:gap-4 sm:py-6">
                  <Link
                    href={ROUTES.producto(product.slug)}
                    className="relative block size-20 shrink-0 overflow-hidden rounded-lg border border-border sm:size-24"
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={192}
                      height={192}
                      sizes="96px"
                      className="size-full object-cover"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <h3 className="break-words text-sm font-bold uppercase">{product.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.color} / {item.size}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center border border-border">
                          <button
                            type="button"
                            disabled={quantity <= 1}
                            onClick={() => updateQuantity(product.id, -1, item)}
                            aria-label={`Quitar una unidad de ${product.name}`}
                            className="flex size-10 items-center justify-center text-sm transition-colors hover:bg-accent/10 disabled:opacity-30"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold tabular-nums">{quantity}</span>
                          <button
                            type="button"
                            disabled={quantity >= maxStock}
                            onClick={() => updateQuantity(product.id, 1, item)}
                            aria-label={`Añadir una unidad de ${product.name}`}
                            className="flex size-10 items-center justify-center text-sm transition-colors hover:bg-accent/10 disabled:opacity-30"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item)}
                          aria-label={`Eliminar ${product.name} del carrito`}
                          className="flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 sm:justify-end">
                        <span className="text-sm font-bold">
                          {formatPrice(priceData.final * quantity)}
                        </span>
                        {priceData.hasDiscount && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(priceData.original * quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex items-center justify-between rounded-lg bg-muted/30 px-5 py-4">
            <span className="text-sm text-muted-foreground">Subtotal ({cartCount} productos)</span>
            <span className="text-lg font-bold">{formatPrice(subtotal)}</span>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              variant="hero"
              size="hero"
              className="w-full sm:w-auto"
              disabled={!canGoToStep2}
              onClick={() => setStep(2)}
            >
              Continuar <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mx-auto max-w-lg">
          <div className="space-y-5">
            {savedAddresses.length > 0 && (
              <div className="p-4 rounded-xl border border-border bg-card/50">
                <RadioGroup
                  value={addressMode}
                  onValueChange={(v) => setAddressMode(v as "saved" | "new")}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="saved" id="saved" />
                    <Label htmlFor="saved" className="cursor-pointer text-sm font-medium leading-snug">
                      Usar dirección guardada
                    </Label>
                  </div>
                  {addressMode === "saved" && (
                    <div className="sm:pl-7">
                      <Select
                        value={selectedAddressId}
                        onValueChange={(v) => {
                          setSelectedAddressId(v);
                          const addr = savedAddresses.find((a) => a.id === v);
                          if (addr) fillFromAddress(addr);
                        }}
                      >
                        <SelectTrigger className="h-10 w-full text-sm sm:h-9 sm:text-xs">
                          <SelectValue placeholder="Seleccionar dirección..." />
                        </SelectTrigger>
                        <SelectContent>
                          {savedAddresses.map((addr) => (
                            <SelectItem key={addr.id} value={addr.id}>
                              {addr.label} — {addr.street}, {addr.district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="new" id="new" />
                    <Label htmlFor="new" className="cursor-pointer text-sm font-medium leading-snug">
                      Ingresar nueva dirección
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {addressMode === "new" && (
            <>
            <div>
              <Label className={checkoutLabelClass}>Departamento</Label>
              <Select value={department} onValueChange={(v) => { setDepartment(v); setSelectedProvince(""); setSelectedDistrict(""); }}>
                <SelectTrigger className="mt-1.5 h-10 w-full sm:h-9">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={checkoutLabelClass}>Provincia</Label>
              <Select value={selectedProvince} onValueChange={(v) => { setSelectedProvince(v); setSelectedDistrict(""); }} disabled={!department}>
                <SelectTrigger className="mt-1.5 h-10 w-full sm:h-9">
                  <SelectValue placeholder={department ? "Seleccionar..." : "Elige departamento"} />
                </SelectTrigger>
                <SelectContent>
                  {checkoutProvinces.map((p) => (
                    <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={checkoutLabelClass}>Distrito</Label>
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={!selectedProvince}>
                <SelectTrigger className="mt-1.5 h-10 w-full sm:h-9">
                  <SelectValue placeholder={selectedProvince ? "Seleccionar..." : "Elige provincia"} />
                </SelectTrigger>
                <SelectContent>
                  {checkoutDistricts.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="label" className={checkoutLabelClass}>Etiqueta</Label>
              <Input id="label" value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)} placeholder="Casa, Trabajo..." className="mt-1.5 h-10 sm:h-9" />
            </div>

            <div>
              <Label htmlFor="address" className={checkoutLabelClass}>Dirección</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. / Jr. / Calle" className="mt-1.5 h-10 sm:h-9" />
            </div>

            <div>
              <Label htmlFor="reference" className={checkoutLabelClass}>Referencia (opcional)</Label>
              <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Cerca a..." className="mt-1.5 h-10 sm:h-9" />
            </div>

            <div>
              <Label htmlFor="phone" className={checkoutLabelClass}>Teléfono</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="999 999 999" inputMode="tel" className="mt-1.5 h-10 sm:h-9" />
            </div>

            {!isShippingValid && (
              <p className="text-xs text-muted-foreground">
                * {shippingValidationError}
              </p>
            )}

            {state.user && (
              <div className="flex items-start gap-2 pt-1">
                <Checkbox
                  id="saveAddress"
                  checked={saveAddress}
                  onCheckedChange={(c) => setSaveAddress(Boolean(c))}
                  className="mt-0.5"
                />
                <Label htmlFor="saveAddress" className="cursor-pointer text-sm leading-snug text-muted-foreground">
                  Guardar esta dirección para futuros pedidos
                </Label>
              </div>
            )}
            </>
          )}

            <div className="p-4 rounded-xl border border-border bg-card/50">
              <p className="text-sm font-medium leading-snug">Método de entrega</p>
              <RadioGroup
                value={fulfillmentType}
                onValueChange={(v) => setFulfillmentType(v as "LIMA_APP" | "PROVINCIA_OLVA" | "RECOJO")}
                className="mt-3 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="LIMA_APP" id="ff-app" />
                  <Label htmlFor="ff-app" className="cursor-pointer text-sm font-medium leading-snug">
                    Envío por aplicativo (Lima)
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="PROVINCIA_OLVA" id="ff-olva" />
                  <Label htmlFor="ff-olva" className="cursor-pointer text-sm font-medium leading-snug">
                    Envío Olva (provincia)
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="RECOJO" id="ff-recojo" />
                  <Label htmlFor="ff-recojo" className="cursor-pointer text-sm font-medium leading-snug">
                    Recojo en oficina (gratis)
                  </Label>
                </div>
              </RadioGroup>
              <p className="mt-3 text-xs text-muted-foreground">{fulfillmentNote}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 size-4" /> Volver
            </Button>
            <Button variant="hero" size="hero" className="w-full sm:w-auto" disabled={!canGoToStep3} onClick={() => setStep(3)}>
              Continuar <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="md:grid md:grid-cols-2 md:gap-10">
          <div>
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <h3 className="text-base font-bold uppercase tracking-tight">Método de Pago</h3>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-4 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <div
                    key={method.value}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-md border border-border px-4 py-3",
                      method.disabled && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <RadioGroupItem value={method.value} id={`payment-${method.value}`} disabled={method.disabled} />
                    <Label htmlFor={`payment-${method.value}`} className={cn("cursor-pointer text-sm leading-snug", method.disabled && "cursor-not-allowed")}>
                      {method.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="mt-3 text-xs text-muted-foreground">
                Serás redirigido a MercadoPago para pagar con tarjeta, Yape u otros medios de forma segura.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
              <h3 className="text-base font-bold uppercase tracking-tight">Dirección de Envío</h3>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{state.user?.name ?? "Cliente"}</p>
                <p>{address}</p>
                <p>{selectedDistrict}, {selectedProvince}, {department}</p>
                <p>{state.user?.phone ?? ""}</p>
                {reference && <p>Ref: {reference}</p>}
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-3 text-xs text-accent hover:underline"
              >
                Editar
              </button>
            </div>
          </div>

          <div className="mt-6 md:mt-0">
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 md:sticky md:top-24">
              <h3 className="text-lg font-bold uppercase tracking-tight">Resumen</h3>

              <div className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span className="font-semibold">{shippingCost === 0 ? "GRATIS" : formatPrice(shippingCost)}</span>
                </div>
                {couponCode ? (
                  <div className="flex justify-between text-success">
                    <span>Cupón {couponCode}</span>
                    <span className="font-semibold">−{formatPrice(couponDiscount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-border pt-2 text-base">
                  <span className="font-bold">Total</span>
                  <span className="font-bold">{formatPrice(subtotal + shippingCost - couponDiscount)}</span>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-border p-3">
                {couponCode ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Cupón {couponCode} aplicado</span>
                    <button type="button" onClick={removeCoupon} className="text-xs text-accent hover:underline">
                      Quitar
                    </button>
                  </div>
                ) : (
                  <>
                    <Label htmlFor="coupon" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      ¿Tienes un cupón?
                    </Label>
                    <div className="mt-2 flex gap-2">
                      <Input
                        id="coupon"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Ej: BIENVENIDA10"
                        className="h-9"
                      />
                      <Button variant="outline" size="sm" onClick={applyCoupon}>
                        Aplicar
                      </Button>
                    </div>
                    {couponError && <p className="mt-2 text-xs text-danger">{couponError}</p>}
                  </>
                )}
              </div>

              <Button
                variant="hero"
                size="hero"
                className="mt-8 w-full"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Procesando..." : "Confirmar Pedido"}
              </Button>
              {submitError && (
                <div className="mt-3 rounded-md border border-danger/30 bg-danger/5 p-3 text-center">
                  <p className="text-xs text-danger">{submitError}</p>
                  <Link
                    href={ROUTES.pedidos}
                    className="mt-1 inline-block text-xs font-bold text-accent hover:underline"
                  >
                    Ir a Mis pedidos
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-4 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3" /> Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
