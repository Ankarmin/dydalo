"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import { COOKIE_CONSENT_STORAGE_KEY } from "@/config/constants";

type CookiePreferences = {
  essential: boolean;
  performance: boolean;
  functional: boolean;
};

type ConsentValue = "all" | CookiePreferences | null;

function isPreferencesObject(v: unknown): v is CookiePreferences {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as CookiePreferences).essential === "boolean" &&
    typeof (v as CookiePreferences).performance === "boolean" &&
    typeof (v as CookiePreferences).functional === "boolean"
  );
}

function loadConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    if (raw === '"all"') return "all";
    const parsed = JSON.parse(raw);
    if (parsed === "all") return "all";
    if (isPreferencesObject(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveConsent(value: ConsentValue) {
  try {
    if (value === null) {
      localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
    } else {
      localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(value));
    }
  } catch {
    /* storage unavailable */
  }
}

type CookieConsentContextValue = {
  consent: ConsentValue;
  hasConsented: boolean;
  acceptAll: () => void;
  savePreferences: (prefs: CookiePreferences) => void;
  resetConsent: () => void;
};

const CookieConsentContext =
  createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<ConsentValue>(loadConsent);

  useEffect(() => {
    saveConsent(consent);
  }, [consent]);

  const acceptAll = useCallback(() => setConsentState("all"), []);

  const savePreferences = useCallback(
    (prefs: CookiePreferences) => setConsentState(prefs),
    [],
  );

  const resetConsent = useCallback(() => setConsentState(null), []);

  const hasConsented = consent !== null;

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        hasConsented,
        acceptAll,
        savePreferences,
        resetConsent,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error(
      "useCookieConsent debe usarse dentro de CookieConsentProvider",
    );
  }
  return ctx;
}

export function isCookieAllowed(
  category: "essential" | "performance" | "functional",
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return false;
    if (raw === '"all"') return true;
    const parsed = JSON.parse(raw);
    if (parsed === "all") return true;
    if (isPreferencesObject(parsed)) return parsed[category] === true;
    return false;
  } catch {
    return false;
  }
}
