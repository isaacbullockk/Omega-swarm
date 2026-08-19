export interface SpinnerProps {
  className?: string;
  message?: string;
  fullPage?: boolean;
}

/**
 * Production spinner primitive — CSS-only for performance & theming.
 * Uses the --accent-primary CSS variable so it matches any active theme.
 *
 * Use `fullPage` for page-level loading states (centers in viewport).
 * Use `className` to override size (default size-8).
 */
export default function Spinner({
  className = "size-8",
  message,
  fullPage = false,
}: SpinnerProps) {
  const spinner = (
    <div
      role="status"
      aria-label="Loading"
      className={`border-4 border-t-transparent rounded-full animate-spin ${className}`}
      style={{
        borderColor: "var(--accent-primary)",
        borderTopColor: "transparent",
      }}
    />
  );

  if (fullPage) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center min-h-[50vh] gap-4"
      >
        {spinner}
        {message && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {message}
          </p>
        )}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      {spinner}
      {message && (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {message}
        </span>
      )}
    </div>
  );
}
