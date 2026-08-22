import React from 'react';

export const Table = ({ className = '', children, ...props }) => (
  <div className="w-full overflow-x-auto rounded-2xl border border-theme-border-soft bg-theme-card shadow-premium-sm">
    <table className={`w-full text-sm text-left border-collapse ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ className = '', children, ...props }) => (
  <thead className={`text-[11px] font-bold text-theme-muted uppercase tracking-wider bg-theme-surface-elevated/70 border-b border-theme-border-soft ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody = ({ className = '', children, ...props }) => (
  <tbody className={`divide-y divide-theme-border-soft/60 ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow = ({ className = '', children, ...props }) => (
  <tr className={`hover:bg-theme-surface-hover/80 transition-colors duration-150 ${className}`} {...props}>
    {children}
  </tr>
);

export const TableHead = ({ className = '', children, ...props }) => (
  <th className={`px-4 py-3 font-black text-theme-secondary select-none ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell = ({ className = '', numeric = false, children, ...props }) => (
  <td className={`px-4 py-3.5 text-theme-primary font-medium ${numeric ? 'tabular-nums font-numbers text-right' : ''} ${className}`} {...props}>
    {children}
  </td>
);
