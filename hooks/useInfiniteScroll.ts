import { useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  /** Whether there is another page to request. */
  hasNextPage: boolean;
  /** Whether a fetch is already in flight (prevents duplicate loads). */
  isFetching: boolean;
  /** Loads the next page. */
  onLoadMore: () => void;
  /** Distance from the viewport at which to prefetch. */
  rootMargin?: string;
}

/**
 * Fires `onLoadMore` when the returned sentinel ref scrolls into view.
 * Purely a side-effect hook — it owns no rendering and no data, so it
 * drops cleanly into any paginated list. Attach the ref to an element
 * placed just after the last item.
 */
export function useInfiniteScroll({
  hasNextPage,
  isFetching,
  onLoadMore,
  rootMargin = "400px",
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Keep the latest callback without re-creating the observer.
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetching) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, rootMargin]);

  return sentinelRef;
}
