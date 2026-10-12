export const agencies = [
  {
    abbreviation: "NASA",
    name: "National Aeronautics and Space Administration",
    country: "United States",
  },
  {
    abbreviation: "ESA",
    name: "European Space Agency",
    country: null,
  },
  {
    abbreviation: "CSA",
    name: "Canadian Space Agency",
    country: "Canada",
  },
] as const;

export type AgencyAbbreviation = (typeof agencies)[number]["abbreviation"];
