"use client";

import { motion } from "framer-motion";

type Speck = {
  glyph: string;
  top: string;
  left: string;
  size: string;
  delay: number;
  rotate: number;
};

const SPECKS: Speck[] = [
  { glyph: "♥", top: "6%", left: "8%", size: "1.6rem", delay: 0, rotate: -12 },
  { glyph: "✿", top: "16%", left: "86%", size: "1.9rem", delay: 0.6, rotate: 14 },
  { glyph: "✦", top: "38%", left: "4%", size: "1.2rem", delay: 1.1, rotate: 0 },
  { glyph: "♥", top: "52%", left: "92%", size: "1.3rem", delay: 0.3, rotate: 18 },
  { glyph: "✿", top: "74%", left: "10%", size: "1.5rem", delay: 1.4, rotate: -8 },
  { glyph: "✦", top: "84%", left: "80%", size: "1.7rem", delay: 0.9, rotate: 10 },
  { glyph: "♥", top: "28%", left: "70%", size: "1.1rem", delay: 1.8, rotate: -20 },
  { glyph: "✦", top: "64%", left: "26%", size: "1rem", delay: 2.2, rotate: 6 },
];

/** Decorative floating hearts, flowers and sparkles. Never interactive. */
export function Sparkles() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden">
      {SPECKS.map((speck, index) => (
        <motion.span
          key={index}
          className="absolute text-rose-soft/45"
          style={{ top: speck.top, left: speck.left, fontSize: speck.size }}
          animate={{ y: [0, -14, 0], rotate: [speck.rotate, speck.rotate + 12, speck.rotate] }}
          transition={{
            duration: 5 + index * 0.4,
            delay: speck.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {speck.glyph}
        </motion.span>
      ))}
    </div>
  );
}
