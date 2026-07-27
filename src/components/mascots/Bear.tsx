"use client";

import { motion } from "framer-motion";
import { armMotion, type MascotPartProps } from "./motion";

export function Bear({ blushOpacity, mood }: MascotPartProps) {
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
