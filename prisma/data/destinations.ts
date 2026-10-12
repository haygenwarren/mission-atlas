import type { DestinationKind } from "../../src/generated/prisma/enums";

type DestinationSeed = {
  slug: string;
  name: string;
  kind: DestinationKind;
};

// A mission lists the places it was sent to study or returned real science
// from, plus any body one of its craft landed on. Passes made only for a
// gravity assist are left out.
export const destinations = [
  { slug: "low-earth-orbit", name: "Low Earth orbit", kind: "ORBIT" },
  { slug: "sun-earth-l2", name: "Sun–Earth L2", kind: "ORBIT" },
  { slug: "jupiter", name: "Jupiter", kind: "PLANET" },
  { slug: "saturn", name: "Saturn", kind: "PLANET" },
  { slug: "uranus", name: "Uranus", kind: "PLANET" },
  { slug: "neptune", name: "Neptune", kind: "PLANET" },
  {
    slug: "interstellar-space",
    name: "Interstellar space",
    kind: "INTERSTELLAR_SPACE",
  },
  { slug: "heliocentric-orbit", name: "Heliocentric orbit", kind: "ORBIT" },
  { slug: "venus", name: "Venus", kind: "PLANET" },
  { slug: "moon", name: "Moon", kind: "MOON" },
  { slug: "mars", name: "Mars", kind: "PLANET" },
  { slug: "titan", name: "Titan", kind: "MOON" },
  {
    slug: "67p-churyumov-gerasimenko",
    name: "67P/Churyumov–Gerasimenko",
    kind: "COMET",
  },
  { slug: "steins", name: "Šteins", kind: "ASTEROID" },
  { slug: "lutetia", name: "Lutetia", kind: "ASTEROID" },
  { slug: "ryugu", name: "Ryugu", kind: "ASTEROID" },
  { slug: "mercury", name: "Mercury", kind: "PLANET" },
  { slug: "halley", name: "Halley's Comet", kind: "COMET" },
  { slug: "gaspra", name: "Gaspra", kind: "ASTEROID" },
  { slug: "ida", name: "Ida", kind: "ASTEROID" },
  { slug: "pluto", name: "Pluto", kind: "DWARF_PLANET" },
  { slug: "arrokoth", name: "Arrokoth", kind: "ASTEROID" },
  { slug: "ganymede", name: "Ganymede", kind: "MOON" },
  { slug: "europa", name: "Europa", kind: "MOON" },
] as const satisfies readonly DestinationSeed[];

export type DestinationSlug = (typeof destinations)[number]["slug"];
