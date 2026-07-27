import { DIR, type Locale } from "@/lib/i18n/locales";
import { getDictionary, t } from "@/lib/i18n/t";
import { MASCOT_EMOJI } from "@/lib/mascots";
import type { MascotKind, RecapItem } from "@/lib/types";
import {
  FONT,
  button,
  emailShell,
  escapeHtml,
  footer,
  linkFallback,
  recapTable,
} from "./layout";

export type EmailContent = { subject: string; text: string; html: string };

function heading(text: string): string {
  return `<h1 style="margin:0;text-align:center;font-family:${FONT};font-size:26px;font-weight:bold;color:#E84A7F;">${escapeHtml(text)}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:14px 0 24px 0;text-align:center;font-family:${FONT};font-size:16px;color:#8A2C4D;">${escapeHtml(text)}</p>`;
}

const spacer = `<div style="height:24px;line-height:24px;font-size:0;">&nbsp;</div>`;

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

  const body = [
    heading(t(dict, "email.answered.heading", { name: recipientName })),
    paragraph(t(dict, "email.answered.intro")),
    // "" when there are no answers, so the layout closes up rather than
    // rendering an empty table.
    recapTable({ items: recap, dir: DIR[locale] }),
    spacer,
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
