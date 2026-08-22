import React, { useState } from 'react';

export const Tabs = ({ value, onValueChange, defaultValue, children, className = '' }) => {
  const [internalTab, setInternalTab] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalTab;
  const setActiveTab = onValueChange || setInternalTab;

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
  <div className={`flex items-center gap-1.5 p-1 bg-theme-surface-elevated/70 border border-theme-border-soft rounded-xl mb-5 overflow-x-auto no-scrollbar ${className}`}>
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
      type="button"
      onClick={() => setActiveTab && setActiveTab(value)}
      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap select-none ${
        isActive 
          ? 'bg-theme-card text-theme-primary shadow-sm border border-theme-border-soft/60' 
          : 'text-theme-muted hover:text-theme-primary hover:bg-theme-surface/50 border border-transparent'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, activeTab, children, className = '' }) => {
  if (activeTab !== value) return null;
  return <div className={`animate-in fade-in duration-200 ${className}`}>{children}</div>;
};
