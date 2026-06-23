import { read, write, generateId, KEYS } from "./data-store.utils";
import type { BlogPost } from "./data-store.types";

function getAll(): BlogPost[] {
  return read<BlogPost[]>(KEYS.blog, []);
}

function getById(id: string): BlogPost | undefined {
  const posts = getAll();
  return posts.find((p) => p.id === id);
}

function getBySlug(slug: string): BlogPost | undefined {
  const posts = getAll();
  return posts.find((p) => p.slug === slug);
}

function create(data: Omit<BlogPost, "id" | "createdAt" | "updatedAt">): BlogPost {
  const posts = getAll();
  const now = new Date().toISOString();
  const post: BlogPost = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  write(KEYS.blog, [...posts, post]);
  return post;
}

function update(id: string, data: Partial<BlogPost>): BlogPost | undefined {
  const posts = getAll();
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) return undefined;

  const updated: BlogPost = {
    ...posts[index],
    ...data,
    id: posts[index].id,
    createdAt: posts[index].createdAt,
    updatedAt: new Date().toISOString(),
  };

  const next = [...posts];
  next[index] = updated;
  write(KEYS.blog, next);
  return updated;
}

function remove(id: string): boolean {
  const posts = getAll();
  const filtered = posts.filter((p) => p.id !== id);
  if (filtered.length === posts.length) return false;
  write(KEYS.blog, filtered);
  return true;
}

function seed(items: BlogPost[]): void {
  write(KEYS.blog, items);
}

export const blogStore = { getAll, getById, getBySlug, create, update, delete: remove, seed };
