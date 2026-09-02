import Link from "next/link";

interface PlatformPaginationProps {
  currentPage: number;
  pathname: string;
  searchParams: Record<string, string | undefined>;
  total: number;
  pageSize?: number;
}

export function PlatformPagination({
  currentPage,
  pathname,
  searchParams,
  total,
  pageSize = 25,
}: PlatformPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages === 1) return null;

  return (
    <nav className="platform-pagination" aria-label="Pagination">
      <Link
        className={`secondary-button${currentPage <= 1 ? " is-disabled" : ""}`}
        href={buildPageHref(pathname, searchParams, Math.max(1, currentPage - 1))}
        aria-disabled={currentPage <= 1}
        tabIndex={currentPage <= 1 ? -1 : undefined}
      >
        Previous
      </Link>
      <p aria-live="polite">
        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
      </p>
      <Link
        className={`secondary-button${currentPage >= totalPages ? " is-disabled" : ""}`}
        href={buildPageHref(pathname, searchParams, Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage >= totalPages}
        tabIndex={currentPage >= totalPages ? -1 : undefined}
      >
        Next
      </Link>
    </nav>
  );
}

function buildPageHref(
  pathname: string,
  values: Record<string, string | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  params.set("page", String(page));
  return `${pathname}?${params.toString()}`;
}
