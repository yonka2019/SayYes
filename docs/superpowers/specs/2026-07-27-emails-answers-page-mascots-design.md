# Design — HTML emails, answers page, language pills, six mascots

Date: 2026-07-27

Five changes, requested together:

1. Both notification emails become designed HTML instead of plain text.
2. The answered email links to a page showing that invitation's answers, not the
   dashboard.
3. The language switcher shows all three languages instead of cycling through
   them.
4. Four more characters, for six total.
5. The `cheer` heart currently clips at the top of the mascot box and lands on
   the character's head. Fixed.

Decisions taken with the user are recorded inline as **Decision:** lines.

---

## 1. HTML emails

### New module: `src/lib/mail/layout.ts`

Pure string builders, no new dependency.

**Decision:** hand-written table HTML rather than adding `react-email`. Tables
with inline styles are the only thing Gmail, Outlook and Apple Mail all render
predictably, and the module stays unit testable exactly like `mail/content.ts`
is today.

- `escapeHtml(value: string): string` — escapes `& < > " '`. **Every**
  creator-typed string (`recipientName`, question texts, option labels) passes
  through it before reaching the HTML. These are stored verbatim and never
  sanitised on the way in, so this is the only thing standing between a name
  containing `<` and broken (or hostile) markup in the creator's inbox.
- `emailShell({ locale, preheader, headerEmoji, body }): string` — the full
  document:
  - Blush `#FFF0F5` outer wash, 600px centred card, `border-radius: 28px`,
    white body panel.
  - Rose header panel carrying the mascot emoji at 64px. Uses
    `bgcolor="#E84A7F"` **and** `background-image: linear-gradient(180deg,
    #FF6BA0, #E84A7F)` — Outlook desktop drops the gradient and keeps the solid.
  - Hidden preheader span (`display:none; max-height:0; overflow:hidden`) so the
    inbox preview line is deliberate rather than scraped from the body.
  - `dir` and `lang` on `<html>` and on the card table, from `DIR[locale]`.
    Hebrew mail is RTL; `ru`/`en` are LTR.
  - Font stack is system-only: `'Rubik', 'Heebo', 'Segoe UI', Arial,
    sans-serif`. No `@font-face` — webfonts do not load in most mail clients, so
    the fallback is what actually renders and should be chosen on purpose.
  - Colours are solid hex, never `rgba()` — alpha support is unreliable. The
    muted question colour is `#A85B76`, a flattened `rose-ink` at ~70%.
- `button({ href, label }): string` — single-cell table ("bulletproof") button,
  `bgcolor="#E84A7F"`, white `<a>` with `text-decoration:none`. `border-radius`
  degrades to square corners in Outlook desktop; accepted.
- `recapTable({ items, dir }): string` — one blush row per question: question
  text in `#A85B76`, chosen answer bold in `#E84A7F`, cell `align` derived from
  `dir`.
- `linkFallback({ href }): string` — the raw URL as selectable text under the
  button. Some clients strip or mangle buttons, and for the created email the
  creator's whole job is to copy that link.
- `footer(text: string): string` — one small muted line.

### `src/lib/mail/content.ts`

- `EmailContent` becomes `{ subject: string; text: string; html: string }`.
- `createdEmail({ locale, recipientName, mascot, link })` — gains `mascot` so
  the header emoji matches the character the creator picked.
- `answeredEmail({ locale, recipientName, mascot, link, recap })` — gains
  `mascot` and `recap: RecapItem[]`.
- The plain-text part stays and remains the multipart fallback. The answered
  text part gains the recap as `question — answer` lines, so a text-only client
  still shows the answers.

**Decision:** the answered email now contains the answers. This reverses the
existing rule in `CLAUDE.md` ("no answer recap"), which was a deliberate choice
at the time. `CLAUDE.md` is updated as part of this work rather than left
contradicting the code.

### `src/lib/mail/send.ts`

`sendMail({ to, subject, text, html })` — `html` required. Passing both parts
makes nodemailer emit `multipart/alternative`. Only two call sites, both updated.
The lazy-transport behaviour is untouched: it must stay lazy so `npm run build`
does not require `SMTP_PASSWORD`.

### Dictionary keys

Added to all three dictionaries. `he.ts` is the source of truth and `ru.ts` /
`en.ts` are typed `: Dictionary`, so a missing translation is a build error.
`tests/i18n.test.ts` additionally asserts identical key sets and identical
`{placeholder}` sets per key.

```
email.created.heading      email.answered.heading
email.created.intro        email.answered.intro
email.created.cta          email.answered.recapTitle
email.created.linkHint     email.answered.cta
email.preheader.created    email.preheader.answered
email.footer
```

Existing `email.created.subject|body` and `email.answered.subject|body` are kept
— they are the subject line and the plain-text part.

