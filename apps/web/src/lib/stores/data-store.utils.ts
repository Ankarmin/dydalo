const SCHEMA_VERSION = "v2";

export const KEYS = {
  products: `dydalo_products:${SCHEMA_VERSION}`,
  orders: `dydalo_orders:${SCHEMA_VERSION}`,
  users: `dydalo_users:${SCHEMA_VERSION}`,
  blog: `dydalo_blog:${SCHEMA_VERSION}`,
  config: `dydalo_config:${SCHEMA_VERSION}`,
  categories: `dydalo_categories:${SCHEMA_VERSION}`,
  images: `dydalo_images:${SCHEMA_VERSION}`,
} as const;

export function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, data: T): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
