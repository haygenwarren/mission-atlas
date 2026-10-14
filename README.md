<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="branding/mission-atlas-brand/svg/mission-atlas-lockup-on-dark.svg">
    <img alt="Mission Atlas" src="branding/mission-atlas-brand/svg/mission-atlas-lockup-on-light.svg" width="520">
  </picture>
</p>

Mission Atlas is an archive of robotic planetary science and astrophysics missions, from Luna 2 in 1959 to missions still on their way. It covers 100 missions and their 125 spacecraft from NASA, ESA, JAXA, ISRO, CNSA, the Soviet programme and others, with when each launched, where it went, who built it and how it ended.

![The Mission Atlas home page](docs/screenshots/home.png)

## Features

- **Archive:** search across missions, spacecraft, agencies and destinations, and filter by status, agency, destination, spacecraft type and builder. Results sort by launch date or name and come in pages of 24.
- **Mission pages:** launch time to the second, last contact, end declared, duration and destinations, then a tile for each spacecraft with its mass, size, power source, builder and its own status.
- **Linked facts:** every agency, destination, spacecraft type and builder links to the archive filtered by it.
- **Light and dark themes:** dark by default, with a switch that remembers the visitor's choice.

| Mission page | Archive, light theme |
| --- | --- |
| ![Cassini-Huygens mission page](docs/screenshots/mission.png) | ![Archive filtered to Mars missions](docs/screenshots/archive.png) |

## How it works

The mission data lives in TypeScript files in the repository, not in an admin interface. Every deploy loads those files into the database, so a change to a mission is a pull request like any other change.

```mermaid
flowchart LR
  F["prisma/data/*.ts<br/>missions, agencies,<br/>destinations, builders"] --> S["prisma/seed.ts"]
  G["GCAT catalogue"] -- "npm run import:catalogue" --> C["prisma/data/catalogue.json"]
  C --> S
  S -- "on every deploy" --> D[("PostgreSQL on Neon")]
  D --> W["Next.js on Vercel"]
```

- **Spacecraft facts** (launch time, mass, size, builder) come from GCAT, the General Catalog of Artificial Space Objects. A script saves the rows the project needs into `prisma/data/catalogue.json`, so builds never depend on the catalogue site. Any value written in `missions.ts` overrides the catalogue, with a comment saying why.
- **The seed** makes the database match the files: it creates or updates rows by slug, deletes rows no longer listed, and runs in one transaction so a failure changes nothing.
- **Pages:** the home page and mission pages are built ahead of time and refreshed hourly. The archive is rendered on each request, because its results depend on the search and filters in the address.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 · PostgreSQL on Neon · Vercel · GitHub Actions

## Data sources and credits

- Launch and spacecraft data from [GCAT](https://planet4589.org/space/gcat) (J. McDowell), used under CC BY 4.0.
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

## Adding or changing a mission

1. Add the mission to `prisma/data/missions.ts`. Give each spacecraft its GCAT catalogue ID (for example `S25008` for Cassini; carried craft such as landers have IDs starting with `A`).
2. Run `npm run import:catalogue` to fetch its launch time, masses, size and builders.
3. Add any new agency, destination or builder to `agencies.ts`, `destinations.ts` or `builders.ts`. Type-checking flags one that is used but not listed, and the seed refuses to run.
4. Run `npx prisma db seed` against your development database and check the page.
5. Open a pull request.

The conventions the data follows:

- `lastContact` is when the craft was last heard from, as received on Earth. Write it with a time (`"2017-09-15T11:55:46Z"`) only when the time is established; otherwise just the date.
- `endDeclared` is the day the operating agency announced the end. Leave a date out when it cannot be confirmed.
- A mission's only spacecraft shares the mission's status and dates. When a mission has several spacecraft, each must state its own status, and the seed enforces this.
- Destinations are the places a mission studied or landed on, not gravity-assist flybys.
- Catalogue values that need correcting are overridden in `missions.ts` with a comment giving the reason; companies with several GCAT codes are merged in `builderAliases`.

## Deploys and environments

| | Database | Deployed by |
| --- | --- | --- |
| Local development | Neon `dev` branch | `npm run dev` |
| Pull request preview | Neon `dev` branch | Vercel, for every pull request |
| Production | Neon main branch | Vercel, on every merge to `main` |

Every pull request also runs lint and a TypeScript check in GitHub Actions (`.github/workflows/checks.yml`). A merge to `main` deploys to production: the build applies any new migration, reloads the mission data and rebuilds the pages.

## Project layout

```
prisma/
  schema.prisma          database tables
  migrations/            schema changes, applied in order
  data/                  missions, agencies, destinations, builders, catalogue snapshot
  seed.ts                loads prisma/data into the database
scripts/
  import-catalogue.ts    refreshes the GCAT snapshot
src/
  app/                   pages: home, archive, mission page, not-found
  components/            tiles, status tags, theme switch, navbar
  lib/                   database client and formatting helpers
branding/                logo, colours and type
docs/                    mission list and screenshots
```
