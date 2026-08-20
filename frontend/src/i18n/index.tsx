/**
 * Lightweight i18n. No heavy dependency (keeps bundle small for low bandwidth).
 * Primary language: Haitian Creole. French/English merge on top of `ht`, so any
 * missing key gracefully falls back to Creole.
 *
 * Usage:
 *   const { t, language, setLanguage } = useI18n();
 *   t("home.cta")            // -> "Fè yon Demand"
 *   t("home.greeting", { name: "Jean" })  // simple {name} interpolation
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { storage } from "@/src/utils/storage";
import type { Language } from "@/src/types";
import ht from "./locales/ht";
import en from "./locales/en";
import fr from "./locales/fr";

const LANGUAGE_KEY = "dla.language";

const DICTIONARIES: Record<Language, Record<string, any>> = {
  ht,
  en: en as Record<string, any>,
  fr: fr as Record<string, any>,
};

export const LANGUAGE_OPTIONS: { code: Language; label: string; native: string }[] = [
  { code: "ht", label: "Haitian Creole", native: "Kreyòl Ayisyen" },
  { code: "fr", label: "French", native: "Français" },
  { code: "en", label: "English", native: "English" },
];

function resolve(dict: Record<string, any>, path: string): string | undefined {
  return path.split(".").reduce<any>((acc, key) => {
    if (acc && typeof acc === "object") return acc[key];
    return undefined;
  }, dict);
}

function interpolate(value: string, params?: Record<string, string | number>): string {
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] != null ? String(params[k]) : `{${k}}`,
  );
}

type TFunction = (key: string, params?: Record<string, string | number>) => string;

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TFunction;
  ready: boolean;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ht");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = (await storage.getItem<string>(LANGUAGE_KEY, "ht")) as Language;
      if (saved && DICTIONARIES[saved]) setLanguageState(saved);
      setReady(true);
    })();
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    void storage.setItem(LANGUAGE_KEY, lang);
  }, []);

  const t = useCallback<TFunction>(
    (key, params) => {
      const active = DICTIONARIES[language] ?? ht;
      const value = resolve(active, key) ?? resolve(ht, key) ?? key;
      return typeof value === "string" ? interpolate(value, params) : key;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, ready }),
    [language, setLanguage, t, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
