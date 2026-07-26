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

  return (
    <html lang={locale} dir={DIR[locale]} className={rubik.variable}>
      <body className="min-h-screen bg-blush antialiased">{children}</body>
    </html>
  );
}
