"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mascot } from "@/components/Mascot";
import { RecapCard } from "@/components/RecapCard";
import type { InvitationStatus, MascotKind, RecapItem } from "@/lib/types";

export type DashboardItem = {
  id: string;
  recipientName: string;
  mascot: MascotKind;
  status: InvitationStatus;
  createdLabel: string;
  answeredLabel: string | null;
  recap: RecapItem[];
};

function StatusBadge({ status }: { status: InvitationStatus }) {
  const answered = status === "ANSWERED";
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-bold ${
        answered ? "bg-rose-deep text-white" : "bg-blush-deep text-rose-ink/70"
      }`}
    >
      {answered ? "נענתה" : "ממתינה"}
    </span>
  );
}

export function DashboardList({ items }: { items: DashboardItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyLink(id: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/invite/${id}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[2.5rem] bg-white p-10 text-center shadow-[0_18px_50px_-28px_rgba(232,74,127,0.45)]">
        <div className="mx-auto w-fit">
          <Mascot kind="BEAR" mood="wave" size={150} />
        </div>
        <p className="mt-2 text-lg text-rose-ink/70">עוד לא יצרתם הזמנות.</p>
        <Link
          href="/new"
          className="mt-5 inline-block rounded-2xl bg-gradient-to-b from-rose-soft to-rose-deep px-6 py-3 text-lg font-bold text-white"
        >
          יצירת ההזמנה הראשונה
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const open = openId === item.id;
        const canExpand = item.status === "ANSWERED";

        return (
          <li
            key={item.id}
            className="overflow-hidden rounded-[2rem] bg-white shadow-[0_14px_40px_-28px_rgba(232,74,127,0.5)]"
          >
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <Mascot kind={item.mascot} mood="idle" size={56} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold text-rose-ink">{item.recipientName}</p>
                  <p className="text-xs text-rose-ink/60 sm:text-sm">
                    נוצרה {item.createdLabel}
                    {item.answeredLabel ? ` · נענתה ${item.answeredLabel}` : ""}
                  </p>
                </div>

                <StatusBadge status={item.status} />
              </div>

              {/* Own row so the buttons never overflow a phone-width card. */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyLink(item.id)}
                  className="rounded-xl bg-blush px-3 py-2 text-sm font-bold text-rose-deep transition hover:bg-blush-deep"
                >
                  {copiedId === item.id ? "הועתק!" : "העתקת קישור"}
                </button>
                {canExpand ? (
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : item.id)}
                    className="rounded-xl bg-blush px-3 py-2 text-sm font-bold text-rose-deep transition hover:bg-blush-deep"
                  >
                    {open ? "סגירה" : "התשובות"}
                  </button>
                ) : (
                  <Link
                    href={`/invite/${item.id}`}
                    className="rounded-xl bg-blush px-3 py-2 text-sm font-bold text-rose-deep transition hover:bg-blush-deep"
                  >
                    פתיחה
                  </Link>
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    <RecapCard items={item.recap} title={`מה ${item.recipientName} בחרה`} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
