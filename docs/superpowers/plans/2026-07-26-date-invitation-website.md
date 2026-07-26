# Date Invitation Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, single-user, Hebrew-RTL Next.js app where the creator builds a "will you go on a date with me?" invitation, shares a link, and the recipient answers through a gate question (with a dodging "no" button) plus multiple-choice logistics questions ending in a confetti finale.

**Architecture:** One Next.js App Router app holds both UI and API routes. Prisma + SQLite persists invitations, questions, options and answers. Pure logic (dodge repositioning, builder validation) lives in `src/lib/*` so it is unit-testable without React. Recipient and creator screens share the same card shell, mascot and recap components.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Prisma + SQLite, Tailwind CSS v4, Framer Motion, canvas-confetti, Vitest.

## Global Constraints

- Hebrew only, RTL everywhere: `<html lang="he" dir="rtl">`. No English user-facing copy.
- Single user, no auth. Dashboard lists every invitation in the local DB.
- Answers are multiple choice only, 2–4 options per question. No free text, no date picker.
- Gate question comes first; logistics questions only render after "כן".
- Mascot enum is exactly `BEAR | PENGUIN`; no default — creator must pick.
- Dodge is a small nearby jump of 20–50px on hover, not a full-screen chase, never "gives up".
- Invitation status enum is exactly `PENDING | ANSWERED`.
- Palette: page background `#FFF0F5`, card gradient `#E84A7F` → `#FF6BA0`.
- Reopening an answered link is read-only recap. Unknown token gets a cute screen, not a raw 404.
- Local only: no deployment, no hosting, no auth/security work.

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs` | Project + build config |
| `vitest.config.ts` | Unit test runner for `src/lib` only |
| `prisma/schema.prisma` | Invitation / Question / QuestionOption / Answer models |
| `src/lib/prisma.ts` | Singleton PrismaClient (dev-safe) |
| `src/lib/types.ts` | Shared TS types for draft + invitation payloads |
| `src/lib/dodge.ts` | Pure dodge-offset math (unit tested) |
| `src/lib/validation.ts` | Builder validation rules, Hebrew messages (unit tested) |
| `src/lib/defaults.ts` | Default gate question + 3 default questions with options |
| `src/app/globals.css` | Tailwind import, `@theme` pink tokens, Hebrew font |
| `src/app/layout.tsx` | RTL html shell |
| `src/app/page.tsx` | Dashboard (server) |
| `src/app/new/page.tsx` | Builder route wrapper |
| `src/app/invite/[token]/page.tsx` | Recipient route: loads invitation, branches recap vs flow |
| `src/app/api/invitations/route.ts` | `POST` create invitation |
| `src/app/api/invitations/[token]/answers/route.ts` | `POST` submit answers |
| `src/components/CuteCard.tsx` | Gradient-top / white-bottom card shell |
| `src/components/Sparkles.tsx` | Decorative hearts/sparkles/flowers |
| `src/components/Mascot.tsx` | Bear + penguin SVG with mood prop |
| `src/components/HeartButton.tsx` | Heart-shaped "כן" button |
| `src/components/DodgeButton.tsx` | "לא" button using `src/lib/dodge.ts` |
| `src/components/RecapCard.tsx` | Question → chosen answer list (shared) |
| `src/components/BuilderForm.tsx` | Client builder form + validation + generate |
| `src/components/InviteFlow.tsx` | Client state machine: gate → questions → finale |
| `src/components/DashboardList.tsx` | Client list with expandable recap |
| `tests/dodge.test.ts`, `tests/validation.test.ts` | Unit tests |

---

### Task 1: Project scaffold, Tailwind theme, RTL shell

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `.gitignore`
- Create: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx` (placeholder)
- Create: `vitest.config.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm run dev` serves an RTL Hebrew page on the pink background; `npm test` runs Vitest against `tests/**`.

- [ ] **Step 1: Install dependencies**

```bash
npm init -y
npm i next@15 react react-dom @prisma/client framer-motion canvas-confetti
npm i -D typescript @types/react @types/node @types/canvas-confetti prisma tailwindcss @tailwindcss/postcss postcss vitest
```

- [ ] **Step 2: Scripts in `package.json`**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "db:push": "prisma db push"
  }
}
```

- [ ] **Step 3: Tailwind theme in `src/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-blush: #FFF0F5;
  --color-rose-deep: #E84A7F;
  --color-rose-soft: #FF6BA0;
}
```

- [ ] **Step 4: RTL shell in `src/app/layout.tsx`**

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-blush">{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npm run build`
Expected: build succeeds, no type errors.

