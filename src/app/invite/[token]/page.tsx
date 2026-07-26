import { CuteCard } from "@/components/CuteCard";
import { InviteFlow } from "@/components/InviteFlow";
import { Mascot } from "@/components/Mascot";
import { RecapCard } from "@/components/RecapCard";
import { Sparkles } from "@/components/Sparkles";
import { prisma } from "@/lib/prisma";
import type { InviteView, MascotKind, RecapItem } from "@/lib/types";

export const dynamic = "force-dynamic";

function MissingInvitation() {
  return (
    <CuteCard top={<Mascot kind="PENGUIN" mood="idle" size={170} />}>
      <h1 className="text-center text-2xl font-bold text-rose-deep">אופס, ההזמנה לא נמצאה</h1>
      <p className="mt-3 text-center text-rose-ink/70">
        כנראה שהקישור לא מדויק. אולי כדאי לבקש אותו שוב?
      </p>
    </CuteCard>
  );
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

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

  return (
    <>
      <Sparkles />
      <main className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
        {!invitation ? (
          <MissingInvitation />
        ) : invitation.status === "ANSWERED" ? (
          <AnsweredRecap
            recipientName={invitation.recipientName}
            mascot={invitation.mascot}
            items={recapItems(invitation)}
          />
        ) : (
          <InviteFlow invite={toInviteView(invitation, token)} />
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

function toInviteView(invitation: LoadedInvitation, token: string): InviteView {
  return {
    token,
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
}: {
  recipientName: string;
  mascot: MascotKind;
  items: RecapItem[];
}) {
  return (
    <CuteCard top={<Mascot kind={mascot} mood="cheer" size={180} />}>
      <h1 className="text-center text-2xl font-bold text-rose-deep">כבר סגרנו הכול 💕</h1>
      <p className="mt-2 text-center text-rose-ink/70">
        {recipientName}, אלה התשובות ששלחת — נתראה בדייט!
      </p>
      <div className="mt-6">
        <RecapCard items={items} />
      </div>
    </CuteCard>
  );
}
