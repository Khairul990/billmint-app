import React from 'react';

const GlobalSettings = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Global Settings & Feature Switches</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="font-bold text-slate-300 mb-4">Platform Controls</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-slate-400">Maintenance Mode</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" />
                <div className="block bg-slate-600 w-10 h-6 rounded-full"></div>
                <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-slate-400">Allow New Registrations</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" defaultChecked />
                <div className="block bg-rose-500 w-10 h-6 rounded-full"></div>
                <div className="dot absolute right-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
              </div>
            </label>
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="font-bold text-slate-300 mb-4">Feature Toggles</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-slate-400">Live Link Sharing</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" defaultChecked />
                <div className="block bg-rose-500 w-10 h-6 rounded-full"></div>
                <div className="dot absolute right-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-slate-400">Payment Proof System</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" defaultChecked />
                <div className="block bg-rose-500 w-10 h-6 rounded-full"></div>
                <div className="dot absolute right-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettings;
