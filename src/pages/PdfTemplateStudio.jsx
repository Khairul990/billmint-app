import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Lock, 
  FileSpreadsheet, 
  Palette,
  Eye,
  Crown,
  FileText,
  Tag,
  Layers,
  Star,
  X
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

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

const templateTags = {
  classic: ['A4', 'Classic'],
  modern: ['A4', 'Modern'],
  minimal: ['Letter', 'Minimal'],
  retail: ['A5', 'Compact'],
  professional: ['A4', 'Premium'],
  embroidery: ['A5', 'Detail'],
  doctor: ['A4', 'Medical'],
  repair: ['A4', 'Workshop']
};

const templateFeatures = {
  classic: ['Logo Ready'],
  modern: ['Dark Mode'],
  minimal: ['B&W Print'],
  retail: ['Item Grid', 'Barcode'],
  professional: ['Watermark', 'Signature Line'],
  embroidery: ['Size Chart', 'Design No'],
  doctor: ['Disclaimer', 'Patient Info'],
  repair: ['Job Notes', 'Terms']
};

const templateCategory = {
  classic: 'Classic',
  modern: 'Modern',
  minimal: 'Classic',
  retail: 'Business',
  professional: 'Professional',
  embroidery: 'Business',
  doctor: 'Professional',
  repair: 'Business'
};

const previewGradients = {
  classic: 'from-blue-400 to-blue-600',
  modern: 'from-indigo-800 to-purple-900',
  minimal: 'from-gray-100 to-gray-300',
  retail: 'from-yellow-300 to-amber-500',
  professional: 'from-slate-800 to-blue-900',
  embroidery: 'from-pink-300 to-rose-500',
  doctor: 'from-emerald-400 to-teal-600',
  repair: 'from-orange-400 to-red-500'
};

const templateStyles = {
  classic: 'Classic',
  modern: 'Modern',
  minimal: 'Minimal',
  retail: 'Business',
  professional: 'Professional',
  embroidery: 'Boutique',
  doctor: 'Medical',
  repair: 'Service'
};

