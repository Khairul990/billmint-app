
export const Badge = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-theme-accent/10 text-theme-accent border-theme-accent/20',
    success: 'bg-theme-success/10 text-theme-success border-theme-success/20',
    warning: 'bg-theme-warning/10 text-theme-warning border-theme-warning/20',
    danger: 'bg-theme-danger/10 text-theme-danger border-theme-danger/20',
    outline: 'bg-transparent text-theme-secondary border-theme-border-strong',
    solid: 'bg-theme-accent text-white border-theme-accent',
  };

  const style = variants[variant] || variants.primary;

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${style} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
