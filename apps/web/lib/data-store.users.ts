import { read, write, generateId, KEYS } from "./data-store.utils";
import type { User } from "./data-store.types";

function getAll(): User[] {
  return read<User[]>(KEYS.users, []);
}

function getById(id: string): User | undefined {
  const users = getAll();
  return users.find((u) => u.id === id);
}

function create(data: Omit<User, "id" | "createdAt" | "updatedAt">): User {
  const users = getAll();
  const now = new Date().toISOString();
  const user: User = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  write(KEYS.users, [...users, user]);
  return user;
}

function update(id: string, data: Partial<User>): User | undefined {
  const users = getAll();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return undefined;

  const updated: User = {
    ...users[index],
    ...data,
    id: users[index].id,
    createdAt: users[index].createdAt,
    updatedAt: new Date().toISOString(),
  };

  const next = [...users];
  next[index] = updated;
  write(KEYS.users, next);
  return updated;
}

function remove(id: string): boolean {
  const users = getAll();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  write(KEYS.users, filtered);
  return true;
}

function seed(items: User[]): void {
  write(KEYS.users, items);
}

export const usersStore = { getAll, getById, create, update, delete: remove, seed };
