import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardList, type DashboardItem } from "@/components/DashboardList";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sparkles } from "@/components/Sparkles";
import { DATE_LOCALE, DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locales";
import { getDictionary, t } from "@/lib/i18n/t";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  // Dates are chrome, so they follow the viewer's locale, not the invitation's.
  const dateFormatter = new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
      answers: { include: { selectedOption: true } },
    },
  });

  const items: DashboardItem[] = invitations.map((invitation) => ({
    id: invitation.id,
    recipientName: invitation.recipientName,
    mascot: invitation.mascot,
    status: invitation.status,
    createdLabel: dateFormatter.format(invitation.createdAt),
    answeredLabel: invitation.answeredAt ? dateFormatter.format(invitation.answeredAt) : null,
    // A hand-edited row shouldn't crash the list.
    locale: isLocale(invitation.locale) ? invitation.locale : DEFAULT_LOCALE,
    recap: invitation.questions.map((question) => {
      const answer = invitation.answers.find((item) => item.questionId === question.id);
      return { question: question.text, answer: answer?.selectedOption.label ?? "—" };
    }),
  }));

  return (
    <>
      <Sparkles />
      <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-10">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher locale={locale} dict={dict} />
        </div>

        {/* Wraps so the title, subtitle and button never overflow a phone. */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-rose-deep">{t(dict, "dashboard.title")}</h1>
            <p className="text-rose-ink/60">{t(dict, "dashboard.subtitle")}</p>
          </div>
          <Link
            href={`/${locale}/new`}
            className="shrink-0 rounded-2xl bg-gradient-to-b from-rose-soft to-rose-deep px-5 py-3 text-lg font-bold text-white shadow-[0_12px_30px_-14px_rgba(232,74,127,0.8)] transition hover:brightness-105"
          >
            {t(dict, "dashboard.new")}
          </Link>
        </div>

        <DashboardList items={items} dict={dict} locale={locale} />
      </main>
    </>
  );
}
