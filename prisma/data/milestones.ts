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

  // The Moon

  // https://en.wikipedia.org/wiki/Chang'e_4
  "change-4": [
    {
      date: "2018-12-07",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Long March 3B from Xichang. Its relay satellite, Queqiao, had gone ahead in May to a point beyond the Moon, so the lander could talk to Earth from the far side.",
    },
    {
      date: "2018-12-12",
      kind: "ARRIVAL",
      title: "Enters orbit around the Moon",
      description:
        "Braked into orbit around the Moon, then spent three weeks adjusting its orbit before landing.",
    },
    {
      date: "2019-01-03",
      kind: "LANDING",
      title: "Lands on the far side",
      description:
        "Touched down in Von Kármán crater, inside the vast South Pole–Aitken basin: the first soft landing on the far side of the Moon.",
    },
    {
      date: "2019-01-03",
      kind: "RELEASE",
      title: "Yutu-2 rolls onto the surface",
      description:
        "About 12 hours after landing, the Yutu-2 rover drove down onto the far side, where it would outlast every rover before it.",
      spacecraft: "yutu-2",
    },
  ],

  // https://en.wikipedia.org/wiki/Chandrayaan-3
  "chandrayaan-3": [
    {
      date: "2023-07-14",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an LVM3 from Sriharikota: India's second attempt at a Moon landing, after Chandrayaan-2's lander crashed in 2019.",
    },
    {
      date: "2023-08-05",
      kind: "ARRIVAL",
      title: "Enters orbit around the Moon",
      description:
        "After weeks of raising its orbit around Earth, it slipped into orbit around the Moon.",
    },
    {
      date: "2023-08-17",
      kind: "RELEASE",
      title: "Lander separates",
      description:
        "The Vikram lander, carrying the Pragyan rover, separated from the propulsion module that had brought it to the Moon.",
      spacecraft: "vikram",
    },
    {
      date: "2023-08-23",
      kind: "LANDING",
      title: "Lands near the south pole",
      description:
        "Vikram touched down at about 69° south: the first soft landing near the Moon's south pole, making India the fourth country to land on the Moon. Pragyan rolled out the same day.",
    },
    {
      date: "2023-09-04",
      kind: "END",
      title: "Lander and rover go to sleep",
      description:
        "With night falling, Pragyan, after driving about 100 metres and confirming sulphur in the soil, and then Vikram were put to sleep. Neither answered the calls to wake up.",
    },
  ],

  // https://en.wikipedia.org/wiki/Luna_2
  "luna-2": [
    {
      date: "1959-09-12",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched from Baikonur straight towards the Moon. On the way it released a cloud of sodium vapour so astronomers could follow it.",
    },
    {
      date: "1959-09-13",
      kind: "END",
      title: "Hits the Moon",
      description:
        "Struck the Moon east of Mare Imbrium: the first human-made object to reach another world. It found no sign of a lunar magnetic field.",
    },
  ],

  // https://en.wikipedia.org/wiki/Luna_3
  "luna-3": [
    {
      date: "1959-10-04",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched from Baikonur two years to the day after Sputnik 1, on a loop around the Moon.",
    },
    {
      date: "1959-10-06",
      kind: "FLYBY",
      title: "Swings around the Moon",
      description:
        "Passed about 6,200 km from the Moon near its south pole. The Moon's gravity bent its path back towards Earth: the first gravity assist.",
    },
    {
      date: "1959-10-07",
      kind: "OPERATIONS",
      title: "Photographs the far side",
      description:
        "Took 29 photographs covering about 70% of the far side, never seen before. The film was developed, fixed and dried on board, then scanned and radioed to Earth.",
    },
    {
      date: "1959-10-22",
      kind: "END",
      title: "Last contact",
      description: "Contact was lost after it had sent its pictures home.",
    },
  ],

  // https://en.wikipedia.org/wiki/Luna_9
  "luna-9": [
    {
      date: "1966-01-31",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Molniya rocket from Baikonur. Several Soviet landers before it had crashed.",
    },
    {
      date: "1966-02-03",
      kind: "LANDING",
      title: "Lands in Oceanus Procellarum",
      description:
        "Its capsule, cushioned by an airbag, came down in the Ocean of Storms: the first soft landing on another world. About seven hours later it began sending panoramas of the surface.",
    },
    {
      date: "1966-02-06",
      kind: "END",
      title: "Last contact",
      description:
        "Fell silent after three days and nine pictures. It showed that the ground could bear a lander rather than swallowing it in dust.",
    },
  ],

  // https://en.wikipedia.org/wiki/Surveyor_1
  "surveyor-1": [
    {
      date: "1966-05-30",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Atlas-Centaur from Cape Canaveral, to try out landing on the Moon ahead of Apollo.",
    },
    {
      date: "1966-06-02",
      kind: "LANDING",
      title: "Lands in Oceanus Procellarum",
      description:
        "Came down gently in the Ocean of Storms: the first American soft landing on another world, four months after Luna 9.",
    },
    {
      date: "1967-01-07",
      kind: "END",
      title: "Last contact",
      description:
        "Solar-powered, it slept through the two-week lunar nights and woke again. By its last contact it had sent back more than 11,000 pictures.",
    },
  ],

  // https://en.wikipedia.org/wiki/Luna_16
  "luna-16": [
    {
      date: "1970-09-12",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Proton from Baikonur, to bring lunar soil back to Earth without a crew.",
    },
    {
      date: "1970-09-17",
      kind: "ARRIVAL",
      title: "Enters orbit around the Moon",
      description: "Settled into a circular orbit about 110 km up.",
    },
    {
      date: "1970-09-20",
      kind: "LANDING",
      title: "Lands in Mare Fecunditatis",
      description:
        "Landed in the Sea of Fertility, and within an hour began drilling 35 cm into the ground for a core of soil.",
    },
    {
      date: "1970-09-21",
      kind: "LAUNCH",
      title: "Sample launched from the Moon",
      description:
        "After a day on the surface, the ascent stage lifted off with the sample and headed straight for Earth.",
    },
    {
      date: "1970-09-24",
      kind: "SAMPLE_RETURN",
      title: "Return capsule lands in Kazakhstan",
      description:
        "The capsule parachuted down with 101 grams of lunar soil: the first sample brought back by a robot.",
    },
  ],

  // https://en.wikipedia.org/wiki/Luna_17 and
  // https://en.wikipedia.org/wiki/Lunokhod_1
  "luna-17": [
    {
      date: "1970-11-10",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Proton from Baikonur, carrying the Lunokhod 1 rover.",
    },
    {
      date: "1970-11-15",
      kind: "ARRIVAL",
      title: "Enters orbit around the Moon",
      description: "Went into orbit around the Moon two days before landing.",
    },
    {
      date: "1970-11-17",
      kind: "LANDING",
      title: "Lands in Mare Imbrium",
      description: "Touched down in the Sea of Rains.",
    },
    {
      date: "1970-11-17",
      kind: "RELEASE",
      title: "Lunokhod 1 drives onto the surface",
      description:
        "Less than three hours after landing, Lunokhod 1 rolled down the ramps: the first rover on another world, steered by a five-person crew on Earth.",
      spacecraft: "lunokhod-1",
    },
    {
      date: "1971-09-14",
      kind: "END",
      title: "Lunokhod 1 falls silent",
      description:
        "Built for three lunar days, it worked for eleven, driving 10.5 km and sending back more than 20,000 pictures before contact was lost.",
      spacecraft: "lunokhod-1",
    },
  ],

  // https://en.wikipedia.org/wiki/SMART-1
  "smart-1": [
    {
      date: "2003-09-27",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched as a passenger on an Ariane 5 from Kourou, to test a solar-powered ion engine on the way to the Moon.",
    },
    {
      date: "2004-11-15",
      kind: "ARRIVAL",
      title: "Captured by the Moon",
      description:
        "After more than a year spiralling slowly out from Earth on its ion engine, it was captured into orbit around the Moon.",
    },
    {
      date: "2006-09-03",
      kind: "END",
      title: "Crashes into the Moon on purpose",
      description:
        "With its mission extended by a year, SMART-1 was steered into the Moon, making an impact seen by telescopes on Earth.",
    },
  ],

  // https://en.wikipedia.org/wiki/SELENE
  kaguya: [
    {
      date: "2007-09-14",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an H-IIA from Tanegashima, carrying two small relay satellites alongside the main orbiter.",
    },
    {
      date: "2007-10-03",
      kind: "ARRIVAL",
      title: "Enters orbit around the Moon",
      description: "Entered a polar orbit, so it could map the whole Moon.",
    },
    {
      date: "2007-10-09",
      kind: "RELEASE",
      title: "Okina released",
      description:
        "Released into a long, looping orbit to relay Kaguya's signals when it was behind the Moon, so the gravity of the far side could be mapped for the first time.",
      spacecraft: "okina",
    },
    {
      date: "2007-10-12",
      kind: "RELEASE",
      title: "Ouna released",
      description:
        "Released into its own orbit as a radio beacon, tracked from Earth to measure the Moon's gravity precisely.",
      spacecraft: "ouna",
    },
    {
      date: "2009-02-12",
      kind: "END",
      title: "Okina hits the Moon",
      description: "Its relay work done, Okina struck the far side.",
      spacecraft: "okina",
    },
    {
      date: "2009-06-10",
      kind: "END",
      title: "Crashes into the Moon on purpose",
      description:
        "After more than a year and a half of mapping, and high-definition video of Earth rising over the lunar horizon, Kaguya was steered into the surface near the crater Gill.",
    },
  ],

  // https://en.wikipedia.org/wiki/Chandrayaan-1
  "chandrayaan-1": [
    {
      date: "2008-10-22",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a PSLV from Sriharikota: India's first mission to the Moon.",
    },
    {
      date: "2008-11-08",
      kind: "ARRIVAL",
      title: "Enters orbit around the Moon",
      description: "Went into orbit around the Moon two weeks after launch.",
    },
    {
      date: "2008-11-14",
      kind: "END",
      title: "Moon Impact Probe hits the south pole",
      description:
        "The probe dropped from the orbiter and struck near Shackleton crater 25 minutes later, sampling the Moon's thin atmosphere on the way down and finding traces of water.",
      spacecraft: "moon-impact-probe",
    },
    {
      date: "2009-08-28",
      kind: "END",
      title: "Contact lost",
      description:
        "Contact was lost after ten months, well short of the two years planned. By then NASA's Moon Mineralogy Mapper on board had found signs of water across the surface.",
    },
  ],

  // https://en.wikipedia.org/wiki/Lunar_Reconnaissance_Orbiter
  "lunar-reconnaissance-orbiter": [
    {
      date: "2009-06-18",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Atlas V from Cape Canaveral together with LCROSS, a probe sent to crash into a crater near the south pole and look for water.",
    },
    {
      date: "2009-06-23",
      kind: "ARRIVAL",
      title: "Enters orbit around the Moon",
      description: "Arrived after a four-and-a-half-day trip.",
    },
    {
      date: "2009-09-15",
      kind: "OPERATIONS",
      title: "Mapping begins",
      description:
        "Began mapping the Moon from 50 km up, to find landing sites and resources for future missions. Its camera is sharp enough to make out the Apollo landers left on the surface.",
    },
  ],

  // https://en.wikipedia.org/wiki/Chang'e_3
  "change-3": [
    {
      date: "2013-12-01",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Long March 3B from Xichang, carrying China's first lunar lander and rover.",
    },
    {
      date: "2013-12-06",
      kind: "ARRIVAL",
      title: "Enters orbit around the Moon",
      description: "Settled into a circular orbit 100 km above the Moon.",
    },
    {
      date: "2013-12-14",
      kind: "LANDING",
      title: "Lands in Mare Imbrium",
      description:
        "Touched down in the Sea of Rains: the first soft landing on the Moon since Luna 24 in 1976. Its ultraviolet telescope made it the first long-term observatory on the Moon.",
    },
    {
      date: "2013-12-14",
      kind: "RELEASE",
      title: "Yutu rolls onto the surface",
      description:
        "Hours after landing, the Yutu rover drove down onto the surface.",
      spacecraft: "yutu",
    },
    {
      date: "2016-07-31",
      kind: "END",
      title: "Yutu falls silent",
      description:
        "Yutu stopped driving after its second lunar day but kept sending data for more than two years before it stopped responding.",
      spacecraft: "yutu",
    },
  ],

  // https://en.wikipedia.org/wiki/Smart_Lander_for_Investigating_Moon
  slim: [
    {
      date: "2023-09-06",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an H-IIA from Tanegashima, sharing the ride with the XRISM X-ray telescope.",
    },
    {
      date: "2023-12-25",
      kind: "ARRIVAL",
      title: "Enters orbit around the Moon",
      description:
        "Reached lunar orbit on Christmas Day after a long, fuel-saving route.",
    },
    {
      date: "2024-01-19",
      kind: "LANDING",
      title: "Lands within 100 metres of its target",
      description:
        "Landed within 100 metres of its target, making Japan the fifth country to land on the Moon. An engine nozzle came off on the way down, and SLIM ended up on its nose with its solar panels facing away from the Sun.",
    },
    {
      date: "2024-04-29",
      kind: "END",
      title: "Last contact",
      description:
        "Against expectations it survived three freezing lunar nights, waking each time the sunlight reached its panels, until it fell silent.",
    },
  ],

  // https://en.wikipedia.org/wiki/Beresheet
  beresheet: [
    {
      date: "2019-02-22",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched as a passenger on a Falcon 9 from Cape Canaveral: the first privately funded attempt to land on the Moon, built by SpaceIL and Israel Aerospace Industries.",
    },
    {
      date: "2019-04-04",
      kind: "ARRIVAL",
      title: "Captured into orbit around the Moon",
      description:
        "After six weeks looping ever further from Earth, it was captured by the Moon's gravity.",
    },
    {
      date: "2019-04-11",
      kind: "END",
      title: "Crashes while landing",
      description:
        "During the descent a gyroscope unit failed. Restarting it shut down the main engine, and the lander hit Mare Serenitatis at more than 500 km/h.",
    },
  ],

  // Mercury

  // https://en.wikipedia.org/wiki/Mariner_10
  "mariner-10": [
    {
      date: "1973-11-03",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Atlas-Centaur from Cape Canaveral, to reach Mercury by way of Venus.",
    },
    {
      date: "1974-02-05",
      kind: "FLYBY",
      title: "Venus flyby",
      description:
        "Used Venus's gravity to fall inwards to Mercury: the first time one planet's gravity was used to reach another.",
    },
    {
      date: "1974-03-29",
      kind: "FLYBY",
      title: "First Mercury flyby",
      description:
        "The first spacecraft to visit Mercury. It found that the planet has a magnetic field and a large iron core.",
    },
    {
      date: "1974-09-21",
      kind: "FLYBY",
      title: "Second Mercury flyby",
      description:
        "Its orbit around the Sun brought it back to Mercury about every six months.",
    },
    {
      date: "1975-03-16",
      kind: "FLYBY",
      title: "Third Mercury flyby",
      description:
        "Its closest pass. On all three flybys the same side of Mercury was lit, so it mapped only 40–45% of the planet.",
    },
    {
      date: "1975-03-24",
      kind: "END",
      title: "Transmitter switched off",
      description:
        "Out of the nitrogen gas that kept it pointed, Mariner 10 was told to turn off its transmitter.",
    },
  ],

  // https://en.wikipedia.org/wiki/MESSENGER
  messenger: [
    {
      date: "2004-08-03",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Delta II from Cape Canaveral, on a six-and-a-half-year path to Mercury with six planetary flybys.",
    },
    {
      date: "2005-08-02",
      kind: "FLYBY",
      title: "Earth flyby",
      description: "Swung past Earth a year after launch, heading for Venus.",
    },
    {
      date: "2006-10-24",
      kind: "FLYBY",
      title: "Venus flyby",
      description: "The first of two passes of Venus.",
    },
    {
      date: "2007-06-05",
      kind: "FLYBY",
      title: "Second Venus flyby",
      description:
        "Passed just 337 km from Venus, bending its path towards Mercury.",
    },
    {
      date: "2008-01-14",
      kind: "FLYBY",
      title: "First Mercury flyby",
      description:
        "The first visit to Mercury since Mariner 10, 33 years earlier, imaging parts of the planet never seen before.",
    },
    {
      date: "2008-10-06",
      kind: "FLYBY",
      title: "Second Mercury flyby",
      description: "Passed 200 km above Mercury, losing more speed.",
    },
    {
      date: "2009-09-29",
      kind: "FLYBY",
      title: "Third Mercury flyby",
      description: "The last flyby before it could slow enough to stay.",
    },
    {
      date: "2011-03-18",
      kind: "ARRIVAL",
      title: "Enters orbit around Mercury",
      description: "Became the first spacecraft to orbit Mercury.",
    },
    {
      date: "2015-04-30",
      kind: "END",
      title: "Crashes into Mercury",
      description:
        "Out of fuel after four years in orbit, during which it found water ice in permanently shadowed craters near the north pole, MESSENGER struck Mercury at about 14,000 km/h.",
    },
  ],

  // https://en.wikipedia.org/wiki/BepiColombo
  bepicolombo: [
    {
      date: "2018-10-20",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Ariane 5 from Kourou: two orbiters, ESA's MPO and JAXA's Mio, stacked on a transfer module with ion engines.",
    },
    {
      date: "2020-04-10",
      kind: "FLYBY",
      title: "Earth flyby",
      description:
        "The first of nine planetary flybys to slow it down for Mercury.",
    },
    {
      date: "2020-10-15",
      kind: "FLYBY",
      title: "Venus flyby",
      description: "The first of two passes of Venus.",
    },
    {
      date: "2021-08-10",
      kind: "FLYBY",
      title: "Second Venus flyby",
      description: "The second pass of Venus sent it on to Mercury.",
    },
    {
      date: "2021-10-01",
      kind: "FLYBY",
      title: "First Mercury flyby",
      description: "The first of six passes of Mercury.",
    },
    {
      date: "2022-06-23",
      kind: "FLYBY",
      title: "Second Mercury flyby",
      description: "Another pass of Mercury to shed speed.",
    },
    {
      date: "2023-06-19",
      kind: "FLYBY",
      title: "Third Mercury flyby",
      description: "Another pass of Mercury to shed speed.",
    },
    {
      date: "2024-09-04",
      kind: "FLYBY",
      title: "Fourth Mercury flyby",
      description:
        "A thruster fault that April had cut the power of its ion engines, so its route was changed, adding 11 months to the journey.",
    },
    {
      date: "2024-12-01",
      kind: "FLYBY",
      title: "Fifth Mercury flyby",
      description: "Another pass of Mercury to shed speed.",
    },
    {
      date: "2025-01-08",
      kind: "FLYBY",
      title: "Sixth Mercury flyby",
      description: "The last of its nine flybys.",
    },
    {
      date: "2026-09-03",
      kind: "RELEASE",
      title: "Transfer module separates",
      description:
        "Its work done, the transfer module was released, leaving the two orbiters to make the final approach to Mercury.",
    },
    {
      date: "2026-11-21",
      kind: "ARRIVAL",
      title: "Enters orbit around Mercury",
      description: "Due to be captured into orbit around Mercury.",
      planned: true,
    },
    {
      date: "2026-12-10",
      kind: "RELEASE",
      title: "Mio separates",
      description:
        "JAXA's Mio is due to separate from ESA's MPO, and the two to go to their own orbits around Mercury.",
      spacecraft: "mio",
      planned: true,
    },
  ],

  // Venus

  // https://en.wikipedia.org/wiki/Venera_7
  "venera-7": [
    {
      date: "1970-08-17",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Molniya rocket from Baikonur, with a lander built to survive the crushing heat and pressure of Venus.",
    },
    {
      date: "1970-12-15",
      kind: "LANDING",
      title: "Lands on Venus",
      description:
        "Its parachute failed on the way down and it hit the surface hard, but it kept transmitting: the first signals from the surface of another planet. They gave a temperature of about 475 °C.",
    },
    {
      date: "1970-12-15",
      kind: "END",
      title: "Last signal",
      description:
        "The faint signal from the surface lasted about 20 minutes. It went unnoticed at first, and was found in the recordings weeks later.",
    },
  ],

  // https://en.wikipedia.org/wiki/Mariner_2
  "mariner-2": [
    {
      date: "1962-08-27",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Atlas-Agena from Cape Canaveral, five weeks after its twin, Mariner 1, was destroyed when its rocket veered off course.",
    },
    {
      date: "1962-12-14",
      kind: "FLYBY",
      title: "Venus flyby",
      description:
        "Passed about 34,800 km from Venus, the first spacecraft to fly past another planet, and found a scorching surface beneath cool clouds.",
    },
    {
      date: "1963-01-03",
      kind: "END",
      title: "Last contact",
      description:
        "On the way it had confirmed that the solar wind blows continuously through space.",
    },
  ],

  // https://en.wikipedia.org/wiki/Venera_9
  "venera-9": [
    {
      date: "1975-06-08",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Proton from Baikonur, carrying an orbiter and a lander.",
    },
    {
      date: "1975-10-20",
      kind: "ARRIVAL",
      title: "Enters orbit around Venus",
      description:
        "After releasing its lander, the orbiter became the first spacecraft to orbit Venus.",
      spacecraft: "venera-9-orbiter",
    },
    {
      date: "1975-10-22",
      kind: "LANDING",
      title: "Lander touches down",
      description:
        "Landed on a slope strewn with rocks and sent back the first pictures from the surface of another planet, lasting 53 minutes in the heat.",
      spacecraft: "venera-9-lander",
    },
    {
      date: "1976-03-22",
      kind: "END",
      title: "Orbiter's last contact",
      description:
        "The orbiter's mission ended after five months around Venus.",
      spacecraft: "venera-9-orbiter",
    },
  ],

  // https://en.wikipedia.org/wiki/Vega_1
  "vega-1": [
    {
      date: "1984-12-15",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Proton from Baikonur: a Soviet-led international mission to Venus and then Halley's Comet.",
    },
    {
      date: "1985-06-09",
      kind: "RELEASE",
      title: "Lander and balloon released",
      description:
        "Two days before reaching Venus, the main craft released a capsule holding a lander and a balloon.",
    },
    {
      date: "1985-06-11",
      kind: "LANDING",
      title: "Lander touches down",
      description:
        "Landed north of Aphrodite Terra. Turbulence had set off some experiments 20 km up, so its soil experiment returned nothing.",
      spacecraft: "vega-1-lander",
    },
    {
      date: "1985-06-11",
      kind: "RELEASE",
      title: "Balloon inflates in the clouds",
      description:
        "The first balloon on another planet. It floated in Venus's clouds for about two days, drifting 11,600 km on the winds.",
      spacecraft: "vega-1-balloon",
    },
    {
      date: "1986-03-06",
      kind: "FLYBY",
      title: "Halley's Comet flyby",
      description:
        "Passed about 8,900 km from Halley's nucleus. Its pictures helped guide ESA's Giotto even closer a week later.",
    },
    {
      date: "1987-01-30",
      kind: "END",
      title: "Runs out of fuel",
      description:
        "Its attitude-control propellant ran out, ending the mission.",
    },
  ],

  // https://en.wikipedia.org/wiki/Magellan_(spacecraft)
  magellan: [
    {
      date: "1989-05-04",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched from the Space Shuttle Atlantis: the first planetary mission sent up on a Shuttle.",
    },
    {
      date: "1990-08-10",
      kind: "ARRIVAL",
      title: "Enters orbit around Venus",
      description: "Went into a long, looping orbit around Venus.",
    },
    {
      date: "1990-09-15",
      kind: "OPERATIONS",
      title: "Radar mapping begins",
      description:
        "Its radar looked through the clouds to map the surface. By the end it had covered about 98% of Venus.",
    },
    {
      date: "1994-10-13",
      kind: "END",
      title: "Plunges into Venus",
      description:
        "Lowered into Venus's atmosphere to study it on the way down, Magellan broke up.",
    },
  ],

  // https://en.wikipedia.org/wiki/Venus_Express
  "venus-express": [
    {
      date: "2005-11-09",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Soyuz-Fregat from Baikonur: ESA's first Venus mission, built on the design of Mars Express.",
    },
    {
      date: "2006-04-11",
      kind: "ARRIVAL",
      title: "Enters orbit around Venus",
      description:
        "Fired its main engine for about 50 minutes to be captured by Venus.",
    },
    {
      date: "2014-12-16",
      kind: "END",
      title: "Mission ends",
      description:
        "Out of fuel after more than eight years at Venus, during which it found a huge double vortex over the south pole, it could no longer be controlled.",
    },
  ],

  // https://en.wikipedia.org/wiki/Akatsuki_(spacecraft)
  akatsuki: [
    {
      date: "2010-05-20",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an H-IIA from Tanegashima, alongside the IKAROS solar sail.",
    },
    {
      date: "2010-12-06",
      kind: "ARRIVAL",
      title: "Misses orbit around Venus",
      description:
        "A blocked valve starved its main engine during the orbit insertion burn, and Akatsuki sailed past Venus into an orbit around the Sun.",
    },
    {
      date: "2015-12-07",
      kind: "ARRIVAL",
      title: "Enters orbit around Venus",
      description:
        "Five years later, engineers tried again using its small attitude thrusters, and a 20-minute burn put it in orbit around Venus.",
    },
    {
      date: "2025-09-18",
      kind: "END",
      title: "Mission ends",
      description:
        "Contact was lost in April 2024 when its pointing control failed, and JAXA ended the mission in September 2025.",
    },
  ],

  // The outer planets

  // https://en.wikipedia.org/wiki/Voyager_2
  "voyager-2": [
    {
      date: "1977-08-20",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Titan IIIE/Centaur from Cape Canaveral, two weeks before Voyager 1 but on a slower route, so Voyager 1 reached Jupiter and Saturn first.",
    },
    {
      date: "1979-07-09",
      kind: "FLYBY",
      title: "Jupiter flyby",
      description:
        "Passed about 570,000 km above Jupiter's clouds and watched the Great Red Spot turning as a vast storm.",
    },
    {
      date: "1981-08-26",
      kind: "FLYBY",
      title: "Saturn flyby",
      description:
        "Passed about 101,000 km from Saturn and saw dark 'spokes' in its rings. Saturn's gravity sent it on towards Uranus.",
    },
    {
      date: "1986-01-24",
      kind: "FLYBY",
      title: "Uranus flyby",
      description:
        "The only spacecraft to visit Uranus. It found 11 new moons and a magnetic field tilted far from the planet's spin.",
    },
    {
      date: "1989-08-25",
      kind: "FLYBY",
      title: "Neptune flyby",
      description:
        "The only spacecraft to visit Neptune. It passed less than 5,000 km above the clouds and found rings and a Great Dark Spot, a storm that has since gone.",
    },
    {
      date: "2018-11-05",
      kind: "ARRIVAL",
      title: "Enters interstellar space",
      description:
        "Crossed the heliopause, about 120 times farther from the Sun than Earth, six years after Voyager 1.",
    },
  ],

  // https://en.wikipedia.org/wiki/Pioneer_10
  "pioneer-10": [
    {
      date: "1972-03-03",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Atlas-Centaur from Cape Canaveral, carrying a plaque with a message for anyone who finds it.",
    },
    {
      date: "1973-12-03",
      kind: "FLYBY",
      title: "Jupiter flyby",
      description:
        "After becoming the first spacecraft to cross the asteroid belt, it passed about 132,000 km from Jupiter: the first visit to the planet.",
    },
    {
      date: "1983-06-13",
      kind: "ARRIVAL",
      title: "Crosses Neptune's orbit",
      description:
        "Became the first human-made object to pass beyond the orbits of all the planets, on a path towards the star Aldebaran.",
    },
    {
      date: "1997-03-31",
      kind: "END",
      title: "Science mission ends",
      description:
        "NASA ended the science mission, though contact continued for a few more years.",
    },
    {
      date: "2003-01-23",
      kind: "END",
      title: "Last signal",
      description:
        "Its last faint signal was received from about 80 times Earth's distance from the Sun.",
    },
  ],

  // https://en.wikipedia.org/wiki/Pioneer_11
  "pioneer-11": [
    {
      date: "1973-04-06",
      kind: "LAUNCH",
      title: "Launch",
      description: "Launched on an Atlas-Centaur from Cape Canaveral.",
    },
    {
      date: "1974-12-03",
      kind: "FLYBY",
      title: "Jupiter flyby",
      description:
        "Passed about 42,500 km above Jupiter's clouds, much closer than Pioneer 10, and Jupiter's gravity swung it across the Solar System towards Saturn.",
    },
    {
      date: "1979-09-01",
      kind: "FLYBY",
      title: "Saturn flyby",
      description:
        "The first spacecraft to visit Saturn. It found a new ring and a small moon, and crossed the ring plane on the path Voyager 2 would later follow.",
    },
    {
      date: "1995-11-24",
      kind: "END",
      title: "Last signal",
      description:
        "Routine contact ended that September, as its power ran low, and its last usable signal arrived in November.",
    },
  ],

  // https://en.wikipedia.org/wiki/Galileo_(spacecraft), and for its flybys
  // https://www.nasa.gov/history/30-years-ago-galileo-off-to-orbit-jupiter/
  galileo: [
    {
      date: "1989-10-18",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched from the Space Shuttle Atlantis, with a probe to drop into Jupiter's atmosphere.",
    },
    {
      date: "1990-02-10",
      kind: "FLYBY",
      title: "Venus flyby",
      description:
        "The first of three gravity assists on a looping route to Jupiter.",
    },
    {
      date: "1990-12-08",
      kind: "FLYBY",
      title: "Earth flyby",
      description: "Passed about 960 km from Earth for more speed.",
    },
    {
      date: "1991-10-29",
      kind: "FLYBY",
      title: "Asteroid Gaspra flyby",
      description: "The first close flyby of an asteroid.",
    },
    {
      date: "1992-12-08",
      kind: "FLYBY",
      title: "Second Earth flyby",
      description:
        "A second pass of Earth, about 300 km up, gave it the energy to reach Jupiter.",
    },
    {
      date: "1993-08-28",
      kind: "FLYBY",
      title: "Asteroid Ida flyby",
      description:
        "Found that Ida has a small moon of its own, later named Dactyl: the first moon of an asteroid ever found.",
    },
    {
      date: "1995-07-12",
      kind: "RELEASE",
      title: "Probe released",
      description:
        "Five months out from Jupiter, the atmospheric probe separated to fly the rest of the way on its own.",
      spacecraft: "galileo-probe",
    },
    {
      date: "1995-12-07",
      kind: "END",
      title: "Probe plunges into Jupiter",
      description:
        "The probe entered Jupiter's atmosphere and sent back measurements for about an hour as it fell, until the heat and pressure overcame it.",
      spacecraft: "galileo-probe",
    },
    {
      date: "1995-12-08",
      kind: "ARRIVAL",
      title: "Enters orbit around Jupiter",
      description:
        "Hours after relaying the probe's data, Galileo fired its engine to become the first spacecraft to orbit Jupiter.",
    },
    {
      date: "2003-09-21",
      kind: "END",
      title: "Plunges into Jupiter",
      description:
        "After nearly eight years in orbit, Galileo was steered into Jupiter so it could never crash into Europa and contaminate any life there.",
    },
  ],

  // https://en.wikipedia.org/wiki/Juno_(spacecraft)
  juno: [
    {
      date: "2011-08-05",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Atlas V from Cape Canaveral: the first mission to the outer planets powered by solar panels rather than nuclear generators.",
    },
    {
      date: "2013-10-09",
      kind: "FLYBY",
      title: "Earth flyby",
      description:
        "Swung past Earth, 559 km up, for the speed to reach Jupiter.",
    },
    {
      date: "2016-07-05",
      kind: "ARRIVAL",
      title: "Enters orbit around Jupiter",
      description:
        "Fired its engine for 35 minutes to enter a polar orbit. A valve problem later ruled out the burn that would have shortened it, so Juno stayed in a 53-day orbit.",
    },
    {
      date: "2021-06-07",
      kind: "FLYBY",
      title: "Ganymede flyby",
      description:
        "Passed about 1,000 km from Ganymede, the closest any spacecraft had come in more than 20 years.",
    },
    {
      date: "2022-09-29",
      kind: "FLYBY",
      title: "Europa flyby",
      description: "Passed 352 km from Europa's icy surface.",
    },
    {
      date: "2023-12-30",
      kind: "FLYBY",
      title: "Io flyby",
      description:
        "The first of two passes about 1,500 km from Io, the most volcanic world in the Solar System.",
    },
  ],

  // https://en.wikipedia.org/wiki/Europa_Clipper
  "europa-clipper": [
    {
      date: "2024-10-14",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Falcon Heavy from Kennedy Space Center: the largest spacecraft NASA has sent to another planet, with solar arrays spanning 30.5 m.",
    },
    {
      date: "2025-03-01",
      kind: "FLYBY",
      title: "Mars flyby",
      description:
        "Passed 884 km from Mars for a gravity assist back towards Earth.",
    },
    {
      date: "2026-12-03",
      kind: "FLYBY",
      title: "Earth flyby",
      description:
        "Due to swing past Earth for the speed it needs to reach Jupiter.",
      planned: true,
    },
    {
      date: "2030-04",
      kind: "ARRIVAL",
      title: "Enters orbit around Jupiter",
      description:
        "Due to slow into orbit around Jupiter, after a flyby of Ganymede.",
      planned: true,
    },
    {
      date: "2034-09",
      kind: "END",
      title: "End of mission",
      description:
        "The primary mission is planned to end in 2034, after dozens of close flybys of Europa to study the ocean beneath its ice.",
      planned: true,
    },
  ],

  // Mars

  // https://en.wikipedia.org/wiki/Mariner_4
  "mariner-4": [
    {
      date: "1964-11-28",
      kind: "LAUNCH",
      title: "Launch",
      description: "Launched on an Atlas-Agena from Cape Canaveral.",
    },
    {
      date: "1965-07-15",
      kind: "FLYBY",
      title: "Mars flyby",
      description:
        "Passed 9,846 km from Mars and took the first close-up pictures of another planet. They showed a cratered, Moon-like surface and a thin atmosphere. Each picture took about six hours to send home.",
    },
    {
      date: "1967-12-21",
      kind: "END",
      title: "Last contact",
      description: "Contact ended more than two years after the flyby.",
    },
  ],

  // https://en.wikipedia.org/wiki/Mariner_9
  "mariner-9": [
    {
      date: "1971-05-30",
      kind: "LAUNCH",
      title: "Launch",
      description: "Launched on an Atlas-Centaur from Cape Canaveral.",
    },
    {
      date: "1971-11-14",
      kind: "ARRIVAL",
      title: "Enters orbit around Mars",
      description:
        "The first spacecraft to orbit another planet. It arrived during a dust storm covering all of Mars, and waited about two months for the dust to clear.",
    },
    {
      date: "1972-10-27",
      kind: "END",
      title: "Switched off",
      description:
        "Switched off when its attitude-control gas ran out, after mapping 85% of Mars and revealing Valles Marineris and the giant volcanoes.",
    },
  ],

  // https://en.wikipedia.org/wiki/Mars_3
  "mars-3": [
    {
      date: "1971-05-28",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Proton from Baikonur, carrying an orbiter and a lander.",
    },
    {
      date: "1971-12-02",
      kind: "RELEASE",
      title: "Lander released",
      description:
        "The lander separated about four and a half hours before reaching Mars.",
      spacecraft: "mars-3-lander",
    },
    {
      date: "1971-12-02",
      kind: "LANDING",
      title: "Lander touches down",
      description:
        "The first soft landing on Mars. The lander began transmitting 90 seconds later but fell silent after about 20 seconds, perhaps because of the planet-wide dust storm.",
      spacecraft: "mars-3-lander",
    },
    {
      date: "1971-12-02",
      kind: "ARRIVAL",
      title: "Enters orbit around Mars",
      description:
        "A partial loss of fuel left the orbiter in a much longer orbit than planned.",
      spacecraft: "mars-3-orbiter",
    },
    {
      date: "1972-08-22",
      kind: "END",
      title: "Orbiter's mission ends",
      description:
        "The orbiter's mission was declared complete after 20 orbits.",
      spacecraft: "mars-3-orbiter",
    },
  ],

  // https://en.wikipedia.org/wiki/Viking_1
  "viking-1": [
    {
      date: "1975-08-20",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Titan IIIE/Centaur from Cape Canaveral, carrying an orbiter and a lander.",
    },
    {
      date: "1976-06-19",
      kind: "ARRIVAL",
      title: "Enters orbit around Mars",
      description:
        "The orbiter spent a month scouting for a safe landing site.",
    },
    {
      date: "1976-07-20",
      kind: "LANDING",
      title: "Lander touches down in Chryse Planitia",
      description:
        "The first successful landing on Mars. It sent its first picture 25 seconds after landing, and went on to test the soil for signs of life.",
      spacecraft: "viking-1-lander",
    },
    {
      date: "1980-08-17",
      kind: "END",
      title: "Orbiter switched off",
      description:
        "Low on attitude-control gas, the orbiter was shut down after 1,485 orbits.",
      spacecraft: "viking-1-orbiter",
    },
    {
      date: "1982-11-11",
      kind: "END",
      title: "Lander falls silent",
      description:
        "A faulty command meant to update its battery software overwrote its antenna pointing data, and contact was never regained. Its six years on the surface stood as a record until 2010.",
      spacecraft: "viking-1-lander",
    },
  ],

  // https://en.wikipedia.org/wiki/Mars_Pathfinder
  "mars-pathfinder": [
    {
      date: "1996-12-04",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Delta II from Cape Canaveral: a low-cost test of landing on airbags, carrying a small rover.",
    },
    {
      date: "1997-07-04",
      kind: "LANDING",
      title: "Lands in Ares Vallis",
      description:
        "Hit the ground wrapped in airbags and bounced at least 16 times, the first bounce about 15 metres high, before rolling to a stop.",
    },
    {
      date: "1997-07-06",
      kind: "RELEASE",
      title: "Sojourner rolls onto the surface",
      description:
        "The first rover on Mars drove down a ramp. It explored the rocks within about 12 metres of the lander.",
      spacecraft: "sojourner",
    },
    {
      date: "1997-09-27",
      kind: "END",
      title: "Last transmission",
      description:
        "Built for a week to a month, the lander and rover worked for almost three months.",
    },
  ],

  // https://en.wikipedia.org/wiki/Mars_Global_Surveyor
  "mars-global-surveyor": [
    {
      date: "1996-11-07",
      kind: "LAUNCH",
      title: "Launch",
      description: "Launched on a Delta II from Cape Canaveral.",
    },
    {
      date: "1997-09-11",
      kind: "ARRIVAL",
      title: "Enters orbit around Mars",
      description:
        "Began dipping into the atmosphere to lower its orbit, but a solar panel bent under the drag and the process had to be slowed down.",
    },
    {
      date: "1999-04-01",
      kind: "OPERATIONS",
      title: "Mapping begins",
      description:
        "Began mapping Mars, including its shape with a laser altimeter. It later found gullies that appeared to have been carved by liquid water.",
    },
    {
      date: "2006-11-05",
      kind: "END",
      title: "Last contact",
      description:
        "Contact was lost after a command to move its solar panels. A flaw in a software update was later found to be to blame.",
    },
  ],

  // https://en.wikipedia.org/wiki/2001_Mars_Odyssey
  "mars-odyssey": [
    {
      date: "2001-04-07",
      kind: "LAUNCH",
      title: "Launch",
      description: "Launched on a Delta II from Cape Canaveral.",
    },
    {
      date: "2001-10-24",
      kind: "ARRIVAL",
      title: "Enters orbit around Mars",
      description:
        "Settled into orbit and spent three months dipping into the atmosphere to lower it.",
    },
    {
      date: "2002-02-19",
      kind: "OPERATIONS",
      title: "Mapping begins",
      description:
        "Began mapping Mars. Within months it had found signs of water ice within a metre of the surface. In 2010 it became the longest-serving spacecraft at Mars.",
    },
  ],

  // https://en.wikipedia.org/wiki/Mars_Express and
  // https://en.wikipedia.org/wiki/Beagle_2
  "mars-express": [
    {
      date: "2003-06-02",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Soyuz-Fregat from Baikonur: ESA's first planetary mission, carrying the British Beagle 2 lander.",
    },
    {
      date: "2003-12-19",
      kind: "RELEASE",
      title: "Beagle 2 released",
      description: "The lander was released six days before reaching Mars.",
      spacecraft: "beagle-2",
    },
    {
      date: "2003-12-25",
      kind: "ARRIVAL",
      title: "Enters orbit around Mars",
      description:
        "Mars Express entered orbit on Christmas Day, as Beagle 2 was due to land.",
    },
    {
      date: "2004-02-06",
      kind: "END",
      title: "Beagle 2 declared lost",
      description:
        "Beagle 2 was never heard from. In 2015 a NASA orbiter found it on the surface: it had landed, but not all of its solar panels had opened, blocking its antenna.",
      spacecraft: "beagle-2",
    },
  ],

  // https://en.wikipedia.org/wiki/Spirit_(rover)
  spirit: [
    {
      date: "2003-06-10",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Delta II from Cape Canaveral, the first of two twin rovers.",
    },
    {
      date: "2004-01-04",
      kind: "LANDING",
      title: "Lands in Gusev crater",
      description: "Bounced to a stop on airbags inside Gusev crater.",
    },
    {
      date: "2010-03-22",
      kind: "END",
      title: "Last contact",
      description:
        "Built for 90 sols, it drove 7.7 km over six years. Stuck in soft sand since 2009, it could not turn its solar panels to the Sun for the winter, and fell silent.",
    },
  ],

  // https://en.wikipedia.org/wiki/Opportunity_(rover)
  opportunity: [
    {
      date: "2003-07-08",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Delta II from Cape Canaveral, a month after its twin, Spirit.",
    },
    {
      date: "2004-01-25",
      kind: "LANDING",
      title: "Lands in Meridiani Planum",
      description:
        "Bounced to a stop on airbags and rolled into the small Eagle crater, beside an outcrop of layered rock.",
    },
    {
      date: "2011-08-09",
      kind: "ARRIVAL",
      title: "Reaches Endeavour crater",
      description:
        "After a three-year drive, it reached the rim of Endeavour crater, 22 km across.",
    },
    {
      date: "2018-06-10",
      kind: "END",
      title: "Last contact",
      description:
        "A planet-wide dust storm cut off its sunlight. Built for 90 sols, it had worked for more than 14 years and driven 45 km, more than a marathon.",
    },
  ],

  // https://en.wikipedia.org/wiki/Mars_Reconnaissance_Orbiter
  "mars-reconnaissance-orbiter": [
    {
      date: "2005-08-12",
      kind: "LAUNCH",
      title: "Launch",
      description: "Launched on an Atlas V from Cape Canaveral.",
    },
    {
      date: "2006-03-10",
      kind: "ARRIVAL",
      title: "Enters orbit around Mars",
      description:
        "Fired its engines for 27 minutes to be captured, then spent five months dipping into the atmosphere to lower its orbit.",
    },
    {
      date: "2006-11",
      kind: "OPERATIONS",
      title: "Science begins",
      description:
        "Began its main science mission. Its HiRISE camera can see objects about a metre across, and it later photographed Phoenix and Curiosity as they parachuted down. By 2010 it had sent home more data than all other planetary missions combined.",
    },
  ],

  // https://en.wikipedia.org/wiki/Phoenix_(spacecraft)
  phoenix: [
    {
      date: "2007-08-04",
      kind: "LAUNCH",
      title: "Launch",
      description: "Launched on a Delta II from Cape Canaveral.",
    },
    {
      date: "2008-05-25",
      kind: "LANDING",
      title: "Lands in the Martian arctic",
      description:
        "Touched down at 68° north, the first landing in Mars's polar regions. The Mars Reconnaissance Orbiter photographed it hanging from its parachute.",
    },
    {
      date: "2008-11-02",
      kind: "END",
      title: "Last contact",
      description:
        "As winter's darkness came, its power failed. By then it had dug trenches down to water ice and seen snow falling from Martian clouds.",
    },
  ],

  // https://en.wikipedia.org/wiki/Curiosity_(rover), and for Mount Sharp
  // https://sciencedaily.com/releases/2014/09/140911183005.htm
  "mars-science-laboratory": [
    {
      date: "2011-11-26",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Atlas V from Cape Canaveral, carrying the Curiosity rover.",
    },
    {
      date: "2012-08-06",
      kind: "LANDING",
      title: "Lands in Gale crater",
      description:
        "A rocket-powered sky crane lowered Curiosity on cables onto the floor of Gale crater, the first landing of its kind.",
    },
    {
      date: "2014-09-11",
      kind: "ARRIVAL",
      title: "Reaches Mount Sharp",
      description:
        "After two years exploring the crater floor, Curiosity reached the base of Mount Sharp, the mountain in the middle of Gale crater whose layers it has been climbing ever since.",
    },
  ],

  // https://en.wikipedia.org/wiki/Mars_Orbiter_Mission
  "mars-orbiter-mission": [
    {
      date: "2013-11-05",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a PSLV from Sriharikota: India's first interplanetary mission, at a cost of about US$73 million.",
    },
    {
      date: "2014-09-24",
      kind: "ARRIVAL",
      title: "Enters orbit around Mars",
      description:
        "India became the first Asian nation to reach Mars orbit, and only the second space agency to succeed on its first attempt.",
    },
    {
      date: "2022-10-03",
      kind: "END",
      title: "Mission ends",
      description:
        "Planned for six months, it lasted almost eight years, until contact was lost in April 2022 during a seven-hour eclipse it was never designed to survive.",
    },
  ],

  // https://en.wikipedia.org/wiki/Trace_Gas_Orbiter
  "exomars-trace-gas-orbiter": [
    {
      date: "2016-03-14",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Proton from Baikonur: ESA and Roscosmos's ExoMars orbiter, carrying the Schiaparelli test lander.",
    },
    {
      date: "2016-10-16",
      kind: "RELEASE",
      title: "Schiaparelli released",
      description: "The lander separated three days before reaching Mars.",
      spacecraft: "schiaparelli",
    },
    {
      date: "2016-10-19",
      kind: "ARRIVAL",
      title: "Enters orbit around Mars",
      description:
        "The orbiter was captured by Mars, then spent 11 months dipping into the atmosphere to reach its science orbit.",
      spacecraft: "trace-gas-orbiter",
    },
    {
      date: "2016-10-19",
      kind: "END",
      title: "Schiaparelli crashes",
      description:
        "A computer fault released its parachute too early, and Schiaparelli hit the ground at about 540 km/h.",
      spacecraft: "schiaparelli",
    },
    {
      date: "2018-04-21",
      kind: "OPERATIONS",
      title: "Science begins",
      description:
        "Began searching the atmosphere for methane and other trace gases. It also relays data from rovers on the surface.",
      spacecraft: "trace-gas-orbiter",
    },
  ],

  // https://en.wikipedia.org/wiki/InSight
  insight: [
    {
      date: "2018-05-05",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Atlas V from Vandenberg in California, the first interplanetary launch from the US West Coast, with two tiny MarCO satellites following it to relay its landing.",
    },
    {
      date: "2018-11-26",
      kind: "LANDING",
      title: "Lands in Elysium Planitia",
      description:
        "Landed on a flat, smooth plain chosen as a safe place to set down.",
    },
    {
      date: "2018-12-19",
      kind: "RELEASE",
      title: "Seismometer set on the ground",
      description:
        "Its robotic arm lifted the seismometer off the deck onto the ground. It went on to record hundreds of marsquakes and measure the size of Mars's core.",
    },
    {
      date: "2022-12-15",
      kind: "END",
      title: "Last contact",
      description:
        "Dust building up on its solar panels slowly starved it of power, months after it recorded the largest marsquake yet seen.",
    },
  ],

  // https://en.wikipedia.org/wiki/Emirates_Mars_Mission
  hope: [
    {
      date: "2020-07-19",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an H-IIA from Tanegashima: the first interplanetary mission by an Arab nation.",
    },
    {
      date: "2021-02-09",
      kind: "ARRIVAL",
      title: "Enters orbit around Mars",
      description:
        "Settled into a high orbit, 20,000 to 43,000 km up, from which it watches the weather across the whole planet.",
    },
    {
      date: "2023-03-10",
      kind: "FLYBY",
      title: "Deimos flyby",
      description:
        "Swung close to Mars's small outer moon Deimos and photographed it more closely and completely than any spacecraft before.",
    },
  ],

  // https://en.wikipedia.org/wiki/Tianwen-1 and
  // https://en.wikipedia.org/wiki/Zhurong_(rover)
  "tianwen-1": [
    {
      date: "2020-07-23",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Long March 5 from Wenchang, carrying an orbiter, a lander and the Zhurong rover.",
    },
    {
      date: "2021-02-10",
      kind: "ARRIVAL",
      title: "Enters orbit around Mars",
      description:
        "Spent three months in orbit studying the landing site before sending the lander down.",
    },
    {
      date: "2021-05-14",
      kind: "LANDING",
      title: "Lands in Utopia Planitia",
      description:
        "China became the first country to orbit, land and rove on its first mission to Mars.",
    },
    {
      date: "2021-05-22",
      kind: "RELEASE",
      title: "Zhurong drives onto the surface",
      description:
        "China became the second country, after the United States, to drive a rover on Mars.",
      spacecraft: "zhurong",
    },
    {
      date: "2022-05-18",
      kind: "END",
      title: "Zhurong goes into hibernation",
      description:
        "Built for 90 sols, it drove 1.9 km in a year, then hibernated for the winter. Covered in dust, it never woke up.",
      spacecraft: "zhurong",
    },
  ],

  // Asteroids and comets

  // https://en.wikipedia.org/wiki/Giotto_(spacecraft)
  giotto: [
    {
      date: "1985-07-02",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Ariane 1 from Kourou to meet Halley's Comet.",
    },
    {
      date: "1986-03-14",
      kind: "FLYBY",
      title: "Halley's Comet flyby",
      description:
        "Passed 596 km from Halley's nucleus and sent back the first close pictures of a comet's heart. Dust hits knocked it off balance and destroyed its camera.",
    },
    {
      date: "1990-07-02",
      kind: "FLYBY",
      title: "Earth flyby",
      description:
        "Woken from four years of hibernation, it became the first spacecraft to use Earth for a gravity assist, setting course for a second comet.",
    },
    {
      date: "1992-07-10",
      kind: "FLYBY",
      title: "Comet Grigg–Skjellerup flyby",
      description:
        "Passed about 200 km from a second comet, despite its broken camera.",
    },
    {
      date: "1992-07-23",
      kind: "END",
      title: "Switched off",
      description: "Giotto was switched off for good.",
    },
  ],

  // https://en.wikipedia.org/wiki/NEAR_Shoemaker
  "near-shoemaker": [
    {
      date: "1996-02-17",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Delta II from Cape Canaveral, bound for the asteroid Eros.",
    },
    {
      date: "1997-06-27",
      kind: "FLYBY",
      title: "Asteroid Mathilde flyby",
      description: "Flew past the dark asteroid Mathilde on the way.",
    },
    {
      date: "1998-01-23",
      kind: "FLYBY",
      title: "Earth flyby",
      description: "Swung past Earth to line up with Eros.",
    },
    {
      date: "1998-12-23",
      kind: "FLYBY",
      title: "Misses Eros, flies past",
      description:
        "Its first braking burn aborted and the spacecraft tumbled, so it flew past Eros instead of stopping. It went round the Sun once more and came back a year later.",
    },
    {
      date: "2000-02-14",
      kind: "ARRIVAL",
      title: "Enters orbit around Eros",
      description:
        "Became the first spacecraft to orbit an asteroid, on Valentine's Day.",
    },
    {
      date: "2001-02-12",
      kind: "LANDING",
      title: "Lands on Eros",
      description:
        "At the end of its mission it was steered down to the surface, the first soft landing on an asteroid, and to everyone's surprise it kept working.",
    },
    {
      date: "2001-02-28",
      kind: "END",
      title: "Last contact",
      description: "It sent data from the surface for two more weeks.",
    },
  ],

  // https://en.wikipedia.org/wiki/Stardust_(spacecraft)
  stardust: [
    {
      date: "1999-02-07",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Delta II from Cape Canaveral to collect dust from a comet.",
    },
    {
      date: "2001-01-15",
      kind: "FLYBY",
      title: "Earth flyby",
      description: "Swung past Earth on the way to its comet.",
    },
    {
      date: "2002-11-02",
      kind: "FLYBY",
      title: "Asteroid Annefrank flyby",
      description:
        "A rehearsal for the comet encounter, past a small asteroid.",
    },
    {
      date: "2004-01-02",
      kind: "FLYBY",
      title: "Comet Wild 2 flyby",
      description:
        "Passed 237 km from the comet and caught dust from its coma in blocks of aerogel, a feather-light foam.",
    },
    {
      date: "2006-01-15",
      kind: "SAMPLE_RETURN",
      title: "Sample capsule lands in Utah",
      description:
        "The capsule parachuted into the Utah desert with the first dust brought back from a comet. In it, scientists later found the amino acid glycine.",
    },
    {
      date: "2011-02-15",
      kind: "FLYBY",
      title: "Comet Tempel 1 flyby",
      description:
        "Revisited the comet Deep Impact had struck in 2005 and photographed the crater it made.",
    },
    {
      date: "2011-03-24",
      kind: "END",
      title: "Switched off",
      description:
        "After a last burn to use up its fuel, its transmitter was switched off.",
    },
  ],

  // https://en.wikipedia.org/wiki/Hayabusa
  hayabusa: [
    {
      date: "2003-05-09",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an M-V rocket from Uchinoura, with ion engines to reach the asteroid Itokawa.",
    },
    {
      date: "2004-05-19",
      kind: "FLYBY",
      title: "Earth flyby",
      description: "Swung past Earth for the speed to reach Itokawa.",
    },
    {
      date: "2005-09-12",
      kind: "ARRIVAL",
      title: "Arrives at asteroid Itokawa",
      description:
        "Reached the small asteroid Itokawa, though one of the wheels that kept it pointed had already failed. A second failed soon after.",
    },
    {
      date: "2005-11-19",
      kind: "LANDING",
      title: "First touchdown",
      description: "Touched down on Itokawa to try to collect a sample.",
    },
    {
      date: "2005-11-25",
      kind: "LANDING",
      title: "Second touchdown",
      description:
        "A second touchdown, after which a fuel leak and a loss of contact nearly ended the mission. It took more than a year to recover and start for home.",
    },
    {
      date: "2010-06-13",
      kind: "SAMPLE_RETURN",
      title: "Capsule lands in Australia",
      description:
        "Hayabusa released its capsule and burned up in the atmosphere. The capsule landed in South Australia with about 1,500 tiny grains: the first sample brought back from an asteroid.",
    },
  ],

  // https://en.wikipedia.org/wiki/Deep_Impact_(spacecraft)
  "deep-impact": [
    {
      date: "2005-01-12",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Delta II from Cape Canaveral, carrying an impactor to fire into a comet.",
    },
    {
      date: "2005-07-03",
      kind: "RELEASE",
      title: "Impactor released",
      description:
        "The impactor separated a day before reaching comet Tempel 1.",
      spacecraft: "deep-impact-impactor",
    },
    {
      date: "2005-07-04",
      kind: "END",
      title: "Impactor hits comet Tempel 1",
      description:
        "The impactor struck the comet at 10.3 km/s while the flyby craft watched, blasting out material from beneath the surface.",
      spacecraft: "deep-impact-impactor",
    },
    {
      date: "2007-12-31",
      kind: "FLYBY",
      title: "Earth flyby",
      description:
        "Swung past Earth at the start of an extended mission, EPOXI.",
    },
    {
      date: "2010-11-04",
      kind: "FLYBY",
      title: "Comet Hartley 2 flyby",
      description: "Passed 694 km from a second comet.",
    },
    {
      date: "2013-08-08",
      kind: "END",
      title: "Last contact",
      description:
        "Contact was lost when its clock counter overflowed, a problem much like the Y2K bug.",
    },
  ],

  // https://en.wikipedia.org/wiki/Dawn_(spacecraft)
  dawn: [
    {
      date: "2007-09-27",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Delta II from Cape Canaveral: NASA's first exploration mission driven by ion engines.",
    },
    {
      date: "2009-02-18",
      kind: "FLYBY",
      title: "Mars flyby",
      description:
        "Used Mars's gravity to bend its path towards the asteroid belt.",
    },
    {
      date: "2011-07-16",
      kind: "ARRIVAL",
      title: "Enters orbit around Vesta",
      description:
        "Spent more than a year orbiting Vesta, the second-largest body in the asteroid belt.",
    },
    {
      date: "2015-03-06",
      kind: "ARRIVAL",
      title: "Enters orbit around Ceres",
      description:
        "Having left Vesta in 2012, Dawn reached Ceres: the first spacecraft to orbit two worlds beyond Earth, and the first to orbit a dwarf planet.",
    },
    {
      date: "2018-11-01",
      kind: "END",
      title: "Runs out of fuel",
      description:
        "Its thruster fuel ran out, and it can no longer point at Earth. It will stay in orbit around Ceres for decades.",
    },
  ],

  // https://en.wikipedia.org/wiki/OSIRIS-REx
  "osiris-rex": [
    {
      date: "2016-09-08",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Atlas V from Cape Canaveral to bring back a sample of the asteroid Bennu.",
    },
    {
      date: "2017-09-22",
      kind: "FLYBY",
      title: "Earth flyby",
      description: "Swung past Earth a year after launch.",
    },
    {
      date: "2018-12-03",
      kind: "ARRIVAL",
      title: "Arrives at asteroid Bennu",
      description:
        "Arrived at Bennu, and on New Year's Eve went into orbit about 1.75 km up, the closest orbit of any spacecraft around any world.",
    },
    {
      date: "2020-10-20",
      kind: "LANDING",
      title: "Collects a sample",
      description:
        "Touched Bennu's surface for a few seconds with its sampling arm and a puff of nitrogen, gathering far more than it needed.",
    },
    {
      date: "2023-09-24",
      kind: "SAMPLE_RETURN",
      title: "Sample capsule lands in Utah",
      description:
        "The capsule parachuted into the Utah desert with 121.6 grams of Bennu. The spacecraft flew on, renamed OSIRIS-APEX.",
    },
    {
      date: "2029-04",
      kind: "ARRIVAL",
      title: "Arrives at asteroid Apophis",
      description:
        "Due to reach Apophis just after the asteroid passes extremely close to Earth in April 2029.",
      planned: true,
    },
  ],

  // https://en.wikipedia.org/wiki/Double_Asteroid_Redirection_Test
  dart: [
    {
      date: "2021-11-24",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Falcon 9 from Vandenberg in California to test whether crashing into an asteroid can change its course.",
    },
    {
      date: "2022-09-11",
      kind: "RELEASE",
      title: "LICIACube released",
      description:
        "Fifteen days before impact, DART released the Italian LICIACube to watch.",
      spacecraft: "liciacube",
    },
    {
      date: "2022-09-26",
      kind: "END",
      title: "Hits Dimorphos",
      description:
        "Struck the small moonlet Dimorphos at about 6.6 km/s while LICIACube flew past. The impact shortened its orbit around Didymos by about 32 minutes: the first test of defending Earth by moving an asteroid.",
      spacecraft: "dart",
    },
  ],

  // https://en.wikipedia.org/wiki/Lucy_(spacecraft)
  lucy: [
    {
      date: "2021-10-16",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Atlas V from Cape Canaveral on a 12-year tour of Jupiter's Trojan asteroids. One of its two solar arrays never fully latched open.",
    },
    {
      date: "2022-10-16",
      kind: "FLYBY",
      title: "Earth flyby",
      description: "Swung past Earth, 300 km up, a year after launch.",
    },
    {
      date: "2023-11-01",
      kind: "FLYBY",
      title: "Asteroid Dinkinesh flyby",
      description:
        "A test run past a small asteroid that turned up a surprise: a moon, Selam, itself made of two lobes stuck together.",
    },
    {
      date: "2024-12-13",
      kind: "FLYBY",
      title: "Second Earth flyby",
      description:
        "A second pass of Earth sent it out towards the asteroid belt and the Trojans.",
    },
    {
      date: "2025-04-20",
      kind: "FLYBY",
      title: "Asteroid Donaldjohanson flyby",
      description:
        "Passed 960 km from an asteroid named after the discoverer of the fossil Lucy, which the mission is also named after.",
    },
    {
      date: "2027-08-12",
      kind: "FLYBY",
      title: "Trojan asteroid Eurybates flyby",
      description:
        "Due to make the first visit to one of Jupiter's Trojan asteroids.",
      planned: true,
    },
    {
      date: "2033-03-02",
      kind: "FLYBY",
      title: "Patroclus–Menoetius flyby",
      description:
        "Its last planned target: a pair of Trojan asteroids orbiting each other.",
      planned: true,
    },
  ],

  // https://en.wikipedia.org/wiki/Psyche_(spacecraft)
  psyche: [
    {
      date: "2023-10-13",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Falcon Heavy from Kennedy Space Center. On the way, it tested sending data home by laser, at up to 267 megabits per second.",
    },
    {
      date: "2026-05-15",
      kind: "FLYBY",
      title: "Mars flyby",
      description:
        "Used Mars's gravity to bend its path towards the asteroid belt.",
    },
    {
      date: "2029-08",
      kind: "ARRIVAL",
      title: "Enters orbit around Psyche",
      description:
        "Due to reach Psyche, a metal-rich asteroid about 220 km across, possibly part of the core of a shattered young planet.",
      planned: true,
    },
    {
      date: "2031-11",
      kind: "END",
      title: "End of the main mission",
      description:
        "The main mission is planned to end after 26 months in orbit.",
      planned: true,
    },
  ],

  // Early space telescopes

  // https://en.wikipedia.org/wiki/Uhuru_(satellite)
  uhuru: [
    {
      date: "1970-12-12",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Scout rocket from the San Marco platform off the coast of Kenya, on the anniversary of Kenya's independence, and named Uhuru, Swahili for 'freedom'.",
    },
    {
      date: "1973-03",
      kind: "END",
      title: "Mission ends",
      description:
        "The first satellite built for X-ray astronomy had mapped 339 X-ray sources across the whole sky, including Cygnus X-1, the first strong candidate for a black hole.",
    },
  ],

  // https://en.wikipedia.org/wiki/International_Ultraviolet_Explorer
  iue: [
    {
      date: "1978-01-26",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Delta from Cape Canaveral: a joint NASA, British and European telescope.",
    },
    {
      date: "1978-04-03",
      kind: "OPERATIONS",
      title: "Observing begins",
      description:
        "From a geosynchronous orbit it stayed in touch with the ground, so astronomers could steer it live, like a telescope on Earth.",
    },
    {
      date: "1996-09-30",
      kind: "END",
      title: "Switched off",
      description:
        "Planned for three years, it worked for 18 and made more than 104,000 observations. It was switched off to save money while still working well.",
    },
  ],

  // https://en.wikipedia.org/wiki/IRAS
  iras: [
    {
      date: "1983-01-26",
      kind: "LAUNCH",
      title: "Launch",
      description: "Launched on a Delta from Vandenberg in California.",
    },
    {
      date: "1983-02-09",
      kind: "OPERATIONS",
      title: "Survey begins",
      description:
        "Began the first survey of the whole sky in infrared light, mapping 96% of it four times over.",
    },
    {
      date: "1983-11-21",
      kind: "END",
      title: "Coolant runs out",
      description:
        "Its liquid helium ran out after ten months. It had found hundreds of thousands of sources, six comets and a disc of dust around the star Vega.",
    },
  ],

  // https://en.wikipedia.org/wiki/Hipparcos
  hipparcos: [
    {
      date: "1989-08-08",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Ariane 4 from Kourou. Its own motor failed to fire, leaving it stuck in a long, looping orbit instead of a fixed one.",
    },
    {
      date: "1993-08",
      kind: "END",
      title: "Switched off",
      description:
        "Despite the wrong orbit, it measured the positions of stars for almost three and a half years. Its catalogues give precise positions for 118,000 stars and rough ones for more than a million.",
    },
  ],

  // https://en.wikipedia.org/wiki/Cosmic_Background_Explorer
  cobe: [
    {
      date: "1989-11-18",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Delta from Vandenberg, after being redesigned when the Challenger disaster grounded the Shuttle it was meant to fly on.",
    },
    {
      date: "1993-12-23",
      kind: "END",
      title: "Switched off",
      description:
        "It had shown that the afterglow of the Big Bang matches a perfect heat glow, and found faint ripples in it. Two of its scientists shared the 2006 Nobel Prize in Physics.",
    },
  ],

  // https://en.wikipedia.org/wiki/ROSAT
  rosat: [
    {
      date: "1990-06-01",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on a Delta II from Cape Canaveral: a German, American and British X-ray telescope.",
    },
    {
      date: "1999-02-12",
      kind: "END",
      title: "Switched off",
      description:
        "After a pointing failure in 1998 let sunlight damage one of its cameras, it was switched off. Its all-sky survey catalogued more than 150,000 X-ray sources.",
    },
  ],

  // https://en.wikipedia.org/wiki/Compton_Gamma_Ray_Observatory
  "compton-gamma-ray-observatory": [
    {
      date: "1991-04-05",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on the Space Shuttle Atlantis: the second of NASA's Great Observatories, after Hubble.",
    },
    {
      date: "2000-06-04",
      kind: "END",
      title: "Brought down into the Pacific",
      description:
        "After one of its three gyroscopes failed, NASA steered it into the atmosphere so its heavy debris would fall safely into the Pacific Ocean.",
    },
  ],

  // https://en.wikipedia.org/wiki/Infrared_Space_Observatory
  iso: [
    {
      date: "1995-11-17",
      kind: "LAUNCH",
      title: "Launch",
      description: "Launched on an Ariane 4 from Kourou.",
    },
    {
      date: "1996-02-04",
      kind: "OPERATIONS",
      title: "Observing begins",
      description:
        "Began routine observations, finding water vapour in places from star-forming clouds to dying stars.",
    },
    {
      date: "1998-05-16",
      kind: "END",
      title: "Switched off",
      description:
        "Its liquid helium lasted longer than planned, until April 1998. After more than 26,000 observations, it was switched off a month later.",
    },
  ],

  // https://en.wikipedia.org/wiki/Hubble_Space_Telescope
  hubble: [
    {
      date: "1990-04-24",
      kind: "LAUNCH",
      title: "Launch",
      description: "Launched aboard the Space Shuttle Discovery.",
    },
    {
      date: "1990-04-25",
      kind: "RELEASE",
      title: "Released into orbit",
      description:
        "Set free from the Shuttle. Within weeks its first pictures showed a flaw: its main mirror had been ground to slightly the wrong shape.",
    },
    {
      date: "1993-12",
      kind: "OPERATIONS",
      title: "First servicing mission",
      description:
        "Astronauts fitted corrective optics that fixed its blurred vision, the first of five visits by Shuttle crews.",
    },
    {
      date: "1997-02",
      kind: "OPERATIONS",
      title: "Second servicing mission",
      description:
        "Astronauts installed new instruments and replaced worn equipment.",
    },
    {
      date: "1999-12",
      kind: "OPERATIONS",
      title: "Third servicing mission",
      description: "Astronauts replaced its gyroscopes and its main computer.",
    },
    {
      date: "2002-03",
      kind: "OPERATIONS",
      title: "Fourth servicing mission",
      description: "Astronauts installed a new camera and new solar arrays.",
    },
    {
      date: "2009-05",
      kind: "OPERATIONS",
      title: "Last servicing mission",
      description:
        "The last Shuttle visit added new instruments and repaired others, keeping Hubble working decades after launch.",
    },
  ],

  // https://en.wikipedia.org/wiki/Chandra_X-ray_Observatory
  chandra: [
    {
      date: "1999-07-23",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched aboard the Space Shuttle Columbia, at 22.8 tonnes with its booster the heaviest payload a Shuttle ever carried, then boosted into a long orbit reaching far beyond the satellites around Earth.",
    },
    {
      date: "1999-08",
      kind: "OPERATIONS",
      title: "First light",
      description:
        "Its first images included the supernova remnant Cassiopeia A, showing detail no X-ray telescope had seen before.",
    },
  ],

  // https://en.wikipedia.org/wiki/XMM-Newton
  "xmm-newton": [
    {
      date: "1999-12-10",
      kind: "LAUNCH",
      title: "Launch",
      description:
        "Launched on an Ariane 5 from Kourou, carrying three X-ray telescopes, each made of 58 mirrors nested inside one another.",
    },
    {
      date: "2000-06-01",
      kind: "OPERATIONS",
      title: "Science operations begin",
      description:
        "Began routine observations from a long orbit that takes it more than 100,000 km from Earth.",
    },
  ],

  // https://en.wikipedia.org/wiki/Wilkinson_Microwave_Anisotropy_Probe
  wmap: [
    {
      date: "2001-06-30",
      kind: "LAUNCH",
      title: "Launch",
      description: "Launched on a Delta II from Cape Canaveral.",
    },
    {
      date: "2001-10-01",
      kind: "ARRIVAL",
      title: "Arrives at Sun–Earth L2",
      description:
        "Reached its observing post 1.5 million km beyond Earth, where it could scan the whole sky.",
    },
    {
      date: "2010-10-20",
      kind: "END",
      title: "Switched off",
      description:
        "After nine years mapping the afterglow of the Big Bang, which put the age of the universe at about 13.77 billion years, it was moved out of the way and switched off.",
    },
  ],
};
