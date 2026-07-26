import { notFound, redirect } from "next/navigation";
import { CuteCard } from "@/components/CuteCard";
import { InviteFlow } from "@/components/InviteFlow";
import { Mascot } from "@/components/Mascot";
import { RecapCard } from "@/components/RecapCard";
import { Sparkles } from "@/components/Sparkles";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/locales";
import { getDictionary, t, type Dictionary, type MessageKey } from "@/lib/i18n/t";
import { prisma } from "@/lib/prisma";
import type { InviteView, MascotKind, RecapItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const mascotKey = (kind: MascotKind): MessageKey =>
  kind === "BEAR" ? "mascot.bear" : "mascot.penguin";

function MissingInvitation({ dict }: { dict: Dictionary }) {
  return (
    <CuteCard
      top={
        <Mascot kind="PENGUIN" mood="idle" size={170} label={t(dict, "mascot.penguin")} />
      }
    >
      <h1 className="text-center text-2xl font-bold text-rose-deep">
        {t(dict, "invite.missing.title")}
      </h1>
      <p className="mt-3 text-center text-rose-ink/70">{t(dict, "invite.missing.text")}</p>
    </CuteCard>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();

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

  // A missing invitation has no locale of its own, so the URL's is all we have.
  if (!invitation) {
    return (
      <>
        <Sparkles />
        <main className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
          <MissingInvitation dict={getDictionary(locale)} />
        </main>
      </>
    );
  }

  // The invitation's language wins: its content can't be translated, so the
  // chrome has to come to it rather than the other way round.
  const owned: Locale = isLocale(invitation.locale) ? invitation.locale : DEFAULT_LOCALE;
  if (owned !== locale) redirect(`/${owned}/invite/${token}`);

  const dict = getDictionary(owned);

  return (
    <>
      <Sparkles />
      <main className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
        {invitation.status === "ANSWERED" ? (
          <AnsweredRecap
            recipientName={invitation.recipientName}
            mascot={invitation.mascot}
            items={recapItems(invitation)}
            dict={dict}
          />
        ) : (
          <InviteFlow invite={toInviteView(invitation, token, owned)} dict={dict} />
        )}
      </main>
    </>
  );
}

/** Just the parts of the query above that the mappers below need. */
type LoadedInvitation = {
  recipientName: string;
  mascot: MascotKind;
  gateQuestion: string;
  questions: { id: string; text: string; options: { id: string; label: string }[] }[];
  answers: { questionId: string; selectedOption: { label: string } }[];
};

function toInviteView(
  invitation: LoadedInvitation,
  token: string,
  locale: Locale
): InviteView {
  return {
    token,
    locale,
    recipientName: invitation.recipientName,
    mascot: invitation.mascot,
    gateQuestion: invitation.gateQuestion,
    questions: invitation.questions.map((question) => ({
      id: question.id,
      text: question.text,
      options: question.options.map((option) => ({ id: option.id, label: option.label })),
    })),
  };
}

function recapItems(invitation: LoadedInvitation): RecapItem[] {
  return invitation.questions.map((question) => {
    const answer = invitation.answers.find((item) => item.questionId === question.id);
    return { question: question.text, answer: answer?.selectedOption.label ?? "—" };
  });
}

function AnsweredRecap({
  recipientName,
  mascot,
  items,
  dict,
}: {
  recipientName: string;
  mascot: MascotKind;
  items: RecapItem[];
  dict: Dictionary;
}) {
  return (
    <CuteCard
      top={<Mascot kind={mascot} mood="cheer" size={180} label={t(dict, mascotKey(mascot))} />}
    >
      <h1 className="text-center text-2xl font-bold text-rose-deep">
        {t(dict, "invite.answered.title")}
      </h1>
      <p className="mt-2 text-center text-rose-ink/70">
        {t(dict, "invite.answered.text", { name: recipientName })}
      </p>
      <div className="mt-6">
        <RecapCard
          items={items}
          title={t(dict, "recap.title")}
          emptyText={t(dict, "recap.empty")}
        />
      </div>
    </CuteCard>
  );
}