---

## 2. Answers page

### `src/app/[locale]/answers/[token]/page.tsx`

`export const dynamic = "force-dynamic"`, matching the other two dynamic pages.

**Decision:** a dedicated page, not a dashboard deep-link. The creator clicking
from their inbox wants one invitation, and the dashboard loads every invitation
to show it.

Flow, in order:

1. `await params` (Next 15 — `params` is a Promise). `isLocale(locale)` fails →
   `notFound()`.
2. `prisma.invitation.findUnique` with questions (ordered), options (ordered),
   and answers including `selectedOption`.
3. No invitation → the cute "missing" card, matching the invite page's
   `MissingInvitation` rather than a bare 404. A creator following an old link
   should land somewhere styled.
4. `invitation.locale !== locale` → `redirect()` to
   `/{invitation.locale}/answers/{token}`. Same rule the invite page already
   enforces: an invitation owns its locale, so content and chrome never mix
   languages.
5. Status `PENDING` → waiting card: mascot `idle`, "still waiting for {name}",
   button through to the invite link. Reachable if a creator bookmarks the page
   or opens a stale link, so it must not be a dead end.
6. Status `ANSWERED` → `CuteCard` with the invitation's mascot at `cheer`,
   heading with the recipient's name, the answered timestamp formatted with
   `DATE_LOCALE`, `RecapCard` with the answers, and a link back to the
   dashboard.

No `LanguageSwitcher` renders here — the recap is creator content in the
invitation's language, and a switch could only produce a mixed-language page.
Same reasoning as the invite page.

### `src/app/api/invitations/[token]/answers/route.ts`

The notification link changes from `${origin}/${locale}` to
`${origin}/${locale}/answers/${invitation.id}`. Nothing else in that route
changes — the rollback-on-email-failure behaviour stays as is.

`src/middleware.ts` needs no change: `/{locale}/answers/{token}` already carries
a locale prefix, and the matcher only excludes `/api` and static assets.

### Dictionary keys

```
answers.title            answers.waiting.title    answers.missing.title
answers.answeredAt       answers.waiting.text     answers.missing.text
answers.recapTitle       answers.waiting.cta
answers.back
```

---

## 3. Language switcher shows options

**Decision:** inline pills, all three visible — not a dropdown. With only three
locales a popover would add open/close state, click-outside, Escape and arrow-key
handling for no gain.

`src/components/LanguageSwitcher.tsx` is rewritten:

- Container is `role="group"` with `aria-label={t(dict, "switcher.label")}`, a
  `rounded-2xl bg-white/70 p-1 flex flex-wrap gap-1` shell, and an `aria-hidden`
  globe.
- One `<button>` per entry in `LOCALES`, each with `lang={code}` so the endonym
  gets correct shaping, labelled with `LOCALE_NAMES[code]`.
- The active pill is `bg-rose-deep text-white` with `aria-current="true"`, and
  its click is a no-op.
- An inactive pill writes the `sayyes_locale` cookie then
  `router.replace(swapLocale(pathname, code))` — the same two steps the cycling
  version did, so `swapLocale`'s existing unit tests still cover the navigation.
- `flex-wrap` plus a check that `document.body.scrollWidth <=
  window.innerWidth` at 390px.

---

## 4. Six characters

**Decision:** add `BUNNY`, `CAT`, `FOX`, `PANDA` to the existing `BEAR` and
`PENGUIN`.

**Decision:** additive enum change only. Existing rows keep the mascot their
creator picked; nothing is reshuffled.

### Schema

`prisma/schema.prisma`: `enum Mascot { BEAR PENGUIN BUNNY CAT FOX PANDA }`,
applied with `npm run db:push`. `MascotKind` in `src/lib/types.ts` widens to
match.

### New module: `src/lib/mascots.ts`

The single place that enumerates characters:

- `MASCOT_KINDS: MascotKind[]` — also the builder's display order.
- `MASCOT_NAME_KEY: Record<MascotKind, MessageKey>`
- `MASCOT_EMOJI: Record<MascotKind, string>` — for the email headers.

This replaces the `mascotKey` ternary currently duplicated in three files
(`BuilderForm.tsx`, `DashboardList.tsx`, the invite page), which cannot express
six values, and the local `MASCOT_KINDS` array in `BuilderForm.tsx` and
`MASCOTS` array in `api/invitations/route.ts`. A unit test asserts every
`MascotKind` has both a name key and an emoji, so the registry cannot fall
behind the union at runtime.

### Components

`src/components/Mascot.tsx` is 195 lines for two characters; six would push it
past 400. It splits:

- `src/components/mascots/{Bear,Penguin,Bunny,Cat,Fox,Panda}.tsx` — one
  character each, drawn in the existing idiom: plain SVG primitives, the waving
  limb animated with `armMotion[mood]`, blush cheeks driven by `blushOpacity`.
