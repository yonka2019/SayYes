import type { MascotMood } from "@/lib/types";

/** Props every character artwork component takes. */
export type MascotPartProps = {
  blushOpacity: number;
  mood: MascotMood;
};

type Keyframes = { y?: number[]; rotate?: number | number[] };

export const bodyMotion: Record<MascotMood, Keyframes> = {
  idle: { y: [0, -6, 0], rotate: 0 },
  blush: { y: [0, -3, 0], rotate: [0, -3, 3, 0] },
  wave: { y: [0, -5, 0], rotate: [0, 2, -2, 0] },
  cheer: { y: [0, -20, 0], rotate: [0, -5, 5, 0] },
};

export const bodyTiming: Record<MascotMood, { duration: number }> = {
  idle: { duration: 2.6 },
  blush: { duration: 0.7 },
  wave: { duration: 1.1 },
  cheer: { duration: 0.75 },
};

/** Applied to whichever limb each character waves with. */
export const armMotion: Record<MascotMood, { rotate: number[] }> = {
  idle: { rotate: [0, 6, 0] },
  blush: { rotate: [0, -10, 0] },
  wave: { rotate: [0, -55, -10, -55, 0] },
  cheer: { rotate: [0, -70, -40, -70, 0] },
};

/**
 * Characters must stay inside y 0-200 of the 200-wide grid. The band above y=0
 * is headroom reserved for the cheer hearts — see `HEADROOM` in Mascot.tsx.
 */
export const FLOOR = 200;