- [ ] **Step 6: Commit** — `chore: scaffold next app with rtl pink shell`

---

### Task 2: Prisma schema + client singleton

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/prisma.ts`

**Interfaces:**
- Produces: `prisma` export (PrismaClient singleton); models `Invitation`, `Question`, `QuestionOption`, `Answer`; enums `Mascot { BEAR PENGUIN }`, `Status { PENDING ANSWERED }`.

- [ ] **Step 1: Write `prisma/schema.prisma`** exactly matching the spec data model, with cascade deletes from `Invitation` and `@@unique([invitationId, questionId])` on `Answer` so a question cannot be answered twice.

- [ ] **Step 2: Push schema**

Run: `npx prisma db push && npx prisma generate`
Expected: `dev.db` created, client generated.

- [ ] **Step 3: `src/lib/prisma.ts`**

```ts
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
```

- [ ] **Step 4: Commit** — `feat: add prisma schema for invitations and answers`

---

### Task 3: Dodge logic (TDD)

**Files:**
- Create: `src/lib/dodge.ts`, `tests/dodge.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Offset = { x: number; y: number };
  export const MIN_HOP = 20;
  export const MAX_HOP = 50;
  export function nextDodgeOffset(
    current: Offset,
    limit: { x: number; y: number },
    rand?: () => number
  ): Offset;
  ```

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { MAX_HOP, MIN_HOP, nextDodgeOffset } from "../src/lib/dodge";

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

describe("nextDodgeOffset", () => {
  it("hops between 20 and 50 px from the current spot", () => {
    let cur = { x: 0, y: 0 };
    for (let i = 0; i < 200; i++) {
      const next = nextDodgeOffset(cur, { x: 500, y: 500 }, () => (i % 100) / 100);
      expect(dist(cur, next)).toBeGreaterThanOrEqual(MIN_HOP - 0.001);
      expect(dist(cur, next)).toBeLessThanOrEqual(MAX_HOP + 0.001);
      cur = next;
    }
  });

  it("never leaves the allowed box", () => {
    let cur = { x: 0, y: 0 };
    for (let i = 0; i < 500; i++) {
      cur = nextDodgeOffset(cur, { x: 60, y: 30 }, () => (i * 0.37) % 1);
      expect(Math.abs(cur.x)).toBeLessThanOrEqual(60);
      expect(Math.abs(cur.y)).toBeLessThanOrEqual(30);
    }
  });

  it("always moves (no zero hop)", () => {
    const cur = { x: 0, y: 0 };
    expect(dist(cur, nextDodgeOffset(cur, { x: 100, y: 100 }, () => 0))).toBeGreaterThan(0);
  });

  it("is deterministic for a fixed rand", () => {
    const a = nextDodgeOffset({ x: 5, y: 5 }, { x: 100, y: 100 }, () => 0.25);
    const b = nextDodgeOffset({ x: 5, y: 5 }, { x: 100, y: 100 }, () => 0.25);
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Run tests, confirm they fail** — `npm test` → cannot resolve `../src/lib/dodge`.

- [ ] **Step 3: Implement** — pick angle from `rand()`, hop distance `MIN_HOP + rand()*(MAX_HOP-MIN_HOP)`, reflect the angle when the candidate leaves the box, then clamp; if clamping killed the movement, fall back to hopping toward the box centre so the hop is never zero.

- [ ] **Step 4: Run tests, confirm pass** — `npm test`.

- [ ] **Step 5: Commit** — `feat: add dodge offset math with tests`

---

### Task 4: Builder validation (TDD) + defaults

**Files:**
- Create: `src/lib/types.ts`, `src/lib/validation.ts`, `src/lib/defaults.ts`, `tests/validation.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type MascotKind = "BEAR" | "PENGUIN";
  export type DraftQuestion = { id: string; text: string; options: string[] };
  export type Draft = {
    recipientName: string;
    mascot: MascotKind | null;
    gateQuestion: string;
    questions: DraftQuestion[];
  };
  export type DraftErrors = {
    recipientName?: string;
    mascot?: string;
    gateQuestion?: string;
    questions?: string;
    byQuestion: Record<string, { text?: string; options?: string }>;
  };
  export function validateDraft(draft: Draft): { valid: boolean; errors: DraftErrors };
  export const DEFAULT_GATE_QUESTION: string;
  export function defaultQuestions(): DraftQuestion[];
  ```

- [ ] **Step 1: Write failing tests** covering: valid draft passes; blank/whitespace name fails; `mascot: null` fails; blank gate question fails; question with 1 option fails; question with 5 options fails; blank option label fails; duplicate option labels in one question fail; zero questions fails; error keys are per-question id.

- [ ] **Step 2: Run tests, confirm fail.**

- [ ] **Step 3: Implement `validateDraft`** with Hebrew messages (e.g. `"חסר שם"`, `"צריך לבחור קמע"`, `"צריך בין 2 ל-4 תשובות"`).

- [ ] **Step 4: Run tests, confirm pass.**

- [ ] **Step 5: Commit** — `feat: add builder validation with tests`

---

### Task 5: Visual system components

**Files:**
- Create: `src/components/CuteCard.tsx`, `src/components/Sparkles.tsx`, `src/components/Mascot.tsx`, `src/components/HeartButton.tsx`

**Interfaces:**
- Produces:
  ```tsx
  <CuteCard top={ReactNode} children={ReactNode} />           // gradient panel + white panel
  <Sparkles />                                                 // absolute decorative layer
  <Mascot kind={MascotKind} mood="idle"|"blush"|"wave"|"cheer" size?={number} />
  <HeartButton onClick={() => void} label={string} />
  ```

- [ ] **Step 1: `CuteCard`** — `rounded-[2.5rem]`, gradient `from-rose-deep to-rose-soft` top panel, white bottom panel, soft shadow, max-width phone-mockup feel.
- [ ] **Step 2: `Mascot`** — inline SVG bear and penguin; mood drives Framer Motion animation (idle bob, blush circles, waving arm, cheer jump + heart pop).
- [ ] **Step 3: `HeartButton`** — CSS heart shape (two rounded pseudo-squares rotated 45°) with the label centred, spring press animation.
- [ ] **Step 4: `Sparkles`** — non-interactive (`pointer-events-none`) hearts/flowers/sparkles scattered with staggered float animation.
- [ ] **Step 5: Verify** — `npm run build` succeeds.
- [ ] **Step 6: Commit** — `feat: add cute card, mascots, heart button, sparkles`

---

### Task 6: API routes

**Files:**
- Create: `src/app/api/invitations/route.ts`, `src/app/api/invitations/[token]/answers/route.ts`

**Interfaces:**
- Produces:
  - `POST /api/invitations` body `Draft` → `{ id, url }` (400 with `DraftErrors` when invalid — server re-runs `validateDraft`).
  - `POST /api/invitations/[token]/answers` body `{ answers: { questionId, selectedOptionId }[] }` → `{ ok: true }`; 404 unknown token; 409 when already `ANSWERED`. Writes all answers plus `status: ANSWERED` and `answeredAt` in one `prisma.$transaction`.

- [ ] **Step 1: Implement create route** — validate, then nested-create invitation + questions + options; return `{ id }`.
- [ ] **Step 2: Implement answers route** — verify every `questionId` belongs to the invitation and every `selectedOptionId` belongs to its question before writing; reject otherwise with 400.
- [ ] **Step 3: Verify manually** with a `curl`/`Invoke-RestMethod` round trip against `npm run dev`.
- [ ] **Step 4: Commit** — `feat: add invitation and answer api routes`

---

### Task 7: Builder page

**Files:**
- Create: `src/components/BuilderForm.tsx`, `src/app/new/page.tsx`

**Interfaces:**
- Consumes: `validateDraft`, `defaultQuestions`, `DEFAULT_GATE_QUESTION`, `Mascot`, `CuteCard`, `POST /api/invitations`.
- Produces: `/new` renders the builder; on success shows the shareable link + copy button + the "works only while the local server runs" note.

- [ ] **Step 1: Form state** — name, mascot (`null` initially), gate question prefilled with `DEFAULT_GATE_QUESTION`, questions from `defaultQuestions()`.
- [ ] **Step 2: Question editor** — edit text, edit/add/remove options (2–4 guard in UI), move question up/down, remove question, "הוספת שאלה" adds a blank question with 2 empty options.
- [ ] **Step 3: Validation on submit** — render inline pink error text from `DraftErrors`; block the request when invalid.
- [ ] **Step 4: Success panel** — `${window.location.origin}/invite/${id}`, copy button with "הועתק!" feedback.
- [ ] **Step 5: Verify manually** — build an invitation in the browser, confirm errors appear for empty name / no mascot / 1 option, then a link is produced.
- [ ] **Step 6: Commit** — `feat: add invitation builder page`

---

### Task 8: Recipient flow

**Files:**
- Create: `src/components/DodgeButton.tsx`, `src/components/RecapCard.tsx`, `src/components/InviteFlow.tsx`, `src/app/invite/[token]/page.tsx`

**Interfaces:**
- Consumes: `nextDodgeOffset`, `Mascot`, `CuteCard`, `HeartButton`, `POST /api/invitations/[token]/answers`.
- Produces: `<RecapCard items={{ question: string; answer: string }[]} recipientName={string} />` reused by the dashboard.

- [ ] **Step 1: `DodgeButton`** — on `mouseEnter`/`pointerMove`/`focus` compute the next offset via `nextDodgeOffset` and animate with Framer Motion; report each dodge upward so the mascot can blush.
- [ ] **Step 2: `InviteFlow` state machine** — `gate` → `questions` (one at a time, progress dots, tap auto-advances, no back) → `finale`; submit all answers when the last question is picked.
- [ ] **Step 3: Finale** — `canvas-confetti` burst on mount (dynamic import, client only), thank-you text, cheering mascot, `RecapCard`.
- [ ] **Step 4: Route page** (Next 15 — `params` is a Promise, must `await`) — unknown token renders the cute "ההזמנה לא נמצאה" screen; `ANSWERED` renders read-only recap; otherwise renders `InviteFlow`.
- [ ] **Step 5: Verify manually** — full click-through, then reload the same link and confirm read-only recap; hit a garbage token and confirm the cute screen.
- [ ] **Step 6: Commit** — `feat: add recipient invite flow with dodging no button`

---

### Task 9: Dashboard

**Files:**
- Create: `src/components/DashboardList.tsx`
- Modify: `src/app/page.tsx` (replace Task 1 placeholder)

**Interfaces:**
- Consumes: `prisma`, `RecapCard`.
- Produces: `/` lists invitations (name, status badge, created date, link copy), expanding an `ANSWERED` one shows its recap inline; "+ הזמנה חדשה" links to `/new`. Empty state when there are none.

- [ ] **Step 1: Server query** — invitations ordered `createdAt desc`, including questions/options/answers, mapped into `RecapCard` items.
- [ ] **Step 2: Client list** — expand/collapse per invitation, `export const dynamic = "force-dynamic"` so newly created invitations always show.
- [ ] **Step 3: Verify manually** — create two invitations, answer one, confirm the dashboard shows both with correct statuses and recap.
- [ ] **Step 4: Commit** — `feat: add creator dashboard`

---

### Task 10: Final pass — manual golden path, README, CLAUDE.md

**Files:**
- Create: `README.md`, `CLAUDE.md`

- [ ] **Step 1: Run `npm test`** — all unit tests pass.
- [ ] **Step 2: Run `npm run build`** — clean.
- [ ] **Step 3: Manual golden path** in the browser: dashboard → builder → link → gate (try to catch "לא") → questions → finale → reload link → dashboard recap.
- [ ] **Step 4: Write `README.md`** — what it is, setup (`npm i`, `npm run db:push`, `npm run dev`), routes, the local-only link caveat.
- [ ] **Step 5: Write `CLAUDE.md`** — architecture map, where pure logic lives, conventions (Hebrew RTL copy, palette tokens), test commands.
- [ ] **Step 6: Commit** — `docs: add readme and project notes`

---

## Self-Review

**Spec coverage:** Purpose → Tasks 7–9. Data model → Task 2. Creator flow → Tasks 7, 9. Recipient flow → Task 8. Edge cases → Task 6 (409/404/400) + Task 8 Step 4 + Task 7 Step 3. Visual system → Tasks 1, 5. Testing → Tasks 3, 4 (unit) + Task 10 (manual). Out of scope items are absent by design.

**Type consistency:** `MascotKind` (`"BEAR" | "PENGUIN"`) is used in `types.ts`, `Mascot`, `Draft`, and matches the Prisma `Mascot` enum. `Draft`/`DraftErrors` are the single shape passed between `BuilderForm`, `validateDraft`, and the create route. `Offset` and `nextDodgeOffset` are used only by `DodgeButton`. `RecapCard` takes the same `{ question, answer }[]` in both the recipient finale and the dashboard.
