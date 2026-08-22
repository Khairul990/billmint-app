import React, { useState } from 'react';
import { Building2, Upload, Trash2, Globe, Languages, DollarSign, Percent, FileText, Image as ImageIcon, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { BUSINESS_PRESETS } from '../../config/businessPresets';

const BusinessStudio = ({ settings, onUpdate }) => {
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingSig, setIsDraggingSig] = useState(false);

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
      {/* 1. Brand Identity & Logo */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
          <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-theme-primary">Business Profile & Branding</h2>
            <p className="text-xs text-theme-muted">Your official business name, logo, and store category</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-theme-primary uppercase tracking-wider mb-1">Business Logo</label>
            <p className="text-[11px] text-theme-muted mb-2">Appears at the top of your printed invoices and customer payment links.</p>
            <div 
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${isDraggingLogo ? 'border-theme-accent bg-theme-accent/5' : 'border-theme-border-soft bg-theme-surface/50 hover:bg-theme-surface'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
              onDragLeave={() => setIsDraggingLogo(false)}
              onDrop={async (e) => { 
                e.preventDefault(); 
                setIsDraggingLogo(false); 
                const f = e.dataTransfer.files[0]; 
                if (f && f.type.startsWith('image/')) handleChange('logoUrl', await compressImage(f)); 
              }}
            >
              <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files[0]; if (f && f.type.startsWith('image/')) handleChange('logoUrl', await compressImage(f)); }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              {settings?.logoUrl ? (
                <div className="relative inline-block group">
                  <img src={settings.logoUrl} alt="Logo" className="h-16 w-auto object-contain rounded-lg border border-theme-border-soft bg-white p-1" />
                  <button onClick={(e) => { e.preventDefault(); handleChange('logoUrl', ''); }} className="absolute -top-2 -right-2 bg-theme-danger text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Remove Logo"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 mx-auto text-theme-muted mb-2" />
                  <span className="text-xs font-bold text-theme-muted block">Drag & drop your logo here or click to browse</span>
                  <span className="text-[10px] text-theme-muted/70 block mt-0.5">PNG, JPG, or WEBP up to 5MB</span>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-theme-primary uppercase tracking-wider mb-1">Business Name</label>
            <p className="text-[11px] text-theme-muted mb-2">The public trade name shown to customers.</p>
            <input 
              type="text" 
              value={settings?.businessName || ''} 
              onChange={(e) => handleChange('businessName', e.target.value)} 
              placeholder="e.g. Modern Tailors & Clothiers"
              className="w-full px-4 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-theme-primary uppercase tracking-wider mb-1">Owner / Manager Name</label>
            <p className="text-[11px] text-theme-muted mb-2">Authorized representative for receipts and signatures.</p>
            <input 
              type="text" 
              value={settings?.ownerName || ''} 
              onChange={(e) => handleChange('ownerName', e.target.value)} 
              placeholder="e.g. John Doe"
              className="w-full px-4 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-theme-primary uppercase tracking-wider mb-1">Business Type / Preset</label>
            <p className="text-[11px] text-theme-muted mb-2">Customizes invoice terminology and default options.</p>
            <select 
              value={settings?.businessType || 'retail'} 
              onChange={(e) => handleChange('businessType', e.target.value)} 
              className="w-full px-4 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors cursor-pointer"
            >
              {BUSINESS_PRESETS.map(preset => (
                <option key={preset.id} value={preset.id}>{preset.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-theme-primary uppercase tracking-wider mb-1">GSTIN / Tax ID Number</label>
            <p className="text-[11px] text-theme-muted mb-2">Optional government business registration or GST number.</p>
            <input 
              type="text" 
              value={settings?.gstNumber || ''} 
              onChange={(e) => handleChange('gstNumber', e.target.value)} 
              placeholder="e.g. 27AAAAA0000A1Z5"
              className="w-full px-4 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors" 
            />
          </div>
        </div>
      </div>

      {/* 2. Contact Information */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
          <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-theme-primary">Contact & Address</h2>
            <p className="text-xs text-theme-muted">Customer service phone, WhatsApp number, and store address</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[11px] font-bold text-theme-primary uppercase tracking-wider mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-theme-muted" /> Phone Number</label>
            <p className="text-[11px] text-theme-muted mb-2">Contact number shown on invoice header.</p>
            <input 
              type="tel" 
              value={settings?.phone || ''} 
              onChange={(e) => handleChange('phone', e.target.value)} 
              placeholder="+91 98765 43210"
              className="w-full px-4 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-theme-primary uppercase tracking-wider mb-1 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-theme-success" /> WhatsApp Number</label>
            <p className="text-[11px] text-theme-muted mb-2">Used for 1-click WhatsApp bill sharing.</p>
            <input 
              type="tel" 
              value={settings?.whatsapp || ''} 
              onChange={(e) => handleChange('whatsapp', e.target.value)} 
              placeholder="+91 98765 43210"
              className="w-full px-4 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-theme-primary uppercase tracking-wider mb-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-theme-muted" /> Business Email</label>
            <p className="text-[11px] text-theme-muted mb-2">Official email for digital copies and communication.</p>
            <input 
              type="email" 
              value={settings?.email || ''} 
              onChange={(e) => handleChange('email', e.target.value)} 
              placeholder="contact@yourbusiness.com"
              className="w-full px-4 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-theme-primary uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-theme-muted" /> Store / Office Address</label>
            <p className="text-[11px] text-theme-muted mb-2">Full address printed at the bottom of bills.</p>
            <input 
              type="text" 
              value={settings?.address || ''} 
              onChange={(e) => handleChange('address', e.target.value)} 
              placeholder="Shop #12, Market Road, City, State - PIN"
              className="w-full px-4 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors" 
            />
          </div>
        </div>
      </div>

      {/* 3. Regional & Currency Defaults */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
          <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-theme-primary">Regional & Currency Defaults</h2>
            <p className="text-xs text-theme-muted">Currency symbol, tax terminology, and default rates</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[11px] font-bold text-theme-primary uppercase tracking-wider mb-1 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-theme-muted" /> Currency Symbol</label>
            <p className="text-[11px] text-theme-muted mb-2">e.g. ₹, $, €, ৳, £</p>
            <input 
              type="text" 
              value={settings?.currency || '₹'} 
              onChange={(e) => handleChange('currency', e.target.value)} 
              className="w-full px-4 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors" 
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-theme-primary uppercase tracking-wider mb-1 flex items-center gap-1.5"><Percent className="w-3.5 h-3.5 text-theme-muted" /> Tax Label</label>
            <p className="text-[11px] text-theme-muted mb-2">e.g. GST, VAT, Sales Tax</p>
            <input 
              type="text" 
              value={settings?.taxLabel || 'GST'} 
              onChange={(e) => handleChange('taxLabel', e.target.value)} 
              className="w-full px-4 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors" 
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-theme-primary uppercase tracking-wider mb-1 flex items-center gap-1.5"><Languages className="w-3.5 h-3.5 text-theme-muted" /> Interface Language</label>
            <p className="text-[11px] text-theme-muted mb-2">Display language for UI</p>
            <select 
              value={settings?.language || 'English'} 
              onChange={(e) => handleChange('language', e.target.value)} 
              className="w-full px-4 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors cursor-pointer"
            >
              <option value="English">English</option>
              <option value="Bengali">Bengali</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Invoice Documents & Signatures */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
          <div className="w-10 h-10 rounded-xl bg-theme-success/10 text-theme-success flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-theme-primary">Invoice Documents & Signatures</h2>
            <p className="text-xs text-theme-muted">Prefix, payment terms, footer, and authorized signature</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[11px] font-bold text-theme-primary uppercase tracking-wider mb-1">Invoice Prefix</label>
            <p className="text-[11px] text-theme-muted mb-2">Prepended to invoice numbers (e.g. INV-1001).</p>
            <input 
              type="text" 
              value={settings?.invoicePrefix || 'INV-'} 
              onChange={(e) => handleChange('invoicePrefix', e.target.value)} 
              className="w-full px-4 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-success transition-colors" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-theme-primary uppercase tracking-wider mb-1">Digital Signature</label>
            <p className="text-[11px] text-theme-muted mb-2">Authorized signature graphic placed at bottom right of PDF.</p>
            <div 
              className={`relative border-2 border-dashed rounded-xl p-3 text-center transition-all ${isDraggingSig ? 'border-theme-success bg-theme-success/5' : 'border-theme-border-soft bg-theme-surface/50 hover:bg-theme-surface'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingSig(true); }}
              onDragLeave={() => setIsDraggingSig(false)}
              onDrop={async (e) => { 
                e.preventDefault(); 
                setIsDraggingSig(false); 
                const f = e.dataTransfer.files[0]; 
                if (f && f.type.startsWith('image/')) handleChange('signatureUrl', await compressImage(f)); 
              }}
            >
              <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files[0]; if (f && f.type.startsWith('image/')) handleChange('signatureUrl', await compressImage(f)); }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              {settings?.signatureUrl ? (
                <div className="relative inline-block group">
                  <img src={settings.signatureUrl} alt="Signature" className="h-12 w-auto object-contain rounded-lg bg-white/10" />
                  <button onClick={(e) => { e.preventDefault(); handleChange('signatureUrl', ''); }} className="absolute -top-2 -right-2 bg-theme-danger text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                </div>
              ) : (
                <span className="text-xs font-bold text-theme-muted flex items-center justify-center gap-2"><ImageIcon className="w-4 h-4" /> Upload Signature Image</span>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-theme-primary uppercase tracking-wider mb-1">Global PDF Footer & Thank-you Note</label>
            <p className="text-[11px] text-theme-muted mb-2">Custom message printed at the bottom of all generated invoices.</p>
            <textarea 
              value={settings?.pdfFooter || ''} 
              onChange={(e) => handleChange('pdfFooter', e.target.value)} 
              placeholder="Thank you for your business! For any questions, please contact us." 
              rows={2} 
              className="w-full px-4 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-success transition-colors resize-none" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessStudio;
