"use client";

import { motion } from "framer-motion";
import { armMotion, type MascotPartProps } from "./motion";

export function Penguin({ blushOpacity, mood }: MascotPartProps) {
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
