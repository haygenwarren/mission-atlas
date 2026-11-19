import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";
import Wordmark from "@/components/wordmark";

export default function Navbar() {
  return (
    // Above the page, so the home page's map can run underneath it.
    <header className="relative z-10 border-b border-border bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
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
            priority
          />
          <span className="hidden sm:block">
            <Wordmark priority />
          </span>
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium text-muted sm:gap-6">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <Link href="/map" className="transition-colors hover:text-foreground">
            Map
          </Link>
          <Link
            href="/missions"
            className="transition-colors hover:text-foreground"
          >
            Archive
          </Link>
          <Link href="/data" className="transition-colors hover:text-foreground">
            Data
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
