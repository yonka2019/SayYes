import Link from "next/link";
import { notFound } from "next/navigation";
import { BuilderForm } from "@/components/BuilderForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sparkles } from "@/components/Sparkles";
import { isLocale } from "@/lib/i18n/locales";
import { getDictionary, t } from "@/lib/i18n/t";

export default async function NewInvitationPage({
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

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-rose-deep">{t(dict, "builder.title")}</h1>
          <Link
            href={`/${locale}`}
            className="rounded-2xl border-2 border-blush-deep bg-white px-4 py-2 font-bold text-rose-ink/70 transition hover:bg-blush"
          >
            {t(dict, "builder.back")}
          </Link>
        </div>

        {/* Keyed on locale so switching language re-seeds the draft. */}
        <BuilderForm key={locale} locale={locale} dict={dict} />
      </main>
    </>
  );
}
