import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Lock, 
  FileSpreadsheet, 
  Palette,
  Eye,
  Crown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { saveSettings } from '../services/dbEngine';

const templates = [
  { id: 'classic', name: 'Classic (Default)', type: 'FREE', desc: 'Clean, professional layout for general business.', color: 'bg-theme-app' },
  { id: 'modern', name: 'Modern Dark', type: 'FREE', desc: 'Bold dark headers with crisp spacing.', color: 'bg-indigo-950' },
  { id: 'minimal', name: 'Minimalist B&W', type: 'FREE', desc: 'Ultra-clean black and white design.', color: 'bg-white' },
  { id: 'retail', name: 'Retail Shop', type: 'FREE', desc: 'Item-focused layout perfect for stores.', color: 'bg-yellow-50' },
  { id: 'professional', name: 'Premium Corporate', type: 'PRO', desc: 'High-end corporate style structure.', color: 'bg-blue-900' },
  { id: 'embroidery', name: 'Boutique / Tailor', type: 'PRO', desc: 'Highlights sizes and work types.', color: 'bg-pink-50' },
  { id: 'doctor', name: 'Clinic / Medical', type: 'PRO', desc: 'Includes patient/medical disclaimers.', color: 'bg-emerald-50' },
  { id: 'repair', name: 'Service & Repair', type: 'PRO', desc: 'Focuses on job notes and terms.', color: 'bg-orange-50' }
];

const PdfTemplateStudio = ({ businessSettings, setSettings, setCurrentTab, subscription }) => {
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const activeTemplate = businessSettings?.selectedPdfTemplate || 'classic';
  const isPremium = subscription?.status === 'premium';

  const handleApply = async (templateId, type) => {
    if (type === 'PRO' && !isPremium) {
      setCurrentTab('subscription');
      toast('Upgrade to Premium to unlock this template!', { icon: '👑' });
      return;
    }

    const updated = { ...businessSettings, selectedPdfTemplate: templateId };
    await saveSettings(updated);
    if (setSettings) setSettings(updated);
    toast.success('Template applied successfully!');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-theme-primary tracking-tight flex items-center gap-2">
            <Palette className="w-5 h-5 text-theme-accent" />
            PDF Template Studio
          </h2>
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-0.5">
            CUSTOMIZE YOUR INVOICE DESIGN
          </p>
        </div>
      </div>

      <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-6">
        <p className="text-sm font-semibold text-theme-muted mb-6">
          Select a layout for your PDF invoices and estimates. Free accounts include access to 4 templates.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((tpl) => {
            const isActive = activeTemplate === tpl.id;
            const isLocked = tpl.type === 'PRO' && !isPremium;

            return (
              <motion.div 
                key={tpl.id}
                whileHover={{ y: -4 }}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all flex flex-col ${
                  isActive ? 'border-theme-accent shadow-glow' : 'border-theme-border-soft hover:border-theme-accent/50'
                }`}
              >
                {/* Status Badges */}
                <div className="absolute top-3 left-3 z-10 flex gap-1">
                  {tpl.type === 'PRO' ? (
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded shadow-sm flex items-center gap-1">
                      <Crown className="w-3 h-3" /> PRO
                    </span>
                  ) : (
                    <span className="bg-theme-border-soft dark:bg-theme-surface text-theme-muted dark:text-theme-primary text-[9px] font-black uppercase px-2 py-1 rounded shadow-sm">
                      FREE
                    </span>
                  )}
                </div>

                {isActive && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="bg-theme-accent text-white rounded-full p-1 shadow-md">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                )}

                {/* Mockup Preview Area */}
                <div className={`h-40 w-full ${tpl.color} flex flex-col items-center justify-center p-4 relative`}>
                  {/* Abstract Invoice Shape */}
                  <div className="w-24 h-32 bg-white rounded shadow-sm border border-black/5 flex flex-col p-2">
                    <div className="w-full h-4 bg-theme-border-soft rounded-sm mb-2" />
                    <div className="w-1/2 h-2 bg-theme-app rounded-sm mb-4" />
                    <div className="w-full h-1 bg-theme-app mb-1" />
                    <div className="w-full h-1 bg-theme-app mb-1" />
                    <div className="w-full h-1 bg-theme-app mb-4" />
                    <div className="mt-auto w-1/3 h-3 bg-theme-accent/20 rounded-sm self-end" />
                  </div>
                  
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="bg-black/80 p-3 rounded-xl">
                        <Lock className="w-6 h-6 text-amber-400" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Details Area */}
                <div className="p-4 bg-theme-card flex flex-col flex-1 border-t border-theme-border-soft">
                  <h3 className="font-extrabold text-sm text-theme-primary mb-1">{tpl.name}</h3>
                  <p className="text-[10px] font-semibold text-theme-muted mb-4 line-clamp-2">{tpl.desc}</p>
                  
                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => handleApply(tpl.id, tpl.type)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isActive 
                          ? 'bg-emerald-500/10 text-emerald-600 cursor-default' 
                          : isLocked
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:scale-[1.02]'
                            : 'bg-theme-accent text-white shadow-md hover:scale-[1.02]'
                      }`}
                    >
                      {isActive ? (
                        <>Active Template</>
                      ) : isLocked ? (
                        <><Lock className="w-3.5 h-3.5" /> Unlock Pro</>
                      ) : (
                        <>Apply Template</>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PdfTemplateStudio;
