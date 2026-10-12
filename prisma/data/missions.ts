import type {
  Discipline,
  PowerSource,
  SpacecraftKind,
  Status,
} from "../../src/generated/prisma/enums";
import type { AgencyAbbreviation } from "./agencies";
import type { DestinationSlug } from "./destinations";

// Dates are ISO 8601 in UTC, e.g. "1977-09-05T12:56:01Z". Set endTimeKnown
// only when the end date carries a real time of day.
export type SpacecraftSeed = {
  slug: string;
  name: string;
  kind: SpacecraftKind;
  description: string;
  status: Status;
  endDate?: string;
  endTimeKnown?: boolean;
  launchMassKg?: number;
  powerSource?: PowerSource;
  dimensions?: string;
  builder?: string;
  imageUrl?: string;
  imageCredit?: string;
};

export type MissionSeed = {
  slug: string;
  name: string;
  discipline: Discipline;
  status: Status;
  launchDate: string;
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
    launchDate: "2021-12-25T12:20:00Z",
    description: "Infrared space telescope located at the Sun-Earth L2 point.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2021-130A",
    agencies: ["NASA", "ESA", "CSA"],
    destinations: ["sun-earth-l2"],
    spacecraft: [
      {
        slug: "jwst",
        name: "James Webb Space Telescope",
        kind: "TELESCOPE",
        description:
          "Infrared observatory with a 6.5 m segmented primary mirror, kept cold behind a five-layer sunshield.",
        status: "ACTIVE",
        launchMassKg: 6500,
        powerSource: "SOLAR",
        dimensions: "21.2 m × 14.2 m (sunshield)",
        builder: "Northrop Grumman, Ball Aerospace, L3Harris",
      },
    ],
  },
  {
    slug: "voyager-1",
    name: "Voyager 1",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    launchDate: "1977-09-05T12:56:01Z",
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
        kind: "FLYBY",
        description:
          "Three-axis stabilised probe built around a 3.7 m high-gain antenna, powered by three radioisotope thermoelectric generators.",
        status: "ACTIVE",
        launchMassKg: 721.9,
        powerSource: "RADIOISOTOPE",
        builder: "Jet Propulsion Laboratory",
      },
    ],
  },
  {
    slug: "voyager-2",
    name: "Voyager 2",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    launchDate: "1977-08-20T14:29:00Z",
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
        kind: "FLYBY",
        description:
          "Three-axis stabilised probe built around a 3.7 m high-gain antenna, powered by three radioisotope thermoelectric generators.",
        status: "ACTIVE",
        launchMassKg: 721.9,
        powerSource: "RADIOISOTOPE",
        builder: "Jet Propulsion Laboratory",
      },
    ],
  },
  {
    slug: "hubble",
    name: "Hubble Space Telescope",
    discipline: "ASTROPHYSICS",
    status: "ACTIVE",
    launchDate: "1990-04-24T12:33:51Z",
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
        kind: "TELESCOPE",
        description:
          "Reflecting telescope with a 2.4 m primary mirror, serviced in orbit by five Space Shuttle missions.",
        status: "ACTIVE",
        launchMassKg: 11110,
        powerSource: "SOLAR",
        dimensions: "13 m × 4.3 m",
        builder: "Lockheed (spacecraft), Perkin-Elmer (optics)",
      },
    ],
  },
];
