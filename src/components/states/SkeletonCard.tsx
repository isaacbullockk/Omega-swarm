import { type LucideIcon } from "lucide-react";

export interface SkeletonCardProps {
  aspectRatio?: "square" | "video" | "auto";
  lines?: number;
  className?: string;
}

export default function SkeletonCard({
  aspectRatio = "square",
  lines = 2,
  className = "",
}: SkeletonCardProps) {
  const aspectMap: Record<string, string> = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "",
  };

  return (
    <div
      className={`rounded-2xl overflow-hidden animate-pulse ${className}`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div
        className={`${aspectMap[aspectRatio] ?? ""}`}
        style={{ background: "var(--bg-elevated)" }}
      />
      <div className="p-3 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded"
            style={{
              width: i === 0 ? "33%" : i === lines - 1 ? "75%" : "50%",
              background: "var(--bg-elevated)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
