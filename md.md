# Date Invitation Website — Design Spec

**Date:** 2026-07-26
**Status:** Approved (pending final spec review)

## Purpose

A personal, single-user Hebrew-only website for creating cute, interactive
"will you go on a date with me?" invitations. The creator builds an
invitation (recipient name, mascot, gate question, a set of multiple-choice
logistics questions), generates a shareable link, and sends it to the
recipient. She opens the link, must say "yes" to a gate question (the "no"
button dodges the cursor), answers the logistics questions, and finishes on
a celebratory recap screen. The creator can see her answers on a dashboard.

## Inspiration

Modeled loosely on [svidos.ru](https://svidos.ru/), verified live via a
Playwright probe (WebFetch alone couldn't see the interactive/JS behavior):

- Mascot (a bunny on svidos) sits inside a rounded, phone-mockup-style card:
  gradient image panel on top, white panel below with the question + buttons.
- The "yes" button is heart-shaped; the "no" button is a plain outlined pill.
- Confirmed via bounding-box probe: hovering the "no" button makes it jump a
  short distance (~20-50px) to a new nearby spot each time — a small dodge,
  not a full-screen chase.
- The mascot has a reaction animation (waving, heart popping up) tied to that
  hover moment.

These elements carry over directly into this design (see Visual System).

## Scope decisions (from brainstorming)

- **Single-user, no auth.** This is a personal tool; the dashboard just lists
  every invitation created on this machine.
- **Local backend + DB**, not a serverless/URL-encoded scheme — links stay
  short, and the creator can see her answers recorded server-side.
- **Hebrew only, RTL** throughout (`lang="he" dir="rtl"`).
- **Multiple-choice only** for question answers (2-4 options each) — no free
  text, no date/time picker.
- **Gate question is first**, not last: she must tap "yes" before the
  logistics questions ever appear.
- **Mascot is bear or penguin, chosen per invitation** by the creator (not
  fixed, not the svidos bunny — kept distinct from the reference).
- **Dodge behavior**: small nearby jumps on hover/approach, matching the
  svidos feel — not an escalating full-screen chase, and not a "give up after
  N tries" mechanic.
- **Finale**: confetti + thank-you message + a recap card of everything she
  picked.
- **"Start locally" only** for now — no deployment/hosting concerns in this
  spec. The generated link only resolves while the creator's local dev server
  is running.

## Architecture

- **Next.js (App Router, TypeScript)** — one app, UI + API routes together,
  no separate backend process.
- **SQLite via Prisma** — file-based DB, zero setup, fits local-only scope.
- **Tailwind CSS** — custom pink theme, rounded/cute utility classes.
- **Framer Motion** — mascot reactions, dodge-button movement.
- **canvas-confetti** — finale burst.

## Data model

```
Invitation
  id            String  @id  // used as the URL token
  recipientName String
  mascot        Mascot       // BEAR | PENGUIN
  gateQuestion  String       // editable, defaults to a template
  status        Status       // PENDING | ANSWERED
  createdAt     DateTime
  answeredAt    DateTime?

Question
  id            String @id
  invitationId  String   // FK -> Invitation
  order         Int
  text          String

QuestionOption
  id            String @id
  questionId    String   // FK -> Question
  label         String
  order         Int

Answer
  id                String @id
  invitationId      String   // FK -> Invitation
  questionId        String   // FK -> Question
  selectedOptionId  String   // FK -> QuestionOption
  createdAt         DateTime
```

One `Invitation` has many `Question`s, each with 2-4 `QuestionOption`s. Once
she submits, one `Answer` row is written per question.

## Creator flow

1. **Dashboard** (`/`) — lists all invitations: recipient name, status
   (pending/answered), created date. "+ New Invitation" button. Clicking an
   answered invitation shows her recap inline (reusing the recipient-side
   recap component).
2. **Builder** (`/new`):
   - Recipient name (required).
   - Mascot picker: bear or penguin.
   - Gate question text — editable, defaults to `?תרצי לצאת איתי לדייט`
     ("will you go on a date with me?").
   - Question list — 3 defaults pre-loaded (what to eat / where to go /
     when), each with suggested options the creator can edit; "add question"
     lets them add more (text + 2-4 options); questions can be reordered or
     removed. Validation: recipient name required, mascot must be selected
     (no default — creator must actively pick bear or penguin), every
     question needs 2-4 non-empty options, blocks Generate otherwise (inline
     pink error text).
   - **Generate** button saves everything and shows the shareable link with
     a copy button, plus a note that it only works while the local server is
     running.

## Recipient flow (`/invite/[token]`)

1. **Gate screen** — chosen mascot in a rounded gradient card, speech bubble
   with the gate question, heart-shaped "כן" (yes) button, dodging "לא" (no)
   button. Tapping "כן" advances; "לא" cannot be caught.
2. **Question cards** — one question at a time, full-width multiple-choice
   buttons, progress dots at the top, mascot reacting to each pick. Tapping
   an option auto-advances to the next question — no back button, keeping
   the flow simple and final.
3. **Finale** — confetti burst, thank-you message, mascot celebrating, and a
   recap card listing every question alongside her chosen answer. Marks the
   invitation `ANSWERED` with a timestamp.

## Edge cases

- **Reopening an answered link** shows the recap (read-only) instead of
  letting her answer again — preserves her first, real response.
- **Unknown/invalid token** shows a cute "this invitation doesn't exist"
  screen rather than a raw 404.
- **Incomplete builder state** blocks Generate with inline validation
  (missing name, no mascot selected, question with <2 options).

## Visual system

- RTL Hebrew throughout; rounded corners everywhere; soft pink palette
  (background ~`#FFF0F5`, card gradient ~`#E84A7F` → `#FF6BA0`).
- Card shape mirrors the svidos reference: gradient image panel on top,
  white panel below for text/buttons.
- Sparkle/flower/heart accents scattered around cards (decorative, not
  interactive).
- Mascot (bear or penguin) reacts with small animations (blush, wave, heart
  pop) tied to key moments — hovering "לא", picking an answer, the finale.

## Testing

Personal single-user app — kept light on purpose:
- Manual click-through in the browser for the full creator + recipient flow
  (golden path and edge cases above), actually run rather than assumed.
- A couple of small unit tests: dodge-button repositioning logic, and
  builder validation rules.
- No e2e suite, no auth/security testing needed given the single-user local
  scope.

## Out of scope (for this spec)

- Deployment/hosting, sharing the link outside the local machine.
- Multi-user accounts or authentication.
- Editing an invitation after it's been generated.
- Any question type beyond multiple choice.
