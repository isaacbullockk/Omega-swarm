import { type LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center text-center p-12 rounded-2xl ${className}`}
      style={{
        background: "var(--bg-card)",
        border: "1px dashed var(--border-subtle)",
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <Icon className="size-8" style={{ color: "var(--text-muted)" }} />
      </div>
      <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #F97316)",
              color: "#0C0A09",
            }}
          >
            {actionLabel}
          </button>
        )}
        {secondaryLabel && onSecondary && (
          <button
            onClick={onSecondary}
            className="px-4 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
