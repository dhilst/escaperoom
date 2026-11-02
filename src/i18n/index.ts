import type { Language } from "./language";
import { enUS } from "./locales/en-US";
import { es } from "./locales/es";
import { ptBR } from "./locales/pt-BR";

export type { Language, UiStrings } from "./language";

export const LANGUAGES = { "en-US": enUS, "pt-BR": ptBR, es } satisfies Record<string, Language>;
export type Locale = keyof typeof LANGUAGES;
export const LOCALES = Object.keys(LANGUAGES) as Locale[];
export const DEFAULT_LOCALE: Locale = "en-US";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && value in LANGUAGES;
}

/**
 * Resolve the ?lang= query parameter. Case, "-" vs "_" and region are forgiven
 * ("pt_BR", "pt-br", "pt" -> "pt-BR"; "es-MX" -> "es"). Anything else, or no
 * parameter at all, gives the default.
 */
export function localeFromParam(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  const wanted = value.trim().replace(/_/g, "-").toLowerCase();
  const exact = LOCALES.find((l) => l.toLowerCase() === wanted);
  if (exact) return exact;
  const base = wanted.split("-")[0];
  return LOCALES.find((l) => l.split("-")[0].toLowerCase() === base) ?? DEFAULT_LOCALE;
}

/*
 * Room data marks translatable text with an object keyed by locale:
 *   "text": { "en-US": "The door is locked.", "pt-BR": "A porta está trancada.", "es": "..." }
 * Aliases work the same way with arrays as values. A plain string means the
 * text is the same in every language.
 */

type Json = unknown;

function isPlainObject(v: Json): v is Record<string, Json> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isLocalized(v: Json): v is Record<string, Json> {
  return isPlainObject(v) && Object.keys(v).length > 0 && Object.keys(v).every(isLocale);
}

/** Replace every localized value in `data` by its `locale` translation (falling back to the default). */
export function localize<T>(data: T, locale: Locale): T {
  const walk = (v: Json): Json => {
    if (isLocalized(v)) return v[locale] ?? v[DEFAULT_LOCALE];
    if (Array.isArray(v)) return v.map(walk);
    if (isPlainObject(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(data) as T;
}

/** List localized values that lack a translation, as readable paths. */
export function missingTranslations(data: Json, path = ""): string[] {
  if (isLocalized(data)) {
    const missing = LOCALES.filter((l) => !(l in data));
    return missing.length > 0 ? [`${path || "(root)"} is missing ${missing.join(", ")}`] : [];
  }
  if (Array.isArray(data)) return data.flatMap((x, i) => missingTranslations(x, `${path}[${i}]`));
  if (isPlainObject(data)) {
    return Object.entries(data).flatMap(([k, x]) => missingTranslations(x, path ? `${path}.${k}` : k));
  }
  return [];
}
