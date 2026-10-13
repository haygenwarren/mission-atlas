import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24 text-center">
      <p className="label-caps text-muted">404</p>
      <h1 className="font-display mt-3 text-4xl">Page not found</h1>
      <p className="mt-4 text-muted">
        There is no page at this address. The link may be wrong, or the
        mission may have been renamed.
      </p>
      <Link
        href="/missions"
        className="mt-8 inline-block rounded-lg bg-button px-5 py-2 font-medium text-button-text transition-opacity hover:opacity-90"
      >
        Browse the archive
      </Link>
    </main>
  );
}
