import React, { useState, useEffect } from 'react';
import LazyPreview from '../components/LazyPreview';
import PublicInvoice from './PublicInvoice';
import InvoicePreview from '../components/InvoicePreview';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  FileText,
  Globe,
  Layout,
  Building2,
  Tags,
  Sparkles,
  ArrowRight,
  Store,
  Scissors,
  Stethoscope,
  Wrench,
  Cpu,
  Smartphone,
  ShoppingBag,
  Layers,
  Eye,
  Monitor,
  QrCode,
  CheckCircle2,
  Grid3X3,
  PaintBucket,
  Briefcase,
  Star,
  User,
  BarChart3,
  LayoutDashboard,
  Lightbulb,
  X,
  RotateCcw
} from 'lucide-react';
import { pageVariants, staggerContainer, staggerItem } from '../utils/animations';
import { getDemoInvoice } from '../utils/demoDataGenerator';

const STUDIO_SECTIONS = [
  {
    id: 'theme-studio',
    icon: Palette,
    title: 'Theme Studio',
    description: 'Customize your brand colors, dark mode, and visual identity',
    cta: 'settings',
    features: ['Brand Colors', 'Dark/Light Mode', 'Accent Color', 'Preview'],
    gradient: 'from-violet-500 to-purple-600'
  },
  {
    id: 'pdf-template-studio',
    icon: FileText,
    title: 'PDF Template Studio',
    description: 'Design professional invoice PDFs with custom templates',
    cta: 'pdf-templates',
    features: ['6 Templates', 'A4/A5 Preview', 'Business Category Preview'],
    gradient: 'from-blue-500 to-cyan-600'
  },
  {
    id: 'live-link-studio',
    icon: Globe,
    title: 'Live Link Studio',
    description: 'Create stunning payment links your customers will love',
    cta: 'live-link-templates',
    features: ['5 Themes', 'Desktop/Tablet/Mobile Preview', 'Payment Methods'],
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'invoice-templates',
    icon: Layout,
    title: 'Invoice Templates',
    description: 'Choose from professionally designed invoice layouts',
    cta: 'invoices',
    features: ['Classic', 'Modern', 'Minimal', 'Premium styles'],
    gradient: 'from-amber-500 to-orange-600'
  },
  {
    id: 'brand-settings',
    icon: Building2,
    title: 'Brand Settings',
    description: 'Manage your business identity — logo, contact, social links',
    cta: 'settings',
    features: ['Logo', 'Business Info', 'Social Links', 'Contact Details'],
    gradient: 'from-rose-500 to-pink-600'
  },
  {
    id: 'category-templates',
    icon: Tags,
    title: 'Category Templates',
    description: 'Tailored experiences for your business type',
    cta: 'marketplace',
    features: ['8 Categories', 'Smart Labels', 'Custom Workflows'],
    gradient: 'from-indigo-500 to-blue-600'
  }
];

const SUB_TABS = [
  { id: 'overview', label: 'Overview', icon: Grid3X3 },
  { id: 'themes', label: 'Themes', icon: Palette },
  { id: 'pdf-templates', label: 'PDF Templates', icon: FileText },
  { id: 'live-link', label: 'Live Link', icon: Globe },
  { id: 'branding', label: 'Branding', icon: PaintBucket },
  { id: 'presets', label: 'Presets', icon: Briefcase }
];

const BUSINESS_CATEGORIES = [
  { id: 'retail', name: 'General Store / Retail', icon: Store, desc: 'Minimarts, groceries, and general shops', color: 'from-emerald-500 to-teal-600' },
  { id: 'embroidery', name: 'Embroidery Studio', icon: Scissors, desc: 'Stitching, design numbers, work types', color: 'from-pink-500 to-rose-600' },
  { id: 'repair', name: 'Service & Repair', icon: Wrench, desc: 'Workshops, mechanics, appliance repair', color: 'from-orange-500 to-amber-600' },
  { id: 'clinic', name: 'Clinic & Medical', icon: Stethoscope, desc: 'Doctor clinics with medical disclaimers', color: 'from-green-500 to-emerald-600' },
  { id: 'tech', name: 'Tech / IT Services', icon: Cpu, desc: 'Software, hardware, and IT consulting', color: 'from-blue-500 to-indigo-600' },
  { id: 'mobile', name: 'Mobile & Accessories', icon: Smartphone, desc: 'Phone repair and accessory sales', color: 'from-cyan-500 to-blue-600' },
  { id: 'boutique', name: 'Boutique / Fashion', icon: ShoppingBag, desc: 'Clothing, tailoring, and fashion', color: 'from-fuchsia-500 to-pink-600' },
  { id: 'corporate', name: 'Corporate / Enterprise', icon: Briefcase, desc: 'B2B invoicing and bulk billing', color: 'from-slate-600 to-slate-800' }
];

