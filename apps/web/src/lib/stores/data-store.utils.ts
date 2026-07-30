export const KEYS = {
  products: "dydalo_products",
  orders: "dydalo_orders",
  users: "dydalo_users",
  blog: "dydalo_blog",
  config: "dydalo_config",
  categories: "dydalo_categories",
  images: "dydalo_images",
  stockMovements: "dydalo_stock_movements",
  auditLogs: "dydalo_audit_logs",
} as const;

function hashKey(key: string): string {
  return `${key}_hash`;
}

export function getSeedHash(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(hashKey(key));
}

export function setSeedHash(key: string, hash: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(hashKey(key), hash);
}

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
