import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

// Absolute base for link-preview image URLs. Vercel sets this variable to
// the production domain; local builds fall back to localhost.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Mission Atlas", template: "%s | Mission Atlas" },
  description:
    "An archive of planetary science and astrophysics missions, with the spacecraft, dates and destinations of each.",
  manifest: "/site.webmanifest",
  // Keeps the site out of search results until v1 launch; remove then.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0F1126",
};

// Runs before the page paints, so a visitor who chose the light theme never
// sees a flash of the dark one.
const applySavedTheme = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${archivo.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: applySavedTheme }} />
      </head>
      <body>
        <Navbar />
        {children}
        <footer className="mx-auto max-w-5xl space-y-1 px-6 py-8 text-sm text-muted">
          <p>
            Launch and spacecraft data from{" "}
            <a
              href="https://planet4589.org/space/gcat"
              className="text-accent underline"
            >
              GCAT
            </a>{" "}
            (J. McDowell, planet4589.org/space/gcat), used under CC BY 4.0.
          </p>
          <p>
            Spacecraft pictures from{" "}
            <a
              href="https://commons.wikimedia.org"
              className="text-accent underline"
            >
              Wikimedia Commons
            </a>
            , credited on each mission&apos;s page.
          </p>
        </footer>
      </body>
    </html>
  );
}
