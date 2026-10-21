import snapshot from "./images.json";

// A mission's picture and where it came from, keyed by mission slug.
// images.json is written by `npm run import:images`; don't edit it by hand.
export type ImageRecord = {
  // The file's name on Wikimedia Commons, matching the mission's `image`.
  file: string;
  // Where the site serves it, under public/.
  url: string;
  width: number;
  height: number;
  author: string;
  license: string;
  // Public domain files have no licence page.
  licenseUrl: string | null;
  // The file's page on Commons.
  source: string;
};

export const images: Record<string, ImageRecord> = snapshot;
