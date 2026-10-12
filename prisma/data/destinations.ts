import type { DestinationKind } from "../../src/generated/prisma/enums";

type DestinationSeed = {
  slug: string;
  name: string;
  kind: DestinationKind;
};

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
] as const satisfies readonly DestinationSeed[];

export type DestinationSlug = (typeof destinations)[number]["slug"];
