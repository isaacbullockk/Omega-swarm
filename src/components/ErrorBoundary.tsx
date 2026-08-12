import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Bug, Home } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/* ------------------------------------------------------------------ */
/*  Error Boundary                                                     */
/* ------------------------------------------------------------------ */

/**
 * Omega Swarm Error Boundary — Catches React rendering errors and
 * displays a beautiful, on-brand error UI with recovery options.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[Omega Swarm ErrorBoundary] Caught error:", error);
    console.error("[Omega Swarm ErrorBoundary] Component stack:", errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div
          className="flex min-h-screen items-center justify-center p-6"
          style={{ background: "var(--bg-base, #0C0A09)" }}
        >
          <div
            className="w-full max-w-md rounded-3xl p-8 text-center animate-scale-in"
            style={{
              background: "var(--bg-card, rgba(28,25,23,0.85))",
              border: "1px solid var(--border-subtle, #29221D)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Animated icon */}
            <div className="relative mx-auto mb-6 flex size-20 items-center justify-center">
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{
                  background:
                    "linear-gradient(135deg, #EF4444, #F59E0B)",
                }}
              />
              <div
                className="relative flex size-20 items-center justify-center rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #EF4444, #F59E0B)",
                }}
              >
                <AlertTriangle className="size-9 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: "var(--text-primary, #FAF5EF)" }}
            >
              Something went wrong
            </h1>

            {/* Subtitle */}
            <p
              className="text-sm mb-6 leading-relaxed"
              style={{ color: "var(--text-secondary, #C4B5A0)" }}
            >
              The Omega Swarm encountered an unexpected error. Don't
              worry — your data is safe. Try refreshing the page or return
              to the dashboard.
            </p>

            {/* Error details (collapsible) */}
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary
                  className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none mb-2"
                  style={{ color: "var(--text-muted, #7A6E5F)" }}
                >
                  <Bug className="size-3.5" />
                  Error details
                </summary>
                <div
                  className="rounded-xl p-3 overflow-auto max-h-32 font-mono text-[11px] leading-relaxed"
                  style={{
                    background: "var(--bg-elevated, #29221D)",
                    color: "#EF4444",
                    border: "1px solid var(--border-subtle, #29221D)",
                  }}
                >
                  <p className="font-semibold mb-1">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="whitespace-pre-wrap opacity-70">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                style={{
                  background: "var(--bg-elevated, #29221D)",
                  color: "var(--text-primary, #FAF5EF)",
                  border: "1px solid var(--border-subtle, #29221D)",
                }}
              >
                <Home className="size-4" />
                Dashboard
              </button>
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                style={{
                  background:
                    "linear-gradient(135deg, #F59E0B, #F97316)",
                  color: "#0C0A09",
                }}
              >
                <RefreshCw className="size-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
