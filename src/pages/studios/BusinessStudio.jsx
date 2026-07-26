import { useState } from 'react';
import { BUSINESS_PRESETS } from '../../config/businessPresets';

const BusinessStudio = ({ settings, onUpdate }) => {
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
          const maxWidth = 400;
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
      {/* Brand Identity */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
          <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-theme-primary">Brand Identity</h2>
            <p className="text-xs text-theme-muted">Configure your primary business details</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Business Logo</label>
            <div 
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${isDragging ? 'border-theme-accent bg-theme-accent/5' : 'border-theme-border-soft bg-theme-surface/50 hover:bg-theme-surface'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={async (e) => { 
                e.preventDefault(); 
                setIsDragging(false); 
                const f = e.dataTransfer.files[0]; 
                if (f && f.type.startsWith('image/')) handleChange('logoUrl', await compressImage(f)); 
              }}
            >
              <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files[0]; if (f && f.type.startsWith('image/')) handleChange('logoUrl', await compressImage(f)); }} className="absolute inset-0 opacity-0 cursor-pointer" />
              {settings?.logoUrl ? (
                <div className="relative inline-block group">
                  <img src={settings.logoUrl} alt="Logo" className="h-16 w-auto object-contain rounded-lg border border-theme-border-soft bg-white p-1" />
                  <button onClick={(e) => { e.preventDefault(); handleChange('logoUrl', ''); }} className="absolute -top-2 -right-2 bg-theme-danger text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 mx-auto text-theme-muted mb-2" />
                  <span className="text-xs font-bold text-theme-muted">Drag & Drop or Click to Upload</span>
                </>
              )}
            </div>
            <input type="url" value={settings?.logoUrl || ''} onChange={(e) => handleChange('logoUrl', e.target.value)} placeholder="Or paste image URL..." className="mt-3 w-full px-4 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-xs text-theme-primary focus:outline-none focus:border-theme-accent transition-colors" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Business Name</label>
            <input type="text" value={settings?.businessName || ''} onChange={(e) => handleChange('businessName', e.target.value)} className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Business Type</label>
            <select value={settings?.businessType || 'retail'} onChange={(e) => handleChange('businessType', e.target.value)} className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors cursor-pointer">
              {BUSINESS_PRESETS.map(preset => (
                <option key={preset.id} value={preset.id}>{preset.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Localization */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
          <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-theme-primary">Localization</h2>
            <p className="text-xs text-theme-muted">Currency, Language, and Regional Settings</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2 flex items-center gap-1"><Languages className="w-3 h-3" /> Language</label>
            <select value={settings?.language || 'English'} onChange={(e) => handleChange('language', e.target.value)} className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors cursor-pointer">
              <option value="English">English</option>
              <option value="Bengali">Bengali</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Currency Symbol</label>
            <input type="text" value={settings?.currency || '₹'} onChange={(e) => handleChange('currency', e.target.value)} className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2 flex items-center gap-1"><Percent className="w-3 h-3" /> Tax Label</label>
            <input type="text" value={settings?.taxLabel || 'GST'} onChange={(e) => handleChange('taxLabel', e.target.value)} className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors" />
          </div>
        </div>
      </div>

      {/* Invoice Defaults */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
          <div className="w-10 h-10 rounded-xl bg-theme-success/10 text-theme-success flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-theme-primary">Invoice Documents</h2>
            <p className="text-xs text-theme-muted">Prefix, Footer, and Digital Signature</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Invoice Prefix</label>
              <input type="text" value={settings?.invoicePrefix || 'INV-'} onChange={(e) => handleChange('invoicePrefix', e.target.value)} className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-success transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Digital Signature Image</label>
              <div 
                className={`relative border-2 border-dashed rounded-xl p-3 text-center transition-all ${isDragging ? 'border-theme-success bg-theme-success/5' : 'border-theme-border-soft bg-theme-surface/50 hover:bg-theme-surface'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={async (e) => { 
                  e.preventDefault(); 
                  setIsDragging(false); 
                  const f = e.dataTransfer.files[0]; 
                  if (f && f.type.startsWith('image/')) handleChange('signatureUrl', await compressImage(f)); 
                }}
              >
                <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files[0]; if (f && f.type.startsWith('image/')) handleChange('signatureUrl', await compressImage(f)); }} className="absolute inset-0 opacity-0 cursor-pointer" />
                {settings?.signatureUrl ? (
                  <div className="relative inline-block group">
                    <img src={settings.signatureUrl} alt="Signature" className="h-12 w-auto object-contain rounded-lg bg-white/10" />
                    <button onClick={(e) => { e.preventDefault(); handleChange('signatureUrl', ''); }} className="absolute -top-2 -right-2 bg-theme-danger text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-theme-muted flex items-center justify-center gap-2"><ImageIcon className="w-4 h-4" /> Upload Signature</span>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Global PDF Footer Text</label>
            <textarea value={settings?.pdfFooter || ''} onChange={(e) => handleChange('pdfFooter', e.target.value)} placeholder="Thank you for your business. Generated by BillQyro." rows={2} className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-success transition-colors resize-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessStudio;
