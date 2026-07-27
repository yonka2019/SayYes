"use client";

import { motion } from "framer-motion";
import { armMotion, type MascotPartProps } from "./motion";

const FUR = "#B9BFD0";
const FUR_DEEP = "#A2A9BD";
const BELLY = "#EAEDF5";
const INNER = "#FFB3C9";
const INK = "#3E4457";

export function Cat({ blushOpacity, mood }: MascotPartProps) {
  return (
    <>
      {/* tail, behind everything */}
      <path
        d="M139 176c30-4 32-24 24-44"
        stroke={FUR_DEEP}
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />

      {/* body */}
      <ellipse cx="100" cy="163" rx="41" ry="32" fill={FUR} />
      <ellipse cx="100" cy="169" rx="25" ry="22" fill={BELLY} />

      {/* arms — the right one waves */}
      <motion.ellipse
        cx="60"
        cy="160"
        rx="11"
        ry="19"
        fill={FUR_DEEP}
        animate={{ rotate: mood === "idle" ? [0, -5, 0] : [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "64px", originY: "145px" }}
      />
      <motion.ellipse
        cx="140"
        cy="160"
        rx="11"
        ry="19"
        fill={FUR_DEEP}
        animate={armMotion[mood]}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "136px", originY: "145px" }}
      />

      {/* ears */}
      <path d="M64 74L58 26l40 26z" fill={FUR} />
      <path d="M136 74l6-48-40 26z" fill={FUR} />
      <path d="M68 68l-3-27 22 15z" fill={INNER} />
      <path d="M132 68l3-27-22 15z" fill={INNER} />

      {/* head */}
      <circle cx="100" cy="104" r="49" fill={FUR} />

      {/* whiskers */}
      <path
        d="M58 112h-18M60 122l-17 6M142 112h18M140 122l17 6"
        stroke={FUR_DEEP}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* nose + mouth */}
      <path d="M100 114l-6 5h12z" fill="#FF7FA6" />
      <path
        d="M100 120c0 6-5.5 7.5-8.5 4M100 120c0 6 5.5 7.5 8.5 4"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* eyes */}
      <circle cx="80" cy="99" r="7" fill={INK} />
      <circle cx="120" cy="99" r="7" fill={INK} />
      <circle cx="82.5" cy="96.2" r="2.5" fill="#fff" />
      <circle cx="122.5" cy="96.2" r="2.5" fill="#fff" />

      {/* blush */}
      <ellipse cx="66" cy="116" rx="11" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
      <ellipse cx="134" cy="116" rx="11" ry="7" fill="#FF7FA6" opacity={blushOpacity} />
    </>
  );
}
