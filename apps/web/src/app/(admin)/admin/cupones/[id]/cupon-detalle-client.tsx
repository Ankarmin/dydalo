"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { couponsStore } from "@/lib/stores/data-store.coupons";
import { ordersStore } from "@/lib/stores/data-store.orders";
import { usersStore } from "@/lib/stores/data-store.users";
import { useAuth } from "@/contexts/auth-context";
import { describeCoupon, type CouponType } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { formatPrice } from "@/lib/utils/format";

export function CuponDetalleClient({ id }: { id: string }) {
  const { state: authState } = useAuth();
  const [coupon, setCoupon] = useState(() => couponsStore.getById(id));
  const [value, setValue] = useState("");
  const [minSubtotal, setMinSubtotal] = useState("");
  const [maxUses, setMaxUses] = useState("");

  if (!coupon) {
    return (
      <div className="space-y-4">
        <Link href={ROUTES.adminCupones} className="text-sm text-accent hover:underline">
          ← Volver a cupones
        </Link>
        <p className="text-sm text-muted-foreground">Cupón no encontrado.</p>
      </div>
    );
  }

  const orders = ordersStore.getAll().filter((o) => o.couponCode === coupon.code);
  const userMap = new Map(usersStore.getAll().map((u) => [u.id, u]));
  const totalDiscount = orders.reduce((s, o) => s + o.discount, 0);

  function actor() {
    return { actorId: authState.user?.id ?? "admin", actorName: authState.user?.name ?? "Admin" };
  }

  function handleSave() {
    const current = couponsStore.getById(id);
    if (!current) return;
    const a = actor();
    const updated = couponsStore.update(current.id, {
      ...(value.trim() ? { value: Number(value) } : {}),
      ...(minSubtotal.trim() ? { minSubtotal: Number(minSubtotal) } : {}),
      ...(maxUses.trim() ? { maxUses: Number(maxUses) } : {}),
      actorId: a.actorId,
      actorName: a.actorName,
    });
    if (!updated) {
      notifyAdmin("No se pudo guardar", "Revisa los valores.", "error");
      return;
    }
    setCoupon(updated);
    setValue("");
    setMinSubtotal("");
    setMaxUses("");
    notifyAdmin("Cupón actualizado", updated.code, "success");
  }

  function toggleActive() {
    const current = couponsStore.getById(id);
    if (!current) return;
    const a = actor();
    const updated = couponsStore.update(current.id, {
      active: !current.active,
      actorId: a.actorId,
      actorName: a.actorName,
    });
    if (updated) setCoupon(updated);
  }

  return (
    <div className="space-y-6">
      <Link href={ROUTES.adminCupones} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a cupones
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-heading">{coupon.code}</h1>
          <p className="text-sm text-muted-foreground">
            {describeCoupon(coupon as { type: CouponType; value: number })} · {coupon.usedCount} usos
            {coupon.maxUses !== undefined ? ` de ${coupon.maxUses}` : ""} · −{formatPrice(totalDiscount)} otorgados
          </p>
        </div>
        <Button variant="outline" onClick={toggleActive}>
          {coupon.active ? "Desactivar" : "Activar"}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">Editar (vacío = sin cambio)</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label>Valor ({coupon.type === "PERCENT" ? "%" : "S/"})</Label>
            <Input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} placeholder={String(coupon.value)} />
          </div>
          <div>
            <Label>Mínimo S/</Label>
            <Input type="number" min={0} value={minSubtotal} onChange={(e) => setMinSubtotal(e.target.value)} placeholder={coupon.minSubtotal !== undefined ? String(coupon.minSubtotal) : "Sin mínimo"} />
          </div>
          <div>
            <Label>Usos máximos</Label>
            <Input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder={coupon.maxUses !== undefined ? String(coupon.maxUses) : "Ilimitado"} />
          </div>
        </div>
        <Button onClick={handleSave} className="mt-4">Guardar cambios</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Pedido</th>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">Descuento</th>
              <th className="px-3 py-2 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border text-sm last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2">
                  <Link href={ROUTES.adminPedidoDetalle(o.id)} className="font-mono text-xs text-accent hover:underline">
                    #{o.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-3 py-2">{userMap.get(o.userId)?.name ?? "—"}</td>
                <td className="px-3 py-2 font-medium">−{formatPrice(o.discount)}</td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("es-PE")}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Nadie usó este cupón aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
