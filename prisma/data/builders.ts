// Codes are GCAT organisation codes; names are how the site displays them.
export const builders = [
  { code: "GSFC", name: "NASA Goddard Space Flight Center" },
  { code: "JPL", name: "Jet Propulsion Laboratory" },
  { code: "LMSC", name: "Lockheed Missiles and Space Company" },
  { code: "NGAS", name: "Northrop Grumman" },
  { code: "AESPC", name: "Aérospatiale (Cannes)" },
  { code: "ASTT", name: "Astrium" },
  { code: "BALL", name: "Ball Aerospace" },
  { code: "CAST", name: "China Academy of Space Technology" },
  { code: "DLR", name: "German Aerospace Center (DLR)" },
  { code: "ISAC", name: "ISRO" },
  { code: "LMA", name: "Lockheed Martin" },
  { code: "NECT", name: "NEC" },
  { code: "NPOL", name: "Lavochkin" },
  { code: "ADST", name: "Airbus Defence and Space" },
  { code: "APL", name: "Johns Hopkins Applied Physics Laboratory" },
  { code: "BOKT", name: "Boeing" },
  { code: "HAC", name: "Hughes Aircraft" },
  { code: "IAI", name: "Israel Aerospace Industries" },
  { code: "MELCO", name: "Mitsubishi Electric" },
  { code: "MMD", name: "Martin Marietta" },
  { code: "OKB1", name: "OKB-1 (Korolev)" },
  { code: "SSC", name: "Swedish Space Corporation" },
  { code: "SAABSA", name: "Saab Ericsson Space" },
  { code: "SAST", name: "Shanghai Academy of Spaceflight Technology" },
  { code: "SPAIL", name: "SpaceIL" },
  { code: "TRW", name: "TRW" },
] as const;

export type BuilderCode = (typeof builders)[number]["code"];

// GCAT gives one company several codes, by site or by era. These fold them
// into the single builder the site shows.
export const builderAliases: Record<string, BuilderCode> = {
  ADSUK: "ADST",
  ASTDF: "ASTT",
  BABTS: "NPOL",
  EADSB: "ASTT",
  HSES: "HAC",
  ISRO: "ISAC",
  LMSSD: "LMA",
  NECTF: "NECT",
  NECTKA: "NECT",
};
