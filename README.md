# SayYes · תגידי כן · Скажи да

A personal, single-user website for making cute interactive "will you go on a
date with me?" invitations, in Hebrew, Russian, or English.

You build an invitation (recipient name, mascot, gate question, multiple-choice
logistics questions) in whichever of the three languages you're working in, get
a shareable link, and send it. She opens it, has to say "yes" to the gate
question, answers the logistics questions, and lands on a confetti finale with a
recap of everything she picked. Her answers show up on your dashboard.

The "no" button doesn't cooperate: it bolts away from the cursor before it can
be hovered, and any click that does land shrinks it and adds an escalating plea
in that invitation's language (Hebrew `בבקשה 🥺` → `אנא ממך 🥺💔`, Russian
`пожалуйста 🥺` → `умоляю тебя 🥺💔`, English `please 🥺` → `I'm begging you
🥺💔`). It shrinks to a floor rather than disappearing, so it never becomes
un-clickable-by-vanishing — just increasingly hopeless. On phones there's no
hover, so each tap is a catch that shrinks it.

Loosely modeled on [svidos.ru](https://svidos.ru/): phone-mockup card with a
rose gradient panel on top, heart-shaped yes button, small-hop dodging no
button, and a mascot that reacts at the key moments.

## Stack

| Piece | Choice |
|---|---|
| App | Next.js 15 (App Router, TypeScript) — UI + API routes in one process |
| DB | Postgres via Prisma (Neon / Vercel Postgres) |
| Styling | Tailwind CSS v4, custom pink theme in `src/app/globals.css` |
| Animation | Framer Motion (mascots, dodge button, transitions) |
| Finale | canvas-confetti |
| Tests | Vitest over the pure logic in `src/lib` |

## Languages

Three locales: `he` (default), `ru`, `en` — each with its own URL prefix
(`/he`, `/ru`, `/en`).

**Detection**, on any request with no locale prefix (`src/middleware.ts` →
`resolveLocale()` in `src/lib/i18n/locales.ts`):

1. Explicit URL prefix — wins if present.
2. `sayyes_locale` cookie — the visitor's last manual switch.
3. `Accept-Language` header — q-weight aware, matched on the base subtag
   (`ru-RU` → `ru`, legacy `iw` → `he`).
4. `he` — the default.

A prefix-less request gets a `307` to the resolved locale, so there's no
wrong-language flash. `/api/*` is never redirected.

**Two string classes:**
- *Chrome* (buttons, labels, validation messages, the escalating pleas) is
  translated. Every key lives in `src/lib/i18n/dictionaries/{he,ru,en}.ts`.
  `he.ts` is the source of truth — `ru.ts`/`en.ts` are typed against it, so a
  key added without a translation is a **build error**. To add a string: add
  the key to `he.ts`, then follow the type errors into `ru.ts` and `en.ts`.
- *Invitation content* (recipient name, gate question, question texts, answer
  options) is never translated — it's stored exactly as the creator typed it.
  The builder's three pre-filled logistics questions are chrome-derived seeds,
  but the moment they're edited or accepted, they become content.

**An invitation owns its locale.** It's set from the builder's URL when the
invitation is created, and `/{locale}/invite/{token}` redirects to the
invitation's own locale if they differ — so the recipient never sees Hebrew
content next to Russian buttons. For that reason, the language switcher
(dashboard and builder, one button that cycles `he → ru → en`) doesn't appear
on the invite page — the content can't follow a switch there.

## Setup

You need a Postgres connection string and an SMTP password for email notifications.

**Postgres**: Free options: [Neon](https://neon.tech) or Vercel Postgres. Use Neon's
**pooled** string (host contains `-pooler`).

**Email**: Get an `SMTP_PASSWORD` from [Resend](https://resend.com) (the API key).
The from-address defaults to `noreply@sayyes.fun`, which must be on a domain
verified in your Resend account — or set `MAIL_FROM` to an address on a domain
you have verified instead.

```bash
npm install
cp .env.example .env   # then paste your DATABASE_URL and SMTP_PASSWORD into .env
npm run db:push        # creates the tables from prisma/schema.prisma
npm run dev            # http://localhost:3000
```

## Deploying to Vercel

The database is not part of the deployment — Vercel runs the app, the Postgres
instance lives on Neon/Vercel Postgres, and `DATABASE_URL` is the only link.

1. Push to GitHub, then import the repo in Vercel.
2. Add `DATABASE_URL` under Settings → Environment Variables (all environments).
3. Deploy. The `build` script runs `prisma generate` before `next build`, which
   Vercel needs since the generated client isn't committed.
4. Run `npm run db:push` once locally against that same database so the tables
   exist.

The invitation link is then a normal public URL, no local server required.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build + type check |
| `npm start` | Serve the production build |
| `npm test` | Vitest unit tests (dodge math, builder validation, i18n detection + dictionaries, mail content) |
| `npm run db:push` | Sync the database with the Prisma schema |

## Routes

Every page route is prefixed with the locale (`/he`, `/ru`, `/en`); the
middleware adds the prefix automatically if a request arrives without one.

| Route | Who | What |
|---|---|---|
| `/{locale}` | creator | Dashboard: every invitation across all locales, each with a locale badge, status, created/answered time, copy link, inline recap for answered ones |
| `/{locale}/new` | creator | Builder: name, mascot (bear/penguin), gate question, questions with 2–4 options each, in `{locale}` → generates the link |
| `/{locale}/invite/[token]` | recipient | Gate screen → one question at a time → confetti finale, in the invitation's own locale (redirects here if `{locale}` doesn't match). Reopening an answered link shows a read-only recap. Unknown token gets a cute "not found" card. |
| `POST /api/invitations` | — | Create an invitation from a builder draft, storing its `locale`. Returns `201` on success or `400 { code: "api.emailFailed" }` if the creation email fails to send (the invitation is deleted and the request is rolled back). |
| `POST /api/invitations/[token]/answers` | — | Submit all answers, mark the invitation `ANSWERED`. Returns `200` on success or `400 { code: "api.emailFailed" }` if the answered email fails to send (answers are deleted and the invitation reverts to `PENDING`, rolled back). |

## Notes

- Running locally, the generated link only resolves while your dev server is up.
  Deployed to Vercel it's a normal public URL.
- No auth: it's a single-user tool, and the dashboard lists **every** invitation
  in the database. Anyone who reaches the deployed `/` sees them all, so treat
  the URL as private. The create-invitation endpoint sends mail to whatever
  address the caller supplies, from the verified `noreply@sayyes.fun` domain —
  so the deployed create-invitation URL must stay private for that reason too,
  not just because of data exposure.
- `DATABASE_URL` is required — the app throws a clear error at startup rather
  than failing on the first query.
- `SMTP_PASSWORD` is required to actually send mail — `src/lib/mail/send.ts`
  throws a clear error the first time `sendMail()` runs if it's missing (not at
  import time, so `npm run build` doesn't need it).
- An invitation can be answered **once**. Reopening it shows her real, first
  answers instead of letting her redo them.
- Invitations can't be edited after they're generated.

## Layout

```
prisma/schema.prisma          Invitation (incl. locale) / Question / QuestionOption / Answer
.env.example                  the DATABASE_URL and SMTP_PASSWORD you need to fill in
src/middleware.ts              locale detection + redirect to /{locale}/...
src/lib/dodge.ts               dodge hop math (pure, unit tested); pleas are dictionary keys
src/lib/validation.ts          builder validation rules (pure, unit tested); returns error codes
src/lib/defaults.ts            locale-aware seed gate question + 3 default questions, limits
src/lib/types.ts               shared Draft / InviteView / Recap / FieldError types
src/lib/i18n/locales.ts        locale list, direction map, resolveLocale(), negotiate()
src/lib/i18n/t.ts              Dictionary type + getDictionary()/t()/format()
src/lib/i18n/dictionaries/     he.ts (source of truth), ru.ts, en.ts
src/lib/mail/                  content.ts (pure {subject,text} builders per locale), send.ts
                               (nodemailer SMTP transport via Resend, needs SMTP_PASSWORD)
src/app/[locale]/              routes: /{locale}, /{locale}/new, /{locale}/invite/[token]
src/app/api/                   /api/invitations, /api/invitations/[token]/answers (no locale prefix)
src/components/                CuteCard, Mascot, HeartButton, DodgeButton,
                               Sparkles, RecapCard, BuilderForm, InviteFlow,
                               DashboardList, LanguageSwitcher
tests/                         Vitest specs for dodge + validation + i18n + mail content
docs/superpowers/plans/        the implementation plans this was built from
docs/superpowers/specs/        the i18n design spec
md.md                          the original design spec (local-only, Hebrew-only — superseded)
```
