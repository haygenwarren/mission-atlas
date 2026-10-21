"use client";

import Image from "next/image";
import { useRef } from "react";

type Props = {
  src: string;
  alt: string;
  // The picture's own size, so the full view keeps its shape.
  width: number | null;
  height: number | null;
  // Shown under the full view: who made the picture, and its licence.
  credit: React.ReactNode;
};

// The mission page banner's picture, cropped to fill the banner. Clicking it
// opens the whole picture over the page. Escape, the close button or a click
// outside the picture closes it.
export default function PictureViewer({
  src,
  alt,
  width,
  height,
  credit,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`View the whole picture: ${alt}`}
        className="group absolute inset-0 cursor-zoom-in"
      >
        <Image
          src={src}
          alt=""
          fill
          sizes="(min-width: 1024px) 976px, 100vw"
          preload
          className="object-cover"
        />
        <span
          aria-hidden
          className="absolute right-3 top-3 rounded-full bg-picture/70 p-2 text-picture-text opacity-80 backdrop-blur transition-opacity group-hover:opacity-100"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </span>
      </button>

      {/* Fills the screen, so a click anywhere but the picture and its
          caption lands on the dialog itself and closes it. */}
      <dialog
        ref={dialogRef}
        aria-label={alt}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="h-dvh max-h-none w-dvw max-w-none flex-col items-center justify-center gap-3 bg-transparent p-4 backdrop:bg-picture/90 backdrop:backdrop-blur-sm open:flex"
      >
        <Image
          src={src}
          alt={alt}
          width={width ?? 1200}
          height={height ?? 800}
          sizes="92vw"
          className="h-auto max-h-[80dvh] w-auto max-w-full rounded-lg"
        />
        <div className="flex max-w-full items-center gap-4 rounded-lg bg-surface px-3 py-2">
          {credit}
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="shrink-0 text-sm font-medium text-accent hover:underline"
          >
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
