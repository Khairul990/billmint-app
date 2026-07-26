import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const Accordion = ({ children, className = '' }) => {
  return <div className={`divide-y divide-theme-border-soft ${className}`}>{children}</div>;
};

export const AccordionItem = ({ title, children, className = '', defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`py-4 ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none group"
      >
        <span className="text-sm font-bold text-theme-primary group-hover:text-theme-accent transition-colors">
          {title}
        </span>
        <ChevronDown className={`w-4 h-4 text-theme-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-theme-accent' : ''}`} />
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-xs text-theme-secondary leading-relaxed">
          {children}
        </p>
      </div>
    </div>
  );
};
