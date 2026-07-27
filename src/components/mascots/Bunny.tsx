"use client";

import { motion } from "framer-motion";
import { armMotion, type MascotPartProps } from "./motion";

const FUR = "#F6EDE4";
const FUR_DEEP = "#E4D5C7";
const INNER_EAR = "#FFB3C9";
const INK = "#6B4A38";

export function Bunny({ blushOpacity, mood }: MascotPartProps) {
  return (
    <>
      {/* ears — the tightest fit of any character. They stop at y=14, not y=2:
          the cheer hearts bottom out around y=5, and at y=2 the ear tips
          collided with them (measured -2px). Do not raise these. */}
      <ellipse cx="78" cy="58" rx="14" ry="44" fill={FUR} transform="rotate(-8 78 58)" />
      <ellipse cx="122" cy="58" rx="14" ry="44" fill={FUR} transform="rotate(8 122 58)" />
      <ellipse cx="78" cy="62" rx="7" ry="31" fill={INNER_EAR} transform="rotate(-8 78 62)" />
      <ellipse cx="122" cy="62" rx="7" ry="31" fill={INNER_EAR} transform="rotate(8 122 62)" />

      {/* body */}
      <ellipse cx="100" cy="162" rx="43" ry="33" fill={FUR} />
      <ellipse cx="100" cy="168" rx="27" ry="23" fill="#FFFDF8" />

      {/* arms — the right one waves */}
      <motion.ellipse
        cx="58"
        cy="158"
        rx="12"
        ry="20"
        fill={FUR_DEEP}
        animate={{ rotate: mood === "idle" ? [0, -5, 0] : [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "62px", originY: "142px" }}
      />
      <motion.ellipse
        cx="142"
        cy="158"
        rx="12"
        ry="20"
        fill={FUR_DEEP}
        animate={armMotion[mood]}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "138px", originY: "142px" }}
      />

      {/* head */}
      <circle cx="100" cy="108" r="48" fill={FUR} />
      <ellipse cx="100" cy="126" rx="22" ry="15" fill="#FFFDF8" />

      {/* nose + mouth */}
      <ellipse cx="100" cy="118" rx="6" ry="4.2" fill="#FF7FA6" />
      <path
        d="M100 123c0 6-5.5 7.5-8.5 4M100 123c0 6 5.5 7.5 8.5 4"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* eyes */}
      <circle cx="80" cy="102" r="6.8" fill={INK} />
      <circle cx="120" cy="102" r="6.8" fill={INK} />
      <circle cx="82.4" cy="99.4" r="2.4" fill="#fff" />
      <circle cx="122.4" cy="99.4" r="2.4" fill="#fff" />

      {/* blush */}
      <ellipse cx="65" cy="120" rx="11" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
      <ellipse cx="135" cy="120" rx="11" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
    </>
  );
}
