import type { MilestoneKind } from "../../src/generated/prisma/enums";

// The key events of each mission, keyed by mission slug: flybys, arrivals,
// landings and releases, sample returns, the start of science operations for
// telescopes, and the end. The launch comes from the mission's launch date,
// so it is not listed here (a launch from another world, such as a sample
// leaving the Moon, is).
//
// date is the UTC day, "2004-07-01", or for a plan not yet fixed to a day,
// just the month, "2031-07". planned marks an event still to come; change it
// when the event happens, with the actual date. spacecraft is the slug of the
// craft the event concerns, when it is not the whole mission.
//
// Each mission notes the sources its dates were checked against.
export type MilestoneSeed = {
  date: string;
  kind: MilestoneKind;
  title: string;
  detail?: string;
  spacecraft?: string;
  planned?: boolean;
};

export const milestones: Record<string, MilestoneSeed[]> = {
  // https://en.wikipedia.org/wiki/Cassini–Huygens
  "cassini-huygens": [
    { date: "1998-04-26", kind: "FLYBY", title: "Venus flyby" },
    { date: "1999-06-24", kind: "FLYBY", title: "Second Venus flyby" },
    { date: "1999-08-18", kind: "FLYBY", title: "Earth flyby" },
    { date: "2000-12-30", kind: "FLYBY", title: "Jupiter flyby" },
    {
      date: "2004-07-01",
      kind: "ARRIVAL",
      title: "Enters orbit around Saturn",
      detail: "The first spacecraft to orbit Saturn.",
    },
    {
      date: "2004-12-25",
      kind: "RELEASE",
      title: "Huygens separates from Cassini",
      spacecraft: "huygens",
    },
    {
      date: "2005-01-14",
      kind: "LANDING",
      title: "Huygens lands on Titan",
      detail: "The first landing in the outer Solar System.",
      spacecraft: "huygens",
    },
    {
      date: "2017-09-15",
      kind: "END",
      title: "Dives into Saturn",
      detail:
        "Ended on purpose, so it could never contaminate Titan or Enceladus.",
    },
  ],

  // https://en.wikipedia.org/wiki/Voyager_1
  "voyager-1": [
    { date: "1979-03-05", kind: "FLYBY", title: "Jupiter flyby" },
    { date: "1980-11-12", kind: "FLYBY", title: "Saturn and Titan flyby" },
    {
      date: "2012-08-25",
      kind: "ARRIVAL",
      title: "Enters interstellar space",
      detail: "The first spacecraft to cross the heliopause.",
    },
  ],

  // https://en.wikipedia.org/wiki/Mars_2020, and for Ingenuity's last flight
  // https://nasaspaceflight.com/2024/01/ingenuity-final-flight
  "mars-2020": [
    { date: "2021-02-18", kind: "LANDING", title: "Lands in Jezero crater" },
    {
      date: "2021-04-03",
      kind: "RELEASE",
      title: "Ingenuity set down on the surface",
      spacecraft: "ingenuity",
    },
    {
      date: "2021-04-19",
      kind: "OPERATIONS",
      title: "Ingenuity's first flight",
      detail: "The first powered, controlled flight on another planet.",
      spacecraft: "ingenuity",
    },
    {
      date: "2024-01-18",
      kind: "END",
      title: "Ingenuity's last flight",
      detail: "Its 72nd flight damaged a rotor blade, grounding it for good.",
      spacecraft: "ingenuity",
    },
  ],

  // https://en.wikipedia.org/wiki/Rosetta_(spacecraft), and for the last
  // Earth flyby https://sci.esa.int/web/rosetta/-/45842-third-earth-swingby-november-2009
  rosetta: [
    { date: "2005-03-04", kind: "FLYBY", title: "Earth flyby" },
    { date: "2007-02-25", kind: "FLYBY", title: "Mars flyby" },
    { date: "2007-11-13", kind: "FLYBY", title: "Second Earth flyby" },
    { date: "2008-09-05", kind: "FLYBY", title: "Asteroid Šteins flyby" },
    { date: "2009-11-13", kind: "FLYBY", title: "Third Earth flyby" },
    { date: "2010-07-10", kind: "FLYBY", title: "Asteroid Lutetia flyby" },
    {
      date: "2014-08-06",
      kind: "ARRIVAL",
      title: "Arrives at comet 67P",
      detail: "The first spacecraft to orbit a comet.",
    },
    {
      date: "2014-11-12",
      kind: "LANDING",
      title: "Philae lands on the comet",
      detail:
        "The first landing on a comet. It bounced and came to rest in shadow.",
      spacecraft: "philae",
    },
    {
      date: "2016-09-30",
      kind: "END",
      title: "Descends onto the comet",
      detail: "A controlled landing to end the mission.",
    },
  ],

  // https://en.wikipedia.org/wiki/New_Horizons
  "new-horizons": [
    { date: "2007-02-28", kind: "FLYBY", title: "Jupiter flyby" },
    {
      date: "2015-07-14",
      kind: "FLYBY",
      title: "Pluto flyby",
      detail: "The first spacecraft to visit Pluto.",
    },
    {
      date: "2019-01-01",
      kind: "FLYBY",
      title: "Arrokoth flyby",
      detail: "The most distant object yet visited by a spacecraft.",
    },
  ],

  // https://en.wikipedia.org/wiki/Hayabusa2, and for Torifune
  // https://global.jaxa.jp/press/2026/07/20260730-1_e.html
  hayabusa2: [
    { date: "2015-12-03", kind: "FLYBY", title: "Earth flyby" },
    { date: "2018-06-27", kind: "ARRIVAL", title: "Arrives at asteroid Ryugu" },
    {
      date: "2018-10-03",
      kind: "LANDING",
      title: "MASCOT lands on Ryugu",
      spacecraft: "mascot",
    },
    {
      date: "2019-02-21",
      kind: "LANDING",
      title: "First touchdown",
      detail: "Collected samples from Ryugu's surface.",
    },
    {
      date: "2019-07-11",
      kind: "LANDING",
      title: "Second touchdown",
      detail:
        "Collected material thrown up from a crater it had blasted in April.",
    },
    {
      date: "2020-12-05",
      kind: "SAMPLE_RETURN",
      title: "Sample capsule lands in Australia",
    },
    { date: "2026-07-05", kind: "FLYBY", title: "Asteroid Torifune flyby" },
    {
      date: "2031-07",
      kind: "ARRIVAL",
      title: "Arrives at asteroid 1998 KY26",
      planned: true,
    },
  ],

  // https://www.cosmos.esa.int/web/juice/mission, and for the 2026 Earth flyby
  // https://www.esa.int/Science_Exploration/Space_Science/Successful_Earth_flyby_improves_Juice_s_course_to_Jupiter
  juice: [
    { date: "2024-08-19", kind: "FLYBY", title: "Moon flyby" },
    { date: "2024-08-20", kind: "FLYBY", title: "Earth flyby" },
    { date: "2025-08-31", kind: "FLYBY", title: "Venus flyby" },
    { date: "2026-09-28", kind: "FLYBY", title: "Second Earth flyby" },
    {
      date: "2029-01",
      kind: "FLYBY",
      title: "Third Earth flyby",
      planned: true,
    },
    {
      date: "2031-07",
      kind: "ARRIVAL",
      title: "Enters orbit around Jupiter",
      planned: true,
    },
    {
      date: "2034-12",
      kind: "ARRIVAL",
      title: "Enters orbit around Ganymede",
      detail: "The first spacecraft to orbit a moon other than our own.",
      planned: true,
    },
    {
      date: "2035-09",
      kind: "END",
      title: "End of mission",
      planned: true,
    },
  ],

  // https://science.nasa.gov/blogs/webb/2022/01/24/orbital-insertion-burn-a-success-webb-arrives-at-l2
  // and https://en.wikipedia.org/wiki/James_Webb_Space_Telescope
  jwst: [
    {
      date: "2022-01-24",
      kind: "ARRIVAL",
      title: "Arrives in orbit around Sun–Earth L2",
    },
    {
      date: "2022-07-12",
      kind: "OPERATIONS",
      title: "Science operations begin",
      detail: "Its first full-colour images were released the same week.",
    },
  ],

  // https://en.wikipedia.org/wiki/Chang'e_5
  "change-5": [
    {
      date: "2020-11-28",
      kind: "ARRIVAL",
      title: "Enters orbit around the Moon",
    },
    {
      date: "2020-12-01",
      kind: "LANDING",
      title: "Lands in Oceanus Procellarum",
      spacecraft: "change-5-lander",
    },
    {
      date: "2020-12-03",
      kind: "LAUNCH",
      title: "Samples launched from the Moon",
      detail:
        "The ascent stage lifted off from the lander to meet the orbiter.",
    },
    {
      date: "2020-12-16",
      kind: "SAMPLE_RETURN",
      title: "Return capsule lands in Inner Mongolia",
      detail: "Carrying 1,731 grams of lunar samples.",
    },
    {
      date: "2021-03-15",
      kind: "ARRIVAL",
      title: "Orbiter reaches Sun–Earth L1",
      spacecraft: "change-5-orbiter",
    },
  ],

  // https://en.wikipedia.org/wiki/Mars_Climate_Orbiter
  "mars-climate-orbiter": [
    {
      date: "1999-09-23",
      kind: "END",
      title: "Lost while entering orbit around Mars",
      detail:
        "A mix-up between imperial and metric units sent it too deep into the atmosphere.",
    },
  ],
};
