"use client";

import { useSyncExternalStore } from "react";
import { blogStore } from "@/lib/stores/data-store.blog";
import type { BlogPost } from "@/lib/stores/data-store.types";

const emptyPosts: BlogPost[] = [];

let cachedPosts: BlogPost[] | null = null;

function invalidateCache() {
  cachedPosts = null;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
    invalidateCache();
  };
}

function getSnapshot(): BlogPost[] {
  if (typeof window === "undefined") return emptyPosts;
  if (cachedPosts) return cachedPosts;
  cachedPosts = blogStore.getAll();
  return cachedPosts;
}

function getServerSnapshot(): BlogPost[] {
  return emptyPosts;
}

export function useBlogPosts(): BlogPost[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function usePublishedPosts(): BlogPost[] {
  const posts = useBlogPosts();
  return posts.filter((p) => p.published);
}

export function useBlogPostBySlug(slug: string): BlogPost | null {
  const posts = useBlogPosts();
  return posts.find((p) => p.slug === slug && p.published) ?? null;
}
