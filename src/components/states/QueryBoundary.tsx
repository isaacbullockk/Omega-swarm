import type { ReactNode } from "react";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import SkeletonGrid from "./SkeletonGrid";
import type { SkeletonGridProps } from "./SkeletonGrid";
import type { EmptyStateProps } from "./EmptyState";

export interface QueryBoundaryProps<T> {
  query: {
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    data: T | undefined;
    refetch: () => Promise<unknown>;
  };
  children: (data: T) => ReactNode;
  emptyCheck?: (data: T) => boolean;
  emptyFallback?: ReactNode;
  emptyProps?: Partial<EmptyStateProps>;
  loadingFallback?: ReactNode;
  loadingProps?: SkeletonGridProps;
  errorFallback?: (error: Error, retry: () => void) => ReactNode;
  className?: string;
}

/**
 * QueryBoundary — declarative data-fetching wrapper.
 *
 * Handles the four states of every query automatically:
 *   1. Loading   → SkeletonGrid (or custom loadingFallback)
 *   2. Error     → ErrorState with retry (or custom errorFallback)
 *   3. Empty     → EmptyState (or custom emptyFallback)
 *   4. Success   → Render children with typed data
 *
 * Usage with tRPC / react-query:
 *   const postsQuery = trpc.post.list.useQuery();
 *   <QueryBoundary
 *     query={postsQuery}
 *     emptyCheck={(d) => d.length === 0}
 *     emptyProps={{ icon: Inbox, title: "No posts yet", description: "..." }}
 *   >
 *     {(posts) => <PostGrid posts={posts} />}
 *   </QueryBoundary>
 */
export default function QueryBoundary<T>({
  query,
  children,
  emptyCheck,
  emptyFallback,
  emptyProps,
  loadingFallback,
  loadingProps,
  errorFallback,
  className = "",
}: QueryBoundaryProps<T>) {
  const { isLoading, isError, error, data, refetch } = query;

  /* ── Loading ── */
  if (isLoading || data === undefined) {
    if (loadingFallback) return <>{loadingFallback}</>;
    return (
      <div className={className}>
        <SkeletonGrid {...(loadingProps ?? { count: 6 })} />
      </div>
    );
  }

  /* ── Error ── */
  if (isError && error) {
    if (errorFallback) return <>{errorFallback(error, () => { refetch(); })}</>;
    return (
      <div className={className}>
        <ErrorState
          error={error}
          onRetry={() => { refetch(); }}
          {...(emptyProps && "title" in emptyProps ? {} : {})}
        />
      </div>
    );
  }

  /* ── Empty ── */
  if (emptyCheck && emptyCheck(data)) {
    if (emptyFallback) return <>{emptyFallback}</>;
    if (emptyProps) {
      return (
        <div className={className}>
          <EmptyState {...(emptyProps as EmptyStateProps)} />
        </div>
      );
    }
    /* If no empty fallback is provided, render children with empty data */
  }

  /* ── Success ── */
  return <>{children(data)}</>;
}
