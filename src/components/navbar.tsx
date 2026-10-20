import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";

export default function Navbar() {
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/mission-atlas-mark-small.svg"
            alt=""
            width={40}
            height={40}
            unoptimized
            priority
          />
          {/* The kit has one wordmark per background; CSS shows the one that
              suits the current theme. */}
          <span className="hidden sm:block">
            <Image
              src="/brand/mission-atlas-wordmark-on-dark.svg"
              alt="Mission Atlas"
              width={191}
              height={14}
              unoptimized
              priority
              className="light:hidden"
            />
            <Image
              src="/brand/mission-atlas-wordmark-on-light.svg"
              alt="Mission Atlas"
              width={191}
              height={14}
              unoptimized
              priority
              className="hidden light:block"
            />
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
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