- `src/components/mascots/motion.ts` — the shared `bodyMotion`, `bodyTiming`,
  `armMotion` keyframe tables and the part props type.
- `Mascot.tsx` keeps the SVG shell, `HeartPop`, and swaps its
  `kind === "BEAR" ? … : …` ternary for a `Record<MascotKind, …>` lookup.

### Builder picker

`grid-cols-2` becomes `grid-cols-2 sm:grid-cols-3`, and the preview size drops
from 110 to 96 so three fit at 390px without the row overflowing.

### Dictionary keys

`mascot.bunny`, `mascot.cat`, `mascot.fox`, `mascot.panda`, in all three
dictionaries.

---

## 5. Heart collision fix

Two real defects in `HeartPop`, confirmed against the path geometry:

- It animates `y: [8, -6, -16, -28]`. That is a translate, so the heart ends
  near y ≈ -20 — **outside** the `0 0 200 200` viewBox, which clips it. The
  heart is visibly sliced off as it rises.
- At rest it spans y 8–34 at x 80–120. The bear's head crown is at y=39
  (`cy=95 r=56`) and its ear tops at y=27, so the heart sits on the character.
  The penguin's body top is y=46 — less contact, same clipping.

Root cause: the characters fill the whole box, so the heart has nowhere to go.

**Decision:** give the box headroom rather than squeeze the heart into the
corner gutters.

- The SVG shell becomes `viewBox="0 -44 200 244"` with `width={size}` and
  `height={Math.round(size * 1.22)}`. Every character's coordinates and rendered
  width are untouched; the 44 units above y=0 are pure empty space.
- `HeartPop` becomes three staggered hearts at x 72, 100 and 128, travelling
  from y ≈ 6 up to y ≈ -40. Nothing crosses y=27 (the bear's ear tops) and
  nothing leaves the box.
- It still renders only for `mood === "cheer"`, which is the builder's done
  card, the invite finale, and the new answers page.
- The whole-SVG `bodyMotion.cheer` bounce is a CSS transform on the element, not
  a viewBox change, so it never clipped and is left alone.

**New invariant**, to be recorded in `CLAUDE.md`: characters stay within y 0–200;
the band above y=0 belongs to the hearts. This also gives the bunny's tall ears
somewhere to live.

Cost: every mascot renders ~22% taller. Affected call sites are sizes 190, 180,
170, 150, 110→96 and 56, all inside `w-fit` / `place-items-center` / `shrink-0`
containers. Dashboard rows go from 56px to ~68px tall and `CuteCard`'s
`min-h-56` panel grows slightly. Both are verified visually rather than assumed.

---

## Build order

Dependencies run one way, so:

1. `src/lib/mascots.ts` registry, schema enum + `db:push`, the six character
   components, the heart fix, the builder picker.
2. The language pills (independent of everything else).
3. The answers page and the API link change.
4. The emails last — they consume the recap shape, the emoji map, and the
   answers URL.

## Verification

- `npm test` — existing four suites, plus: `escapeHtml` against `<script>` and
  `&` inputs, the recap appearing in **both** the HTML and text parts,
  `dir="rtl"` present only for `he`, and registry exhaustiveness over
  `MascotKind`.
- `npm run build` — type check. Must still succeed with no `SMTP_PASSWORD`.
- Email rendering: write both HTML bodies to the scratchpad and open them in a
  browser per locale, at 390px and desktop, to confirm the RTL layout and the
  recap rows. A real send if `SMTP_PASSWORD` is configured.
- Manual click-through per locale (`he` RTL, `ru`, `en`): dashboard → pills →
  builder with all six characters → link → gate → questions → finale (check the
  heart against every character) → answers page → back to dashboard. Plus the
  existing edge checks: `/{other-locale}/answers/{token}` redirects,
  `/{other-locale}/invite/{token}` redirects, unknown locale is a 404, unknown
  token is the missing card, 409 on an already-answered token.
- `document.body.scrollWidth <= window.innerWidth` at 390px on the dashboard,
  the builder and the answers page.
- Screenshots to the scratchpad, not the repo root.

## Documentation

`CLAUDE.md`: the answered-email rule flips to "includes the recap"; the mascot
rule gains the four characters and the registry; a new mascot-geometry
invariant; the new page and its locale-ownership redirect; `mail/layout.ts` and
the escaping requirement; the switcher is pills, not a cycle. `README.md` synced
with the same changes.

## Out of scope

Unchanged: no auth, no invitation editing after generation, answers stay
multiple-choice only (2–4 options), one answer set per invitation, the
rollback-on-email-failure behaviour in both API routes, and the lazy SMTP
transport.
