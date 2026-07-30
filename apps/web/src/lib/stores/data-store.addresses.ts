import { read, write, generateId } from "./data-store.utils";
import type { Address } from "./data-store.types";

const STORAGE_KEY = "dydalo_addresses";

function getAll(): Address[] {
  return read<Address[]>(STORAGE_KEY, []);
}

function getByUserId(userId: string): Address[] {
  return getAll()
    .filter((a) => a.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function getById(id: string): Address | undefined {
  return getAll().find((a) => a.id === id);
}

function create(data: Omit<Address, "id" | "createdAt" | "updatedAt">): Address {
  const all = getAll();
  const now = new Date().toISOString();

  const address: Address = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  write(STORAGE_KEY, [...all, address]);
  return address;
}

function update(id: string, data: Partial<Address>): Address | undefined {
  const all = getAll();
  const index = all.findIndex((a) => a.id === id);
  if (index === -1) return undefined;

  const updated: Address = {
    ...all[index],
    ...data,
    id: all[index].id,
    createdAt: all[index].createdAt,
    updatedAt: new Date().toISOString(),
  };

  const next = [...all];
  next[index] = updated;
  write(STORAGE_KEY, next);
  return updated;
}

function remove(id: string): boolean {
  const all = getAll();
  const filtered = all.filter((a) => a.id !== id);
  if (filtered.length === all.length) return false;
  write(STORAGE_KEY, filtered);
  return true;
}

function setDefault(userId: string, addressId: string): void {
  const all = getAll();
  const updated = all.map((a) => ({
    ...a,
    isDefault: a.userId === userId ? a.id === addressId : a.isDefault,
  }));
  write(STORAGE_KEY, updated);
}

export const addressesStore = { getAll, getByUserId, getById, create, update, delete: remove, setDefault };
