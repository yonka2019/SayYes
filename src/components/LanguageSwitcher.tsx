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
 * All three languages, each in its own script, with the current one filled.
 * A segmented control rather than a dropdown: with three locales a popover
 * would add open/close state, click-outside, Escape and arrow-key handling for
 * nothing.
 *
 * Picking one writes the cookie — so the choice survives a visit to a
 * prefix-less URL — then swaps the path prefix.
 *
 * Not rendered on the invite or answers pages: their content can't follow a
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

  function choose(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    router.replace(swapLocale(pathname, next));
  }

  return (
    <div
      role="group"
      aria-label={t(dict, "switcher.label")}
      className="flex flex-wrap items-center gap-1 rounded-2xl bg-white/70 p-1"
    >
      <span aria-hidden className="px-1.5 text-sm">
        🌐
      </span>
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            onClick={() => choose(code)}
            aria-current={active ? "true" : undefined}
            className={`rounded-xl px-3 py-1.5 text-sm font-bold transition ${
              active ? "bg-rose-deep text-white" : "text-rose-deep hover:bg-blush"
            }`}
          >
            {LOCALE_NAMES[code]}
          </button>
        );
      })}
    </div>
  );
}
