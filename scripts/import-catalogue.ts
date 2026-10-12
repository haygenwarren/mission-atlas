import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { CatalogueObject } from "../prisma/data/catalogue";
import { missions } from "../prisma/data/missions";

// Saves the GCAT rows this project uses into prisma/data/catalogue.json, so
// builds never depend on the catalogue site. Run it after adding a
// catalogueId to prisma/data/missions.ts, or to pick up corrections.
// GCAT: J. McDowell, planet4589.org/space/gcat, CC BY 4.0.
const BASE_URL = "https://planet4589.org/space/gcat/tsv";
const OUTPUT = path.join(process.cwd(), "prisma/data/catalogue.json");
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type Row = Record<string, string>;

// GCAT files are tab-separated with a "#" header line. Only rows whose key
// column is in `wanted` are kept, since the full files run to 70,000 rows.
async function fetchRows(file: string, keyColumn: string, wanted: Set<string>) {
  const response = await fetch(`${BASE_URL}/${file}`);

  if (!response.ok) {
    throw new Error(`${file}: HTTP ${response.status}`);
  }

  const [header, ...lines] = (await response.text()).split("\n");
  const columns = header
    .replace(/^#/, "")
    .split("\t")
    .map((column) => column.trim());
  const keyIndex = columns.indexOf(keyColumn);

  if (keyIndex === -1) {
    throw new Error(`${file}: no ${keyColumn} column`);
  }

  const rows = new Map<string, Row>();

  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;

    const cells = line.split("\t");
    const key = cells[keyIndex]?.trim();

    if (key && wanted.has(key)) {
      rows.set(
        key,
        Object.fromEntries(
          columns.map((column, i) => [column, (cells[i] ?? "").trim()]),
        ),
      );
    }
  }

  return rows;
}

// GCAT flags a value with "?" when it is an estimate; those are left out.
function measured(value: string, flag: string) {
  const number = Number(value);

  if (!value || flag === "?" || !Number.isFinite(number) || number === 0) {
    return null;
  }

  return number;
}

// "1977 Sep  5 1256:01" -> "1977-09-05T12:56:01Z". Returns null when GCAT has
// no time of day for the launch or marks it uncertain.
function parseLaunchDate(value: string) {
  const match = value.match(
    /^(\d{4}) ([A-Z][a-z]{2}) +(\d{1,2}) (\d{2})(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) return null;

  const [, year, monthName, day, hour, minute, second = "00"] = match;
  const month = MONTHS.indexOf(monthName) + 1;

  if (month === 0) return null;

  const pad = (part: string | number) => String(part).padStart(2, "0");

  return `${year}-${pad(month)}-${pad(day)}T${hour}:${minute}:${second}Z`;
}

async function main() {
  const ids = new Set(
    missions.flatMap((mission) =>
      mission.spacecraft.flatMap((craft) => craft.catalogueId ?? []),
    ),
  );

  // Most spacecraft are in the main catalogue. Craft carried by another
  // craft, such as landers and rovers, are in the auxiliary one.
  const objects = new Map([
    ...(await fetchRows("cat/satcat.tsv", "JCAT", ids)),
    ...(await fetchRows("cat/auxcat.tsv", "JCAT", ids)),
  ]);

  const missing = [...ids].filter((id) => !objects.has(id));

  if (missing.length > 0) {
    throw new Error(`Not found in GCAT: ${missing.join(", ")}`);
  }

  const launches = await fetchRows(
    "launch/launch.tsv",
    "Launch_Tag",
    new Set([...objects.values()].map((row) => row.Launch_Tag)),
  );

  const snapshot: Record<string, CatalogueObject> = {};

  for (const id of [...ids].sort()) {
    const row = objects.get(id)!;
    const launchDate = parseLaunchDate(
      launches.get(row.Launch_Tag)?.Launch_Date ?? "",
    );

    if (!launchDate) {
      console.warn(`${id} ${row.Name}: no exact launch time in GCAT`);
    }

    snapshot[id] = {
      name: row.Name,
      // Only main-catalogue objects have a designator of their own.
      designator: id.startsWith("S") ? row.Piece : null,
      launchDate,
      launchMassKg: measured(row.Mass, row.MassFlag),
      dryMassKg: measured(row.DryMass, row.DryFlag),
      lengthM: measured(row.Length, row.LFlag),
      diameterM: measured(row.Diameter, row.DFlag),
      spanM: measured(row.Span, row.SpanFlag),
      builders: row.Manufacturer.split("/").filter(
        (code) => code && code !== "-",
      ),
    };
  }

  await writeFile(
    OUTPUT,
    JSON.stringify(
      {
        source: "GCAT (J. McDowell, planet4589.org/space/gcat)",
        fetched: new Date().toISOString().slice(0, 10),
        objects: snapshot,
      },
      null,
      2,
    ) + "\n",
  );

  console.log(`Saved ${ids.size} spacecraft to prisma/data/catalogue.json.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
