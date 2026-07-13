import React, { useState } from 'react';
import { Globe, Image as ImageIcon, Link, Upload, Trash2, Layout } from 'lucide-react';

const PortalStudio = ({ settings, onUpdate }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (key, value) => {
    onUpdate({ [key]: value });
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width, height = img.height;
          const maxWidth = 800; // Banner size
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/webp', 0.8));
        };
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-theme-primary">Portal Identity</h2>
            <p className="text-xs text-theme-muted">Configure how customers see your public portals</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Portal Name</label>
            <input 
              type="text" 
              value={settings?.portalName || `${settings?.businessName || 'Business'} Portal`} 
              onChange={(e) => handleChange('portalName', e.target.value)} 
              placeholder="e.g. Acme Client Portal"
              className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-white focus:outline-none focus:border-cyan-500 transition-colors" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Portal Theme Override</label>
            <select 
              value={settings?.portalThemeOverride || 'inherit'} 
              onChange={(e) => handleChange('portalThemeOverride', e.target.value)} 
              className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
            >
              <option value="inherit">Inherit Main Business Theme</option>
              <option value="light">Always Light Mode</option>
              <option value="dark">Always Dark Mode</option>
            </select>
          </div>
        </div>
      </div>

      {/* Banner & Media */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-theme-primary">Portal Banner</h2>
            <p className="text-xs text-theme-muted">Hero image displayed at the top of client portals</p>
          </div>
        </div>
        
        <div 
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isDragging ? 'border-cyan-500 bg-cyan-500/5' : 'border-theme-border-soft bg-theme-surface/50 hover:bg-theme-surface'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={async (e) => { 
            e.preventDefault(); 
            setIsDragging(false); 
            const f = e.dataTransfer.files[0]; 
            if (f && f.type.startsWith('image/')) handleChange('portalBannerUrl', await compressImage(f)); 
          }}
        >
          <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files[0]; if (f && f.type.startsWith('image/')) handleChange('portalBannerUrl', await compressImage(f)); }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
          {settings?.portalBannerUrl ? (
            <div className="relative inline-block w-full max-w-lg group">
              <img src={settings.portalBannerUrl} alt="Banner" className="w-full h-32 object-cover rounded-xl border border-theme-border-soft shadow-lg" />
              <button onClick={(e) => { e.preventDefault(); handleChange('portalBannerUrl', ''); }} className="absolute -top-3 -right-3 bg-theme-danger text-white rounded-full p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20"><Trash2 className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="py-4">
              <Upload className="w-8 h-8 mx-auto text-theme-muted mb-3" />
              <p className="text-sm font-bold text-white mb-1">Upload Hero Banner</p>
              <p className="text-xs text-theme-muted">Recommended size: 1200x300px</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links & Layout */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-theme-primary">Layout & Components</h2>
            <p className="text-xs text-theme-muted">Enable or disable specific features in the client portal</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'portalShowSupport', label: 'Show Support & Contact Links' },
            { id: 'portalShowHistory', label: 'Allow Client to View Invoice History' },
            { id: 'portalShowEstimates', label: 'Allow Client to View Estimates' },
            { id: 'portalShowAttachments', label: 'Show Public Attachments' }
          ].map(feature => (
            <label key={feature.id} className="flex items-center justify-between p-4 bg-theme-surface/50 border border-theme-border-soft rounded-xl cursor-pointer hover:border-theme-accent transition-colors">
              <span className="text-sm font-bold text-white">{feature.label}</span>
              <div className="relative inline-block w-10 h-5 align-middle select-none">
                <input 
                  type="checkbox" 
                  checked={settings?.[feature.id] !== false} // Default to true
                  onChange={(e) => handleChange(feature.id, e.target.checked)}
                  className="absolute block w-5 h-5 rounded-full bg-white border-2 border-theme-surface appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-5 checked:border-cyan-500 z-10"
                />
                <div className={`block w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${settings?.[feature.id] !== false ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortalStudio;
