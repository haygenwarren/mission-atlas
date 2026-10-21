import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { ImageRecord } from "../prisma/data/images";
import { missions } from "../prisma/data/missions";

// Downloads each mission's `image` from Wikimedia Commons into
// public/images/missions, and records its author, licence and source in
// prisma/data/images.json for the credit line. Run it after adding or
// changing a mission's image. Pictures already downloaded are kept unless the
// file changed; pass --all to download every one again.
const API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT =
  "MissionAtlas/1.0 (https://github.com/haygenwarren/mission-atlas)";
const PUBLIC = path.join(process.cwd(), "public");
const FOLDER = path.join(PUBLIC, "images/missions");
const OUTPUT = path.join(process.cwd(), "prisma/data/images.json");

// Commons makes thumbnails in fixed steps, and 1280 px is the step just
// above the size kept here.
const FETCH_WIDTH = 1280;
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 900;

// Licences that let anyone reuse a picture, at most asking for credit and
// for changes to be shared alike.
const FREE_LICENSE =
  /^(Public domain|CC0|CC BY(-SA)? \d\.\d( [a-z]{2,3})?|GODL-India|No restrictions)$/i;

type ImageInfo = {
  url: string;
  thumburl?: string;
  descriptionurl: string;
  extmetadata?: Record<string, { value: string } | undefined>;
};

type Page = {
  title: string;
  missing?: boolean;
  imageinfo?: ImageInfo[];
};

async function get(url: string) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (response.ok) return response;

    // Commons asks clients to slow down with 429; wait and try again.
    if (response.status === 429 && attempt < 5) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
      continue;
    }

    throw new Error(`${url}: HTTP ${response.status}`);
  }
}

// Commons metadata is HTML, such as an author linked to their user page.
function plainText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .trim();
}

// Who to credit, from the attribution the author asked for if they gave one.
// The licence is shown beside the credit, so it is cut from here.
function author(meta: (key: string) => string) {
  return (meta("Attribution") || meta("Artist") || meta("Credit"))
    .replace(/^Credits?: /i, "")
    .replace(/,? \(?\s*(CC[ -]BY|GODL)[^,()]*\)?$/i, "")
    .replace(/ \(public domain\)$/i, "")
    .replace(
      /National Aeronautics and Space Administration( \(NASA\))?/g,
      "NASA",
    );
}

// Looks up files 50 at a time, the most the API takes in one request.
async function lookUp(files: string[]) {
  const found = new Map<string, ImageInfo>();

  for (let i = 0; i < files.length; i += 50) {
    const batch = files.slice(i, i + 50);
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      titles: batch.map((file) => `File:${file}`).join("|"),
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiurlwidth: String(FETCH_WIDTH),
    });
    const data = await (await get(`${API}?${params}`)).json();
    const pages = new Map<string, Page>(
      data.query.pages.map((page: Page) => [page.title, page]),
    );
    const normalized = new Map<string, string>(
      (data.query.normalized ?? []).map((n: { from: string; to: string }) => [
        n.from,
        n.to,
      ]),
    );

    for (const file of batch) {
      const title = normalized.get(`File:${file}`) ?? `File:${file}`;
      const info = pages.get(title)?.imageinfo?.[0];

      if (!info) {
        throw new Error(`${file}: not found on Wikimedia Commons`);
      }

      found.set(file, info);
    }
  }

  return found;
}

async function exists(file: string) {
  return access(file).then(
    () => true,
    () => false,
  );
}

async function main() {
  const all = process.argv.includes("--all");
  const previous: Record<string, ImageRecord> = JSON.parse(
    await readFile(OUTPUT, "utf8").catch(() => "{}"),
  );
  const wanted = missions.filter((mission) => mission.image);
  const infos = await lookUp(wanted.map((mission) => mission.image!));
  const records: Record<string, ImageRecord> = {};
  let downloaded = 0;

  await mkdir(FOLDER, { recursive: true });

  for (const mission of wanted) {
    const file = mission.image!;
    const info = infos.get(file)!;
    const meta = (key: string) =>
      plainText(info.extmetadata?.[key]?.value ?? "");
    const license = meta("LicenseShortName");

    if (!FREE_LICENSE.test(license) || meta("NonFree") === "true") {
      throw new Error(
        `${mission.slug}: ${file} is "${license}", not free to reuse`,
      );
    }

    const credit = mission.imageCredit ?? author(meta);

    // Creative Commons BY and GODL licences require a credit.
    if (!credit && /^(CC BY|GODL)/.test(license)) {
      throw new Error(
        `${mission.slug}: ${file} has no author; set imageCredit`,
      );
    }

    const kept = previous[mission.slug];
    let url = kept?.url;

    if (
      all ||
      kept?.file !== file ||
      !url ||
      !(await exists(path.join(PUBLIC, url)))
    ) {
      const original = await get(info.thumburl ?? info.url);
      const picture = await sharp(Buffer.from(await original.arrayBuffer()))
        .rotate()
        .resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();
      // Named after its contents, so a changed picture gets a new address
      // and nothing keeps serving the old one from a cache.
      const hash = createHash("sha256")
        .update(picture)
        .digest("hex")
        .slice(0, 8);

      url = `/images/missions/${mission.slug}.${hash}.webp`;
      await writeFile(path.join(PUBLIC, url), picture);
      downloaded++;
    }

    records[mission.slug] = {
      file,
      url: url!,
      author: credit || "Unknown",
      license,
      licenseUrl: info.extmetadata?.LicenseUrl?.value ?? null,
      source: info.descriptionurl,
    };
  }

  // Remove pictures no mission uses any more.
  const used = new Set(
    Object.values(records).map(({ url }) => path.basename(url)),
  );

  for (const name of await readdir(FOLDER)) {
    if (!used.has(name)) await rm(path.join(FOLDER, name));
  }

  await writeFile(OUTPUT, JSON.stringify(records, null, 2) + "\n");
  console.log(
    `${wanted.length} images, ${downloaded} downloaded, ${missions.length - wanted.length} missions without one`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
