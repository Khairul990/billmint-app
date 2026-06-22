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
  Sparkles
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
    features: ['Standard Columns', 'Retail Checkout Link', 'Variant & Discount']
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
    features: ['Design No & Work Type', 'Modern PDF Layout', 'Simple Payment Link']
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
    features: ['Problem Details Col', 'Labour + Parts', 'Workshop Live Link']
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
    features: ['Medical Disclaimer', 'Clinic PDF', 'Clean Patient Link']
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
    features: ['Elegant Branding', 'Boutique PDF', 'Premium Payment View']
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
    features: ['Card Layout', 'Variant Columns', 'Modern Link']
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
    features: ['Mobile First Link', 'Fast Checkout', 'Standard PDF']
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
  const [isLoading, setIsLoading] = useState(false);
  
  const isProUser = subscription?.status === 'active';
  const currentPackId = settings?.businessCategory || 'retail';

  const categories = ['All', 'Retail', 'Service', 'Fashion', 'Medical'];

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
          {filteredPacks.map(pack => {
            const isActive = currentPackId === pack.id;
            const isLocked = pack.type === 'pro' && !isProUser;
            const Icon = pack.icon;

            return (
              <motion.div 
                key={pack.id}
                variants={staggerItem}
                whileHover={{ scale: 1.02, y: -4 }}
                className={`bg-theme-card rounded-3xl p-6 border-2 transition-all duration-300 flex flex-col justify-between card-premium ${
                  isActive 
                    ? 'border-theme-accent shadow-premium scale-[1.02]' 
                    : 'border-theme-border-soft hover:border-theme-accent/40 shadow-sm'
                }`}
              >
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

                  <div className="flex flex-wrap gap-1.5 mb-3">
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

                <button
                  onClick={() => handleApplyPack(pack)}
                  className={`w-full py-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 btn-premium ${
                    isActive 
                      ? 'bg-theme-accent/10 text-theme-accent cursor-default border border-theme-accent/20' 
                      : isLocked
                        ? 'bg-theme-warning/10 text-theme-warning hover:bg-theme-warning/20 border border-theme-warning/30'
                        : 'bg-theme-app dark:bg-theme-surface hover:bg-theme-accent hover:text-white border border-theme-border-soft text-theme-primary'
                  }`}
                >
                  {isActive ? (
                    <>Active Pack <CheckCircle2 className="w-4 h-4" /></>
                  ) : isLocked ? (
                    <>Unlock to Apply</>
                  ) : (
                    'Apply Pack'
                  )}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
};

export default TemplateMarketplace;
