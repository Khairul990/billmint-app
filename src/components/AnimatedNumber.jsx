import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * AnimatedNumber — counts up from 0 to `value` when the element scrolls into
 * view. Formats with Indian digit grouping by default.
 */
const AnimatedNumber = ({
  value,
  duration = 1400,
  prefix = '',
  suffix = '',
  format = 'indian',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef(null);
  const [display, setDisplay] = useState(shouldReduceMotion ? value : 0);
  const started = useRef(false);

  useEffect(() => {
    if (shouldReduceMotion) { setDisplay(value); return undefined; }
    const el = ref.current;
    if (!el) return undefined;

    const formatNumber = (n) => {
      if (format === 'indian') return Math.round(n).toLocaleString('en-IN');
      if (format === 'plain') return Math.round(n).toLocaleString('en-US');
      return String(Math.round(n));
    };

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting || started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        // ease-out expo for a premium deceleration
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        setDisplay(value * eased);
        if (t < 1) requestAnimationFrame(tick);
        else setDisplay(value);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.35 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration, format, shouldReduceMotion]);

  const formatNumber = (n) => {
    if (format === 'indian') return Math.round(n).toLocaleString('en-IN');
    if (format === 'plain') return Math.round(n).toLocaleString('en-US');
    return String(Math.round(n));
  };

  return <span ref={ref} className={className}>{prefix}{formatNumber(display)}{suffix}</span>;
};

export default AnimatedNumber;
