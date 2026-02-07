/**
 * Blog route loading UI - shown while blog page or segment loads.
 */
export default function BlogLoading() {
  return (
    <div className="min-h-[50vh] w-full max-w-4xl mx-auto px-4 py-8 animate-pulse" aria-hidden>
      <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-6" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-24 w-36 bg-neutral-200 dark:bg-neutral-700 rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-4/5" />
              <div className="h-3 bg-neutral-100 dark:bg-neutral-600 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
