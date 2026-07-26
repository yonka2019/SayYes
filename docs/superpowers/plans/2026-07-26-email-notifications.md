# Email Notifications (Resend SMTP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The creator enters a required email in the builder; SayYes emails
them the share link when an invitation is created, and a "she answered!" +
dashboard-link notice when it's answered — both sent via Resend's SMTP relay,
with a compensating DB rollback if the send fails.

**Architecture:** A new `src/lib/mail/` module splits pure content-building
(`content.ts`, unit tested) from the impure SMTP transport (`send.ts`, a single
shared `nodemailer` transporter, verified manually). Both API routes call
`sendMail()` after their DB write and undo that write if the send throws.

**Tech Stack:** `nodemailer` over SMTP (`smtp.resend.com:465`), the existing
Prisma/Postgres/Next.js App Router stack, existing `src/lib/i18n/` dictionaries
extended with `email.*` keys.

## Global Constraints

- Creator email is **required** — the builder will not submit without it.
- Env var for the SMTP password is exactly `SMTP_PASSWORD`.
- SMTP: host `smtp.resend.com`, port `465`, `secure: true`, user `resend`,
  password `process.env.SMTP_PASSWORD`.
- From address is hardcoded: `noreply@sayyes.fun`.
- Answered email is a short heads-up + dashboard link — **no** per-question
  recap in the email body.
- A send failure fails the request via a **compensating rollback** — never a
  silent log-and-continue.
- Email language is the invitation's own locale — same rule as chrome.
- Plain-text emails only, no HTML styling.
- `he` is the dictionary source of truth: `ru.ts`/`en.ts` are typed against it,
  so a new `email.*` key added to `he.ts` without translations is a build
  error.
- `npm test` and `npm run build` must both pass at the end of every task.
- Commits are deferred — never commit or push without an explicit request from
  the repo owner. Each task ends with a prepared commit message; run it only
  when asked.

---

### Task 1: Email dictionary keys + validation codes

**Files:**
- Modify: `src/lib/i18n/dictionaries/he.ts`, `src/lib/i18n/dictionaries/ru.ts`,
  `src/lib/i18n/dictionaries/en.ts`
- Modify: `src/lib/types.ts`, `src/lib/validation.ts`
- Test: `tests/validation.test.ts`, `tests/i18n.test.ts` (existing integrity
  suite — no new test needed, just new keys to satisfy it)

**Interfaces:**
- Consumes: nothing new.
- Produces: dictionary keys `builder.email.label`, `builder.email.placeholder`,
  `error.email.required`, `error.email.invalid`, `email.created.subject`,
  `email.created.body`, `email.answered.subject`, `email.answered.body`,
  `api.emailFailed`. `Draft.creatorEmail: string`. `validateDraft()` populates
  `errors.creatorEmail?: FieldError`.

- [ ] **Step 1: Add the keys to the Hebrew source of truth**

In `src/lib/i18n/dictionaries/he.ts`, add a `builder.email.*` pair right after
`builder.name.placeholder` (so it reads top-to-bottom the way the form will):

```ts
  "builder.email.label": "האימייל שלך",
  "builder.email.placeholder": "you@example.com",
```

Add two error codes after `error.name.tooLong`:

```ts
  "error.email.required": "צריך למלא אימייל",
  "error.email.invalid": "כתובת אימייל לא תקינה",
```

Add `api.emailFailed` after `api.createFailed`:

```ts
  "api.emailFailed": "לא הצלחנו לשלוח מייל אישור, ננסה שוב?",
```

Add a new `email.*` group at the end of the file, before the closing
`} as const;`:

```ts

  "email.created.subject": "ההזמנה ל{name} מוכנה 💌",
  "email.created.body": "ההזמנה ל{name} מוכנה. הקישור לשליחה: {link}",
  "email.answered.subject": "{name} ענתה על ההזמנה! 🎉",
  "email.answered.body": "{name} ענתה על ההזמנה שלך. לצפייה בתשובות: {link}",
```

- [ ] **Step 2: Add the Russian translations**

In `src/lib/i18n/dictionaries/ru.ts`, in the same three spots:

```ts
  "builder.email.label": "Ваш email",
  "builder.email.placeholder": "you@example.com",
```

```ts
  "error.email.required": "Нужно указать email",
  "error.email.invalid": "Некорректный email",
```

