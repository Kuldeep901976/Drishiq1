/**
 * Root loading UI - shown during route transitions and while child segments load.
 */
export default function RootLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[var(--bg-primary)]" aria-hidden>
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin"
          aria-label="Loading"
        />
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      </div>
    </div>
  );
}
