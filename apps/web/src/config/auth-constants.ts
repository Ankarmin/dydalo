export const ADMIN_CREDENTIALS = {
  email: process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "admin@dydalo.com",
  password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin",
} as const;

export const AUTH_STORAGE_KEY = "dydalo_auth:v1" as const;
