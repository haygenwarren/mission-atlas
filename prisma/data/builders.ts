// Codes are GCAT organisation codes; names are how the site displays them.
export const builders = [
  { code: "GSFC", name: "NASA Goddard Space Flight Center" },
  { code: "JPL", name: "Jet Propulsion Laboratory" },
  { code: "LMSC", name: "Lockheed Missiles and Space Company" },
  { code: "NGAS", name: "Northrop Grumman" },
] as const;

export type BuilderCode = (typeof builders)[number]["code"];
