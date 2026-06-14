import React from 'react';

const ShineBorder = ({
  children,
  className = '',
  borderWidth = 2,
  duration = 3,
  gradient = 'from-theme-accent via-theme-danger to-theme-success',
}) => {
  return (
    <div
      className={`relative rounded-3xl ${className}`}
      style={{ padding: borderWidth }}
    >
      {/* Animated Gradient Layer */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <div
          className={`absolute -inset-[100%] animate-spin bg-[conic-gradient(from_0deg,var(--tw-gradient-stops))] ${gradient} blur-md opacity-80`}
          style={{ animationDuration: `${duration}s` }}
        />
      </div>

      {/* Content Layer */}
      <div className="relative rounded-[calc(1.5rem-2px)] h-full bg-theme-card">
        {children}
      </div>
    </div>
  );
};

export default ShineBorder;
