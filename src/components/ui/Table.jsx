
export const Table = ({ className = '', children, ...props }) => (
  <div className="w-full overflow-auto rounded-2xl border border-theme-border-soft bg-theme-surface">
    <table className={`w-full text-sm text-left ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ className = '', children, ...props }) => (
  <thead className={`text-xs text-theme-muted uppercase bg-theme-surface-elevated border-b border-theme-border-soft ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody = ({ className = '', children, ...props }) => (
  <tbody className={`divide-y divide-theme-border-soft ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow = ({ className = '', children, ...props }) => (
  <tr className={`hover:bg-theme-surface-hover transition-colors ${className}`} {...props}>
    {children}
  </tr>
);

export const TableHead = ({ className = '', children, ...props }) => (
  <th className={`px-6 py-4 font-black tracking-wider ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell = ({ className = '', children, ...props }) => (
  <td className={`px-6 py-4 text-theme-primary font-medium ${className}`} {...props}>
    {children}
  </td>
);
