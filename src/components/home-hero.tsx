"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { easeInOut } from "@/components/map/camera";
import MapPreview from "@/components/map/map-preview";
import type { MapCraft } from "@/lib/map-scene";

type Props = {
  craft: MapCraft[];
  names: Record<string, string>;
  missionCount: number;
};

// How long the glide from the hero to the map section takes, in
// milliseconds.
const GLIDE_MS = 1100;

// The top of the home page: a map that stays on screen while the page scrolls
// one screen's height. It starts as the hero, a quarter of the map behind the
// search, and moves to the middle as the visitor scrolls (or clicks the map),
// becoming the map section. Then the page scrolls on as usual.
//
// The scroll position drives everything through `--p` on the pinned frame,
// from 0 in the hero to 1 in the map section, so nothing re-renders as the
// page scrolls.
export default function HomeHero({ craft, names, missionCount }: Props) {
  const trackRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const glide = useRef({ frame: 0, stop: () => {} });

  // Where the map section is: the end of the track, where the frame is
  // about to scroll away.
  function mapSectionTop() {
    const track = trackRef.current!;
    const frame = frameRef.current!;

    return (
      track.getBoundingClientRect().top +
      window.scrollY +
      track.offsetHeight -
      frame.offsetHeight
    );
  }

  useEffect(() => {
    const frame = frameRef.current!;
    const track = trackRef.current!;

    function update() {
      const start = track.getBoundingClientRect().top + window.scrollY;
      const distance = track.offsetHeight - frame.offsetHeight;
      const p = Math.min(1, Math.max(0, (window.scrollY - start) / distance));

      progress.current = p;
      frame.style.setProperty("--p", String(p));
      frame.dataset.stage = p < 0.5 ? "hero" : "map";
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    const current = glide.current;

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      current.stop();
    };
  }, []);

  // Glides down to the map section, easing in and out, unless the visitor
  // takes over by scrolling, touching or pressing a key. Visitors who ask for
  // less motion go straight there.
  function explore() {
    const to = mapSectionTop();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, to);
      return;
    }

    const g = glide.current;
    const from = window.scrollY;
    const start = performance.now();
    const interrupts = ["wheel", "touchstart", "keydown"];

    g.stop();

    function stop() {
      cancelAnimationFrame(g.frame);
      interrupts.forEach((name) => window.removeEventListener(name, stop));
    }

    function step(now: number) {
      const k = Math.min(1, (now - start) / GLIDE_MS);

      window.scrollTo(0, from + (to - from) * easeInOut(k));

      if (k < 1) g.frame = requestAnimationFrame(step);
      else stop();
    }

    g.stop = stop;
    interrupts.forEach((name) =>
      window.addEventListener(name, stop, { passive: true }),
    );
    g.frame = requestAnimationFrame(step);
  }

  return (
    // Two screens tall, starting under the site's header so the hero fills
    // the whole first screen.
    <section ref={trackRef} className="relative -mt-[73px] h-[200svh]">
      <div
        ref={frameRef}
        data-stage="hero"
        style={{ "--p": 0 } as React.CSSProperties}
        // --edge lines text up with the page's content column (max-w-5xl,
        // px-6) at any width.
        className="group sticky top-0 h-svh overflow-hidden [--edge:max(1.5rem,calc((100vw-64rem)/2+1.5rem))]"
      >
        <MapPreview
          craft={craft}
          names={names}
          progress={progress}
          heroOverlays={[searchRef]}
          mapOverlays={[titleRef, buttonRef]}
          onExplore={explore}
          captionClassName="bottom-24 left-(--edge) sm:bottom-8"
        />

        {/* The map fades into the page below as it scrolls away. */}
        <div
          style={{ opacity: "var(--p)" }}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-transparent to-background"
        />

        {/* The hero: the search, over the right of the map. */}
        <div
          style={{
            opacity: "calc(1 - var(--p) * 2.5)",
            transform: "translateY(calc(var(--p) * -3rem))",
          }}
          className="pointer-events-none absolute inset-x-0 bottom-0 top-[73px] flex items-start justify-end pl-6 pr-(--edge) pt-8 sm:items-center sm:pt-0"
        >
          <div
            ref={searchRef}
            className="pointer-events-auto w-full max-w-md group-data-[stage=map]:pointer-events-none sm:w-[26rem]"
          >
            <h1 className="font-display mb-4 text-4xl sm:text-5xl">
              Explore how we explore.
            </h1>

            <p className="text-lg text-foreground/80">
              Where the spacecraft exploring the solar system, and the
              telescopes looking beyond it, are right now, and the story of
              each: {missionCount} missions from space agencies around the
              world.
            </p>

            <button
              type="button"
              onClick={explore}
              className="mt-6 rounded-lg bg-button px-5 py-2 font-medium text-button-text transition-opacity hover:opacity-90"
            >
              See where they are now ↓
            </button>

            <form action="/missions" method="GET" className="mt-8 flex gap-3">
              <input
                type="search"
                name="q"
                placeholder="Search missions"
                aria-label="Search the archive"
                className="field w-full bg-background/80 backdrop-blur"
              />
              <button
                type="submit"
                className="rounded-lg border border-border-strong bg-background/80 px-4 py-2 font-medium backdrop-blur transition-colors hover:border-accent"
              >
                Search
              </button>
            </form>

            <Link
              href="/missions"
              className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            >
              Or browse all {missionCount} missions
            </Link>
          </div>
        </div>

        {/* The map section: what the map shows, top left, and the way to
            the full map, bottom right. */}
        <div
          ref={titleRef}
          style={{
            opacity: "calc((var(--p) - 0.6) * 2.5)",
            transform: "translateY(calc((1 - var(--p)) * 2rem))",
          }}
          className="pointer-events-none absolute left-(--edge) top-6 mr-6 max-w-sm rounded-xl bg-background/80 p-5 backdrop-blur group-data-[stage=map]:pointer-events-auto sm:-ml-5"
        >
          <h2 className="font-display text-2xl sm:text-3xl">
            Where every mission is now, and where it has been.
          </h2>
          <p className="mt-3 text-foreground/80">
            Hover over a spacecraft to trace its path. Click anything to open
            it on the live map.
          </p>
        </div>

        <Link
          ref={buttonRef}
          href="/map"
          style={{
            opacity: "calc((var(--p) - 0.6) * 2.5)",
            transform: "translateY(calc((1 - var(--p)) * 2rem))",
          }}
          className="pointer-events-none absolute bottom-8 left-(--edge) right-(--edge) rounded-lg bg-button px-5 py-3 text-center font-medium text-button-text group-data-[stage=map]:pointer-events-auto sm:left-auto"
        >
          Explore the full live map →
        </Link>
      </div>
    </section>
  );
}
