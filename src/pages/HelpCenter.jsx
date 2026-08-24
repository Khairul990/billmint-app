import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import { 
  Search, X, Clock, ChevronRight, Play, CheckCircle2, 
  HelpCircle, BookOpen, AlertTriangle, FileText, Users, 
  Package, DollarSign, LayoutDashboard, ArrowRight, ShieldAlert, 
  Zap, MessageSquare, Phone, Rocket, Building, Building2, 
  CreditCard, Share2, BarChart3, Palette, Shield, Link as LinkIcon, 
  Wrench, HardDrive, Check, ExternalLink, ChevronDown, Sparkles, 
  CornerDownLeft, RefreshCw, CheckCircle, Activity, LifeBuoy,
  HelpCircle as HelpIcon, ArrowLeft, ArrowUpRight, History, Layers,
  Compass, Eye, PlayCircle, Award, CheckSquare, ChevronLeft
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { 
  categories, 
  guides, 
  faqs, 
  quickStartSteps, 
  troubleshootingItems, 
  featureExplorer,
  learningRoadmap,
  visualWorkflows,
  coreCapabilities,
  productTourSteps
} from '../data/guides';
import { t } from '../utils/i18n';
import { triggerLightHaptic, triggerSuccessHaptic } from '../utils/feedback';
import { useFeatureControl } from '../hooks/useFeatureControl';

// --- SUB-COMPONENTS ---

// Dynamic Icon Component Helper
const DynamicIcon = ({ name, className = "w-5 h-5", fallback: Fallback = FileText }) => {
  const IconComponent = Icons[name] || Fallback;
  return <IconComponent className={className} />;
};

// FAQ Accordion Component (Filtered by active features)
const FAQAccordion = ({ searchQuery = '', isDocActive }) => {
  const [openIndex, setOpenIndex] = useState(null);
  const [activeFaqCategory, setActiveFaqCategory] = useState('All');

  // Filter FAQs by active features
  const activeFaqs = useMemo(() => {
    return faqs.filter(f => isDocActive(f));
  }, [isDocActive]);

  const faqCategories = useMemo(() => {
    const cats = new Set(['All']);
    activeFaqs.forEach(f => { if (f.category) cats.add(f.category); });
    return Array.from(cats);
  }, [activeFaqs]);

  const filteredFaqs = useMemo(() => {
    return activeFaqs.filter(f => {
      const matchCat = activeFaqCategory === 'All' || f.category === activeFaqCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;
      return matchCat && (f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
    });
  }, [activeFaqs, searchQuery, activeFaqCategory]);

  return (
    <div className="space-y-3">
      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {faqCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveFaqCategory(cat)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFaqCategory === cat
                ? 'bg-theme-accent text-white shadow-xs'
                : 'bg-theme-card border border-theme-border-soft text-theme-secondary hover:bg-theme-surface'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filteredFaqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index} 
              className="bg-theme-card border border-theme-border-soft rounded-2xl overflow-hidden shadow-xs hover:border-theme-border-strong transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full px-4 sm:px-5 py-3.5 text-left flex items-center justify-between hover:bg-theme-surface/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 pr-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-accent shrink-0"></span>
                  <span className="font-bold text-theme-primary text-xs sm:text-sm">
                    {faq.question}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {faq.category && (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-theme-surface text-theme-muted border border-theme-border-soft">
                      {faq.category}
                    </span>
                  )}
                  <ChevronRight className={`w-4 h-4 text-theme-muted transition-transform duration-200 ${
                    isOpen ? 'rotate-90 text-theme-accent' : ''
                  }`} />
                </div>
              </button>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-theme-surface/40"
                  >
                    <div className="px-4 sm:px-5 py-3.5 border-t border-theme-border-soft/60 text-theme-secondary text-xs sm:text-sm leading-relaxed font-medium">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filteredFaqs.length === 0 && (
          <div className="p-6 rounded-2xl bg-theme-card border border-theme-border-soft text-center text-xs text-theme-muted">
            No matching questions found in this category.
          </div>
        )}
      </div>
    </div>
  );
};

// Interactive Product Tour Modal (Visual Step-by-Step Walkthrough Simulation)
const InteractiveProductTourModal = ({ isOpen, onClose, setCurrentTab }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrentStepIdx(p => Math.min(productTourSteps.length - 1, p + 1));
      if (e.key === 'ArrowLeft') setCurrentStepIdx(p => Math.max(0, p - 1));
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const tourStep = productTourSteps[currentStepIdx] || productTourSteps[0];
  const isLast = currentStepIdx === productTourSteps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-theme-card w-full max-w-3xl rounded-3xl shadow-2xl border border-theme-border-soft overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-theme-border-soft bg-theme-surface/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-theme-accent text-white flex items-center justify-center font-bold">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-theme-primary">
                  BillQyro Interactive Tour
                </h3>
                <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                  Step {currentStepIdx + 1} of {productTourSteps.length} • {tourStep.highlightLabel}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tour Progress Bar */}
          <div className="h-1 w-full bg-theme-surface">
            <motion.div
              className="h-full bg-theme-accent"
              animate={{ width: `${((currentStepIdx + 1) / productTourSteps.length) * 100}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>

          {/* Tour Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Visual Simulation Card */}
            <div className="p-5 rounded-2xl bg-theme-surface/90 border border-theme-border-soft relative overflow-hidden space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-theme-border-soft/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-theme-accent animate-ping"></span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-theme-accent">
                    {tourStep.highlightLabel}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-theme-muted">Simulated Preview</span>
              </div>
              
              <div className="py-2">
                <h4 className="text-lg font-black text-theme-primary">
                  {tourStep.title}
                </h4>
                <p className="text-xs font-bold text-theme-accent mt-0.5">
                  {tourStep.subtitle}
                </p>
                <p className="text-xs font-medium text-theme-secondary leading-relaxed mt-2">
                  {tourStep.desc}
                </p>
              </div>
            </div>

            {/* Step Navigation Dots */}
            <div className="flex justify-center gap-1.5">
              {productTourSteps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIdx(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIdx 
                      ? 'w-6 bg-theme-accent' 
                      : 'w-2 bg-theme-border-soft hover:bg-theme-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-theme-border-soft bg-theme-surface/60 flex items-center justify-between">
            <button
              disabled={currentStepIdx === 0}
              onClick={() => setCurrentStepIdx(p => Math.max(0, p - 1))}
              className="px-4 py-2 rounded-xl text-xs font-bold text-theme-secondary bg-theme-surface border border-theme-border-soft hover:bg-theme-card disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              ← Back
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  if (setCurrentTab && tourStep.tab) setCurrentTab(tourStep.tab);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-theme-surface border border-theme-border-soft text-theme-primary hover:bg-theme-card transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Try this in BillQyro</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {isLast ? (
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-theme-accent text-white hover:opacity-95 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Finish Tour</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStepIdx(p => Math.min(productTourSteps.length - 1, p + 1))}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-theme-accent text-white hover:opacity-95 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// 3-Column Premium Tutorial Reader Modal
const TutorialReaderModal = ({ guide, onClose, setCurrentTab, onSelectGuide, isDocActive }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setActiveStepIndex(prev => Math.min(guide.steps.length - 1, prev + 1));
      if (e.key === 'ArrowLeft') setActiveStepIndex(prev => Math.max(0, prev - 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [guide, onClose]);

  if (!guide) return null;
  const currentStep = guide.steps[activeStepIndex] || guide.steps[0];
  const isLastStep = activeStepIndex === guide.steps.length - 1;
  const progressPercent = Math.round(((activeStepIndex + 1) / guide.steps.length) * 100);

  const relatedGuidesList = (guide.relatedGuides || [])
    .map(id => guides.find(g => g.id === id))
    .filter(g => g && isDocActive(g));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 md:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-theme-card w-full max-w-5xl h-[88vh] max-h-[780px] overflow-hidden rounded-3xl shadow-2xl flex flex-col border border-theme-border-soft"
        >
          {/* Top Header & Progress Bar */}
          <div className="shrink-0 border-b border-theme-border-soft bg-theme-surface/70">
            <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-theme-accent text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <DynamicIcon name={guide.icon} className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-theme-accent">
                      Interactive Guide
                    </span>
                    <span className="text-theme-muted text-[10px]">•</span>
                    <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                      {guide.duration}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-theme-primary truncate">
                    {guide.titleEn || guide.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-theme-muted font-numbers hidden sm:inline-block">
                  {progressPercent}% completed
                </span>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-theme-surface border border-theme-border-soft flex items-center justify-center text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
                  title="Close reader (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Line */}
            <div className="h-1 w-full bg-theme-surface overflow-hidden">
              <motion.div 
                className="h-full bg-theme-accent" 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* 3-Column Layout Body */}
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            
            {/* LEFT: Steps Navigation */}
            <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-theme-border-soft bg-theme-surface/40 p-3.5 overflow-y-auto space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-theme-muted px-2.5 pb-1">
                Tutorial Steps ({guide.steps.length})
              </p>
              {guide.steps.map((step, idx) => {
                const isActive = idx === activeStepIndex;
                const isPassed = idx < activeStepIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveStepIndex(idx)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-theme-card text-theme-primary border border-theme-border-soft shadow-xs' 
                        : isPassed 
                        ? 'text-theme-secondary hover:bg-theme-surface/70' 
                        : 'text-theme-muted hover:text-theme-primary hover:bg-theme-surface/40'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isActive 
                        ? 'bg-theme-accent text-white' 
                        : isPassed 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-theme-surface text-theme-muted border border-theme-border-soft'
                    }`}>
                      {isPassed ? <Check className="w-3 h-3" /> : idx + 1}
                    </span>
                    <span className="truncate flex-1">{step.titleEn || step.title}</span>
                  </button>
                );
              })}
            </div>

            {/* CENTER: Step Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                    Step {activeStepIndex + 1} of {guide.steps.length}
                  </span>
                  <span className="text-xs text-theme-muted font-semibold">
                    ~{Math.max(1, Math.round(parseInt(guide.duration) / guide.steps.length))} min
                  </span>
                </div>
                <h4 className="text-xl font-black text-theme-primary tracking-tight">
                  {currentStep.titleEn || currentStep.title}
                </h4>
                <p className="text-sm font-medium text-theme-secondary leading-relaxed pt-1">
                  {currentStep.descriptionEn || currentStep.description}
                </p>
              </div>

              {/* Explanatory Callout */}
              <div className="p-4 sm:p-5 rounded-2xl bg-theme-surface/60 border border-theme-border-soft space-y-2">
                <div className="flex items-center gap-2 text-theme-accent">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">How it works</span>
                </div>
                <p className="text-xs font-medium text-theme-secondary leading-relaxed">
                  BillQyro automatically validates data integrity and calculates tax totals in real time. Changes made here persist instantly to IndexedDB storage and sync to cloud backups when online.
                </p>
              </div>

              {/* Pro Tip Callout */}
              <div className="p-4 rounded-2xl bg-theme-card border border-theme-border-soft text-xs space-y-1.5 shadow-xs">
                <span className="font-extrabold uppercase tracking-wider text-theme-muted text-[10px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
                  Keyboard Shortcuts
                </span>
                <p className="text-theme-secondary font-medium">
                  Press <kbd className="px-1.5 py-0.5 bg-theme-surface border border-theme-border-soft rounded text-[10px] font-bold">←</kbd> or <kbd className="px-1.5 py-0.5 bg-theme-surface border border-theme-border-soft rounded text-[10px] font-bold">→</kbd> to step through this guide. Press <kbd className="px-1.5 py-0.5 bg-theme-surface border border-theme-border-soft rounded text-[10px] font-bold">Esc</kbd> to exit.
                </p>
              </div>
            </div>

            {/* RIGHT: Quick Details / Related Guides */}
            <div className="hidden lg:block w-64 shrink-0 border-l border-theme-border-soft bg-theme-surface/20 p-4 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-theme-muted">
                  Quick Details
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between py-1 border-b border-theme-border-soft/60">
                    <span className="text-theme-muted font-semibold">Difficulty</span>
                    <span className="font-bold text-theme-primary capitalize">{guide.difficulty}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-theme-border-soft/60">
                    <span className="text-theme-muted font-semibold">Duration</span>
                    <span className="font-bold text-theme-primary">{guide.duration}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-theme-muted font-semibold">Category</span>
                    <span className="font-bold text-theme-accent capitalize">{guide.category}</span>
                  </div>
                </div>
              </div>

              {relatedGuidesList.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-theme-border-soft">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-theme-muted">
                    Related Guides
                  </p>
                  <div className="space-y-1.5">
                    {relatedGuidesList.map(rg => (
                      <button
                        key={rg.id}
                        onClick={() => {
                          onSelectGuide(rg);
                          setActiveStepIndex(0);
                        }}
                        className="w-full text-left p-2 rounded-xl bg-theme-surface hover:bg-theme-card border border-theme-border-soft text-xs font-bold text-theme-primary transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <span className="truncate flex-1">{rg.titleEn || rg.title}</span>
                        <ArrowRight className="w-3 h-3 text-theme-muted group-hover:text-theme-accent group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Bottom Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-theme-border-soft bg-theme-surface/70 flex items-center justify-between shrink-0">
            <button
              disabled={activeStepIndex === 0}
              onClick={() => setActiveStepIndex(prev => Math.max(0, prev - 1))}
              className="px-4 py-2 rounded-xl text-xs font-bold text-theme-secondary bg-theme-surface border border-theme-border-soft hover:bg-theme-card disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-2">
              {isLastStep ? (
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-theme-accent text-white hover:opacity-95 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete Tutorial</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveStepIndex(prev => Math.min(guide.steps.length - 1, prev + 1))}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-theme-accent text-white hover:opacity-95 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Global Command Search Palette Modal (⌘K / Ctrl+K) (Module-Aware)
const CommandSearchPalette = ({ isOpen, onClose, onSelectResult, isDocActive }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const guideResults = guides
      .filter(g => isDocActive(g) && ((g.title || '').toLowerCase().includes(q) || (g.titleEn || '').toLowerCase().includes(q)))
      .map(g => ({ type: 'Guide', item: g, title: g.titleEn || g.title, icon: g.icon || 'FileText', desc: g.duration }));

    const workflowResults = visualWorkflows
      .filter(w => isDocActive(w) && (w.title.toLowerCase().includes(q) || w.description.toLowerCase().includes(q)))
      .map(w => ({ type: 'Workflow', item: w, title: w.title, icon: 'PlayCircle', desc: w.description }));

    const troubleResults = troubleshootingItems
      .filter(t => isDocActive(t) && (t.problem.toLowerCase().includes(q) || t.solution.toLowerCase().includes(q)))
      .map(t => ({ type: 'Troubleshooting', item: t, title: t.problem, icon: 'Wrench', desc: t.solution }));

    const faqResults = faqs
      .filter(f => isDocActive(f) && (f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)))
      .map(f => ({ type: 'FAQ', item: f, title: f.question, icon: 'HelpCircle', desc: f.answer }));

    const featureResults = featureExplorer
      .filter(feat => isDocActive(feat) && (feat.title.toLowerCase().includes(q) || feat.what.toLowerCase().includes(q)))
      .map(feat => ({ type: 'Feature', item: feat, title: feat.title, icon: 'Zap', desc: feat.what }));

    return [...guideResults, ...workflowResults, ...troubleResults, ...faqResults, ...featureResults].slice(0, 10);
  }, [query, isDocActive]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 pt-16 sm:pt-24"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: -10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: -10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-theme-card w-full max-w-xl rounded-2xl shadow-2xl border border-theme-border-soft overflow-hidden flex flex-col max-h-[70vh]"
        >
          <div className="p-3.5 border-b border-theme-border-soft flex items-center gap-3">
            <Search className="w-4 h-4 text-theme-muted ml-1 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search active guides, workflows, troubleshooting, FAQs..."
              className="w-full bg-transparent border-none text-xs sm:text-sm font-semibold text-theme-primary placeholder-theme-muted focus:outline-none"
            />
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-black bg-theme-surface text-theme-muted border border-theme-border-soft">
              ESC
            </kbd>
          </div>

          <div className="overflow-y-auto p-2 space-y-1 flex-1">
            {searchResults.map((res, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelectResult(res);
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-theme-surface transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
                    <DynamicIcon name={res.icon} className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-theme-primary truncate group-hover:text-theme-accent transition-colors">
                      {res.title}
                    </p>
                    <p className="text-[11px] font-medium text-theme-muted truncate line-clamp-1">
                      {res.desc}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-theme-surface text-theme-muted border border-theme-border-soft shrink-0">
                  {res.type}
                </span>
              </button>
            ))}

            {query && searchResults.length === 0 && (
              <div className="p-8 text-center text-xs text-theme-muted">
                No matching active documentation found for "{query}".
              </div>
            )}

            {!query && (
              <div className="p-4 text-center text-xs text-theme-muted space-y-1">
                <p className="font-bold text-theme-secondary">Quick Search Suggestions</p>
                <div className="flex justify-center gap-1.5 pt-1">
                  {['Invoices', 'Payments', 'Customers', 'Cloud Sync', 'PDF'].map(s => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="px-2 py-0.5 rounded-lg bg-theme-surface text-[10px] font-semibold text-theme-muted hover:text-theme-primary border border-theme-border-soft cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Help Center 5.0 — BillQyro Product Education & Academy Hub
 */
const HelpCenter = ({ setCurrentTab, activeWorkspaceId, businessSettings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const searchInputRef = useRef(null);
  const workspaceToolsRef = useRef(null);

  // Single Source of Truth: Active workspace feature control
  const activeWsId = businessSettings?.activeWorkspaceId || activeWorkspaceId || 'default';
  const { isFeatureEnabled, loading: featuresLoading } = useFeatureControl(activeWsId);

  // Modular Documentation Visibility Gate
  const isDocActive = useMemo(() => {
    return (item) => {
      if (!item) return false;
      if (featuresLoading) return true;
      if (item.universal === true) return true;
      if (!item.featureId && !item.moduleId) return true;
      const fid = item.featureId || item.moduleId;
      return isFeatureEnabled(fid);
    };
  }, [isFeatureEnabled, featuresLoading]);

  // Load recently viewed guides from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('billqyro_help_recent') || '[]');
      if (Array.isArray(saved)) setRecentlyViewed(saved);
    } catch {
      // safe fallback
    }
  }, []);

  const trackRecentlyViewed = (guide) => {
    if (!guide) return;
    try {
      const next = [guide.id, ...recentlyViewed.filter(id => id !== guide.id)].slice(0, 4);
      setRecentlyViewed(next);
      localStorage.setItem('billqyro_help_recent', JSON.stringify(next));
    } catch (e) {
      console.warn(e);
    }
  };

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter Active Categories
  const activeCategories = useMemo(() => {
    return categories.filter(c => isDocActive(c));
  }, [isDocActive]);

  // Filter Active Learning Roadmap Steps
  const activeRoadmap = useMemo(() => {
    return learningRoadmap.map(lvl => ({
      ...lvl,
      steps: lvl.steps.filter(s => isDocActive(s))
    })).filter(lvl => lvl.steps.length > 0);
  }, [isDocActive]);

  // Active Visual Workflows
  const activeWorkflows = useMemo(() => {
    return visualWorkflows.filter(w => isDocActive(w));
  }, [isDocActive]);

  // Active Core Capabilities
  const activeCapabilities = useMemo(() => {
    return coreCapabilities.filter(c => isDocActive(c));
  }, [isDocActive]);

  // Active Troubleshooting items
  const activeTroubleshooting = useMemo(() => {
    return troubleshootingItems.filter(t => isDocActive(t));
  }, [isDocActive]);

  // Filtered Articles / Tutorials
  const filteredGuides = useMemo(() => {
    return guides.filter(g => {
      if (!isDocActive(g)) return false;
      const matchCat = selectedCategory === 'all' || g.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;

      const matchText = (
        (g.title || '').toLowerCase().includes(q) ||
        (g.titleEn || '').toLowerCase().includes(q) ||
        (g.category || '').toLowerCase().includes(q) ||
        g.steps?.some(s => 
          (s.title || '').toLowerCase().includes(q) || 
          (s.titleEn || '').toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q) ||
          (s.descriptionEn || '').toLowerCase().includes(q)
        )
      );

      return matchCat && matchText;
    });
  }, [searchQuery, selectedCategory, isDocActive]);

  const recentGuidesList = useMemo(() => {
    return recentlyViewed
      .map(id => guides.find(g => g.id === id))
      .filter(g => g && isDocActive(g));
  }, [recentlyViewed, isDocActive]);

  const handleOpenTutorial = (guide) => {
    triggerLightHaptic();
    trackRecentlyViewed(guide);
    setActiveTutorial(guide);
  };

  // Workspace Name & Category Labels
  const currentWsName = businessSettings?.businessName || 'Your Business Workspace';
  const currentWsType = businessSettings?.businessType || 'Fintech / Retail Enterprise';

  return (
    <AnimatedPage>
      <div className="w-full space-y-9 pb-32 select-none">
        
        {/* TOP DEDICATED ACADEMY HEADER */}
        <div className="bg-theme-card rounded-2xl p-3 sm:p-4 border border-theme-border-soft shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-theme-primary tracking-tight">
                BillQyro Product Academy
              </h2>
              <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                Learn, Explore & Master Your Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCommandOpen(true)}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-theme-surface hover:bg-theme-surface/80 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-secondary transition-all flex items-center justify-between sm:justify-start gap-3 cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-theme-muted" />
                <span>Search Documentation...</span>
              </div>
              <kbd className="px-1.5 py-0.2 rounded text-[9px] font-black bg-theme-card border border-theme-border-soft text-theme-muted">
                ⌘ K
              </kbd>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden md:inline">All Systems Operational</span>
            </div>
          </div>
        </div>

        {/* 2. HERO — "LEARN BILLQYRO" */}
        <div className="relative rounded-3xl p-6 sm:p-10 border border-theme-border-soft bg-theme-card/90 backdrop-blur-xl shadow-xs overflow-hidden text-center space-y-6">
          <div className="absolute inset-0 bg-gradient-to-b from-theme-accent/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
              <Sparkles className="w-3 h-3" />
              <span>BILLQYRO HELP CENTER 5.0 • ACADEMY</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-theme-primary tracking-tight">
              Everything you need to master BillQyro.
            </h1>
            
            <p className="text-xs sm:text-sm font-semibold text-theme-muted leading-relaxed max-w-xl mx-auto">
              Learn your workspace, explore every active feature, follow visual walkthroughs, and get answers without leaving BillQyro.
            </p>
          </div>

          {/* Central Search Box */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-theme-muted pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search active guides, workflows, invoices, payments, customers..."
                className="w-full pl-11 pr-24 py-3.5 bg-theme-surface border border-theme-border-soft hover:border-theme-border-strong focus:border-theme-accent rounded-2xl text-xs sm:text-sm font-semibold text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/20 shadow-inner transition-all"
              />

              <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
                {searchQuery ? (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-lg text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-black text-theme-muted bg-theme-card border border-theme-border-soft rounded-md shadow-xs">
                    ⌘ K
                  </kbd>
                )}
              </div>
            </div>
          </div>

          {/* Quick Hero Action CTAs */}
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <button
              onClick={() => {
                triggerSuccessHaptic();
                setIsTourOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-theme-accent text-white hover:opacity-95 shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Start Interactive Tour</span>
            </button>
            <button
              onClick={() => workspaceToolsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-theme-surface border border-theme-border-soft text-theme-primary hover:bg-theme-card shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Your Workspace</span>
            </button>
          </div>
        </div>

        {/* 3. YOUR BILLQYRO WORKSPACE SECTION */}
        {!searchQuery && (
          <section ref={workspaceToolsRef} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-theme-accent">
                    YOUR WORKSPACE
                  </span>
                  <span className="text-theme-muted text-xs">•</span>
                  <span className="text-xs font-black text-theme-primary">{currentWsName}</span>
                </div>
                <p className="text-xs font-medium text-theme-muted mt-0.5">
                  Configured with active tools for <strong className="text-theme-secondary capitalize">{currentWsType}</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {activeCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-2xl bg-theme-card border border-theme-border-soft hover:border-theme-accent/50 transition-all flex flex-col justify-between space-y-3 group shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center font-bold">
                        <DynamicIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </div>
                    <h3 className="text-xs font-black text-theme-primary group-hover:text-theme-accent transition-colors truncate">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-theme-muted line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-theme-border-soft flex items-center justify-between text-[10px] font-bold">
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className="text-theme-secondary hover:text-theme-accent cursor-pointer"
                    >
                      Learn
                    </button>
                    <button
                      onClick={() => {
                        const targetTab = cat.id === 'invoices' ? 'invoices' : cat.id === 'customers' ? 'customers' : cat.id === 'reports' ? 'reports' : cat.id === 'settings' ? 'settings' : 'dashboard';
                        setCurrentTab && setCurrentTab(targetTab);
                      }}
                      className="text-theme-accent hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. "SEE BILLQYRO IN ACTION" (Visual Real Workflow Cards) */}
        {!searchQuery && activeWorkflows.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-theme-primary tracking-tight">
                See how BillQyro works
              </h2>
              <p className="text-xs font-semibold text-theme-muted">
                Follow real workflows with interactive visual previews before you start.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeWorkflows.map((wf) => (
                <div
                  key={wf.id}
                  className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft space-y-4 flex flex-col justify-between shadow-xs hover:border-theme-border-strong transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                        {wf.tag}
                      </span>
                      <span className="text-[11px] font-bold text-theme-muted">Visual Flow</span>
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-theme-primary">
                      {wf.title}
                    </h3>
                    <p className="text-xs font-medium text-theme-secondary leading-relaxed">
                      {wf.description}
                    </p>

                    {/* Step Progression Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {wf.steps.map((st, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-theme-surface text-theme-muted border border-theme-border-soft"
                        >
                          {st}
                        </span>
                      ))}
                    </div>

                    {/* High-Fidelity UI Snippet Simulation */}
                    <div className="p-3.5 rounded-xl bg-theme-surface/80 border border-theme-border-soft text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-theme-primary">
                          {wf.preview.client || wf.preview.collected || wf.preview.revenue}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {wf.preview.status || wf.preview.badge || wf.preview.collection}
                        </span>
                      </div>
                      <p className="text-[11px] text-theme-muted font-numbers">
                        {wf.preview.item || wf.preview.remaining || wf.preview.billed || wf.preview.margin}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-theme-border-soft flex items-center justify-between">
                    <button
                      onClick={() => {
                        const targetGuide = guides.find(g => g.id === (wf.id === 'vw-invoice' ? 'create-first-invoice' : wf.id === 'vw-payment' ? 'track-payments' : wf.id === 'vw-customers' ? 'add-customer' : 'create-first-invoice'));
                        if (targetGuide) handleOpenTutorial(targetGuide);
                      }}
                      className="text-xs font-bold text-theme-secondary hover:text-theme-primary flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-theme-accent" />
                      <span>Watch Walkthrough</span>
                    </button>
                    <button
                      onClick={() => setCurrentTab && setCurrentTab(wf.tab)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-theme-accent text-white hover:opacity-95 shadow-xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>Try It Yourself</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. BEGINNER → ADVANCED LEARNING ROADMAP */}
        {!searchQuery && activeRoadmap.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-theme-primary tracking-tight">
                BillQyro Learning Path
              </h2>
              <p className="text-xs font-semibold text-theme-muted">
                Step-by-step master progression from foundational setup to advanced financial controls.
              </p>
            </div>

            <div className="space-y-4">
              {activeRoadmap.map((lvl) => (
                <div
                  key={lvl.level}
                  className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft space-y-3 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-theme-border-soft/60 pb-2.5">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-theme-accent">
                        {lvl.levelTitle}
                      </span>
                      <p className="text-xs font-medium text-theme-muted">{lvl.subtitle}</p>
                    </div>
                    <span className="text-[10px] font-bold text-theme-muted font-numbers">
                      {lvl.steps.length} modules
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                    {lvl.steps.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => setCurrentTab && setCurrentTab(st.tab)}
                        className="p-3 rounded-xl bg-theme-surface/60 hover:bg-theme-surface border border-theme-border-soft hover:border-theme-accent/40 transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-theme-accent font-numbers">
                              {st.num}
                            </span>
                            <span className="text-[9px] font-bold text-theme-muted font-numbers">
                              {st.time}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-theme-primary group-hover:text-theme-accent transition-colors">
                            {st.title}
                          </h4>
                          <p className="text-[11px] text-theme-muted leading-relaxed">
                            {st.desc}
                          </p>
                        </div>
                        <div className="text-[10px] font-bold text-theme-accent flex items-center justify-between pt-1 border-t border-theme-border-soft/40">
                          <span>Open screen</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. "WHAT CAN I DO WITH BILLQYRO?" (Core Capabilities) */}
        {!searchQuery && activeCapabilities.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-theme-primary tracking-tight">
                What can you do with BillQyro?
              </h2>
              <p className="text-xs font-semibold text-theme-muted">
                Essential pillars designed to keep your business billing synchronized and error-free.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {activeCapabilities.map((cap) => (
                <div
                  key={cap.id}
                  className="bg-theme-card rounded-2xl p-4 sm:p-5 border border-theme-border-soft hover:border-theme-border-strong transition-all flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center font-bold">
                        <DynamicIcon name={cap.icon} className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-theme-surface text-theme-accent border border-theme-border-soft">
                        {cap.action}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-theme-primary">
                      {cap.title}
                    </h3>
                    <p className="text-xs font-medium text-theme-secondary leading-relaxed">
                      {cap.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => setCurrentTab && setCurrentTab(cap.tab)}
                    className="w-full text-left pt-2 border-t border-theme-border-soft flex items-center justify-between text-xs font-bold text-theme-accent cursor-pointer group"
                  >
                    <span>Open Feature</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. INTERACTIVE TUTORIALS & GUIDES */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-theme-primary tracking-tight">
              Interactive Tutorials ({filteredGuides.length})
            </h2>
            <p className="text-xs font-semibold text-theme-muted">
              Step-by-step walkthroughs to master your active platform workflows.
            </p>
          </div>

          {filteredGuides.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredGuides.map((guide) => (
                <div
                  key={guide.id}
                  onClick={() => handleOpenTutorial(guide)}
                  className="group bg-theme-card rounded-2xl p-4 sm:p-5 border border-theme-border-soft hover:border-theme-border-strong hover:shadow-md transition-all flex flex-col justify-between cursor-pointer space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center font-bold">
                        <DynamicIcon name={guide.icon} className="w-5 h-5" />
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        guide.difficulty === 'beginner' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {guide.difficulty}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-theme-primary group-hover:text-theme-accent transition-colors">
                        {guide.titleEn || guide.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-theme-muted font-bold mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{guide.duration}</span>
                        <span>•</span>
                        <span>{guide.steps.length} steps</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-theme-border-soft flex items-center justify-between text-xs font-bold text-theme-accent">
                    <span>View Guide & Walkthrough</span>
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-theme-card border border-theme-border-soft text-center space-y-2">
              <HelpCircle className="w-8 h-8 text-theme-muted mx-auto" />
              <p className="text-sm font-bold text-theme-primary">No tutorials match your filter</p>
              <p className="text-xs text-theme-muted">Try clearing your search query or choosing another category.</p>
            </div>
          )}
        </section>

        {/* 8. VISUAL TROUBLESHOOTING CENTER ("Something not working?") */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-theme-primary tracking-tight">
              Something not working?
            </h2>
            <p className="text-xs font-semibold text-theme-muted">
              Diagnostic guidelines and instant fixes for your active system features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {activeTroubleshooting.map((item) => (
              <div
                key={item.id}
                className="bg-theme-card rounded-2xl p-4 sm:p-5 border border-theme-border-soft hover:border-theme-border-strong transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-theme-accent shrink-0" />
                      <h3 className="text-xs sm:text-sm font-black text-theme-primary">
                        {item.problem}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-theme-surface border border-theme-border-soft text-theme-muted shrink-0">
                      {item.tag}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5">
                    <p className="text-theme-muted font-semibold">
                      <strong className="text-theme-secondary">Likely Cause:</strong> {item.cause}
                    </p>
                    <p className="text-theme-primary font-bold">
                      <strong className="text-theme-accent">Quick Fix:</strong> {item.solution}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-theme-border-soft text-[10px] font-extrabold uppercase tracking-wider text-theme-muted">
                  Domain: {item.category}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 9. FAQ ACCORDION SECTION */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-theme-primary tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs font-semibold text-theme-muted">
              Answers to common operational, pricing, calculation, and data privacy questions.
            </p>
          </div>

          <FAQAccordion searchQuery={searchQuery} isDocActive={isDocActive} />
        </section>

        {/* 10. SYSTEM STATUS & SUPPORT */}
        <section className="bg-theme-card rounded-3xl p-6 sm:p-8 border border-theme-border-soft shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  All Systems Operational • Local Health Verified
                </span>
              </div>
              <h3 className="text-base font-black text-theme-primary">
                Still need help or have a question?
              </h3>
              <p className="text-xs font-medium text-theme-muted">
                Our documentation dynamically adapts to your active business modules and workspace presets.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setCurrentTab && setCurrentTab('settings')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-theme-surface border border-theme-border-soft text-theme-primary hover:bg-theme-card shadow-xs transition-all cursor-pointer"
              >
                Open Settings Studio
              </button>
              <button
                onClick={() => setIsCommandOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-theme-accent text-white hover:opacity-95 shadow-xs transition-all cursor-pointer"
              >
                Command Search
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Interactive Product Tour Modal */}
      <InteractiveProductTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        setCurrentTab={setCurrentTab}
      />

      {/* Tutorial Reader Modal */}
      {activeTutorial && (
        <TutorialReaderModal 
          guide={activeTutorial} 
          onClose={() => setActiveTutorial(null)}
          setCurrentTab={setCurrentTab}
          onSelectGuide={(g) => handleOpenTutorial(g)}
          isDocActive={isDocActive}
        />
      )}

      {/* Global ⌘K Command Search Palette */}
      <CommandSearchPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onSelectResult={(res) => {
          if (res.type === 'Guide') handleOpenTutorial(res.item);
          else if (res.type === 'Workflow') {
            if (setCurrentTab && res.item.tab) setCurrentTab(res.item.tab);
          } else if (res.type === 'Feature') {
            setSelectedCategory('all');
          }
        }}
        isDocActive={isDocActive}
      />
    </AnimatedPage>
  );
};

export default HelpCenter;
