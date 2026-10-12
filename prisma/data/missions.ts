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
// A mission's only spacecraft takes its status, lastContact and endDeclared
// from the mission unless it sets its own. When a mission has more than one
// spacecraft, each must set its own status and dates; nothing is borrowed.
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
        status: "COMPLETED",
        lastContact: "2017-09-15T11:55:46Z",
        endDeclared: "2017-09-15",
        powerSource: "RADIOISOTOPE",
      },
      {
        slug: "huygens",
        name: "Huygens",
        catalogueId: "A06904",
        kind: "LANDER",
        description:
          "ESA's atmospheric probe, which descended by parachute through Titan's atmosphere and returned data from the surface: the first landing in the outer Solar System.",
        status: "COMPLETED",
        lastContact: "2005-01-14",
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
        status: "ACTIVE",
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
        status: "COMPLETED",
        lastContact: "2016-09-30T11:19:36Z",
        endDeclared: "2016-09-30",
        powerSource: "SOLAR",
      },
      {
        slug: "philae",
        name: "Philae",
        catalogueId: "A06860",
        kind: "LANDER",
        description:
          "Lander that made the first soft landing on a comet. It bounced into a shaded spot and ran for about two and a half days on its primary battery.",
        status: "COMPLETED",
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
        status: "ACTIVE",
        powerSource: "SOLAR",
      },
      {
        slug: "yutu-2",
        name: "Yutu-2",
        catalogueId: "A09236",
        kind: "ROVER",
        description:
          "Six-wheeled rover, and the longest-lived rover on the Moon.",
        status: "ACTIVE",
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
        status: "COMPLETED",
        lastContact: "2023-09-04",
        powerSource: "SOLAR",
      },
      {
        slug: "pragyan",
        name: "Pragyan",
        catalogueId: "A10997",
        kind: "ROVER",
        description:
          "Six-wheeled, 26 kg rover that analysed the composition of the soil near the landing site.",
        status: "COMPLETED",
        lastContact: "2023-09-04",
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
        status: "ACTIVE",
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
  {
    slug: "luna-2",
    name: "Luna 2",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1959-09-13",
    description:
      "The first spacecraft to reach the surface of another world, striking the Moon after a flight of about a day and a half.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1959-014A",
    agencies: ["USSR"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "luna-2",
        name: "Luna 2",
        catalogueId: "S00114",
        // GCAT uses the original Greek-letter designation, 1959 XI 1.
        designator: "1959-014A",
        kind: "IMPACTOR",
        description:
          "Spherical probe carrying radiation detectors and a magnetometer, which found that the Moon has no significant magnetic field.",
        powerSource: "BATTERY",
      },
    ],
  },
  {
    slug: "luna-3",
    name: "Luna 3",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1959-10-22",
    description:
      "The first spacecraft to photograph the far side of the Moon, returning images that covered about 70% of it.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1959-008A",
    agencies: ["USSR"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "luna-3",
        name: "Luna 3",
        catalogueId: "S00021",
        // GCAT uses the original Greek-letter designation, 1959 THE 1.
        designator: "1959-008A",
        kind: "FLYBY",
        description:
          "Probe that photographed the Moon on film, developed it on board and scanned the pictures for radio transmission to Earth.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "luna-9",
    name: "Luna 9",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1966-02-06",
    description:
      "The first spacecraft to make a soft landing on the Moon and the first to send back pictures from its surface.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1966-006A",
    agencies: ["USSR"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "luna-9",
        name: "Luna 9",
        catalogueId: "S01954",
        kind: "LANDER",
        description:
          "Cruise stage that delivered a 99 kg landing capsule, cushioned by airbags, to Oceanus Procellarum.",
        // GCAT's total at launch, including the landing capsule.
        launchMassKg: 1583,
      },
    ],
  },
  {
    slug: "surveyor-1",
    name: "Surveyor 1",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1967-01-07",
    description:
      "The first American spacecraft to soft-land on the Moon, returning more than 11,000 images from Oceanus Procellarum.",
    sourceUrl: "https://science.nasa.gov/mission/surveyor-1/",
    agencies: ["NASA"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "surveyor-1",
        name: "Surveyor 1",
        catalogueId: "S02185",
        kind: "LANDER",
        description:
          "Three-legged lander with a television camera, slowed for landing by a solid retro-rocket and three vernier engines.",
        // GCAT's total at launch, including the retro-rocket it dropped
        // before landing.
        launchMassKg: 986,
        powerSource: "SOLAR",
        // GCAT lists JPL, which managed the programme; Hughes built it.
        builders: ["HAC"],
      },
    ],
  },
  {
    slug: "luna-16",
    name: "Luna 16",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1970-09-24",
    description:
      "The first robotic mission to bring samples back from another world, returning 101 grams of lunar soil from Mare Fecunditatis.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1970-072A",
    agencies: ["USSR"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "luna-16",
        name: "Luna 16",
        catalogueId: "S04527",
        kind: "LANDER",
        description:
          "Descent stage with a drill arm, topped by an ascent stage that launched a sealed sample capsule back to Earth.",
        // GCAT's total at launch, including the ascent stage and capsule.
        launchMassKg: 5700,
      },
    ],
  },
  {
    slug: "luna-17",
    name: "Luna 17",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1971-09-14",
    endDeclared: "1971-10-04",
    description:
      "A Soviet mission that landed Lunokhod 1, the first remote-controlled rover on another world, in Mare Imbrium.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1970-095A",
    agencies: ["USSR"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "luna-17-lander",
        name: "Luna 17 lander",
        catalogueId: "S04691",
        kind: "LANDER",
        description:
          "Descent stage with twin ramps that let the rover drive off in either direction.",
        status: "COMPLETED",
        // GCAT's 2,944 kg is far from the 5,600 kg other sources give for
        // the whole craft, so no mass is shown.
        launchMassKg: null,
      },
      {
        slug: "lunokhod-1",
        name: "Lunokhod 1",
        catalogueId: "A01885",
        kind: "ROVER",
        description:
          "Eight-wheeled rover driven by radio from Earth, which travelled about 10.5 km over ten months.",
        status: "COMPLETED",
        lastContact: "1971-09-14",
        endDeclared: "1971-10-04",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "smart-1",
    name: "SMART-1",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2006-09-03T05:42:22Z",
    endDeclared: "2006-09-03",
    description:
      "ESA's first mission to the Moon, built to test solar-electric propulsion. It spiralled out from Earth orbit over 13 months and then mapped the lunar surface.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-043C",
    agencies: ["ESA"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "smart-1",
        name: "SMART-1",
        catalogueId: "S27949",
        kind: "ORBITER",
        description:
          "Small orbiter driven by a Hall-effect ion thruster fed with xenon.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "kaguya",
    name: "Kaguya (SELENE)",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2009-06-10T18:25:00Z",
    endDeclared: "2009-06-10",
    description:
      "A JAXA lunar orbiter that mapped the Moon's surface, gravity and magnetic field in detail, working with two small sub-satellites.",
    sourceUrl: "https://www.kaguya.jaxa.jp/index_e.htm",
    agencies: ["JAXA"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "kaguya",
        name: "Kaguya",
        catalogueId: "S32054",
        kind: "ORBITER",
        description:
          "Main orbiter carrying the science instruments and a high-definition television camera.",
        status: "COMPLETED",
        lastContact: "2009-06-10T18:25:00Z",
        endDeclared: "2009-06-10",
        powerSource: "SOLAR",
      },
      {
        slug: "okina",
        name: "Okina",
        catalogueId: "S32055",
        kind: "ORBITER",
        description:
          "Relay sub-satellite that passed on signals from the main orbiter while it was behind the Moon, allowing the far side's gravity to be mapped.",
        status: "COMPLETED",
        lastContact: "2009-02-12T10:46:00Z",
        powerSource: "SOLAR",
      },
      {
        slug: "ouna",
        name: "Ouna",
        catalogueId: "S32056",
        kind: "ORBITER",
        description:
          "Sub-satellite carrying a radio source for precise measurements of the Moon's gravity field.",
        status: "COMPLETED",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "chandrayaan-1",
    name: "Chandrayaan-1",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2009-08-28",
    description:
      "India's first mission to the Moon. Its instruments, including NASA's Moon Mineralogy Mapper, found water molecules across the lunar surface.",
    sourceUrl: "https://www.isro.gov.in/Chandrayaan_1.html",
    agencies: ["ISRO"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "chandrayaan-1",
        name: "Chandrayaan-1",
        catalogueId: "S33405",
        kind: "ORBITER",
        description:
          "Cube-shaped orbiter carrying eleven science instruments, five from India and six from abroad.",
        status: "COMPLETED",
        lastContact: "2009-08-28",
        powerSource: "SOLAR",
      },
      {
        slug: "moon-impact-probe",
        name: "Moon Impact Probe",
        catalogueId: "A07423",
        kind: "IMPACTOR",
        description:
          "Small probe released from the orbiter to strike the Moon near its south pole, sampling the thin atmosphere on the way down.",
        status: "COMPLETED",
        lastContact: "2008-11-14T15:01:00Z",
        powerSource: "BATTERY",
      },
    ],
  },
  {
    slug: "lunar-reconnaissance-orbiter",
    name: "Lunar Reconnaissance Orbiter",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A NASA orbiter that has mapped the Moon in detail since 2009, imaging the Apollo landing sites and measuring temperatures in permanently shadowed craters.",
    sourceUrl: "https://science.nasa.gov/mission/lro/",
    agencies: ["NASA"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "lunar-reconnaissance-orbiter",
        name: "Lunar Reconnaissance Orbiter",
        catalogueId: "S35315",
        kind: "ORBITER",
        description:
          "Orbiter with seven instruments, including a camera that can resolve features half a metre across.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "change-3",
    name: "Chang'e 3",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A CNSA mission that made the first soft landing on the Moon since 1976, setting down in Mare Imbrium with the Yutu rover.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2013-070A",
    agencies: ["CNSA"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "change-3-lander",
        name: "Chang'e 3 lander",
        catalogueId: "S39458",
        kind: "LANDER",
        description:
          "Stationary lander carrying a near-ultraviolet telescope that observed from the lunar surface for years.",
        status: "ACTIVE",
        powerSource: "SOLAR",
      },
      {
        slug: "yutu",
        name: "Yutu",
        catalogueId: "A08071",
        kind: "ROVER",
        description:
          "Six-wheeled rover with ground-penetrating radar. It stopped driving after its second lunar day but kept returning data for more than two years.",
        status: "COMPLETED",
        lastContact: "2016-07-31",
        endDeclared: "2016-08-03",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "change-5",
    name: "Chang'e 5",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A CNSA mission that returned 1,731 grams of lunar samples from Oceanus Procellarum in December 2020, the first brought back since 1976.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2020-087A",
    agencies: ["CNSA"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "change-5-orbiter",
        name: "Chang'e 5 orbiter",
        catalogueId: "S47097",
        kind: "ORBITER",
        description:
          "Orbiter that carried the return capsule back to Earth, then went on to an extended mission at the Sun–Earth L1 point and in a distant lunar orbit.",
        status: "ACTIVE",
        powerSource: "SOLAR",
      },
      {
        slug: "change-5-lander",
        name: "Chang'e 5 lander",
        catalogueId: "A09653",
        kind: "LANDER",
        description:
          "Lander that drilled and scooped the samples and served as the launch pad for the ascent vehicle that carried them to lunar orbit.",
        status: "COMPLETED",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "slim",
    name: "SLIM",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2024-04-29",
    endDeclared: "2024-08-23",
    description:
      "Japan's first Moon lander, which demonstrated a pinpoint landing within about 55 metres of its target near Shioli crater. It touched down tilted onto its nose but survived three lunar nights.",
    sourceUrl: "https://global.jaxa.jp/projects/sas/slim/",
    agencies: ["JAXA"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "slim",
        name: "SLIM",
        catalogueId: "S57803",
        kind: "LANDER",
        description:
          "Lightweight lander that navigated by matching camera images of craters against onboard maps. It released two tiny rovers just before touchdown.",
        powerSource: "SOLAR",
        // GCAT lists JAXA, the operator; Mitsubishi Electric built it.
        builders: ["MELCO"],
      },
    ],
  },
  {
    slug: "beresheet",
    name: "Beresheet",
    discipline: "PLANETARY_SCIENCE",
    status: "FAILED",
    lastContact: "2019-04-11T19:23:00Z",
    endDeclared: "2019-04-11",
    description:
      "The first privately funded mission to attempt a Moon landing, built by the Israeli non-profit SpaceIL with Israel Aerospace Industries. A main-engine failure during descent caused it to crash.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2019-009B",
    agencies: ["SpaceIL"],
    destinations: ["moon"],
    spacecraft: [
      {
        slug: "beresheet",
        name: "Beresheet",
        catalogueId: "S44049",
        kind: "LANDER",
        description:
          "Compact four-legged lander that carried a magnetometer and a NASA laser retroreflector.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "mariner-10",
    name: "Mariner 10",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1975-03-24T12:21:00Z",
    endDeclared: "1975-03-24",
    description:
      "The first spacecraft to visit Mercury and the first to use one planet's gravity to reach another, swinging past Venus on the way. It flew past Mercury three times and imaged almost half its surface.",
    sourceUrl: "https://science.nasa.gov/mission/mariner-10/",
    agencies: ["NASA"],
    destinations: ["venus", "mercury"],
    spacecraft: [
      {
        slug: "mariner-10",
        name: "Mariner 10",
        catalogueId: "S06919",
        kind: "FLYBY",
        description:
          "Three-axis stabilised probe with twin television cameras and a sunshade to cope with the heat near Mercury.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "messenger",
    name: "MESSENGER",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2015-04-30",
    endDeclared: "2015-04-30",
    description:
      "The first spacecraft to orbit Mercury. Over four years it mapped the whole planet and found water ice in permanently shadowed craters near the poles.",
    sourceUrl: "https://science.nasa.gov/mission/messenger/",
    agencies: ["NASA"],
    destinations: ["mercury"],
    spacecraft: [
      {
        slug: "messenger",
        name: "MESSENGER",
        catalogueId: "S28391",
        kind: "ORBITER",
        description:
          "Orbiter that worked behind a ceramic-cloth sunshade, carrying seven instruments and a radio science experiment.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "bepicolombo",
    name: "BepiColombo",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A joint ESA and JAXA mission carrying two orbiters to Mercury, on a cruise of eight years with flybys of Earth, Venus and Mercury itself.",
    sourceUrl:
      "https://www.esa.int/Science_Exploration/Space_Science/BepiColombo",
    agencies: ["ESA", "JAXA"],
    destinations: ["mercury"],
    spacecraft: [
      {
        slug: "bepicolombo-mpo",
        name: "Mercury Planetary Orbiter",
        catalogueId: "S43653",
        kind: "ORBITER",
        description:
          "ESA's orbiter, built to study Mercury's surface and interior from a low orbit.",
        status: "ACTIVE",
        powerSource: "SOLAR",
      },
      {
        slug: "mio",
        name: "Mio",
        catalogueId: "A09204",
        kind: "ORBITER",
        description:
          "JAXA's spin-stabilised orbiter, built to study Mercury's magnetic field and its interaction with the solar wind.",
        status: "ACTIVE",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "mariner-2",
    name: "Mariner 2",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1963-01-03",
    description:
      "The first spacecraft to fly past another planet and return data. Its measurements showed that Venus has a very hot surface beneath its clouds.",
    sourceUrl: "https://science.nasa.gov/mission/mariner-2/",
    agencies: ["NASA"],
    destinations: ["venus"],
    spacecraft: [
      {
        slug: "mariner-2",
        name: "Mariner 2",
        catalogueId: "S00374",
        // GCAT uses the original Greek-letter designation, 1962 A RHO 1.
        designator: "1962-041A",
        kind: "FLYBY",
        description:
          "Probe based on the Ranger lunar design, with microwave and infrared radiometers to scan Venus during the flyby.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "venera-9",
    name: "Venera 9",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1976-03-22",
    description:
      "A Soviet mission whose lander returned the first images from the surface of another planet, while its carrier became the first spacecraft to orbit Venus.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1975-050A",
    agencies: ["USSR"],
    destinations: ["venus"],
    spacecraft: [
      {
        slug: "venera-9-orbiter",
        name: "Venera 9 orbiter",
        catalogueId: "S07915",
        kind: "ORBITER",
        description:
          "Orbiter that relayed the lander's signals and then studied Venus's clouds and upper atmosphere.",
        status: "COMPLETED",
        lastContact: "1976-03-22",
        powerSource: "SOLAR",
      },
      {
        slug: "venera-9-lander",
        name: "Venera 9 lander",
        catalogueId: "S08411",
        kind: "LANDER",
        description:
          "Lander that survived 53 minutes on the surface, sending back a black-and-white panorama of the rocks around it.",
        status: "COMPLETED",
        lastContact: "1975-10-22",
        // GCAT's total at launch, including the entry shell.
        launchMassKg: 1560,
        powerSource: "BATTERY",
      },
    ],
  },
  {
    slug: "vega-1",
    name: "Vega 1",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1987-01-30",
    description:
      "A Soviet-led international mission that dropped a lander and a balloon at Venus, then flew on to pass within 9,000 km of Halley's Comet.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1984-125A",
    agencies: ["USSR"],
    destinations: ["venus", "halley"],
    spacecraft: [
      {
        slug: "vega-1",
        name: "Vega 1",
        catalogueId: "S15432",
        kind: "FLYBY",
        description:
          "Three-axis stabilised spacecraft that carried the Venus package and then imaged the nucleus of Halley's Comet.",
        status: "COMPLETED",
        lastContact: "1987-01-30",
        powerSource: "SOLAR",
      },
      {
        slug: "vega-1-lander",
        name: "Vega 1 lander",
        catalogueId: "S15858",
        kind: "LANDER",
        description:
          "Lander that measured the atmosphere during descent. Its surface experiments switched on early and returned little.",
        status: "COMPLETED",
        lastContact: "1985-06-11",
        powerSource: "BATTERY",
      },
      {
        slug: "vega-1-balloon",
        name: "Vega 1 balloon",
        catalogueId: "S15859",
        kind: "ATMOSPHERIC_PROBE",
        description:
          "Helium balloon that floated about 54 km up in Venus's clouds for nearly two days, tracked by radio telescopes on Earth.",
        status: "COMPLETED",
        lastContact: "1985-06-13",
        powerSource: "BATTERY",
      },
    ],
  },
  {
    slug: "magellan",
    name: "Magellan",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1994-10-13T10:05:00Z",
    endDeclared: "1994-10-13",
    description:
      "A NASA orbiter that used radar to see through Venus's clouds, mapping 98% of the surface in detail.",
    sourceUrl: "https://science.nasa.gov/mission/magellan/",
    agencies: ["NASA"],
    destinations: ["venus"],
    spacecraft: [
      {
        slug: "magellan",
        name: "Magellan",
        catalogueId: "S19969",
        kind: "ORBITER",
        description:
          "Orbiter built largely from spare Voyager and Galileo parts, using its 3.7 m dish for both radar mapping and communications.",
        // GCAT's total at launch, including the solid motor that put it
        // into orbit around Venus.
        launchMassKg: 3348,
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "venus-express",
    name: "Venus Express",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2015-01-18",
    endDeclared: "2014-12-16",
    description:
      "ESA's first mission to Venus, which studied the planet's atmosphere and clouds from orbit for eight years, far beyond its planned 500 days.",
    sourceUrl:
      "https://www.esa.int/Science_Exploration/Space_Science/Venus_Express",
    agencies: ["ESA"],
    destinations: ["venus"],
    spacecraft: [
      {
        slug: "venus-express",
        name: "Venus Express",
        catalogueId: "S28901",
        kind: "ORBITER",
        description:
          "Orbiter built on the Mars Express design, reusing spare instruments from Mars Express and Rosetta.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "akatsuki",
    name: "Akatsuki",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    endDeclared: "2025-09-18",
    description:
      "A JAXA orbiter that studied Venus's weather and fast-moving atmosphere. It missed its first attempt to enter orbit in 2010 and succeeded five years later.",
    sourceUrl: "https://global.jaxa.jp/projects/sas/planet_c/",
    agencies: ["JAXA"],
    destinations: ["venus"],
    spacecraft: [
      {
        slug: "akatsuki",
        name: "Akatsuki",
        catalogueId: "S36576",
        kind: "ORBITER",
        description:
          "Orbiter with five cameras observing at wavelengths from ultraviolet to infrared, each sensitive to a different layer of cloud.",
        powerSource: "SOLAR",
        // GCAT lists ISAS/JAXA, the operator; NEC built the spacecraft.
        builders: ["NECT"],
      },
    ],
  },
  {
    slug: "pioneer-10",
    name: "Pioneer 10",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2003-01-23",
    endDeclared: "1997-03-31",
    description:
      "The first spacecraft to cross the asteroid belt and fly past Jupiter, and the first sent on a path out of the Solar System.",
    sourceUrl: "https://science.nasa.gov/mission/pioneer-10/",
    agencies: ["NASA"],
    destinations: ["jupiter"],
    spacecraft: [
      {
        slug: "pioneer-10",
        name: "Pioneer 10",
        catalogueId: "S05860",
        kind: "FLYBY",
        description:
          "Spin-stabilised probe with a 2.7 m dish antenna and four radioisotope generators, carrying a plaque for any finders.",
        powerSource: "RADIOISOTOPE",
      },
    ],
  },
  {
    slug: "pioneer-11",
    name: "Pioneer 11",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1995-11-24",
    endDeclared: "1995-09-30",
    description:
      "The second spacecraft to fly past Jupiter and the first to reach Saturn, passing within 21,000 km of its cloud tops in 1979.",
    sourceUrl: "https://science.nasa.gov/mission/pioneer-11/",
    agencies: ["NASA"],
    destinations: ["jupiter", "saturn"],
    spacecraft: [
      {
        slug: "pioneer-11",
        name: "Pioneer 11",
        catalogueId: "S06421",
        kind: "FLYBY",
        description:
          "Twin of Pioneer 10, with an added magnetometer for measuring strong magnetic fields.",
        powerSource: "RADIOISOTOPE",
      },
    ],
  },
  {
    slug: "galileo",
    name: "Galileo",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2003-09-21",
    endDeclared: "2003-09-21",
    description:
      "The first spacecraft to orbit Jupiter, studying the planet and its moons for eight years and finding evidence of an ocean beneath Europa's ice. On the way it made the first flyby of an asteroid.",
    sourceUrl: "https://science.nasa.gov/mission/galileo/",
    agencies: ["NASA"],
    destinations: ["jupiter", "gaspra", "ida"],
    spacecraft: [
      {
        slug: "galileo-orbiter",
        name: "Galileo orbiter",
        catalogueId: "S20298",
        kind: "ORBITER",
        description:
          "Spin-stabilised orbiter with a de-spun section for its cameras. Its main antenna failed to open, so all data came back through a small low-gain antenna.",
        status: "COMPLETED",
        lastContact: "2003-09-21",
        endDeclared: "2003-09-21",
        powerSource: "RADIOISOTOPE",
      },
      {
        slug: "galileo-probe",
        name: "Galileo probe",
        catalogueId: "A04746",
        kind: "ATMOSPHERIC_PROBE",
        description:
          "Entry probe that plunged into Jupiter's atmosphere at 47 km/s and returned data for 58 minutes on the way down.",
        status: "COMPLETED",
        lastContact: "1995-12-07",
        // GCAT's total at launch, including the heat shield.
        launchMassKg: 339,
        dryMassKg: null,
        powerSource: "BATTERY",
      },
    ],
  },
  {
    slug: "new-horizons",
    name: "New Horizons",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "The first spacecraft to explore Pluto, flying past it and its moon Charon in July 2015, and later the small Kuiper belt object Arrokoth, the most distant world ever visited.",
    sourceUrl: "https://science.nasa.gov/mission/new-horizons/",
    agencies: ["NASA"],
    destinations: ["jupiter", "pluto", "arrokoth"],
    spacecraft: [
      {
        slug: "new-horizons",
        name: "New Horizons",
        catalogueId: "S28928",
        kind: "FLYBY",
        description:
          "Piano-sized probe with seven instruments and a radioisotope generator, launched on the fastest trajectory of any spacecraft leaving Earth.",
        powerSource: "RADIOISOTOPE",
      },
    ],
  },
  {
    slug: "juno",
    name: "Juno",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A NASA orbiter studying Jupiter's interior, magnetic field and polar regions from a looping polar orbit. It is the first solar-powered spacecraft to operate at Jupiter.",
    sourceUrl: "https://science.nasa.gov/mission/juno/",
    agencies: ["NASA"],
    destinations: ["jupiter"],
    spacecraft: [
      {
        slug: "juno",
        name: "Juno",
        catalogueId: "S37773",
        kind: "ORBITER",
        description:
          "Spinning orbiter with three 9 m solar wings and its electronics shielded inside a titanium vault against Jupiter's radiation.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "juice",
    name: "JUICE",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "An ESA mission on its way to Jupiter to study three of its icy moons, Ganymede, Callisto and Europa. It is planned to become the first spacecraft to orbit a moon other than our own.",
    sourceUrl: "https://www.esa.int/Science_Exploration/Space_Science/Juice",
    agencies: ["ESA"],
    destinations: ["jupiter", "ganymede"],
    spacecraft: [
      {
        slug: "juice",
        name: "JUICE",
        catalogueId: "S56176",
        kind: "ORBITER",
        description:
          "Orbiter with ten instruments and 85 square metres of solar panels to gather enough power in Jupiter's dim sunlight.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "europa-clipper",
    name: "Europa Clipper",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A NASA mission on its way to Jupiter, where it will make dozens of close flybys of the moon Europa to judge whether its buried ocean could support life.",
    sourceUrl: "https://science.nasa.gov/mission/europa-clipper/",
    agencies: ["NASA"],
    destinations: ["europa"],
    spacecraft: [
      {
        slug: "europa-clipper",
        name: "Europa Clipper",
        catalogueId: "S61507",
        kind: "ORBITER",
        description:
          "The largest spacecraft NASA has built for a planetary mission, more than 30 m across with its solar arrays open.",
        powerSource: "SOLAR",
      },
    ],
  },
];
