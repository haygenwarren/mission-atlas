import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { disciplineLabels, missionLinks, statusLabels } from "@/lib/missions";
import { prisma } from "@/lib/prisma";

// The picture shown when a mission page is shared: the mission's picture
// with its name, status, agencies, launch year and destinations at its foot,
// laid out like the banner on its page. Built once per mission at deploy,
// since the missions only change then.

const size = { width: 1200, height: 630 };

// The site's dark palette (src/app/globals.css).
const colours = {
  background: "#0f1126",
  foreground: "#efe8d6",
  accent: "#c4bcf1",
  ACTIVE: "#4cc38a",
  COMPLETED: "#a6a8ba",
  FAILED: "#f0706a",
};

const file = (...path: string[]) => readFile(join(process.cwd(), ...path));

const dataUrl = (type: string, data: Buffer) =>
  `data:${type};base64,${data.toString("base64")}`;

// Fonts and logos are the same for every mission, so they load once.
const shared = Promise.all([
  file("assets/fonts/Archivo-SemiExpanded-SemiBold.ttf"),
  file("assets/fonts/Archivo-Regular.ttf"),
  file("assets/fonts/IBMPlexMono-Medium.ttf"),
  file("public/brand/mission-atlas-mark-small.svg"),
  file("public/brand/mission-atlas-wordmark-on-dark.svg"),
  file("public/brand/mission-atlas-emblem.svg"),
]);

const getMission = (slug: string) =>
  prisma.mission.findUnique({
    where: { slug },
    select: {
      name: true,
      status: true,
      discipline: true,
      launchDate: true,
      imageUrl: true,
      ...missionLinks,
    },
  });

// Up to three places in words; more than that are counted.
function places(names: string[]) {
  if (names.length > 3) {
    return `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
  }

  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
    : (names[0] ?? "");
}

// The mission's picture, cropped to the preview's shape the way the banner
// crops it: filling the frame, from the middle.
async function picture(imageUrl: string) {
  const cropped = await sharp(await file("public", imageUrl))
    .resize(size.width, size.height, { fit: "cover", position: "centre" })
    .jpeg({ quality: 82 })
    .toBuffer();

  return dataUrl("image/jpeg", cropped);
}

// One preview per mission, made at build.
export async function generateStaticParams() {
  const missions = await prisma.mission.findMany({ select: { slug: true } });

  return missions.map(({ slug }) => ({ slug }));
}

// While collecting pages at build, Next also calls this without a slug, so
// the mission is looked up only when there is one.
export async function generateImageMetadata({
  params,
}: {
  params: { slug?: string };
}) {
  const { slug } = await params;
  const mission = slug ? await getMission(slug) : null;

  return [
    {
      id: "card",
      size,
      contentType: "image/png",
      alt: mission
        ? `${mission.name} on Mission Atlas: its picture, status, agencies, launch year and destinations`
        : "Mission Atlas",
    },
  ];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [mission, [display, text, mono, mark, wordmark, emblem]] =
    await Promise.all([getMission(slug), shared]);
  const fonts = [
    { name: "Archivo Display", data: display, weight: 600 as const },
    { name: "Archivo", data: text, weight: 400 as const },
    { name: "IBM Plex Mono", data: mono, weight: 500 as const },
  ];
  const caps = {
    fontFamily: "IBM Plex Mono",
    fontSize: 17,
    letterSpacing: 3,
    textTransform: "uppercase" as const,
    color: colours.accent,
  };

  const brand = (
    <div
      style={{
        position: "absolute",
        top: 44,
        left: 56,
        right: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img src={dataUrl("image/svg+xml", mark)} width={56} height={56} />
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img src={dataUrl("image/svg+xml", wordmark)} width={273} height={20} />
      </div>
      <div style={caps}>mission-atlas.net</div>
    </div>
  );

  if (!mission) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: colours.background,
          }}
        >
          {brand}
        </div>
      ),
      { ...size, fonts },
    );
  }

  const facts = [
    mission.agencies.map(({ abbreviation }) => abbreviation).join(" · "),
    `Launched ${mission.launchDate.getUTCFullYear()}`,
    places(mission.destinations.map(({ name }) => name)),
  ].filter(Boolean);
  const factsLength = facts.join("").length;
  const photo = mission.imageUrl ? await picture(mission.imageUrl) : null;
  // Long names drop a size so they fit on one or two lines.
  const nameSize =
    mission.name.length <= 18 ? 76 : mission.name.length <= 26 ? 62 : 52;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: colours.background,
          color: colours.foreground,
          fontFamily: "Archivo",
        }}
      >
        {photo ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img
            src={photo}
            width={size.width}
            height={size.height}
            style={{ position: "absolute", top: 0, left: 0 }}
          />
        ) : (
          // Without a picture, the emblem stands in, as on the archive's tiles.
          // eslint-disable-next-line jsx-a11y/alt-text
          <img
            src={dataUrl("image/svg+xml", emblem)}
            width={440}
            height={440}
            style={{ position: "absolute", top: 60, right: 80, opacity: 0.55 }}
          />
        )}

        {/* Darkens the top behind the logo and the foot behind the words. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size.width,
            height: 240,
            backgroundImage:
              "linear-gradient(180deg, rgba(15,17,38,0.94), rgba(15,17,38,0.82) 45%, rgba(15,17,38,0))",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: size.width,
            height: 370,
            backgroundImage:
              "linear-gradient(180deg, rgba(15,17,38,0), rgba(15,17,38,0.92) 65%, rgba(15,17,38,1))",
          }}
        />

        {brand}

        <div
          style={{
            position: "absolute",
            left: 56,
            right: 56,
            bottom: 48,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={caps}>{disciplineLabels[mission.discipline]}</div>
          <div
            style={{
              marginTop: 10,
              fontFamily: "Archivo Display",
              fontSize: nameSize,
              lineHeight: 1.05,
              letterSpacing: 0.5,
            }}
          >
            {mission.name}
          </div>
          <div
            style={{
              marginTop: 18,
              display: "flex",
              alignItems: "center",
              gap: 22,
              fontSize: factsLength > 56 ? 22 : 26,
            }}
          >
            <div
              style={{
                ...caps,
                fontSize: 16,
                color: colours.background,
                background: colours[mission.status],
                borderRadius: 999,
                padding: "6px 16px",
              }}
            >
              {statusLabels[mission.status]}
            </div>
            {facts.map((fact, i) => (
              <div
                key={fact}
                style={{ display: "flex", alignItems: "center", gap: 22 }}
              >
                {i > 0 && <div style={{ color: colours.accent }}>·</div>}
                <div>{fact}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
