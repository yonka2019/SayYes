"use client";

import { motion } from "framer-motion";
import type { MascotKind, MascotMood } from "@/lib/types";

type Keyframes = { y?: number[]; rotate?: number | number[] };

const bodyMotion: Record<MascotMood, Keyframes> = {
  idle: { y: [0, -6, 0], rotate: 0 },
  blush: { y: [0, -3, 0], rotate: [0, -3, 3, 0] },
  wave: { y: [0, -5, 0], rotate: [0, 2, -2, 0] },
  cheer: { y: [0, -20, 0], rotate: [0, -5, 5, 0] },
};

const bodyTiming: Record<MascotMood, { duration: number }> = {
  idle: { duration: 2.6 },
  blush: { duration: 0.7 },
  wave: { duration: 1.1 },
  cheer: { duration: 0.75 },
};

const armMotion: Record<MascotMood, { rotate: number[] }> = {
  idle: { rotate: [0, 6, 0] },
  blush: { rotate: [0, -10, 0] },
  wave: { rotate: [0, -55, -10, -55, 0] },
  cheer: { rotate: [0, -70, -40, -70, 0] },
};

function HeartPop({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <motion.path
      d="M100 8c-5-9-20-7.5-20 4 0 9 11.5 15.5 20 22 8.5-6.5 20-13 20-22 0-11.5-15-13-20-4z"
      fill="#FF3D77"
      initial={{ opacity: 0, y: 8, scale: 0.4 }}
      animate={{ opacity: [0, 1, 1, 0], y: [8, -6, -16, -28], scale: [0.4, 1, 1, 0.7] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

function Bear({ blushOpacity, mood }: { blushOpacity: number; mood: MascotMood }) {
  return (
    <>
      {/* body */}
      <ellipse cx="100" cy="155" rx="45" ry="34" fill="#C98A5E" />
      <ellipse cx="100" cy="160" rx="29" ry="24" fill="#F7E0CB" />

      {/* arms — the right one waves */}
      <motion.ellipse
        cx="50"
        cy="150"
        rx="13"
        ry="21"
        fill="#B87A4F"
        animate={{ rotate: mood === "idle" ? [0, -5, 0] : [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "54px", originY: "134px" }}
      />
      <motion.ellipse
        cx="150"
        cy="150"
        rx="13"
        ry="21"
        fill="#B87A4F"
        animate={armMotion[mood]}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "146px", originY: "134px" }}
      />

      {/* ears */}
      <circle cx="60" cy="48" r="21" fill="#C98A5E" />
      <circle cx="60" cy="48" r="11" fill="#F3C9A8" />
      <circle cx="140" cy="48" r="21" fill="#C98A5E" />
      <circle cx="140" cy="48" r="11" fill="#F3C9A8" />

      {/* head */}
      <circle cx="100" cy="95" r="56" fill="#C98A5E" />
      <ellipse cx="100" cy="117" rx="32" ry="24" fill="#F7E0CB" />
      <ellipse cx="100" cy="107" rx="10" ry="7" fill="#6B4A38" />
      <path
        d="M100 114c0 7-6.5 8.5-10 4.5M100 114c0 7 6.5 8.5 10 4.5"
        stroke="#6B4A38"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* eyes */}
      <circle cx="78" cy="86" r="7" fill="#4A2E20" />
      <circle cx="122" cy="86" r="7" fill="#4A2E20" />
      <circle cx="80.5" cy="83" r="2.5" fill="#fff" />
      <circle cx="124.5" cy="83" r="2.5" fill="#fff" />

      {/* blush */}
      <ellipse cx="60" cy="107" rx="12" ry="7.5" fill="#FF7FA6" opacity={blushOpacity} />
      <ellipse cx="140" cy="107" rx="12" ry="7.5" fill="#FF7FA6" opacity={blushOpacity} />
    </>
  );
}

function Penguin({ blushOpacity, mood }: { blushOpacity: number; mood: MascotMood }) {
  return (
    <>
      {/* feet */}
      <ellipse cx="80" cy="180" rx="18" ry="8" fill="#FFA23E" />
      <ellipse cx="120" cy="180" rx="18" ry="8" fill="#FFA23E" />

      {/* flippers — the right one waves */}
      <motion.ellipse
        cx="38"
        cy="142"
        rx="10"
        ry="24"
        fill="#1B2438"
        animate={{ rotate: mood === "idle" ? [0, -6, 0] : [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "32px", originY: "108px" }}
      />
      <motion.ellipse
        cx="162"
        cy="142"
        rx="10"
        ry="24"
        fill="#1B2438"
        animate={armMotion[mood]}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "168px", originY: "108px" }}
      />

      {/* body + belly */}
      <ellipse cx="100" cy="116" rx="62" ry="70" fill="#2F3A56" />
      <ellipse cx="100" cy="128" rx="45" ry="55" fill="#FFFDF8" />

      {/* eye patches + eyes */}
      <ellipse cx="82" cy="92" rx="15" ry="18" fill="#FFFDF8" />
      <ellipse cx="118" cy="92" rx="15" ry="18" fill="#FFFDF8" />
      <circle cx="83" cy="95" r="7.5" fill="#243043" />
      <circle cx="117" cy="95" r="7.5" fill="#243043" />
      <circle cx="85.5" cy="92" r="2.6" fill="#fff" />
      <circle cx="119.5" cy="92" r="2.6" fill="#fff" />

      {/* beak */}
      <path d="M100 108l-14 10 14 10 14-10z" fill="#FFA23E" />

      {/* blush */}
      <ellipse cx="63" cy="116" rx="12" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
      <ellipse cx="137" cy="116" rx="12" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
    </>
  );
}

/**
 * Bear or penguin, reacting with small animations at the key moments:
 * hovering "לא" (blush), picking an answer (wave), the finale (cheer).
 */
export function Mascot({
  kind,
  mood = "idle",
  size = 180,
  className = "",
}: {
  kind: MascotKind;
  mood?: MascotMood;
  size?: number;
  className?: string;
}) {
  const blushOpacity = mood === "blush" || mood === "cheer" ? 0.95 : 0.4;

  return (
    <motion.svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={kind === "BEAR" ? "דובי" : "פינגווין"}
      animate={bodyMotion[mood]}
      transition={{ ...bodyTiming[mood], repeat: Infinity, ease: "easeInOut" }}
    >
      <ellipse cx="100" cy="188" rx="52" ry="9" fill="rgba(90,20,45,0.18)" />
      {kind === "BEAR" ? (
        <Bear blushOpacity={blushOpacity} mood={mood} />
      ) : (
        <Penguin blushOpacity={blushOpacity} mood={mood} />
      )}
      <HeartPop show={mood === "cheer"} />
    </motion.svg>
  );
}
