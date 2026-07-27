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
