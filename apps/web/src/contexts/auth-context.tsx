"use client";

import { createContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { use } from "react";
import { ADMINS, ADMIN_PASSWORD_HASH, AUTH_STORAGE_KEY } from "@/config/auth-constants";
import { usersStore } from "@/lib/stores/data-store.users";
import type { User } from "@/lib/stores";
import { seedIfEmpty } from "@/config/seed-data";
import { composeFullName, getUserFirstName, getUserLastName } from "@/lib/utils/user-name";
import { normalizePhone, normalizeText } from "@/lib/validations/forms";
import { apiFetch, isApiEnabled, ApiError } from "@/lib/api/client";

type AuthState = {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
};

type AuthActions = {
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<LoginResult>;
  updateProfile: (data: UpdateProfileInput) => Promise<AuthActionResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthActionResult>;
  refreshUser: () => void;
  logout: () => void;
};

type AuthMeta = {
  isAdmin: boolean;
};

type AuthContextValue = {
  state: AuthState;
  actions: AuthActions;
  meta: AuthMeta;
};

type LoginResult =
  | { success: true; user: User }
  | { success: false; error: string };

type AuthActionResult =
  | { success: true }
  | { success: false; error: string };

type UpdateProfileInput = {
  firstName: string;
  lastName: string;
  phone: string;
};

type ApiUser = {
  id: string;
  email: string;
  role: "admin" | "customer";
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapApiUser(apiUser: ApiUser): User {
  const firstName = apiUser.firstName ?? "";
  const lastName = apiUser.lastName ?? "";
  return {
    id: apiUser.id,
    name: composeFullName(firstName, lastName) || apiUser.email,
    firstName,
    lastName,
    email: apiUser.email,
    role: apiUser.role,
    phone: apiUser.phone ?? undefined,
    createdAt: apiUser.createdAt,
    updatedAt: apiUser.updatedAt,
  };
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return "Este email ya está registrado";
    if (error.status === 401) return "Email o contraseña incorrectos";
    return error.message;
  }
  return fallback;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function persistSession(user: User): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function clearSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {

  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      // Vía API: la cookie httpOnly es la fuente de verdad.
      if (isApiEnabled()) {
        try {
          const apiUser = await apiFetch<ApiUser>("/auth/me");
          if (!cancelled) {
            const user = mapApiUser(apiUser);
            persistSession(user);
            setState({ user, status: "authenticated" });
          }
        } catch {
          if (!cancelled) {
            clearSession();
            setState({ user: null, status: "unauthenticated" });
          }
        }
        return;
      }

      let nextState: AuthState = { user: null, status: "unauthenticated" };
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const user = JSON.parse(stored) as User;
          nextState = { user, status: "authenticated" };
        }
      } catch {

      }
      if (!cancelled) setState(nextState);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    if (isApiEnabled()) {
      try {
        const apiUser = await apiFetch<ApiUser>("/auth/login", {
          method: "POST",
          body: { email, password },
        });
        const user = mapApiUser(apiUser);
        persistSession(user);
        setState({ user, status: "authenticated" });
        return { success: true, user };
      } catch (error) {
        return { success: false, error: apiErrorMessage(error, "No se pudo iniciar sesión") };
      }
    }

    await new Promise((r) => setTimeout(r, 800));
    seedIfEmpty();

    if (email in ADMINS && "hashed_" + password === ADMIN_PASSWORD_HASH) {
      const name = ADMINS[email];
      const user: User = {
        id: `admin-${email.split("@")[0]}`,
        name,
        firstName: name,
        lastName: "",
        email,
        role: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persistSession(user);
      setState({ user, status: "authenticated" });
      return { success: true, user };
    }

    const customer = usersStore.getAll().find((u) => u.email === email && u.role === "customer");
    const expectedHash = customer?.passwordHash ?? ADMIN_PASSWORD_HASH;
    if (customer && "hashed_" + password === expectedHash) {
      const user: User = {
        id: customer.id,
        name: customer.name,
        firstName: getUserFirstName(customer),
        lastName: getUserLastName(customer),
        email: customer.email,
        role: "customer",
        phone: customer.phone,
        passwordHash: customer.passwordHash,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      };
      persistSession(user);
      setState({ user, status: "authenticated" });
      return { success: true, user };
    }

    return { success: false, error: "Email o contraseña incorrectos" };
  }, []);

  const register = useCallback(async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phone?: string,
  ): Promise<LoginResult> => {
    if (isApiEnabled()) {
      try {
        const apiUser = await apiFetch<ApiUser>("/auth/register", {
          method: "POST",
          body: { firstName, lastName, email, password, phone },
        });
        const user = mapApiUser(apiUser);
        persistSession(user);
        setState({ user, status: "authenticated" });
        return { success: true, user };
      } catch (error) {
        return { success: false, error: apiErrorMessage(error, "No se pudo crear la cuenta") };
      }
    }

    await new Promise((r) => setTimeout(r, 800));
    seedIfEmpty();

    const existing = usersStore.getAll().find((u) => u.email === email);
    if (existing || email in ADMINS) {
      return { success: false, error: "Este email ya está registrado" };
    }

    const normalizedFirstName = normalizeText(firstName);
    const normalizedLastName = normalizeText(lastName);
    const normalizedPhone = phone ? normalizePhone(phone) : undefined;
    const fullName = composeFullName(normalizedFirstName, normalizedLastName);

    const created = usersStore.create({
      name: fullName,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      email,
      role: "customer",
      phone: normalizedPhone || undefined,
      passwordHash: "hashed_" + password,
    });

    const user: User = {
      id: created.id,
      name: created.name,
      firstName: created.firstName,
      lastName: created.lastName,
      email: created.email,
      role: "customer",
      phone: created.phone,
      passwordHash: created.passwordHash,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
    persistSession(user);
    setState({ user, status: "authenticated" });

    return { success: true, user };
  }, []);

  const refreshUser = useCallback(() => {
    if (isApiEnabled()) {
      void apiFetch<ApiUser>("/auth/me")
        .then((apiUser) => {
          const user = mapApiUser(apiUser);
          persistSession(user);
          setState({ user, status: "authenticated" });
        })
        .catch(() => {
          clearSession();
          setState({ user: null, status: "unauthenticated" });
        });
      return;
    }

    setState((current) => {
      if (!current.user || current.user.role !== "customer") return current;
      const storedUser = usersStore.getById(current.user.id);
      if (!storedUser) return { user: null, status: "unauthenticated" };

      const refreshedUser: User = {
        ...storedUser,
        firstName: getUserFirstName(storedUser),
        lastName: getUserLastName(storedUser),
      };
      persistSession(refreshedUser);
      return { user: refreshedUser, status: "authenticated" };
    });
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileInput): Promise<AuthActionResult> => {
    if (isApiEnabled()) {
      try {
        const apiUser = await apiFetch<ApiUser>("/users/me", {
          method: "PATCH",
          body: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
          },
        });
        const user = mapApiUser(apiUser);
        persistSession(user);
        setState({ user, status: "authenticated" });
        return { success: true };
      } catch (error) {
        return { success: false, error: apiErrorMessage(error, "No se pudo actualizar el perfil") };
      }
    }

    await new Promise((r) => setTimeout(r, 500));

    if (!state.user || state.user.role !== "customer") {
      return { success: false, error: "Sesión no válida" };
    }

    const firstName = normalizeText(data.firstName);
    const lastName = normalizeText(data.lastName);
    const phone = normalizePhone(data.phone);
    const updated = usersStore.update(state.user.id, {
      firstName,
      lastName,
      name: composeFullName(firstName, lastName),
      phone,
    });

    if (!updated) return { success: false, error: "No se pudo actualizar el perfil" };

    const nextUser: User = {
      ...state.user,
      ...updated,
      firstName: getUserFirstName(updated),
      lastName: getUserLastName(updated),
    };
    persistSession(nextUser);
    setState({ user: nextUser, status: "authenticated" });
    return { success: true };
  }, [state.user]);

  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string
  ): Promise<AuthActionResult> => {
    if (isApiEnabled()) {
      try {
        await apiFetch("/users/me/password", {
          method: "PATCH",
          body: { currentPassword, newPassword },
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: apiErrorMessage(error, "No se pudo cambiar la contraseña") };
      }
    }

    await new Promise((r) => setTimeout(r, 500));

    if (!state.user || state.user.role !== "customer") {
      return { success: false, error: "Sesión no válida" };
    }

    const storedUser = usersStore.getById(state.user.id);
    if (!storedUser) return { success: false, error: "Usuario no encontrado" };

    const expectedHash = storedUser.passwordHash ?? ADMIN_PASSWORD_HASH;
    if ("hashed_" + currentPassword !== expectedHash) {
      return { success: false, error: "La contraseña actual no es correcta" };
    }

    const updated = usersStore.update(state.user.id, { passwordHash: "hashed_" + newPassword });
    if (!updated) return { success: false, error: "No se pudo cambiar la contraseña" };

    const nextUser: User = {
      ...state.user,
      ...updated,
      firstName: getUserFirstName(updated),
      lastName: getUserLastName(updated),
    };
    persistSession(nextUser);
    setState({ user: nextUser, status: "authenticated" });
    return { success: true };
  }, [state.user]);

  const logout = useCallback(() => {
    if (isApiEnabled()) {
      void apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    }
    clearSession();
    setState({ user: null, status: "unauthenticated" });
  }, []);

  const isAdmin = state.user?.role === "admin";
  const value: AuthContextValue = {
    state,
    actions: { login, register, updateProfile, changePassword, refreshUser, logout },
    meta: { isAdmin },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

export type { AuthState, AuthActions, AuthMeta, AuthContextValue, LoginResult };