const PdfTemplateStudio = ({ businessSettings, setSettings, setCurrentTab, subscription }) => {
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [useAnimId, setUseAnimId] = useState(null);
  const activeTemplate = businessSettings?.selectedPdfTemplate || 'classic';
  const isPremium = subscription?.status === 'premium';
  const categories = ['All', 'Classic', 'Modern', 'Business', 'Professional'];

  const filteredTemplates = filterCategory === 'All'
    ? templates
    : templates.filter(t => templateCategory[t.id] === filterCategory);

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
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 section-header">
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

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all chip-premium ${
              filterCategory === cat 
                ? 'bg-theme-accent text-white shadow-md' 
                : 'bg-theme-app dark:bg-theme-surface text-theme-muted hover:bg-theme-card border border-theme-border-soft'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-6">
        <p className="text-sm font-semibold text-theme-muted mb-6">
          Select a layout for your PDF invoices and estimates. Free accounts include access to 4 templates.
        </p>

        {filteredTemplates.length === 0 ? (
          <p className="text-sm text-theme-muted text-center py-12 font-semibold">No templates in this category yet.</p>
        ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((tpl) => {
            const isActive = activeTemplate === tpl.id;
            const isLocked = tpl.type === 'PRO' && !isPremium;
            const tags = templateTags[tpl.id] || [];
            const features = templateFeatures[tpl.id] || [];

            return (
              <motion.div 
                key={tpl.id}
                variants={staggerItem}
                whileHover={{ y: -6, scale: 1.02 }}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all flex flex-col card-premium ${
                  isActive ? 'border-theme-accent shadow-glow' : 'border-theme-border-soft hover:border-theme-accent/50'
                }`}
              >
                {/* Status Badges */}
                <div className="absolute top-3 left-3 z-10 flex gap-1">
                  {tpl.type === 'PRO' ? (
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded shadow-sm flex items-center gap-1 badge-premium">
                      <Crown className="w-3 h-3" /> PRO
                    </span>
                  ) : (
                    <span className="bg-theme-border-soft dark:bg-theme-surface text-theme-muted dark:text-theme-primary text-[9px] font-black uppercase px-2 py-1 rounded shadow-sm badge-premium">
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

                {/* Size + Style Badges */}
                <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1">
                  {tags.filter(t => t === 'A4' || t === 'A5' || t === 'Letter').map(sz => (
                    <span key={sz} className="bg-black/60 backdrop-blur-sm text-white text-[7px] font-bold uppercase px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-1">
                      <FileSpreadsheet className="w-2 h-2" /> {sz}
                    </span>
                  ))}
                  <span className={`bg-black/50 backdrop-blur-sm text-white text-[7px] font-bold uppercase px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-1 ${templateStyles[tpl.id] === 'Professional' ? 'border-amber-300/30' : ''}`}>
                    <Palette className="w-2 h-2" /> {templateStyles[tpl.id]}
                  </span>
                </div>

                {tpl.id === 'classic' && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                      <Star className="w-2.5 h-2.5" /> Featured
                    </span>
                  </div>
                )}

                {/* Mockup Preview Area */}
                <div className={`h-40 w-full bg-gradient-to-br ${previewGradients[tpl.id] || 'from-gray-400 to-gray-600'} flex flex-col items-center justify-center p-4 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-2 shadow-lg border border-white/20">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white font-black text-xs tracking-wider text-center drop-shadow-lg">{tpl.name}</span>
                    <span className="text-white/60 text-[8px] font-bold mt-1 uppercase tracking-widest">Template</span>
                  </div>
                  
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-20">
                      <div className="bg-black/80 p-3 rounded-xl">
                        <Lock className="w-6 h-6 text-amber-400" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Details Area */}
                <div className="p-4 bg-theme-card flex flex-col flex-1 border-t border-theme-border-soft">
                  <h3 className="font-extrabold text-sm text-theme-primary mb-1">{tpl.name}</h3>
                  <p className="text-[10px] font-semibold text-theme-muted mb-2 line-clamp-2">{tpl.desc}</p>

                  {/* Feature Badges */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {features.map(feat => (
                      <span key={feat} className="text-[7px] font-bold bg-theme-accent/10 text-theme-accent px-1.5 py-0.5 rounded border border-theme-accent/20 flex items-center gap-1">
                        <Star className="w-2 h-2" /> {feat}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => { handleApply(tpl.id, tpl.type); setUseAnimId(tpl.id); setTimeout(() => setUseAnimId(null), 1500); }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 btn-premium ${
                        isActive 
                          ? 'bg-emerald-500/10 text-emerald-600 cursor-default' 
                          : isLocked
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:scale-[1.02]'
                            : 'bg-theme-accent text-white shadow-md hover:scale-[1.02]'
                      }`}
                    >
                      {isActive ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Active</>
                      ) : isLocked ? (
                        <><Lock className="w-3.5 h-3.5" /> Unlock Pro</>
                      ) : useAnimId === tpl.id ? (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Applied!</motion.span>
                      ) : (
                        <>Use Template</>
                      )}
                    </button>
                    {!isLocked && (
                      <button
                        onClick={() => setPreviewTemplate(tpl.id)}
                        className="py-2 px-3 rounded-xl text-xs font-bold transition-all bg-theme-app border border-theme-border-soft text-theme-muted hover:bg-theme-accent hover:text-white flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (() => {
        const tpl = templates.find(t => t.id === previewTemplate);
        if (!tpl) return null;
        const tags = templateTags[tpl.id] || [];
        const features = templateFeatures[tpl.id] || [];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setPreviewTemplate(null)}>
            <div className="bg-theme-card rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-theme-border-soft" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-theme-border-soft">
                <h3 className="font-extrabold text-theme-primary text-sm">{tpl.name}</h3>
                <button onClick={() => setPreviewTemplate(null)} className="p-1 rounded-lg hover:bg-theme-app text-theme-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className={`h-56 w-full bg-gradient-to-br ${previewGradients[tpl.id] || 'from-gray-400 to-gray-600'} flex items-center justify-center p-6 relative`}>
                <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 shadow-xl border border-white/20">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-white font-black text-lg tracking-wider text-center drop-shadow-lg">{tpl.name}</span>
                  <span className="text-white/60 text-[9px] font-bold mt-1 uppercase tracking-widest">PDF Template</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-theme-muted font-semibold">{tpl.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag} className="text-[9px] font-bold bg-theme-app px-2 py-1 rounded-full text-theme-muted border border-theme-border-soft flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" /> {tag}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {features.map(feat => (
                    <span key={feat} className="text-[9px] font-bold bg-theme-accent/10 text-theme-accent px-2 py-1 rounded-full border border-theme-accent/20 flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5" /> {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </motion.div>
  );
};

export default PdfTemplateStudio;
