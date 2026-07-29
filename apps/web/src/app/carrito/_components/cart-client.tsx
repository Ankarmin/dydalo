"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, Trash2, ArrowRight, ArrowLeft, MapPin, CreditCard, Check } from "lucide-react";
import { showOrderConfirmedToast } from "@/components/cart/order-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/utils";
import { formatPrice, getDisplayPrice } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/routes";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { productsStore } from "@/lib/stores/data-store.products";
import { SHIPPING_PROVINCIA_PRICE, SHIPPING_PROVINCIA_COURIER } from "@/config/constants";

const STEPS = [
  { num: 1, label: "Carrito", icon: ShoppingCart },
  { num: 2, label: "Envío", icon: MapPin },
  { num: 3, label: "Pago", icon: CreditCard },
] as const;

const PAYMENT_METHODS = [
  { value: "yape-plin", label: "Yape / Plin", disabled: false },
  { value: "transferencia", label: "Transferencia bancaria", disabled: false },
  { value: "tarjeta", label: "Tarjeta (próximamente)", disabled: true },
] as const;

function ProgressSteps({ current }: { current: number }) {
  return (
    <nav aria-label="Progreso del checkout" className="mb-12">
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
                    "flex size-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
                    isActive && "border-accent bg-accent text-accent-foreground",
                    isCompleted && "border-accent bg-accent text-accent-foreground",
                    !isActive && !isCompleted && "border-muted-foreground/30",
                  )}
                >
                  {isCompleted ? <Check className="size-4" /> : step.num}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "mx-2 h-0.5 w-8 sm:w-16 rounded-full transition-colors",
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
  const { state } = useAuth();
  const { cart, cartCount, subtotal, updateQuantity } = useCart();

  const [step, setStep] = useState(1);
  const [department, setDepartment] = useState("Lima");
  const [paymentMethod, setPaymentMethod] = useState("yape-plin");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const shippingCost = department === "Lima" ? 0 : SHIPPING_PROVINCIA_PRICE;
  const total = subtotal + shippingCost;

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([idStr, qty]) => {
        const productId = Number(idStr);
        const product = productsStore.getById(productId);
        return { product, quantity: qty };
      })
      .filter(
        (item): item is { product: NonNullable<ReturnType<typeof productsStore.getById>>; quantity: number } =>
          item.product != null,
      );
  }, [cart]);

  const isCartValid = cartCount > 0;
  const isShippingValid =
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    address.trim().length > 0 &&
    district.trim().length > 0;
  const canGoToStep2 = isCartValid;
  const canGoToStep3 = canGoToStep2 && isShippingValid;

  const handleRemoveItem = (productId: number) => {
    updateQuantity(productId, -(cart[productId] ?? 0));
  };

  const handleSubmit = () => {
    if (!isShippingValid || submitting) return;
    setSubmitting(true);

    const order = ordersStore.create({
      userId: state.user?.id ?? "guest",
      items: cartItems.map((item) => {
        const priceData = getDisplayPrice(item.product);
        return {
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: priceData.final,
          size: item.product.sizes[0] ?? "M",
          color: item.product.colors[0]?.name ?? "Negro",
        };
      }),
      subtotal,
      shipping: shippingCost,
      discount: 0,
      total,
      shippingAddress: {
        fullName: name,
        street: address,
        city: district,
        state: department,
        zip: "",
        country: "Perú",
        phone,
      },
    });

    for (const item of cartItems) {
      updateQuantity(item.product.id, -(cart[item.product.id] ?? 0));
    }

    showOrderConfirmedToast(order.id, total);
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
          <ul className="divide-y divide-border border-y border-border">
            {cartItems.map(({ product, quantity }) => {
              const priceData = getDisplayPrice(product);
              return (
                <li key={product.id} className="flex gap-4 py-6">
                  <Link
                    href={ROUTES.producto(product.slug)}
                    className="relative block size-24 shrink-0 overflow-hidden rounded-lg border border-border"
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
                      <h3 className="text-sm font-bold uppercase">{product.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {product.colors[0]?.name ?? ""}
                        {" / "}
                        {product.sizes[0] ?? ""}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-border">
                          <button
                            type="button"
                            disabled={quantity <= 1}
                            onClick={() => updateQuantity(product.id, -1)}
                            aria-label={`Quitar una unidad de ${product.name}`}
                            className="flex size-10 items-center justify-center text-sm transition-colors hover:bg-accent/10 disabled:opacity-30"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold tabular-nums">{quantity}</span>
                          <button
                            type="button"
                            disabled={quantity >= product.stock}
                            onClick={() => updateQuantity(product.id, 1)}
                            aria-label={`Añadir una unidad de ${product.name}`}
                            className="flex size-10 items-center justify-center text-sm transition-colors hover:bg-accent/10 disabled:opacity-30"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(product.id)}
                          aria-label={`Eliminar ${product.name} del carrito`}
                          className="flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
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
            <div>
              <Label htmlFor="department" className="text-xs uppercase tracking-wider">
                Departamento
              </Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department" className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lima">Lima (GRATIS)</SelectItem>
                  <SelectItem value="Provincia">
                    Provincia (S/ {SHIPPING_PROVINCIA_PRICE} — {SHIPPING_PROVINCIA_COURIER})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name" className="text-xs uppercase tracking-wider">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre completo" className="mt-1.5" />
            </div>

            <div>
              <Label htmlFor="phone" className="text-xs uppercase tracking-wider">Teléfono</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="999 999 999" className="mt-1.5" />
            </div>

            <div>
              <Label htmlFor="address" className="text-xs uppercase tracking-wider">Dirección</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. / Jr. / Calle" className="mt-1.5" />
            </div>

            <div>
              <Label htmlFor="district" className="text-xs uppercase tracking-wider">Distrito</Label>
              <Input id="district" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Ej. Miraflores" className="mt-1.5" />
            </div>

            <div>
              <Label htmlFor="reference" className="text-xs uppercase tracking-wider">Referencia (opcional)</Label>
              <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Cerca a..." className="mt-1.5" />
            </div>

            {!isShippingValid && (
              <p className="text-xs text-muted-foreground">
                * Completa nombre, teléfono, dirección y distrito para continuar.
              </p>
            )}
          </div>

          <div className="mt-8 flex justify-between">
            <Button variant="outline" size="lg" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 size-4" /> Volver
            </Button>
            <Button variant="hero" size="hero" disabled={!canGoToStep3} onClick={() => setStep(3)}>
              Continuar <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="md:grid md:grid-cols-2 md:gap-10">
          <div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-bold uppercase tracking-tight">Método de Pago</h3>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-4 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <div
                    key={method.value}
                    className={cn(
                      "flex items-center gap-3 rounded-md border border-border px-4 py-3",
                      method.disabled && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <RadioGroupItem value={method.value} id={`payment-${method.value}`} disabled={method.disabled} />
                    <Label htmlFor={`payment-${method.value}`} className={cn("text-sm cursor-pointer", method.disabled && "cursor-not-allowed")}>
                      {method.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-bold uppercase tracking-tight">Dirección de Envío</h3>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{name}</p>
                <p>{address}</p>
                <p>{district}, {department}</p>
                <p>{phone}</p>
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
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
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
                <div className="flex justify-between border-t border-border pt-2 text-base">
                  <span className="font-bold">Total</span>
                  <span className="font-bold">{formatPrice(total)}</span>
                </div>
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
