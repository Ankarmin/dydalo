"use client";

import { useSyncExternalStore } from "react";
import { lookbookStore } from "@/lib/stores/data-store.lookbook";
import type { LookbookEntry } from "@/lib/stores/data-store.types";

const emptyEntries: LookbookEntry[] = [];

let cachedEntries: LookbookEntry[] | null = null;

function invalidateCache() {
  cachedEntries = null;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
    invalidateCache();
  };
}

function getSnapshot(): LookbookEntry[] {
  if (typeof window === "undefined") return emptyEntries;
  if (cachedEntries) return cachedEntries;
  cachedEntries = lookbookStore
    .getAll()
    .filter((e) => e.published)
    .toSorted((a, b) => a.order - b.order);
  return cachedEntries;
}

function getServerSnapshot(): LookbookEntry[] {
  return emptyEntries;
}

export function useLookbookEntries(): LookbookEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
