import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CuteCard } from "@/components/CuteCard";
import { Mascot } from "@/components/Mascot";
import { RecapCard } from "@/components/RecapCard";
import { Sparkles } from "@/components/Sparkles";
import { DATE_LOCALE, isLocale } from "@/lib/i18n/locales";
import { getDictionary, t, type Dictionary } from "@/lib/i18n/t";
import { MASCOT_NAME_KEY } from "@/lib/mascots";
import { prisma } from "@/lib/prisma";
import type { MascotKind, RecapItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const linkClass =
  "inline-block rounded-2xl bg-gradient-to-b from-rose-soft to-rose-deep px-6 py-3 text-lg font-bold text-white transition hover:brightness-105";

/** A creator following a stale link should land somewhere styled, not on a 404. */
function MissingCard({ dict }: { dict: Dictionary }) {
  return (
    <CuteCard
      top={<Mascot kind="PENGUIN" mood="idle" size={170} label={t(dict, "mascot.penguin")} />}
    >
      <h1 className="text-center text-2xl font-bold text-rose-deep">
        {t(dict, "answers.missing.title")}
      </h1>
      <p className="mt-3 text-center text-rose-ink/70">{t(dict, "answers.missing.text")}</p>
    </CuteCard>
  );
}

export default async function AnswersPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const invitation = await prisma.invitation.findUnique({
    where: { id: token },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
      answers: { include: { selectedOption: true } },
    },
  });

  if (!invitation) {
    return (
      <>
        <Sparkles />
        <main className="relative z-10 grid min-h-dvh place-items-center px-4 py-10">
          <MissingCard dict={dict} />
        </main>
      </>
    );
  }

  // An invitation owns its locale, so content and chrome never mix languages.
  // Same rule the invite page enforces.
  if (isLocale(invitation.locale) && invitation.locale !== locale) {
    redirect(`/${invitation.locale}/answers/${token}`);
  }

  const mascot = invitation.mascot as MascotKind;
  const mascotLabel = t(dict, MASCOT_NAME_KEY[mascot]);

  // Reachable from a bookmark or a link opened before the recipient replied —
  // it must not be a dead end.
  if (invitation.status !== "ANSWERED") {
    return (
      <>
        <Sparkles />
        <main className="relative z-10 grid min-h-dvh place-items-center px-4 py-10">
          <CuteCard top={<Mascot kind={mascot} mood="idle" size={170} label={mascotLabel} />}>
            <h1 className="text-center text-2xl font-bold text-rose-deep">
              {t(dict, "answers.waiting.title", { name: invitation.recipientName })}
            </h1>
            <p className="mt-3 text-center text-rose-ink/70">{t(dict, "answers.waiting.text")}</p>
            <div className="mt-5 text-center">
              <Link href={`/${locale}/invite/${token}`} className={linkClass}>
                {t(dict, "answers.waiting.cta")}
              </Link>
            </div>
          </CuteCard>
        </main>
      </>
    );
  }

  const recap: RecapItem[] = invitation.questions.map((question) => {
    const answer = invitation.answers.find((item) => item.questionId === question.id);
    return { question: question.text, answer: answer?.selectedOption.label ?? "—" };
  });

  // The timestamp is chrome, so it follows the viewer's locale. By this point
  // the viewer's locale and the invitation's are the same — the redirect above
  // guarantees it. `locale` is already narrowed to `Locale` by the isLocale
  // guard, since notFound() returns never.
  const answeredLabel = invitation.answeredAt
    ? new Intl.DateTimeFormat(DATE_LOCALE[locale], {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(invitation.answeredAt)
    : null;

  return (
    <>
      <Sparkles />
      <main className="relative z-10 grid min-h-dvh place-items-center px-4 py-10">
        <div className="flex w-full max-w-md flex-col items-center gap-5">
          <CuteCard top={<Mascot kind={mascot} mood="cheer" size={180} label={mascotLabel} />}>
            <h1 className="text-center text-2xl font-bold text-rose-deep">
              {t(dict, "answers.title", { name: invitation.recipientName })}
            </h1>
            {answeredLabel && (
              <p className="mt-1 text-center text-sm text-rose-ink/60">
                {t(dict, "answers.answeredAt", { date: answeredLabel })}
              </p>
            )}
            <div className="mt-5">
              <RecapCard
                items={recap}
                title={t(dict, "answers.recapTitle")}
                emptyText={t(dict, "recap.empty")}
              />
            </div>
          </CuteCard>
        </div>
      </main>
    </>
  );
}
