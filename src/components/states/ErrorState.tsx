import { useState } from "react";
import { AlertTriangle, RefreshCw, Bug, ChevronDown, ChevronUp } from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * Section-level error state. Use when a data query fails inside a page.
 * For full-page crashes, use the ErrorBoundary component instead.
 */
export default function ErrorState({
  title = "Failed to load",
  message,
  error,
  onRetry,
  className = "",
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isDev = import.meta.env?.DEV ?? false;

  const displayMessage = message ?? error?.message ?? "Something went wrong while loading this data.";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex flex-col items-center justify-center text-center p-10 rounded-2xl ${className}`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.2)",
        }}
      >
        <AlertTriangle className="size-7" style={{ color: "#EF4444" }} />
      </div>
      <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p className="text-sm mt-1 max-w-md" style={{ color: "var(--text-secondary)" }}>
        {displayMessage}
      </p>

      <div className="flex items-center gap-3 mt-5">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #F97316)",
              color: "#0C0A09",
            }}
          >
            <RefreshCw className="size-4" />
            Try Again
          </button>
        )}
      </div>

      {/* Error details — only in dev mode */}
      {isDev && error && (
        <div className="mt-4 w-full max-w-lg">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs font-medium mx-auto transition-colors hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            <Bug className="size-3" />
            Error details
            {showDetails ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
          {showDetails && (
            <div
              className="mt-2 rounded-xl p-3 text-left overflow-auto max-h-40 font-mono text-[11px] leading-relaxed"
              style={{
                background: "var(--bg-elevated)",
                color: "#EF4444",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p className="font-semibold mb-1">
                {error.name}: {error.message}
              </p>
              {error.stack && (
                <pre className="whitespace-pre-wrap opacity-70">{error.stack}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
