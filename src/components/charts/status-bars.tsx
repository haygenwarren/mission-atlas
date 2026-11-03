"use client";

import { useState } from "react";
import { STATUSES, type StatusRow } from "@/lib/data";
import { statusLabels } from "@/lib/missions";
import { Legend, Tooltip, usePointed, useWidth } from "./parts";

const statusColours = {
  ACTIVE: "var(--status-active)",
  COMPLETED: "var(--status-completed)",
  FAILED: "var(--status-failed)",
};

// A bar for each destination or agency, as long as its count of missions
// and split by how they stand: active, completed or failed. A row links to
// its missions in the archive.
export default function StatusBars({ rows }: { rows: StatusRow[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { pointed, handlers, clear } = usePointed<string>();
  // Where the pointed row's bar ends, for its note.
  const [at, setAt] = useState({ x: 0, y: 0 });
  const most = Math.max(...rows.map(({ total }) => total));
  const row = rows.find(({ key }) => key === pointed);

  function place(event: React.SyntheticEvent<HTMLElement>) {
    const bar = event.currentTarget.querySelector("[data-bar]");
    const box = (bar ?? event.currentTarget).getBoundingClientRect();
    const origin = ref.current!.getBoundingClientRect();

    setAt({ x: box.right - origin.left, y: box.top - origin.top });
  }

  return (
    <div className="space-y-4">
      <Legend
        items={STATUSES.map((status) => ({
          label: statusLabels[status],
          color: statusColours[status],
        }))}
      />

      <div ref={ref} className="relative" onPointerDown={clear}>
        <ul className="space-y-0.5">
          {rows.map((one) => {
            const { onPointerEnter, onFocus, ...rest } = handlers(one.key);

            return (
              <li key={one.key}>
                <a
                  href={one.href}
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
                    rest.onPointerDown(event);
                  }}
                  className={`grid grid-cols-[6.5rem_1fr] items-center gap-3 rounded px-1.5 py-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent sm:grid-cols-[11rem_1fr] ${
                    pointed === one.key ? "bg-surface" : ""
                  }`}
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
                              className="h-full border-r border-background last:border-r-0"
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
                </a>
              </li>
            );
          })}
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
          </Tooltip>
        )}
      </div>
    </div>
  );
}
