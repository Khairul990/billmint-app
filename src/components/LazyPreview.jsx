import React, { useState, useEffect, useRef } from 'react';

const LazyPreview = ({ children, fallback, threshold = 0.1 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className="w-full h-full relative overflow-hidden">
      {isVisible ? children : fallback}
    </div>
  );
};

export default LazyPreview;
