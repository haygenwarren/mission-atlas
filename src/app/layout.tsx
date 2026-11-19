import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/navbar";
import Wordmark from "@/components/wordmark";
import { AUTHOR, REPOSITORY, siteUrl } from "@/lib/site";

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

export const metadata: Metadata = {
  // The absolute base for link-preview image URLs.
  metadataBase: new URL(siteUrl),
  title: { default: "Mission Atlas", template: "%s | Mission Atlas" },
  description:
    "An archive of planetary science and astrophysics missions, with the spacecraft, dates and destinations of each.",
  authors: [{ name: AUTHOR.name, url: AUTHOR.site }],
  manifest: "/site.webmanifest",
  // X shows the link-preview picture large rather than as a thumbnail.
  twitter: { card: "summary_large_image" },
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
        {/* The logo on one side, the data credits on the other; stacked on
            phones. */}
        <footer className="border-t border-border bg-surface/50">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 text-sm text-muted md:flex-row md:items-end md:justify-between md:gap-12">
            <div className="shrink-0 space-y-3">
              <Link
                href="/"
                aria-label="Mission Atlas home"
                className="flex items-center gap-3"
              >
                <Image
                  src="/brand/mission-atlas-mark-small.svg"
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                />
                <Wordmark />
              </Link>
              <p>
                © 2026 {AUTHOR.name} ·{" "}
                <a href={REPOSITORY} className="text-accent underline">
                  Code on GitHub
                </a>
              </p>
            </div>

            <div className="max-w-xl space-y-1 md:text-right">
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
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
