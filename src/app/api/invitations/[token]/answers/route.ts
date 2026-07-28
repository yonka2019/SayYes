import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/t";
import { answeredEmail } from "@/lib/mail/content";
import { sendMail } from "@/lib/mail/send";
import { prisma } from "@/lib/prisma";
import type { AnswerSubmission, RecapItem } from "@/lib/types";

function toSubmissions(body: unknown): AnswerSubmission[] | null {
  if (typeof body !== "object" || body === null) return null;
  const raw = (body as Record<string, unknown>).answers;
  if (!Array.isArray(raw)) return null;

  const submissions: AnswerSubmission[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) return null;
    const { questionId, selectedOptionId } = entry as Record<string, unknown>;
    if (typeof questionId !== "string" || typeof selectedOptionId !== "string") return null;
    submissions.push({ questionId, selectedOptionId });
  }
  return submissions;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "api.badRequest" }, { status: 400 });
  }

  const submissions = toSubmissions(body);
  if (!submissions) {
    return NextResponse.json({ code: "api.badRequest" }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id: token },
    // Ordered because the notification email's recap is built from this, and it
    // has to read in the same order the creator wrote the questions — the same
    // order the answers page and finale both show. Validation alone
    // wouldn't care, which is why this query used to be unordered.
    include: { questions: { orderBy: { order: "asc" }, include: { options: true } } },
  });

  if (!invitation) {
    return NextResponse.json({ code: "api.notFound" }, { status: 404 });
  }
  if (invitation.status === "ANSWERED") {
    return NextResponse.json({ code: "api.alreadyAnswered" }, { status: 409 });
  }

  // Every question must be answered exactly once, with an option that really
  // belongs to that question.
  if (submissions.length !== invitation.questions.length) {
    return NextResponse.json({ code: "api.missingAnswers" }, { status: 400 });
  }

  const seen = new Set<string>();
  for (const submission of submissions) {
    const question = invitation.questions.find((item) => item.id === submission.questionId);
    if (!question || seen.has(submission.questionId)) {
      return NextResponse.json({ code: "api.invalidAnswer" }, { status: 400 });
    }
    if (!question.options.some((option) => option.id === submission.selectedOptionId)) {
      return NextResponse.json({ code: "api.invalidAnswer" }, { status: 400 });
    }
    seen.add(submission.questionId);
  }

  await prisma.$transaction([
    prisma.answer.createMany({
      data: submissions.map((submission) => ({
        invitationId: invitation.id,
        questionId: submission.questionId,
        selectedOptionId: submission.selectedOptionId,
      })),
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ANSWERED", answeredAt: new Date() },
    }),
  ]);

  // Everything the recap needs is already in hand — `invitation.questions`
  // came back with its options, and `submissions` holds the chosen ids — so
  // this costs no extra query.
  const recap: RecapItem[] = invitation.questions.map((question) => {
    const submission = submissions.find((item) => item.questionId === question.id);
    const option = question.options.find((item) => item.id === submission?.selectedOptionId);
    return { question: question.text, answer: option?.label ?? "—" };
  });

  const locale = isLocale(invitation.locale) ? invitation.locale : DEFAULT_LOCALE;
  const link = `${new URL(request.url).origin}/${locale}/answers/${invitation.id}`;
  const { subject, text, html } = answeredEmail({
    locale,
    recipientName: invitation.recipientName,
    mascot: invitation.mascot,
    link,
    recap,
  });

  // A blank creatorEmail is "nothing to notify", not a send failure — legacy
  // rows created before creatorEmail was required default to "" and must stay
  // answerable.
  const notify = invitation.creatorEmail.trim();
  if (notify) {
    try {
      await sendMail({ to: notify, subject, text, html });
    } catch (error) {
      console.error("Failed to send invitation-answered email:", error);
      // The recipient can safely retry — nothing from this attempt survives.
      try {
        await prisma.$transaction([
          prisma.answer.deleteMany({
            where: {
              invitationId: invitation.id,
              questionId: { in: submissions.map((s) => s.questionId) },
            },
          }),
          prisma.invitation.update({
            where: { id: invitation.id },
            data: { status: "PENDING", answeredAt: null },
          }),
        ]);
      } catch (rollbackError) {
        console.error("Rollback failed after email failure:", rollbackError);
      }
      return NextResponse.json(
        { code: "api.emailFailed" satisfies MessageKey },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
