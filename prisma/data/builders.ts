// Codes are GCAT organisation codes; names are how the site displays them.
export const builders = [
  { code: "GSFC", name: "NASA Goddard Space Flight Center" },
  { code: "JPL", name: "Jet Propulsion Laboratory" },
  { code: "LMSC", name: "Lockheed Missiles and Space Company" },
  { code: "NGAS", name: "Northrop Grumman" },
  { code: "AESPC", name: "Aérospatiale (Cannes)" },
  { code: "ASTDF", name: "Astrium (Friedrichshafen)" },
  { code: "ASTT", name: "Astrium (Toulouse)" },
  { code: "BALL", name: "Ball Aerospace" },
  { code: "CAST", name: "China Academy of Space Technology" },
  { code: "DLR", name: "German Aerospace Center (DLR)" },
  { code: "ISAC", name: "U R Rao Satellite Centre (ISRO)" },
  { code: "LMA", name: "Lockheed Martin Astronautics" },
  { code: "NECT", name: "NEC" },
  { code: "NPOL", name: "Lavochkin" },
] as const;

export type BuilderCode = (typeof builders)[number]["code"];
