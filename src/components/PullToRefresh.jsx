import { useState, useRef, useEffect } from 'react';
import { triggerSuccessFeedback } from '../utils/feedback';

const PullToRefresh = ({ onRefresh, children }) => {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  
  const pullDistance = Math.max(0, currentY - startY);
  const threshold = 100; // pixels to pull before triggering refresh
  const isThresholdMet = pullDistance >= threshold;

  const handleTouchStart = (e) => {
    // Only trigger if we are at the top of the scroll container
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling) return;
    const y = e.touches[0].clientY;
    // Prevent default scrolling only if we're actually pulling down
    if (y > startY) {
      // e.preventDefault(); // Might cause passive listener issues
      setCurrentY(y);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    if (isThresholdMet && !isRefreshing) {
      setIsRefreshing(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
      try {
        await onRefresh();
        triggerSuccessFeedback();
      } catch (e) {
        console.error("Refresh failed", e);
      }
      setIsRefreshing(false);
    }
    
    setStartY(0);
    setCurrentY(0);
    setIsPulling(false);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    // Use passive: false to allow preventDefault if needed
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, currentY, startY, isRefreshing]);

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Pull indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center items-center overflow-hidden transition-all duration-200 ease-out z-10"
        style={{ 
          height: isRefreshing ? '60px' : `${Math.min(pullDistance, 80)}px`,
          opacity: isPulling || isRefreshing ? 1 : 0
        }}
      >
        <div className={`p-2 bg-theme-card dark:bg-theme-card rounded-full shadow-md flex items-center justify-center transition-transform ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${Math.min(pullDistance, 180)}deg)` }}>
          <RefreshCw className={`w-5 h-5 ${isThresholdMet || isRefreshing ? 'text-theme-accent' : 'text-theme-muted'}`} />
        </div>
      </div>
      
      {/* Content wrapper */}
      <div 
        className="transition-transform duration-200 ease-out"
        style={{ transform: `translateY(${isRefreshing ? 60 : Math.min(pullDistance, 80)}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
