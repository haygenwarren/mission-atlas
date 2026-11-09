"use client";

import { useState } from "react";
import { STATUSES, type StatusRow } from "@/lib/data";
import { statusLabels } from "@/lib/missions";
import { COLOURINGS, Legend, Tooltip, usePointed, useWidth } from "./parts";

const statusColours = Object.fromEntries(
  COLOURINGS.status.items.map(({ key, colour }) => [key, colour]),
);

// A bar for each group, place or agency, as long as its count of missions
// and split by how they stand: active, completed or failed. Clicking a row
// adds it to the page's filter, or takes it off again; while any are
// chosen, the rest fade.
//
// Given `fold`, the rows with one mission each wait behind a last row that
// opens them, so a long tail of single places doesn't fill the card. Chosen
// ones stay in view.
export default function StatusBars({
  rows,
  picked,
  onToggle,
  fold,
}: {
  rows: StatusRow[];
  picked: string[];
  onToggle: (key: string) => void;
  // What the rows are, for the last row's words: "places".
  fold?: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { pointed, handlers, clear, hint } = usePointed<string>();
  // Where the pointed row's bar ends, for its note.
  const [at, setAt] = useState({ x: 0, y: 0 });
  const [unfolded, setUnfolded] = useState(false);
  const most = Math.max(1, ...rows.map(({ total }) => total));
  const row = rows.find(({ key }) => key === pointed);
  const folded = fold
    ? rows.filter(({ key, total }) => total === 1 && !picked.includes(key))
    : [];
  // A lone single shows as itself rather than behind a row of its own.
  const folds = folded.length > 1;
  const shown =
    folds && !unfolded ? rows.filter((one) => !folded.includes(one)) : rows;

  function place(event: React.SyntheticEvent<HTMLElement>) {
    const bar = event.currentTarget.querySelector("[data-bar]");
    const box = (bar ?? event.currentTarget).getBoundingClientRect();
    const origin = ref.current!.getBoundingClientRect();

    setAt({ x: box.right - origin.left, y: box.top - origin.top });
  }

  return (
    <div className="space-y-4">
      <Legend items={COLOURINGS.status.items} />

      <div ref={ref} className="relative" onPointerDown={clear}>
        {rows.length === 0 && (
          <p className="text-sm text-muted">No missions match the filters.</p>
        )}

        <ul className="space-y-0.5">
          {shown.map((one) => {
            const { onPointerEnter, onFocus, onPointerDown, ...rest } =
              handlers(one.key, () => onToggle(one.key));
            const chosen = picked.includes(one.key);

            return (
              <li key={one.key}>
                <button
                  type="button"
                  aria-pressed={chosen}
                  aria-label={`${one.title}: ${one.total} mission${one.total === 1 ? "" : "s"}`}
                  {...rest}
                  onPointerEnter={(event) => {
                    place(event);
                    onPointerEnter(event);
                  }}
                  onFocus={(event) => {
                    place(event);
                    onFocus();
                  }}
                  onPointerDown={(event) => {
                    place(event);
                    onPointerDown(event);
                  }}
                  className={`grid w-full grid-cols-[6.5rem_1fr] items-center gap-3 rounded px-1.5 py-1 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-accent sm:grid-cols-[9rem_1fr] ${
                    chosen
                      ? "bg-border/60"
                      : pointed === one.key
                        ? "bg-border/40"
                        : ""
                  } ${picked.length > 0 && !chosen ? "opacity-40" : ""}`}
                >
                  <span className="truncate text-sm" title={one.title}>
                    {one.label}
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      data-bar
                      className="flex h-3.5 overflow-hidden rounded-sm"
                      style={{
                        width: `calc((100% - 2.5rem) * ${one.total / most})`,
                      }}
                    >
                      {STATUSES.map(
                        (status) =>
                          one.counts[status] > 0 && (
                            <span
                              key={status}
                              className="h-full border-r border-surface last:border-r-0"
                              style={{
                                flexGrow: one.counts[status],
                                background: statusColours[status],
                              }}
                            />
                          ),
                      )}
                    </span>
                    <span className="text-sm tabular-nums text-muted">
                      {one.total}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}

          {folds && (
            <li>
              <button
                type="button"
                aria-expanded={unfolded}
                onClick={() => setUnfolded(!unfolded)}
                className="mt-1 flex items-center gap-1.5 rounded px-1.5 py-1 text-sm text-accent outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent"
              >
                {unfolded
                  ? "Show fewer"
                  : `${folded.length} more ${fold}, one mission each`}
                <svg
                  viewBox="0 0 12 12"
                  className={`size-3 shrink-0 transition-transform ${unfolded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden
                >
                  <path d="M3 4.5 6 7.5 9 4.5" />
                </svg>
              </button>
            </li>
          )}
        </ul>

        {row && (
          <Tooltip x={Math.min(at.x, width)} y={at.y} width={width}>
            <p className="font-semibold">{row.title}</p>
            <p className="text-muted">
              {STATUSES.filter((status) => row.counts[status] > 0)
                .map(
                  (status) =>
                    `${row.counts[status]} ${statusLabels[status].toLowerCase()}`,
                )
                .join(" · ")}
            </p>
            <p className="mt-1.5 text-xs text-muted">
              {hint(picked.includes(row.key))}
            </p>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
