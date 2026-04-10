import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const controls = useAnimation();
  const rotate = useTransform(y, [0, MAX_PULL], [0, 360]);
  const opacity = useTransform(y, [0, 40], [0, 1]);

  useEffect(() => {
    let startY = 0;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0 && window.scrollY <= 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const pullDistance = Math.min(diff * 0.5, MAX_PULL);
        y.set(pullDistance);
      } else {
        isPulling = false;
        y.set(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;
      isPulling = false;

      if (y.get() >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        controls.start({ y: PULL_THRESHOLD, transition: { type: 'spring', stiffness: 300, damping: 20 } });
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
        }
      } else {
        controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
      }
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
      element.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (element) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isRefreshing, onRefresh, controls, y]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center items-center h-16 -mt-16 z-0"
        style={{ y, opacity }}
        animate={controls}
      >
        <div className="bg-white dark:bg-stone-800 rounded-full p-2 shadow-md">
          <motion.div style={{ rotate }}>
            <RefreshCw 
              className={`w-5 h-5 text-emerald-500 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </motion.div>
        </div>
      </motion.div>
      <motion.div
        style={{ y }}
        animate={controls}
        className="w-full h-full relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
