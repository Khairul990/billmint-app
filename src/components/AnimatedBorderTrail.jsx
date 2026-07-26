
const AnimatedBorderTrail = ({ borderRadius = 16, duration = 3, size = 20, className = '' }) => (
  <div
    className={`pointer-events-none absolute -inset-px rounded-[inherit] border-2 border-transparent border-solid [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)] ${className}`}
  >
    <motion.div
      className="absolute aspect-square bg-gradient-to-r from-transparent via-theme-accent to-theme-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      animate={{ offsetDistance: ["0%", "100%"] }}
      style={{
        width: size,
        offsetPath: `rect(0 auto auto 0 round ${borderRadius}px)`,
      }}
      transition={{
        repeat: Number.POSITIVE_INFINITY,
        duration: duration,
        ease: "linear",
      }}
    />
  </div>
);

export default AnimatedBorderTrail;