const TEMPLATE_PREVIEWS = [
  { id: 'pdf-classic', label: 'PDF Classic', type: 'PDF', icon: FileText, desc: 'Clean professional layout', gradient: 'from-blue-500 to-cyan-600' },
  { id: 'pdf-modern', label: 'PDF Modern', type: 'PDF', icon: FileText, desc: 'Bold dark headers', gradient: 'from-indigo-500 to-purple-600' },
  { id: 'pdf-minimal', label: 'PDF Minimal', type: 'PDF', icon: FileText, desc: 'Ultra-clean B&W design', gradient: 'from-slate-500 to-slate-700' },
  { id: 'link-classic', label: 'Link Classic', type: 'Live Link', icon: Globe, desc: 'Simple timeless payment link', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'link-modern', label: 'Link Modern', type: 'Live Link', icon: Globe, desc: 'Card-based modern layout', gradient: 'from-violet-500 to-purple-600' },
  { id: 'link-mobile', label: 'Link Mobile First', type: 'Live Link', icon: Smartphone, desc: 'Optimized for mobile', gradient: 'from-rose-500 to-pink-600' }
];

const BRAND_COLORS = [
  { name: 'Obsidian Gold', hex: '#B8860B' },
  { name: 'Arctic Teal', hex: '#009E7F' },
  { name: 'Sapphire', hex: '#2563EB' },
  { name: 'Carbon Violet', hex: '#7C3AFF' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Crimson', hex: '#C0392B' }
];

const THEME_PREVIEWS = [
  { id: 'obsidian-gold', name: 'Obsidian Gold', gradient: 'from-amber-500 to-yellow-500', color: '#B8860B' },
  { id: 'arctic-teal', name: 'Arctic Teal', gradient: 'from-teal-500 to-emerald-400', color: '#009E7F' },
  { id: 'sapphire-noir', name: 'Sapphire Noir', gradient: 'from-blue-600 to-indigo-500', color: '#2563EB' },
  { id: 'rose-platinum', name: 'Rose Platinum', gradient: 'from-rose-500 to-pink-400', color: '#C75C75' },
  { id: 'carbon-violet', name: 'Carbon Violet', gradient: 'from-violet-600 to-purple-500', color: '#7C3AFF' },
  { id: 'emerald-royal', name: 'Emerald Royal', gradient: 'from-emerald-600 to-green-400', color: '#10B981' }
];

const QUICK_ACTIONS = [
  { id: 'create-invoice', label: 'Create Invoice', icon: FileText, action: 'invoices', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'add-customer', label: 'Add Customer', icon: User, action: 'customers', gradient: 'from-emerald-500 to-teal-500' },
  { id: 'view-reports', label: 'View Reports', icon: BarChart3, action: 'reports', gradient: 'from-violet-500 to-purple-500' },
  { id: 'go-dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, action: 'dashboard', gradient: 'from-amber-500 to-orange-500' }
];

const DESIGN_TIPS = [
  'Use contrasting colors for better readability on invoices.',
  'Keep your logo resolution high for print-ready PDFs.',
  'Test your live payment link on mobile before sending.',
  'Add your business social links to build customer trust.',
  'Use category-specific templates for professional billing.',
  'Dark mode reduces eye strain during night billing sessions.',
  'Preview your invoice before sending to catch any errors.',
  'Consistent branding across invoices builds recognition.'
];

const TEMPLATE_CATEGORIES = ['All', 'Retail', 'Embroidery', 'Tailor', 'Clinic', 'Repair'];

const ALL_THEMES = [
  { id: 'obsidian-gold', name: 'Obsidian Gold', category: 'Premium', gradient: 'linear-gradient(135deg, #B8860B, #1F2937)' },
  { id: 'arctic-teal', name: 'Arctic Teal', category: 'Business', gradient: 'linear-gradient(135deg, #009E7F, #0F766E)' },
  { id: 'sapphire-noir', name: 'Sapphire Noir', category: 'Business', gradient: 'linear-gradient(135deg, #2563EB, #1E3A8A)' },
  { id: 'rose-platinum', name: 'Rose Platinum', category: 'Premium', gradient: 'linear-gradient(135deg, #C75C75, #8B3A4A)' },
  { id: 'carbon-violet', name: 'Carbon Violet', category: 'Business', gradient: 'linear-gradient(135deg, #7C3AFF, #4C1D95)' },
  { id: 'graphite-copper', name: 'Graphite Copper', category: 'Premium', gradient: 'linear-gradient(135deg, #B76535, #4B2A1A)' },
  { id: 'arctic-diamond', name: 'Arctic Diamond', category: 'Light', gradient: 'linear-gradient(135deg, #60A5FA, #CBD5E1)' },
  { id: 'emerald-royal', name: 'Emerald Royal', category: 'Premium', gradient: 'linear-gradient(135deg, #10B981, #D4AF37)' },
  { id: 'midnight-ruby', name: 'Midnight Ruby', category: 'Premium', gradient: 'linear-gradient(135deg, #C0392B, #7F1D1D)' },
  { id: 'titanium-blue', name: 'Titanium Blue', category: 'Business', gradient: 'linear-gradient(135deg, #2563EB, #94A3B8)' },
  { id: 'pink-blossom', name: 'Pink Blossom', category: 'Light', gradient: 'linear-gradient(135deg, #F472B6, #EC4899)' },
  { id: 'ocean-waves', name: 'Ocean Waves', category: 'Business', gradient: 'linear-gradient(135deg, #0EA5E9, #0284C7)' },
  { id: 'sunset-orange', name: 'Sunset Orange', category: 'Business', gradient: 'linear-gradient(135deg, #F97316, #EA580C)' },
  { id: 'royal-purple', name: 'Royal Purple', category: 'Business', gradient: 'linear-gradient(135deg, #A855F7, #7C3AED)' },
  { id: 'cyber-teal', name: 'Cyber Teal', category: 'Business', gradient: 'linear-gradient(135deg, #14B8A6, #0D9488)' },
  { id: 'soft-lavender', name: 'Soft Lavender', category: 'Light', gradient: 'linear-gradient(135deg, #C4B5FD, #A78BFA)' },
  { id: 'gold-coast', name: 'Gold Coast', category: 'Premium', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' }
];

const THEME_CATEGORIES = ['All', 'Light', 'Dark', 'Premium', 'Business'];

const TEMPLATE_COMPARISON_FEATURES = [
  { feature: 'Watermark Support', pdf: false, link: true },
  { feature: 'Logo Placement', pdf: true, link: true },
  { feature: 'Custom Colors', pdf: true, link: true },
  { feature: 'QR Code', pdf: true, link: true },
  { feature: 'Multiple Pages', pdf: true, link: false },
  { feature: 'Payment Links', pdf: false, link: true },
  { feature: 'Mobile Optimized', pdf: false, link: true },
  { feature: 'A4 / A5 Sizes', pdf: true, link: false },
  { feature: 'Print Ready', pdf: true, link: false },
  { feature: 'Shareable URL', pdf: false, link: true }
];

// Removed hardcoded demoInvoice
const DesignStudio = ({ setCurrentTab, businessSettings = {}, setSettings, initialTab = 'overview' }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialTab);
  const [templateCategory, setTemplateCategory] = useState('All');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [businessFilter, setBusinessFilter] = useState('All');
  const [showCompare, setShowCompare] = useState(false);
  const [favoriteThemes, setFavoriteThemes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('billqyro_design_favorites') || '[]'); } catch { return []; }
  });

  const toggleFavorite = (themeId) => {
    setFavoriteThemes(prev => {
      const next = prev.includes(themeId) ? prev.filter(id => id !== themeId) : [...prev, themeId];
      localStorage.setItem('billqyro_design_favorites', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % DESIGN_TIPS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleNavigation = (cta) => {
    setCurrentTab(cta);
  };

  const logActivity = (action, detail) => {
    try {
      const raw = localStorage.getItem('billqyro_design_activity');
      const activities = raw ? JSON.parse(raw) : [];
      activities.unshift({ action, detail, time: Date.now() });
      localStorage.setItem('billqyro_design_activity', JSON.stringify(activities.slice(0, 20)));
    } catch {}
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-4 md:p-8 w-full space-y-6 pb-24"
    >
      {/* Page Header */}
      <div className="glass rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-theme-accent/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-theme-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-theme-primary tracking-tight">
                  <span className="text-gradient-premium">Design Studio</span>
                </h1>
                <span className="badge-premium bg-theme-accent/15 text-theme-accent border border-theme-accent/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-theme-muted font-bold mt-0.5">
                Customize every aspect of your billing experience
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-theme-muted">
            <div className="flex items-center gap-1.5 bg-theme-accent/5 px-3 py-1.5 rounded-lg border border-theme-border-soft">
              <div className="w-1.5 h-1.5 rounded-full bg-theme-success" />
              <span>All systems ready</span>
            </div>
          </div>
        </div>
        <div className="mt-4 h-1 w-32 rounded-full bg-gradient-to-r from-theme-accent via-theme-accent/60 to-transparent" />
        <p className="mt-3 text-[11px] font-semibold text-theme-muted leading-relaxed max-w-2xl">
          Your centralized hub for all visual customization. Each studio below provides dedicated
          tools to tailor every pixel of your billing workflow — from invoices to payment links.
        </p>
      </div>

      {/* Glass Pill-Style Tab Navigation */}
      <div className="glass rounded-2xl p-1.5 border border-theme-border-soft overflow-x-auto hide-scrollbar">
        <div className="flex gap-1.5 min-w-max md:min-w-0">
          {SUB_TABS.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                  activeSubTab === tab.id
                    ? 'bg-theme-accent text-white shadow-md shadow-theme-accent/30 scale-105'
                    : 'text-theme-muted hover:text-theme-primary hover:bg-theme-card/80'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 card-premium p-4">
          <div className="section-header mb-3">
            <h3 className="section-header-title">Recent Activity</h3>
            <span className="badge-premium badge-info">Last 5</span>
          </div>
          <div className="space-y-2">
            {(() => {
              let activities = [];
              try { const raw = localStorage.getItem('billqyro_design_activity'); activities = raw ? JSON.parse(raw) : []; } catch (e) { activities = []; }
              const defaults = [
                { action: 'Template updated', detail: 'PDF Classic layout', time: Date.now() - 86400000 * 2 },
                { action: 'Brand color changed', detail: 'Obsidian Gold applied', time: Date.now() - 86400000 * 4 },
                { action: 'New template created', detail: 'Link Mobile First', time: Date.now() - 86400000 * 7 },
                { action: 'Category activated', detail: 'Embroidery Studio', time: Date.now() - 86400000 * 10 },
                { action: 'Theme updated', detail: 'Dark mode refined', time: Date.now() - 86400000 * 14 }
              ];
              return (activities.length > 0 ? activities : defaults).slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-theme-surface hover:bg-theme-accent/5 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-theme-primary">{a.action}</p>
                    <p className="text-[10px] text-theme-muted font-medium">{a.detail}</p>
                  </div>
                  <span className="text-[9px] text-theme-muted font-semibold shrink-0">
                    {new Date(a.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>
        <div className="lg:col-span-1 grid grid-cols-1 gap-3">
          <div className="card-premium p-4 text-center">
            <p className="text-xl font-black text-theme-primary">18+</p>
            <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Total Templates</p>
          </div>
          <div className="card-premium p-4 text-center">
            <p className="text-xl font-black text-emerald-500">12</p>
            <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Active Templates</p>
          </div>
          <div className="card-premium p-4 text-center">
            <p className="text-xl font-black text-theme-primary">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <p className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Last Modified</p>
          </div>
        </div>
      </motion.div>

      {/* Overview Tab */}
      {activeSubTab === 'overview' && (
        <motion.div
          key="overview"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-theme-primary uppercase tracking-wider">All Design Tools</h2>
            <span className="badge-premium text-[9px] font-black text-theme-muted bg-theme-card px-3 py-1 rounded-full border border-theme-border-soft">
              {STUDIO_SECTIONS.length} studios
            </span>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {STUDIO_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.id}
                  variants={staggerItem}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="card-premium p-6 flex flex-col"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center mb-4 shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-extrabold text-theme-primary mb-1">
                    {section.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-theme-muted mb-4 leading-relaxed">
                    {section.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {section.features.map((feat) => (
                      <span key={feat} className="badge-premium badge-info">
                        {feat}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto">
                    <button
                      onClick={() => handleNavigation(section.cta)}
                      className="btn-premium w-full group"
                    >
                      <span>Open Studio</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Theme Preview Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Theme Preview</h3>
              <button onClick={() => handleNavigation('themes')} className="text-[9px] font-bold text-theme-accent hover:underline transition-all">View All Themes</button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {THEME_PREVIEWS.map((theme) => (
                <motion.button
                  key={theme.id}
                  whileHover={{ scale: 1.06, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleNavigation('themes')}
                  className="card-premium p-3 flex flex-col items-center gap-2 cursor-pointer group"
                >
                  <div className={`w-full h-10 rounded-xl bg-gradient-to-br ${theme.gradient} shadow-md group-hover:shadow-lg transition-all duration-300`} />
                  <span className="text-[9px] font-bold text-theme-primary text-center leading-tight">{theme.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleNavigation(action.action)}
                    className="card-premium p-4 flex items-center gap-3 cursor-pointer group"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all`}>
                      <ActionIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[11px] font-extrabold text-theme-primary">{action.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Themes Tab */}
      {activeSubTab === 'themes' && (
        <motion.div
          key="themes"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-black text-theme-primary uppercase tracking-wider">Theme Studio</h2>
              <p className="text-[10px] text-theme-muted font-semibold mt-0.5">Browse, preview, and apply premium color themes</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search themes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 md:w-48 px-3 py-2 pl-8 rounded-xl bg-theme-card border border-theme-border-soft text-[10px] font-semibold text-theme-primary placeholder:text-theme-muted/50 focus:outline-none focus:border-theme-accent/50 transition-all"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button onClick={() => handleNavigation('settings')} className="btn-premium text-[10px] px-4 py-2">
                <Palette className="w-3.5 h-3.5" />
                All Themes
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {THEME_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-theme-accent text-white shadow-md shadow-theme-accent/30'
                    : 'bg-theme-card text-theme-muted hover:text-theme-primary border border-theme-border-soft'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Color Swatches Section */}
          <div className="card-premium p-4">
            <div className="section-header mb-3">
              <h3 className="section-header-title">Color Swatches</h3>
              <span className="badge-premium badge-info">{BRAND_COLORS.length} colors</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {BRAND_COLORS.map((c) => (
                <div key={c.hex} className="flex items-center gap-2 bg-theme-app rounded-xl px-3 py-2 border border-theme-border-soft">
                  <div className="w-6 h-6 rounded-lg shadow-sm border border-white/10" style={{ backgroundColor: c.hex }} />
                  <span className="text-[10px] font-bold text-theme-primary">{c.name}</span>
                  <span className="text-[8px] font-mono text-theme-muted">{c.hex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Theme Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {ALL_THEMES.filter(t => (activeCategory === 'All' || t.category === activeCategory) && (searchQuery === '' || t.name.toLowerCase().includes(searchQuery.toLowerCase()))).map((theme) => (
              <motion.button
                key={theme.id}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  document.documentElement.setAttribute('data-theme', theme.id);
                  import('../utils/themeIcon').then(m => m.updateFaviconForTheme(theme.id)).catch(() => {});
                  if (setSettings) {
                    setSettings({ ...businessSettings, themeColor: theme.id });
                  }
                  logActivity('Theme applied', theme.name);
                }}
                className={`card-premium p-4 flex flex-col items-center gap-2 cursor-pointer group relative transition-all duration-300 ${businessSettings?.themeColor === theme.id ? 'ring-2 ring-theme-accent shadow-lg shadow-theme-accent/20 scale-[1.02]' : ''}`}
              >
                <div className="w-full h-16 rounded-xl shadow-md" style={{ background: theme.gradient }} />
                <span className="text-[9px] font-bold text-theme-primary text-center leading-tight mt-1">{theme.name}</span>
                <span className="text-[7px] font-bold text-theme-muted uppercase tracking-wider">{theme.category}</span>
                {favoriteThemes.includes(theme.id) && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
                    <Star className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(theme.id); }}
                  className={`absolute top-2 left-2 p-1 rounded-full transition-all ${
                    favoriteThemes.includes(theme.id)
                      ? 'text-amber-500 bg-amber-500/10'
                      : 'text-theme-muted opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <Star className="w-3 h-3" />
                </button>
              </motion.button>
            ))}
          </div>
          {ALL_THEMES.filter(t => (activeCategory === 'All' || t.category === activeCategory) && (searchQuery === '' || t.name.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
            <div className="empty-state py-8">
              <div className="empty-state-icon">
                <Palette className="w-6 h-6" />
              </div>
              <p className="empty-state-title">No themes found</p>
              <p className="empty-state-text">Try adjusting your search or filter criteria.</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="btn-premium text-[10px] mt-2"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filters
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* PDF Templates Tab */}
      {activeSubTab === 'pdf-templates' && (
        <motion.div
          key="pdf-templates"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-black text-theme-primary uppercase tracking-wider">PDF Templates</h2>
              <p className="text-[10px] text-theme-muted font-semibold mt-0.5">Design professional invoice PDFs</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCompare(!showCompare)}
                className={`btn-premium text-[10px] px-4 py-2 ${showCompare ? 'bg-theme-accent text-white' : ''}`}
              >
                <Layers className="w-3.5 h-3.5" />
                Compare
              </button>
              <button onClick={() => handleNavigation('pdf-templates')} className="btn-premium text-[10px] px-4 py-2">
                <FileText className="w-3.5 h-3.5" />
                Open Studio
              </button>
            </div>
          </div>

          {/* Template Comparison View */}
          {showCompare && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card-premium p-5 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Feature Comparison</h3>
                <button onClick={() => setShowCompare(false)} className="text-theme-muted hover:text-theme-primary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto hide-scrollbar">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-theme-border-soft">
                      <th className="py-2 pr-4 font-black text-theme-primary uppercase tracking-wider">Feature</th>
                      <th className="py-2 px-4 font-black text-theme-primary uppercase tracking-wider text-center">
                        <FileText className="w-3.5 h-3.5 inline-block mr-1" />PDF
                      </th>
                      <th className="py-2 px-4 font-black text-theme-primary uppercase tracking-wider text-center">
                        <Globe className="w-3.5 h-3.5 inline-block mr-1" />Live Link
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {TEMPLATE_COMPARISON_FEATURES.map((item) => (
                      <tr key={item.feature} className="border-b border-theme-border-soft/50">
                        <td className="py-2.5 pr-4 font-semibold text-theme-primary">{item.feature}</td>
                        <td className="py-2.5 px-4 text-center">
                          {item.pdf ? (
                            <CheckCircle2 className="w-4 h-4 text-theme-success mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-theme-muted/40 mx-auto" />
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {item.link ? (
                            <CheckCircle2 className="w-4 h-4 text-theme-success mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-theme-muted/40 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {TEMPLATE_PREVIEWS.filter(t => t.type === 'PDF').map((tpl) => {
              const TplIcon = tpl.icon;
              return (
                <motion.div
                  key={tpl.id}
                  whileHover={{ scale: 1.02, y: -3 }}
                  className="card-premium p-5 cursor-pointer group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tpl.gradient} flex items-center justify-center shadow-md shrink-0`}>
                      <TplIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-extrabold text-theme-primary">{tpl.label}</h4>
                      <p className="text-[10px] font-semibold text-theme-muted mt-0.5">{tpl.desc}</p>
                    </div>
                  </div>
                   <div className="aspect-[4/3] bg-theme-surface rounded-xl border border-theme-border-soft overflow-hidden relative">
                    <LazyPreview fallback={<div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-theme-muted animate-pulse">Loading...</div>}>
                       <div className="w-[800px] h-[1000px] transform origin-top-left scale-[0.35] pointer-events-none absolute top-0 left-0">
                          <InvoicePreview invoice={getDemoInvoice(businessSettings?.businessCategory)} businessSettings={{...businessSettings, selectedPdfTemplate: tpl.id.replace('pdf-', '')}} />
                       </div>
                    </LazyPreview>
                  </div>
                  <button onClick={() => handleNavigation('pdf-templates')} className="w-full mt-3 btn-premium text-[10px] py-2">
                    <Eye className="w-3 h-3" /> Customize Template
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Live Link Templates Tab */}
      {activeSubTab === 'live-link' && (
        <motion.div
          key="live-link"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-black text-theme-primary uppercase tracking-wider">Live Link Templates</h2>
              <p className="text-[10px] text-theme-muted font-semibold mt-0.5">Beautiful payment links for your customers</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCompare(!showCompare)}
                className={`btn-premium text-[10px] px-4 py-2 ${showCompare ? 'bg-theme-accent text-white' : ''}`}
              >
                <Layers className="w-3.5 h-3.5" />
                Compare
              </button>
              <button onClick={() => handleNavigation('live-link-templates')} className="btn-premium text-[10px] px-4 py-2">
                <Globe className="w-3.5 h-3.5" />
                Open Studio
              </button>
            </div>
          </div>

          {/* Comparison View for Live Link */}
          {showCompare && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card-premium p-5 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Feature Comparison</h3>
                <button onClick={() => setShowCompare(false)} className="text-theme-muted hover:text-theme-primary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto hide-scrollbar">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-theme-border-soft">
                      <th className="py-2 pr-4 font-black text-theme-primary uppercase tracking-wider">Feature</th>
                      <th className="py-2 px-4 font-black text-theme-primary uppercase tracking-wider text-center">
                        <FileText className="w-3.5 h-3.5 inline-block mr-1" />PDF
                      </th>
                      <th className="py-2 px-4 font-black text-theme-primary uppercase tracking-wider text-center">
                        <Globe className="w-3.5 h-3.5 inline-block mr-1" />Live Link
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {TEMPLATE_COMPARISON_FEATURES.map((item) => (
                      <tr key={item.feature} className="border-b border-theme-border-soft/50">
                        <td className="py-2.5 pr-4 font-semibold text-theme-primary">{item.feature}</td>
                        <td className="py-2.5 px-4 text-center">
                          {item.pdf ? (
                            <CheckCircle2 className="w-4 h-4 text-theme-success mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-theme-muted/40 mx-auto" />
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {item.link ? (
                            <CheckCircle2 className="w-4 h-4 text-theme-success mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-theme-muted/40 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {TEMPLATE_PREVIEWS.filter(t => t.type === 'Live Link').map((tpl) => {
              const TplIcon = tpl.icon;
              return (
                <motion.div
                  key={tpl.id}
                  whileHover={{ scale: 1.02, y: -3 }}
                  className="card-premium p-5 cursor-pointer group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tpl.gradient} flex items-center justify-center shadow-md shrink-0`}>
                      <TplIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-extrabold text-theme-primary">{tpl.label}</h4>
                      <p className="text-[10px] font-semibold text-theme-muted mt-0.5">{tpl.desc}</p>
                    </div>
                  </div>
                  <div className="aspect-[3/4] bg-theme-surface rounded-xl border border-theme-border-soft overflow-hidden relative">
                    <LazyPreview fallback={<div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-theme-muted animate-pulse">Loading...</div>}>
                        <div className="w-[800px] h-full transform origin-top-left scale-[0.35] pointer-events-none absolute top-0 left-0 bg-white">
                          <PublicInvoice initialInvoice={{
                            ...getDemoInvoice(businessSettings?.businessCategory),
                            paymentSettingsSnapshot: {
                              ...getDemoInvoice(businessSettings?.businessCategory).paymentSettingsSnapshot,
                              customerLiveLinkSettings: {
                                ...getDemoInvoice(businessSettings?.businessCategory).paymentSettingsSnapshot.customerLiveLinkSettings,
                                selectedLiveLinkTemplate: tpl.id.replace('link-', '')
                              }
                            }
                          }} />
                       </div>
                    </LazyPreview>
                  </div>
                  <button onClick={() => handleNavigation('live-link-templates')} className="w-full mt-3 btn-premium text-[10px] py-2">
                    <Eye className="w-3 h-3" /> Customize Link
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Branding Tab */}
      {activeSubTab === 'branding' && (
        <motion.div
          key="branding"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-black text-theme-primary uppercase tracking-wider">Brand Identity</h2>
              <p className="text-[10px] text-theme-muted font-semibold mt-0.5">Manage your business look and feel</p>
            </div>
            <button onClick={() => handleNavigation('settings')} className="btn-premium text-[10px] px-4 py-2">
              <Building2 className="w-3.5 h-3.5" />
              Brand Settings
            </button>
          </div>
          <div className="card-premium p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md">
                <PaintBucket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-theme-primary">Brand Color Palette</h3>
                <p className="text-[10px] font-semibold text-theme-muted">Your available brand colors for templates and invoices</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {BRAND_COLORS.map((c) => (
                <div key={c.hex} className="flex items-center gap-2 bg-theme-app rounded-xl px-3 py-2 border border-theme-border-soft">
                  <div className="w-6 h-6 rounded-lg shadow-sm" style={{ backgroundColor: c.hex }} />
                  <span className="text-[10px] font-bold text-theme-primary">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card-premium p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-theme-accent/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-theme-accent" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-theme-primary">Business Profile</h3>
                <p className="text-[10px] font-semibold text-theme-muted">Logo, contact info, social links and more</p>
              </div>
            </div>
            <button onClick={() => handleNavigation('settings')} className="btn-premium text-[10px] px-4 py-2">
              Configure
            </button>
          </div>
          <div className="card-premium p-6">
            <h3 className="text-sm font-extrabold text-theme-primary mb-4">Brand Preview</h3>
            <div className="aspect-video bg-theme-surface rounded-xl border border-theme-border-soft flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[image:var(--accent-gradient)] flex items-center justify-center shadow-md mb-3">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-bold text-theme-primary">{businessSettings?.businessName || 'Your Brand'}</p>
                <p className="text-[10px] text-theme-muted font-medium mt-1">Your brand preview will appear here</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Business Presets Tab */}
      {activeSubTab === 'presets' && (
        <motion.div
          key="presets"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-black text-theme-primary uppercase tracking-wider">Business Presets</h2>
              <p className="text-[10px] text-theme-muted font-semibold mt-0.5">Templates and workflows tailored to your industry</p>
            </div>
            <button onClick={() => handleNavigation('marketplace')} className="btn-premium text-[10px] px-4 py-2">
              <Store className="w-3.5 h-3.5" />
              Marketplace
            </button>
          </div>

          {/* Business Category Filter Chips */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button
              onClick={() => setBusinessFilter('All')}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                businessFilter === 'All'
                  ? 'bg-theme-accent text-white shadow-md shadow-theme-accent/30'
                  : 'bg-theme-card text-theme-muted hover:text-theme-primary border border-theme-border-soft'
              }`}
            >
              All
            </button>
            {BUSINESS_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setBusinessFilter(cat.id)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  businessFilter === cat.id
                    ? 'bg-theme-accent text-white shadow-md shadow-theme-accent/30'
                    : 'bg-theme-card text-theme-muted hover:text-theme-primary border border-theme-border-soft'
                }`}
              >
                <cat.icon className="w-3 h-3" />
                {cat.name.split(' / ')[0]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {BUSINESS_CATEGORIES.filter(cat => businessFilter === 'All' || cat.id === businessFilter).map((cat) => {
              const CatIcon = cat.icon;
              return (
                <motion.div
                  key={cat.id}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="card-premium p-5 flex flex-col items-center text-center"
                  onClick={() => handleNavigation('marketplace')}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3 shadow-md`}>
                    <CatIcon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-sm font-extrabold text-theme-primary mb-0.5">{cat.name}</h4>
                  <p className="text-[10px] font-semibold text-theme-muted leading-relaxed">{cat.desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-theme-accent">
                    <span>View Templates</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Quick Stats */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Design Tools', value: '6', icon: Palette },
          { label: 'Templates', value: '18+', icon: FileText },
          { label: 'Categories', value: '8', icon: Tags },
          { label: 'Customizable', value: '100%', icon: Sparkles }
        ].map((stat) => {
          const StatIcon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={staggerItem}
              className="stat-premium card-premium p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-theme-accent/10 flex items-center justify-center shrink-0">
                <StatIcon className="w-5 h-5 text-theme-accent" />
              </div>
              <div>
                <p className="text-lg font-black text-theme-primary">{stat.value}</p>
                <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Bottom Info */}
      <div className="card-premium rounded-2xl overflow-hidden">
        <div className="empty-state">
          <div className="empty-state-icon">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="empty-state-title">All tools in one place</p>
          <p className="empty-state-text">
            Every design customization is just a click away. Start crafting your perfect billing experience.
          </p>
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-bold text-theme-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-theme-accent" />
              Changes save automatically
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-theme-accent" />
              Preview before applying
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-theme-accent" />
              Works across all devices
            </span>
          </div>
        </div>
      </div>

      {/* Design Tips Rotating Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card-premium p-5 flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md">
          <Lightbulb className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-black text-theme-primary uppercase tracking-wider">Design Tip</span>
            <span className="text-[8px] font-bold text-theme-muted bg-theme-card px-2 py-0.5 rounded-full border border-theme-border-soft">
              {currentTipIndex + 1}/{DESIGN_TIPS.length}
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTipIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="text-[11px] font-semibold text-theme-muted leading-relaxed"
            >
              {DESIGN_TIPS[currentTipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1">
          {DESIGN_TIPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentTipIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === currentTipIndex ? 'bg-theme-accent w-3' : 'bg-theme-muted/30'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrentTipIndex(prev => (prev + 1) % DESIGN_TIPS.length)}
          className="w-8 h-8 rounded-xl bg-theme-card border border-theme-border-soft flex items-center justify-center shrink-0 hover:bg-theme-accent/10 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5 text-theme-muted" />
        </button>
      </motion.div>
    </motion.div>
  );
};

export default DesignStudio;
