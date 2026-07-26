"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mascot } from "@/components/Mascot";
import { RecapCard } from "@/components/RecapCard";
import { LOCALE_NAMES, type Locale } from "@/lib/i18n/locales";
import { t, type Dictionary, type MessageKey } from "@/lib/i18n/t";
import type { InvitationStatus, MascotKind, RecapItem } from "@/lib/types";

export type DashboardItem = {
  id: string;
  recipientName: string;
  mascot: MascotKind;
  status: InvitationStatus;
  createdLabel: string;
  answeredLabel: string | null;
  /** The invitation's own locale — drives its badge and its link prefix. */
  locale: Locale;
  recap: RecapItem[];
};

const mascotKey = (kind: MascotKind): MessageKey =>
  kind === "BEAR" ? "mascot.bear" : "mascot.penguin";

function StatusBadge({ status, dict }: { status: InvitationStatus; dict: Dictionary }) {
  const answered = status === "ANSWERED";
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-bold ${
        answered ? "bg-rose-deep text-white" : "bg-blush-deep text-rose-ink/70"
      }`}
    >
      {answered ? t(dict, "dashboard.status.answered") : t(dict, "dashboard.status.pending")}
    </span>
  );
}

/** Which language this invitation was written in — the list can be mixed. */
function LocaleBadge({ locale }: { locale: Locale }) {
  return (
    <span
      lang={locale}
      title={LOCALE_NAMES[locale]}
      className="rounded-full bg-blush px-2 py-1 text-xs font-bold uppercase text-rose-deep"
    >
      {locale}
    </span>
  );
}

/**
 * `locale` is the *viewer's* — it is used only for the empty-state "create one"
 * link, since there is no invitation to take a locale from yet. Every
 * per-invitation link uses that invitation's own `item.locale`.
 */
export function DashboardList({
  items,
  dict,
  locale,
}: {
  items: DashboardItem[];
  dict: Dictionary;
  locale: Locale;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyLink(item: DashboardItem) {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/${item.locale}/invite/${item.id}`
      );
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[2.5rem] bg-white p-10 text-center shadow-[0_18px_50px_-28px_rgba(232,74,127,0.45)]">
        <div className="mx-auto w-fit">
          <Mascot kind="BEAR" mood="wave" size={150} label={t(dict, "mascot.bear")} />
        </div>
        <p className="mt-2 text-lg text-rose-ink/70">{t(dict, "dashboard.empty.text")}</p>
        <Link
          href={`/${locale}/new`}
          className="mt-5 inline-block rounded-2xl bg-gradient-to-b from-rose-soft to-rose-deep px-6 py-3 text-lg font-bold text-white"
        >
          {t(dict, "dashboard.empty.cta")}
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
                  <Mascot
                    kind={item.mascot}
                    mood="idle"
                    size={56}
                    label={t(dict, mascotKey(item.mascot))}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold text-rose-ink">{item.recipientName}</p>
                  <p className="text-xs text-rose-ink/60 sm:text-sm">
                    {t(dict, "dashboard.createdAt", { date: item.createdLabel })}
                    {item.answeredLabel
                      ? ` · ${t(dict, "dashboard.answeredAt", { date: item.answeredLabel })}`
                      : ""}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <LocaleBadge locale={item.locale} />
                  <StatusBadge status={item.status} dict={dict} />
                </div>
              </div>

              {/* Own row so the buttons never overflow a phone-width card. */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyLink(item)}
                  className="rounded-xl bg-blush px-3 py-2 text-sm font-bold text-rose-deep transition hover:bg-blush-deep"
                >
                  {copiedId === item.id
                    ? t(dict, "dashboard.copied")
                    : t(dict, "dashboard.copy")}
                </button>
                {canExpand ? (
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : item.id)}
                    className="rounded-xl bg-blush px-3 py-2 text-sm font-bold text-rose-deep transition hover:bg-blush-deep"
                  >
                    {open ? t(dict, "dashboard.close") : t(dict, "dashboard.answers")}
                  </button>
                ) : (
                  <Link
                    href={`/${item.locale}/invite/${item.id}`}
                    className="rounded-xl bg-blush px-3 py-2 text-sm font-bold text-rose-deep transition hover:bg-blush-deep"
                  >
                    {t(dict, "dashboard.open")}
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
                    <RecapCard
                      items={item.recap}
                      title={t(dict, "dashboard.recapTitle", { name: item.recipientName })}
                      emptyText={t(dict, "recap.empty")}
                    />
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
