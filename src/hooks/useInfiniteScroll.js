import { useState, useEffect, useRef, useCallback } from 'react';

export function useInfiniteScroll(totalItems, itemsPerPage = 50) {
  const [displayCount, setDisplayCount] = useState(itemsPerPage);
  const observerRef = useRef(null);
  
  // Reset when data changes or filters change
  useEffect(() => {
    setDisplayCount(itemsPerPage);
  }, [totalItems, itemsPerPage]);

  const loadMoreRef = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && displayCount < totalItems) {
        setDisplayCount(prev => Math.min(prev + itemsPerPage, totalItems));
      }
    }, {
      rootMargin: '200px'
    });
    
    if (node) {
      observerRef.current.observe(node);
    }
  }, [displayCount, totalItems, itemsPerPage]);

  return { displayCount, loadMoreRef };
}
