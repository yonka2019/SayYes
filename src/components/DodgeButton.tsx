"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import {
  PLEA_KEYS,
  PROXIMITY_RADIUS,
  nextDodgeOffset,
  nextFleeOffset,
  pleaKeyForCatches,
  scaleForCatches,
  type Limit,
  type Offset,
} from "@/lib/dodge";

/** Don't re-flee more than this often, or a single sweep becomes a jitter storm. */
const FLEE_COOLDOWN_MS = 90;

/**
 * The "no" button. It bolts away from the cursor as soon as it gets close —
 * it doesn't wait to be hovered — and every click that does land shrinks it and
 * escalates a little plea, so catching it again is harder each time.
 */
export function DodgeButton({
  label,
  pleas,
  onDodge,
}: {
  label: string;
  /** Already-translated pleas, in `PLEA_KEYS` order — longest-suffering last. */
  pleas: readonly string[];
  onDodge?: () => void;
}) {
  const slot = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const lastFleeAt = useRef(0);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [catches, setCatches] = useState(0);

  /** Half-extents the button may wander in, measured from its slot. */
  const limitOf = useCallback((): Limit => {
    const slotEl = slot.current;
    const buttonEl = button.current;
    if (!slotEl || !buttonEl) return { x: 80, y: 34 };
    return {
      x: Math.max(10, (slotEl.clientWidth - buttonEl.offsetWidth) / 2),
      y: Math.max(10, (slotEl.clientHeight - buttonEl.offsetHeight) / 2),
    };
  }, []);

  /** Blind hop — keyboard focus and anything with no cursor position. */
  const hop = useCallback(() => {
    setOffset((current) => nextDodgeOffset(current, limitOf()));
    onDodge?.();
  }, [limitOf, onDodge]);

  /** Directed escape away from a cursor at `cursor` (slot-centre coordinates). */
  const flee = useCallback(
    (cursor: Offset) => {
      setOffset((current) => nextFleeOffset(current, limitOf(), cursor));
      onDodge?.();
    },
    [limitOf, onDodge]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Touch has no hover, so let taps be the catch attempt instead.
      if (event.pointerType === "touch") return;

      const slotEl = slot.current;
      if (!slotEl) return;

      const rect = slotEl.getBoundingClientRect();
      const cursor: Offset = {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      };

      // Distance from the cursor to where the button actually sits.
      if (Math.hypot(cursor.x - offset.x, cursor.y - offset.y) > PROXIMITY_RADIUS) return;

      const now = event.timeStamp;
      if (now - lastFleeAt.current < FLEE_COOLDOWN_MS) return;
      lastFleeAt.current = now;

      flee(cursor);
    },
    [flee, offset]
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      // She got it — shrink it, then get out of there.
      setCatches((count) => count + 1);

      const slotEl = slot.current;
      if (!slotEl) {
        hop();
        return;
      }
      const rect = slotEl.getBoundingClientRect();
      flee({
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      });
    },
    [flee, hop]
  );

  const pleaKey = pleaKeyForCatches(catches);
  const plea = pleaKey ? pleas[PLEA_KEYS.indexOf(pleaKey)] : null;

  return (
    <div
      ref={slot}
      onPointerMove={handlePointerMove}
      className="relative min-h-40 w-full"
    >
      <AnimatePresence mode="wait">
        {plea && (
          <motion.p
            key={plea}
            aria-live="polite"
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-x-0 top-0 text-center text-sm font-bold text-rose-deep/80"
          >
            {plea}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        ref={button}
        type="button"
        onClick={handleClick}
        onFocus={hop}
        animate={{ x: offset.x, y: offset.y, scale: scaleForCatches(catches) }}
        transition={{ type: "spring", stiffness: 550, damping: 22, mass: 0.5 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-rose-soft bg-white px-10 py-3.5 text-xl font-bold text-rose-deep shadow-[0_8px_18px_-10px_rgba(232,74,127,0.5)]"
      >
        {label}
      </motion.button>
    </div>
  );
}
