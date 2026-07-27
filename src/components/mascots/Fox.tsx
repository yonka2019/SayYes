"use client";

import { motion } from "framer-motion";
import { armMotion, type MascotPartProps } from "./motion";

const COAT = "#E8823C";
const COAT_DEEP = "#CE6A28";
const CREAM = "#FFF6EC";
const INK = "#4A3524";

export function Fox({ blushOpacity, mood }: MascotPartProps) {
  return (
    <>
      {/* tail, behind everything, cream tip */}
      <ellipse cx="150" cy="158" rx="18" ry="34" fill={COAT_DEEP} transform="rotate(28 150 158)" />
      <ellipse cx="163" cy="180" rx="12" ry="14" fill={CREAM} transform="rotate(28 163 180)" />

      {/* body */}
      <ellipse cx="100" cy="162" rx="41" ry="32" fill={COAT} />
      <ellipse cx="100" cy="169" rx="25" ry="22" fill={CREAM} />

      {/* arms — the right one waves */}
      <motion.ellipse
        cx="60"
        cy="159"
        rx="11"
        ry="19"
        fill={COAT_DEEP}
        animate={{ rotate: mood === "idle" ? [0, -5, 0] : [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "64px", originY: "144px" }}
      />
      <motion.ellipse
        cx="140"
        cy="159"
        rx="11"
        ry="19"
        fill={COAT_DEEP}
        animate={armMotion[mood]}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "136px", originY: "144px" }}
      />

      {/* ears, dark tips */}
      <path d="M62 72L54 24l42 24z" fill={COAT} />
      <path d="M138 72l8-48-42 24z" fill={COAT} />
      <path d="M58 44l-4-20 17 10z" fill={INK} />
      <path d="M142 44l4-20-17 10z" fill={INK} />

      {/* head + cream muzzle */}
      <circle cx="100" cy="102" r="48" fill={COAT} />
      <ellipse cx="100" cy="122" rx="26" ry="18" fill={CREAM} />
      <path
        d="M74 108q26 -14 52 0"
        stroke={CREAM}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />

      {/* nose + mouth */}
      <ellipse cx="100" cy="116" rx="7" ry="5" fill={INK} />
      <path
        d="M100 122c0 6-5.5 7.5-8.5 4M100 122c0 6 5.5 7.5 8.5 4"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* eyes */}
      <circle cx="80" cy="98" r="7" fill={INK} />
      <circle cx="120" cy="98" r="7" fill={INK} />
      <circle cx="82.5" cy="95.2" r="2.5" fill="#fff" />
      <circle cx="122.5" cy="95.2" r="2.5" fill="#fff" />

      {/* blush */}
      <ellipse cx="66" cy="112" rx="11" ry="7" fill="#FF5C8D" opacity={blushOpacity} />
      <ellipse cx="134" cy="112" rx="11" ry="7" fill="#FF5C8D" opacity={blushOpacity} />
    </>
  );
}
