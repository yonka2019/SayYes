import type { Locale } from "@/lib/i18n/locales";
import { getDictionary, t } from "@/lib/i18n/t";

export type EmailContent = { subject: string; text: string };

/**
 * Sent to the creator right after `POST /api/invitations` succeeds. Contains
 * the share link so they can forward it without going back to the app.
 */
export function createdEmail({
  locale,
  recipientName,
  link,
}: {
  locale: Locale;
  recipientName: string;
  link: string;
}): EmailContent {
  const dict = getDictionary(locale);
  return {
    subject: t(dict, "email.created.subject", { name: recipientName }),
    text: t(dict, "email.created.body", { name: recipientName, link }),
  };
}

/**
 * Sent to the creator once the recipient submits their answers. Deliberately
 * just a heads-up + dashboard link, not a full recap — the dashboard already
 * renders one.
 */
export function answeredEmail({
  locale,
  recipientName,
  link,
}: {
  locale: Locale;
  recipientName: string;
  link: string;
}): EmailContent {
  const dict = getDictionary(locale);
  return {
    subject: t(dict, "email.answered.subject", { name: recipientName }),
    text: t(dict, "email.answered.body", { name: recipientName, link }),
  };
}
