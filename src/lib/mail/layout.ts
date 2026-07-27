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
export const FONT = "'Rubik', 'Heebo', 'Segoe UI', Arial, sans-serif";

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
