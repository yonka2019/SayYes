import Link from "next/link";
import { DashboardList, type DashboardItem } from "@/components/DashboardList";
import { Sparkles } from "@/components/Sparkles";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function DashboardPage() {
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
    recap: invitation.questions.map((question) => {
      const answer = invitation.answers.find((item) => item.questionId === question.id);
      return { question: question.text, answer: answer?.selectedOption.label ?? "—" };
    }),
  }));

  return (
    <>
      <Sparkles />
      <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-rose-deep">ההזמנות שלי</h1>
            <p className="text-rose-ink/60">כל ההזמנות שיצרתם במחשב הזה</p>
          </div>
          <Link
            href="/new"
            className="shrink-0 rounded-2xl bg-gradient-to-b from-rose-soft to-rose-deep px-5 py-3 text-lg font-bold text-white shadow-[0_12px_30px_-14px_rgba(232,74,127,0.8)] transition hover:brightness-105"
          >
            + הזמנה חדשה
          </Link>
        </div>

        <DashboardList items={items} />
      </main>
    </>
  );
}
