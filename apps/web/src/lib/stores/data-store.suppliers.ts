import { read, write, generateId, KEYS } from "./data-store.utils";
import type { Supplier } from "./data-store.types";
import { auditStore } from "./data-store.audit";

const SUPPLIERS_KEY = (KEYS as Record<string, string>).suppliers ?? "dydalo_suppliers";

function getAll(): Supplier[] {
  return read<Supplier[]>(SUPPLIERS_KEY, []);
}

function getById(id: string): Supplier | undefined {
  return getAll().find((s) => s.id === id);
}

function create(data: {
  name: string;
  contact?: string;
  phone?: string;
  notes?: string;
  actorId: string;
  actorName: string;
}): Supplier {
  const now = new Date().toISOString();
  const supplier: Supplier = {
    id: generateId(),
    name: data.name.trim(),
    contact: data.contact?.trim() || undefined,
    phone: data.phone?.trim() || undefined,
    notes: data.notes?.trim() || undefined,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  write(SUPPLIERS_KEY, [...getAll(), supplier]);
  auditStore.create({
    actor: { id: data.actorId, name: data.actorName },
    entityType: "inventory",
    entityId: supplier.id,
    entityLabel: supplier.name,
    action: "create",
    summary: `Registró proveedor ${supplier.name}`,
    after: supplier,
  });
  return supplier;
}

function update(
  id: string,
  data: Partial<Pick<Supplier, "name" | "contact" | "phone" | "notes" | "active">> & { actorId: string; actorName: string }
): Supplier | undefined {
  const suppliers = getAll();
  const index = suppliers.findIndex((s) => s.id === id);
  if (index === -1) return undefined;
  const { actorId, actorName, ...changes } = data;
  const updated: Supplier = { ...suppliers[index], ...changes, updatedAt: new Date().toISOString() };
  const next = [...suppliers];
  next[index] = updated;
  write(SUPPLIERS_KEY, next);
  auditStore.create({
    actor: { id: actorId, name: actorName },
    entityType: "inventory",
    entityId: id,
    entityLabel: updated.name,
    action: "update",
    summary: `Editó proveedor ${updated.name}`,
    before: suppliers[index],
    after: updated,
  });
  return updated;
}

export const suppliersStore = {
  getAll,
  getById,
  create,
  update,
};
