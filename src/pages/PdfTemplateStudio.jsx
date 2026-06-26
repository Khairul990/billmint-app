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
  X,
  Search,
  QrCode,
  Pen,
  Image,
  Sliders,
  RefreshCw,
  ArrowRight,
  Maximize,
  Minimize,
  Download,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { saveSettings } from '../services/dbEngine';
import { BUSINESS_PRESETS } from '../config/businessPresets';
import InvoicePreview from '../components/InvoicePreview';
import LazyPreview from '../components/LazyPreview';
import { getDemoInvoice } from '../utils/demoDataGenerator';


const templates = [
  { id: 'classic', name: 'Classic (Default)', type: 'FREE', desc: 'Clean, professional layout for general business.', color: 'bg-theme-app' },
  { id: 'modern', name: 'Modern Dark', type: 'FREE', desc: 'Bold dark headers with crisp spacing.', color: 'bg-indigo-950' },
  { id: 'minimal', name: 'Minimalist B&W', type: 'FREE', desc: 'Ultra-clean black and white design.', color: 'bg-white' },
  { id: 'retail', name: 'Retail Shop', type: 'FREE', desc: 'Item-focused layout perfect for stores.', color: 'bg-yellow-50' },
  { id: 'professional', name: 'Premium Corporate', type: 'PRO', desc: 'High-end corporate style structure.', color: 'bg-blue-900' },
  { id: 'embroidery', name: 'Boutique / Tailor', type: 'PRO', desc: 'Highlights sizes and work types.', color: 'bg-pink-50' },
  { id: 'doctor', name: 'Clinic / Medical', type: 'PRO', desc: 'Includes patient/medical disclaimers.', color: 'bg-emerald-50' },
  { id: 'repair', name: 'Service & Repair', type: 'PRO', desc: 'Focuses on job notes and terms.', color: 'bg-orange-50' },
  { id: 'executive', name: 'Executive Suite', type: 'PRO', desc: 'Premium two-column executive layout with letterhead.', color: 'bg-slate-900' },
  { id: 'corporate', name: 'Corporate Pro', type: 'PRO', desc: 'Ultra-formal corporate branding with watermark support.', color: 'bg-blue-950' },
  { id: 'saas', name: 'SaaS / Subscription', type: 'PRO', desc: 'Subscription-style invoice with plan details and auto-pay.', color: 'bg-violet-900' },
  { id: 'tailor', name: 'Tailor / Fashion', type: 'PRO', desc: 'Elegant fashion order slip with size chart and style notes.', color: 'bg-rose-50' },
  { id: 'teacher', name: 'Teacher / Fee Slip', type: 'PRO', desc: 'Fee receipt format for tuition and coaching centers.', color: 'bg-sky-50' },
  { id: 'medical', name: 'Medical / Hospital', type: 'PRO', desc: 'Hospital-grade invoice with insurance and patient fields.', color: 'bg-teal-50' }
];

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } }
};

const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } }
};

const templateTags = {
  classic: ['A4', 'Classic'],
  modern: ['A4', 'Modern'],
  minimal: ['Letter', 'Minimal'],
  retail: ['A5', 'Compact'],
  professional: ['A4', 'Premium'],
  embroidery: ['A5', 'Detail'],
  doctor: ['A4', 'Medical'],
  repair: ['A4', 'Workshop'],
  executive: ['A4', 'Executive'],
  corporate: ['A4', 'Corporate'],
  saas: ['A4', 'Subscription'],
  tailor: ['A5', 'Detail'],
  teacher: ['A4', 'Education'],
  medical: ['A4', 'Medical']
};

const templateFeatures = {
  classic: ['Logo Ready'],
  modern: ['Dark Mode'],
  minimal: ['B&W Print'],
  retail: ['Item Grid', 'Barcode'],
  professional: ['Watermark', 'Signature Line'],
  embroidery: ['Size Chart', 'Design No'],
  doctor: ['Disclaimer', 'Patient Info'],
  repair: ['Job Notes', 'Terms'],
  executive: ['Watermark', 'Signature Line', 'Letterhead'],
  corporate: ['Watermark', 'Seal', 'Signature Line'],
  saas: ['Subscription ID', 'Plan Details', 'Auto-Pay'],
  tailor: ['Size Chart', 'Design No', 'Fabric'],
  teacher: ['Student Info', 'Fee Breakdown'],
  medical: ['Patient Info', 'Insurance', 'Disclaimer']
};

