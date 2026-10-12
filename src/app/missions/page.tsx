import Link from "next/link";
import { redirect } from "next/navigation";
import MissionTile from "@/components/mission-tile";
import Pagination from "@/components/pagination";
import { prisma } from "@/lib/prisma";
import {
  destinationKindLabels,
  missionLinks,
  spacecraftKindLabels,
  statusLabels,
} from "@/lib/missions";
import type { Prisma } from "@/generated/prisma/client";
import type {
  DestinationKind,
  SpacecraftKind,
  Status,
} from "@/generated/prisma/enums";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Divides evenly into the two- and three-column grids.
const PAGE_SIZE = 24;

const statuses = Object.keys(statusLabels) as Status[];
const kinds = Object.keys(spacecraftKindLabels) as SpacecraftKind[];
const destinationKinds = Object.keys(
  destinationKindLabels,
) as DestinationKind[];

// The id breaks ties so that paging is stable when two missions share a
// launch.
const sortOrders: Record<
  string,
  { label: string; orderBy: Prisma.MissionOrderByWithRelationInput[] }
> = {
  newest: {
    label: "Newest launch first",
    orderBy: [{ launchDate: "desc" }, { id: "asc" }],
  },
  oldest: {
    label: "Oldest launch first",
    orderBy: [{ launchDate: "asc" }, { id: "asc" }],
  },
  name: { label: "Name A–Z", orderBy: [{ name: "asc" }, { id: "asc" }] },
};

// A repeated URL parameter arrives as an array; only the first value is used.
function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

const selectClasses = "max-w-full border rounded px-3 py-2";

export default async function MissionsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const q = first(params.q);
  const status = statuses.find(
    (value) => value.toLowerCase() === first(params.status),
  );
  const kind = kinds.find((value) => value.toLowerCase() === first(params.type));
  const agency = first(params.agency);
  const destination = first(params.destination);
  const builder = first(params.builder);
  const sortParam = first(params.sort);
  const sort =
    sortParam && Object.hasOwn(sortOrders, sortParam) ? sortParam : "newest";

  const where: Prisma.MissionWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (agency) {
    where.agencies = { some: { abbreviation: agency } };
  }

  if (destination) {
    where.destinations = { some: { slug: destination } };
  }

  // Type and builder must match on the same craft: "a rover built by JPL".
  if (kind || builder) {
    where.spacecraft = {
      some: {
        ...(kind && { kind }),
        ...(builder && { builders: { some: { code: builder } } }),
      },
    };
  }

  if (q) {
    const contains = { contains: q, mode: "insensitive" } as const;

    where.OR = [
      { name: contains },
      { description: contains },
      { spacecraft: { some: { name: contains } } },
      {
        agencies: {
          some: { OR: [{ abbreviation: contains }, { name: contains }] },
        },
      },
      { destinations: { some: { name: contains } } },
    ];
  }

  const total = await prisma.mission.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = Number.parseInt(first(params.page) ?? "1", 10) || 1;
  const page = Math.min(Math.max(requestedPage, 1), pageCount);

  const [missions, agencies, destinations, builders] = await Promise.all([
    prisma.mission.findMany({
      where,
      orderBy: sortOrders[sort].orderBy,
      include: missionLinks,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.agency.findMany({ orderBy: { abbreviation: "asc" } }),
    prisma.destination.findMany({ orderBy: { name: "asc" } }),
    prisma.builder.findMany({ orderBy: { name: "asc" } }),
  ]);

  const filters = {
    q,
    status: status?.toLowerCase(),
    agency,
    destination,
    type: kind?.toLowerCase(),
    builder,
    sort: sort === "newest" ? undefined : sort,
  };

  function hrefFor(target: number) {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value) query.set(key, value);
    }

    if (target > 1) query.set("page", String(target));

    const string = query.toString();

    return string ? `/missions?${string}` : "/missions";
  }

  // The filter form submits every field, including empty ones. Redirecting
  // to the tidy form of the address keeps shared links short.
  const untidy = Object.entries(params).some(
    ([key, value]) =>
      value === "" ||
      (key === "sort" && value === "newest") ||
      (key === "page" && value === "1"),
  );

  if (untidy) {
    redirect(hrefFor(page));
  }

  const firstShown = (page - 1) * PAGE_SIZE + 1;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold mb-2">Mission Archive</h1>
      <p className="text-sm text-gray-600 mb-6">
        {total} mission{total === 1 ? "" : "s"} found
        {pageCount > 1 &&
          ` · showing ${firstShown}–${firstShown + missions.length - 1}`}
      </p>

      {/* The key remounts the form when the filters change, so the fields
          reset after following the Reset link. */}
      <form key={hrefFor(1)} method="GET" className="mb-8 space-y-4">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search missions, spacecraft, agencies or destinations"
          aria-label="Search"
          className="w-full border rounded px-3 py-2"
        />

        <div className="flex flex-wrap gap-4 items-center">
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            aria-label="Status"
            className={selectClasses}
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value.toLowerCase()}>
                {statusLabels[value]}
              </option>
            ))}
          </select>

          <select
            name="agency"
            defaultValue={agency ?? ""}
            aria-label="Agency"
            className={selectClasses}
          >
            <option value="">All agencies</option>
            {agencies.map((option) => (
              <option key={option.id} value={option.abbreviation}>
                {option.abbreviation}
              </option>
            ))}
          </select>

          <select
            name="destination"
            defaultValue={destination ?? ""}
            aria-label="Destination"
            className={selectClasses}
          >
            <option value="">All destinations</option>
            {destinationKinds.map((group) => (
              <optgroup key={group} label={destinationKindLabels[group]}>
                {destinations
                  .filter((option) => option.kind === group)
                  .map((option) => (
                    <option key={option.id} value={option.slug}>
                      {option.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>

          <select
            name="type"
            defaultValue={filters.type ?? ""}
            aria-label="Spacecraft type"
            className={selectClasses}
          >
            <option value="">All spacecraft types</option>
            {kinds.map((value) => (
              <option key={value} value={value.toLowerCase()}>
                {spacecraftKindLabels[value]}
              </option>
            ))}
          </select>

          <select
            name="builder"
            defaultValue={builder ?? ""}
            aria-label="Builder"
            className={selectClasses}
          >
            <option value="">All builders</option>
            {builders.map((option) => (
              <option key={option.id} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>

          <select
            name="sort"
            defaultValue={sort}
            aria-label="Sort order"
            className={selectClasses}
          >
            {Object.entries(sortOrders).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Apply Filters
          </button>

          <Link
            href="/missions"
            className="text-sm text-gray-600 hover:text-black"
          >
            Reset
          </Link>
        </div>
      </form>

      {missions.length === 0 ? (
        <div className="border rounded-xl p-8 text-center text-gray-600">
          <p className="text-lg font-medium mb-2">No missions found</p>
          <p className="text-sm mb-4">
            Try changing or clearing your filters.
          </p>
          <Link
            href="/missions"
            className="inline-block rounded-lg border px-4 py-2 hover:bg-gray-50 transition"
          >
            View all missions
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {missions.map((mission) => (
            <MissionTile key={mission.id} mission={mission} />
          ))}
        </div>
      )}

      <Pagination page={page} pageCount={pageCount} hrefFor={hrefFor} />
    </main>
  );
}
