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
//
// location is where the craft is now: where it is headed if it is still on
// its way, or where it ended up if its mission is over. It can differ from
// the mission's destinations (Gaia worked at L2 but was retired into an orbit
// around the Sun). horizonsId is the craft's own entry in JPL Horizons, matched
// by designator or by a name Horizons lists; a carried craft without its own
// entry has none.
export type SpacecraftSeed = {
  slug: string;
  name: string;
  catalogueId?: string;
  designator?: string | null;
  kind: SpacecraftKind;
  location: DestinationSlug;
  horizonsId?: string;
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
//
// image is the name of a picture of the spacecraft on Wikimedia Commons, under
// a licence that lets anyone reuse it. `npm run import:images` downloads it
// and records its credit, taken from Commons unless imageCredit says who to
// credit instead (for when Commons gives no author, or not plainly).
export type MissionSeed = {
  slug: string;
  name: string;
  image?: string;
  imageCredit?: string;
  discipline: Discipline;
  status: Status;
  launchDate?: string;
  lastContact?: string;
  endDeclared?: string;
  description: string;
  sourceUrl?: string;
  agencies: AgencyAbbreviation[];
  destinations: DestinationSlug[];
  spacecraft: SpacecraftSeed[];
};

export const missions: MissionSeed[] = [
  {
    slug: "jwst",
    name: "James Webb Space Telescope",
    image: "JWST spacecraft model 3.png",
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
        location: "sun-earth-l2",
        horizonsId: "-170",
        description:
          "Infrared observatory with a 6.5 m segmented primary mirror, kept cold behind a five-layer sunshield.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "voyager-1",
    name: "Voyager 1",
    image: "Voyager spacecraft model.png",
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
        location: "interstellar-space",
        horizonsId: "-31",
        description:
          "Three-axis stabilised probe built around a 3.7 m high-gain antenna, powered by three radioisotope thermoelectric generators.",
        powerSource: "RADIOISOTOPE",
      },
    ],
  },
  {
    slug: "voyager-2",
    name: "Voyager 2",
    image: "Voyager spacecraft.jpg",
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
        location: "interstellar-space",
        horizonsId: "-32",
        description:
          "Three-axis stabilised probe built around a 3.7 m high-gain antenna, powered by three radioisotope thermoelectric generators.",
        powerSource: "RADIOISOTOPE",
      },
    ],
  },
  {
    slug: "hubble",
    name: "Hubble Space Telescope",
    image: "Hubble 2009 close-up 2.jpg",
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
        location: "low-earth-orbit",
        horizonsId: "-48",
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
    image: "Cassini Saturn Orbit Insertion.jpg",
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
        location: "saturn",
        horizonsId: "-82",
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
        location: "titan",
        horizonsId: "-150",
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
    image: "Mars 2020 selfie containing both perseverance rover and ingenuity.gif",
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
        location: "mars",
        horizonsId: "-168",
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
        // Horizons lists Ingenuity under the Mars 2020 entry.
        location: "mars",
        horizonsId: "-168",
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
    image: "Rosetta spacecraft model.png",
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
        location: "67p-churyumov-gerasimenko",
        horizonsId: "-226",
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
        location: "67p-churyumov-gerasimenko",
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
    image: "ChangE-4 - PCAM.png",
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
        location: "moon",
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
        location: "moon",
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
    image: "Chandrayaan-3 lander in clean-room 05.webp",
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
        location: "moon",
        horizonsId: "-158",
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
        location: "moon",
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
    image: "Venera-7 spuskaemiy apparat.jpg",
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
        location: "venus",
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
    image: "Hayabusa2 Ion thruster.jpg",
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
        // On its way to asteroid 1998 KY26, which is not a destination here.
        location: "heliocentric-orbit",
        horizonsId: "-37",
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
        location: "ryugu",
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
    image: "Mars Climate Orbiter 2.jpg",
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
        // Thought to have burned up in the Martian atmosphere; it may instead have
        // skipped out into an orbit around the Sun.
        location: "mars",
        description:
          "Three-axis stabilised orbiter carrying a colour imager and an atmospheric sounder.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "kepler",
    name: "Kepler",
    image: "Kepler Space Telescope spacecraft model 2.png",
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
        location: "heliocentric-orbit",
        horizonsId: "-227",
        description:
          "Photometer with a 0.95 m aperture and a 95-megapixel camera, which stared at a single field of stars for four years before a second mission, K2.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "gaia",
    name: "Gaia",
    image: "Gaia spacecraft.jpeg",
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
        // Moved off L2 into an orbit around the Sun when it was retired in 2025.
        location: "heliocentric-orbit",
        horizonsId: "-139479",
        description:
          "Two telescopes feeding a billion-pixel camera, spinning slowly to scan the whole sky from the Sun–Earth L2 point.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "luna-2",
    name: "Luna 2",
    image: "Luna 1 - 2 Spacecraft.png",
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
        location: "moon",
        description:
          "Spherical probe carrying radiation detectors and a magnetometer, which found that the Moon has no significant magnetic field.",
        powerSource: "BATTERY",
      },
    ],
  },
  {
    slug: "luna-3",
    name: "Luna 3",
    image: "Луна-3 (14562265547).jpg",
    imageCredit: "Memorial Museum of Cosmonautics, Moscow",
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
        // Left in a long, looping Earth orbit, which later decayed.
        location: "high-earth-orbit",
        description:
          "Probe that photographed the Moon on film, developed it on board and scanned the pictures for radio transmission to Earth.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "luna-9",
    name: "Luna 9",
    image: "Luna 9 Musee du Bourget P1010505.JPG",
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
        location: "moon",
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
    image: "Surveyor NASA lunar lander.jpg",
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
        location: "moon",
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
    image: "Luna 16.jpg",
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
        location: "moon",
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
    image: "Soviet moonrover.JPG",
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
        location: "moon",
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
        location: "moon",
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
    image: "Artist's impression of the SMART-1 mission ESA199399.jpg",
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
        location: "moon",
        description:
          "Small orbiter driven by a Hall-effect ion thruster fed with xenon.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "kaguya",
    name: "Kaguya (SELENE)",
    image: "月周回衛星「かぐや（SELENE)」の模型.JPG",
    imageCredit: "Hajitaro- at Japanese Wikipedia",
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
        location: "moon",
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
        location: "moon",
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
        location: "moon",
        horizonsId: "-39",
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
    image: "Chandrayaan-1-01.jpg",
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
        location: "moon",
        horizonsId: "-86",
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
        location: "moon",
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
    image: "Lunar Reconnaissance Orbiter 001.jpg",
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
        location: "moon",
        horizonsId: "-85",
        description:
          "Orbiter with seven instruments, including a camera that can resolve features half a metre across.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "change-3",
    name: "Chang'e 3",
    image: "Yutu rover.jpg",
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
        location: "moon",
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
        location: "moon",
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
    image: "Chang-e-5-assembly-CG-1-Cropped.jpg",
    imageCredit: "China News Service",
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
        // Went to the Sun–Earth L1 point after the sample return, then back to an
        // orbit around the Moon.
        location: "moon",
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
        location: "moon",
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
    image: "SLIM half scale model (close cropped).png",
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
        location: "moon",
        horizonsId: "-240",
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
    image: "Beresheet model on Habima Square 20190222 01.jpg",
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
        location: "moon",
        description:
          "Compact four-legged lander that carried a magnetometer and a NASA laser retroreflector.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "mariner-10",
    name: "Mariner 10",
    image: "NASM-A19830006000-NASM2019-01579.jpg",
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
        location: "heliocentric-orbit",
        description:
          "Three-axis stabilised probe with twin television cameras and a sunshade to cope with the heat near Mercury.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "messenger",
    name: "MESSENGER",
    image: "MESSENGER - spacecraft at mercury - atmercury lg.jpg",
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
        location: "mercury",
        horizonsId: "-236",
        description:
          "Orbiter that worked behind a ceramic-cloth sunshade, carrying seven instruments and a radio science experiment.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "bepicolombo",
    name: "BepiColombo",
    image: "BepiColombo stack cropped.jpg",
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
        location: "mercury",
        horizonsId: "-121",
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
        // Rides on the BepiColombo stack until arrival; Horizons lists it under the
        // same entry.
        location: "mercury",
        horizonsId: "-121",
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
    image: "Mariner 2 Engineering Model.jpg",
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
        location: "heliocentric-orbit",
        horizonsId: "-2",
        description:
          "Probe based on the Ranger lunar design, with microwave and infrared radiometers to scan Venus during the flyby.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "venera-9",
    name: "Venera 9",
    image: "Venera 9 Space Probe 01.jpg",
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
        location: "venus",
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
        location: "venus",
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
    image: "Vega model - Udvar-Hazy Center.JPG",
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
        location: "heliocentric-orbit",
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
        location: "venus",
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
        location: "venus",
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
    image: "Magellan at Kennedy Space Center.jpg",
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
        location: "venus",
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
    image: "Venus Express in orbit (crop).jpg",
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
        location: "venus",
        horizonsId: "-248",
        description:
          "Orbiter built on the Mars Express design, reusing spare instruments from Mars Express and Rosetta.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "akatsuki",
    name: "Akatsuki",
    image: "Akatsuki-1.jpg",
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
        location: "venus",
        horizonsId: "-5",
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
    image: "Pioneer 10 (18427352949).jpg",
    imageCredit: "NASA",
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
        // Leaving the solar system.
        location: "heliocentric-orbit",
        horizonsId: "-23",
        description:
          "Spin-stabilised probe with a 2.7 m dish antenna and four radioisotope generators, carrying a plaque for any finders.",
        powerSource: "RADIOISOTOPE",
      },
    ],
  },
  {
    slug: "pioneer-11",
    name: "Pioneer 11",
    image: "An artist's impression of a Pioneer spacecraft on its way to interstellar space.jpg",
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
        // Leaving the solar system.
        location: "heliocentric-orbit",
        horizonsId: "-24",
        description:
          "Twin of Pioneer 10, with an added magnetometer for measuring strong magnetic fields.",
        powerSource: "RADIOISOTOPE",
      },
    ],
  },
  {
    slug: "galileo",
    name: "Galileo",
    image: "Artwork Galileo-Io-Jupiter.JPG",
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
        location: "jupiter",
        horizonsId: "-77",
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
        location: "jupiter",
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
    image: "New Horizons spacecraft model 1.png",
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
        // Leaving the solar system through the Kuiper belt.
        location: "heliocentric-orbit",
        horizonsId: "-98",
        description:
          "Piano-sized probe with seven instruments and a radioisotope generator, launched on the fastest trajectory of any spacecraft leaving Earth.",
        powerSource: "RADIOISOTOPE",
      },
    ],
  },
  {
    slug: "juno",
    name: "Juno",
    image: "Juno spacecraft model 1.png",
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
        location: "jupiter",
        horizonsId: "-61",
        description:
          "Spinning orbiter with three 9 m solar wings and its electronics shielded inside a titanium vault against Jupiter's radiation.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "juice",
    name: "JUICE",
    image: "Juice launch kit cover close-up.png",
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
        // Orbits Jupiter first and moves to Ganymede later.
        location: "jupiter",
        horizonsId: "-28",
        description:
          "Orbiter with ten instruments and 85 square metres of solar panels to gather enough power in Jupiter's dim sunlight.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "europa-clipper",
    name: "Europa Clipper",
    image: "Europa Clipper spacecraft model.png",
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
        // Orbits Jupiter and studies Europa on repeated flybys.
        location: "jupiter",
        horizonsId: "-159",
        description:
          "The largest spacecraft NASA has built for a planetary mission, more than 30 m across with its solar arrays open.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "mariner-4",
    name: "Mariner 4",
    image: "Mariner 4 1304 1964novembemariner4.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1967-12-21",
    description:
      "The first spacecraft to return close-up pictures of another planet, sending back 21 images of a cratered Mars from its flyby in July 1965.",
    sourceUrl: "https://science.nasa.gov/mission/mariner-4/",
    agencies: ["NASA"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "mariner-4",
        name: "Mariner 4",
        catalogueId: "S00938",
        kind: "FLYBY",
        location: "heliocentric-orbit",
        description:
          "Probe with a television camera on a scan platform and a tape recorder that played the images back over several days.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "mariner-9",
    name: "Mariner 9",
    image: "Mariner09.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1972-10-27",
    description:
      "The first spacecraft to orbit another planet. It waited out a global dust storm and then mapped the whole of Mars, revealing its volcanoes, canyons and dry riverbeds.",
    sourceUrl: "https://science.nasa.gov/mission/mariner-9/",
    agencies: ["NASA"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "mariner-9",
        name: "Mariner 9",
        catalogueId: "S05261",
        kind: "ORBITER",
        location: "mars",
        description:
          "Orbiter that returned 7,329 images, covering the whole planet and its two moons.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "mars-3",
    name: "Mars 3",
    image: "Mars 3 Space Probe 2.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    endDeclared: "1972-08-22",
    description:
      "A Soviet orbiter and lander. The lander made the first soft landing on Mars but fell silent about 20 seconds after it began transmitting; the orbiter returned data for eight months.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-049A",
    agencies: ["USSR"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "mars-3-orbiter",
        name: "Mars 3 orbiter",
        catalogueId: "S05252",
        kind: "ORBITER",
        location: "mars",
        description:
          "Orbiter that studied the Martian surface and atmosphere, though the dust storm raging at its arrival hid much of the planet.",
        status: "COMPLETED",
        endDeclared: "1972-08-22",
        powerSource: "SOLAR",
      },
      {
        slug: "mars-3-lander",
        name: "Mars 3 lander",
        catalogueId: "S05667",
        kind: "LANDER",
        location: "mars",
        description:
          "Lander that reached the surface by aerobraking, parachute and retro-rockets. It carried a small tethered rover that was never deployed.",
        status: "FAILED",
        lastContact: "1971-12-02",
        // GCAT's total at launch, including the entry shell.
        launchMassKg: 1210,
        dryMassKg: null,
        powerSource: "BATTERY",
      },
    ],
  },
  {
    slug: "viking-1",
    name: "Viking 1",
    image: "Viking spacecraft.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1982-11-11",
    description:
      "The first American mission to land on Mars and the first to operate there for years. Its orbiter mapped the planet while the lander searched the soil for signs of life.",
    sourceUrl: "https://science.nasa.gov/mission/viking-1/",
    agencies: ["NASA"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "viking-1-orbiter",
        name: "Viking 1 orbiter",
        catalogueId: "S08108",
        kind: "ORBITER",
        location: "mars",
        description:
          "Orbiter that carried the lander to Mars, surveyed landing sites and relayed the lander's data to Earth.",
        status: "COMPLETED",
        lastContact: "1980-08-17",
        powerSource: "SOLAR",
      },
      {
        slug: "viking-1-lander",
        name: "Viking 1 lander",
        catalogueId: "S09024",
        kind: "LANDER",
        location: "mars",
        description:
          "Lander with a robotic arm, a weather station and three biology experiments, which worked on Chryse Planitia for more than six years.",
        status: "COMPLETED",
        lastContact: "1982-11-11",
        powerSource: "RADIOISOTOPE",
      },
    ],
  },
  {
    slug: "mars-pathfinder",
    name: "Mars Pathfinder",
    image: "Mars Pathfinder Lander preparations.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1997-09-27T10:23:00Z",
    endDeclared: "1998-03-10",
    description:
      "A NASA technology demonstration that landed on Mars cushioned by airbags and delivered Sojourner, the first rover to operate on another planet.",
    sourceUrl: "https://science.nasa.gov/mission/mars-pathfinder/",
    agencies: ["NASA"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "mars-pathfinder-lander",
        name: "Pathfinder lander",
        catalogueId: "S24667",
        kind: "LANDER",
        location: "mars",
        horizonsId: "-530",
        description:
          "Lander that opened like a flower after bouncing to rest, carrying a stereo camera and weather instruments.",
        status: "COMPLETED",
        lastContact: "1997-09-27T10:23:00Z",
        endDeclared: "1998-03-10",
        powerSource: "SOLAR",
      },
      {
        slug: "sojourner",
        name: "Sojourner",
        catalogueId: "A05947",
        kind: "ROVER",
        location: "mars",
        description:
          "Microwave-oven-sized, six-wheeled rover that analysed rocks near the lander for 83 Martian days, far beyond its planned seven.",
        status: "COMPLETED",
        lastContact: "1997-09-27T10:23:00Z",
        endDeclared: "1998-03-10",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "mars-global-surveyor",
    name: "Mars Global Surveyor",
    image: "Mars global surveyor.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2006-11-05",
    description:
      "A NASA orbiter that mapped Mars for nine years, charting its topography and magnetic field and finding gullies that suggested recent liquid water.",
    sourceUrl: "https://science.nasa.gov/mission/mars-global-surveyor/",
    agencies: ["NASA"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "mars-global-surveyor",
        name: "Mars Global Surveyor",
        catalogueId: "S24648",
        kind: "ORBITER",
        location: "mars",
        description:
          "Orbiter carrying a camera, a laser altimeter, a thermal spectrometer and a magnetometer, built largely from spares of the lost Mars Observer.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "mars-odyssey",
    name: "2001 Mars Odyssey",
    image: "Mars Odyssey spacecraft model.png",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "NASA's longest-serving Mars orbiter, which mapped the planet's surface chemistry, found vast deposits of buried water ice and has relayed data for every rover since Spirit.",
    sourceUrl: "https://science.nasa.gov/mission/odyssey/",
    agencies: ["NASA"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "mars-odyssey",
        name: "2001 Mars Odyssey",
        catalogueId: "S26734",
        kind: "ORBITER",
        location: "mars",
        horizonsId: "-53",
        description:
          "Orbiter carrying a thermal imaging camera and a gamma-ray spectrometer on a 6 m boom.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "mars-express",
    name: "Mars Express",
    image: "Mars-express-volcanoes-sm.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "ESA's first mission to another planet. Its orbiter has studied Mars since 2003, finding water ice at the south pole and signs of liquid water beneath it.",
    sourceUrl:
      "https://www.esa.int/Science_Exploration/Space_Science/Mars_Express",
    agencies: ["ESA"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "mars-express",
        name: "Mars Express",
        catalogueId: "S27816",
        kind: "ORBITER",
        location: "mars",
        horizonsId: "-41",
        description:
          "Orbiter with a stereo camera and a ground-penetrating radar that probes kilometres below the surface.",
        status: "ACTIVE",
        powerSource: "SOLAR",
      },
      {
        slug: "beagle-2",
        name: "Beagle 2",
        catalogueId: "A06833",
        kind: "LANDER",
        location: "mars",
        description:
          "British-built lander that reached the surface but never made contact. Images taken eleven years later showed that its solar panels had only partly opened.",
        status: "FAILED",
        lastContact: "2003-12-19",
        endDeclared: "2004-02-06",
        powerSource: "SOLAR",
        // GCAT also lists Martin-Baker, which supplied the landing system.
        builders: ["ASTT"],
      },
    ],
  },
  {
    slug: "spirit",
    name: "Spirit",
    image: "KSC-03PD-0786.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2010-03-22",
    endDeclared: "2011-05-25",
    description:
      "One of NASA's twin Mars Exploration Rovers, which explored Gusev crater for more than six years and found evidence that hot water once flowed there.",
    sourceUrl: "https://science.nasa.gov/mission/mer-spirit/",
    agencies: ["NASA"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "spirit",
        name: "Spirit",
        catalogueId: "S27827",
        kind: "ROVER",
        location: "mars",
        horizonsId: "-254",
        description:
          "Golf-cart-sized, six-wheeled rover with a panoramic camera and a robotic arm for studying rocks up close.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "opportunity",
    name: "Opportunity",
    image: "NASA Mars Rover.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2018-06-10",
    endDeclared: "2019-02-13",
    description:
      "One of NASA's twin Mars Exploration Rovers, built to last 90 days. It drove more than 45 km across Meridiani Planum over 14 years and found minerals that form in water.",
    sourceUrl: "https://science.nasa.gov/mission/mer-opportunity/",
    agencies: ["NASA"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "opportunity",
        name: "Opportunity",
        catalogueId: "S27849",
        kind: "ROVER",
        location: "mars",
        horizonsId: "-253",
        description:
          "Twin of Spirit. It worked until a planet-wide dust storm cut off the sunlight to its solar panels.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "mars-reconnaissance-orbiter",
    name: "Mars Reconnaissance Orbiter",
    image: "Mars Reconnaissance Orbiter, front view, artist's concept (PIA07245).jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A NASA orbiter that has studied Mars since 2006 with the most powerful camera ever sent to another planet, and relays most of the data from the rovers on the surface.",
    sourceUrl: "https://science.nasa.gov/mission/mars-reconnaissance-orbiter/",
    agencies: ["NASA"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "mars-reconnaissance-orbiter",
        name: "Mars Reconnaissance Orbiter",
        catalogueId: "S28788",
        kind: "ORBITER",
        location: "mars",
        horizonsId: "-74",
        description:
          "Orbiter with a 3 m dish antenna and a telescopic camera that can pick out features the size of a kitchen table.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "phoenix",
    name: "Phoenix",
    image: "Phoenix landing.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2008-11-02",
    endDeclared: "2008-11-10",
    description:
      "A NASA lander that touched down in the Martian arctic, dug into the soil and confirmed water ice just below the surface.",
    sourceUrl: "https://science.nasa.gov/mission/mars-phoenix/",
    agencies: ["NASA"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "phoenix",
        name: "Phoenix",
        catalogueId: "S32003",
        kind: "LANDER",
        location: "mars",
        horizonsId: "-84",
        description:
          "Stationary lander with a 2.4 m robotic arm, ovens and a wet chemistry lab for analysing soil samples.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "mars-science-laboratory",
    name: "Mars Science Laboratory",
    image: "MSL cruise stage configuration (PIA14831).png",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A NASA mission that landed the Curiosity rover in Gale crater in 2012, where it found that Mars once had lakes and streams able to support microbial life.",
    sourceUrl: "https://science.nasa.gov/mission/msl-curiosity/",
    agencies: ["NASA"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "curiosity",
        name: "Curiosity",
        catalogueId: "S37936",
        kind: "ROVER",
        location: "mars",
        horizonsId: "-76",
        description:
          "Car-sized rover with a rock-vaporising laser and an onboard chemistry lab, lowered to the surface by a rocket-powered sky crane.",
        powerSource: "RADIOISOTOPE",
        // GCAT lists Lockheed Martin, which built the aeroshell.
        builders: ["JPL"],
      },
    ],
  },
  {
    slug: "mars-orbiter-mission",
    name: "Mars Orbiter Mission",
    image: "Mars Orbiter Mission Over Mars (15237158879).jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    endDeclared: "2022-10-03",
    description:
      "India's first interplanetary mission, which made ISRO the first agency to reach Mars orbit on its first attempt. Planned for six months, it operated for nearly eight years.",
    sourceUrl: "https://www.isro.gov.in/MarsOrbiterMissionSpacecraft.html",
    agencies: ["ISRO"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "mars-orbiter-mission",
        name: "Mars Orbiter Mission",
        catalogueId: "S39370",
        kind: "ORBITER",
        location: "mars",
        horizonsId: "-3",
        description:
          "Compact orbiter carrying five instruments, including a colour camera and a methane sensor.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "exomars-trace-gas-orbiter",
    name: "ExoMars Trace Gas Orbiter",
    image: "Maquette Exomars Orbiter Salon du Bourget 2015 DSC 0045.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A joint ESA and Roscosmos mission to map trace gases such as methane in the Martian atmosphere. It also carried the Schiaparelli landing demonstrator, which crashed on arrival.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2016-017A",
    agencies: ["ESA", "Roscosmos"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "trace-gas-orbiter",
        name: "Trace Gas Orbiter",
        catalogueId: "S41388",
        kind: "ORBITER",
        location: "mars",
        horizonsId: "-143",
        description:
          "Orbiter that measures gases making up less than 1% of the atmosphere and relays data from rovers on the surface.",
        status: "ACTIVE",
        powerSource: "SOLAR",
      },
      {
        slug: "schiaparelli",
        name: "Schiaparelli",
        catalogueId: "A08532",
        kind: "LANDER",
        location: "mars",
        description:
          "Test lander that entered the atmosphere and deployed its parachute successfully, but cut its thrusters too early after a sensor fault and hit the surface at about 540 km/h.",
        status: "FAILED",
        lastContact: "2016-10-19",
        // GCAT's total at launch, including the heat shield and back shell.
        launchMassKg: 600,
        dryMassKg: null,
        powerSource: "BATTERY",
      },
    ],
  },
  {
    slug: "insight",
    name: "InSight",
    image: "InSight lander (PIA17358).jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2022-12-15",
    endDeclared: "2022-12-21",
    description:
      "A NASA lander that listened to the interior of Mars, recording more than 1,300 marsquakes and measuring the size of the planet's core.",
    sourceUrl: "https://science.nasa.gov/mission/insight/",
    agencies: ["NASA", "CNES", "DLR"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "insight",
        name: "InSight",
        catalogueId: "S43457",
        kind: "LANDER",
        location: "mars",
        horizonsId: "-189",
        description:
          "Stationary lander that placed a French-built seismometer on the ground with its robotic arm. A German heat probe meant to burrow five metres down could not get past the surface soil.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "hope",
    name: "Hope",
    image: "Emirates Mars Mission mockup at IAC 2021 01 (cropped).jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "The first interplanetary mission by an Arab nation. From a high orbit it tracks Martian weather through the whole day and across the seasons.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2020-047A",
    agencies: ["MBRSC"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "hope",
        name: "Hope",
        catalogueId: "S45918",
        kind: "ORBITER",
        location: "mars",
        horizonsId: "-62",
        description:
          "Orbiter with a camera and two spectrometers, built by the Mohammed bin Rashid Space Centre with the University of Colorado.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "tianwen-1",
    name: "Tianwen-1",
    image: "Tianwen-1 in Mars orbit.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "China's first independent mission to Mars, which succeeded in orbiting, landing and deploying a rover in a single attempt.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2020-049A",
    agencies: ["CNSA"],
    destinations: ["mars"],
    spacecraft: [
      {
        slug: "tianwen-1-orbiter",
        name: "Tianwen-1 orbiter",
        catalogueId: "S45935",
        kind: "ORBITER",
        location: "mars",
        horizonsId: "-9901491",
        description:
          "Orbiter that mapped the whole planet and relayed the rover's data.",
        status: "ACTIVE",
        powerSource: "SOLAR",
      },
      {
        slug: "zhurong",
        name: "Zhurong",
        catalogueId: "A09604",
        kind: "ROVER",
        location: "mars",
        description:
          "Six-wheeled rover that explored Utopia Planitia with ground-penetrating radar for a year before going into hibernation for the winter, from which it did not wake.",
        status: "COMPLETED",
        lastContact: "2022-05-18",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "giotto",
    name: "Giotto",
    image: "Giotto Whipple shield ESA239195.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "1992-07-23",
    description:
      "ESA's first deep-space mission, which passed within 600 km of the nucleus of Halley's Comet in 1986 and returned the first close-up images of a comet's core. It later flew past a second comet, Grigg–Skjellerup.",
    sourceUrl:
      "https://www.esa.int/Science_Exploration/Space_Science/Giotto_overview",
    agencies: ["ESA"],
    destinations: ["halley", "grigg-skjellerup"],
    spacecraft: [
      {
        slug: "giotto",
        name: "Giotto",
        catalogueId: "S15875",
        kind: "FLYBY",
        location: "heliocentric-orbit",
        description:
          "Spin-stabilised probe protected by a two-layer dust shield, which was battered but survived the encounter.",
        // GCAT's total at launch, including the solid motor that sent it
        // out of Earth orbit.
        launchMassKg: 958,
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "near-shoemaker",
    name: "NEAR Shoemaker",
    image: "NEAR at launch preparations.jpg",
    imageCredit: "NASA",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2001-02-28",
    description:
      "The first spacecraft to orbit an asteroid and the first to land on one, settling onto Eros in 2001 after a year in orbit around it. On the way it flew past the asteroid Mathilde.",
    sourceUrl: "https://science.nasa.gov/mission/near-shoemaker/",
    agencies: ["NASA"],
    destinations: ["mathilde", "eros"],
    spacecraft: [
      {
        slug: "near-shoemaker",
        name: "NEAR Shoemaker",
        catalogueId: "S23784",
        kind: "ORBITER",
        location: "eros",
        horizonsId: "-93",
        description:
          "Solar-powered orbiter with six instruments. It was not designed to land, yet kept working on the surface for two weeks.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "stardust",
    name: "Stardust",
    image: "Stardust - Concepcao artistica.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2011-03-24T23:33:00Z",
    endDeclared: "2011-03-24",
    description:
      "The first mission to bring back samples from a comet, catching dust from comet Wild 2 in aerogel and returning it to Earth in 2006. The spacecraft then flew on to visit comet Tempel 1.",
    sourceUrl: "https://science.nasa.gov/mission/stardust/",
    agencies: ["NASA"],
    destinations: ["wild-2", "tempel-1"],
    spacecraft: [
      {
        slug: "stardust",
        name: "Stardust",
        catalogueId: "S25618",
        kind: "FLYBY",
        location: "heliocentric-orbit",
        horizonsId: "-29",
        description:
          "Probe with a tennis-racket-shaped aerogel collector and shields to protect it from comet dust.",
        // Includes the 46 kg sample return capsule, which GCAT lists
        // separately.
        launchMassKg: 385,
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "hayabusa",
    name: "Hayabusa",
    image: "Hayabusa hover.jpg",
    imageCredit: "J. R. C. Garry",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2010-06-13",
    endDeclared: "2010-06-13",
    description:
      "The first mission to return samples from an asteroid, bringing back grains from Itokawa in 2010 after a seven-year journey troubled by failed reaction wheels, fuel leaks and a lost signal.",
    sourceUrl:
      "https://www.isas.jaxa.jp/en/missions/spacecraft/past/hayabusa.html",
    agencies: ["JAXA"],
    destinations: ["itokawa"],
    spacecraft: [
      {
        slug: "hayabusa",
        name: "Hayabusa",
        catalogueId: "S27809",
        kind: "ORBITER",
        // Burned up on re-entry in 2010 after releasing its sample capsule.
        location: "low-earth-orbit",
        horizonsId: "-130",
        description:
          "Ion-engine spacecraft that touched down briefly on Itokawa. Its small hopping rover, MINERVA, missed the asteroid when released.",
        // GCAT's total at launch, including the return capsule and rover.
        launchMassKg: 509,
        powerSource: "SOLAR",
        // GCAT lists ISAS, the operator; NEC built the spacecraft.
        builders: ["NECT"],
      },
    ],
  },
  {
    slug: "deep-impact",
    name: "Deep Impact",
    image: "Deep Impact.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2013-08-08",
    endDeclared: "2013-09-20",
    description:
      "A NASA mission that fired a 372 kg impactor into comet Tempel 1 to expose material from beneath its surface. The flyby spacecraft later visited a second comet, Hartley 2, as the EPOXI mission.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2005-001A",
    agencies: ["NASA"],
    destinations: ["tempel-1", "hartley-2"],
    spacecraft: [
      {
        slug: "deep-impact-flyby",
        name: "Deep Impact flyby spacecraft",
        catalogueId: "S28517",
        kind: "FLYBY",
        location: "heliocentric-orbit",
        horizonsId: "-140",
        description:
          "Spacecraft that released the impactor and watched the collision with two telescopes from 500 km away.",
        status: "COMPLETED",
        lastContact: "2013-08-08",
        endDeclared: "2013-09-20",
        powerSource: "SOLAR",
      },
      {
        slug: "deep-impact-impactor",
        name: "Deep Impact impactor",
        catalogueId: "A06946",
        kind: "IMPACTOR",
        location: "tempel-1",
        horizonsId: "-70",
        description:
          "Copper-fronted probe that steered itself into the comet's path and was hit at 10 km/s, filming until the end.",
        status: "COMPLETED",
        lastContact: "2005-07-04T05:52:00Z",
        powerSource: "BATTERY",
      },
    ],
  },
  {
    slug: "dawn",
    name: "Dawn",
    image: "Dawn Flight Configuration 2.jpg",
    imageCredit: "NASA/JPL",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2018-10-30",
    endDeclared: "2018-11-01",
    description:
      "The first spacecraft to orbit two different worlds beyond Earth, the giant asteroid Vesta and the dwarf planet Ceres, made possible by ion propulsion.",
    sourceUrl: "https://science.nasa.gov/mission/dawn/",
    agencies: ["NASA"],
    destinations: ["vesta", "ceres"],
    spacecraft: [
      {
        slug: "dawn",
        name: "Dawn",
        catalogueId: "S32249",
        kind: "ORBITER",
        location: "ceres",
        horizonsId: "-203",
        description:
          "Ion-engine orbiter with solar arrays nearly 20 m across, carrying a camera and two spectrometers.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "osiris-rex",
    name: "OSIRIS-REx",
    image: "OSIRIS-REx spacecraft model.png",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A NASA mission that collected 121 grams of material from the asteroid Bennu and delivered it to Earth in September 2023. The spacecraft, renamed OSIRIS-APEX, is now on its way to the asteroid Apophis.",
    sourceUrl: "https://science.nasa.gov/mission/osiris-rex/",
    agencies: ["NASA"],
    destinations: ["bennu"],
    spacecraft: [
      {
        slug: "osiris-rex",
        name: "OSIRIS-REx",
        catalogueId: "S41757",
        kind: "ORBITER",
        // Renamed OSIRIS-APEX and on its way to Apophis, which is not a destination
        // here.
        location: "heliocentric-orbit",
        horizonsId: "-64",
        description:
          "Orbiter with a 3.4 m sampling arm that touched Bennu for a few seconds to grab loose material.",
        // GCAT's total at launch, including the sample return capsule.
        launchMassKg: 2110,
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "dart",
    name: "DART",
    image: "Artist's illustration of NASA's Double Asteroid Redirection Test Mission.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "COMPLETED",
    lastContact: "2022-09-26T23:14:00Z",
    description:
      "The first planetary defence test. NASA deliberately crashed the spacecraft into Dimorphos, the small moon of the asteroid Didymos, and shortened its orbit by 32 minutes.",
    sourceUrl: "https://science.nasa.gov/mission/dart/",
    agencies: ["NASA", "ASI"],
    destinations: ["didymos", "dimorphos"],
    spacecraft: [
      {
        slug: "dart",
        name: "DART",
        catalogueId: "S49497",
        kind: "IMPACTOR",
        location: "dimorphos",
        horizonsId: "-135",
        description:
          "Box-shaped spacecraft that steered itself into the asteroid at about 6 km/s using an onboard camera.",
        status: "COMPLETED",
        lastContact: "2022-09-26T23:14:00Z",
        powerSource: "SOLAR",
      },
      {
        slug: "liciacube",
        name: "LICIACube",
        catalogueId: "A10780",
        kind: "FLYBY",
        location: "heliocentric-orbit",
        horizonsId: "-210",
        description:
          "Italian cubesat that separated two weeks earlier and photographed the impact and its plume of debris.",
        status: "COMPLETED",
        lastContact: "2022-10-24",
        endDeclared: "2022-12-23",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "lucy",
    name: "Lucy",
    image: "Lucy-PatroclusMenoetius-art.png",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A NASA mission on a twelve-year tour of the Trojan asteroids that share Jupiter's orbit. On the way it has flown past two main-belt asteroids, finding that the first, Dinkinesh, has a small moon.",
    sourceUrl: "https://science.nasa.gov/mission/lucy/",
    agencies: ["NASA"],
    destinations: ["dinkinesh", "donaldjohanson"],
    spacecraft: [
      {
        slug: "lucy",
        name: "Lucy",
        catalogueId: "S49328",
        kind: "FLYBY",
        location: "heliocentric-orbit",
        horizonsId: "-49",
        description:
          "Probe with two round solar arrays more than 7 m across, built to operate farther from the Sun than any solar-powered spacecraft before it.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "psyche",
    name: "Psyche",
    image: "PIA21499 - Artist's Concept of Psyche Spacecraft with Five-Panel Array.jpg",
    discipline: "PLANETARY_SCIENCE",
    status: "ACTIVE",
    description:
      "A NASA mission on its way to Psyche, a metal-rich asteroid that may be the exposed core of an early planet. It is due to arrive in 2029.",
    sourceUrl: "https://science.nasa.gov/mission/psyche/",
    agencies: ["NASA"],
    destinations: ["psyche"],
    spacecraft: [
      {
        slug: "psyche",
        name: "Psyche",
        catalogueId: "S58049",
        kind: "ORBITER",
        location: "psyche",
        horizonsId: "-255",
        description:
          "Orbiter driven by Hall-effect thrusters, with five-panel solar arrays spanning nearly 25 m.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "uhuru",
    name: "Uhuru",
    image: "X-Ray Explorer Satellite.jpg",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    description:
      "The first satellite built specifically for X-ray astronomy. Launched from a platform off the coast of Kenya, it produced the first full catalogue of X-ray sources in the sky.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1970-107A",
    agencies: ["NASA"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "uhuru",
        name: "Uhuru",
        catalogueId: "S04797",
        kind: "TELESCOPE",
        location: "low-earth-orbit",
        description:
          "Small spinning satellite with two sets of X-ray detectors that swept the sky as it turned.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "iue",
    name: "IUE",
    image: "NASA's International Ultraviolet Explorer (1993-04-93).jpg",
    imageCredit: "NASA",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    lastContact: "1996-09-30T18:44:00Z",
    endDeclared: "1996-09-30",
    description:
      "The International Ultraviolet Explorer, run jointly by NASA, ESA and the United Kingdom. Planned for three years, it worked for nearly nineteen and was the first space telescope astronomers could operate in real time.",
    sourceUrl: "https://science.nasa.gov/mission/iue/",
    agencies: ["NASA", "ESA", "SERC"],
    destinations: ["high-earth-orbit"],
    spacecraft: [
      {
        slug: "iue",
        name: "IUE",
        catalogueId: "S10637",
        kind: "TELESCOPE",
        location: "high-earth-orbit",
        horizonsId: "-110637",
        description:
          "Telescope with a 45 cm mirror in a geosynchronous orbit, always in view of a ground station.",
        // GCAT's total at launch, including the motor that raised it to
        // geosynchronous orbit.
        launchMassKg: 671,
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "iras",
    name: "IRAS",
    image: "IRAS testing.jpg",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    lastContact: "1983-11-21",
    description:
      "The Infrared Astronomical Satellite, the first telescope to survey the whole sky in infrared light, flown jointly by the United States, the Netherlands and the United Kingdom. In ten months it catalogued about 350,000 sources.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1983-004A",
    agencies: ["NASA", "NIVR", "SERC"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "iras",
        name: "IRAS",
        catalogueId: "S13777",
        kind: "TELESCOPE",
        location: "low-earth-orbit",
        description:
          "Telescope with a 57 cm mirror cooled by liquid helium to about 2 kelvin.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "hipparcos",
    name: "Hipparcos",
    image: "Hipparcos-testing-estec.jpg",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    description:
      "The first space mission devoted to measuring the positions, distances and motions of stars. It was stranded in the wrong orbit by a motor failure but still measured about 118,000 stars with high precision.",
    sourceUrl:
      "https://www.esa.int/Science_Exploration/Space_Science/Hipparcos_overview",
    agencies: ["ESA"],
    destinations: ["high-earth-orbit"],
    spacecraft: [
      {
        slug: "hipparcos",
        name: "Hipparcos",
        catalogueId: "S20169",
        kind: "TELESCOPE",
        location: "high-earth-orbit",
        description:
          "Spinning satellite with a 29 cm telescope that viewed two patches of sky at once to measure the angles between stars.",
        // GCAT's total at launch, including the apogee motor that failed.
        launchMassKg: 1130,
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "cobe",
    name: "COBE",
    image: "Cosmic Background Explorer spacecraft model.png",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    lastContact: "1993-12-23",
    description:
      "The Cosmic Background Explorer, which measured the faint glow left over from the Big Bang and showed it has an almost perfect black-body spectrum with tiny temperature variations. The work earned the 2006 Nobel Prize in Physics.",
    sourceUrl: "https://science.nasa.gov/mission/cobe/",
    agencies: ["NASA"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "cobe",
        name: "COBE",
        catalogueId: "S20322",
        kind: "TELESCOPE",
        location: "low-earth-orbit",
        description:
          "Satellite with three instruments behind a conical sunshade, two of them cooled by liquid helium.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "rosat",
    name: "ROSAT",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    lastContact: "1999-02-12",
    description:
      "A German-led X-ray observatory, built with the United States and the United Kingdom, that made the first imaging X-ray survey of the whole sky and catalogued more than 150,000 sources.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1990-049A",
    agencies: ["DLR", "NASA", "SERC"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "rosat",
        name: "ROSAT",
        catalogueId: "S20638",
        kind: "TELESCOPE",
        location: "low-earth-orbit",
        description:
          "Satellite carrying an X-ray telescope with an 84 cm mirror assembly and a smaller extreme-ultraviolet telescope.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "compton-gamma-ray-observatory",
    name: "Compton Gamma Ray Observatory",
    image: "CGRO s37-96-010.jpg",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    lastContact: "2000-06-04",
    endDeclared: "2000-06-04",
    description:
      "The second of NASA's Great Observatories, which studied the Universe in gamma rays and showed that gamma-ray bursts come from all directions in the sky. At 17 tonnes it was the heaviest astrophysics payload flown at the time.",
    sourceUrl: "https://science.nasa.gov/mission/cgro/",
    agencies: ["NASA"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "compton-gamma-ray-observatory",
        name: "Compton Gamma Ray Observatory",
        catalogueId: "S21225",
        kind: "TELESCOPE",
        location: "low-earth-orbit",
        description:
          "Observatory with four gamma-ray instruments, deployed from Space Shuttle Atlantis and deliberately brought down after a gyroscope failed.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "iso",
    name: "ISO",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    lastContact: "1998-05-16T12:00:00Z",
    endDeclared: "1998-05-16",
    description:
      "ESA's Infrared Space Observatory, which made more than 26,000 observations and found water vapour in star-forming clouds, around old stars and in the atmospheres of the giant planets.",
    sourceUrl:
      "https://www.esa.int/Science_Exploration/Space_Science/ISO_overview",
    agencies: ["ESA"],
    destinations: ["high-earth-orbit"],
    spacecraft: [
      {
        slug: "iso",
        name: "ISO",
        catalogueId: "S23715",
        kind: "TELESCOPE",
        location: "high-earth-orbit",
        horizonsId: "-640",
        description:
          "Telescope with a 60 cm mirror inside a tank of superfluid helium, which lasted eight months longer than planned.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "chandra",
    name: "Chandra",
    image: "Chandra artist illustration.jpg",
    discipline: "ASTROPHYSICS",
    status: "ACTIVE",
    description:
      "The third of NASA's Great Observatories, an X-ray telescope with the sharpest vision of any yet flown. It studies black holes, supernova remnants and the hot gas in galaxy clusters.",
    sourceUrl: "https://science.nasa.gov/mission/chandra/",
    agencies: ["NASA"],
    destinations: ["high-earth-orbit"],
    spacecraft: [
      {
        slug: "chandra",
        name: "Chandra X-ray Observatory",
        catalogueId: "S25867",
        kind: "TELESCOPE",
        location: "high-earth-orbit",
        horizonsId: "-151",
        description:
          "Observatory with four pairs of nested mirrors, the smoothest ever made, in an orbit that reaches a third of the way to the Moon.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "xmm-newton",
    name: "XMM-Newton",
    image: "XMM-Newton spacecraft model 1.png",
    discipline: "ASTROPHYSICS",
    status: "ACTIVE",
    description:
      "ESA's X-ray observatory, whose three telescopes give it an unusually large collecting area for studying faint sources, from comets to distant galaxy clusters.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1999-066A",
    agencies: ["ESA"],
    destinations: ["high-earth-orbit"],
    spacecraft: [
      {
        slug: "xmm-newton",
        name: "XMM-Newton",
        catalogueId: "S25989",
        kind: "TELESCOPE",
        location: "high-earth-orbit",
        horizonsId: "-125989",
        description:
          "Ten-metre-long satellite carrying three X-ray telescopes, each with 58 nested mirror shells, and an optical monitor.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "wmap",
    name: "WMAP",
    image: "WMAP spacecraft.jpg",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    lastContact: "2010-10-20",
    description:
      "The Wilkinson Microwave Anisotropy Probe, which mapped the cosmic microwave background from the Sun–Earth L2 point. It fixed the age of the Universe at about 13.8 billion years and measured its mix of ordinary matter, dark matter and dark energy.",
    sourceUrl: "https://science.nasa.gov/mission/wmap/",
    agencies: ["NASA"],
    destinations: ["sun-earth-l2"],
    spacecraft: [
      {
        slug: "wmap",
        name: "WMAP",
        catalogueId: "S26859",
        kind: "TELESCOPE",
        // Moved off L2 into an orbit around the Sun when it was retired in 2010.
        location: "heliocentric-orbit",
        horizonsId: "-165",
        description:
          "Spinning satellite with a pair of back-to-back telescopes that compared the temperature of two patches of sky at a time.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "integral",
    name: "INTEGRAL",
    image: "INTEGRAL spacecraft model.png",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    endDeclared: "2025-02-28",
    description:
      "ESA's gamma-ray observatory, which observed for more than 22 years. It studied black holes, neutron stars and the gamma-ray glow of the Milky Way, and helped pinpoint the 2017 neutron-star merger first detected in gravitational waves.",
    sourceUrl:
      "https://www.esa.int/Science_Exploration/Space_Science/Integral_overview",
    agencies: ["ESA"],
    destinations: ["high-earth-orbit"],
    spacecraft: [
      {
        slug: "integral",
        name: "INTEGRAL",
        catalogueId: "S27540",
        kind: "TELESCOPE",
        location: "high-earth-orbit",
        horizonsId: "-198",
        description:
          "Observatory with a gamma-ray imager and spectrometer, supported by X-ray and optical monitors.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "spitzer",
    name: "Spitzer",
    image: "Spitzer space telescope.jpg",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    lastContact: "2020-01-30",
    endDeclared: "2020-01-30",
    description:
      "The last of NASA's Great Observatories, an infrared telescope that trailed the Earth around the Sun for 16 years. It studied young stars, distant galaxies and exoplanets, including the seven Earth-sized planets of TRAPPIST-1.",
    sourceUrl: "https://science.nasa.gov/mission/spitzer/",
    agencies: ["NASA"],
    destinations: ["heliocentric-orbit"],
    spacecraft: [
      {
        slug: "spitzer",
        name: "Spitzer Space Telescope",
        catalogueId: "S27871",
        kind: "TELESCOPE",
        location: "heliocentric-orbit",
        horizonsId: "-79",
        description:
          "Telescope with an 85 cm beryllium mirror, cooled at first by liquid helium and later by its shade alone.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "swift",
    name: "Swift",
    image: "Swift Observatory spacecraft model.png",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    // NASA ended the science mission on 23 October 2026, after the final
    // observation on 20 October: atmospheric drag below 275 km stopped the
    // telescopes pointing steadily. Last contact is left out until a date is
    // published; Swift is expected to re-enter within weeks.
    // https://science.nasa.gov/missions/swift/nasas-swift-mission-ends/
    endDeclared: "2026-10-23",
    description:
      "A NASA observatory that caught gamma-ray bursts and turned within about a minute to observe their afterglows in X-ray, ultraviolet and visible light. Built for a two-year mission, it observed more than 2,000 bursts over nearly 22 years, until atmospheric drag pulled it too low to point steadily.",
    sourceUrl: "https://science.nasa.gov/mission/swift/",
    agencies: ["NASA"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "swift",
        name: "Neil Gehrels Swift Observatory",
        catalogueId: "S28485",
        kind: "TELESCOPE",
        location: "low-earth-orbit",
        horizonsId: "-128485",
        description:
          "Fast-slewing satellite with a wide-field burst detector and two narrow-field telescopes.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "corot",
    name: "CoRoT",
    image: "COROT integration.jpg",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    lastContact: "2014-06-17T10:27:00Z",
    endDeclared: "2013-06-24",
    description:
      "A French-led mission that was the first built to find planets by the dimming of their stars, and that also studied the vibrations of stars to probe their interiors.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2006-063A",
    agencies: ["CNES", "ESA"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "corot",
        name: "CoRoT",
        catalogueId: "S29678",
        kind: "TELESCOPE",
        location: "low-earth-orbit",
        description:
          "Satellite with a 27 cm telescope that stared at one field of stars for up to five months at a time.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "fermi",
    name: "Fermi",
    image: "Fermi Gamma-ray Space Telescope spacecraft model.png",
    discipline: "ASTROPHYSICS",
    status: "ACTIVE",
    description:
      "A NASA observatory that surveys the whole sky in gamma rays every three hours, studying pulsars, black-hole jets and gamma-ray bursts.",
    sourceUrl: "https://science.nasa.gov/mission/fermi/",
    agencies: ["NASA"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "fermi",
        name: "Fermi Gamma-ray Space Telescope",
        catalogueId: "S33053",
        kind: "TELESCOPE",
        location: "low-earth-orbit",
        description:
          "Satellite carrying the Large Area Telescope and a burst monitor that watches the entire unblocked sky.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "herschel",
    name: "Herschel",
    image: "Herschel Space Observatory at ESTEC.JPG",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    lastContact: "2013-06-17T12:25:00Z",
    endDeclared: "2013-04-29",
    description:
      "ESA's far-infrared observatory, which carried the largest mirror flown in space at the time. It studied how stars and galaxies form from cold gas and dust.",
    sourceUrl:
      "https://www.esa.int/Science_Exploration/Space_Science/Herschel_overview",
    agencies: ["ESA"],
    destinations: ["sun-earth-l2"],
    spacecraft: [
      {
        slug: "herschel",
        name: "Herschel Space Observatory",
        catalogueId: "S34937",
        kind: "TELESCOPE",
        // Moved off L2 into an orbit around the Sun when it was retired in 2013.
        location: "heliocentric-orbit",
        horizonsId: "-486",
        description:
          "Telescope with a 3.5 m mirror, its instruments cooled by more than 2,300 litres of liquid helium.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "planck",
    name: "Planck",
    image: "Model of the Planck Satellite.jpg",
    imageCredit: "Mike Peel",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    lastContact: "2013-10-23T12:10:27Z",
    endDeclared: "2013-10-23",
    description:
      "An ESA mission that mapped the cosmic microwave background in greater detail than any before it, giving the most precise measurements of the age and contents of the Universe.",
    sourceUrl:
      "https://www.esa.int/Science_Exploration/Space_Science/Planck_overview",
    agencies: ["ESA"],
    destinations: ["sun-earth-l2"],
    spacecraft: [
      {
        slug: "planck",
        name: "Planck",
        catalogueId: "S34938",
        kind: "TELESCOPE",
        // Moved off L2 into an orbit around the Sun when it was retired in 2013.
        location: "heliocentric-orbit",
        horizonsId: "-489",
        description:
          "Spinning satellite with a 1.5 m telescope and detectors cooled to a tenth of a degree above absolute zero.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "wise",
    name: "WISE",
    image: "WISE artist concept (PIA17254, crop).jpg",
    discipline: "ASTROPHYSICS",
    status: "COMPLETED",
    lastContact: "2024-08-08",
    endDeclared: "2024-08-08",
    description:
      "The Wide-field Infrared Survey Explorer, which surveyed the whole sky in infrared light. After its coolant ran out it was revived as NEOWISE to find and track asteroids and comets near the Earth.",
    sourceUrl: "https://science.nasa.gov/mission/neowise/",
    agencies: ["NASA"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "wise",
        name: "WISE",
        catalogueId: "S36119",
        kind: "TELESCOPE",
        location: "low-earth-orbit",
        horizonsId: "-163",
        description:
          "Satellite with a 40 cm telescope and four infrared detectors, originally cooled by solid hydrogen.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "nustar",
    name: "NuSTAR",
    image: "NuSTAR spacecraft model.png",
    discipline: "ASTROPHYSICS",
    status: "ACTIVE",
    description:
      "The first telescope to focus high-energy X-rays, used to study black holes, exploded stars and the hottest regions around them.",
    sourceUrl: "https://science.nasa.gov/mission/nustar/",
    agencies: ["NASA"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "nustar",
        name: "NuSTAR",
        catalogueId: "S38358",
        kind: "TELESCOPE",
        location: "low-earth-orbit",
        horizonsId: "-138358",
        description:
          "Small satellite whose two telescopes focus X-rays onto detectors at the end of a 10 m mast, unfolded after launch.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "astrosat",
    name: "Astrosat",
    image: "Astrosat-1 in deployed configuration 001.png",
    discipline: "ASTROPHYSICS",
    status: "ACTIVE",
    description:
      "India's first dedicated astronomy satellite, which observes the same target in ultraviolet, visible and X-ray light at the same time.",
    sourceUrl: "https://www.isro.gov.in/AstroSat.html",
    agencies: ["ISRO"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "astrosat",
        name: "Astrosat",
        catalogueId: "S40930",
        kind: "TELESCOPE",
        location: "low-earth-orbit",
        description:
          "Satellite with twin ultraviolet telescopes and three X-ray instruments pointing in the same direction.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "hitomi",
    name: "Hitomi",
    image: "Hitomi.png",
    discipline: "ASTROPHYSICS",
    status: "FAILED",
    lastContact: "2016-03-26",
    endDeclared: "2016-04-28",
    description:
      "A JAXA X-ray observatory built with NASA. It broke apart five weeks after launch when a software error set it spinning out of control, but had already measured the motion of hot gas in the Perseus galaxy cluster.",
    sourceUrl: "https://global.jaxa.jp/projects/sas/astro_h/",
    agencies: ["JAXA", "NASA"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "hitomi",
        name: "Hitomi",
        catalogueId: "S41337",
        kind: "TELESCOPE",
        location: "low-earth-orbit",
        description:
          "Observatory carrying an X-ray microcalorimeter cooled to a twentieth of a degree above absolute zero.",
        powerSource: "SOLAR",
        // GCAT also lists JAXA's Tsukuba Space Center.
        builders: ["NECT"],
      },
    ],
  },
  {
    slug: "tess",
    name: "TESS",
    image: "TESS alone high res.jpg",
    discipline: "ASTROPHYSICS",
    status: "ACTIVE",
    description:
      "The Transiting Exoplanet Survey Satellite, which watches the brightest nearby stars for planets crossing in front of them. It has found thousands of candidate planets across almost the whole sky.",
    sourceUrl: "https://science.nasa.gov/mission/tess/",
    agencies: ["NASA"],
    destinations: ["high-earth-orbit"],
    spacecraft: [
      {
        slug: "tess",
        name: "TESS",
        catalogueId: "S43435",
        kind: "TELESCOPE",
        location: "high-earth-orbit",
        horizonsId: "-95",
        description:
          "Small satellite with four wide-field cameras, in a stretched orbit that takes it around the Earth twice for every orbit of the Moon.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "spektr-rg",
    name: "Spektr-RG",
    image: "SPEKTR RG.png",
    discipline: "ASTROPHYSICS",
    status: "ACTIVE",
    description:
      "A Russian-German X-ray observatory at the Sun–Earth L2 point, built to survey the whole sky. The German eROSITA telescope was switched to safe mode in February 2022; the Russian ART-XC telescope continues to observe.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2019-040A",
    agencies: ["Roscosmos", "DLR"],
    destinations: ["sun-earth-l2"],
    spacecraft: [
      {
        slug: "spektr-rg",
        name: "Spektr-RG",
        catalogueId: "S44432",
        kind: "TELESCOPE",
        location: "sun-earth-l2",
        description:
          "Satellite carrying two X-ray telescopes, eROSITA and ART-XC, each with seven mirror modules.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "euclid",
    name: "Euclid",
    image: "Euclid looking into the Universe ESA24697255.jpeg",
    discipline: "ASTROPHYSICS",
    status: "ACTIVE",
    description:
      "An ESA mission mapping the shapes and distances of billions of galaxies across a third of the sky, to study dark matter and dark energy.",
    sourceUrl:
      "https://www.esa.int/Science_Exploration/Space_Science/Euclid_overview",
    agencies: ["ESA"],
    destinations: ["sun-earth-l2"],
    spacecraft: [
      {
        slug: "euclid",
        name: "Euclid",
        catalogueId: "S57209",
        kind: "TELESCOPE",
        location: "sun-earth-l2",
        horizonsId: "-680",
        description:
          "Telescope with a 1.2 m mirror feeding a visible-light camera and a near-infrared instrument.",
        powerSource: "SOLAR",
      },
    ],
  },
  {
    slug: "xrism",
    name: "XRISM",
    image: "XRISM in a nutshell (cropped).png",
    discipline: "ASTROPHYSICS",
    status: "ACTIVE",
    description:
      "A JAXA and NASA X-ray observatory that measures the energy of X-rays with great precision, revealing the temperature, composition and motion of hot gas around black holes and in galaxy clusters.",
    sourceUrl: "https://global.jaxa.jp/projects/sas/xrism/",
    agencies: ["JAXA", "NASA"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "xrism",
        name: "XRISM",
        catalogueId: "S57800",
        kind: "TELESCOPE",
        location: "low-earth-orbit",
        description:
          "Successor to the lost Hitomi, carrying a microcalorimeter spectrometer and a wide-field X-ray imager.",
        powerSource: "SOLAR",
        // GCAT also lists JAXA's Tsukuba Space Center.
        builders: ["NECT"],
      },
    ],
  },
  {
    slug: "einstein-probe",
    name: "Einstein Probe",
    image: "Einstein Probe illustration.png",
    imageCredit: "China News Service",
    discipline: "ASTROPHYSICS",
    status: "ACTIVE",
    description:
      "A Chinese Academy of Sciences mission, with ESA and German partners, that watches wide areas of the sky for sudden bursts of X-rays from events such as stars torn apart by black holes.",
    sourceUrl:
      "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2024-007A",
    agencies: ["CAS"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "einstein-probe",
        name: "Einstein Probe",
        catalogueId: "S58753",
        kind: "TELESCOPE",
        location: "low-earth-orbit",
        description:
          "Satellite with a wide-field telescope of twelve lobster-eye modules and a follow-up X-ray telescope.",
        powerSource: "SOLAR",
        // GCAT lists CAST; the academy's own microsatellite institute built
        // it.
        builders: ["IMICAS"],
      },
    ],
  },
  {
    slug: "spherex",
    name: "SPHEREx",
    image: "SPHEREx Spacecraft on Work Stand in Astrotech (KSC-20250116-PH-BMF01 0002).jpg",
    discipline: "ASTROPHYSICS",
    status: "ACTIVE",
    description:
      "A NASA mission mapping the entire sky in 102 colours of near-infrared light, to study the origin of the Universe, the history of galaxies and the ices in star-forming clouds.",
    sourceUrl: "https://science.nasa.gov/mission/spherex/",
    agencies: ["NASA"],
    destinations: ["low-earth-orbit"],
    spacecraft: [
      {
        slug: "spherex",
        name: "SPHEREx",
        catalogueId: "S63182",
        kind: "TELESCOPE",
        location: "low-earth-orbit",
        horizonsId: "-163182",
        description:
          "Small telescope behind three nested, cone-shaped shields that keep it cold without any coolant.",
        powerSource: "SOLAR",
      },
    ],
  },
];
