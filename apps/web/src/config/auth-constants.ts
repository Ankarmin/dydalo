export const ADMINS: Record<string, string> = {
  "diego@dydalo.com": "Diego Alessandro Quiroz Fernandez",
  "david@dydalo.com": "David Sebastian Piñarreta Rojas",
};

export const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin";

export const AUTH_STORAGE_KEY = "dydalo_auth" as const;
