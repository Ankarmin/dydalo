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

const AuthContext = createContext<AuthContextValue | null>(null);

function persistSession(user: User): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, status: "loading" });

  useEffect(() => {
    let nextState: AuthState = { user: null, status: "unauthenticated" };

    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as User;
        nextState = { user, status: "authenticated" };
      }
    } catch {

    }

    queueMicrotask(() => setState(nextState));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
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
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {

    }
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
