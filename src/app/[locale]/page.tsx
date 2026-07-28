import { notFound } from "next/navigation";
import { BuilderForm } from "@/components/BuilderForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sparkles } from "@/components/Sparkles";
import { isLocale } from "@/lib/i18n/locales";
import { getDictionary, t } from "@/lib/i18n/t";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <>
      <Sparkles />
      <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-10">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher locale={locale} dict={dict} />
        </div>

        <h1 className="mb-6 text-3xl font-bold text-rose-deep">{t(dict, "builder.title")}</h1>

        {/* Keyed on locale so switching language re-seeds the draft. */}
        <BuilderForm key={locale} locale={locale} dict={dict} />
      </main>
    </>
  );
}
