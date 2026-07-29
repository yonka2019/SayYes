# CLAUDE.md — SayYes

Hebrew-only (RTL), single-user Next.js app for building cute
"will you go on a date with me?" invitations. Runs locally or on Vercel.
Design spec: `md.md` (written when the scope was local-only and Hebrew-only —
the Postgres/deployment setup and the i18n system below supersede those
decisions).
Implementation plans:
`docs/superpowers/plans/2026-07-26-date-invitation-website.md` (original build),
`docs/superpowers/plans/2026-07-26-i18n-he-ru-en.md` (he/ru/en localization),
`docs/superpowers/plans/2026-07-26-email-notifications.md` (creator email
notifications),
`docs/superpowers/plans/2026-07-27-emails-answers-page-mascots.md` (HTML emails,
answers page, language pills, six characters, heart fix),
`docs/superpowers/plans/2026-07-28-remove-home-page.md` (dashboard removal,
builder as home, footer credit).

## Hard rules for this project

- **There is no dashboard and no home listing — deliberately.** The builder *is*
  the home page (`/{locale}`). The app has no auth, so a page listing every
  invitation (the old dashboard, removed 2026-07-28 along with `/new` and
  `DashboardList`) exposed all recipients and answers to anyone with the
  deployed URL. Invitations are reachable only by token link; the creator's
  copies live in the two notification emails. Don't reintroduce a list page.
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
- **The recipient has a gender toggle (her/him), and it genders chrome only.**
  `Invitation.recipientGender` (`SHE` default / `HE`) is picked in the builder.
  Gendered strings live as `.her`/`.him` twin keys resolved via `tg()` in
  `src/lib/i18n/t.ts` — the twin-key pair is asserted by a test because `tg()`
  builds the key untyped. The seeded gate question follows the toggle **only
  while untouched** — once edited it's content and stays as typed. The Hebrew
  pleas were deliberately worded gender-neutral (`plea.3` was reworded for
  this) so the dodge button needs no gender plumbing — keep new pleas neutral.
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
  from the builder's URL locale. `/{locale}/invite/{token}` and
  `/{locale}/answers/{token}` both redirect to the invitation's own locale if
  they differ, so content and chrome never mix languages on one card. No
  language switcher renders on either page for the same reason.
- **The language switcher shows all three languages**, as a segmented control
  with the current one filled and `aria-current`, and clicking the active pill
  is a no-op. It used to be one button that cycled `he → ru → en`, which hid
  what the options even were. Don't turn it back into a cycle, and don't make it
  a dropdown either — with three locales a popover is pure overhead.
- **Answers are multiple choice only**, 2–4 options per question (`MIN_OPTIONS` /
  `MAX_OPTIONS` in `src/lib/defaults.ts`). No free text, no date picker.
- **Six characters, and no default** — the creator must actively pick one of
  `BEAR`, `PENGUIN`, `BUNNY`, `CAT`, `FOX`, `PANDA`. `src/lib/mascots.ts` is the
  **one** registry (`MASCOT_KINDS`, `MASCOT_NAME_KEY`, `MASCOT_EMOJI`); adding a
  character is one edit there plus one artwork file in
  `src/components/mascots/`. Never reintroduce a local `["BEAR","PENGUIN"]`
  array or a `kind === "BEAR" ? … : …` ternary — there were four such copies
  (`BuilderForm`, `DashboardList`, the invite page, `InviteFlow`) plus two
  arrays (`validation.ts`, the create route), and the `InviteFlow` one failed
  *silently*: it labelled every non-bear as "penguin" to a screen reader.
- **Mascot geometry:** characters must stay inside `y 0–200` of the 200-wide
  SVG grid. The `HEADROOM` band above `y=0` (see `Mascot.tsx`) belongs to the
  `cheer` hearts, which is the only reason they neither clip at the viewBox
  edge nor land on the character's head. The bunny's ears are the tightest fit
  at `y=14` — at `y=2` they collided. Re-measure after touching any artwork:
  every character should clear the hearts, bunny has the least room at ~7px.
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
- **Preview never persists.** The builder's success-screen preview opens
  `/{locale}/invite/{token}?preview=1`: the full flow runs, but
  `InviteFlow.submit()` skips the POST, the invitation stays `PENDING`, and a
  badge says answers aren't saved. Without it, previewing consumed the one
  answer set and locked the real recipient out. The locale redirect must keep
  the param. A recipient adding `?preview=1` herself just doesn't get saved —
  accepted, the shared link doesn't carry it.
- **The creator's email is required** and stored on `Invitation.creatorEmail`.
  Two notification emails go out via `src/lib/mail/`: one when an invitation is
  created (share link) and one when it's answered (**includes the answer
  recap**, and links to `/{locale}/answers/{token}`). Both
  use the invitation's own locale. A failed send **fails the request** — the API
  compensates by rolling back what it just wrote (deleting the invitation, or
  deleting the just-inserted answers and reverting `ANSWERED` back to
  `PENDING`) rather than silently continuing. Consequence worth knowing while
  developing: with no `SMTP_PASSWORD` you cannot create *or* answer an
  invitation at all, so seed rows directly via Prisma if you need test data.
