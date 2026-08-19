import SkeletonCard from "./SkeletonCard";

export interface SkeletonGridProps {
  count?: number;
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  cardProps?: Parameters<typeof SkeletonCard>[0];
  className?: string;
}

export default function SkeletonGrid({
  count = 8,
  columns = { default: 1, sm: 2, lg: 3, xl: 4 },
  cardProps,
  className = "",
}: SkeletonGridProps) {
  const colClass = [
    `grid-cols-${columns.default ?? 1}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`grid gap-4 ${colClass} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} {...cardProps} />
      ))}
    </div>
  );
}
