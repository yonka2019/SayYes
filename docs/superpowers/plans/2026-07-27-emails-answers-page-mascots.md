# HTML Emails, Answers Page, Language Pills & Six Mascots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two plain-text notification emails with designed HTML, send the answered email to a new per-invitation answers page, show all three languages as pills instead of a cycling button, add four more characters, and fix the `cheer` heart that currently clips and lands on the character's head.

**Architecture:** Everything with a rule stays in `src/lib/` as pure, unit-tested functions — the email HTML is built by string helpers in a new `src/lib/mail/layout.ts`, and the six characters are enumerated once in a new `src/lib/mascots.ts` registry that replaces a two-value ternary currently duplicated across three components. The answers page is a new server component under `src/app/[locale]/answers/[token]/` following the invite page's existing shape (Prisma query → locale-ownership redirect → `CuteCard`). The mascot SVG shell gains empty headroom above the character so the hearts have somewhere to rise.

**Tech Stack:** Next.js 15 App Router, React 19, Prisma 6 + Postgres, Tailwind 4, framer-motion 11, nodemailer 9 (Resend SMTP), Vitest 2.

**Spec:** `docs/superpowers/specs/2026-07-27-emails-answers-page-mascots-design.md`

## Global Constraints

- **Three locales: `he`, `ru`, `en`.** Every user-facing string resolves through `src/lib/i18n/`. Never put a literal in a component or route.
- **`he.ts` is the source-of-truth dictionary.** `ru.ts` and `en.ts` are typed `: Dictionary`, so any key added to `he.ts` without a translation in the other two is a **build error**. Always add all three.
- **`tests/i18n.test.ts` asserts identical key sets AND identical `{placeholder}` sets per key** across the three dictionaries. A key with `{name}` in `he.ts` must have `{name}` in `ru.ts` and `en.ts`.
- **Creator content is never translated.** `recipientName`, `gateQuestion`, question texts and option labels are stored verbatim.
- **Direction is per locale**: `DIR` in `src/lib/i18n/locales.ts` — `he` → `rtl`, `ru`/`en` → `ltr`. Check both directions after any layout change.
- **Prefer logical Tailwind properties** (`ms-`, `me-`, `ps-`, `pe-`) over physical (`ml-`, `mr-`).
- **`src/lib/` has no locale.** Pure logic returns keys or codes, never sentences — except `src/lib/mail/` and `src/lib/defaults.ts`, which take a `locale` argument and call `getDictionary()` themselves.
- **Theme tokens only, no raw hex, in components**: `blush` `#fff0f5`, `blush-deep` `#ffe1ec`, `rose-deep` `#e84a7f`, `rose-soft` `#ff6ba0`, `rose-ink` `#8a2c4d`. Email HTML is the exception — mail clients need literal inline hex.
- **Phone width 390px is the primary viewport.** After any layout change, verify `document.body.scrollWidth <= window.innerWidth`.
- **Next 15: route `params` is a `Promise` — always `await` it.**
- **`npm run build` must succeed with no `SMTP_PASSWORD`.** The mail transport is created lazily inside `sendMail()`, never at module import. Do not move that check to the top level.
- **Never commit or push without an explicit request from the user.** Each task below ends with a commit step; run those, but do not push.
- **Screenshots go to the scratchpad**, never the repo root: `C:\Users\yonka\AppData\Local\Temp\claude\C--Code-SayYes\a875d992-94fc-4e91-8fb8-56df3b8dc068\scratchpad`
- Verification commands: `npm test` (Vitest), `npm run build` (type check), `npm run dev` (manual), `npm run db:push` (schema).

## File Structure

**Created:**
| File | Responsibility |
|---|---|
| `src/lib/mascots.ts` | The one registry of characters: kinds, name keys, emoji. |
| `src/components/mascots/motion.ts` | Shared mood keyframe tables + the part props type. |
| `src/components/mascots/Bear.tsx` | Bear artwork only. |
| `src/components/mascots/Penguin.tsx` | Penguin artwork only. |
| `src/components/mascots/Bunny.tsx` | Bunny artwork only. |
| `src/components/mascots/Cat.tsx` | Cat artwork only. |
| `src/components/mascots/Fox.tsx` | Fox artwork only. |
| `src/components/mascots/Panda.tsx` | Panda artwork only. |
| `src/lib/mail/layout.ts` | Email HTML primitives: escaping, shell, button, recap table, footer. |
| `src/app/[locale]/answers/[token]/page.tsx` | Creator-facing answers page. |
| `tests/mascots.test.ts` | Registry exhaustiveness over `MascotKind`. |
| `tests/mail-layout.test.ts` | Escaping and HTML primitive behaviour. |

**Modified:**
| File | Change |
|---|---|
| `prisma/schema.prisma` | `Mascot` enum gains four values. |
| `src/lib/types.ts` | `MascotKind` union widens. |
| `src/components/Mascot.tsx` | SVG shell only: headroom viewBox, fixed hearts, record lookup. |
| `src/components/BuilderForm.tsx` | Use the registry; 3-column picker. |
| `src/components/DashboardList.tsx` | Use the registry. |
| `src/components/LanguageSwitcher.tsx` | Rewritten as pills. |
| `src/app/[locale]/invite/[token]/page.tsx` | Use the registry. |
| `src/app/api/invitations/route.ts` | Use the registry; pass `mascot` to the email. |
| `src/app/api/invitations/[token]/answers/route.ts` | Link to the answers page; pass `mascot` + `recap`. |
| `src/lib/mail/content.ts` | Return `html`; take `mascot` and `recap`. |
| `src/lib/mail/send.ts` | Accept and send `html`. |
| `src/lib/i18n/dictionaries/{he,ru,en}.ts` | New mascot, answers-page and email keys. |
| `tests/mail-content.test.ts` | Cover `html` and the recap. |
| `CLAUDE.md`, `README.md` | Document all of it. |

---

### Task 1: Mascot registry

Create the single source of truth for characters and delete the duplicated two-value ternary from three components. No new characters yet — this task leaves behaviour identical and the build green.

**Files:**
- Create: `src/lib/mascots.ts`
- Create: `tests/mascots.test.ts`
- Modify: `src/components/BuilderForm.tsx:25-28` (local `MASCOT_KINDS` + `mascotKey`)
- Modify: `src/components/DashboardList.tsx:24-25` (`mascotKey`)
- Modify: `src/app/[locale]/invite/[token]/page.tsx:14-15` (`mascotKey`)
- Modify: `src/app/api/invitations/route.ts:10` (local `MASCOTS`)

**Interfaces:**
- Consumes: `MascotKind` from `src/lib/types.ts`, `MessageKey` from `src/lib/i18n/t.ts`.
- Produces: `MASCOT_KINDS: readonly MascotKind[]`, `MASCOT_NAME_KEY: Record<MascotKind, MessageKey>`, `MASCOT_EMOJI: Record<MascotKind, string>`. Task 3 adds four entries to each. Tasks 5 and 7 consume `MASCOT_NAME_KEY` and `MASCOT_EMOJI`.

- [ ] **Step 1: Write the failing test**

Create `tests/mascots.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MASCOT_EMOJI, MASCOT_KINDS, MASCOT_NAME_KEY } from "@/lib/mascots";
import { getDictionary } from "@/lib/i18n/t";
import { LOCALES } from "@/lib/i18n/locales";

describe("mascot registry", () => {
  it("gives every kind a name key and an emoji", () => {
    for (const kind of MASCOT_KINDS) {
      expect(MASCOT_NAME_KEY[kind]).toBeTruthy();
      expect(MASCOT_EMOJI[kind]).toBeTruthy();
    }
  });

  it("has no entries beyond MASCOT_KINDS", () => {
    // Guards the reverse direction: a key map that drifts ahead of the list.
    expect(Object.keys(MASCOT_NAME_KEY).sort()).toEqual([...MASCOT_KINDS].sort());
    expect(Object.keys(MASCOT_EMOJI).sort()).toEqual([...MASCOT_KINDS].sort());
  });

  it("resolves every name key to a real string in every locale", () => {
    for (const locale of LOCALES) {
      const dict = getDictionary(locale);
      for (const kind of MASCOT_KINDS) {
        expect(dict[MASCOT_NAME_KEY[kind]]).toBeTruthy();
      }
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/mascots.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/mascots"`.

- [ ] **Step 3: Write the registry**

Create `src/lib/mascots.ts`:

```ts
import type { MessageKey } from "./i18n/t";
import type { MascotKind } from "./types";

/**
 * The one place characters are enumerated. Everything that needs to list them,
 * name them or draw them reads from here, so adding a character is one edit
 * plus one artwork file — not a hunt through components for a ternary.
 *
 * Order is the builder's display order.
 */
export const MASCOT_KINDS: readonly MascotKind[] = ["BEAR", "PENGUIN"];

/** Accessible names live in the dictionaries — `src/lib/` has no locale. */
export const MASCOT_NAME_KEY: Record<MascotKind, MessageKey> = {
  BEAR: "mascot.bear",
  PENGUIN: "mascot.penguin",
};

/**
 * Stand-ins for the SVG characters in the notification emails. Inline SVG is
 * stripped by Gmail and unsupported by Outlook, so an emoji is the only thing
 * that reliably renders the character in an inbox.
 */
export const MASCOT_EMOJI: Record<MascotKind, string> = {
  BEAR: "🐻",
  PENGUIN: "🐧",
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/mascots.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Replace the duplicated ternary in `BuilderForm.tsx`**

Delete lines 25-28:

```tsx
const MASCOT_KINDS: MascotKind[] = ["BEAR", "PENGUIN"];

const mascotKey = (kind: MascotKind): MessageKey =>
  kind === "BEAR" ? "mascot.bear" : "mascot.penguin";
```

Add to the imports:

```tsx
import { MASCOT_KINDS, MASCOT_NAME_KEY } from "@/lib/mascots";
```

Then replace the two usages — at what was line 189:

```tsx
<Mascot kind={chosen} mood="cheer" size={150} label={t(dict, MASCOT_NAME_KEY[chosen])} />
```

and at what was line 270:

```tsx
const name = t(dict, MASCOT_NAME_KEY[kind]);
```

If `MascotKind` or `MessageKey` are now unused in that file's imports, remove them — an unused import fails the build's lint step.

- [ ] **Step 6: Replace the ternary in `DashboardList.tsx`**

Delete lines 24-25:

```tsx
const mascotKey = (kind: MascotKind): MessageKey =>
  kind === "BEAR" ? "mascot.bear" : "mascot.penguin";