- **Email HTML lives in `src/lib/mail/layout.ts`** and is table-based with
  inline styles — no flexbox, no grid, no stylesheet, no `@font-face` (webfonts
  don't load in most clients, so the system fallback is the real design), and
  solid hex only, never `rgba()`. Two things that are load-bearing and look
  redundant: the header carries `bgcolor` *and* `background-image` because
  Outlook drops the gradient, and the card is `width="100%"` + `max-width:600px`
  — a fixed `width="600"` overflows sideways on a phone. **Every creator-typed
  string must pass through `escapeHtml()`**; content is stored verbatim and
  never sanitised on the way in.
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
  - `src/lib/mail/send.ts` throws the first time `sendMail()` actually runs if
    `SMTP_PASSWORD` is missing — deliberately *not* at module import, unlike
    `prisma.ts` / `DATABASE_URL`, because Next's build-time "collecting page
    data" step imports every route module (including the mail one) even though
    nothing is sent during a build; a top-level throw there would fail
    `npm run build` on a checkout with no `SMTP_PASSWORD`.
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
  - `mascots.ts` — the character registry. A unit test asserts every
    `MascotKind` has both a name key and an emoji, so it can't drift behind the
    union at runtime.
  - `mail/content.ts` — pure `{ subject, text, html }` builders per locale, unit
    tested. `mail/layout.ts` — the email HTML primitives (`escapeHtml`,
    `emailShell`, `button`, `recapTable`, `linkFallback`, `footer`), also pure
    and unit tested. `mail/send.ts` — the one shared `nodemailer` SMTP transport
    (`smtp.resend.com:465`), lazily created on first `sendMail()` call rather
    than at import so `npm run build` doesn't require `SMTP_PASSWORD`; not unit
    tested (verified manually).
- Server components query Prisma directly (`/invite/[token]`,
  `/answers/[token]`); `/{locale}` is the builder and touches no DB. Client
  components own interaction state (`BuilderForm`, `InviteFlow`).
- Both token pages set `export const dynamic = "force-dynamic"` so
  freshly created/answered invitations always show.
- The locale layout renders a site-wide footer: "by yonka" + a GitHub-icon
  link to `https://github.com/yonka2019/SayYes`. Its strings are the
  `footer.*` dictionary keys, the body is `flex min-h-screen flex-col` so the
  footer sits at the viewport bottom on short pages.
- The builder's success screen links "create another invitation" to
  `/{locale}` with a plain `<a>`, not `<Link>` — the builder lives at that
  same URL, so a client-side navigation would keep the success state mounted
  instead of re-seeding a fresh draft.
- `Mascot.tsx` is the SVG shell (viewBox, headroom, hearts, mood wiring) and
  nothing else; each character is its own file under `src/components/mascots/`
  with the shared mood keyframes in `mascots/motion.ts`.
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
  label plus several buttons must `flex-wrap` (see the builder's question
  header) — check `document.body.scrollWidth <= window.innerWidth` after
  layout changes.

## Verification

```bash
npm test          # dodge + validation + i18n + mascots + mail-content +
                  # mail-layout units (6 suites, 105 tests)
npm run build     # type check — succeeds without SMTP_PASSWORD; only sending
                   # mail needs it, not the build (send.ts creates its transport
                   # lazily on first sendMail() call, not at module import)
npm run dev       # then click the real flow in a browser
```

Don't run `npm run build` while `npm run dev` is up — the production build
overwrites `.next` and the dev server then 500s on missing chunks until you
`rm -rf .next` and restart. Use `npx tsc --noEmit` for a type check mid-session.

`npm run db:push` runs `prisma generate` afterwards, which fails with `EPERM` on
Windows if any dev server is holding `query_engine-windows.dll.node`. The
generated *types* are still written, so a type check is trustworthy; stop the
dev server if you need the engine swapped too.

Manual click-through is part of "done" here, per the spec's testing section, and
now repeats **per locale** (`he` RTL, `ru` LTR, `en` LTR): builder at `/{locale}`
(incl. switcher — three pills, active one a no-op — validation errors, all six
characters) → link → gate (try to catch "no") → questions → finale → answers
page → reload link (read-only recap). `/{locale}/new` is gone and must 404.
Also worth re-checking: `/{other-locale}/invite/{token}` and
`/{other-locale}/answers/{token}` redirect to the invitation's own locale; a
fresh visit with `Accept-Language: ru-RU` lands on `/ru`; an unknown locale
segment (`/de`) 404s (after one middleware hop that prefixes it, so
`/de/x` → `/he/de/x` → `404`); API edges — `409` on an already-answered token,
`404` on an unknown token, `400` with an `{ code }` body on an invalid draft.
With `SMTP_PASSWORD` configured, also confirm both notification emails actually
arrive.

Two things that reward measuring over eyeballing, because a desktop screenshot
hides both:

- **Mascot hearts.** Sample each `cheer` mascot's heart and character bounding
  boxes across the animation loop and assert the hearts never reach the top of
  the box and never overlap the character. A single screenshot catches one frame
  of a 1.6s loop.
- **Email width.** Render the six emails (3 locales × 2 kinds) into an iframe at
  390px and assert `body.scrollWidth <= documentElement.clientWidth`. They look
  perfect at 760px while overflowing badly on a phone.

## Housekeeping

- Screenshots from browser verification go to the scratchpad, **not** the repo root.
- Never commit or push without an explicit request.
