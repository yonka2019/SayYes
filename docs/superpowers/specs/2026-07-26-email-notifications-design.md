# Design: Email notifications (Resend SMTP)

Date: 2026-07-26
Status: approved

## Goal

The creator enters their email in the builder. SayYes emails them when an
invitation is created (with the share link) and again when the recipient
answers it (with a dashboard link). Sent via Resend's SMTP relay.

## Decisions

| Decision | Choice |
|---|---|
| Creator email | **Required** in the builder — no submit without it |
| Env var | `SMTP_PASSWORD` |
| SMTP endpoint | `smtp.resend.com:465`, user `resend`, password from `SMTP_PASSWORD` |
| From address | Hardcoded `noreply@sayyes.fun` (verified domain) |
| Answered-email content | Short heads-up + dashboard link — not a full answer recap |
| Send failure | **Fails the request**, via a compensating DB rollback (see below) |
| Email language | The invitation's own locale — same rule already used for chrome |

## Schema

`Invitation.creatorEmail String @default("")`. A default is required because
existing rows have no email; the empty default is never valid at the
application layer — `validateDraft()` rejects it exactly like a missing
`recipientName`, so no new invitation can be created without one.

## Mail module — `src/lib/mail/`

- **`content.ts`** (pure, unit tested) — builds `{ subject, text }` for the two
  emails from an invitation's locale and data, using new `email.*` keys added
  to all three dictionaries (`he`, `ru`, `en`). No network code, no
  `nodemailer` import — testable exactly like `dodge.ts` and `validation.ts`.
- **`send.ts`** (impure, not unit tested — verified manually, same as
  `prisma.ts`) — one shared `nodemailer` transport: `smtp.resend.com`, port
  `465`, `secure: true`, user `resend`, password `process.env.SMTP_PASSWORD`.
  Throws immediately at import if `SMTP_PASSWORD` is missing, so a
  misconfigured deploy fails with a readable message instead of a
  send-time crash. `from` is the hardcoded `noreply@sayyes.fun`.
  Exposes `sendMail({ to, subject, text }): Promise<void>` — rejects on any
  SMTP failure, and the caller decides what that means.

## Emails

- **Created** → creator's email. Subject + body include the recipient's name
  and the share link: `{origin}/{locale}/invite/{id}`.
- **Answered** → creator's email. Subject + body: "{name} answered!" plus the
  dashboard link: `{origin}/{locale}`. No per-question recap — the dashboard
  already renders one.

`{origin}` is derived from the incoming `Request` (`new URL(request.url)`) in
each route handler — no new env var needed for it.

## Failure handling — compensating rollback

The DB write and the SMTP send are not one atomic operation, so "fail the
request" is implemented as: do the DB write, try the send, and if the send
throws, undo the DB write and report failure.

- **`POST /api/invitations`**: create the invitation → try `sendMail` (created
  email) → on throw, `prisma.invitation.delete()` the row just created (the
  `onDelete: Cascade` relations clean up its questions/options), return
  `400 { code: "api.emailFailed" }`.
- **`POST /api/invitations/[token]/answers`**: run the existing transaction
  (insert answers, mark `ANSWERED`) → try `sendMail` (answered email) → on
  throw, run a second transaction that deletes those answers and reverts the
  invitation to `status: PENDING, answeredAt: null`, return
  `400 { code: "api.emailFailed" }`. The recipient can retry — safe, since
  nothing from the failed attempt survives.

Trade-off, accepted: a flaky mail server can make either endpoint intermittently
fail even though the invitation/answers were otherwise perfectly valid. Fine
for a personal single-user app; not fine at any real scale.

## Builder changes

- New required field: creator email, right below the recipient-name field.
  Reuses the existing inline-error pattern (`FieldErrorText`).
- `validateDraft()` gains: `error.email.required` (blank) and
  `error.email.invalid` (fails a basic `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` check).
  Both are new dictionary keys, translated in all three locales like every
  other validation code.
- `Draft.creatorEmail: string` added to the type; the create route's `toDraft`
  narrows it the same way it narrows every other field.

## Testing

- `tests/mail-content.test.ts`: the created/answered subject+body for all
  three locales — correct interpolation of name/link, no empty strings, no
  leftover `{placeholder}` tokens.
- `tests/validation.test.ts`: new cases for `error.email.required` and
  `error.email.invalid`, plus a case confirming a valid email passes.
- `tests/i18n.test.ts`: the existing key-set/placeholder-parity suite covers
  the new `email.*` keys automatically — no new test needed there, just new
  dictionary entries.
- Manual: create an invitation with a real inbox, confirm the created email
  arrives with a working link; answer it, confirm the answered email arrives
  with a working dashboard link; then verify the rollback by temporarily
  breaking `SMTP_PASSWORD` and confirming both endpoints return
  `400 { code: "api.emailFailed" }` and leave no orphaned/partial rows.

## Out of scope

- Editing or resending emails after the fact.
- Any email to the recipient (only the creator is emailed).
- HTML-styled emails — plain text only.
- Verifying the creator's email address (no confirm-your-email flow).
- Retrying a failed send automatically — the compensating rollback means the
  creator/recipient simply retries the action themselves.
