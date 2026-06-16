import React from "react";

export const ShimmerButton = React.forwardRef((
  {
    shimmerColor = "#ffffff",
    shimmerSize = "0.05em",
    shimmerDuration = "3s",
    borderRadius = "100px",
    background = "rgba(0, 0, 0, 1)",
    className,
    children,
    ...props
  },
  ref,
) => {
  return (
    <button
      style={{
        "--spread": "90deg",
        "--shimmer-color": shimmerColor,
        "--radius": borderRadius,
        "--speed": shimmerDuration,
        "--cut": shimmerSize,
        "--bg": background,
        borderRadius: "var(--radius)"
      }}
      className={`group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${className || ''}`}
      ref={ref}
      {...props}
    >
      {/* spark container */}
      <div
        className="absolute inset-0 overflow-visible opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100"
        style={{
          borderRadius: "calc(var(--radius) + var(--cut))",
          clipPath: "inset(0 0 0 0 round calc(var(--radius) + var(--cut)))"
        }}
      >
        <div className="absolute -inset-full w-auto rotate-0 animate-spin-around [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
      </div>
      
      {/* backdrop */}
      <div
        className="absolute inset-[var(--cut)] bg-[var(--bg)] transition-colors group-hover:bg-opacity-90"
        style={{ borderRadius: "calc(var(--radius) - var(--cut))" }}
      />
      
      {/* inner drop shadow */}
      <div
        className="absolute inset-0 rounded-[var(--radius)] shadow-[inset_0_-1px_1px_rgba(0,0,0,1),inset_0_-1px_1px_rgba(255,255,255,0.25)]"
      />
      
      {/* content */}
      <div className="relative z-10 font-medium">
        {children}
      </div>
    </button>
  );
});

ShimmerButton.displayName = "ShimmerButton";
