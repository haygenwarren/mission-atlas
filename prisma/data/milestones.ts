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
};
