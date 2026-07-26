
const SkeletonLine = ({ width = '100%', className = '' }) => (
  <div className={`skeleton-line ${className}`} style={{ width }} />
);

const SkeletonBlock = ({ width = '100%', height = '3rem', className = '' }) => (
  <div className={`skeleton-block ${className}`} style={{ width, height }} />
);

const CardSkeleton = ({ lines = 3, className = '' }) => (
  <div className={`skeleton-card ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <SkeletonBlock width="2.5rem" height="2.5rem" className="rounded-xl" />
      <div className="flex-1">
        <SkeletonLine width="60%" />
      </div>
    </div>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLine key={i} width={`${60 - i * 10}%`} className="mb-2" />
    ))}
  </div>
);

const TableRowSkeleton = ({ cols = 4 }) => (
  <div className="flex items-center gap-4 py-3 px-4">
    {Array.from({ length: cols }).map((_, i) => (
      <SkeletonLine key={i} width={`${35 - i * 5}%`} />
    ))}
  </div>
);

const KPISkeleton = ({ count = 4 }) => (
  <div className="stats-grid">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="stat-premium">
        <div className="flex items-center justify-between mb-3">
          <SkeletonBlock width="2.5rem" height="2.5rem" className="rounded-xl" />
          <SkeletonBlock width="3.5rem" height="1rem" className="rounded-full" />
        </div>
        <SkeletonLine width="60%" className="mb-2" />
        <SkeletonLine width="40%" />
      </div>
    ))}
  </div>
);

const ChartSkeleton = () => (
  <div className="card-premium p-5">
    <div className="flex items-center justify-between mb-6">
      <SkeletonLine width="30%" />
      <SkeletonLine width="20%" />
    </div>
    <SkeletonBlock width="100%" height="12rem" className="rounded-xl" />
  </div>
);

export { SkeletonLine, SkeletonBlock, CardSkeleton, TableRowSkeleton, KPISkeleton, ChartSkeleton };
export default CardSkeleton;