# Remove the home page (dashboard) — 2026-07-28

## Why

The dashboard at `/{locale}` listed **every** invitation with its recipient,
status and full answer recap. The app has no auth, so on a deployment anyone
who reached the root URL saw all of it. The two notification emails (share
link on create, recap + answers-page link on answer) already cover everything
the dashboard did for the creator.

## Decision (approved)

Builder becomes the home page. Approaches considered:

- **A (chosen):** builder moves into `/{locale}/page.tsx`; `/new` and the
  dashboard are deleted outright.
- B: keep `/new`, redirect `/` there — two routes for one page, no gain.
- C: dashboard survives at a secret path — rejected, emails already cover it.

## Changes

- `src/app/[locale]/page.tsx` — now the builder page (was the dashboard).
  No DB access, no `force-dynamic`.
- Deleted: `src/app/[locale]/new/`, `src/components/DashboardList.tsx`.
- Dictionaries (he/ru/en): removed all 15 `dashboard.*` keys, `builder.back`,
  `answers.back`; renamed `builder.done.back` → `builder.done.another`
  ("create another invitation"); added `footer.credit` / `footer.github`.
- `BuilderForm` success screen: the "create another" link is a plain `<a>`
  to `/{locale}` — the builder lives at that URL now, so a `<Link>` would be
  a same-route navigation that keeps the success state mounted instead of
  re-seeding a fresh draft.
- Answers page: dropped the "back to all invitations" link (nothing to go
  back to).
- `src/app/[locale]/layout.tsx`: site-wide footer — "by yonka" + GitHub-icon
  link to <https://github.com/yonka2019/SayYes> (requested mid-task). Body is
  `flex min-h-screen flex-col` so the footer sits at the bottom.

## Verification done

- `npm test` — 6 suites, 105 tests pass (i18n parity test covers the
  dictionary key changes).
- `npx tsc --noEmit` — clean (after clearing stale `.next/types` for the
  deleted `/new` route).
- Browser at 390px: `/` → locale-detected builder; `/he` RTL + `/ru`/`/en`
  LTR render the builder with the footer and GitHub link, no horizontal
  overflow; `/he/new` 404s; unknown answers token shows the not-found card
  with no dangling links.
