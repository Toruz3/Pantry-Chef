import { useState, useRef, useEffect } from 'react';

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = async (e: TouchEvent) => {
      const delta = e.changedTouches[0].clientY - startY.current;
      if (delta > 80 && window.scrollY === 0 && !isRefreshing) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, isRefreshing]);

  return { isRefreshing };
}
