import type { Locale } from "./locales";
import { he } from "./dictionaries/he";
import { ru } from "./dictionaries/ru";
import { en } from "./dictionaries/en";

/**
 * Hebrew is the source of truth: `ru` and `en` are declared `: Dictionary`, so a
 * key added here without a translation fails the type check rather than falling
 * back at runtime.
 *
 * `Record<keyof typeof he, string>` rather than `typeof he` — `he` is `as const`,
 * so `typeof he` would pin every value to its exact Hebrew literal and no
 * translation would be assignable.
 */
export type Dictionary = Record<keyof typeof he, string>;
export type MessageKey = keyof Dictionary;

const DICTIONARIES: Record<Locale, Dictionary> = { he, ru, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** Replaces every `{name}` with `params.name`. Unknown placeholders stay put. */
export function format(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in params ? String(params[key]) : whole
  );
}

export function t(
  dict: Dictionary,
  key: MessageKey,
  params?: Record<string, string | number>
): string {
  return format(dict[key], params);
}