```ts
  "api.emailFailed": "Не получилось отправить письмо, попробуем снова?",
```

```ts

  "email.created.subject": "Приглашение для {name} готово 💌",
  "email.created.body": "Приглашение для {name} готово. Ссылка для отправки: {link}",
  "email.answered.subject": "{name} ответила на приглашение! 🎉",
  "email.answered.body": "{name} ответила на ваше приглашение. Посмотреть ответы: {link}",
```

- [ ] **Step 3: Add the English translations**

In `src/lib/i18n/dictionaries/en.ts`, in the same three spots:

```ts
  "builder.email.label": "Your email",
  "builder.email.placeholder": "you@example.com",
```

```ts
  "error.email.required": "An email is required",
  "error.email.invalid": "Invalid email address",
```

```ts
  "api.emailFailed": "We couldn't send the confirmation email — try again?",
```

```ts

  "email.created.subject": "The invitation for {name} is ready 💌",
  "email.created.body": "The invitation for {name} is ready. Link to send: {link}",
  "email.answered.subject": "{name} answered the invitation! 🎉",
  "email.answered.body": "{name} answered your invitation. See the answers: {link}",
```

- [ ] **Step 4: Run the dictionary integrity suite**

Run: `npm test -- tests/i18n.test.ts`
Expected: PASS. If it fails on key-set or placeholder parity, one of the three
files above has a typo'd key name or a missing/extra `{placeholder}` — fix the
mismatched file, not the test.

- [ ] **Step 5: Add `creatorEmail` to the types**

In `src/lib/types.ts`, add the field to `Draft`:

```ts
export type Draft = {
  recipientName: string;
  /** Where the "invitation created" / "invitation answered" emails go. */
  creatorEmail: string;
  mascot: MascotKind | null;
  gateQuestion: string;
  questions: DraftQuestion[];
  locale: Locale;
};
```

Add the error slot to `DraftErrors`:

```ts
export type DraftErrors = {
  recipientName?: FieldError;
  creatorEmail?: FieldError;
  mascot?: FieldError;
  gateQuestion?: FieldError;
  questions?: FieldError;
  byQuestion: Record<string, QuestionFieldErrors>;
};
```

- [ ] **Step 6: Write the failing validation tests**

