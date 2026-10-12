import snapshot from "./catalogue.json";

// One spacecraft as recorded in GCAT (J. McDowell, planet4589.org/space/gcat),
// keyed by its catalogue id. catalogue.json is written by
// `npm run import:catalogue`; don't edit it by hand.
export type CatalogueObject = {
  name: string;
  designator: string | null;
  launchDate: string | null;
  launchMassKg: number | null;
  dryMassKg: number | null;
  lengthM: number | null;
  diameterM: number | null;
  spanM: number | null;
  builders: string[];
};

export const catalogue: Record<string, CatalogueObject> = snapshot.objects;
