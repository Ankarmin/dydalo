"use client";

import { createContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { use } from "react";
import { ADMINS, ADMIN_PASSWORD, AUTH_STORAGE_KEY } from "@/config/auth-constants";

type UserRole = "admin" | "customer";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
  updatedAt: string;
};

type AuthState = {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
};

type AuthActions = {
  login: (email: string, password: string) => Promise<LoginResult>;
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
  | { success: true }
  | { success: false; error: string };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    if (typeof window === "undefined") return { user: null, status: "unauthenticated" };
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as User;
        return { user, status: "authenticated" };
      }
    } catch {

    }
    return { user: null, status: "unauthenticated" };
  });

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    await new Promise((r) => setTimeout(r, 800));

    if (email in ADMINS && password === ADMIN_PASSWORD) {
      const name = ADMINS[email];
      const user: User = {
        id: `admin-${email.split("@")[0]}`,
        name,
        email,
        role: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } catch {

      }
      setState({ user, status: "authenticated" });
      return { success: true };
    }

    return { success: false, error: "Email o contraseña incorrectos" };
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {

    }
    setState({ user: null, status: "unauthenticated" });
  }, []);

  const isAdmin = state.user?.role === "admin";
  const value: AuthContextValue = { state, actions: { login, logout }, meta: { isAdmin } };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

export type { User, UserRole, AuthState, AuthActions, AuthMeta, AuthContextValue, LoginResult };
