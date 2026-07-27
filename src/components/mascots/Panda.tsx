"use client";

import { motion } from "framer-motion";
import { armMotion, type MascotPartProps } from "./motion";

const COAT = "#FFFDF8";
const INK = "#2B2B33";

export function Panda({ blushOpacity, mood }: MascotPartProps) {
  return (
    <>
      {/* body */}
      <ellipse cx="100" cy="162" rx="44" ry="33" fill={COAT} />

      {/* arms — the right one waves */}
      <motion.ellipse
        cx="56"
        cy="157"
        rx="12"
        ry="20"
        fill={INK}
        animate={{ rotate: mood === "idle" ? [0, -5, 0] : [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "60px", originY: "141px" }}
      />
      <motion.ellipse
        cx="144"
        cy="157"
        rx="12"
        ry="20"
        fill={INK}
        animate={armMotion[mood]}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "140px", originY: "141px" }}
      />

      {/* ears */}
      <circle cx="62" cy="54" r="20" fill={INK} />
      <circle cx="138" cy="54" r="20" fill={INK} />

      {/* head */}
      <circle cx="100" cy="102" r="52" fill={COAT} />

      {/* eye patches */}
      <ellipse cx="78" cy="96" rx="15" ry="18" fill={INK} transform="rotate(-14 78 96)" />
      <ellipse cx="122" cy="96" rx="15" ry="18" fill={INK} transform="rotate(14 122 96)" />

      {/* eyes */}
      <circle cx="79" cy="97" r="7" fill="#fff" />
      <circle cx="121" cy="97" r="7" fill="#fff" />
      <circle cx="79" cy="97" r="4" fill={INK} />
      <circle cx="121" cy="97" r="4" fill={INK} />
      <circle cx="80.6" cy="95" r="1.8" fill="#fff" />
      <circle cx="122.6" cy="95" r="1.8" fill="#fff" />

      {/* nose + mouth */}
      <ellipse cx="100" cy="118" rx="8" ry="5.5" fill={INK} />
      <path
        d="M100 125c0 6-6 7.5-9 4M100 125c0 6 6 7.5 9 4"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* blush */}
      <ellipse cx="62" cy="118" rx="11" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
      <ellipse cx="138" cy="118" rx="11" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
    </>
  );
}
