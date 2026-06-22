import React from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  FileText,
  Globe,
  Layout,
  Building2,
  Tags,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { pageVariants, staggerContainer, staggerItem } from '../utils/animations';

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

const DesignStudio = ({ setCurrentTab }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-4 md:p-8 w-full space-y-6"
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

      {/* Studio Cards Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
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
                  onClick={() => setCurrentTab(section.cta)}
                  className="btn-premium w-full group"
                >
                  <span>Open</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

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
    </motion.div>
  );
};

export default DesignStudio;
