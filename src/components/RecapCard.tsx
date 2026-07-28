import type { RecapItem } from "@/lib/types";

/**
 * The "here's everything you picked" list — shared by the finale and answers page.
 *
 * `title` and `emptyText` have no defaults on purpose: a default would be a
 * user-facing string literal in one fixed language.
 */
export function RecapCard({
  items,
  title,
  emptyText,
}: {
  items: RecapItem[];
  title: string;
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="text-center text-rose-ink/60">{emptyText}</p>;
  }

  return (
    <div className="rounded-[1.75rem] bg-blush p-5">
      <h3 className="mb-3 text-center text-lg font-bold text-rose-deep">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3"
          >
            <span className="text-sm text-rose-ink/70">{item.question}</span>
            <span className="shrink-0 font-bold text-rose-deep">{item.answer}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
