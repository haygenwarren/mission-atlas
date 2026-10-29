import type { MilestoneKind } from "../../src/generated/prisma/enums";

// The key events of each mission, keyed by mission slug: the launch, flybys,
// arrivals, landings and releases, sample returns, the start of science
// operations for telescopes, and the end. A launch from another world, such
// as a sample leaving the Moon, counts too. If a mission lists no launch, its
// launch date is shown without a description.
//
// date is the UTC day, "2004-07-01", or for a plan not yet fixed to a day,
// just the month, "2031-07". description says in two or three sentences what
// happened, and is shown when the event is opened on the timeline. planned
// marks an event still to come; change it when the event happens, with the
// actual date. spacecraft is the slug of the craft the event concerns, when
// it is not the whole mission.
//
// Each mission notes the sources its dates and facts were checked against.
export type MilestoneSeed = {
  date: string;
  kind: MilestoneKind;
  title: string;
  description: string;
  spacecraft?: string;
  planned?: boolean;
};

export const milestones: Record<string, MilestoneSeed[]> = {
  // https://en.wikipedia.org/wiki/Cassini–Huygens
  "cassini-huygens": [
    {
      date: "1997-10-15",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Titan IVB/Centaur from Cape Canaveral. Too heavy to fly straight to Saturn, it set out on a path that swung past Venus, Earth and Jupiter to gain speed.",
    },
    {
      date: "1998-04-26",
      kind: "FLYBY",
      title: "Venus flyby",
      description:
        "The first of four gravity assists, borrowing speed from Venus for the long climb out to Saturn.",
    },
    {
      date: "1999-06-24",
      kind: "FLYBY",
      title: "Second Venus flyby",
      description:
        "A second pass of Venus added more speed and set Cassini up for a close pass of Earth less than two months later.",
    },
    {
      date: "1999-08-18",
      kind: "FLYBY",
      title: "Earth flyby",
      description:
        "Swung past Earth for the speed it needed to reach Jupiter, and used the pass to calibrate its instruments.",
    },
    {
      date: "2000-12-30",
      kind: "FLYBY",
      title: "Jupiter flyby",
      description:
        "Took the last of its extra speed from Jupiter, and spent months observing the planet alongside NASA's Galileo orbiter.",
    },
    {
      date: "2004-07-01",
      kind: "ARRIVAL",
      title: "Enters orbit around Saturn",
      description:
        "Fired its main engine for about 96 minutes, crossing the plane of the rings through a gap, to slow down and become the first spacecraft to orbit Saturn.",
    },
    {
      date: "2004-12-25",
      kind: "RELEASE",
      title: "Huygens separates from Cassini",
      description:
        "Released on Christmas Day, the Huygens probe coasted for 20 days towards Titan on its own.",
      spacecraft: "huygens",
    },
    {
      date: "2005-01-14",
      kind: "LANDING",
      title: "Huygens lands on Titan",
      description:
        "Huygens descended by parachute through Titan's thick haze for about two and a half hours and landed on damp, pebble-strewn ground: the first landing in the outer Solar System. It sent data from the surface for more than an hour.",
      spacecraft: "huygens",
    },
    {
      date: "2017-09-15",
      kind: "END",
      title: "Dives into Saturn",
      description:
        "Low on fuel after 13 years at Saturn, Cassini was steered into the planet's atmosphere, sending data until it broke up. Ending this way meant it could never crash into Titan or Enceladus and contaminate them.",
    },
  ],

  // https://en.wikipedia.org/wiki/Voyager_1
  "voyager-1": [
    {
      date: "1977-09-05",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Titan IIIE/Centaur from Cape Canaveral, 16 days after its twin, Voyager 2, on a faster route that would reach Jupiter and Saturn first.",
    },
    {
      date: "1979-03-05",
      kind: "FLYBY",
      title: "Jupiter flyby",
      description:
        "Passed about 349,000 km above Jupiter's clouds and found active volcanoes on the moon Io, the first seen anywhere beyond Earth.",
    },
    {
      date: "1980-11-12",
      kind: "FLYBY",
      title: "Saturn and Titan flyby",
      description:
        "Flew close to Titan to study its thick atmosphere. The flyby bent Voyager 1's path up out of the plane of the planets, so it would visit no others.",
    },
    {
      date: "2012-08-25",
      kind: "ARRIVAL",
      title: "Enters interstellar space",
      description:
        "Crossed the heliopause, the edge of the bubble of solar wind around the Sun, to become the first spacecraft in interstellar space. NASA confirmed the crossing the following year.",
    },
  ],

  // https://en.wikipedia.org/wiki/Mars_2020, and for Ingenuity's last flight
  // https://nasaspaceflight.com/2024/01/ingenuity-final-flight
  "mars-2020": [
    {
      date: "2020-07-30",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Atlas V from Cape Canaveral, with the Ingenuity helicopter folded up beneath the Perseverance rover.",
    },
    {
      date: "2021-02-18",
      kind: "LANDING",
      title: "Lands in Jezero crater",
      description:
        "A rocket-powered sky crane lowered Perseverance to the floor of Jezero crater, beside the remains of an ancient river delta.",
    },
    {
      date: "2021-04-03",
      kind: "RELEASE",
      title: "Ingenuity set down on the surface",
      description:
        "Perseverance lowered Ingenuity from its belly onto the ground and drove away, leaving the helicopter to survive its first freezing Martian night on its own.",
      spacecraft: "ingenuity",
    },
    {
      date: "2021-04-19",
      kind: "OPERATIONS",
      title: "Ingenuity's first flight",
      description:
        "Ingenuity rose 3 metres, hovered and landed again: the first powered, controlled flight on another planet.",
      spacecraft: "ingenuity",
    },
    {
      date: "2024-01-18",
      kind: "END",
      title: "Ingenuity's last flight",
      description:
        "On its 72nd flight, far beyond the five it was built for, a rough landing damaged its rotor blades and it could no longer fly.",
      spacecraft: "ingenuity",
    },
  ],

  // https://en.wikipedia.org/wiki/Rosetta_(spacecraft), and for the last
  // Earth flyby https://sci.esa.int/web/rosetta/-/45842-third-earth-swingby-november-2009
  rosetta: [
    {
      date: "2004-03-02",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Ariane 5 from Kourou in French Guiana, on a ten-year journey to catch a comet.",
    },
    {
      date: "2005-03-04",
      kind: "FLYBY",
      title: "Earth flyby",
      description:
        "The first of four gravity assists that slowly stretched Rosetta's orbit out towards the comet's.",
    },
    {
      date: "2007-02-25",
      kind: "FLYBY",
      title: "Mars flyby",
      description:
        "Skimmed just 250 km above Mars, briefly passing through the planet's shadow on battery power.",
    },
    {
      date: "2007-11-13",
      kind: "FLYBY",
      title: "Second Earth flyby",
      description:
        "Another pass of Earth for speed. On its approach, astronomers briefly mistook Rosetta for an asteroid heading towards Earth.",
    },
    {
      date: "2008-09-05",
      kind: "FLYBY",
      title: "Asteroid Šteins flyby",
      description:
        "Passed 800 km from the small asteroid Šteins and imaged its diamond-shaped body.",
    },
    {
      date: "2009-11-13",
      kind: "FLYBY",
      title: "Third Earth flyby",
      description:
        "The last of its gravity assists put Rosetta on course to meet its comet.",
    },
    {
      date: "2010-07-10",
      kind: "FLYBY",
      title: "Asteroid Lutetia flyby",
      description:
        "Passed about 3,200 km from Lutetia, a battered asteroid about 120 km long. A year later Rosetta went into hibernation for the coldest stretch of its journey.",
    },
    {
      date: "2014-08-06",
      kind: "ARRIVAL",
      title: "Arrives at comet 67P",
      description:
        "Woken in January 2014 after 31 months of hibernation, Rosetta caught up with the comet and began to orbit it, the first spacecraft to do so.",
    },
    {
      date: "2014-11-12",
      kind: "LANDING",
      title: "Philae lands on the comet",
      description:
        "Philae's harpoons failed to fire and it bounced twice before settling in the shadow of a cliff: the first landing on a comet. It ran its experiments for about two and a half days, until its battery ran out.",
      spacecraft: "philae",
    },
    {
      date: "2016-09-30",
      kind: "END",
      title: "Descends onto the comet",
      description:
        "As the comet moved away from the Sun and power ran low, Rosetta was steered down onto its surface, taking pictures all the way.",
    },
  ],

  // https://en.wikipedia.org/wiki/New_Horizons
  "new-horizons": [
    {
      date: "2006-01-19",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Atlas V from Cape Canaveral faster than any spacecraft before it, passing the Moon's orbit in about nine hours.",
    },
    {
      date: "2007-02-28",
      kind: "FLYBY",
      title: "Jupiter flyby",
      description:
        "A gravity assist from Jupiter cut about three years off the trip to Pluto, and the flyby served as a rehearsal for the instruments.",
    },
    {
      date: "2015-07-14",
      kind: "FLYBY",
      title: "Pluto flyby",
      description:
        "Passed about 12,500 km above Pluto, the first spacecraft to visit it, and found a varied world of nitrogen-ice plains and mountains of water ice.",
    },
    {
      date: "2019-01-01",
      kind: "FLYBY",
      title: "Arrokoth flyby",
      description:
        "Passed 3,500 km from Arrokoth, a small Kuiper belt object made of two lobes gently stuck together: the most distant object yet visited by a spacecraft.",
    },
  ],

  // https://en.wikipedia.org/wiki/Hayabusa2, for Torifune
  // https://global.jaxa.jp/press/2026/07/20260730-1_e.html, and for the size
  // of 1998 KY26 (Santana-Ros et al., Nature Communications, 2025)
  // https://www.sciencedaily.com/releases/2025/11/251120002619.htm
  hayabusa2: [
    {
      date: "2014-12-03",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an H-IIA from the Tanegashima Space Center, with ion engines to carry it to the asteroid Ryugu.",
    },
    {
      date: "2015-12-03",
      kind: "FLYBY",
      title: "Earth flyby",
      description:
        "Swung past Earth a year after launch for the boost it needed to reach Ryugu.",
    },
    {
      date: "2018-06-27",
      kind: "ARRIVAL",
      title: "Arrives at asteroid Ryugu",
      description:
        "Arrived to find a spinning-top-shaped asteroid about 900 metres across, covered in boulders.",
    },
    {
      date: "2018-10-03",
      kind: "LANDING",
      title: "MASCOT lands on Ryugu",
      description:
        "The German–French MASCOT lander was dropped onto Ryugu and hopped across its surface, working for about 17 hours on its battery.",
      spacecraft: "mascot",
    },
    {
      date: "2019-02-21",
      kind: "LANDING",
      title: "First touchdown",
      description:
        "Touched down for a few seconds and fired a small bullet into the surface, catching the dust it threw up.",
    },
    {
      date: "2019-07-11",
      kind: "LANDING",
      title: "Second touchdown",
      description:
        "Touched down beside a crater it had blasted in April with a 2 kg copper projectile, collecting material from beneath the surface.",
    },
    {
      date: "2020-12-05",
      kind: "SAMPLE_RETURN",
      title: "Sample capsule lands in Australia",
      description:
        "Hayabusa2 released its capsule over Earth, and it landed by parachute in the South Australian outback with about 5.4 grams of Ryugu. The spacecraft flew on to new targets.",
    },
    {
      date: "2026-07-05",
      kind: "FLYBY",
      title: "Asteroid Torifune flyby",
      description:
        "Flew past the small asteroid Torifune at about 5 km/s, passing less than a kilometre from its centre.",
    },
    {
      date: "2031-07",
      kind: "ARRIVAL",
      title: "Arrives at asteroid 1998 KY26",
      description:
        "Due to reach 1998 KY26, an asteroid only about 11 metres across, roughly the size of the spacecraft itself, that turns in a matter of minutes.",
      planned: true,
    },
  ],

  // https://www.cosmos.esa.int/web/juice/mission, and for the 2026 Earth flyby
  // https://www.esa.int/Science_Exploration/Space_Science/Successful_Earth_flyby_improves_Juice_s_course_to_Jupiter
  juice: [
    {
      date: "2023-04-14",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Ariane 5 from Kourou, on an eight-year journey to Jupiter by way of Earth, the Moon and Venus.",
    },
    {
      date: "2024-08-19",
      kind: "FLYBY",
      title: "Moon flyby",
      description:
        "Passed the Moon, the first half of the first-ever back-to-back flyby of the Moon and Earth.",
    },
    {
      date: "2024-08-20",
      kind: "FLYBY",
      title: "Earth flyby",
      description: "A day later, Earth's gravity bent its path towards Venus.",
    },
    {
      date: "2025-08-31",
      kind: "FLYBY",
      title: "Venus flyby",
      description:
        "Gained speed from Venus, sending it back towards Earth for another boost.",
    },
    {
      date: "2026-09-28",
      kind: "FLYBY",
      title: "Second Earth flyby",
      description:
        "Passed about 8,600 km above the Indian Ocean, gaining around 3.5 km/s.",
    },
    {
      date: "2029-01",
      kind: "FLYBY",
      title: "Third Earth flyby",
      description:
        "A last pass of Earth is to set JUICE on course for Jupiter.",
      planned: true,
    },
    {
      date: "2031-07",
      kind: "ARRIVAL",
      title: "Enters orbit around Jupiter",
      description:
        "Due to arrive at Jupiter and begin a tour of flybys of Europa, Callisto and Ganymede.",
      planned: true,
    },
    {
      date: "2034-12",
      kind: "ARRIVAL",
      title: "Enters orbit around Ganymede",
      description:
        "Due to slow into orbit around Ganymede, the largest moon in the Solar System, and become the first spacecraft to orbit a moon other than our own.",
      planned: true,
    },
    {
      date: "2035-09",
      kind: "END",
      title: "End of mission",
      description:
        "The mission is planned to end after several months in orbit around Ganymede.",
      planned: true,
    },
  ],

  // https://science.nasa.gov/blogs/webb/2022/01/24/orbital-insertion-burn-a-success-webb-arrives-at-l2
  // and https://en.wikipedia.org/wiki/James_Webb_Space_Telescope
  jwst: [
    {
      date: "2021-12-25",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Ariane 5 from Kourou on Christmas Day, folded up to fit inside the rocket.",
    },
    {
      date: "2022-01-24",
      kind: "ARRIVAL",
      title: "Arrives in orbit around Sun–Earth L2",
      description:
        "After unfolding its sunshield and mirror on the way, Webb fired its thrusters for about five minutes to settle into orbit around the L2 point, about 1.5 million km from Earth.",
    },
    {
      date: "2022-07-12",
      kind: "OPERATIONS",
      title: "Science operations begin",
      description:
        "After months spent aligning its 18 mirror segments and testing its instruments, Webb began science observations. Its first full-colour images were released the same week.",
    },
  ],

  // https://en.wikipedia.org/wiki/Chang'e_5
  "change-5": [
    {
      date: "2020-11-23",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Long March 5 from Wenchang, carrying four craft stacked together: an orbiter, a return capsule, a lander and an ascent stage.",
    },
    {
      date: "2020-11-28",
      kind: "ARRIVAL",
      title: "Enters orbit around the Moon",
      description:
        "Braked into orbit around the Moon. The next day, the lander and ascent stage separated to head for the surface.",
    },
    {
      date: "2020-12-01",
      kind: "LANDING",
      title: "Lands in Oceanus Procellarum",
      description:
        "Landed near Mons Rümker in the Ocean of Storms, then drilled and scooped up lunar soil.",
      spacecraft: "change-5-lander",
    },
    {
      date: "2020-12-03",
      kind: "LAUNCH",
      title: "Samples launched from the Moon",
      description:
        "The ascent stage lifted off from the lander, the first launch from the Moon since 1976, and two days later docked with the orbiter to hand over the samples.",
    },
    {
      date: "2020-12-16",
      kind: "SAMPLE_RETURN",
      title: "Return capsule lands in Inner Mongolia",
      description:
        "The capsule skipped off the top of the atmosphere once to slow down, then landed with 1,731 grams of lunar samples.",
    },
    {
      date: "2021-03-15",
      kind: "ARRIVAL",
      title: "Orbiter reaches Sun–Earth L1",
      description:
        "Rather than retire, the orbiter flew on to the L1 point between Earth and the Sun, about 1.5 million km away, on an extended mission.",
      spacecraft: "change-5-orbiter",
    },
  ],

  // https://en.wikipedia.org/wiki/Mars_Climate_Orbiter
  "mars-climate-orbiter": [
    {
      date: "1998-12-11",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Delta II from Cape Canaveral, to study the Martian climate and relay data for the Mars Polar Lander.",
    },
    {
      date: "1999-09-23",
      kind: "END",
      title: "Lost while entering orbit around Mars",
      description:
        "During its orbit insertion burn it passed far closer to Mars than planned and was never heard from again. Ground software had given thruster data in imperial units where metric ones were expected.",
    },
  ],
};
