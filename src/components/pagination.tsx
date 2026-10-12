import Link from "next/link";

type PaginationProps = {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
};

const linkClasses =
  "rounded-lg border border-border-strong px-3 py-2 transition-colors hover:border-accent hover:text-accent";

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
            className="rounded-lg border border-button bg-button px-3 py-2 text-button-text"
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
