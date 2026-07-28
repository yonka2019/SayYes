import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Rubik } from "next/font/google";
import { DIR, LOCALES, isLocale } from "@/lib/i18n/locales";
import { getDictionary, t } from "@/lib/i18n/t";
import "../globals.css";

// Rubik covers all three scripts; Varela Round had no Cyrillic.
const rubik = Rubik({
  subsets: ["hebrew", "latin", "cyrillic"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-app",
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dict = getDictionary(locale);
  return { title: t(dict, "meta.title"), description: t(dict, "meta.description") };
}

/**
 * The app's root layout — every page lives under `[locale]`, so this is where
 * `lang` and `dir` come from. Direction is per locale, not global: Hebrew is
 * RTL, Russian and English are LTR.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // The middleware only ever emits known locales; a hand-typed /de is a 404.
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <html lang={locale} dir={DIR[locale]} className={rubik.variable}>
      <body className="flex min-h-screen flex-col bg-blush antialiased">
        <div className="flex-1">{children}</div>
        <footer className="relative z-10 flex items-center justify-center gap-1.5 pb-5 pt-8 text-sm text-rose-ink/50">
          <span>{t(dict, "footer.credit")}</span>
          <a
            href="https://github.com/yonka2019/SayYes"
            target="_blank"
            rel="noreferrer"
            aria-label={t(dict, "footer.github")}
            className="transition hover:text-rose-deep"
          >
            <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>
        </footer>
      </body>
    </html>
  );
}
