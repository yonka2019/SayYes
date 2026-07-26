/**
 * Dodge math for the "no" button.
 *
 * The svidos reference does a *small* hop (~20-50px) to a nearby spot on every
 * hover — not an escalating full-screen chase. This module is the whole rule
 * set for that, kept pure so it can be unit tested without a DOM.
 */

export type Offset = { x: number; y: number };

/** Half-extents of the box the button may wander inside, in px. */
export type Limit = { x: number; y: number };

export const MIN_HOP = 20;
export const MAX_HOP = 50;

/** A flee is a longer, directed bolt away from the cursor. */
export const MIN_FLEE = 55;
export const MAX_FLEE = 110;

/** How close the cursor may get before the button bolts, in px. */
export const PROXIMITY_RADIUS = 130;

/** Each successful catch shrinks it by this factor, down to MIN_SCALE. */
export const SHRINK_PER_CATCH = 0.82;
export const MIN_SCALE = 0.3;

/** How many directions we try before deciding the box is too tight to hop in. */
const DIRECTION_TRIES = 16;

const TAU = Math.PI * 2;

const inside = (candidate: Offset, limit: Limit) =>
  Math.abs(candidate.x) <= limit.x && Math.abs(candidate.y) <= limit.y;

/**
 * Slide to a box corner when the box is smaller than a single hop, so the
 * button still visibly moves instead of freezing under the cursor.
 */
function cornerEscape(current: Offset, limit: Limit, angle: number): Offset {
  const corner: Offset = {
    x: Math.cos(angle) >= 0 ? limit.x : -limit.x,
    y: Math.sin(angle) >= 0 ? limit.y : -limit.y,
  };
  if (Math.hypot(corner.x - current.x, corner.y - current.y) > 0.001) return corner;

  const opposite: Offset = { x: -corner.x, y: -corner.y };
  if (Math.hypot(opposite.x - current.x, opposite.y - current.y) > 0.001) return opposite;

  return current; // Box has no room at all — nothing sensible to do.
}

/**
 * Next resting offset for the dodging button.
 *
 * @param current position it sits at now, relative to its layout slot
 * @param limit   half-extents it must stay within
 * @param rand    injectable randomness, so tests are deterministic
 */
export function nextDodgeOffset(
  current: Offset,
  limit: Limit,
  rand: () => number = Math.random
): Offset {
  const hop = MIN_HOP + rand() * (MAX_HOP - MIN_HOP);
  const baseAngle = rand() * TAU;

  for (let i = 0; i < DIRECTION_TRIES; i++) {
    const angle = baseAngle + (i * TAU) / DIRECTION_TRIES;
    const candidate: Offset = {
      x: current.x + Math.cos(angle) * hop,
      y: current.y + Math.sin(angle) * hop,
    };
    if (inside(candidate, limit)) return candidate;
  }

  return cornerEscape(current, limit, baseAngle);
}

/**
 * Angles to try, nearest to `preferred` first, so a blocked flee direction
 * degrades into the closest direction that still fits in the box — it keeps
 * running away rather than turning back into the cursor.
 */
function anglesNearest(preferred: number): number[] {
  const step = TAU / DIRECTION_TRIES;
  const angles = [preferred];
  for (let i = 1; i <= DIRECTION_TRIES / 2; i++) {
    angles.push(preferred + i * step, preferred - i * step);
  }
  return angles;
}

/**
 * Next offset when the cursor is closing in: bolt directly away from it, with a
 * little jitter so it doesn't feel mechanical.
 *
 * @param current position it sits at now, relative to its layout slot
 * @param limit   half-extents it must stay within
 * @param cursor  cursor position in the same coordinate space as `current`
 * @param rand    injectable randomness, so tests are deterministic
 */
export function nextFleeOffset(
  current: Offset,
  limit: Limit,
  cursor: Offset,
  rand: () => number = Math.random
): Offset {
  const awayX = current.x - cursor.x;
  const awayY = current.y - cursor.y;

  const hop = MIN_FLEE + rand() * (MAX_FLEE - MIN_FLEE);
  // Cursor exactly on top of it gives no direction to flee — pick one.
  const away =
    awayX === 0 && awayY === 0 ? rand() * TAU : Math.atan2(awayY, awayX);
  // ±25° of jitter keeps the escape from looking scripted, while staying in the
  // away-from-cursor half-plane.
  const jitter = (rand() - 0.5) * (Math.PI / 3.6);

  for (const angle of anglesNearest(away + jitter)) {
    const candidate: Offset = {
      x: current.x + Math.cos(angle) * hop,
      y: current.y + Math.sin(angle) * hop,
    };
    if (inside(candidate, limit)) return candidate;
  }

  return cornerEscape(current, limit, away);
}

/** Size multiplier after `catches` successful clicks. Never reaches zero. */
export function scaleForCatches(catches: number): number {
  return Math.max(MIN_SCALE, SHRINK_PER_CATCH ** catches);
}

/**
 * Escalating pleas shown once she starts landing clicks on the dodge button.
 * Keys, not sentences — the strings live in the dictionaries so all three
 * languages escalate the same way.
 */
export const PLEA_KEYS = ["plea.1", "plea.2", "plea.3", "plea.4", "plea.5"] as const;

export type PleaKey = (typeof PLEA_KEYS)[number];

/** The plea key for `catches` clicks — nothing before the first, clamped at the last. */
export function pleaKeyForCatches(catches: number): PleaKey | null {
  if (catches < 1) return null;
  return PLEA_KEYS[Math.min(catches, PLEA_KEYS.length) - 1];
}
