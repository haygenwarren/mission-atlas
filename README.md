<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="branding/mission-atlas-brand/svg/mission-atlas-lockup-on-dark.svg">
    <img alt="Mission Atlas" src="branding/mission-atlas-brand/svg/mission-atlas-lockup-on-light.svg" width="520">
  </picture>
</p>

Mission Atlas is an archive of robotic planetary science and astrophysics missions, from Luna 2 in 1959 to missions still on their way. It covers 100 missions and their 125 spacecraft from NASA, ESA, JAXA, ISRO, CNSA, the Soviet programme and others, with when each launched, where it went, who built it and how it ended.

![The Mission Atlas home page](docs/screenshots/home.png)

## Features

- **Map:** where every spacecraft is right now, on a true-scale map of the solar system. Drag, scroll or pinch to move around. Hover over a craft for its distance from the Sun and from Earth and a faint outline of its route; click it to show the route in full, solid so far and dashed ahead. Craft at the same planet are counted on a badge, and clicking the badge lists them. Markers at the edge point to things out of view; clicking one zooms out to it.
- **Archive:** search across missions, spacecraft, agencies and destinations, and filter by status, agency, destination, spacecraft type and builder. Results sort by launch date or name and come in pages of 24.
- **Mission pages:** launch time to the second, last contact, end declared, duration and destinations, then a tile for each spacecraft with its mass, size, power source, builder and its own status.
- **Linked facts:** every agency, destination, spacecraft type and builder links to the archive filtered by it.
- **Light and dark themes:** dark by default, with a switch that remembers the visitor's choice.

| Mission page | Archive, light theme |
| --- | --- |
| ![Cassini-Huygens mission page](docs/screenshots/mission.png) | ![Archive filtered to Mars missions](docs/screenshots/archive.png) |

![The map, out to Jupiter](docs/screenshots/map.png)

## How it works

The mission data lives in TypeScript files in the repository, not in an admin interface. Every deploy loads those files into the database, so a change to a mission is a pull request like any other change.

```mermaid
flowchart LR
  F["prisma/data/*.ts<br/>missions, agencies,<br/>destinations, builders"] --> S["prisma/seed.ts"]
  G["GCAT catalogue"] -- "npm run import:catalogue" --> C["prisma/data/catalogue.json"]
  C --> S
  S -- "on every deploy" --> D[("PostgreSQL on Neon")]
  D --> W["Next.js on Vercel"]
  H["JPL Horizons"] -- "npm run import:positions" --> P["public/positions.json"]
  P -- "served as a static file" --> W
```

