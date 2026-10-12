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
// null blanks it.
//
// A spacecraft also takes its status, lastContact and endDeclared from its
// mission unless it sets its own; again, null blanks one.
//
// lastContact is when the craft was last heard from or commanded, as received
// on Earth: "2017-09-15T11:55:46Z" when the time is known, "2018-11-15" when
// only the day is. endDeclared is the day the operating agency announced the
// end, e.g. "2018-10-30".
export type SpacecraftSeed = {
  slug: string;
  name: string;
  catalogueId?: string;
  designator?: string | null;
  kind: SpacecraftKind;
  description: string;
  status?: Status;
  lastContact?: string | null;
  endDeclared?: string | null;
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
  lastContact?: string;
  endDeclared?: string;
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
        // GCAT gives 7,547 kg for the main body alone and counts attached
        // parts separately. This is its total at launch; Hubble carries no
        // propellant, so there is no separate dry mass.
        launchMassKg: 10843,
        dryMassKg: null,
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "cassini-huygens",
    name: "Cassini–Huygens",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2017-09-15T11:55:46Z",
    endDeclared: "2017-09-15",
    description:
      "A joint NASA, ESA and Italian Space Agency mission that orbited Saturn for 13 years and landed the Huygens probe on Titan. It ended with a planned dive into Saturn's atmosphere.",
    sourceUrl: "https://science.nasa.gov/mission/cassini/",
    agencies: ["NASA", "ESA", "ASI"],
    destinations: ["jupiter", "saturn", "titan"],
    spacecraft: [
      {
        slug: "cassini",
        name: "Cassini",
        catalogueId: "S25008",
        kind: "ORBITER",
        description:
          "Saturn orbiter carrying twelve science instruments and a 4 m high-gain antenna, powered by three radioisotope thermoelectric generators.",
        powerSource: "RADIOISOTOPE",
      },
      {
        slug: "huygens",
        name: "Huygens",
        catalogueId: "A06904",
        kind: "LANDER",
        description:
          "ESA's atmospheric probe, which descended by parachute through Titan's atmosphere and returned data from the surface: the first landing in the outer Solar System.",
        lastContact: "2005-01-14",
        endDeclared: null,
        // GCAT gives 211 kg for the descent module alone. This is its total
        // at launch, including the heat shield and back cover.
        launchMassKg: 320,
        dryMassKg: null,
        powerSource: "BATTERY",
        // GCAT lists Alcatel Space, the later name of the same Cannes works.
        builders: ["AESPC"],
      },
    ],
  },
  {
    slug: "mars-2020",
    name: "Mars 2020",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A NASA mission exploring Jezero crater for signs of ancient microbial life and collecting rock samples for possible return to Earth.",
    sourceUrl: "https://science.nasa.gov/mission/mars-2020-perseverance/",
    agencies: ["NASA"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "perseverance",
        name: "Perseverance",
        catalogueId: "S45983",
        kind: "ROVER",
        description:
          "Car-sized rover with a drill and sample-caching system, powered by a radioisotope thermoelectric generator.",
        powerSource: "RADIOISOTOPE",
        // GCAT lists Lockheed Martin, which built the aeroshell.
        builders: ["JPL"],
      },
      {
        slug: "ingenuity",
        name: "Ingenuity",
        catalogueId: "A09615",
        kind: "ROTORCRAFT",
        description:
          "Small solar-powered helicopter that made the first powered, controlled flight on another planet and went on to fly 72 times.",
        status: "COMPLETED",
        lastContact: "2024-04-16",
        endDeclared: "2024-01-25",
        powerSource: "SOLAR",
        builders: ["JPL"],
      },
    ],
  },
  {
    slug: "rosetta",
    name: "Rosetta",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2016-09-30T11:19:36Z",
    endDeclared: "2016-09-30",
    description:
      "An ESA mission that became the first to orbit a comet, following 67P/Churyumov–Gerasimenko for two years and delivering the Philae lander to its surface.",
    sourceUrl: "https://www.esa.int/Science_Exploration/Space_Science/Rosetta",
    agencies: ["ESA"],
    destinations: ["67p-churyumov-gerasimenko", "steins", "lutetia"],
    spacecraft: [
      {
        slug: "rosetta",
        name: "Rosetta",
        catalogueId: "S28169",
        kind: "ORBITER",
        description:
          "Comet orbiter carrying eleven science instruments, with two 14 m solar wings for operating far from the Sun.",
        powerSource: "SOLAR",
        // GCAT lists EADS Bremen; the prime contractor was Astrium in
        // Friedrichshafen.
        builders: ["ASTDF"],
      },
      {
        slug: "philae",
        name: "Philae",
        catalogueId: "A06860",
        kind: "LANDER",
        description:
          "Lander that made the first soft landing on a comet. It bounced into a shaded spot and ran for about two and a half days on its primary battery.",
        lastContact: "2015-07-09",
        endDeclared: "2016-07-27",
        powerSource: "SOLAR",
        // Built by a European consortium led by DLR.
        builders: ["DLR"],
      },
    ],
  },
  {
    slug: "change-4",
    name: "Chang'e 4",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A CNSA mission that made the first soft landing on the far side of the Moon, in Von Kármán crater, relaying its data through the Queqiao satellite.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2018-103A",
    agencies: ["CNSA"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "change-4-lander",
        name: "Chang'e 4 lander",
        catalogueId: "S43845",
        kind: "LANDER",
        description:
          "Stationary lander carrying cameras, a low-frequency radio spectrometer and a small biology experiment.",
        powerSource: "SOLAR",
      },
      {
        slug: "yutu-2",
        name: "Yutu-2",
        catalogueId: "A09236",
        kind: "ROVER",
        description:
          "Six-wheeled rover, and the longest-lived rover on the Moon.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "chandrayaan-3",
    name: "Chandrayaan-3",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2023-09-04",
    description:
      "An ISRO mission that made India the fourth country to soft-land on the Moon and the first to land near its south pole. The lander and rover operated for one lunar day.",
    sourceUrl: "https://www.isro.gov.in/Chandrayaan3.html",
    agencies: ["ISRO"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "vikram",
        name: "Vikram",
        catalogueId: "S57320",
        kind: "LANDER",
        description:
          "Lander that touched down at about 69° south, carrying instruments to measure surface temperature, seismic activity and plasma.",
        powerSource: "SOLAR",
      },
      {
        slug: "pragyan",
        name: "Pragyan",
        catalogueId: "A10997",
        kind: "ROVER",
        description:
          "Six-wheeled, 26 kg rover that analysed the composition of the soil near the landing site.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "venera-7",
    name: "Venera 7",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1970-12-15",
    description:
      "A Soviet probe that became the first spacecraft to land on another planet and transmit data from its surface. It returned 23 minutes of signal from the surface of Venus.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1970-060A",
    agencies: ["USSR"],
    destinations: ["venus"],
    spacecraft: [
      {
        slug: "venera-7",
        name: "Venera 7",
        catalogueId: "S04489",
        kind: "LANDER",
        description:
          "Cruise stage carrying a descent capsule built to withstand the pressure and heat at the surface of Venus.",
        // GCAT gives 680 kg for the cruise stage alone. This is its total at
        // launch, including the 480 kg descent capsule.
        launchMassKg: 1180,
      },
    ],
  },
  {
    slug: "hayabusa2",
    name: "Hayabusa2",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A JAXA mission that collected samples from the asteroid Ryugu and returned them to Earth in December 2020. The spacecraft is now on an extended mission to other asteroids.",
    sourceUrl: "https://www.hayabusa2.jaxa.jp/en/",
    agencies: ["JAXA", "DLR", "CNES"],
    destinations: ["ryugu"],
    spacecraft: [
      {
        slug: "hayabusa2",
        name: "Hayabusa2",
        catalogueId: "S40319",
        kind: "ORBITER",
        description:
          "Ion-engine spacecraft that touched down on Ryugu twice to collect samples and deployed several small landers.",
        powerSource: "SOLAR",
        // GCAT lists ISAS/JAXA, the operator; NEC built the spacecraft.
        builders: ["NECT"],
      },
      {
        slug: "mascot",
        name: "MASCOT",
        catalogueId: "A08308",
        kind: "LANDER",
        description:
          "Shoebox-sized lander from the German and French space agencies, which hopped across Ryugu's surface for about 17 hours on battery power.",
        status: "COMPLETED",
        lastContact: "2018-10-03",
        powerSource: "BATTERY",
      },
    ],
  },
  {
    slug: "mars-climate-orbiter",
    name: "Mars Climate Orbiter",
    discipline: "PLANETARY_SCIENCE",
    status: "FAILED",
    lastContact: "1999-09-23T09:04:52Z",
    description:
      "A NASA orbiter intended to study the Martian climate and relay data for Mars Polar Lander. It was lost on arrival when it passed too close to the planet, after thruster data was supplied in imperial units where metric was expected.",
    sourceUrl: "https://science.nasa.gov/mission/mars-climate-orbiter/",
    agencies: ["NASA"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "mars-climate-orbiter",
        name: "Mars Climate Orbiter",
        catalogueId: "S25571",
        kind: "ORBITER",
        description:
          "Three-axis stabilised orbiter carrying a colour imager and an atmospheric sounder.",
        powerSource: "SOLAR",
        // GCAT's second code for this craft resolves to the University of
        // Denver, which looks like a catalogue slip.
        builders: ["LMA"],
      },
    ],
  },
  {
    slug: "kepler",
    name: "Kepler",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    lastContact: "2018-11-15",
    endDeclared: "2018-10-30",
    description:
      "A NASA space telescope that watched for the slight dimming of stars as planets crossed in front of them, discovering more than 2,600 exoplanets.",
    sourceUrl: "https://science.nasa.gov/mission/kepler/",
    agencies: ["NASA"],
    destinations: ["heliocentric-orbit"],
    spacecraft: [
      {
        slug: "kepler",
        name: "Kepler",
        catalogueId: "S34380",
        kind: "TELESCOPE",
        description:
          "Photometer with a 0.95 m aperture and a 95-megapixel camera, which stared at a single field of stars for four years before a second mission, K2.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "gaia",
    name: "Gaia",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    lastContact: "2025-03-27",
    endDeclared: "2025-03-27",
    description:
      "An ESA mission that measured the positions, distances and motions of nearly two billion stars to build the most precise three-dimensional map of the Milky Way.",
    sourceUrl: "https://www.esa.int/Science_Exploration/Space_Science/Gaia",
    agencies: ["ESA"],
    destinations: ["sun-earth-l2"],
    spacecraft: [
      {
        slug: "gaia",
        name: "Gaia",
        catalogueId: "S39479",
        kind: "TELESCOPE",
        description:
          "Two telescopes feeding a billion-pixel camera, spinning slowly to scan the whole sky from the Sun–Earth L2 point.",
        powerSource: "SOLAR",
      },
    ],
  },
];
