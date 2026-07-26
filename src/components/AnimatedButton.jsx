import React, { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { buttonTap } from '../utils/animations';

const variantClasses = {
  primary: 'btn-premium',
  secondary: 'btn-premium bg-theme-card border border-theme-border-soft text-theme-primary shadow-sm hover:border-accent/30 hover:shadow-md',
  outline: 'btn-premium-outline',
  ghost: 'btn-premium-ghost',
};

const AnimatedButton = ({
  children,
  variant = 'primary',
  onClick,
  className = '',
  disabled = false,
  isLoading = false,
  ...props
}) => {
  const [ripples, setRipples] = useState([]);
  const btnRef = useRef(null);
  const rippleId = useRef(0);

  const handleClick = useCallback((e) => {
    if (disabled) return;

    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = ++rippleId.current;
      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }

    if (navigator.vibrate) {
      navigator.vibrate(6);
    }

    if (onClick) onClick(e);
  }, [onClick, disabled]);

  return (
    <motion.button
      ref={btnRef}
      variants={buttonTap}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      onClick={handleClick}
      disabled={disabled}
      className={`relative overflow-hidden select-none ${variantClasses[variant]} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Loading...</span>
        </span>
      ) : children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none rounded-full bg-white/30 animate-ripple"
          style={{
            left: ripple.x - 8,
            top: ripple.y - 8,
            width: 16,
            height: 16,
          }}
        />
      ))}
    </motion.button>
  );
};

export default AnimatedButton;
