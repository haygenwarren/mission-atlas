import type {
  DatePrecision,
  MilestoneKind,
  Status,
} from "@/generated/prisma/enums";
import { formatDate } from "@/lib/missions";

type Milestone = {
  id: number;
  kind: MilestoneKind;
  title: string;
  detail: string | null;
  date: Date;
  precision: DatePrecision;
  planned: boolean;
  spacecraft: { name: string } | null;
};

type Props = {
  launchDate: Date;
  status: Status;
  milestones: Milestone[];
};

type Event = Omit<Milestone, "id"> & { key: string };

const monthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function eventDate(event: Event) {
  return event.precision === "MONTH"
    ? monthFormat.format(event.date)
    : formatDate(event.date, "none");
}

// Years marked along the bar: every year, or every 2, 5, 10 or 20, whichever
// gives no more than eight marks.
function yearTicks(start: Date, end: Date) {
  const first = start.getUTCFullYear() + 1;
  const last = end.getUTCFullYear();
  const step = [1, 2, 5, 10, 20].find((s) => (last - first) / s < 8) ?? 50;
  const ticks = [];

  for (let year = Math.ceil(first / step) * step; year <= last; year += step) {
    ticks.push(year);
  }

  return ticks;
}

// The end of a mission is marked in its status colour: grey for one that
// was completed, red for one that failed.
const endColours: Record<Status, string> = {
  ACTIVE: "bg-accent",
  COMPLETED: "bg-status-completed",
  FAILED: "bg-status-failed",
};

// A mission's key events, twice: a bar drawn to scale from launch to the end
// (or to the last planned event), showing the shape of the mission at a
// glance, and a list beneath with each event in full. Planned events are
// hollow on the bar and marked in the list.
export default function MissionTimeline({
  launchDate,
  status,
  milestones,
}: Props) {
  const now = new Date();
  const launch: Event = {
    key: "launch",
    kind: "LAUNCH",
    title: "Launch",
    detail: null,
    date: launchDate,
    precision: "DAY",
    planned: false,
    spacecraft: null,
  };
  const events = [
    launch,
    ...milestones.map(({ id, ...rest }) => ({ key: String(id), ...rest })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const start = launchDate.getTime();
  const lastEvent = events.at(-1)!.date.getTime();
  // An active mission runs on to today, or to its last planned event.
  const end =
    status === "ACTIVE" ? Math.max(lastEvent, now.getTime()) : lastEvent;
  const span = Math.max(end - start, 1);
  const at = (time: number) =>
    `${Math.min(100, Math.max(0, ((time - start) / span) * 100))}%`;
  const today =
    status === "ACTIVE" && now.getTime() < end ? now.getTime() : null;
  const doneUntil = today ?? end;

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold">Milestones</h2>

      {/* The bar repeats the list below in picture form, so screen readers
          skip it. */}
      <div aria-hidden className="relative mt-6 h-16 select-none">
        <div className="absolute inset-x-0 top-5 h-0.5 bg-border" />
        <div
          className="absolute left-0 top-5 h-0.5 bg-accent"
          style={{ width: at(doneUntil) }}
        />
        {today !== null && (
          <>
            {/* The stretch still to come, dashed. */}
            <div
              className="absolute right-0 top-5 h-0.5 bg-[repeating-linear-gradient(to_right,var(--accent)_0_6px,transparent_6px_12px)]"
              style={{ left: at(today) }}
            />
            <div
              className="absolute top-1 h-8 w-px bg-foreground/60"
              style={{ left: at(today) }}
            >
              <span className="label-caps absolute -top-5 left-1/2 -translate-x-1/2 text-[0.65rem] text-muted">
                Today
              </span>
            </div>
          </>
        )}

        {yearTicks(launchDate, new Date(end)).map((year) => (
          <span
            key={year}
            className="absolute top-9 -translate-x-1/2 font-mono text-xs text-muted"
            style={{ left: at(Date.UTC(year, 0, 1)) }}
          >
            {year}
          </span>
        ))}

        {events.map((event) => {
          const left = at(event.date.getTime());
          const share = parseFloat(left);
          // Tooltips near either end open inwards, so they stay on screen.
          const align =
            share < 15
              ? "left-0"
              : share > 85
                ? "right-0"
                : "left-1/2 -translate-x-1/2";

          return (
            <a
              key={event.key}
              href={`#milestone-${event.key}`}
              tabIndex={-1}
              className="group absolute top-5 -translate-x-1/2 -translate-y-1/2 p-1.5"
              style={{ left }}
            >
              <span
                className={`block size-3 rounded-full border-2 border-accent transition-transform group-hover:scale-150 ${
                  event.planned
                    ? "bg-background"
                    : event.kind === "END"
                      ? `${endColours[status]} border-transparent`
                      : "bg-accent"
                }`}
              />
              <span
                className={`pointer-events-none invisible absolute bottom-full z-10 mb-1 w-max max-w-56 rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-sm shadow-lg group-hover:visible ${align}`}
              >
                <span className="block font-semibold">{event.title}</span>
                <span className="block text-muted">
                  {event.planned && "Planned · "}
                  {eventDate(event)}
                </span>
              </span>
            </a>
          );
        })}
      </div>

      {/* The line runs down the middle of the page, with the dates to its
          left and the events to its right. On phones the dates take a
          narrow column instead. */}
      <ol className="mt-4">
        {events.map((event, i) => {
          const next = events[i + 1];

          return (
            <li
              key={event.key}
              id={`milestone-${event.key}`}
              className="grid scroll-mt-24 grid-cols-[6.5rem_1.5rem_1fr] gap-x-3 sm:grid-cols-[1fr_1.5rem_1fr] sm:gap-x-4"
            >
              <p
                className={`pt-0.5 text-right text-sm ${event.planned ? "text-muted" : ""}`}
              >
                {eventDate(event)}
              </p>

              {/* The dot, on a line running down to the next event. */}
              <div className="relative flex justify-center">
                {next && (
                  <span
                    className={`absolute bottom-0 top-3 w-px ${
                      next.planned
                        ? "bg-[repeating-linear-gradient(to_bottom,var(--border-strong)_0_4px,transparent_4px_8px)]"
                        : "bg-border-strong"
                    }`}
                  />
                )}
                <span
                  className={`relative mt-1.5 size-3 rounded-full border-2 border-accent ${
                    event.planned
                      ? "bg-background"
                      : event.kind === "END"
                        ? `${endColours[status]} border-transparent`
                        : "bg-accent"
                  }`}
                />
              </div>

              <div className="max-w-md pb-6">
                <p className="font-semibold">
                  {event.title}
                  {event.planned && (
                    <span className="label-caps ml-2 rounded-full border border-border-strong px-2 py-0.5 align-middle text-[0.65rem] text-muted">
                      Planned
                    </span>
                  )}
                </p>
                {event.spacecraft && (
                  <p className="label-caps mt-1 text-muted">
                    {event.spacecraft.name}
                  </p>
                )}
                {event.detail && (
                  <p className="mt-1 text-sm text-foreground/80">
                    {event.detail}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
