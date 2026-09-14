// Cliente HTTP del backend (Fase 7). Se activa con NEXT_PUBLIC_API_URL;
// sin esa variable la tienda sigue 100% en localStorage (modo mock).
// La sesión viaja en cookie httpOnly: siempre `credentials: "include"`.

export function apiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}

export function isApiEnabled(): boolean {
  return apiBaseUrl().length > 0;
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
};

function apiMessage(status: number, body: unknown): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
  }
  if (status === 401) return "Sesión expirada, vuelve a ingresar";
  if (status === 403) return "Sin permiso para esta acción";
  if (status === 404) return "No encontrado";
  if (status === 409) return "Conflicto, reintenta";
  return "Error de conexión con el servidor";
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const base = apiBaseUrl();
  if (!base) throw new Error("API no configurada (NEXT_PUBLIC_API_URL)");
  const { body, headers, ...rest } = options;
  const res = await fetch(`${base}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data: unknown = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    throw new ApiError(res.status, apiMessage(res.status, data), data);
  }
  return data as T;
}
