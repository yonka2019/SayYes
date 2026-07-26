import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AnswerSubmission } from "@/lib/types";

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
    include: { questions: { include: { options: true } } },
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

  return NextResponse.json({ ok: true });
}
