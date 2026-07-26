import React, { useState } from 'react';
import { Link, Zap, Plus, Trash2, Settings2, Image as ImageIcon } from 'lucide-react';

export const CyberPortalsConfig = ({ cyberPortals, setCyberPortals }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAdd = () => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    setCyberPortals([...cyberPortals, { id: Date.now().toString(), label: newLabel, url: newUrl }]);
    setNewLabel('');
    setNewUrl('');
  };

  const handleRemove = (id) => {
    setCyberPortals(cyberPortals.filter(p => p.id !== id));
  };

  return (
    <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
      <div className="section-header border-b border-gray-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0">
            <Link className="w-5 h-5" />
          </div>
          <div>
            <h2 className="section-header-title">Portal Hub Config</h2>
            <p className="section-header-subtitle">Manage custom quick links for your Cyber Cafe</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <input 
            type="text" 
            placeholder="Portal Name (e.g., E-Aadhaar)" 
            value={newLabel} 
            onChange={(e) => setNewLabel(e.target.value)}
            className="input-premium flex-1 px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl"
          />
          <input 
            type="url" 
            placeholder="URL (https://...)" 
            value={newUrl} 
            onChange={(e) => setNewUrl(e.target.value)}
            className="input-premium flex-1 px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl"
          />
          <button 
            onClick={handleAdd}
            className="btn-premium px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Portal
          </button>
        </div>

        {cyberPortals.length > 0 ? (
          <div className="space-y-2 mt-4">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Your Custom Portals</label>
            {cyberPortals.map(portal => (
              <div key={portal.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{portal.label}</p>
                  <p className="text-xs text-gray-500">{portal.url}</p>
                </div>
                <button onClick={() => handleRemove(portal.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-gray-500">
            <Link className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No custom portals added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const CyberToolsConfig = ({ enablePhotoMaker, setEnablePhotoMaker, removeBgApiKey, setRemoveBgApiKey }) => {
  return (
    <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
      <div className="section-header border-b border-gray-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="section-header-title">Tools & AI Config</h2>
            <p className="section-header-subtitle">Configure Quick Tools and API keys</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-start justify-between p-4 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 dark:text-white block">Passport Photo Maker</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-0.5 block">Enable auto-crop and layout tool</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEnablePhotoMaker(!enablePhotoMaker)}
            className={'relative w-12 h-6 rounded-full transition-all duration-500 ease-in-out shadow-inner flex items-center p-1 shrink-0 focus:outline-none ' + (enablePhotoMaker ? 'bg-[image:var(--accent-gradient)] shadow-md shadow-[var(--accent)]/30' : 'bg-slate-300 dark:bg-slate-700/60')}
          >
            <span className={'w-4 h-4 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-in-out ' + (enablePhotoMaker ? 'translate-x-6' : 'translate-x-0')} />
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Remove.bg API Key (Optional)</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400"><Settings2 className="w-4 h-4" /></span>
            <input 
              type="password" 
              value={removeBgApiKey} 
              onChange={(e) => setRemoveBgApiKey(e.target.value)} 
              placeholder="Enter your API key" 
              className="input-premium w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-medium" 
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-2">Required for the AI Background Remover tool. Get your key from remove.bg</p>
        </div>
      </div>
    </div>
  );
};
