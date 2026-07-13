import React, { useState } from 'react';

export const Tabs = ({ defaultValue, children, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className={`w-full ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  );
};

export const TabsList = ({ children, activeTab, setActiveTab, className = '' }) => (
  <div className={`flex items-center gap-2 border-b border-theme-border-soft pb-2 mb-6 overflow-x-auto no-scrollbar ${className}`}>
    {React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { activeTab, setActiveTab });
      }
      return child;
    })}
  </div>
);

export const TabsTrigger = ({ value, activeTab, setActiveTab, children, className = '' }) => {
  const isActive = activeTab === value;
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
        isActive 
          ? 'bg-theme-surface text-theme-primary border border-theme-border-soft shadow-glass' 
          : 'text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover border border-transparent'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, activeTab, children, className = '' }) => {
  if (activeTab !== value) return null;
  return <div className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}>{children}</div>;
};