const templateCategory = {
  classic: 'Classic',
  modern: 'Modern',
  minimal: 'Classic',
  retail: 'Business',
  professional: 'Professional',
  embroidery: 'Business',
  doctor: 'Professional',
  repair: 'Business',
  executive: 'Professional',
  corporate: 'Professional',
  saas: 'Modern',
  tailor: 'Business',
  teacher: 'Classic',
  medical: 'Professional'
};

const previewGradients = {
  classic: 'from-blue-400 to-blue-600',
  modern: 'from-indigo-800 to-purple-900',
  minimal: 'from-gray-100 to-gray-300',
  retail: 'from-yellow-300 to-amber-500',
  professional: 'from-slate-800 to-blue-900',
  embroidery: 'from-pink-300 to-rose-500',
  doctor: 'from-emerald-400 to-teal-600',
  repair: 'from-orange-400 to-red-500',
  executive: 'from-slate-700 to-slate-900',
  corporate: 'from-blue-800 to-indigo-900',
  saas: 'from-violet-500 to-purple-700',
  tailor: 'from-rose-300 to-pink-500',
  teacher: 'from-sky-400 to-cyan-600',
  medical: 'from-teal-400 to-emerald-600'
};

const templateStyles = {
  classic: 'Classic',
  modern: 'Modern',
  minimal: 'Minimal',
  retail: 'Business',
  professional: 'Professional',
  embroidery: 'Boutique',
  doctor: 'Medical',
  repair: 'Service',
  executive: 'Executive',
  corporate: 'Corporate',
  saas: 'SaaS',
  tailor: 'Fashion',
  teacher: 'Education',
  medical: 'Medical'
};

const brandPresetIcons = {
  retail: 'Store',
  grocery: 'Store',
  service: 'Wrench',
  doctor: 'Stethoscope',
  teacher: 'GraduationCap',
  tailor: 'Scissors',
  embroidery: 'Palette',
  freelance: 'Briefcase',
  restaurant: 'Coffee',
  custom: 'Settings',
  billing_only: 'FileText'
};

