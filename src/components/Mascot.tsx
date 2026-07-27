"use client";

import { motion } from "framer-motion";
import { Bear } from "@/components/mascots/Bear";
import { Penguin } from "@/components/mascots/Penguin";
import { bodyMotion, bodyTiming, type MascotPartProps } from "@/components/mascots/motion";
import type { MascotKind, MascotMood } from "@/lib/types";

/**
 * Empty space above the character, in viewBox units. The hearts rise into it.
 *
 * Without it the hearts had nowhere to go: the characters fill y 0-200, so the
 * old hearts both sat on the head (the bear's ear tops are at y=27) and got
 * clipped, because they animated to a negative y outside the viewBox. Every
 * character must stay inside y 0-200 and leave this band alone.
 */
const HEADROOM = 44;

const ART: Record<MascotKind, (props: MascotPartProps) => React.ReactElement> = {
  BEAR: Bear,
  PENGUIN: Penguin,
};

/**
 * Three hearts, staggered, drawn around their own origin so `x`/`y` place them.
 * Kept off-centre (72/100/128) so even the lowest frame misses the crown.
 */
const HEARTS = [
  { x: 72, delay: 0 },
  { x: 100, delay: 0.35 },
  { x: 128, delay: 0.7 },
];

const HEART_PATH =
  "M0 -8c-5-9-20-7.5-20 4 0 9 11.5 15.5 20 22 8.5-6.5 20-13 20-22 0-11.5-15-13-20-4z";

function HeartPop({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <>
      {HEARTS.map(({ x, delay }) => (
        <motion.path
          key={x}
          d={HEART_PATH}
          fill="#FF3D77"
          initial={{ opacity: 0, x, y: -6, scale: 0.3 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x,
            // Stays inside the headroom band: lowest point ≈ y 7, top ≈ y -39.
            y: [-6, -16, -24, -30],
            scale: [0.3, 0.75, 0.7, 0.5],
          }}
          transition={{ duration: 1.6, delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </>
  );
}

/**
 * One of the characters, reacting with small animations at the key moments:
 * a dodge (blush), picking an answer (wave), the finale (cheer).
 *
 * `label` is required rather than defaulted — the accessible name has to be in
 * the viewer's language, which only the caller knows.
 *
 * The box is taller than it is wide because of `HEADROOM`; `size` is the width.
 */
export function Mascot({
  kind,
  mood = "idle",
  size = 180,
  label,
  className = "",
}: {
  kind: MascotKind;
  mood?: MascotMood;
  size?: number;
  label: string;
  className?: string;
}) {
  const blushOpacity = mood === "blush" || mood === "cheer" ? 0.95 : 0.4;
  const Art = ART[kind];

  return (
    <motion.svg
      viewBox={`0 -${HEADROOM} 200 ${200 + HEADROOM}`}
      width={size}
      height={Math.round((size * (200 + HEADROOM)) / 200)}
      className={className}
      role="img"
      aria-label={label}
      animate={bodyMotion[mood]}
      transition={{ ...bodyTiming[mood], repeat: Infinity, ease: "easeInOut" }}
    >
      <ellipse cx="100" cy="188" rx="52" ry="9" fill="rgba(90,20,45,0.18)" />
      <Art blushOpacity={blushOpacity} mood={mood} />
      <HeartPop show={mood === "cheer"} />
    </motion.svg>
  );
}