```

Add the import:

```tsx
import { MASCOT_NAME_KEY } from "@/lib/mascots";
```

Replace the usage at what was line 117:

```tsx
label={t(dict, MASCOT_NAME_KEY[item.mascot])}
```

Remove `MessageKey` from the `@/lib/i18n/t` import if nothing else in the file uses it.

- [ ] **Step 7: Replace the ternary in the invite page**

In `src/app/[locale]/invite/[token]/page.tsx`, delete lines 14-15 and add the import:

```tsx
import { MASCOT_NAME_KEY } from "@/lib/mascots";
```

Replace the usage at what was line 137:

```tsx
top={<Mascot kind={mascot} mood="cheer" size={180} label={t(dict, MASCOT_NAME_KEY[mascot])} />}
```

Leave the hardcoded `<Mascot kind="PENGUIN" … label={t(dict, "mascot.penguin")} />` in `MissingInvitation` alone — it is a fixed illustration, not a lookup.

- [ ] **Step 8: Use the registry in the create API**

In `src/app/api/invitations/route.ts`, delete line 10:

```ts
const MASCOTS: MascotKind[] = ["BEAR", "PENGUIN"];
```

Add the import:

```ts
import { MASCOT_KINDS } from "@/lib/mascots";
```

Replace the check on what was line 23:

```ts
if (raw.mascot !== null && !MASCOT_KINDS.includes(raw.mascot as MascotKind)) return null;
```

- [ ] **Step 9: Verify the whole suite and the build**

Run: `npm test`
Expected: PASS — 5 suites, 81 tests (78 existing + 3 new).

Run: `npm run build`
Expected: succeeds with no type errors.

- [ ] **Step 10: Commit**

```bash
git add src/lib/mascots.ts tests/mascots.test.ts src/components/BuilderForm.tsx src/components/DashboardList.tsx "src/app/[locale]/invite/[token]/page.tsx" src/app/api/invitations/route.ts
git commit -m "refactor: enumerate mascots in one registry"
```

---

### Task 2: Heart headroom fix and mascot component split

Fix the two real defects in `HeartPop` and split the artwork out of `Mascot.tsx` so it can hold six characters. Still two characters after this task.

**Files:**
- Create: `src/components/mascots/motion.ts`
- Create: `src/components/mascots/Bear.tsx`
- Create: `src/components/mascots/Penguin.tsx`
- Modify: `src/components/Mascot.tsx` (becomes shell only)

**Interfaces:**
- Consumes: `MascotKind`, `MascotMood` from `src/lib/types.ts`.
- Produces: `MascotPartProps = { blushOpacity: number; mood: MascotMood }` and `armMotion: Record<MascotMood, { rotate: number[] }>` from `src/components/mascots/motion.ts`; each artwork file default-exports nothing and named-exports one component of type `(props: MascotPartProps) => JSX.Element`. Task 3 adds four more files with the same signature.

**Why this fix:** `HeartPop` animates `y: [8, -6, -16, -28]`, a translate, so the heart ends near y ≈ -20 — outside the `0 0 200 200` viewBox, which clips it. At rest it spans y 8-34 at x 80-120, and the bear's head crown is at y=39 (`cy=95 r=56`) with ear tops at y=27, so it also sits on the character. The characters fill the whole box, so the fix is to give the box empty headroom above y=0 and keep the hearts in it.

- [ ] **Step 1: Extract the shared motion tables**

Create `src/components/mascots/motion.ts`:

```ts
import type { MascotMood } from "@/lib/types";

/** Props every character artwork component takes. */
export type MascotPartProps = {
  blushOpacity: number;
  mood: MascotMood;
};

type Keyframes = { y?: number[]; rotate?: number | number[] };

export const bodyMotion: Record<MascotMood, Keyframes> = {
  idle: { y: [0, -6, 0], rotate: 0 },
  blush: { y: [0, -3, 0], rotate: [0, -3, 3, 0] },
  wave: { y: [0, -5, 0], rotate: [0, 2, -2, 0] },
  cheer: { y: [0, -20, 0], rotate: [0, -5, 5, 0] },
};

export const bodyTiming: Record<MascotMood, { duration: number }> = {
  idle: { duration: 2.6 },
  blush: { duration: 0.7 },
  wave: { duration: 1.1 },
  cheer: { duration: 0.75 },
};

/** Applied to whichever limb each character waves with. */
export const armMotion: Record<MascotMood, { rotate: number[] }> = {
  idle: { rotate: [0, 6, 0] },
  blush: { rotate: [0, -10, 0] },
  wave: { rotate: [0, -55, -10, -55, 0] },
  cheer: { rotate: [0, -70, -40, -70, 0] },
};

/**
 * Characters must stay inside y 0-200 of the 200-wide grid. The band above y=0
 * is headroom reserved for the cheer hearts — see `HEADROOM` in Mascot.tsx.
 */
export const FLOOR = 200;
```

- [ ] **Step 2: Move the Bear artwork**

Create `src/components/mascots/Bear.tsx` with the existing artwork verbatim, only the imports and props type changed:

```tsx
"use client";

import { motion } from "framer-motion";
import { armMotion, type MascotPartProps } from "./motion";

export function Bear({ blushOpacity, mood }: MascotPartProps) {
  return (
    <>
      {/* body */}
      <ellipse cx="100" cy="155" rx="45" ry="34" fill="#C98A5E" />
      <ellipse cx="100" cy="160" rx="29" ry="24" fill="#F7E0CB" />

      {/* arms — the right one waves */}
      <motion.ellipse
        cx="50"
        cy="150"
        rx="13"
        ry="21"
        fill="#B87A4F"
        animate={{ rotate: mood === "idle" ? [0, -5, 0] : [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "54px", originY: "134px" }}
      />
      <motion.ellipse
        cx="150"
        cy="150"
        rx="13"
        ry="21"
        fill="#B87A4F"
        animate={armMotion[mood]}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "146px", originY: "134px" }}
      />

      {/* ears */}
      <circle cx="60" cy="48" r="21" fill="#C98A5E" />
      <circle cx="60" cy="48" r="11" fill="#F3C9A8" />
      <circle cx="140" cy="48" r="21" fill="#C98A5E" />
      <circle cx="140" cy="48" r="11" fill="#F3C9A8" />

      {/* head */}
      <circle cx="100" cy="95" r="56" fill="#C98A5E" />
      <ellipse cx="100" cy="117" rx="32" ry="24" fill="#F7E0CB" />
      <ellipse cx="100" cy="107" rx="10" ry="7" fill="#6B4A38" />
      <path
        d="M100 114c0 7-6.5 8.5-10 4.5M100 114c0 7 6.5 8.5 10 4.5"
        stroke="#6B4A38"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* eyes */}
      <circle cx="78" cy="86" r="7" fill="#4A2E20" />
      <circle cx="122" cy="86" r="7" fill="#4A2E20" />
      <circle cx="80.5" cy="83" r="2.5" fill="#fff" />
      <circle cx="124.5" cy="83" r="2.5" fill="#fff" />

      {/* blush */}
      <ellipse cx="60" cy="107" rx="12" ry="7.5" fill="#FF7FA6" opacity={blushOpacity} />
      <ellipse cx="140" cy="107" rx="12" ry="7.5" fill="#FF7FA6" opacity={blushOpacity} />
    </>
  );
}
```

- [ ] **Step 3: Move the Penguin artwork**

Create `src/components/mascots/Penguin.tsx`, artwork verbatim from the current file:

```tsx
"use client";

import { motion } from "framer-motion";
import { armMotion, type MascotPartProps } from "./motion";

export function Penguin({ blushOpacity, mood }: MascotPartProps) {
  return (
    <>
      {/* feet */}
      <ellipse cx="80" cy="180" rx="18" ry="8" fill="#FFA23E" />
      <ellipse cx="120" cy="180" rx="18" ry="8" fill="#FFA23E" />

      {/* flippers — the right one waves */}
      <motion.ellipse
        cx="38"
        cy="142"
        rx="10"
        ry="24"
        fill="#1B2438"
        animate={{ rotate: mood === "idle" ? [0, -6, 0] : [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "32px", originY: "108px" }}
      />
      <motion.ellipse
        cx="162"
        cy="142"
        rx="10"
        ry="24"
        fill="#1B2438"
        animate={armMotion[mood]}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "168px", originY: "108px" }}
      />

      {/* body + belly */}
      <ellipse cx="100" cy="116" rx="62" ry="70" fill="#2F3A56" />
      <ellipse cx="100" cy="128" rx="45" ry="55" fill="#FFFDF8" />

      {/* eye patches + eyes */}
      <ellipse cx="82" cy="92" rx="15" ry="18" fill="#FFFDF8" />
      <ellipse cx="118" cy="92" rx="15" ry="18" fill="#FFFDF8" />
      <circle cx="83" cy="95" r="7.5" fill="#243043" />
      <circle cx="117" cy="95" r="7.5" fill="#243043" />
      <circle cx="85.5" cy="92" r="2.6" fill="#fff" />
      <circle cx="119.5" cy="92" r="2.6" fill="#fff" />

      {/* beak */}
      <path d="M100 108l-14 10 14 10 14-10z" fill="#FFA23E" />

      {/* blush */}
      <ellipse cx="63" cy="116" rx="12" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
      <ellipse cx="137" cy="116" rx="12" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
    </>
  );
}
```

- [ ] **Step 4: Rewrite `Mascot.tsx` as the shell, with the heart fix**

Replace the entire contents of `src/components/Mascot.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { Bear } from "@/components/mascots/Bear";
import { Penguin } from "@/components/mascots/Penguin";
import { bodyMotion, bodyTiming, type MascotPartProps } from "@/components/mascots/motion";
import type { MascotKind, MascotMood } from "@/lib/types";

/**
 * Empty space above the character, in viewBox units. The hearts rise into it.
 *
 * Without it the hearts had nowhere to go: the characters fill y 0-200, so the
 * old hearts both sat on the head (the bear's ear tops are at y=27) and got
 * clipped, because they animated to a negative y outside the viewBox. Every
 * character must stay inside y 0-200 and leave this band alone.
 */
const HEADROOM = 44;

const ART: Record<MascotKind, (props: MascotPartProps) => React.ReactElement> = {
  BEAR: Bear,
  PENGUIN: Penguin,
};

/**
 * Three hearts, staggered, drawn around their own origin so `x`/`y` place them.
 * Kept off-centre (72/100/128) so even the lowest frame misses the crown.
 */
const HEARTS = [
  { x: 72, delay: 0 },
  { x: 100, delay: 0.35 },
  { x: 128, delay: 0.7 },
];

const HEART_PATH =
  "M0 -8c-5-9-20-7.5-20 4 0 9 11.5 15.5 20 22 8.5-6.5 20-13 20-22 0-11.5-15-13-20-4z";

