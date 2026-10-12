import type {
  Discipline,
  PowerSource,
  SpacecraftKind,
  Status,
} from "../../src/generated/prisma/enums";
import type { AgencyAbbreviation } from "./agencies";
import type { BuilderCode } from "./builders";
import type { DestinationSlug } from "./destinations";

// A spacecraft with a catalogueId takes its designator, masses, size and
// builders from catalogue.json. A value set here overrides the catalogue, and
// null blanks it. Dates are ISO 8601 in UTC, e.g. "2017-09-15T11:55:46Z". Set
// endTimeKnown only when the end date carries a real time of day.
export type SpacecraftSeed = {
  slug: string;
  name: string;
  catalogueId?: string;
  designator?: string | null;
  kind: SpacecraftKind;
  description: string;
  status: Status;
  endDate?: string;
  endTimeKnown?: boolean;
  launchMassKg?: number | null;
  dryMassKg?: number | null;
  lengthM?: number | null;
  diameterM?: number | null;
  spanM?: number | null;
  powerSource?: PowerSource;
  builders?: BuilderCode[];
  imageUrl?: string;
  imageCredit?: string;
};

// launchDate defaults to the catalogue launch time of the first spacecraft.
export type MissionSeed = {
  slug: string;
  name: string;
  discipline: Discipline;
  status: Status;
  launchDate?: string;
  endDate?: string;
  endTimeKnown?: boolean;
  description: string;
  imageUrl?: string;
  imageCredit?: string;
  sourceUrl?: string;
  agencies: AgencyAbbreviation[];
  destinations: DestinationSlug[];
  spacecraft: SpacecraftSeed[];
};

export const missions: MissionSeed[] = [
  {
    slug: "jwst",
    name: "James Webb Space Telescope",
    discipline: "ASTROPHYSICS",
    status: "ACTIVE",
    description: "Infrared space telescope located at the Sun-Earth L2 point.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2021-130A",
    agencies: ["NASA", "ESA", "CSA"],
    destinations: ["sun-earth-l2"],
    spacecraft: [
      {
        slug: "jwst",
        name: "James Webb Space Telescope",
        catalogueId: "S50463",
        kind: "TELESCOPE",
        description:
          "Infrared observatory with a 6.5 m segmented primary mirror, kept cold behind a five-layer sunshield.",
        status: "ACTIVE",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "voyager-1",
    name: "Voyager 1",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A spacecraft that performed flybys of Jupiter, Saturn, and Saturn's moon Titan. Currently exploring interstellar space.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1977-084A",
    agencies: ["NASA"],
    destinations: ["jupiter", "saturn", "interstellar-space"],
    spacecraft: [
      {
        slug: "voyager-1",
        name: "Voyager 1",
        catalogueId: "S10321",
        kind: "FLYBY",
        description:
          "Three-axis stabilised probe built around a 3.7 m high-gain antenna, powered by three radioisotope thermoelectric generators.",
        status: "ACTIVE",
        powerSource: "RADIOISOTOPE",
      },
    ],
  },
  {
    slug: "voyager-2",
    name: "Voyager 2",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A spacecraft that performed flybys of Jupiter, Saturn, Uranus, and Neptune. Currently exploring interstellar space.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1977-076A",
    agencies: ["NASA"],
    destinations: [
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
      "interstellar-space",
    ],
    spacecraft: [
      {
        slug: "voyager-2",
        name: "Voyager 2",
        catalogueId: "S10271",
        kind: "FLYBY",
        description:
          "Three-axis stabilised probe built around a 3.7 m high-gain antenna, powered by three radioisotope thermoelectric generators.",
        status: "ACTIVE",
        powerSource: "RADIOISOTOPE",
      },
    ],
  },
  {
    slug: "hubble",
    name: "Hubble Space Telescope",
    discipline: "ASTROPHYSICS",
    status: "ACTIVE",
    description:
      "Space telescope capable of observing the universe in ultraviolet, visible, and infrared light.",
    sourceUrl:
      "https://science.nasa.gov/mission/hubble/overview/hubble-by-the-numbers/",
    agencies: ["NASA", "ESA"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "hubble",
        name: "Hubble Space Telescope",
        catalogueId: "S20580",
        kind: "TELESCOPE",
        description:
          "Reflecting telescope with a 2.4 m primary mirror, serviced in orbit by five Space Shuttle missions.",
        status: "ACTIVE",
        // GCAT gives 7,547 kg for the main body alone and counts attached
        // parts separately. This is its total at launch; Hubble carries no
        // propellant, so there is no separate dry mass.
        launchMassKg: 10843,
        dryMassKg: null,
        powerSource: "SOLAR",
      },
    ],
  },
];
