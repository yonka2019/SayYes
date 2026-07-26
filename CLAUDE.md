# CLAUDE.md — SayYes

Hebrew-only (RTL), single-user, local-only Next.js app for building cute
"will you go on a date with me?" invitations. Design spec: `md.md`.
Implementation plan: `docs/superpowers/plans/2026-07-26-date-invitation-website.md`.

## Hard rules for this project

- **Hebrew only, RTL.** All user-facing copy is Hebrew. `<html lang="he" dir="rtl">`
  in `src/app/layout.tsx`. Never add English UI strings.
- **RTL gotcha:** avoid `inset-inline-*` + rotated pseudo-elements for shapes —
  RTL mirrors them. The heart button was rebuilt as SVG for exactly this reason.
- **Answers are multiple choice only**, 2–4 options per question (`MIN_OPTIONS` /
  `MAX_OPTIONS` in `src/lib/defaults.ts`). No free text, no date picker.
- **Mascot has no default** — the creator must actively pick `BEAR` or `PENGUIN`.
- **Dodge lives in `src/lib/dodge.ts`** and has three parts, all tested:
  - `nextFleeOffset` — bolts *away from the cursor* (55–110px) as soon as it comes
    within `PROXIMITY_RADIUS` (130px). It doesn't wait for hover.
  - `nextDodgeOffset` — blind 20–50px hop, used when there's no cursor position
    (keyboard focus).
  - `scaleForCatches` / `pleaForCatches` — every click that lands shrinks it by
    `SHRINK_PER_CATCH` and escalates a Hebrew plea. It floors at `MIN_SCALE`
    (0.3) and the last plea repeats, so **it never vanishes and never gives up**.
- **Touch has no hover**, so `DodgeButton` ignores `pointermove` when
  `pointerType === "touch"` — on a phone the tap *is* the catch attempt, and
  shrink + plea carry the interaction.
- **Gate question comes first.** Logistics questions only render after "כן".
- **One answer set per invitation.** Reopening an answered link is read-only.
- No auth, no deployment, no invitation editing after generation — all out of scope.

## Architecture

- One Next.js App Router process holds UI + API routes. No separate backend.
- Prisma + SQLite at `prisma/dev.db`. Schema: `Invitation` → `Question` →
  `QuestionOption`, plus `Answer` (unique per `[invitationId, questionId]`).
- **Pure logic lives in `src/lib/` and is unit tested** (`tests/*.test.ts`).
  Anything with a rule worth asserting belongs there, not inside a component.
  - `dodge.ts` — hop math, takes an injectable `rand()` so tests are deterministic.
  - `validation.ts` — `validateDraft()` is the single source of truth for builder
    validity; the form uses it for live inline errors *and* the create route
    re-runs it before writing.
- Server components query Prisma directly (`/`, `/invite/[token]`); client
  components own interaction state (`BuilderForm`, `InviteFlow`, `DashboardList`).
- Both dynamic pages set `export const dynamic = "force-dynamic"` so freshly
  created/answered invitations always show.
- Next 15: route `params` is a `Promise` — always `await` it.

## Visual system

- Theme tokens live in `@theme` in `src/app/globals.css`: `blush` (`#FFF0F5`),
  `blush-deep`, `rose-deep` (`#E84A7F`), `rose-soft` (`#FF6BA0`), `rose-ink`.
  Use the tokens, not raw hex, in components.
- Card shape is always `CuteCard`: rose gradient panel on top (mascot), white
  panel below (text + buttons).
- `Mascot` takes `mood`: `idle` | `blush` | `wave` | `cheer`. Wire moods to
  moments — `blush` on a "לא" dodge, `wave` on an answer pick, `cheer` on the finale.
- `Sparkles` is decorative only: `fixed`, `pointer-events-none`, `aria-hidden`.
- Keep animated *wrappers* separate from click targets — pulsing the button
  itself makes it an unstable hit box (and unclickable for Playwright).
- **Phone width (390px) is the primary recipient viewport.** Rows that pack a
  label plus several buttons must `flex-wrap` (see `DashboardList` rows and the
  builder's question header) — check `document.body.scrollWidth <=
  window.innerWidth` after layout changes.

## Verification

```bash
npm test          # dodge + validation units
npm run build     # type check
npm run dev       # then click the real flow in a browser
```

Manual click-through is part of "done" here, per the spec's testing section:
dashboard → builder (incl. validation errors) → link → gate (try to catch "לא")
→ questions → finale → reload link (read-only recap) → dashboard recap.
Also worth re-checking the API edges: `409` on an already-answered token, `404`
on an unknown token, `400` on an invalid draft.

## Housekeeping

- Screenshots from browser verification go to the scratchpad, **not** the repo root.
- Never commit or push without an explicit request.
