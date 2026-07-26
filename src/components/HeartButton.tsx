"use client";

import { motion } from "framer-motion";

/**
 * The heart-shaped "כן" button from the reference, with a soft heartbeat.
 *
 * Drawn as SVG rather than rotated pseudo-elements so RTL can't flip it, and
 * the pulse animates an inner wrapper so the button's own hit box never moves.
 */
const heartVariants = {
  idle: {
    scale: [1, 1.05, 1],
    transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
  },
  hover: { scale: 1.09, transition: { duration: 0.18 } },
  tap: { scale: 0.94, transition: { duration: 0.1 } },
};

export function HeartButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      initial="idle"
      animate="idle"
      whileHover="hover"
      whileTap="tap"
      className="relative block h-40 w-44"
    >
      <motion.span
        variants={heartVariants}
        className="absolute inset-0 block drop-shadow-[0_12px_22px_rgba(232,74,127,0.45)]"
      >
        <svg viewBox="0 0 32 29.6" className="h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="heart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#FF6BA0" />
              <stop offset="1" stopColor="#E84A7F" />
            </linearGradient>
          </defs>
          <path
            d="M23.6 0c-3.4 0-6.3 2.7-7.6 5.6C14.7 2.7 11.8 0 8.4 0 3.8 0 0 3.8 0 8.4c0 9.4 9.5 11.9 16 21.2 6.1-9.3 16-12.1 16-21.2C32 3.8 28.2 0 23.6 0z"
            fill="url(#heart-fill)"
          />
        </svg>
        <span className="pointer-events-none absolute inset-x-0 top-[28%] text-center text-3xl font-bold text-white [text-shadow:0_2px_6px_rgba(138,44,77,0.35)]">
          {label}
        </span>
      </motion.span>
    </motion.button>
  );
}
