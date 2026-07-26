import type { ReactNode } from "react";

/**
 * The phone-mockup card shape from the reference: a rose gradient panel on top
 * (mascot lives there) and a white panel below for text and buttons.
 */
export function CuteCard({
  top,
  children,
  className = "",
}: {
  top?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-[0_24px_60px_-20px_rgba(232,74,127,0.45)] ring-1 ring-rose-soft/20 ${className}`}
    >
      {top !== undefined && (
        <div className="relative grid min-h-56 place-items-center bg-gradient-to-b from-rose-deep to-rose-soft px-6 py-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-12 -right-8 h-32 w-32 rounded-full bg-white/10"
          />
          <div className="relative">{top}</div>
        </div>
      )}
      <div className="px-6 py-7">{children}</div>
    </div>
  );
}