function HeartPop({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <>
      {HEARTS.map(({ x, delay }) => (
        <motion.path
          key={x}
          d={HEART_PATH}
          fill="#FF3D77"
          initial={{ opacity: 0, x, y: -6, scale: 0.3 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x,
            // Stays inside the headroom band: lowest point ≈ y 7, top ≈ y -39.
            y: [-6, -16, -24, -30],
            scale: [0.3, 0.75, 0.7, 0.5],
          }}
          transition={{ duration: 1.6, delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </>
  );
}

/**
 * One of the six characters, reacting with small animations at the key moments:
 * a dodge (blush), picking an answer (wave), the finale (cheer).
 *
 * `label` is required rather than defaulted — the accessible name has to be in
 * the viewer's language, which only the caller knows.
 *
 * The box is taller than it is wide because of `HEADROOM`; `size` is the width.
 */
export function Mascot({
  kind,
  mood = "idle",
  size = 180,
  label,
  className = "",
}: {
  kind: MascotKind;
  mood?: MascotMood;
  size?: number;
  label: string;
  className?: string;
}) {
  const blushOpacity = mood === "blush" || mood === "cheer" ? 0.95 : 0.4;
  const Art = ART[kind];

  return (
    <motion.svg
      viewBox={`0 -${HEADROOM} 200 ${200 + HEADROOM}`}
      width={size}
      height={Math.round((size * (200 + HEADROOM)) / 200)}
      className={className}
      role="img"
      aria-label={label}
      animate={bodyMotion[mood]}
      transition={{ ...bodyTiming[mood], repeat: Infinity, ease: "easeInOut" }}
    >
      <ellipse cx="100" cy="188" rx="52" ry="9" fill="rgba(90,20,45,0.18)" />
      <Art blushOpacity={blushOpacity} mood={mood} />
      <HeartPop show={mood === "cheer"} />
    </motion.svg>
  );
}
```

- [ ] **Step 5: Verify the build**

Run: `npm test`
Expected: PASS, unchanged — 5 suites, 81 tests. No test touches the SVG.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Verify the heart visually — this is the actual acceptance check**

Run: `npm run dev`

Open `http://localhost:3000/he/new`, fill the form (any name, your email, pick the bear, accept the seeded questions) and submit to reach the done card, which renders `mood="cheer"`.

Confirm, for **both** the bear and the penguin:
- The hearts rise fully into the empty space above the character and fade out — **no flat-topped or sliced heart** at any point in the loop.
- No heart overlaps the ears, the head or the card's top edge.
- The character itself has not moved or changed size horizontally.

Screenshot both to the scratchpad. If a heart still clips, the cause is the scale origin: framer-motion scales SVG paths about their bounding-box centre, so a larger `scale` pushes the top edge higher than the `y` value suggests — reduce the peak `scale` from `0.75`, do not raise `HEADROOM` (that would shrink every character).

- [ ] **Step 7: Check the taller box did not break any layout**

The box is now ~22% taller than wide. In the browser at 390px width, check each place a mascot renders — dashboard rows (`size={56}`), the builder picker (`size={110}`), the builder done card (`size={150}`), the invite gate and finale (`size={170}`/`190`):

```js
document.body.scrollWidth <= window.innerWidth
```

Expected: `true` on `/he`, `/he/new` and an invite link. Dashboard rows grow from 56px to ~68px tall — confirm the name, dates and badges still sit on one row and nothing overflows the card.

- [ ] **Step 8: Commit**

```bash
git add src/components/Mascot.tsx src/components/mascots/
git commit -m "fix: keep the cheer hearts inside the mascot box and off the character"
```

---

### Task 3: Four more characters

Widen the enum, the union, the registry and the artwork together — splitting them would break the build in between, because a widened `MascotKind` with no `ART`/`MASCOT_NAME_KEY`/`MASCOT_EMOJI` entry is a type error.

**Files:**
- Modify: `prisma/schema.prisma` (the `Mascot` enum)
- Modify: `src/lib/types.ts` (`MascotKind`)
- Modify: `src/lib/mascots.ts` (all three maps)
- Create: `src/components/mascots/Bunny.tsx`
- Create: `src/components/mascots/Cat.tsx`
- Create: `src/components/mascots/Fox.tsx`
- Create: `src/components/mascots/Panda.tsx`
- Modify: `src/components/Mascot.tsx` (the `ART` record)
- Modify: `src/components/BuilderForm.tsx` (picker grid + preview size)
- Modify: `src/lib/i18n/dictionaries/{he,ru,en}.ts` (four name keys each)

**Interfaces:**
- Consumes: `MascotPartProps`, `armMotion` from `src/components/mascots/motion.ts`.
- Produces: `MascotKind` widened to `"BEAR" | "PENGUIN" | "BUNNY" | "CAT" | "FOX" | "PANDA"`; `MASCOT_KINDS` with six entries in builder order.

**Constraint for every new character:** stay inside y 0-200 and x 0-200. The band above y=0 is heart-only. The bunny's ears are the tightest fit — they stop at y=2.

- [ ] **Step 1: Widen the Prisma enum**

In `prisma/schema.prisma`:

```prisma
enum Mascot {
  BEAR
  PENGUIN
  BUNNY
  CAT
  FOX
  PANDA
}
```

- [ ] **Step 2: Push the schema**

Run: `npm run db:push`
Expected: succeeds. This is additive — no existing row changes, and `BEAR`/`PENGUIN` keep their meaning.

If it fails with a missing `DATABASE_URL`, stop and tell the user: the env var is required and this task cannot be completed without it.

- [ ] **Step 3: Widen the union**

In `src/lib/types.ts`:

```ts
export type MascotKind = "BEAR" | "PENGUIN" | "BUNNY" | "CAT" | "FOX" | "PANDA";
```

- [ ] **Step 4: Add the dictionary names**

In `src/lib/i18n/dictionaries/he.ts`, after `"mascot.penguin"`:

```ts
  "mascot.bunny": "ארנב",
  "mascot.cat": "חתול",
  "mascot.fox": "שועל",
  "mascot.panda": "פנדה",
```

In `src/lib/i18n/dictionaries/ru.ts`, in the same position:

```ts
  "mascot.bunny": "Зайка",
  "mascot.cat": "Котик",
  "mascot.fox": "Лисёнок",
  "mascot.panda": "Панда",
```

In `src/lib/i18n/dictionaries/en.ts`:

```ts
  "mascot.bunny": "Bunny",
  "mascot.cat": "Cat",
  "mascot.fox": "Fox",
  "mascot.panda": "Panda",
```

- [ ] **Step 5: Extend the registry**

In `src/lib/mascots.ts`:

```ts
export const MASCOT_KINDS: readonly MascotKind[] = [
  "BEAR",
  "PENGUIN",
  "BUNNY",
  "CAT",
  "FOX",
  "PANDA",
];

export const MASCOT_NAME_KEY: Record<MascotKind, MessageKey> = {
  BEAR: "mascot.bear",
  PENGUIN: "mascot.penguin",
  BUNNY: "mascot.bunny",
  CAT: "mascot.cat",
  FOX: "mascot.fox",
  PANDA: "mascot.panda",
};

export const MASCOT_EMOJI: Record<MascotKind, string> = {
  BEAR: "🐻",
  PENGUIN: "🐧",
  BUNNY: "🐰",
  CAT: "🐱",
  FOX: "🦊",
  PANDA: "🐼",
};
```

- [ ] **Step 6: Run the registry test to confirm it catches nothing missing**

Run: `npx vitest run tests/mascots.test.ts tests/i18n.test.ts`
Expected: PASS. The i18n suite proves all three dictionaries gained the same four keys; the registry suite proves all six kinds resolve.

- [ ] **Step 7: Draw the Bunny**

Create `src/components/mascots/Bunny.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { armMotion, type MascotPartProps } from "./motion";

const FUR = "#F6EDE4";
const FUR_DEEP = "#E4D5C7";
const INNER_EAR = "#FFB3C9";
const INK = "#6B4A38";

export function Bunny({ blushOpacity, mood }: MascotPartProps) {
  return (
    <>
      {/* ears — the tightest fit in the box: they stop at y=2 */}
      <ellipse cx="78" cy="46" rx="14" ry="44" fill={FUR} transform="rotate(-8 78 46)" />
      <ellipse cx="122" cy="46" rx="14" ry="44" fill={FUR} transform="rotate(8 122 46)" />
      <ellipse cx="78" cy="50" rx="7" ry="31" fill={INNER_EAR} transform="rotate(-8 78 50)" />
      <ellipse cx="122" cy="50" rx="7" ry="31" fill={INNER_EAR} transform="rotate(8 122 50)" />

      {/* body */}
      <ellipse cx="100" cy="162" rx="43" ry="33" fill={FUR} />
      <ellipse cx="100" cy="168" rx="27" ry="23" fill="#FFFDF8" />

      {/* arms — the right one waves */}
      <motion.ellipse
        cx="58"
        cy="158"
        rx="12"
        ry="20"
        fill={FUR_DEEP}
        animate={{ rotate: mood === "idle" ? [0, -5, 0] : [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "62px", originY: "142px" }}
      />
      <motion.ellipse
        cx="142"
        cy="158"
        rx="12"
        ry="20"
        fill={FUR_DEEP}
        animate={armMotion[mood]}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "138px", originY: "142px" }}
      />

      {/* head */}
      <circle cx="100" cy="108" r="48" fill={FUR} />
      <ellipse cx="100" cy="126" rx="22" ry="15" fill="#FFFDF8" />

      {/* nose + mouth */}
      <ellipse cx="100" cy="118" rx="6" ry="4.2" fill="#FF7FA6" />
      <path
        d="M100 123c0 6-5.5 7.5-8.5 4M100 123c0 6 5.5 7.5 8.5 4"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* eyes */}
      <circle cx="80" cy="102" r="6.8" fill={INK} />
      <circle cx="120" cy="102" r="6.8" fill={INK} />
      <circle cx="82.4" cy="99.4" r="2.4" fill="#fff" />
      <circle cx="122.4" cy="99.4" r="2.4" fill="#fff" />

      {/* blush */}
      <ellipse cx="65" cy="120" rx="11" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
      <ellipse cx="135" cy="120" rx="11" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
    </>
  );
}
```

- [ ] **Step 8: Draw the Cat**

Create `src/components/mascots/Cat.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { armMotion, type MascotPartProps } from "./motion";

const FUR = "#B9BFD0";
const FUR_DEEP = "#A2A9BD";
const BELLY = "#EAEDF5";
const INNER = "#FFB3C9";
const INK = "#3E4457";

export function Cat({ blushOpacity, mood }: MascotPartProps) {
  return (
    <>
      {/* tail, behind everything */}
      <path
        d="M139 176c30-4 32-24 24-44"
        stroke={FUR_DEEP}
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />

      {/* body */}
      <ellipse cx="100" cy="163" rx="41" ry="32" fill={FUR} />
      <ellipse cx="100" cy="169" rx="25" ry="22" fill={BELLY} />

      {/* arms — the right one waves */}
      <motion.ellipse
        cx="60"
        cy="160"
        rx="11"
        ry="19"
        fill={FUR_DEEP}
        animate={{ rotate: mood === "idle" ? [0, -5, 0] : [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "64px", originY: "145px" }}
      />
      <motion.ellipse
        cx="140"
        cy="160"
        rx="11"
        ry="19"
        fill={FUR_DEEP}
        animate={armMotion[mood]}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "136px", originY: "145px" }}
      />

      {/* ears */}
      <path d="M64 74L58 26l40 26z" fill={FUR} />
      <path d="M136 74l6-48-40 26z" fill={FUR} />
      <path d="M68 68l-3-27 22 15z" fill={INNER} />
      <path d="M132 68l3-27-22 15z" fill={INNER} />

      {/* head */}
      <circle cx="100" cy="104" r="49" fill={FUR} />

      {/* whiskers */}
      <path
        d="M58 112h-18M60 122l-17 6M142 112h18M140 122l17 6"
        stroke={FUR_DEEP}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* nose + mouth */}
      <path d="M100 114l-6 5h12z" fill="#FF7FA6" />
      <path
        d="M100 120c0 6-5.5 7.5-8.5 4M100 120c0 6 5.5 7.5 8.5 4"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* eyes */}
      <circle cx="80" cy="99" r="7" fill={INK} />
      <circle cx="120" cy="99" r="7" fill={INK} />
      <circle cx="82.5" cy="96.2" r="2.5" fill="#fff" />
      <circle cx="122.5" cy="96.2" r="2.5" fill="#fff" />

      {/* blush */}
      <ellipse cx="66" cy="116" rx="11" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
      <ellipse cx="134" cy="116" rx="11" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
    </>
  );
}
```

- [ ] **Step 9: Draw the Fox**

Create `src/components/mascots/Fox.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { armMotion, type MascotPartProps } from "./motion";

const COAT = "#E8823C";
const COAT_DEEP = "#CE6A28";
const CREAM = "#FFF6EC";
const INK = "#4A3524";

export function Fox({ blushOpacity, mood }: MascotPartProps) {
  return (
    <>
      {/* tail, behind everything, cream tip */}
      <ellipse cx="150" cy="158" rx="18" ry="34" fill={COAT_DEEP} transform="rotate(28 150 158)" />
      <ellipse cx="163" cy="180" rx="12" ry="14" fill={CREAM} transform="rotate(28 163 180)" />

      {/* body */}
      <ellipse cx="100" cy="162" rx="41" ry="32" fill={COAT} />
      <ellipse cx="100" cy="169" rx="25" ry="22" fill={CREAM} />

      {/* arms — the right one waves */}
      <motion.ellipse
        cx="60"
        cy="159"
        rx="11"
        ry="19"
        fill={COAT_DEEP}
        animate={{ rotate: mood === "idle" ? [0, -5, 0] : [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "64px", originY: "144px" }}
      />
      <motion.ellipse
        cx="140"
        cy="159"
        rx="11"
        ry="19"
        fill={COAT_DEEP}
        animate={armMotion[mood]}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "136px", originY: "144px" }}
      />

      {/* ears, dark tips */}
      <path d="M62 72L54 24l42 24z" fill={COAT} />
      <path d="M138 72l8-48-42 24z" fill={COAT} />
      <path d="M58 44l-4-20 17 10z" fill={INK} />
      <path d="M142 44l4-20-17 10z" fill={INK} />

      {/* head + cream muzzle */}
      <circle cx="100" cy="102" r="48" fill={COAT} />
      <ellipse cx="100" cy="122" rx="26" ry="18" fill={CREAM} />
      <path d="M74 108q26 -14 52 0" stroke={CREAM} strokeWidth="9" strokeLinecap="round" fill="none" />

      {/* nose + mouth */}
      <ellipse cx="100" cy="116" rx="7" ry="5" fill={INK} />
      <path
        d="M100 122c0 6-5.5 7.5-8.5 4M100 122c0 6 5.5 7.5 8.5 4"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* eyes */}
      <circle cx="80" cy="98" r="7" fill={INK} />
      <circle cx="120" cy="98" r="7" fill={INK} />
      <circle cx="82.5" cy="95.2" r="2.5" fill="#fff" />
      <circle cx="122.5" cy="95.2" r="2.5" fill="#fff" />

      {/* blush */}
      <ellipse cx="66" cy="112" rx="11" ry="7" fill="#FF5C8D" opacity={blushOpacity} />
      <ellipse cx="134" cy="112" rx="11" ry="7" fill="#FF5C8D" opacity={blushOpacity} />
    </>
  );
}
```

- [ ] **Step 10: Draw the Panda**

Create `src/components/mascots/Panda.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { armMotion, type MascotPartProps } from "./motion";

const COAT = "#FFFDF8";
const INK = "#2B2B33";

export function Panda({ blushOpacity, mood }: MascotPartProps) {
  return (
    <>
      {/* body */}
      <ellipse cx="100" cy="162" rx="44" ry="33" fill={COAT} />

      {/* arms — the right one waves */}
      <motion.ellipse
        cx="56"
        cy="157"
        rx="12"
        ry="20"
        fill={INK}
        animate={{ rotate: mood === "idle" ? [0, -5, 0] : [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "60px", originY: "141px" }}
      />
      <motion.ellipse
        cx="144"
        cy="157"
        rx="12"
        ry="20"
        fill={INK}
        animate={armMotion[mood]}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "140px", originY: "141px" }}
      />

      {/* ears */}
      <circle cx="62" cy="54" r="20" fill={INK} />
      <circle cx="138" cy="54" r="20" fill={INK} />

      {/* head */}
      <circle cx="100" cy="102" r="52" fill={COAT} />

      {/* eye patches */}
      <ellipse cx="78" cy="96" rx="15" ry="18" fill={INK} transform="rotate(-14 78 96)" />
      <ellipse cx="122" cy="96" rx="15" ry="18" fill={INK} transform="rotate(14 122 96)" />

      {/* eyes */}
      <circle cx="79" cy="97" r="7" fill="#fff" />
      <circle cx="121" cy="97" r="7" fill="#fff" />
      <circle cx="79" cy="97" r="4" fill={INK} />
      <circle cx="121" cy="97" r="4" fill={INK} />
      <circle cx="80.6" cy="95" r="1.8" fill="#fff" />
      <circle cx="122.6" cy="95" r="1.8" fill="#fff" />

      {/* nose + mouth */}
      <ellipse cx="100" cy="118" rx="8" ry="5.5" fill={INK} />
      <path
        d="M100 125c0 6-6 7.5-9 4M100 125c0 6 6 7.5 9 4"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* blush */}
      <ellipse cx="62" cy="118" rx="11" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
      <ellipse cx="138" cy="118" rx="11" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
    </>
  );
}
```

- [ ] **Step 11: Register the artwork**

In `src/components/Mascot.tsx`, add the four imports and extend `ART`:

```tsx
import { Bunny } from "@/components/mascots/Bunny";
import { Cat } from "@/components/mascots/Cat";
import { Fox } from "@/components/mascots/Fox";
import { Panda } from "@/components/mascots/Panda";
```

```tsx
const ART: Record<MascotKind, (props: MascotPartProps) => React.ReactElement> = {
  BEAR: Bear,
  PENGUIN: Penguin,
  BUNNY: Bunny,
  CAT: Cat,
  FOX: Fox,
  PANDA: Panda,
};
```

- [ ] **Step 12: Fit six into the builder picker**

In `src/components/BuilderForm.tsx`, at what was line 267, change the grid and the preview size so three fit across at 390px:

```tsx
<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
```

and in the same block:

```tsx
<Mascot
  kind={kind}
  mood={selected ? "wave" : "idle"}
  size={96}
  label={name}
/>
```

- [ ] **Step 13: Verify the suite and the build**

Run: `npm test`
Expected: PASS — 5 suites, 81 tests.

Run: `npm run build`
Expected: succeeds. A missing `ART`, `MASCOT_NAME_KEY` or `MASCOT_EMOJI` entry would fail here.

- [ ] **Step 14: Verify all six visually**

Run: `npm run dev`, open `http://localhost:3000/he/new` at 390px width.

Confirm:
- Six characters in the picker, each recognisable at 96px, each with its name underneath in Hebrew.
- The picker is a 2-column grid at 390px and 3-column at `sm` and up; `document.body.scrollWidth <= window.innerWidth` is `true`.
- Selecting each one animates the waving limb, not the whole body.
- Submit with each of the four new characters and check the done card's `cheer` state: hearts rise into the headroom, nothing clips, nothing overlaps the ears — **the bunny's ears are the tightest fit, check that one carefully**.

Screenshot the picker and the four new `cheer` cards to the scratchpad.

- [ ] **Step 15: Commit**

```bash
git add prisma/schema.prisma src/lib/types.ts src/lib/mascots.ts src/components/mascots/ src/components/Mascot.tsx src/components/BuilderForm.tsx src/lib/i18n/dictionaries/
git commit -m "feat: add bunny, cat, fox and panda characters"
```

---

### Task 4: Language pills

Replace the cycling button with all three languages shown at once.

**Files:**
- Modify: `src/components/LanguageSwitcher.tsx` (full rewrite)

**Interfaces:**
- Consumes: `LOCALES`, `LOCALE_COOKIE`, `LOCALE_COOKIE_MAX_AGE`, `LOCALE_NAMES`, `swapLocale`, `Locale` from `src/lib/i18n/locales.ts`; `t`, `Dictionary` from `src/lib/i18n/t.ts`.
- Produces: `LanguageSwitcher({ locale, dict })` — unchanged props, so `src/app/[locale]/page.tsx` and any other call site need no edit.

No new unit test: the navigation logic is `swapLocale`, already covered by `tests/i18n.test.ts`. This task's verification is the browser.

- [ ] **Step 1: Rewrite the component**

Replace the entire contents of `src/components/LanguageSwitcher.tsx`:

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_NAMES,
  swapLocale,
  type Locale,
} from "@/lib/i18n/locales";
import { t, type Dictionary } from "@/lib/i18n/t";

/**
 * All three languages, each in its own script, with the current one filled.
 * A segmented control rather than a dropdown: with three locales a popover
 * would add open/close state, click-outside, Escape and arrow-key handling for
 * nothing.
 *
 * Picking one writes the cookie — so the choice survives a visit to a
 * prefix-less URL — then swaps the path prefix.
 *
 * Not rendered on the invite or answers pages: their content can't follow a
 * switch, so offering one there would only produce a mixed-language card.
 */
export function LanguageSwitcher({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function choose(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    router.replace(swapLocale(pathname, next));
  }

  return (
    <div
      role="group"
      aria-label={t(dict, "switcher.label")}
      className="flex flex-wrap items-center gap-1 rounded-2xl bg-white/70 p-1"
    >
      <span aria-hidden className="px-1.5 text-sm">
        🌐
      </span>
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            onClick={() => choose(code)}
            aria-current={active ? "true" : undefined}
            className={`rounded-xl px-3 py-1.5 text-sm font-bold transition ${
              active
                ? "bg-rose-deep text-white"
                : "text-rose-deep hover:bg-blush"
            }`}
          >
            {LOCALE_NAMES[code]}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: succeeds.

Run: `npm test`
Expected: PASS, unchanged — 5 suites, 81 tests.

- [ ] **Step 3: Verify in the browser, both directions**

Run: `npm run dev`, open `http://localhost:3000/he`.

Confirm:
- Three pills — `עברית`, `Русский`, `English` — with `עברית` filled rose.
- Clicking `Русский` navigates to `/ru`, the page re-renders LTR, and `Русский` is now the filled pill.
- Clicking `English` navigates to `/en`. Clicking the already-active pill does nothing (no navigation, no flash).
- `document.cookie` contains `sayyes_locale=en` after the last click.
- At 390px: `document.body.scrollWidth <= window.innerWidth` is `true` on `/he`, `/ru` and `/en`. In RTL the pill order mirrors — that is correct, the group is laid out logically.
- Tab through the group: each pill is focusable and the active one is announced as current.

Screenshot `/he` and `/en` at 390px to the scratchpad.

- [ ] **Step 4: Commit**

```bash
git add src/components/LanguageSwitcher.tsx
git commit -m "feat: show all three languages as pills instead of cycling"
```

---

### Task 5: Answers page

A creator-facing page for one invitation's answers, and point the answered notification at it.

**Files:**
- Create: `src/app/[locale]/answers/[token]/page.tsx`
- Modify: `src/lib/i18n/dictionaries/{he,ru,en}.ts` (nine keys each)
- Modify: `src/app/api/invitations/[token]/answers/route.ts:87` (the link)

**Interfaces:**
- Consumes: `CuteCard`, `Mascot`, `RecapCard`, `Sparkles`, `MASCOT_NAME_KEY`, `isLocale`, `DEFAULT_LOCALE`, `DATE_LOCALE`, `getDictionary`, `t`, `prisma`, `RecapItem`.
- Produces: the route `/{locale}/answers/{token}`, consumed by Task 7's email link.

- [ ] **Step 1: Add the dictionary keys**

In `src/lib/i18n/dictionaries/he.ts`, before the `email.*` block:

```ts
  "answers.title": "התשובות של {name}",
  "answers.answeredAt": "ענתה ב{date}",
  "answers.recapTitle": "מה היא בחרה",
  "answers.back": "חזרה לכל ההזמנות",
  "answers.waiting.title": "עדיין מחכים ל{name}",
  "answers.waiting.text": "ההזמנה נשלחה אבל עוד לא נענתה.",
  "answers.waiting.cta": "פתיחת ההזמנה",
  "answers.missing.title": "לא מצאנו את ההזמנה",
  "answers.missing.text": "אולי הקישור השתנה או שההזמנה נמחקה.",
```

In `src/lib/i18n/dictionaries/ru.ts`, same position:

```ts
  "answers.title": "Ответы {name}",
  "answers.answeredAt": "Ответила {date}",
  "answers.recapTitle": "Что она выбрала",
  "answers.back": "Ко всем приглашениям",
  "answers.waiting.title": "Ждём ответа от {name}",
  "answers.waiting.text": "Приглашение отправлено, но ответа пока нет.",
  "answers.waiting.cta": "Открыть приглашение",
  "answers.missing.title": "Приглашение не найдено",
  "answers.missing.text": "Возможно, ссылка изменилась или приглашение удалено.",
```

In `src/lib/i18n/dictionaries/en.ts`:

```ts
  "answers.title": "{name}'s answers",
  "answers.answeredAt": "Answered {date}",
  "answers.recapTitle": "What she picked",
  "answers.back": "Back to all invitations",
  "answers.waiting.title": "Still waiting for {name}",
  "answers.waiting.text": "The invitation is out but hasn't been answered yet.",
  "answers.waiting.cta": "Open the invitation",
  "answers.missing.title": "Invitation not found",
  "answers.missing.text": "The link may have changed, or the invitation was deleted.",
```

The `{name}` and `{date}` placeholders must appear in all three or `tests/i18n.test.ts` fails.

- [ ] **Step 2: Run the i18n test to prove the dictionaries stayed in sync**

Run: `npx vitest run tests/i18n.test.ts`
Expected: PASS. If it fails on key sets or placeholders, a key or a `{name}` is missing from one dictionary — fix before continuing.

- [ ] **Step 3: Write the page**

Create `src/app/[locale]/answers/[token]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CuteCard } from "@/components/CuteCard";
import { Mascot } from "@/components/Mascot";
import { RecapCard } from "@/components/RecapCard";
import { Sparkles } from "@/components/Sparkles";
import { DATE_LOCALE, isLocale } from "@/lib/i18n/locales";
import { getDictionary, t, type Dictionary } from "@/lib/i18n/t";
import { MASCOT_NAME_KEY } from "@/lib/mascots";
import { prisma } from "@/lib/prisma";
import type { MascotKind, RecapItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const linkClass =
  "inline-block rounded-2xl bg-gradient-to-b from-rose-soft to-rose-deep px-6 py-3 text-lg font-bold text-white transition hover:brightness-105";

/** A creator following a stale link should land somewhere styled, not on a 404. */
function MissingCard({ dict }: { dict: Dictionary }) {
  return (
    <CuteCard
      top={<Mascot kind="PENGUIN" mood="idle" size={170} label={t(dict, "mascot.penguin")} />}
    >
      <h1 className="text-center text-2xl font-bold text-rose-deep">
        {t(dict, "answers.missing.title")}
      </h1>
      <p className="mt-3 text-center text-rose-ink/70">{t(dict, "answers.missing.text")}</p>
    </CuteCard>
  );
}

export default async function AnswersPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

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

  if (!invitation) {
    return (
      <>
        <Sparkles />
        <main className="relative z-10 grid min-h-dvh place-items-center px-4 py-10">
          <MissingCard dict={dict} />
        </main>
      </>
    );
  }

  // An invitation owns its locale, so content and chrome never mix languages.
  // Same rule the invite page enforces.
  if (isLocale(invitation.locale) && invitation.locale !== locale) {
    redirect(`/${invitation.locale}/answers/${token}`);
  }

  const mascot = invitation.mascot as MascotKind;
  const mascotLabel = t(dict, MASCOT_NAME_KEY[mascot]);
  const answered = invitation.status === "ANSWERED";

  // Reachable from a bookmark or a link opened before the recipient replied —
  // it must not be a dead end.
  if (!answered) {
    return (
      <>
        <Sparkles />
        <main className="relative z-10 grid min-h-dvh place-items-center px-4 py-10">
          <CuteCard top={<Mascot kind={mascot} mood="idle" size={170} label={mascotLabel} />}>
            <h1 className="text-center text-2xl font-bold text-rose-deep">
              {t(dict, "answers.waiting.title", { name: invitation.recipientName })}
            </h1>
            <p className="mt-3 text-center text-rose-ink/70">
              {t(dict, "answers.waiting.text")}
            </p>
            <div className="mt-5 text-center">
              <Link href={`/${locale}/invite/${token}`} className={linkClass}>
                {t(dict, "answers.waiting.cta")}
              </Link>
            </div>
          </CuteCard>
        </main>
      </>
    );
  }

  const recap: RecapItem[] = invitation.questions.map((question) => {
    const answer = invitation.answers.find((item) => item.questionId === question.id);
    return { question: question.text, answer: answer?.selectedOption.label ?? "—" };
  });

  // The timestamp is chrome, so it follows the viewer's locale. By this point
  // the viewer's locale and the invitation's are the same — the redirect above
  // guarantees it.
  // `locale` is already narrowed to `Locale` by the isLocale guard above —
  // notFound() returns never — so no cast is needed here.
  const answeredLabel = invitation.answeredAt
    ? new Intl.DateTimeFormat(DATE_LOCALE[locale], {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(invitation.answeredAt)
    : null;

  return (
    <>
      <Sparkles />
      <main className="relative z-10 grid min-h-dvh place-items-center px-4 py-10">
        <div className="flex w-full max-w-md flex-col items-center gap-5">
          <CuteCard top={<Mascot kind={mascot} mood="cheer" size={180} label={mascotLabel} />}>
            <h1 className="text-center text-2xl font-bold text-rose-deep">
              {t(dict, "answers.title", { name: invitation.recipientName })}
            </h1>
            {answeredLabel && (
              <p className="mt-1 text-center text-sm text-rose-ink/60">
                {t(dict, "answers.answeredAt", { date: answeredLabel })}
              </p>
            )}
            <div className="mt-5">
              <RecapCard
                items={recap}
                title={t(dict, "answers.recapTitle")}
                emptyText={t(dict, "recap.empty")}
              />
            </div>
          </CuteCard>

          <Link href={`/${locale}`} className="font-bold text-rose-deep underline">
            {t(dict, "answers.back")}
          </Link>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 4: Point the answered notification at the new page**

In `src/app/api/invitations/[token]/answers/route.ts`, replace line 87:

```ts
  const link = `${new URL(request.url).origin}/${locale}/answers/${invitation.id}`;
```

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: succeeds, and the route `/[locale]/answers/[token]` appears in the route list as dynamic (`ƒ`).

Run: `npm test`
Expected: PASS — 5 suites, 81 tests.

- [ ] **Step 6: Verify the page in the browser**

Run: `npm run dev`. Create an invitation at `/he/new`, note its token from the share link, then:

- `http://localhost:3000/he/answers/<token>` **before** answering → the waiting card, with a working "פתיחת ההזמנה" button.
- Answer the invitation through `/he/invite/<token>`, then reload the answers page → mascot cheering, the recipient's name in the heading, the answered timestamp in Hebrew, every question with its chosen answer, and a working link back to `/he`.
- `http://localhost:3000/en/answers/<token>` → redirects to `/he/answers/<token>`, because the invitation is Hebrew.
- `http://localhost:3000/he/answers/nope` → the styled missing card, not a raw 404.
- `http://localhost:3000/de/answers/<token>` → a 404.
- No language switcher on the page.
- At 390px: `document.body.scrollWidth <= window.innerWidth` is `true`.

Repeat the answered view once for a `ru` invitation to confirm LTR layout.

Screenshot the answered view (he and ru) and the waiting view to the scratchpad.

- [ ] **Step 7: Commit**

```bash
git add "src/app/[locale]/answers" src/lib/i18n/dictionaries/ "src/app/api/invitations/[token]/answers/route.ts"
git commit -m "feat: add a per-invitation answers page and link the answered email to it"
```

---

### Task 6: Email HTML primitives

Pure string builders for the email layout, with the escaping that keeps creator-typed content from breaking the markup.

**Files:**
- Create: `src/lib/mail/layout.ts`
- Create: `tests/mail-layout.test.ts`

**Interfaces:**
- Consumes: `Locale`, `DIR` from `src/lib/i18n/locales.ts`; `RecapItem` from `src/lib/types.ts`.
- Produces:
  - `escapeHtml(value: string): string`
  - `emailShell(input: { locale: Locale; preheader: string; headerEmoji: string; body: string }): string`
  - `button(input: { href: string; label: string }): string`
  - `recapTable(input: { items: RecapItem[]; dir: "rtl" | "ltr" }): string`
  - `linkFallback(input: { hint: string; href: string }): string`
  - `footer(text: string): string`

  Task 7 consumes all six.

- [ ] **Step 1: Write the failing tests**

Create `tests/mail-layout.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  button,
  emailShell,
  escapeHtml,
  footer,
  linkFallback,
  recapTable,
} from "@/lib/mail/layout";

describe("escapeHtml", () => {
  it("escapes every character that could break out of markup", () => {
    expect(escapeHtml(`<script>alert("x")&'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&amp;&#39;"
    );
  });

  it("leaves ordinary text alone, including non-Latin scripts", () => {
    expect(escapeHtml("מאיה")).toBe("מאיה");
    expect(escapeHtml("Маша")).toBe("Маша");
  });

  it("escapes the ampersand first, so escapes are not double-escaped", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });
});

describe("emailShell", () => {
  it("marks Hebrew mail as RTL and the others as LTR", () => {
    expect(emailShell({ locale: "he", preheader: "p", headerEmoji: "🐻", body: "" })).toContain(
      'dir="rtl"'
    );
    for (const locale of ["ru", "en"] as const) {
      expect(emailShell({ locale, preheader: "p", headerEmoji: "🐻", body: "" })).toContain(
        'dir="ltr"'
      );
    }
  });

  it("includes the preheader and the body", () => {
    const html = emailShell({
      locale: "en",
      preheader: "inbox teaser",
      headerEmoji: "🐧",
      body: "<p>hello</p>",
    });
    expect(html).toContain("inbox teaser");
    expect(html).toContain("<p>hello</p>");
    expect(html).toContain("🐧");
  });

  it("gives Outlook a solid header colour alongside the gradient", () => {
    const html = emailShell({ locale: "en", preheader: "p", headerEmoji: "🐻", body: "" });
    expect(html).toContain('bgcolor="#E84A7F"');
    expect(html).toContain("linear-gradient");
  });

  it("escapes the preheader", () => {
    const html = emailShell({
      locale: "en",
      preheader: "<b>x</b>",
      headerEmoji: "🐻",
      body: "",
    });
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(html).not.toContain("<b>x</b>");
  });
});

describe("button", () => {
  it("renders a table-based link with the href and label", () => {
    const html = button({ href: "https://sayyes.fun/en", label: "See the answers" });
    expect(html).toContain('href="https://sayyes.fun/en"');
    expect(html).toContain("See the answers");
    expect(html).toContain("<table");
  });

  it("escapes the label and the href", () => {
    const html = button({ href: "https://x.test/?a=1&b=2", label: "<b>go</b>" });
    expect(html).toContain("&amp;b=2");
    expect(html).toContain("&lt;b&gt;go&lt;/b&gt;");
  });
});

describe("recapTable", () => {
  it("renders one row per item with the question and the answer", () => {
    const html = recapTable({
      items: [
        { question: "Where?", answer: "Sushi" },
        { question: "When?", answer: "Friday" },
      ],
      dir: "ltr",
    });
    expect(html).toContain("Where?");
    expect(html).toContain("Sushi");
    expect(html).toContain("When?");
    expect(html).toContain("Friday");
    expect(html.match(/<tr/g)).toHaveLength(2);
  });

  it("escapes creator-typed questions and answers", () => {
    const html = recapTable({
      items: [{ question: "<img src=x>", answer: "Tom & Jerry" }],
      dir: "ltr",
    });
    expect(html).toContain("&lt;img src=x&gt;");
    expect(html).toContain("Tom &amp; Jerry");
    expect(html).not.toContain("<img src=x>");
  });

  it("aligns the answer to the opposite edge in RTL", () => {
    expect(recapTable({ items: [{ question: "q", answer: "a" }], dir: "rtl" })).toContain(
      'align="left"'
    );
    expect(recapTable({ items: [{ question: "q", answer: "a" }], dir: "ltr" })).toContain(
      'align="right"'
    );
  });

  it("renders nothing for an empty list", () => {
    expect(recapTable({ items: [], dir: "ltr" })).toBe("");
  });
});

describe("linkFallback", () => {
  it("shows the raw url as copyable text", () => {
    const html = linkFallback({ hint: "Or copy the link:", href: "https://sayyes.fun/en/x" });
    expect(html).toContain("Or copy the link:");
    expect(html).toContain("https://sayyes.fun/en/x");
  });
});

describe("footer", () => {
  it("escapes its text", () => {
    expect(footer("a & b")).toContain("a &amp; b");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/mail-layout.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/mail/layout"`.

- [ ] **Step 3: Write the layout module**

Create `src/lib/mail/layout.ts`:

```ts
import { DIR, type Locale } from "@/lib/i18n/locales";
import type { RecapItem } from "@/lib/types";

/**
 * Email HTML primitives. Tables and inline styles, because that is the only
 * thing Gmail, Outlook and Apple Mail all render predictably: no flexbox, no
 * grid, no external stylesheet, no webfont.
 *
 * Colours are literal hex rather than the app's theme tokens — a mail client
 * has no access to our CSS — and never `rgba()`, whose support is unreliable.
 * They mirror the tokens in globals.css.
 */
const BLUSH = "#FFF0F5";
const ROSE_DEEP = "#E84A7F";
const ROSE_SOFT = "#FF6BA0";
const ROSE_INK = "#8A2C4D";
/** `rose-ink` flattened to ~70% — the muted question colour. */
const INK_MUTED = "#A85B76";
const WHITE = "#FFFFFF";

/**
 * No `@font-face`: webfonts do not load in most mail clients, so the fallback
 * is what actually renders and is chosen deliberately.
 */
const FONT = "'Rubik', 'Heebo', 'Segoe UI', Arial, sans-serif";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * The only thing between a creator-typed `<` and broken — or hostile — markup
 * in someone's inbox. Creator content (`recipientName`, question texts, option
 * labels) is stored verbatim and never sanitised on the way in, so every one of
 * those strings must pass through here before it reaches the HTML.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** The full document: blush wash, 600px card, rose header panel. */
export function emailShell({
  locale,
  preheader,
  headerEmoji,
  body,
}: {
  locale: Locale;
  preheader: string;
  headerEmoji: string;
  body: string;
}): string {
  const dir = DIR[locale];
  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(preheader)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BLUSH};">
<!-- The inbox preview line, chosen rather than scraped from the body. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BLUSH}" style="background-color:${BLUSH};">
  <tr>
    <td align="center" style="padding:28px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" dir="${dir}" style="width:600px;max-width:100%;background-color:${WHITE};border-radius:28px;overflow:hidden;font-family:${FONT};color:${ROSE_INK};">
        <tr>
          <!-- bgcolor is the Outlook fallback; it ignores the gradient. -->
          <td align="center" bgcolor="${ROSE_DEEP}" style="background-color:${ROSE_DEEP};background-image:linear-gradient(180deg,${ROSE_SOFT},${ROSE_DEEP});padding:34px 24px;">
            <div style="font-size:64px;line-height:1;">${headerEmoji}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 28px 32px 28px;">${body}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** A "bulletproof" button: a one-cell table, because a styled <a> is unreliable. */
export function button({ href, label }: { href: string; label: string }): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td align="center" bgcolor="${ROSE_DEEP}" style="background-color:${ROSE_DEEP};border-radius:16px;">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:17px;font-weight:bold;color:${WHITE};text-decoration:none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

/** One blush row per question. Returns "" for an empty list, so callers can concatenate. */
export function recapTable({
  items,
  dir,
}: {
  items: RecapItem[];
  dir: "rtl" | "ltr";
}): string {
  if (items.length === 0) return "";

  const answerAlign = dir === "rtl" ? "left" : "right";
  const questionAlign = dir === "rtl" ? "right" : "left";

  const rows = items
    .map(
      ({ question, answer }) => `  <tr>
    <td align="${questionAlign}" style="padding:12px 16px;background-color:${BLUSH};border-radius:14px;font-size:15px;color:${INK_MUTED};">${escapeHtml(question)}</td>
    <td align="${answerAlign}" style="padding:12px 16px;background-color:${BLUSH};border-radius:14px;font-size:16px;font-weight:bold;color:${ROSE_DEEP};">${escapeHtml(answer)}</td>
  </tr>
  <tr><td colspan="2" style="height:8px;line-height:8px;font-size:0;">&nbsp;</td></tr>`
    )
    .join("\n");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="${dir}" style="width:100%;">
${rows}
</table>`;
}

/** Some clients strip or mangle buttons, and the creator needs a copyable link. */
export function linkFallback({ hint, href }: { hint: string; href: string }): string {
  return `<p style="margin:18px 0 0 0;text-align:center;font-family:${FONT};font-size:13px;color:${INK_MUTED};">
  ${escapeHtml(hint)}<br>
  <span style="word-break:break-all;color:${ROSE_DEEP};">${escapeHtml(href)}</span>
</p>`;
}

export function footer(text: string): string {
  return `<p style="margin:26px 0 0 0;text-align:center;font-family:${FONT};font-size:12px;color:${INK_MUTED};">${escapeHtml(text)}</p>`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/mail-layout.test.ts`
Expected: PASS, 14 tests.

Note the `<tr` count assertion in the recap test: each item emits a content row **and** an 8px spacer row, so two items give four `<tr`. If the test fails on `toHaveLength(2)`, the assertion is what is wrong, not the code — change it to count content rows specifically:

```ts
expect(html.match(/border-radius:14px/g)).toHaveLength(4); // 2 items × 2 cells
```

- [ ] **Step 5: Verify the build and the whole suite**

Run: `npm test`
Expected: PASS — 6 suites, 95 tests.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/lib/mail/layout.ts tests/mail-layout.test.ts
git commit -m "feat: add email HTML primitives with creator-content escaping"
```

---

### Task 7: Wire the HTML emails

Make both emails HTML, put the recap in the answered one, and pass the mascot through from both routes.

**Files:**
- Modify: `src/lib/mail/content.ts` (full rewrite)
- Modify: `src/lib/mail/send.ts` (accept `html`)
- Modify: `src/lib/i18n/dictionaries/{he,ru,en}.ts` (eleven keys each)
- Modify: `src/app/api/invitations/route.ts` (pass `mascot`)
- Modify: `src/app/api/invitations/[token]/answers/route.ts` (pass `mascot` + `recap`)
- Modify: `tests/mail-content.test.ts` (cover `html` and the recap)

**Interfaces:**
- Consumes: everything from `src/lib/mail/layout.ts`, `MASCOT_EMOJI` from `src/lib/mascots.ts`, `RecapItem` from `src/lib/types.ts`.
- Produces:
  - `EmailContent = { subject: string; text: string; html: string }`
  - `createdEmail(input: { locale: Locale; recipientName: string; mascot: MascotKind; link: string }): EmailContent`
  - `answeredEmail(input: { locale: Locale; recipientName: string; mascot: MascotKind; link: string; recap: RecapItem[] }): EmailContent`
  - `sendMail(input: { to: string; subject: string; text: string; html: string }): Promise<void>`

- [ ] **Step 1: Add the dictionary keys**

In `src/lib/i18n/dictionaries/he.ts`, in the `email.*` block:

```ts
  "email.created.heading": "ההזמנה ל{name} מוכנה",
  "email.created.intro": "הכול מוכן. שלחו לה את הקישור והיא תוכל לענות.",
  "email.created.cta": "פתיחת ההזמנה",
  "email.created.linkHint": "או העתיקו את הקישור:",
  "email.preheader.created": "הקישור לשליחה מחכה בפנים 💌",
  "email.answered.heading": "{name} ענתה! 🎉",
  "email.answered.intro": "היא בחרה את התוכנית שלה:",
  "email.answered.recapTitle": "התשובות",
  "email.answered.cta": "צפייה בתשובות",
  "email.preheader.answered": "התשובות מחכות בפנים 🎉",
  "email.footer": "נשלח אוטומטית מ־SayYes",
```

In `src/lib/i18n/dictionaries/ru.ts`:

```ts
  "email.created.heading": "Приглашение для {name} готово",
  "email.created.intro": "Всё готово. Отправьте ей ссылку, и она сможет ответить.",
  "email.created.cta": "Открыть приглашение",
  "email.created.linkHint": "Или скопируйте ссылку:",
  "email.preheader.created": "Ссылка для отправки внутри 💌",
  "email.answered.heading": "{name} ответила! 🎉",
  "email.answered.intro": "Она выбрала свой план:",
  "email.answered.recapTitle": "Ответы",
  "email.answered.cta": "Посмотреть ответы",
  "email.preheader.answered": "Ответы внутри 🎉",
  "email.footer": "Отправлено автоматически из SayYes",
```

In `src/lib/i18n/dictionaries/en.ts`:

```ts
  "email.created.heading": "The invitation for {name} is ready",
  "email.created.intro": "All set. Send her the link and she can answer.",
  "email.created.cta": "Open the invitation",
  "email.created.linkHint": "Or copy the link:",
  "email.preheader.created": "The link to send is inside 💌",
  "email.answered.heading": "{name} answered! 🎉",
  "email.answered.intro": "She picked her plan:",
  "email.answered.recapTitle": "The answers",
  "email.answered.cta": "See the answers",
  "email.preheader.answered": "The answers are inside 🎉",
  "email.footer": "Sent automatically by SayYes",
```

`{name}` appears in `email.created.heading` and `email.answered.heading` in all three.

- [ ] **Step 2: Run the i18n test**

Run: `npx vitest run tests/i18n.test.ts`
Expected: PASS.

- [ ] **Step 3: Write the failing content tests**

Replace the contents of `tests/mail-content.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n/locales";
import { answeredEmail, createdEmail } from "@/lib/mail/content";

const created = {
  recipientName: "Maya",
  mascot: "BEAR" as const,
  link: "https://sayyes.fun/en/invite/abc123",
};

const answered = {
  recipientName: "Maya",
  mascot: "PENGUIN" as const,
  link: "https://sayyes.fun/en/answers/abc123",
  recap: [
    { question: "Where?", answer: "Sushi" },
    { question: "When?", answer: "Friday" },
  ],
};

describe("createdEmail", () => {
  it("interpolates the recipient name and link into every part, in every locale", () => {
    for (const locale of LOCALES) {
      const { subject, text, html } = createdEmail({ locale, ...created });
      expect(subject).toContain("Maya");
      expect(text).toContain("Maya");
      expect(text).toContain(created.link);
      expect(html).toContain("Maya");
      expect(html).toContain(created.link);
    }
  });

  it("never leaves a literal placeholder token behind", () => {
    for (const locale of LOCALES) {
      const { subject, text, html } = createdEmail({ locale, ...created });
      expect(subject).not.toMatch(/\{\w+\}/);
      expect(text).not.toMatch(/\{\w+\}/);
      expect(html).not.toMatch(/\{\w+\}/);
    }
  });

  it("uses the chosen mascot's emoji in the header", () => {
    expect(createdEmail({ locale: "en", ...created }).html).toContain("🐻");
    expect(createdEmail({ locale: "en", ...created, mascot: "FOX" }).html).toContain("🦊");
  });

  it("renders Hebrew mail right-to-left", () => {
    expect(createdEmail({ locale: "he", ...created }).html).toContain('dir="rtl"');
    expect(createdEmail({ locale: "en", ...created }).html).toContain('dir="ltr"');
  });

  it("escapes a recipient name that contains markup", () => {
    const { html } = createdEmail({ locale: "en", ...created, recipientName: "<b>M</b>" });
    expect(html).toContain("&lt;b&gt;M&lt;/b&gt;");
    expect(html).not.toContain("<b>M</b>");
  });
});

describe("answeredEmail", () => {
  it("interpolates the recipient name and answers link, in every locale", () => {
    for (const locale of LOCALES) {
      const { subject, text, html } = answeredEmail({ locale, ...answered });
      expect(subject).toContain("Maya");
      expect(text).toContain("Maya");
      expect(text).toContain(answered.link);
      expect(html).toContain("Maya");
      expect(html).toContain(answered.link);
    }
  });

  it("never leaves a literal placeholder token behind", () => {
    for (const locale of LOCALES) {
      const { subject, text, html } = answeredEmail({ locale, ...answered });
      expect(subject).not.toMatch(/\{\w+\}/);
      expect(text).not.toMatch(/\{\w+\}/);
      expect(html).not.toMatch(/\{\w+\}/);
    }
  });

  it("puts the recap in the html part", () => {
    const { html } = answeredEmail({ locale: "en", ...answered });
    expect(html).toContain("Where?");
    expect(html).toContain("Sushi");
    expect(html).toContain("When?");
    expect(html).toContain("Friday");
  });

  it("puts the recap in the plain-text part too, so text-only clients see it", () => {
    const { text } = answeredEmail({ locale: "en", ...answered });
    expect(text).toContain("Where?");
    expect(text).toContain("Sushi");
    expect(text).toContain("When?");
    expect(text).toContain("Friday");
  });

  it("escapes creator-typed questions and answers in the html", () => {
    const { html } = answeredEmail({
      locale: "en",
      ...answered,
      recap: [{ question: "<i>q</i>", answer: "Tom & Jerry" }],
    });
    expect(html).toContain("&lt;i&gt;q&lt;/i&gt;");
    expect(html).toContain("Tom &amp; Jerry");
    expect(html).not.toContain("<i>q</i>");
  });

  it("still renders with no answers at all", () => {
    const { html, text } = answeredEmail({ locale: "en", ...answered, recap: [] });
    expect(html).toContain("Maya");
    expect(text).toContain("Maya");
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npx vitest run tests/mail-content.test.ts`
Expected: FAIL — `createdEmail` does not accept `mascot`, and the returned object has no `html`.

- [ ] **Step 5: Rewrite `content.ts`**

Replace the contents of `src/lib/mail/content.ts`:

```ts
import { DIR, type Locale } from "@/lib/i18n/locales";
import { getDictionary, t } from "@/lib/i18n/t";
import { MASCOT_EMOJI } from "@/lib/mascots";
import type { MascotKind, RecapItem } from "@/lib/types";
import {
  button,
  emailShell,
  escapeHtml,
  footer,
  linkFallback,
  recapTable,
} from "./layout";

export type EmailContent = { subject: string; text: string; html: string };

const FONT = "'Rubik', 'Heebo', 'Segoe UI', Arial, sans-serif";

function heading(text: string): string {
  return `<h1 style="margin:0;text-align:center;font-family:${FONT};font-size:26px;font-weight:bold;color:#E84A7F;">${escapeHtml(text)}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:14px 0 24px 0;text-align:center;font-family:${FONT};font-size:16px;color:#8A2C4D;">${escapeHtml(text)}</p>`;
}

/**
 * Sent to the creator right after `POST /api/invitations` succeeds. Contains
 * the share link so they can forward it without going back to the app.
 */
export function createdEmail({
  locale,
  recipientName,
  mascot,
  link,
}: {
  locale: Locale;
  recipientName: string;
  mascot: MascotKind;
  link: string;
}): EmailContent {
  const dict = getDictionary(locale);

  const body = [
    heading(t(dict, "email.created.heading", { name: recipientName })),
    paragraph(t(dict, "email.created.intro")),
    button({ href: link, label: t(dict, "email.created.cta") }),
    linkFallback({ hint: t(dict, "email.created.linkHint"), href: link }),
    footer(t(dict, "email.footer")),
  ].join("\n");

  return {
    subject: t(dict, "email.created.subject", { name: recipientName }),
    text: t(dict, "email.created.body", { name: recipientName, link }),
    html: emailShell({
      locale,
      preheader: t(dict, "email.preheader.created"),
      headerEmoji: MASCOT_EMOJI[mascot],
      body,
    }),
  };
}

/**
 * Sent to the creator once the recipient submits their answers. Carries the
 * answers themselves as well as the link — the creator should not have to click
 * through to find out what was picked.
 */
export function answeredEmail({
  locale,
  recipientName,
  mascot,
  link,
  recap,
}: {
  locale: Locale;
  recipientName: string;
  mascot: MascotKind;
  link: string;
  recap: RecapItem[];
}): EmailContent {
  const dict = getDictionary(locale);

  const recapHtml = recapTable({ items: recap, dir: DIR[locale] });
  const body = [
    heading(t(dict, "email.answered.heading", { name: recipientName })),
    paragraph(t(dict, "email.answered.intro")),
    recapHtml,
    `<div style="height:24px;line-height:24px;font-size:0;">&nbsp;</div>`,
    button({ href: link, label: t(dict, "email.answered.cta") }),
    footer(t(dict, "email.footer")),
  ].join("\n");

  // The plain-text part is the multipart fallback, so it carries the recap too.
  const recapText = recap.map(({ question, answer }) => `• ${question} — ${answer}`).join("\n");
  const text = [t(dict, "email.answered.body", { name: recipientName, link }), recapText]
    .filter(Boolean)
    .join("\n\n");

  return {
    subject: t(dict, "email.answered.subject", { name: recipientName }),
    text,
    html: emailShell({
      locale,
      preheader: t(dict, "email.preheader.answered"),
      headerEmoji: MASCOT_EMOJI[mascot],
      body,
    }),
  };
}
```

- [ ] **Step 6: Run the content tests to verify they pass**

Run: `npx vitest run tests/mail-content.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 7: Send the html part**

In `src/lib/mail/send.ts`, change the `sendMail` signature and call:

```ts
/** Rejects on any SMTP failure — the caller decides what that means. */
export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  // Both parts go out as multipart/alternative: the client picks, and a
  // text-only reader still gets the whole message.
  await getTransport().sendMail({ from: FROM_ADDRESS, to, subject, text, html });
}
```

Leave `getTransport()` and its lazy `SMTP_PASSWORD` check exactly as they are — moving that check to module scope would break `npm run build` on a checkout without the variable.

- [ ] **Step 8: Pass the mascot from the create route**

In `src/app/api/invitations/route.ts`, update the `createdEmail` call and the send:

```ts
  const link = `${new URL(request.url).origin}/${invitation.locale}/invite/${invitation.id}`;
  const { subject, text, html } = createdEmail({
    locale: draft.locale,
    recipientName: invitation.recipientName,
    mascot: invitation.mascot,
    link,
  });
```

and inside the `try`:

```ts
      await sendMail({ to: notify, subject, text, html });
```

- [ ] **Step 9: Pass the mascot and the recap from the answers route**

In `src/app/api/invitations/[token]/answers/route.ts`, after the `$transaction` and before building the email, assemble the recap from data already in hand — `invitation.questions` (with options) was fetched at the top, and `submissions` holds the chosen option ids, so no extra query is needed:

```ts
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
```

Add `RecapItem` to the type import at the top of the file:

```ts
import type { AnswerSubmission, RecapItem } from "@/lib/types";
```

And in the `try`:

```ts
      await sendMail({ to: notify, subject, text, html });
```

The rollback block below it is unchanged — a failed send still deletes the answers and reverts the status to `PENDING`.

- [ ] **Step 10: Verify the suite and the build**

Run: `npm test`
Expected: PASS — 6 suites, 95 tests.

Run: `npm run build`
Expected: succeeds. Confirm it still succeeds with no `SMTP_PASSWORD` in the environment.

- [ ] **Step 11: Look at the emails**

The point of this work is that the emails are beautiful, so render them. Write a throwaway script to the scratchpad:

```ts
// scratchpad/preview-mail.ts
import { writeFileSync } from "node:fs";
import { answeredEmail, createdEmail } from "../src/lib/mail/content";
import { LOCALES } from "../src/lib/i18n/locales";

const recap = [
  { question: "איפה נאכל?", answer: "סושי" },
  { question: "מתי?", answer: "שישי בערב" },
  { question: "מה אחרי?", answer: "סרט" },
];

for (const locale of LOCALES) {
  writeFileSync(
    `mail-created-${locale}.html`,
    createdEmail({ locale, recipientName: "מאיה", mascot: "BEAR", link: "https://sayyes.fun/x" }).html
  );
  writeFileSync(
    `mail-answered-${locale}.html`,
    answeredEmail({ locale, recipientName: "מאיה", mascot: "FOX", link: "https://sayyes.fun/y", recap }).html
  );
}
```

Run it with `npx vitest run` style tooling or `npx tsx`; if `tsx` is unavailable, add a temporary test file that writes the same files and run `npx vitest run`, then delete it.

Open all six files in a browser and confirm:
- The rose header with the mascot emoji, the white card, rounded corners, centred at 600px.
- The Hebrew ones are right-to-left; `ru` and `en` are left-to-right.
- In the answered ones the recap rows read cleanly, with the answer on the outer edge.
- The button is a solid rose pill; the created ones show the copyable raw link beneath it.
- Narrow the window to 390px: the card shrinks and nothing scrolls sideways.

Screenshot all six to the scratchpad. Delete the preview script and the generated HTML from the repo if any landed there — they belong in the scratchpad only.

- [ ] **Step 12: Send real mail, if configured**

If `SMTP_PASSWORD` is set in `.env`, run `npm run dev`, create an invitation with your own address, and answer it. Confirm two emails arrive and that both render correctly in a real client — check at least one mobile client, since that is where the 600px card has to degrade.

If `SMTP_PASSWORD` is not set, skip this step and say so explicitly in the final report rather than implying the emails were delivered.

- [ ] **Step 13: Commit**

```bash
git add src/lib/mail/ src/lib/i18n/dictionaries/ src/app/api/ tests/mail-content.test.ts
git commit -m "feat: send designed HTML notification emails with the answer recap"
```

---

### Task 8: Documentation and full verification

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Update `CLAUDE.md`**

Make these edits, each replacing stale guidance rather than appending to it:

1. In **Hard rules**, the email bullet: the answered email now **includes** the answer recap, and links to `/{locale}/answers/{token}`, not the dashboard. Delete the "no answer recap" phrasing — it now contradicts the code.
2. In **Hard rules**, the mascot bullet: six characters — `BEAR`, `PENGUIN`, `BUNNY`, `CAT`, `FOX`, `PANDA` — still with no default, and `src/lib/mascots.ts` is the one registry. Adding a character means one registry edit plus one artwork file in `src/components/mascots/`.
3. In **Hard rules**, a new mascot-geometry bullet: characters must stay inside y 0-200 of the SVG grid; the `HEADROOM` band above y=0 belongs to the cheer hearts. The old hearts both clipped at the viewBox edge and sat on the bear's ears — do not reintroduce artwork above y=0.
4. In **Hard rules**, the invitation-owns-its-locale bullet: `/{locale}/answers/{token}` redirects the same way `/{locale}/invite/{token}` does, and neither page renders a language switcher.
5. In **Architecture**, under `src/lib/`: `mail/layout.ts` holds the email HTML primitives, and **every creator-typed string must pass through `escapeHtml`** before reaching the markup. `mail/content.ts` returns `{ subject, text, html }`.
6. In **Architecture**: note the switcher is a segmented control showing all three locales, not a cycling button.
7. In **Verification**: `npm test` is now 6 suites (add `mail-layout` and `mascots`); the manual click-through gains the answers page and all six characters; rendering the email HTML in a browser per locale is part of "done".

- [ ] **Step 2: Update `README.md`**

Sync the same facts: six characters, the answers page, HTML emails with the recap, and the language pills. Keep the existing structure — do not restructure the file.

- [ ] **Step 3: Full verification run**

Run: `npm test`
Expected: PASS — 6 suites, 95 tests. Paste the real output into the final report.

Run: `npm run build`
Expected: succeeds.

Run: `npm run dev` and walk the whole flow **once per locale** (`he` RTL, `ru`, `en`):

dashboard → language pills → builder (including validation errors, and all six characters visible) → generated link → gate, trying to catch "no" → questions → finale (hearts clean) → answers page from the finale's invitation → back to dashboard → dashboard recap.

Then the edge cases:
- `/{other-locale}/invite/{token}` redirects to the invitation's locale.
- `/{other-locale}/answers/{token}` redirects to the invitation's locale.
- `/de` and `/de/answers/{token}` are 404s.
- `/he/answers/nope` is the styled missing card.
- A fresh visit with `Accept-Language: ru-RU` and no cookie lands on `/ru`.
- `POST` to an already-answered token returns `409`; an unknown token `404`; an invalid draft `400` with an `{ code }` body.
- `document.body.scrollWidth <= window.innerWidth` at 390px on the dashboard, the builder, the invite page and the answers page.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: document the html emails, answers page, pills and six characters"
```

- [ ] **Step 5: Report**

Summarise for the user: what shipped, the real `npm test` output, which manual checks were done per locale, and — explicitly — whether real email delivery was verified or skipped for a missing `SMTP_PASSWORD`. Do not push; the user asks for that separately.

---

## Self-Review

**Spec coverage:** Spec §1 (HTML emails) → Tasks 6 and 7. §2 (answers page) → Task 5. §3 (language pills) → Task 4. §4 (six characters) → Tasks 1 and 3. §5 (heart fix) → Task 2. Build order → Tasks 1-7 in order. Verification → each task's own steps plus Task 8 Step 3. Documentation → Task 8. No spec section is unimplemented.

**Deviation from the spec's build order, deliberate:** the spec puts the registry and the characters in one step. This plan splits them (Task 1 registry for two characters, Task 3 widening plus artwork) so that Task 1 ends with a green build and a reviewable no-op refactor. Widening `MascotKind` before the artwork exists cannot compile, which is why Task 3 keeps the enum, the union, the registry, the artwork and the dictionaries in a single task.

**Type consistency:** `MASCOT_KINDS` / `MASCOT_NAME_KEY` / `MASCOT_EMOJI` are named identically in Tasks 1, 3, 5 and 7. `MascotPartProps` is defined in Task 2 and consumed unchanged in Task 3. `EmailContent` gains `html` in Task 7 and both call sites are updated in the same task. `recapTable({ items, dir })`, `button({ href, label })`, `linkFallback({ hint, href })` and `escapeHtml(value)` are defined in Task 6 and called with those exact shapes in Task 7. `RecapItem` is the existing type from `src/lib/types.ts` throughout — no new shape invented.
