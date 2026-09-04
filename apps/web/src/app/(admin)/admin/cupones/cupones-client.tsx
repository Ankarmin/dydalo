"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { couponsStore } from "@/lib/stores/data-store.coupons";
import { useAuth } from "@/contexts/auth-context";
import { describeCoupon, type CouponType } from "@/lib/stores";
import { ROUTES } from "@/lib/utils/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notifyAdmin } from "@/components/admin/admin-toast";
import { cn } from "@/lib/utils/utils";

export function CuponesClient() {
  const { state: authState } = useAuth();
  const [, setTick] = useState(0);
  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponType>("PERCENT");
  const [value, setValue] = useState("");
  const [minSubtotal, setMinSubtotal] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [query, setQuery] = useState("");

  const coupons = couponsStore.getAll();
  const filtered = useMemo(() => {
    if (!query) return coupons;
    const q = query.toLowerCase();
    return coupons.filter((c) => c.code.toLowerCase().includes(q));
  }, [coupons, query]);

  function reload() {
    setTick((n) => n + 1);
  }

  function actor() {
    return { actorId: authState.user?.id ?? "admin", actorName: authState.user?.name ?? "Admin" };
  }

  function handleCreate() {
    const numValue = Number(value);
    if (!code.trim() || !(numValue > 0)) {
      notifyAdmin("Datos incompletos", "Código y valor positivo son obligatorios.", "error");
      return;
    }
    const a = actor();
    const created = couponsStore.create({
      code,
      type,
      value: numValue,
      minSubtotal: minSubtotal.trim() ? Number(minSubtotal) : undefined,
      maxUses: maxUses.trim() ? Number(maxUses) : undefined,
      expiresAt: expiresAt.trim() ? new Date(`${expiresAt}T23:59:59`).toISOString() : undefined,
      actorId: a.actorId,
      actorName: a.actorName,
    });
    if (!created) {
      notifyAdmin("No se pudo crear", "Código duplicado o valor inválido (máx 100% en porcentaje).", "error");
      return;
    }
    setCode("");
    setValue("");
    setMinSubtotal("");
    setMaxUses("");
    setExpiresAt("");
    reload();
    notifyAdmin("Cupón creado", created.code, "success");
  }

  function toggleActive(id: string, active: boolean) {
    const a = actor();
    couponsStore.update(id, { active: !active, actorId: a.actorId, actorName: a.actorName });
    reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-heading">Cupones</h1>
        <p className="text-sm text-muted-foreground">
          {coupons.filter((c) => c.active).length} activos · {coupons.reduce((s, c) => s + c.usedCount, 0)} usos totales
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">Nuevo cupón</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label>Código *</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BIENVENIDA10" />
          </div>
          <div>
            <Label>Tipo *</Label>
            <Select value={type} onValueChange={(v) => setType(v as CouponType)}>
              <SelectTrigger className="mt-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENT">Porcentaje %</SelectItem>
                <SelectItem value="AMOUNT">Monto S/</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor * {type === "PERCENT" ? "(1-100)" : "(S/)"}</Label>
            <Input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "PERCENT" ? "10" : "20"} />
          </div>
          <div>
            <Label>Mínimo subtotal S/ (opcional)</Label>
            <Input type="number" min={0} value={minSubtotal} onChange={(e) => setMinSubtotal(e.target.value)} placeholder="Ej: 100" />
          </div>
          <div>
            <Label>Usos máximos (opcional)</Label>
            <Input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Ej: 50" />
          </div>
          <div>
            <Label>Vence el (opcional)</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleCreate} className="mt-4">
          <Plus className="size-4" /> Crear cupón
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por código..." className="pl-9" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[680px]">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Código</th>
              <th className="px-3 py-2 font-medium">Beneficio</th>
              <th className="px-3 py-2 font-medium">Usos</th>
              <th className="px-3 py-2 font-medium">Vence</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-border text-sm last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2">
                  <Link href={ROUTES.adminCuponDetalle(c.id)} className="font-mono font-bold text-accent hover:underline">
                    {c.code}
                  </Link>
                  {c.minSubtotal !== undefined && <p className="text-xs text-muted-foreground">mín S/{c.minSubtotal}</p>}
                </td>
                <td className="px-3 py-2">{describeCoupon(c)}</td>
                <td className="px-3 py-2 text-xs">
                  {c.usedCount}{c.maxUses !== undefined ? `/${c.maxUses}` : ""} usos
                </td>
                <td className="px-3 py-2 text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("es-PE") : "—"}</td>
                <td className="px-3 py-2">
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs", c.active ? "border bg-success/10 text-success border-success/30" : "border bg-muted/10 text-muted-foreground border-border")}>
                    {c.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <Button variant="outline" size="sm" onClick={() => toggleActive(c.id, c.active)}>
                    {c.active ? "Desactivar" : "Activar"}
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Sin cupones. Crea el primero arriba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
