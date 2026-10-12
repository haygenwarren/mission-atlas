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

export const metadata: Metadata = {
  title: "Mission Atlas",
  description: "A full-stack mission tracking platform for planetary science and astrophysics space missions.",
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
        <footer className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted">
          Launch and spacecraft data from{" "}
          <a
            href="https://planet4589.org/space/gcat"
            className="text-accent underline"
          >
            GCAT
          </a>{" "}
          (J. McDowell, planet4589.org/space/gcat), used under CC BY 4.0.
        </footer>
      </body>
    </html>
  );
}