- **Spacecraft facts** (launch time, mass, size, builder) come from GCAT, the General Catalog of Artificial Space Objects. A script saves the rows the project needs into `prisma/data/catalogue.json`, so builds never depend on the catalogue site. Any value written in `missions.ts` overrides the catalogue, with a comment saying why.
- **Positions** for the map come from [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) and are saved to `public/positions.json`, which browsers download directly. `src/lib/orbits.ts` turns the file into a position, in three dimensions, at any moment:
  - **Planets, asteroids, comets and the Moon** are stored as a series of orbits, closer together where an orbit changes quickly (a comet passing Jupiter), and positions come from Kepler's laws. Earth is worked out from the Earth–Moon barycentre and the Moon.
  - **Spacecraft** are stored as the points of their route, with the velocity at each, and positions in between follow a curve that matches both (Hermite interpolation, as in NASA's SPICE toolkit). A route stops where the craft arrives at the body it stays at.
  - **Accuracy:** from 90 days before the first of the current month to two years after it, every position is within 1,000 km of Horizons. Outside that window positions only feed trails and animations, and are within 75,000 km.
  - **Freshness:** a GitHub Actions job refreshes the file from Horizons every day and commits it to `main` when Horizons' data has changed, which redeploys the site. Horizons revises the paths of craft in transit as they are tracked and as they manoeuvre.
  - Facts such as where a craft ended up stay in the database; only the numbers live in the file.
- **The seed** makes the database match the files: it creates or updates rows by slug, deletes rows no longer listed, and runs in one transaction so a failure changes nothing.
- **Pages:** the home page, the map and mission pages are built ahead of time and refreshed hourly. The archive is rendered on each request, because its results depend on the search and filters in the address.
- **The map** is drawn on a canvas in the browser (`src/components/map/`), because it redraws hundreds of objects many times a second while moving. The page hands it each craft's facts from the database; it loads `positions.json` itself and works out every position for the current moment, once a second.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 · PostgreSQL on Neon · Vercel · GitHub Actions

## Data sources and credits

- Launch and spacecraft data from [GCAT](https://planet4589.org/space/gcat) (J. McDowell), used under CC BY 4.0.
- Positions of planets, asteroids, comets and spacecraft from [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) (NASA/JPL Solar System Dynamics).
- End dates and statuses checked against agency mission pages, NASA's NSSDCA catalogue and Wikipedia. Each mission links to its main source.
- Mission and spacecraft descriptions are written for this project.
- Logo, colours and type from the brand kit in [`branding/`](branding/mission-atlas-brand/README.md).

---

## Running it locally

You need Node.js 20.9 or later and a PostgreSQL database. A free [Neon](https://neon.tech) branch works.

```bash
git clone https://github.com/haygenwarren/mission-atlas.git
cd mission-atlas
npm install                  # also generates the Prisma client
```

Create a `.env` file with your database's connection string:

```
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

Then create the tables, load the missions and start the site:

```bash
npx prisma migrate deploy
npx prisma db seed
npm run dev                  # http://localhost:3000
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload. |
| `npm run build` | Applies pending migrations, runs the seed, then builds. This is what Vercel runs. |
| `npm run start` | Serves a production build. |
| `npm run lint` | ESLint. |
| `npm run import:catalogue` | Refreshes `prisma/data/catalogue.json` from GCAT for every spacecraft that has a `catalogueId`. |
| `npm run import:positions` | Refreshes `public/positions.json` from JPL Horizons: orbits for every body, and routes for every spacecraft that has a `horizonsId`. Takes 10–15 minutes. The daily refresh job runs it, so it only needs running by hand after adding a `horizonsId`. |
| `npm run check:positions` | Compares `public/positions.json` with the committed version. Fails if a body or route has gone missing or the file shrank sharply, and says whether anything but the fetch date changed. |

## Adding or changing a mission

1. Add the mission to `prisma/data/missions.ts`. Give each spacecraft its GCAT catalogue ID (for example `S25008` for Cassini; carried craft such as landers have IDs starting with `A`), its location, and its [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) ID if Horizons tracks it (`-82` for Cassini).
2. Run `npm run import:catalogue` to fetch its launch time, masses, size and builders.
3. Add any new agency, destination or builder to `agencies.ts`, `destinations.ts` or `builders.ts`. Type-checking flags one that is used but not listed, and the seed refuses to run.
4. Run `npx prisma db seed` against your development database and check the page.
5. Open a pull request.

The conventions the data follows:

- `lastContact` is when the craft was last heard from, as received on Earth. Write it with a time (`"2017-09-15T11:55:46Z"`) only when the time is established; otherwise just the date.
- `endDeclared` is the day the operating agency announced the end. Leave a date out when it cannot be confirmed.
- A mission's only spacecraft shares the mission's status and dates. When a mission has several spacecraft, each must state its own status, and the seed enforces this.
- Destinations are the places a mission studied or landed on, not gravity-assist flybys.
- A spacecraft's `location` is where it is now: where it is headed if it is still on its way, or where it ended up if its mission is over. It is one of the destinations, but not necessarily one of its mission's (Gaia worked at L2 and was retired into an orbit around the Sun).
- `horizonsId` is the craft's own entry in Horizons, found by designator or by a name Horizons lists. A carried craft without its own entry has none.
- Catalogue values that need correcting are overridden in `missions.ts` with a comment giving the reason; companies with several GCAT codes are merged in `builderAliases`.

## Deploys and environments

| | Database | Deployed by |
| --- | --- | --- |
| Local development | Neon `dev` branch | `npm run dev` |
| Pull request preview | Neon `dev` branch | Vercel, for every pull request |
| Production | Neon main branch | Vercel, on every merge to `main` |

Every pull request also runs lint and a TypeScript check in GitHub Actions (`.github/workflows/checks.yml`). A merge to `main` deploys to production: the build applies any new migration, reloads the mission data and rebuilds the pages.

One job commits to `main` without a pull request: `.github/workflows/refresh-positions.yml` runs `import:positions` every day at 06:23 UTC, runs `check:positions`, and commits `public/positions.json` only when Horizons' data has changed and nothing has gone missing. It can also be run by hand from the Actions tab. A refused or failed run is emailed to the repository owner, and the site keeps the last good file.

## Project layout

```
prisma/
  schema.prisma          database tables
  migrations/            schema changes, applied in order
  data/                  missions, agencies, destinations, builders, catalogue snapshot
  seed.ts                loads prisma/data into the database
scripts/
  import-catalogue.ts    refreshes the GCAT snapshot
  import-positions.ts    refreshes the positions snapshot from JPL Horizons
  check-positions.ts     guards the daily refresh before it commits
public/
  positions.json         orbits and routes for the map
src/
  app/                   pages: home, map, archive, mission page, not-found
  components/            tiles, status tags, theme switch, navbar
    map/                 the map: camera, drawing, controls
  lib/                   database client, formatting helpers, orbit maths,
                         where each craft is on the map
branding/                logo, colours and type
docs/                    mission list and screenshots
```
