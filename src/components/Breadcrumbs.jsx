import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Universal SaaS Breadcrumbs Navigation
 * @param {Array<{ label: string, onClick?: Function, active?: boolean }>} items
 */
const Breadcrumbs = ({ items = [], onHomeClick }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-2xs font-semibold text-theme-muted mb-4 overflow-x-auto no-scrollbar py-0.5">
      <button 
        type="button"
        onClick={onHomeClick}
        className="flex items-center gap-1 hover:text-theme-primary transition-colors shrink-0"
        title="Home / Dashboard"
      >
        <Home className="w-3.5 h-3.5 text-theme-accent" />
        <span>Dashboard</span>
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-theme-border-strong shrink-0 opacity-60" />
            {isLast || !item.onClick ? (
              <span className={`shrink-0 font-bold ${isLast ? 'text-theme-primary' : 'text-theme-muted'}`}>
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className="hover:text-theme-primary transition-colors shrink-0"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
