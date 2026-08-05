"use client";

import { Fragment, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { auditStore } from "@/lib/stores/data-store.audit";
import type { AuditAction, AuditEntityType } from "@/lib/stores/data-store.types";
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

const ENTITY_LABELS: Record<AuditEntityType, string> = {
  product: "Producto",
  product_variant: "Variante",
  order: "Pedido",
  category: "Categoría",
  user: "Cliente",
  blog: "Blog",
  discount: "Descuento",
  inventory: "Inventario",
};

const ACTION_LABELS: Record<AuditAction, string> = {
  create: "Creación",
  update: "Edición",
  delete: "Eliminación",
  status_change: "Cambio estado",
  stock_change: "Cambio stock",
  discount_change: "Cambio descuento",
  activate: "Activación",
  deactivate: "Desactivación",
  export: "Exportación",
  import: "Importación",
};

const ENTITY_TYPES: Array<AuditEntityType | "todos"> = ["todos", "product", "order", "inventory", "discount", "category", "user", "blog", "product_variant"];
const ACTION_TYPES: Array<AuditAction | "todos"> = ["todos", "create", "update", "delete", "status_change", "stock_change", "discount_change", "activate", "deactivate", "export", "import"];

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatAuditValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2) ?? String(value);
}

export function AuditoriaClient() {
  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState<AuditEntityType | "todos">("todos");
  const [action, setAction] = useState<AuditAction | "todos">("todos");
  const [responsible, setResponsible] = useState("todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const logs = auditStore.ensureInitialAuditSnapshot();

  const responsibleOptions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.createdByName))).sort(),
    [logs]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTime = to ? new Date(`${to}T23:59:59`).getTime() : null;

    return logs.filter((log) => {
      const logTime = new Date(log.createdAt).getTime();
      const matchesQuery = !normalizedQuery || [log.summary, log.entityLabel, log.createdByName, log.entityId]
        .some((value) => value.toLowerCase().includes(normalizedQuery));

      return (
        matchesQuery &&
        (entityType === "todos" || log.entityType === entityType) &&
        (action === "todos" || log.action === action) &&
        (responsible === "todos" || log.createdByName === responsible) &&
        (fromTime === null || logTime >= fromTime) &&
        (toTime === null || logTime <= toTime)
      );
    });
  }, [action, entityType, from, logs, query, responsible, to]);

  function clearFilters() {
    setQuery("");
    setEntityType("todos");
    setAction("todos");
    setResponsible("todos");
    setFrom("");
    setTo("");
    setExpandedId(null);
  }

  function handleExport() {
    downloadCsv("auditoria.csv", [
      ["Fecha", "Responsable", "Módulo", "Acción", "Entidad", "Resumen"],
      ...filtered.map((log) => [
        log.createdAt,
        log.createdByName,
        ENTITY_LABELS[log.entityType],
        ACTION_LABELS[log.action],
        log.entityLabel,
        log.summary,
      ]),
    ]);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Auditoría</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {logs.length} acciones registradas
          </p>
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="size-3.5" />
          Exportar CSV
        </Button>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Buscar</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Entidad, resumen o responsable" className="pl-9" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:flex xl:flex-wrap xl:items-end">
          <div className="xl:min-w-[190px] xl:flex-[1_1_190px]">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Módulo</Label>
            <Select value={entityType} onValueChange={(value) => setEntityType(value as AuditEntityType | "todos")}>
              <SelectTrigger className="mt-1 h-10 min-w-0 justify-start text-left">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent className="min-w-[230px]">
                {ENTITY_TYPES.map((item) => <SelectItem key={item} value={item}>{item === "todos" ? "Todos los módulos" : ENTITY_LABELS[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="xl:min-w-[210px] xl:flex-[1.1_1_210px]">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Acción</Label>
            <Select value={action} onValueChange={(value) => setAction(value as AuditAction | "todos")}>
              <SelectTrigger className="mt-1 h-10 min-w-0 justify-start text-left">
                <SelectValue placeholder="Acción" />
              </SelectTrigger>
              <SelectContent className="min-w-[250px]">
                {ACTION_TYPES.map((item) => <SelectItem key={item} value={item}>{item === "todos" ? "Todas las acciones" : ACTION_LABELS[item]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="xl:min-w-[250px] xl:flex-[1.3_1_250px]">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Responsable</Label>
            <Select value={responsible} onValueChange={setResponsible}>
              <SelectTrigger className="mt-1 h-10 min-w-0 justify-start text-left">
                <SelectValue placeholder="Responsable" />
              </SelectTrigger>
              <SelectContent className="min-w-[280px]">
                <SelectItem value="todos">Todos los responsables</SelectItem>
                {responsibleOptions.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="xl:min-w-[155px] xl:flex-[0_0_155px]">
            <Label htmlFor="audit-from" className="text-xs uppercase tracking-wider text-muted-foreground">Desde</Label>
            <Input id="audit-from" className="mt-1 h-10" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="xl:min-w-[155px] xl:flex-[0_0_155px]">
            <Label htmlFor="audit-to" className="text-xs uppercase tracking-wider text-muted-foreground">Hasta</Label>
            <Input id="audit-to" className="mt-1 h-10" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end md:col-span-2 xl:min-w-[160px] xl:flex-[0_0_160px]">
            <Button variant="outline" className="h-10 w-full whitespace-nowrap" onClick={clearFilters}>Limpiar filtros</Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] table-fixed text-sm">
            <colgroup>
              <col className="w-[145px]" />
              <col className="w-[150px]" />
              <col className="w-[105px]" />
              <col className="w-[125px]" />
              <col className="w-[185px]" />
              <col />
              <col className="w-[90px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Responsable</th>
                <th className="px-3 py-2 font-medium">Módulo</th>
                <th className="px-3 py-2 font-medium">Acción</th>
                <th className="px-3 py-2 font-medium">Entidad</th>
                <th className="px-3 py-2 font-medium">Resumen</th>
                <th className="px-3 py-2 font-medium text-right">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <Fragment key={log.id}>
                  <tr className="border-b border-border align-top hover:bg-muted/30">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("es-PE")}</td>
                    <td className="break-words px-3 py-2 text-xs">{log.createdByName}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs">{ENTITY_LABELS[log.entityType]}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs">{ACTION_LABELS[log.action]}</td>
                    <td className="break-words px-3 py-2 font-medium">{log.entityLabel}</td>
                    <td className="break-words px-3 py-2 leading-relaxed text-muted-foreground">{log.summary}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                        {expandedId === log.id ? "Ocultar" : "Ver"}
                      </Button>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr className="border-b border-border bg-muted/20">
                      <td colSpan={7} className="px-3 py-3">
                        <div className="overflow-x-auto rounded-lg border border-border bg-background p-3 text-left text-xs text-muted-foreground shadow-sm">
                          {log.changes && log.changes.length > 0 ? (
                            <table className="w-full min-w-[700px] table-fixed text-xs">
                              <colgroup>
                                <col className="w-[160px]" />
                                <col />
                                <col />
                              </colgroup>
                              <thead>
                                <tr className="border-b border-border text-muted-foreground">
                                  <th className="py-2 pr-3 text-left font-medium">Campo</th>
                                  <th className="px-3 py-2 text-left font-medium">Antes</th>
                                  <th className="py-2 pl-3 text-left font-medium">Después</th>
                                </tr>
                              </thead>
                              <tbody>
                                {log.changes.map((change) => (
                                  <tr key={change.field} className="border-b border-border last:border-0 align-top">
                                    <td className="break-words py-2 pr-3 font-semibold text-foreground">{change.field}</td>
                                    <td className="px-3 py-2">
                                      <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">{formatAuditValue(change.before)}</pre>
                                    </td>
                                    <td className="py-2 pl-3">
                                      <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">{formatAuditValue(change.after)}</pre>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">{formatAuditValue({ before: log.before, after: log.after })}</pre>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">No hay registros con esos filtros</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