Append to `tests/validation.test.ts` (it already has a `draft()` helper and a
`validateDraft error codes` describe block from the i18n work — add
`creatorEmail: "maya@example.com"` to the helper's defaults first):

```ts
const draft = (over: Partial<Draft> = {}): Draft => ({
  recipientName: "נועה",
  creatorEmail: "maya@example.com",
  mascot: "BEAR",
  gateQuestion: defaultGateQuestion("he"),
  questions: [{ id: "q1", text: "מה נאכל?", options: ["סושי", "פיצה"] }],
  locale: "he",
  ...over,
});
```

Then add, inside the `validateDraft error codes` describe block:

```ts
  it("codes a blank creator email", () => {
    const { errors } = validateDraft(draft({ creatorEmail: "   " }));
    expect(errors.creatorEmail).toEqual({ code: "error.email.required" });
  });

  it("codes a malformed creator email", () => {
    const { errors } = validateDraft(draft({ creatorEmail: "not-an-email" }));
    expect(errors.creatorEmail).toEqual({ code: "error.email.invalid" });
  });

  it("accepts a well-formed creator email", () => {
    const { errors } = validateDraft(draft({ creatorEmail: "a@b.co" }));
    expect(errors.creatorEmail).toBeUndefined();
  });
```

- [ ] **Step 7: Run the tests to verify the new ones fail**

Run: `npm test -- tests/validation.test.ts`
Expected: FAIL — `errors.creatorEmail` is `undefined` in all three new cases
(the field doesn't exist in `validateDraft` yet).

- [ ] **Step 8: Implement the check in `validateDraft`**

In `src/lib/validation.ts`, add near the top a simple format check:

```ts
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

Add the validation block right after the `recipientName` block:

```ts
  const email = draft.creatorEmail.trim();
  if (email.length === 0) {
    errors.creatorEmail = { code: "error.email.required" };
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.creatorEmail = { code: "error.email.invalid" };
  }
```

Add `!errors.creatorEmail &&` to the `valid` computation at the bottom, right
after `!errors.recipientName &&`.

- [ ] **Step 9: Fix the other bare `Draft` literal**

`tests/i18n.test.ts` has a `describe("builder seeds", ...)` block that builds a
raw `Draft` object directly (not through the `draft()` helper in
`validation.test.ts`):

```ts
      const { valid } = validateDraft({
        recipientName: "Maya",
        mascot: "BEAR",
        gateQuestion: defaultGateQuestion(locale),
        questions: defaultQuestions(locale),
        locale,
      });
```

`Draft` now requires `creatorEmail`, so this literal needs it added:

```ts
      const { valid } = validateDraft({
        recipientName: "Maya",
        creatorEmail: "maya@example.com",
        mascot: "BEAR",
        gateQuestion: defaultGateQuestion(locale),
        questions: defaultQuestions(locale),
        locale,
      });
```

Search the rest of the test suite for any other inline `Draft`-shaped object
literal (`recipientName:` is a reliable grep anchor) and add `creatorEmail` to
each one you find — the type checker in Step 11 will also catch any you miss.

- [ ] **Step 10: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, all files (this also re-confirms the i18n integrity suite and
the dodge suite are untouched).

- [ ] **Step 11: Type check the whole project**

Run: `npx tsc --noEmit`
Expected: no errors. This is the backstop for Step 9 — any bare `Draft`
literal anywhere in the codebase missing `creatorEmail` shows up here as a
`Property 'creatorEmail' is missing` error naming its exact file and line.

- [ ] **Step 12: Prepared commit (deferred — run only when asked)**

```bash
git add src/lib/i18n/dictionaries src/lib/types.ts src/lib/validation.ts tests/validation.test.ts tests/i18n.test.ts
git commit -m "feat(mail): add email dictionary keys and creatorEmail validation"
```

---

### Task 2: Schema — `Invitation.creatorEmail`

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Consumes: nothing.
- Produces: `invitation.creatorEmail: string` on every Prisma query result.

- [ ] **Step 1: Add the column**

In `prisma/schema.prisma`, inside `model Invitation`, right after
`recipientName`:

```prisma
  recipientName String
  /// Where the "created" / "answered" notification emails are sent.
  creatorEmail  String     @default("")
```

The empty default exists only so `db push` doesn't choke on existing rows —
the application layer (`validateDraft`, Task 1) is what actually keeps this
required for every *new* invitation.

- [ ] **Step 2: Push the schema**

Run: `npm run db:push`
Expected: succeeds, reports the added column. If a dev server is running,
stop it first (Windows locks the generated Prisma client's `.dll.node` file
while a Node process holds it, which makes `prisma generate` fail with
`EPERM`).

- [ ] **Step 3: Regenerate the client and type check**

Run: `npx prisma generate`
Expected: succeeds.

Run: `npx tsc --noEmit`
Expected: no new errors (the API routes don't reference `creatorEmail` yet —
that's Task 4).

- [ ] **Step 4: Prepared commit (deferred)**

```bash
git add prisma/schema.prisma
git commit -m "feat(mail): add Invitation.creatorEmail column"
```

---

### Task 3: Mail module — `content.ts` (pure) and `send.ts` (SMTP)

**Files:**
- Create: `src/lib/mail/content.ts`, `src/lib/mail/send.ts`
- Test: `tests/mail-content.test.ts`
- Modify: `package.json`, `.env.example`

**Interfaces:**
- Consumes: `Locale`, `getDictionary`, `t` from `@/lib/i18n/*`.
- Produces:
  ```ts
  // content.ts
  export type EmailContent = { subject: string; text: string };
  export function createdEmail(params: { locale: Locale; recipientName: string; link: string }): EmailContent;
  export function answeredEmail(params: { locale: Locale; recipientName: string; link: string }): EmailContent;

  // send.ts
  export function sendMail(params: { to: string; subject: string; text: string }): Promise<void>;
  ```
  `sendMail` rejects on any SMTP failure — callers decide what that means
  (Task 4 turns a rejection into a compensating rollback).

- [ ] **Step 1: Add `nodemailer`**

Run: `npm install nodemailer` then `npm install -D @types/nodemailer`

- [ ] **Step 2: Document the env var**

Append to `.env.example`:

```bash

# Resend SMTP password (Resend dashboard -> API Keys; the key doubles as the
# SMTP password). Host/port/user are fixed: smtp.resend.com:465, user "resend".
SMTP_PASSWORD="re_xxxxxxxx"
```

- [ ] **Step 3: Write the failing content tests**

Create `tests/mail-content.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n/locales";
import { createdEmail, answeredEmail } from "@/lib/mail/content";

const params = {
  recipientName: "Maya",
  link: "https://sayyes.fun/en/invite/abc123",
};

describe("createdEmail", () => {
  it("interpolates the recipient name and link in every locale", () => {
    for (const locale of LOCALES) {
      const { subject, text } = createdEmail({ locale, ...params });
      expect(subject).toContain("Maya");
      expect(text).toContain("Maya");
      expect(text).toContain(params.link);
    }
  });

  it("never leaves a literal placeholder token behind", () => {
    for (const locale of LOCALES) {
      const { subject, text } = createdEmail({ locale, ...params });
      expect(subject).not.toMatch(/\{[a-z]+\}/);
      expect(text).not.toMatch(/\{[a-z]+\}/);
    }
  });
});

describe("answeredEmail", () => {
  it("interpolates the recipient name and dashboard link in every locale", () => {
    for (const locale of LOCALES) {
      const { subject, text } = answeredEmail({ locale, ...params });
      expect(subject).toContain("Maya");
      expect(text).toContain("Maya");
      expect(text).toContain(params.link);
    }
  });

  it("never leaves a literal placeholder token behind", () => {
    for (const locale of LOCALES) {
      const { subject, text } = answeredEmail({ locale, ...params });
      expect(subject).not.toMatch(/\{[a-z]+\}/);
      expect(text).not.toMatch(/\{[a-z]+\}/);
    }
  });

  it("does not include a per-question recap — just the heads-up and link", () => {
    const { text } = answeredEmail({ locale: "en", ...params });
    expect(text).not.toMatch(/Sushi|Pizza/);
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm test -- tests/mail-content.test.ts`
Expected: FAIL — `Cannot find module '@/lib/mail/content'`.

- [ ] **Step 5: Implement `content.ts`**

Create `src/lib/mail/content.ts`:

```ts
import type { Locale } from "@/lib/i18n/locales";
import { getDictionary, t } from "@/lib/i18n/t";

export type EmailContent = { subject: string; text: string };

/**
 * Sent to the creator right after `POST /api/invitations` succeeds. Contains
 * the share link so they can forward it without going back to the app.
 */
export function createdEmail({
  locale,
  recipientName,
  link,
}: {
  locale: Locale;
  recipientName: string;
  link: string;
}): EmailContent {
  const dict = getDictionary(locale);
  return {
    subject: t(dict, "email.created.subject", { name: recipientName }),
    text: t(dict, "email.created.body", { name: recipientName, link }),
  };
}

/**
 * Sent to the creator once the recipient submits their answers. Deliberately
 * just a heads-up + dashboard link, not a full recap — the dashboard already
 * renders one.
 */
export function answeredEmail({
  locale,
  recipientName,
  link,
}: {
  locale: Locale;
  recipientName: string;
  link: string;
}): EmailContent {
  const dict = getDictionary(locale);
  return {
    subject: t(dict, "email.answered.subject", { name: recipientName }),
    text: t(dict, "email.answered.body", { name: recipientName, link }),
  };
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test -- tests/mail-content.test.ts`
Expected: PASS.

- [ ] **Step 7: Implement `send.ts`**

Create `src/lib/mail/send.ts`:

```ts
import nodemailer from "nodemailer";

if (!process.env.SMTP_PASSWORD) {
  throw new Error(
    "SMTP_PASSWORD is not set. Add it to .env — see .env.example for where to get it."
  );
}

const FROM_ADDRESS = "noreply@sayyes.fun";

const globalForMail = globalThis as unknown as {
  mailTransport?: ReturnType<typeof nodemailer.createTransport>;
};

const transport =
  globalForMail.mailTransport ??
  nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    auth: { user: "resend", pass: process.env.SMTP_PASSWORD },
  });

// Reuse one transport across hot reloads in dev, same reasoning as prisma.ts.
if (process.env.NODE_ENV !== "production") globalForMail.mailTransport = transport;

/** Rejects on any SMTP failure — the caller decides what that means. */
export async function sendMail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  await transport.sendMail({ from: FROM_ADDRESS, to, subject, text });
}
```

- [ ] **Step 8: Type check**

Run: `npx tsc --noEmit`
Expected: no errors. (This step will fail with "SMTP_PASSWORD is not set" only
if something actually *imports* `send.ts` at type-check time in a way that
executes it — `tsc` doesn't execute code, so this should be clean regardless
of whether your local `.env` has the var yet.)

- [ ] **Step 9: Prepared commit (deferred)**

```bash
git add src/lib/mail package.json package-lock.json .env.example tests/mail-content.test.ts
git commit -m "feat(mail): add pure email content builders and the SMTP transport"
```

---

### Task 4: Wire `POST /api/invitations` — send + compensating rollback

**Files:**
- Modify: `src/app/api/invitations/route.ts`

**Interfaces:**
- Consumes: `createdEmail` and `sendMail` from `@/lib/mail/*`; `Draft` now has
  `creatorEmail: string` (Task 1); `invitation.creatorEmail` on the Prisma
  result (Task 2).
- Produces: on send failure, responds `400 { code: "api.emailFailed" }` and the
  invitation row (and its cascaded questions/options) no longer exists.

- [ ] **Step 1: Accept `creatorEmail` in `toDraft`**

In `src/app/api/invitations/route.ts`, add a type check next to the existing
`recipientName`/`gateQuestion` checks:

```ts
  if (typeof raw.recipientName !== "string") return null;
  if (typeof raw.creatorEmail !== "string") return null;
  if (typeof raw.gateQuestion !== "string") return null;
```

and include it in the returned object:

```ts
  return {
    recipientName: raw.recipientName,
    creatorEmail: raw.creatorEmail,
    mascot: (raw.mascot as MascotKind | null) ?? null,
    gateQuestion: raw.gateQuestion,
    questions,
    locale: isLocale(raw.locale) ? raw.locale : DEFAULT_LOCALE,
  };
```

- [ ] **Step 2: Persist it on create**

In the `prisma.invitation.create` call, add `creatorEmail` alongside
`recipientName`:

```ts
      recipientName: draft.recipientName.trim(),
      creatorEmail: draft.creatorEmail.trim(),
      mascot: draft.mascot,
```

- [ ] **Step 3: Send the created email, with rollback on failure**

Add the imports:

```ts
import { createdEmail } from "@/lib/mail/content";
import { sendMail } from "@/lib/mail/send";
```

Replace the final two lines of the handler (`return NextResponse.json({ id: invitation.id }, { status: 201 });`)
with:

```ts
  const link = `${new URL(request.url).origin}/${invitation.locale}/invite/${invitation.id}`;
  const { subject, text } = createdEmail({
    locale: draft.locale,
    recipientName: invitation.recipientName,
    link,
  });

  try {
    await sendMail({ to: invitation.creatorEmail, subject, text });
  } catch (error) {
    console.error("Failed to send invitation-created email:", error);
    // Cascades delete the invitation's questions/options — no orphan rows.
    await prisma.invitation.delete({ where: { id: invitation.id } });
    return NextResponse.json({ code: "api.emailFailed" }, { status: 400 });
  }

  return NextResponse.json({ id: invitation.id }, { status: 201 });
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification — happy path**

With `SMTP_PASSWORD` set to a real Resend key and a dev server running, POST a
valid draft (via the builder UI, once Task 6 wires it up, or via `curl`) with a
real inbox as `creatorEmail`. Expected: `201`, an email arrives at that inbox
with subject/body in the draft's locale and a working `/…/invite/…` link.

- [ ] **Step 6: Manual verification — rollback**

Temporarily set `SMTP_PASSWORD` to a wrong value (or unset it and restart —
whichever is faster) and repeat the POST.
Expected: `400 { "code": "api.emailFailed" }`, and
`prisma.invitation.findUnique({ where: { id } })` for that id returns `null` —
nothing was left behind. Restore the correct `SMTP_PASSWORD` afterward.

- [ ] **Step 7: Prepared commit (deferred)**

```bash
git add src/app/api/invitations/route.ts
git commit -m "feat(mail): send the invitation-created email, rolling back on failure"
```

---

### Task 5: Wire `POST /api/invitations/[token]/answers` — send + compensating rollback

**Files:**
- Modify: `src/app/api/invitations/[token]/answers/route.ts`

**Interfaces:**
- Consumes: `answeredEmail` and `sendMail` from `@/lib/mail/*`.
- Produces: on send failure, responds `400 { code: "api.emailFailed" }` and the
  invitation is back to `status: PENDING, answeredAt: null` with the just
  submitted answers deleted — the recipient can retry.

- [ ] **Step 1: Fetch `creatorEmail` and `locale` alongside the invitation**

The existing `prisma.invitation.findUnique` call already selects the whole
`Invitation` row (it only narrows `include`, not `select`), so
`invitation.creatorEmail` and `invitation.locale` are already available — no
query change needed here. Confirm this by reading the current `findUnique`
call before editing anything else.

- [ ] **Step 2: Send the answered email after the transaction, with rollback**

Add the imports:

```ts
import { answeredEmail } from "@/lib/mail/content";
import { sendMail } from "@/lib/mail/send";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locales";
```

Replace the final block — from `await prisma.$transaction([` through the final
`return NextResponse.json({ ok: true });` — with:

```ts
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

  const locale = isLocale(invitation.locale) ? invitation.locale : DEFAULT_LOCALE;
  const link = `${new URL(request.url).origin}/${locale}`;
  const { subject, text } = answeredEmail({
    locale,
    recipientName: invitation.recipientName,
    link,
  });

  try {
    await sendMail({ to: invitation.creatorEmail, subject, text });
  } catch (error) {
    console.error("Failed to send invitation-answered email:", error);
    // The recipient can safely retry — nothing from this attempt survives.
    await prisma.$transaction([
      prisma.answer.deleteMany({
        where: { invitationId: invitation.id, questionId: { in: submissions.map((s) => s.questionId) } },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "PENDING", answeredAt: null },
      }),
    ]);
    return NextResponse.json({ code: "api.emailFailed" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification — happy path**

Answer a pending invitation end-to-end through the recipient UI (with
`SMTP_PASSWORD` correctly set). Expected: the finale renders as before, and the
creator's email inbox receives the "answered" email with a working link to
`/{locale}` (the dashboard).

- [ ] **Step 5: Manual verification — rollback**

Break `SMTP_PASSWORD` again, answer a different pending invitation.
Expected: the client sees a `400 { "code": "api.emailFailed" }` (surfaced via
the existing `submitError` retry UI in `InviteFlow`, since that path already
translates unknown-but-present codes generically — confirm the message shown
is `api.emailFailed`'s translated text, not the generic fallback). Then check
that invitation via `GET`-equivalent (the dashboard, or a direct
`prisma.invitation.findUnique`) shows `status: "PENDING"` and no `Answer` rows
for it — restore `SMTP_PASSWORD` and answer it again to confirm the retry
succeeds cleanly.

- [ ] **Step 6: Prepared commit (deferred)**

```bash
git add "src/app/api/invitations/[token]/answers/route.ts"
git commit -m "feat(mail): send the invitation-answered email, rolling back on failure"
```

---

### Task 6: Builder UI — the email field

**Files:**
- Modify: `src/components/BuilderForm.tsx`

**Interfaces:**
- Consumes: `builder.email.label`, `builder.email.placeholder`,
  `error.email.required`/`error.email.invalid` (via `visible.creatorEmail`),
  `api.emailFailed` (already covered generically by the existing
  `codeFrom(payload?.code, "api.createFailed")` fallback logic — no new client
  code path needed there).
- Produces: the initial `Draft` includes `creatorEmail: ""`.

- [ ] **Step 1: Add the field to the initial draft**

In `BuilderForm`'s `useState<Draft>` initializer, add `creatorEmail: ""` right
after `recipientName: ""`:

```tsx
  const [draft, setDraft] = useState<Draft>({
    recipientName: "",
    creatorEmail: "",
    mascot: null,
    gateQuestion: defaultGateQuestion(locale),
    questions: defaultQuestions(locale),
    locale,
  });
```

- [ ] **Step 2: Render the input**

Right after the closing `</label>` + `<FieldErrorText error={visible.recipientName} dict={dict} />`
block for the name field (before the `<div className="mt-6">` that holds the
mascot picker), add:

```tsx
        <label className="mt-6 block">
          <Label>{t(dict, "builder.email.label")}</Label>
          <input
            type="email"
            dir="ltr"
            className={`${inputClass} text-left`}
            value={draft.creatorEmail}
            placeholder={t(dict, "builder.email.placeholder")}
            onChange={(event) => patch({ creatorEmail: event.target.value })}
          />
        </label>
        <FieldErrorText error={visible.creatorEmail} dict={dict} />
```

`dir="ltr"` and `text-left` are deliberate even in the Hebrew/RTL layout — an
email address is always written left-to-right, the same reasoning already
applied to the generated share-link input further down this file.

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification, one locale is enough here**

Run: `npm run dev`, open `/en/new`.
Expected: an "Your email" field appears between the name and mascot fields,
left-aligned even though the rest of the Hebrew layout (if you check `/he/new`
too) is RTL. Submitting with it blank shows "An email is required"; typing
`not-an-email` and blurring elsewhere then submitting shows "Invalid email
address" (errors only appear after the first submit attempt, matching the
existing `showErrors` behavior); a well-formed address lets the form proceed to
the API call.

- [ ] **Step 5: Full regression pass**

Run: `npm test && npm run build`
Expected: all unit tests pass, production build succeeds.

- [ ] **Step 6: Prepared commit (deferred)**

```bash
git add src/components/BuilderForm.tsx
git commit -m "feat(mail): add the required creator-email field to the builder"
```

---

### Task 7: Docs

**Files:**
- Modify: `CLAUDE.md`, `README.md`

- [ ] **Step 1: Update `CLAUDE.md`**

Add a bullet to the "Hard rules for this project" section:

```markdown
- **The creator's email is required** and stored on `Invitation.creatorEmail`.
  Two notification emails go out via `src/lib/mail/`: one when an invitation is
  created (share link) and one when it's answered (dashboard link, no answer
  recap). Both use the invitation's own locale for the email text. A failed
  send **fails the request** — the API compensates by rolling back what it
  just wrote (deleting the invitation, or deleting the just-inserted answers
  and reverting `ANSWERED` back to `PENDING`) rather than silently continuing.
```

In the **Architecture** pure-logic list, add:

```markdown
  - `mail/content.ts` — pure `{ subject, text }` builders per locale, unit
    tested. `mail/send.ts` — the one shared `nodemailer` SMTP transport
    (`smtp.resend.com:465`), not unit tested (verified manually, same as
    `prisma.ts`'s pattern of throwing at import if its env var is missing).
```

Add to the required env vars (wherever `DATABASE_URL` is currently mentioned as
required) that `SMTP_PASSWORD` is required too.

- [ ] **Step 2: Update `README.md`**

In the Setup section's env var instructions, add a line for `SMTP_PASSWORD`
alongside `DATABASE_URL`, pointing at the Resend dashboard.

In the Routes table, note that `POST /api/invitations` and
`POST /api/invitations/[token]/answers` can now also respond `400
{ code: "api.emailFailed" }` if the notification email fails to send, and that
this rolls back the write.

- [ ] **Step 3: Prepared commit (deferred)**

```bash
git add CLAUDE.md README.md
git commit -m "docs: document the email notification system"
```

---

## Self-Review

**Spec coverage**

| Spec section | Task |
|---|---|
| Schema: `creatorEmail` with default | 2 |
| Mail module: `content.ts` pure / `send.ts` SMTP | 3 |
| Created email content + link | 3, 4 |
| Answered email content (heads-up + link, no recap) | 3, 5 |
| Compensating rollback on create | 4 |
| Compensating rollback on answer | 5 |
| Builder: required email field + validation codes | 1, 6 |
| Email language = invitation locale | 3 (content.ts takes `locale`) |
| Testing: content unit tests, validation cases, i18n parity | 1, 3 |
| Manual verification incl. rollback | 4, 5, 6 |
| Docs | 7 |

**Type consistency:** `Draft.creatorEmail: string` (Task 1) flows unchanged
through `toDraft` (Task 4) into `prisma.invitation.create` (Task 4) and is read
back as `invitation.creatorEmail` (Tasks 4–5). `EmailContent = { subject, text
}` (Task 3) is what both `createdEmail`/`answeredEmail` return and exactly what
`sendMail` destructures from in Tasks 4–5. `FieldError` (pre-existing type) is
reused for `errors.creatorEmail` — no new error-shape type introduced.

**Placeholder scan:** no TBDs; every code step has literal code; every test
step has literal assertions; the "read the current findUnique call" step in
Task 5 is a verification instruction, not an implementation placeholder — the
route's `include` shape doesn't change, only the code after it.
