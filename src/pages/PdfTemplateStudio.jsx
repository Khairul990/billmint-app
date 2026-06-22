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
  classic: 'General',
  modern: 'General',
  minimal: 'General',
  retail: 'Retail',
  professional: 'Corporate',
  embroidery: 'Fashion',
  doctor: 'Medical',
  repair: 'Service'
};

const PdfTemplateStudio = ({ businessSettings, setSettings, setCurrentTab, subscription }) => {
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const activeTemplate = businessSettings?.selectedPdfTemplate || 'classic';
  const isPremium = subscription?.status === 'premium';
  const categories = ['All', 'General', 'Retail', 'Corporate', 'Fashion', 'Medical', 'Service'];

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

                {/* Template Tag Badges */}
                <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1">
                  {tags.map(tag => (
                    <span key={tag} className="bg-black/50 backdrop-blur-sm text-white text-[7px] font-bold uppercase px-1.5 py-0.5 rounded border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>

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
                      onClick={() => handleApply(tpl.id, tpl.type)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 btn-premium ${
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
              <div className={`h-56 w-full ${tpl.color} flex items-center justify-center p-6 relative`}>
                <div className="w-40 h-48 bg-white rounded shadow-md border border-black/5 flex flex-col p-3">
                  <div className="w-full h-5 bg-theme-border-soft rounded-sm mb-2" />
                  <div className="w-2/3 h-3 bg-theme-app rounded-sm mb-5" />
                  <div className="w-full h-1.5 bg-theme-app mb-1.5" />
                  <div className="w-full h-1.5 bg-theme-app mb-1.5" />
                  <div className="w-full h-1.5 bg-theme-app mb-1.5" />
                  <div className="w-3/4 h-1.5 bg-theme-app mb-5" />
                  <div className="mt-auto w-1/2 h-4 bg-theme-accent/20 rounded-sm self-end" />
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