const PdfTemplateStudio = ({ businessSettings, setSettings, setCurrentTab, subscription }) => {
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [useAnimId, setUseAnimId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [enableWatermark, setEnableWatermark] = useState(false);
  const [signaturePlacement, setSignaturePlacement] = useState('none');
  const [qrPlacement, setQrPlacement] = useState('none');
  const [previewSize, setPreviewSize] = useState('A4');
  const [showOptions, setShowOptions] = useState(false);
  const [showBrandPresets, setShowBrandPresets] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);

  const activeTemplate = businessSettings?.selectedPdfTemplate || 'classic';
  const isPremium = subscription?.status === 'premium';
  const categories = ['All', 'Classic', 'Modern', 'Business', 'Professional'];

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = filterCategory === 'All' || templateCategory[t.id] === filterCategory;
    const matchesSearch = searchQuery === '' || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleApply = async (templateId, type) => {
    if (type === 'PRO' && !isPremium) {
      setCurrentTab('subscription');
      toast('Upgrade to Premium to unlock this template!', { icon: '👑' });
      return;
    }

    const updated = { ...businessSettings, selectedPdfTemplate: templateId };
    if (enableWatermark) updated.pdfWatermark = true;
    if (signaturePlacement !== 'none') updated.pdfSignaturePlacement = signaturePlacement;
    if (qrPlacement !== 'none') updated.pdfQrPlacement = qrPlacement;
    await saveSettings(updated);
    if (setSettings) setSettings(updated);
    toast.success('Template applied successfully!');
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.id);
    const presetCategories = {
      retail: 'Business',
      grocery: 'Business',
      service: 'Business',
      doctor: 'Professional',
      teacher: 'Classic',
      tailor: 'Business',
      embroidery: 'Business',
      freelance: 'Professional',
      restaurant: 'Business',
      custom: 'All',
      billing_only: 'Classic'
    };
    const targetCat = presetCategories[preset.id] || 'All';
    setFilterCategory(targetCat);
    toast.success(`Showing ${preset.label} templates`);
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-24">
      {/* Back to Settings Button */}
      {setCurrentTab && (
        <button
          onClick={() => setCurrentTab('settings')}
          className="btn-premium flex items-center gap-2 px-4 py-2 bg-theme-surface border border-theme-border-soft hover:bg-theme-app text-theme-primary rounded-xl font-bold text-xs mb-4 shadow-sm w-fit transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-theme-muted" /> Back to Settings Studio
        </button>
      )}

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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-theme-card border border-theme-border-soft text-theme-primary text-sm font-semibold placeholder:text-theme-muted/60 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/30 transition-all input-premium"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary">
            <X className="w-4 h-4" />
          </button>
        )}
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

      {/* Options Toggle */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${showOptions ? 'bg-theme-accent text-white shadow-md' : 'bg-theme-card border border-theme-border-soft text-theme-muted hover:border-theme-accent/50'}`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Design Options
          <motion.span animate={{ rotate: showOptions ? 180 : 0 }}><ArrowRight className="w-3 h-3" /></motion.span>
        </button>
        <button
          onClick={() => setShowBrandPresets(!showBrandPresets)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${showBrandPresets ? 'bg-theme-accent text-white shadow-md' : 'bg-theme-card border border-theme-border-soft text-theme-muted hover:border-theme-accent/50'}`}
        >
          <Image className="w-3.5 h-3.5" />
          Brand Presets
          <motion.span animate={{ rotate: showBrandPresets ? 180 : 0 }}><ArrowRight className="w-3 h-3" /></motion.span>
        </button>
      </div>

      {/* Collapsible Design Options */}
      {showOptions && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-theme-card border border-theme-border-soft rounded-2xl p-5 space-y-4 glass">
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-extrabold text-theme-primary uppercase tracking-wider">Invoice Design Options</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Watermark Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-theme-app border border-theme-border-soft">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-theme-accent/10 flex items-center justify-center">
                  <Pen className="w-4 h-4 text-theme-accent" />
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-primary">Watermark</p>
                  <p className="text-[9px] text-theme-muted font-medium">Add watermark to PDF</p>
                </div>
              </div>
              <button
                onClick={() => setEnableWatermark(!enableWatermark)}
                className={`relative w-10 h-5 rounded-full transition-all ${enableWatermark ? 'bg-theme-accent' : 'bg-theme-border-soft'}`}
              >
                <motion.div animate={{ x: enableWatermark ? 20 : 2 }} className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow" />
              </button>
            </div>

            {/* Signature Placement */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-theme-app border border-theme-border-soft">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-theme-accent/10 flex items-center justify-center">
                  <Pen className="w-4 h-4 text-theme-accent" />
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-primary">Signature Area</p>
                  <p className="text-[9px] text-theme-muted font-medium">Placement option</p>
                </div>
              </div>
              <select
                value={signaturePlacement}
                onChange={e => setSignaturePlacement(e.target.value)}
                className="text-[10px] font-bold bg-theme-card border border-theme-border-soft rounded-lg px-2 py-1.5 text-theme-primary focus:outline-none focus:border-theme-accent"
              >
                <option value="none">None</option>
                <option value="bottom">Bottom</option>
                <option value="right">Right Side</option>
                <option value="left">Left Side</option>
              </select>
            </div>

            {/* QR Code Placement */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-theme-app border border-theme-border-soft">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-theme-accent/10 flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-theme-accent" />
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-primary">QR Code</p>
                  <p className="text-[9px] text-theme-muted font-medium">Payment QR placement</p>
                </div>
              </div>
              <select
                value={qrPlacement}
                onChange={e => setQrPlacement(e.target.value)}
                className="text-[10px] font-bold bg-theme-card border border-theme-border-soft rounded-lg px-2 py-1.5 text-theme-primary focus:outline-none focus:border-theme-accent"
              >
                <option value="none">None</option>
                <option value="header">Header</option>
                <option value="footer">Footer</option>
                <option value="right">Right Side</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Collapsible Brand Presets */}
      {showBrandPresets && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-theme-card border border-theme-border-soft rounded-2xl p-5 space-y-4 glass">
          <div className="flex items-center gap-2 mb-1">
            <Image className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-extrabold text-theme-primary uppercase tracking-wider">Brand Presets</span>
            <span className="text-[8px] text-theme-muted font-bold ml-auto">Select your business type for tailored templates</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {BUSINESS_PRESETS.filter(p => p.id !== 'billing_only').slice(0, 10).map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.03] ${
                  selectedPreset === preset.id
                    ? 'bg-theme-accent/10 border-theme-accent text-theme-accent'
                    : 'bg-theme-app border-theme-border-soft text-theme-muted hover:border-theme-accent/50'
                }`}
              >
                <p className="text-[10px] font-extrabold text-theme-primary truncate">{preset.label}</p>
                <p className="text-[7px] text-theme-muted font-medium mt-0.5 line-clamp-1">{preset.shortDesc}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-theme-muted">
            Select a layout for your PDF invoices and estimates. Free accounts include access to 4 templates.
          </p>
          <div className="hidden md:flex items-center gap-1 bg-theme-app rounded-lg p-0.5">
            <button
              onClick={() => setPreviewSize('A4')}
              className={`px-3 py-1.5 rounded-md text-[9px] font-bold transition-all ${previewSize === 'A4' ? 'bg-theme-accent text-white shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}
            >
              <Maximize className="w-3 h-3 inline mr-1" />A4
            </button>
            <button
              onClick={() => setPreviewSize('A5')}
              className={`px-3 py-1.5 rounded-md text-[9px] font-bold transition-all ${previewSize === 'A5' ? 'bg-theme-accent text-white shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}
            >
              <Minimize className="w-3 h-3 inline mr-1" />A5
            </button>
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-theme-muted font-semibold">No templates matching your search.</p>
            <button onClick={() => { setSearchQuery(''); setFilterCategory('All'); }} className="mt-2 text-xs text-theme-accent font-bold hover:underline flex items-center gap-1 justify-center">
              <RefreshCw className="w-3 h-3" /> Reset filters
            </button>
          </div>
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
                <div className={`h-40 w-full bg-gradient-to-br ${previewGradients[tpl.id] || 'from-gray-400 to-gray-600'} flex items-center justify-center relative overflow-hidden`}>
                  <LazyPreview fallback={<div className="text-white/60 text-[10px] font-bold uppercase tracking-widest animate-pulse">Loading {tpl.name}...</div>}>
                    <div className="w-[800px] h-[1000px] transform origin-top-left scale-[0.35] lg:scale-[0.4] pointer-events-none mt-20 ml-20 bg-white shadow-xl">
                      <InvoicePreview invoice={getDemoInvoice(businessSettings?.businessCategory)} businessSettings={{...businessSettings, selectedPdfTemplate: tpl.id}} />
                    </div>
                  </LazyPreview>
                  
                  {enableWatermark && tpl.type === 'PRO' && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <span className="text-black/10 text-[32px] font-black uppercase tracking-[0.3em] -rotate-30 select-none">Watermark</span>
                    </div>
                  )}
                  
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

      {/* Live Invoice Preview Modal */}
      {previewTemplate && (() => {
        const tpl = templates.find(t => t.id === previewTemplate);
        if (!tpl) return null;

                return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4" onClick={() => setPreviewTemplate(null)}>
            <div className="bg-theme-card rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl border border-theme-border-soft" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-theme-border-soft sticky top-0 bg-theme-card z-10 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <h3 className="font-extrabold text-theme-primary text-sm">{tpl.name} Preview</h3>
                  <span className="text-[9px] font-bold bg-theme-accent/10 text-theme-accent px-2 py-0.5 rounded-full border border-theme-accent/20">Live Preview</span>
                </div>
                <button onClick={() => setPreviewTemplate(null)} className="p-2 rounded-xl hover:bg-theme-app text-theme-muted hover:text-theme-primary transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Invoice Preview */}
              <div className="p-2 md:p-4 lg:p-6">
                <div className="transform scale-[0.85] md:scale-[0.9] lg:scale-100 origin-top">
                  <InvoicePreview invoice={getDemoInvoice(businessSettings?.businessCategory)} businessSettings={businessSettings} />
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
