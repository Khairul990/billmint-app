import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Store,
  Scissors,
  Stethoscope,
  Wrench,
  Cpu,
  Smartphone,
  ShoppingBag,
  CheckCircle2,
  Lock,
  FileText,
  Star,
  Sparkles,
  Eye,
  X,
  ExternalLink,
  Clock,
  Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BUSINESS_PACKS = [
  {
    id: 'retail',
    name: 'General Store / Retail',
    type: 'free',
    icon: Store,
    desc: 'Perfect for minimarts, groceries, and standard shops.',
    color: 'bg-theme-success/10 text-theme-success dark:bg-theme-success/20',
    settings: {
      businessCategory: 'retail',
      defaultBillType: 'retail',
      selectedPdfTemplate: 'classic',
      selectedLiveLinkTemplate: 'retail'
    },
    features: ['Standard Columns', 'Retail Checkout Link', 'Variant & Discount'],
    templateCounts: { pdf: 3, live: 2 }
  },
  {
    id: 'embroidery',
    name: 'Embroidery Studio',
    type: 'free',
    icon: Scissors,
    desc: 'Optimized for stitching, design numbers, and work types.',
    color: 'bg-theme-danger/10 text-theme-danger dark:bg-theme-danger/20',
    settings: {
      businessCategory: 'embroidery',
      defaultBillType: 'embroidery',
      selectedPdfTemplate: 'modern',
      selectedLiveLinkTemplate: 'classic'
    },
    features: ['Design No & Work Type', 'Modern PDF Layout', 'Simple Payment Link'],
    templateCounts: { pdf: 2, live: 1 }
  },
  {
    id: 'repair',
    name: 'Service & Repair',
    type: 'pro',
    icon: Wrench,
    desc: 'Ideal for workshops, mechanics, and appliance repair.',
    color: 'bg-theme-surface border border-theme-border-soft text-theme-secondary',
    settings: {
      businessCategory: 'repair',
      defaultBillType: 'repair',
      selectedPdfTemplate: 'repair',
      selectedLiveLinkTemplate: 'repair'
    },
    features: ['Problem Details Col', 'Labour + Parts', 'Workshop Live Link'],
    templateCounts: { pdf: 3, live: 2 }
  },
  {
    id: 'clinic',
    name: 'Clinic & Medical',
    type: 'pro',
    icon: Stethoscope,
    desc: 'Clean layouts with automatic medical disclaimers.',
    color: 'bg-theme-accent/20 text-theme-accent dark:bg-theme-accent/30',
    settings: {
      businessCategory: 'clinic',
      defaultBillType: 'custom',
      selectedPdfTemplate: 'doctor',
      selectedLiveLinkTemplate: 'clinic'
    },
    features: ['Medical Disclaimer', 'Clinic PDF', 'Clean Patient Link'],
    templateCounts: { pdf: 2, live: 3 }
  },
  {
    id: 'tailor',
    name: 'Boutique / Tailor',
    type: 'pro',
    icon: ShoppingBag,
    desc: 'Elegant templates for fashion and custom apparel.',
    color: 'bg-theme-accent/10 text-theme-accent dark:bg-theme-accent/20',
    settings: {
      businessCategory: 'tailor',
      defaultBillType: 'retail',
      selectedPdfTemplate: 'boutique',
      selectedLiveLinkTemplate: 'boutique'
    },
    features: ['Elegant Branding', 'Boutique PDF', 'Premium Payment View'],
    templateCounts: { pdf: 3, live: 3 }
  },
  {
    id: 'electronics',
    name: 'Electronics Store',
    type: 'free',
    icon: Cpu,
    desc: 'Optimized for devices, serial numbers, and warranties.',
    color: 'bg-theme-success/10 text-theme-success dark:bg-theme-success/20',
    settings: {
      businessCategory: 'electronics',
      defaultBillType: 'retail',
      selectedPdfTemplate: 'modern',
      selectedLiveLinkTemplate: 'modern'
    },
    features: ['Card Layout', 'Variant Columns', 'Modern Link'],
    templateCounts: { pdf: 2, live: 2 }
  },
  {
    id: 'mobile',
    name: 'Mobile Shop',
    type: 'free',
    icon: Smartphone,
    desc: 'Fast, mobile-first design for quick counter sales.',
    color: 'bg-theme-accent/10 text-theme-accent dark:bg-theme-accent/20',
    settings: {
      businessCategory: 'mobile',
      defaultBillType: 'retail',
      selectedPdfTemplate: 'classic',
      selectedLiveLinkTemplate: 'mobile'
    },
    features: ['Mobile First Link', 'Fast Checkout', 'Standard PDF'],
    templateCounts: { pdf: 3, live: 1 }
  }
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

const TemplateMarketplace = ({ settings, onSaveSettings, subscription, setCurrentTab }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [previewPack, setPreviewPack] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);
  
  const isProUser = subscription?.status === 'active';
  const currentPackId = settings?.businessCategory || 'retail';

  const categories = ['All', 'Retail', 'Fashion', 'Service', 'Medical', 'Electronics'];

  const handleApplyPack = async (pack) => {
    if (pack.type === 'pro' && !isProUser) {
      toast.error('This is a Premium Business Pack. Please upgrade to unlock.');
      if (setCurrentTab) setCurrentTab('subscription');
      return;
    }

    const updatedSettings = {
      ...settings,
      businessCategory: pack.settings.businessCategory,
      invoicePreferences: {
        ...(settings.invoicePreferences || {}),
        defaultBillType: pack.settings.defaultBillType
      },
      selectedPdfTemplate: pack.settings.selectedPdfTemplate,
      customerLiveLinkSettings: {
        ...(settings.customerLiveLinkSettings || {}),
        selectedLiveLinkTemplate: pack.settings.selectedLiveLinkTemplate
      }
    };

    if (onSaveSettings) {
      await onSaveSettings(updatedSettings);
      toast.success(`${pack.name} Pack applied successfully!`);
    }
  };

  const filteredPacks = BUSINESS_PACKS.filter(pack => {
    const matchesSearch = pack.name.toLowerCase().includes(searchQuery.toLowerCase()) || pack.desc.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Retail' && ['retail', 'electronics', 'mobile'].includes(pack.id)) return true;
    if (activeCategory === 'Service' && pack.id === 'repair') return true;
    if (activeCategory === 'Fashion' && ['embroidery', 'tailor'].includes(pack.id)) return true;
    if (activeCategory === 'Medical' && pack.id === 'clinic') return true;
    if (activeCategory === 'Electronics' && pack.id === 'electronics') return true;
    return false;
  });

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="p-4 md:p-8 w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-theme-accent/10 to-transparent dark:from-theme-accent/5 p-6 rounded-3xl border border-theme-border-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4 section-header">
        <div>
          <h1 className="text-2xl font-black text-theme-primary tracking-tight">Template Marketplace</h1>
          <p className="text-xs text-theme-muted font-bold mt-1">One-click business starter packs for perfect billing & links.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all chip-premium ${
                activeCategory === cat 
                  ? 'bg-theme-accent text-white shadow-md' 
                  : 'bg-theme-app dark:bg-theme-surface text-theme-muted hover:bg-theme-card border border-theme-border-soft'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="w-full md:w-64 relative">
          <input
            type="text"
            placeholder="Search packs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-theme-card border border-theme-border-soft rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-theme-accent/50 input-premium"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="bg-theme-card rounded-3xl p-6 border-2 border-theme-border-soft animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-theme-app" />
                <div className="w-14 h-5 rounded-full bg-theme-app" />
              </div>
              <div className="h-5 w-3/4 bg-theme-app rounded mb-2" />
              <div className="h-3 w-full bg-theme-app rounded mb-6" />
              <div className="space-y-2 mb-6">
                <div className="h-3 w-2/3 bg-theme-app rounded" />
                <div className="h-3 w-1/2 bg-theme-app rounded" />
                <div className="h-3 w-3/4 bg-theme-app rounded" />
              </div>
              <div className="h-12 w-full bg-theme-app rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPacks.map((pack, index) => {
            const isActive = currentPackId === pack.id;
            const isLocked = pack.type === 'pro' && !isProUser;
            const Icon = pack.icon;
            const tc = pack.templateCounts || { pdf: 2, live: 2 };

            return (
              <motion.div 
                key={pack.id}
                variants={staggerItem}
                whileHover={{ scale: 1.02, y: -4 }}
                className={`bg-theme-card rounded-3xl p-6 border-2 transition-all duration-300 flex flex-col justify-between card-premium relative ${
                  isActive 
                    ? 'border-theme-accent shadow-premium scale-[1.02]' 
                    : 'border-theme-border-soft hover:border-theme-accent/40 shadow-sm'
                }`}
              >
                {/* Featured Badge */}
                {index === 0 && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-amber-500/30 flex items-center gap-1 badge-premium">
                      <Star className="w-2.5 h-2.5" /> Featured
                    </span>
                  </div>
                )}

                {pack.type === 'pro' && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-3xl" />
                )}
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${pack.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2">
                      {pack.type === 'free' ? (
                        <span className="bg-theme-success/10 text-theme-success border border-theme-success/20 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full badge-premium">FREE</span>
                      ) : (
                        <span className="bg-theme-warning/10 text-theme-warning border border-theme-warning/20 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1 shadow-sm badge-premium">
                          <Lock className="w-3 h-3" /> PRO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Template Count Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-[8px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1 badge-premium">
                      <FileText className="w-2.5 h-2.5" /> PDF: {tc.pdf}
                    </span>
                    <span className="text-[8px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 badge-premium">
                      <Globe className="w-2.5 h-2.5" /> Live: {tc.live}
                    </span>
                    <span className="text-[8px] font-bold bg-theme-app px-2 py-0.5 rounded-full text-theme-muted border border-theme-border-soft flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5" /> {pack.features.length} Features
                    </span>
                    {pack.type === 'pro' ? (
                      <span className="text-[8px] font-bold bg-amber-400/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5" /> Premium
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-400/20 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Starter
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-lg text-theme-primary mb-1">{pack.name}</h3>
                  <p className="text-[11px] text-theme-muted font-semibold mb-6">{pack.desc}</p>

                  <div className="space-y-2 mb-6">
                    <p className="text-[9px] uppercase tracking-widest font-black text-theme-muted">Includes</p>
                    {pack.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-theme-secondary">
                        <CheckCircle2 className="w-3.5 h-3.5 text-theme-accent" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewPack(pack)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 btn-premium border border-theme-border-soft bg-theme-app dark:bg-theme-surface hover:bg-theme-card text-theme-primary`}
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                  <button
                    onClick={() => handleApplyPack(pack)}
                    className={`flex-[2] py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 btn-premium ${
                      isActive 
                        ? 'bg-theme-accent/10 text-theme-accent cursor-default border border-theme-accent/20' 
                        : isLocked
                          ? 'bg-theme-warning/10 text-theme-warning hover:bg-theme-warning/20 border border-theme-warning/30'
                          : 'bg-theme-app dark:bg-theme-surface hover:bg-theme-accent hover:text-white border border-theme-border-soft text-theme-primary'
                    }`}
                  >
                    {isActive ? (
                      <>Active <CheckCircle2 className="w-4 h-4" /></>
                    ) : isLocked ? (
                      <>Unlock</>
                    ) : (
                      'Apply Pack'
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Preview Modal */}
      {previewPack && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewPack(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-theme-card rounded-3xl border border-theme-border-soft shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${previewPack.color}`}>
                  <previewPack.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-theme-primary">{previewPack.name}</h3>
                  <p className="text-[10px] text-theme-muted font-semibold">{previewPack.desc}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewPack(null)}
                className="w-8 h-8 rounded-xl bg-theme-app border border-theme-border-soft flex items-center justify-center hover:bg-theme-danger/10 hover:border-theme-danger/30 transition-all"
              >
                <X className="w-4 h-4 text-theme-muted" />
              </button>
            </div>

            {/* Large Preview Card */}
            <div className="bg-theme-app rounded-2xl border border-theme-border-soft p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${previewPack.color}`}>
                  <previewPack.icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-extrabold text-base text-theme-primary">{previewPack.name}</h4>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full badge-premium ${
                      previewPack.type === 'free'
                        ? 'bg-theme-success/10 text-theme-success border border-theme-success/20'
                        : 'bg-theme-warning/10 text-theme-warning border border-theme-warning/20'
                    }`}>
                      {previewPack.type === 'free' ? 'FREE' : 'PRO'}
                    </span>
                  </div>
                  <p className="text-[11px] text-theme-muted font-semibold">{previewPack.desc}</p>
                </div>
              </div>

              {/* Detail Section */}
              <div className="space-y-3">
                <p className="text-[9px] uppercase tracking-widest font-black text-theme-muted">Features Breakdown</p>
                <div className="grid grid-cols-2 gap-2">
                  {previewPack.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-theme-secondary bg-theme-card rounded-xl px-3 py-2 border border-theme-border-soft">
                      <CheckCircle2 className="w-3.5 h-3.5 text-theme-accent shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Details */}
              {(previewPack.templateCounts) && (
                <div className="mt-4 pt-4 border-t border-theme-border-soft">
                  <p className="text-[9px] uppercase tracking-widest font-black text-theme-muted mb-2">Available Templates</p>
                  <div className="flex gap-3">
                    <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full border border-blue-500/20 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> PDF Templates: {previewPack.templateCounts.pdf}
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                      <Globe className="w-3 h-3" /> Live Links: {previewPack.templateCounts.live}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPreviewPack(null)}
                className="flex-1 py-3 rounded-xl text-xs font-black border border-theme-border-soft bg-theme-app hover:bg-theme-card transition-all text-theme-primary"
              >
                Close
              </button>
              <button
                onClick={() => { handleApplyPack(previewPack); setPreviewPack(null); }}
                className={`flex-[2] py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 btn-premium ${
                  currentPackId === previewPack.id
                    ? 'bg-theme-accent/10 text-theme-accent cursor-default border border-theme-accent/20'
                    : (previewPack.type === 'pro' && !isProUser)
                      ? 'bg-theme-warning/10 text-theme-warning hover:bg-theme-warning/20 border border-theme-warning/30'
                      : 'bg-theme-app dark:bg-theme-surface hover:bg-theme-accent hover:text-white border border-theme-border-soft text-theme-primary'
                }`}
              >
                {currentPackId === previewPack.id ? (
                  <>Active Pack <CheckCircle2 className="w-4 h-4" /></>
                ) : (previewPack.type === 'pro' && !isProUser) ? (
                  <>Unlock to Apply</>
                ) : (
                  'Apply This Pack'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TemplateMarketplace;
