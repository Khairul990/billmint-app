import React from 'react';
import { Building2, Palette, ShieldAlert, Database } from 'lucide-react';

const SettingsSidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'business_profile', label: 'Business Profile', icon: Building2 },
    { id: 'theme_studio', label: 'Theme Studio', icon: Palette },
    { id: 'admin_console', label: 'Admin Console', icon: ShieldAlert },
    { id: 'data_backup', label: 'Data Backup', icon: Database }
  ];

  return (
    <div className="w-full md:w-64 shrink-0">
      <div className="flex flex-row md:flex-col bg-theme-surface dark:bg-theme-card/60 p-2 rounded-3xl overflow-x-auto no-scrollbar gap-2 md:sticky md:top-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
                isSelected 
                  ? 'bg-[image:var(--accent-gradient)] text-white shadow-md' 
                  : 'bg-transparent text-theme-muted hover:bg-theme-card dark:hover:bg-theme-card hover:text-theme-primary'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-white' : 'text-theme-muted'}`} />
              <span className={`text-xs font-black tracking-wide uppercase ${isSelected ? 'text-white' : 'text-theme-muted'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsSidebar;
