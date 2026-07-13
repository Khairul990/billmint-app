import React from 'react';
import { Globe2, Clock, DollarSign, Percent } from 'lucide-react';

const LocalizationStudio = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-500/30 flex items-center justify-center shadow-inner">
          <Globe2 className="w-6 h-6 text-pink-400 drop-shadow-md" />
        </div>
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">Localization Studio</h2>
          <p className="text-xs text-theme-muted font-medium">Configure regional formats, currency, and tax terminologies</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Currency & Numbers */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-5 h-5 text-pink-400" />
            <h3 className="text-sm font-black text-white">Currency & Numbers</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block mb-2">Primary Currency</label>
              <select 
                value={settings?.currency || 'USD'} 
                onChange={(e) => onUpdate({ currency: e.target.value })}
                className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-xl p-3 focus:outline-none focus:border-pink-500/50 transition-colors"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
              </select>
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block mb-2">Number Format</label>
              <select 
                value={settings?.numberFormat || 'en-US'} 
                onChange={(e) => onUpdate({ numberFormat: e.target.value })}
                className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-xl p-3 focus:outline-none focus:border-pink-500/50 transition-colors"
              >
                <option value="en-US">1,234,567.89 (US)</option>
                <option value="de-DE">1.234.567,89 (EU)</option>
                <option value="en-IN">12,34,567.89 (India)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-black text-white">Date & Time</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block mb-2">Timezone</label>
              <select 
                value={settings?.timezone || 'UTC'} 
                onChange={(e) => onUpdate({ timezone: e.target.value })}
                className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-xl p-3 focus:outline-none focus:border-purple-500/50 transition-colors"
              >
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="America/New_York">EST (New York)</option>
                <option value="Europe/London">GMT (London)</option>
                <option value="Asia/Dhaka">BST (Dhaka)</option>
                <option value="Asia/Kolkata">IST (New Delhi)</option>
              </select>
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block mb-2">Date Format</label>
              <select 
                value={settings?.dateFormat || 'MM/DD/YYYY'} 
                onChange={(e) => onUpdate({ dateFormat: e.target.value })}
                className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-xl p-3 focus:outline-none focus:border-purple-500/50 transition-colors"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                <option value="DD MMM YYYY">DD MMM YYYY (31 Dec 2026)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Terminology / Tax */}
        <div className="md:col-span-2 p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <Percent className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black text-white">Tax & Terminology</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block mb-2">Tax Label (e.g. GST, VAT, Tax)</label>
              <input 
                type="text" 
                value={settings?.taxLabel || 'Tax'} 
                onChange={(e) => onUpdate({ taxLabel: e.target.value })}
                placeholder="Tax"
                className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-xl p-3 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block mb-2">Default Tax Rate (%)</label>
              <input 
                type="number" 
                value={settings?.defaultTaxRate || 0} 
                onChange={(e) => onUpdate({ defaultTaxRate: parseFloat(e.target.value) })}
                className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-xl p-3 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalizationStudio;
