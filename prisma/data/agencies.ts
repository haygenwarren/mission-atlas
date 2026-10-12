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
  {
    abbreviation: "ASI",
    name: "Italian Space Agency",
    country: "Italy",
  },
  {
    abbreviation: "JAXA",
    name: "Japan Aerospace Exploration Agency",
    country: "Japan",
  },
  {
    abbreviation: "DLR",
    name: "German Aerospace Center",
    country: "Germany",
  },
  {
    abbreviation: "CNES",
    name: "Centre National d'Études Spatiales",
    country: "France",
  },
  {
    abbreviation: "ISRO",
    name: "Indian Space Research Organisation",
    country: "India",
  },
  {
    abbreviation: "CNSA",
    name: "China National Space Administration",
    country: "China",
  },
  {
    abbreviation: "USSR",
    name: "Soviet space programme",
    country: "Soviet Union",
  },
  {
    abbreviation: "SpaceIL",
    name: "SpaceIL",
    country: "Israel",
  },
  {
    abbreviation: "Roscosmos",
    name: "Roscosmos",
    country: "Russia",
  },
  {
    abbreviation: "MBRSC",
    name: "Mohammed bin Rashid Space Centre",
    country: "United Arab Emirates",
  },
  {
    abbreviation: "SERC",
    name: "Science and Engineering Research Council",
    country: "United Kingdom",
  },
  {
    abbreviation: "NIVR",
    name: "Netherlands Agency for Aerospace Programmes",
    country: "Netherlands",
  },
  {
    abbreviation: "CAS",
    name: "Chinese Academy of Sciences",
    country: "China",
  },
] as const;

export type AgencyAbbreviation = (typeof agencies)[number]["abbreviation"];
