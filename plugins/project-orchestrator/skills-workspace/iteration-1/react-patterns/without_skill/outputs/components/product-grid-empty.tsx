interface ProductGridEmptyProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function ProductGridEmpty({
  hasFilters = false,
  onClearFilters,
}: ProductGridEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-6 py-12">
      <svg
        className="mb-4 h-12 w-12 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
      <p className="mb-1 text-sm font-medium text-gray-900">
        No products found
      </p>
      {hasFilters ? (
        <>
          <p className="mb-4 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Clear Filters
            </button>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-500">
          Check back later for new arrivals.
        </p>
      )}
    </div>
  );
}
