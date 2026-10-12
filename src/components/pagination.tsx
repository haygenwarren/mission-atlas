import Link from "next/link";

type PaginationProps = {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
};

const linkClasses = "rounded border px-3 py-2 transition hover:bg-gray-50";

export default function Pagination({
  page,
  pageCount,
  hrefFor,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pages"
      className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm"
    >
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className={linkClasses}>
          Previous
        </Link>
      )}

      {pages.map((number) =>
        number === page ? (
          <span
            key={number}
            aria-current="page"
            className="rounded bg-black px-3 py-2 text-white"
          >
            {number}
          </span>
        ) : (
          <Link key={number} href={hrefFor(number)} className={linkClasses}>
            {number}
          </Link>
        ),
      )}

      {page < pageCount && (
        <Link href={hrefFor(page + 1)} className={linkClasses}>
          Next
        </Link>
      )}
    </nav>
  );
}
