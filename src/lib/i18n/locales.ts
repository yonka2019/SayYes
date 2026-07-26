/**
 * Locale primitives and detection. Deliberately dependency-free — the
 * middleware, server components and client components all import this, and the
 * detection rules are unit tested without a request.
 */

export const LOCALES = ["he", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "he";

/** Set on the first negotiated response, and on every manual switch. */
export const LOCALE_COOKIE = "sayyes_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const DIR: Record<Locale, "rtl" | "ltr"> = { he: "rtl", ru: "ltr", en: "ltr" };

/** Endonyms — a language is always offered in its own script. */
export const LOCALE_NAMES: Record<Locale, string> = {
  he: "עברית",
  ru: "Русский",
  en: "English",
};

/** BCP-47 tags for Intl.DateTimeFormat. */
export const DATE_LOCALE: Record<Locale, string> = {
  he: "he-IL",
  ru: "ru-RU",
  en: "en-US",
};

/** `iw` is the deprecated ISO code for Hebrew, still sent by some browsers. */
const ALIASES: Record<string, Locale> = { iw: "he" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Split `/ru/new` into `{ locale: "ru", rest: "/new" }`. */
export function localeFromPath(pathname: string): { locale: Locale | null; rest: string } {
  const match = /^\/([^/]+)(\/.*)?$/.exec(pathname);
  if (!match || !isLocale(match[1])) return { locale: null, rest: pathname };

  const rest = match[2] && match[2] !== "/" ? match[2] : "/";
  return { locale: match[1], rest };
}

/** Same path, different locale prefix. Adds one if the path has none. */
export function swapLocale(pathname: string, next: Locale): string {
  const { rest } = localeFromPath(pathname);
  return rest === "/" ? `/${next}` : `/${next}${rest}`;
}

/**
 * Best shipped locale for an `Accept-Language` header, honouring q-weights.
 * Returns null when the visitor asked for nothing we have.
 */
export function negotiate(acceptLanguage: string | null | undefined): Locale | null {
  if (!acceptLanguage) return null;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((param) => /^\s*q=([\d.]+)\s*$/.exec(param))
        .find((found) => found !== null);
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q[1]) : 1 };
    })
    .filter((entry) => entry.tag.length > 0 && !Number.isNaN(entry.q) && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    const resolved = ALIASES[base] ?? base;
    if (isLocale(resolved)) return resolved;
  }
  return null;
}

/**
 * The one detection rule for the whole app:
 * URL prefix → cookie → Accept-Language → `he`.
 */
export function resolveLocale({
  pathname,
  cookie,
  acceptLanguage,
}: {
  pathname: string;
  cookie?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  const fromPath = localeFromPath(pathname).locale;
  if (fromPath) return fromPath;
  if (isLocale(cookie)) return cookie;
  return negotiate(acceptLanguage) ?? DEFAULT_LOCALE;
}
