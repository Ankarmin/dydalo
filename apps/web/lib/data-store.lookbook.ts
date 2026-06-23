import { read, write, generateId, KEYS } from "./data-store.utils";
import type { LookbookEntry } from "./data-store.types";

function getAll(): LookbookEntry[] {
  return read<LookbookEntry[]>(KEYS.lookbook, []);
}

function getById(id: string): LookbookEntry | undefined {
  const entries = getAll();
  return entries.find((e) => e.id === id);
}

function create(data: Omit<LookbookEntry, "id" | "createdAt">): LookbookEntry {
  const entries = getAll();
  const now = new Date().toISOString();
  const entry: LookbookEntry = {
    ...data,
    id: generateId(),
    createdAt: now,
  };
  write(KEYS.lookbook, [...entries, entry]);
  return entry;
}

function update(id: string, data: Partial<LookbookEntry>): LookbookEntry | undefined {
  const entries = getAll();
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) return undefined;

  const updated: LookbookEntry = {
    ...entries[index],
    ...data,
    id: entries[index].id,
    createdAt: entries[index].createdAt,
  };

  const next = [...entries];
  next[index] = updated;
  write(KEYS.lookbook, next);
  return updated;
}

function remove(id: string): boolean {
  const entries = getAll();
  const filtered = entries.filter((e) => e.id !== id);
  if (filtered.length === entries.length) return false;
  write(KEYS.lookbook, filtered);
  return true;
}

function seed(items: LookbookEntry[]): void {
  write(KEYS.lookbook, items);
}

export const lookbookStore = { getAll, getById, create, update, delete: remove, seed };
