"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_NAMES,
  swapLocale,
  type Locale,
} from "@/lib/i18n/locales";
import { t, type Dictionary } from "@/lib/i18n/t";

/**
 * One button, showing the current language in its own script. Each click
 * cycles to the next locale in `LOCALES` order (he → ru → en → he), writing
 * the cookie so the choice survives a visit to a prefix-less URL, then
 * swapping the path prefix.
 *
 * Not rendered on the invite page: the invitation's content can't follow a
 * switch, so offering one there would only produce a mixed-language card.
 */
export function LanguageSwitcher({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const next = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];

  function cycle() {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    router.replace(swapLocale(pathname, next));
  }

  return (
    <button
      type="button"
      lang={locale}
      onClick={cycle}
      title={t(dict, "switcher.label")}
      aria-label={`${t(dict, "switcher.label")}: ${LOCALE_NAMES[locale]}`}
      className="flex items-center gap-1.5 rounded-2xl bg-white/70 px-3 py-1.5 text-sm font-bold text-rose-deep transition hover:bg-white"
    >
      <span aria-hidden>🌐</span>
      {LOCALE_NAMES[locale]}
    </button>
  );
}
