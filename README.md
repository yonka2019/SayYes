# SayYes · תגידי כן

A personal, single-user, Hebrew-only (RTL) website for making cute interactive
"will you go on a date with me?" invitations.

You build an invitation (recipient name, mascot, gate question, multiple-choice
logistics questions), get a shareable link, and send it. She opens it, has to
say **כן** to the gate question, answers the logistics questions, and lands on a
confetti finale with a recap of everything she picked. Her answers show up on
your dashboard.

The **לא** button doesn't cooperate: it bolts away from the cursor before it can
be hovered, and any click that does land shrinks it and adds an escalating
Hebrew plea (`בבקשה 🥺` → `אנא ממך 🥺💔`). It shrinks to a floor rather than
disappearing, so it never becomes un-clickable-by-vanishing — just increasingly
hopeless. On phones there's no hover, so each tap is a catch that shrinks it.

Loosely modeled on [svidos.ru](https://svidos.ru/): phone-mockup card with a
rose gradient panel on top, heart-shaped yes button, small-hop dodging no
button, and a mascot that reacts at the key moments.

## Stack

| Piece | Choice |
|---|---|
| App | Next.js 15 (App Router, TypeScript) — UI + API routes in one process |
| DB | SQLite via Prisma (`prisma/dev.db`) |
| Styling | Tailwind CSS v4, custom pink theme in `src/app/globals.css` |
| Animation | Framer Motion (mascots, dodge button, transitions) |
| Finale | canvas-confetti |
| Tests | Vitest over the pure logic in `src/lib` |

## Setup

```bash
npm install
npm run db:push      # creates prisma/dev.db from prisma/schema.prisma
npm run dev          # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build + type check |
| `npm start` | Serve the production build |
| `npm test` | Vitest unit tests (dodge math, builder validation) |
| `npm run db:push` | Sync the SQLite file with the Prisma schema |

## Routes

| Route | Who | What |
|---|---|---|
| `/` | creator | Dashboard: every invitation, status, created/answered time, copy link, inline recap for answered ones |
| `/new` | creator | Builder: name, mascot (bear/penguin), gate question, questions with 2–4 options each → generates the link |
| `/invite/[token]` | recipient | Gate screen → one question at a time → confetti finale. Reopening an answered link shows a read-only recap. Unknown token gets a cute "not found" card. |
| `POST /api/invitations` | — | Create an invitation from a builder draft |
| `POST /api/invitations/[token]/answers` | — | Submit all answers, mark the invitation `ANSWERED` |

## Notes

- **The generated link only works while your local dev server is running** —
  there is no hosting in this project.
- No auth: it's a single-user tool, and the dashboard lists every invitation in
  the local database.
- An invitation can be answered **once**. Reopening it shows her real, first
  answers instead of letting her redo them.
- Invitations can't be edited after they're generated.

## Layout

```
prisma/schema.prisma          Invitation / Question / QuestionOption / Answer
src/lib/dodge.ts              dodge hop math (pure, unit tested)
src/lib/validation.ts         builder validation rules (pure, unit tested)
src/lib/defaults.ts           default gate question + 3 default questions, limits
src/lib/types.ts              shared Draft / InviteView / Recap types
src/app/                      routes: /, /new, /invite/[token], /api/*
src/components/               CuteCard, Mascot, HeartButton, DodgeButton,
                              Sparkles, RecapCard, BuilderForm, InviteFlow,
                              DashboardList
tests/                        Vitest specs for dodge + validation
docs/superpowers/plans/       the implementation plan this was built from
md.md                         the original design spec
```
