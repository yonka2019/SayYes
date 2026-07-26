# CLAUDE.md — SayYes

Hebrew-only (RTL), single-user Next.js app for building cute
"will you go on a date with me?" invitations. Runs locally or on Vercel.
Design spec: `md.md` (written when the scope was local-only and Hebrew-only —
the Postgres/deployment setup and the i18n system below supersede those
decisions).
Implementation plans:
`docs/superpowers/plans/2026-07-26-date-invitation-website.md` (original build),
`docs/superpowers/plans/2026-07-26-i18n-he-ru-en.md` (he/ru/en localization).

## Hard rules for this project

- **Three languages: `he`, `ru`, `en`.** All chrome resolves through
  `src/lib/i18n/` — never put a user-facing literal in a component or route.
  `he` is `DEFAULT_LOCALE` *and* the source-of-truth dictionary
  (`src/lib/i18n/dictionaries/he.ts`): `ru.ts` and `en.ts` are typed
  `: Dictionary`, so a key added to `he.ts` without a translation is a build
  error, not a runtime fallback.
- **Direction is per locale, not global.** `DIR` in `src/lib/i18n/locales.ts`
  (`he` → `rtl`, `ru`/`en` → `ltr`), applied by `src/app/[locale]/layout.tsx`.
  Check both directions after any layout change — the app renders LTR now, not
  just RTL.
- **RTL gotcha:** avoid `inset-inline-*` + rotated pseudo-elements for shapes —
  RTL mirrors them. The heart button was rebuilt as SVG for exactly this
  reason. Prefer logical properties (`ms-`, `me-`, `ps-`, `pe-`) over physical
  ones (`ml-`, `mr-`) so a component doesn't quietly break in the direction it
  wasn't tested in.
- **Creator content is never translated.** `recipientName`, `gateQuestion`,
  question texts and option labels are stored verbatim, in whatever language
  the creator typed. The `seed.*` dictionary keys are only the builder's
  pre-fills — the moment the creator edits or accepts one, it's content, not
  chrome.
- **Locale detection precedence** lives in `resolveLocale()`
  (`src/lib/i18n/locales.ts`): URL prefix → `sayyes_locale` cookie →
  `Accept-Language` → `he`. It runs in `src/middleware.ts`, before render, so
  there's no wrong-language flash. The middleware matcher must keep excluding
  `/api` — API routes are never locale-prefixed.
- **An invitation owns its locale.** `Invitation.locale` is set at creation
  from the builder's URL locale. `/{locale}/invite/{token}` redirects to the
  invitation's own locale if they differ, so content and chrome never mix
  languages on one card. No language switcher renders on the invite page for
  the same reason.
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
- **Prisma + Postgres**, `url = env("DATABASE_URL")`. Schema: `Invitation` →
  `Question` → `QuestionOption`, plus `Answer` (unique per
  `[invitationId, questionId]`). Schema changes go out with `npm run db:push`.
  - It was SQLite (`prisma/dev.db`) originally. That can't work on Vercel: the
    file is gitignored so it never deploys, and the filesystem is read-only and
    ephemeral. Don't switch back for the sake of "simpler local setup".
  - `build` is `prisma generate && next build` — Vercel needs the generate step
    because the generated client isn't committed. Don't drop it.
  - `src/lib/prisma.ts` throws immediately if `DATABASE_URL` is missing, so the
    failure is a readable message instead of a query-time driver error.
- **Pure logic lives in `src/lib/` and is unit tested** (`tests/*.test.ts`).
  Anything with a rule worth asserting belongs there, not inside a component.
  - `dodge.ts` — hop math, takes an injectable `rand()` so tests are
    deterministic. Pleas are dictionary keys (`PLEA_KEYS`,
    `pleaKeyForCatches()`), not sentences — `DodgeButton` takes the resolved
    strings as a `pleas` prop.
  - `validation.ts` — `validateDraft()` is the single source of truth for
    builder validity; it returns error **codes** (`{ code, params }`), not
    sentences, since `src/lib/` has no locale. The form and the API's `400`
    body both carry codes; each is translated at its render site.
  - `i18n/locales.ts` — `resolveLocale()` (path → cookie → header → `he`),
    `negotiate()` (q-weighted `Accept-Language` parsing), `localeFromPath()`,
    `swapLocale()`. All pure, no Next.js imports.
  - `i18n/t.ts` + `i18n/dictionaries/*` — the string tables and the `t()`
    lookup/interpolation helper. `tests/i18n.test.ts` asserts all three
    dictionaries share the exact same key set and the exact same
    `{placeholder}` set per key, so a translation can't silently drift.
- Server components query Prisma directly (`/`, `/invite/[token]`); client
  components own interaction state (`BuilderForm`, `InviteFlow`, `DashboardList`).
- Both dynamic pages set `export const dynamic = "force-dynamic"` so freshly
  created/answered invitations always show.
- Next 15: route `params` is a `Promise` — always `await` it.

## Visual system

- Font is Rubik (`hebrew`, `latin`, `cyrillic` subsets), exposed as
  `--font-app`. Varela Round was dropped because it has no Cyrillic glyphs.
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

Manual click-through is part of "done" here, per the spec's testing section, and
now repeats **per locale** (`he` RTL, `ru` LTR, `en` LTR): dashboard → switcher
(single button, cycles `he → ru → en → he`) → builder (incl. validation errors)
→ link → gate (try to catch "no") → questions → finale → reload link
(read-only recap) → dashboard recap. Also worth re-checking: `/{other-locale}
/invite/{token}` redirects to the invitation's own locale; a fresh visit with
`Accept-Language: ru-RU` lands on `/ru`; an unknown locale segment (`/de`) is a
`404`; API edges — `409` on an already-answered token, `404` on an unknown
token, `400` with an `{ code }` body on an invalid draft.

## Housekeeping

- Screenshots from browser verification go to the scratchpad, **not** the repo root.
- Never commit or push without an explicit request.
