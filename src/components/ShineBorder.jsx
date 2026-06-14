import React from 'react';

const ShineBorder = ({
  children,
  className = '',
  borderWidth = 3,
  duration = 4,
}) => {
  return (
    <div
      className={`relative rounded-3xl ${className}`}
      style={{ padding: borderWidth }}
    >
      {/* Animated Gradient Layer */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin opacity-100"
          style={{ 
            animationDuration: `${duration}s`,
            backgroundImage: `conic-gradient(from 0deg, transparent 0%, var(--accent) 30%, #f43f5e 50%, #0ea5e9 70%, transparent 100%)`
          }}
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
