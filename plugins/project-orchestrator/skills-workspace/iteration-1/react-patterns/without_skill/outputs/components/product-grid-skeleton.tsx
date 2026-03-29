export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-lg border border-gray-200 bg-white"
        >
          <div className="aspect-square bg-gray-200" />
          <div className="flex flex-col gap-2 p-4">
            <div className="h-3 w-16 rounded bg-gray-200" />
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-full rounded bg-gray-200" />
            <div className="mt-2 h-6 w-20 rounded bg-gray-200" />
            <div className="mt-1 h-9 w-full rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
