import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Clock, ChevronRight, Play, CheckCircle2, 
  HelpCircle, BookOpen, Video, LifeBuoy, AlertTriangle, 
  FileText, Users, Package, DollarSign, LayoutDashboard,
  ArrowRight, ShieldAlert, Zap, MessageSquare, Phone
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { guides, categories, faqs } from '../data/guides';
import { t } from '../utils/i18n';

// --- SUB-COMPONENTS ---

// FAQ Accordion Component
const FAQAccordion = () => {
  const [openIndex, setOpenIndex] = useState(null);
  
  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <div key={index} className="bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-2xl overflow-hidden shadow-sm hover:border-theme-accent/50 transition-colors">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-5 md:px-6 py-4 text-left flex items-center justify-between hover:bg-theme-surface transition-colors"
          >
            <span className="font-bold text-theme-primary text-sm md:text-base pr-4">
              {faq.questionEn || faq.question}
            </span>
            <ChevronRight className={`w-5 h-5 text-theme-muted shrink-0 transition-transform ${
              openIndex === index ? 'rotate-90 text-theme-accent' : ''
            }`} />
          </button>
          
          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-theme-surface"
              >
                <div className="px-5 md:px-6 py-4 border-t border-theme-border-soft text-theme-muted text-sm leading-relaxed font-medium">
                  {faq.answerEn || faq.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

// Guide Detail Modal (Step-by-step view)
const GuideDetailModal = ({ guide, onClose }) => {
  const IconComponent = Icons[guide.icon] || Icons.FileText;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-theme-app w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col border border-theme-border-soft"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-theme-app/90 backdrop-blur-md border-b border-theme-border-soft px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-theme-accent-light flex items-center justify-center rounded-2xl">
                <IconComponent className="w-6 h-6 text-theme-accent" />
              </div>
              <div>
                <h2 className="text-xl font-black text-theme-primary">
                  {guide.titleEn || guide.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-theme-muted mt-1 font-bold tracking-wider uppercase">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {guide.duration}
                  </div>
                  <div className={`px-2 py-0.5 rounded-md ${
                      guide.difficulty === 'beginner' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      guide.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                    }`}>
                      {guide.difficulty}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-theme-surface hover:bg-theme-border-soft rounded-full transition-colors text-theme-muted hover:text-theme-primary shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-8">
            <div className="space-y-6">
              {guide.steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 md:gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[image:var(--accent-gradient)] text-white flex items-center justify-center font-black shadow-lg shrink-0">
                      {idx + 1}
                    </div>
                    {idx !== guide.steps.length - 1 && (
                      <div className="w-0.5 h-full bg-theme-border-soft my-2 group-hover:bg-theme-accent/50 transition-colors"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <h3 className="text-lg font-black text-theme-primary mb-2">
                      {step.titleEn || step.title}
                    </h3>
                    <p className="text-theme-muted text-sm md:text-base font-medium leading-relaxed bg-theme-surface p-4 rounded-2xl border border-theme-border-soft">
                      {step.descriptionEn || step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-auto border-t border-theme-border-soft p-5 flex justify-end bg-theme-surface rounded-b-3xl">
             <button
              onClick={onClose}
              className="px-8 py-2.5 bg-theme-primary text-theme-app font-bold rounded-xl shadow-md hover:scale-95 transition-transform"
            >
              Close Tutorial
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- MAIN HELP CENTER PAGE ---

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuide, setSelectedGuide] = useState(null);

  // 1. Welcome Guide Data
  const welcomeCards = [
    { title: 'Setup Business Profile', icon: 'Building', guideId: 'business-profile' },
    { title: 'Add Customers', icon: 'UserPlus', guideId: 'add-customer' },
    { title: 'Add Products', icon: 'PackagePlus', guideId: 'add-product' },
    { title: 'Create Invoice', icon: 'FileText', guideId: 'create-first-invoice' },
    { title: 'Download PDF', icon: 'FileDown', guideId: 'print-download-invoice' },
    { title: 'Use Due Ledger', icon: 'BookOpen', guideId: 'track-payments' },
    { title: 'Create Estimate', icon: 'FileSpreadsheet', guideId: 'create-first-invoice' },
    { title: 'View Reports', icon: 'PieChart', guideId: 'track-payments' },
    { title: 'Share Invoice Links', icon: 'Link', guideId: 'live-payment-link' },
    { title: 'Backup Data', icon: 'HardDriveDownload', guideId: 'backup-data' },
  ];

  // 6. Troubleshooting Data
  const troubleshootIssues = [
    { problem: 'Offline Sync not working', cause: 'Browser cache full or no connection.', solution: 'Check your internet connection. Go to Settings > Data & Backup and click "Force Manual Sync".' },
    { problem: 'PDF rendering is slow', cause: 'Using very large high-res logo image.', solution: 'Compress your business logo to under 500KB in Business Profile settings.' },
    { problem: 'Login issues / Blank screen', cause: 'Stale browser session.', solution: 'Clear browser cookies for this site and refresh the page.' },
    { problem: 'Cannot change to Pro Theme', cause: 'Free tier limits reached.', solution: 'Upgrade your subscription from the Settings page.' },
  ];

  // 7. Video Learning
  const videos = [
    { title: 'BillQyro Masterclass: Invoicing 101', duration: '5:30' },
    { title: 'How to manage Customer Ledgers', duration: '3:45' },
    { title: 'Customizing your PDF Themes', duration: '4:20' }
  ];

  // Search filter
  const filteredGuides = useMemo(() => {
    if (!searchQuery) return guides;
    const lowerQuery = searchQuery.toLowerCase();
    return guides.filter(guide => 
      (guide.titleEn || '').toLowerCase().includes(lowerQuery) ||
      (guide.title || '').toLowerCase().includes(lowerQuery) ||
      (guide.category || '').toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  const openGuide = (guideId) => {
    const guide = guides.find(g => g.id === guideId);
    if (guide) setSelectedGuide(guide);
  };

  return (
    <div className="min-h-screen bg-theme-app pb-24">
      
      {/* HEADER BANNER */}
      <div className="bg-theme-card border-b border-theme-border-soft px-4 md:px-8 py-10 md:py-16 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-theme-accent/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-theme-accent-light text-theme-accent text-xs font-black uppercase tracking-widest mb-4 shadow-sm border border-theme-accent/20">
            <HelpCircle className="w-4 h-4" /> Help Center 2.0
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-theme-primary tracking-tight mb-4">
            How can we help you today?
          </h1>
          <p className="text-theme-muted text-lg font-medium max-w-2xl mb-8">
            Learn how to use BillQyro, find troubleshooting steps, and master SaaS billing.
          </p>

          {/* SECTION 2: SEARCH */}
          <div className="w-full max-w-2xl relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="w-6 h-6 text-theme-muted group-focus-within:text-theme-accent transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides (e.g., 'invoice', 'due', 'pdf')..."
              className="w-full pl-14 pr-12 py-5 bg-theme-surface border-2 border-theme-border-soft rounded-2xl text-lg text-theme-primary placeholder:text-theme-muted/70 font-bold focus:outline-none focus:border-theme-accent shadow-premium transition-all"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center"
                >
                  <div className="p-2 bg-theme-card rounded-full hover:bg-theme-border-soft transition-colors shadow-sm border border-theme-border-soft">
                    <X className="w-5 h-5 text-theme-muted" />
                  </div>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-16 mt-4">

        {/* SECTION 1: WELCOME GUIDE (Action Cards) */}
        {!searchQuery && (
          <section>
            <h2 className="text-2xl font-black text-theme-primary mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" /> Quick Start Guide
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {welcomeCards.map((card, i) => {
                const Icon = Icons[card.icon] || FileText;
                return (
                  <button 
                    key={i} 
                    onClick={() => openGuide(card.guideId)}
                    className="bg-theme-card border border-theme-border-soft p-4 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-theme-surface hover:border-theme-accent transition-all group shadow-sm hover:shadow-md hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 bg-theme-surface rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-theme-primary group-hover:text-theme-accent transition-colors" />
                    </div>
                    <span className="text-xs font-bold text-theme-primary leading-tight">{card.title}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* SECTION 4: INTERACTIVE TUTORIALS (Filtered) */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-theme-primary flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-theme-accent" /> 
              {searchQuery ? 'Search Results' : 'Interactive Tutorials'}
            </h2>
            {searchQuery && (
              <span className="px-3 py-1 bg-theme-surface rounded-full text-xs font-bold text-theme-muted">
                {filteredGuides.length} found
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredGuides.map(guide => {
                const IconComponent = Icons[guide.icon] || Icons.FileText;
                return (
                  <motion.div
                    layout
                    key={guide.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedGuide(guide)}
                    className="p-6 bg-theme-card border border-theme-border-soft rounded-3xl cursor-pointer hover:border-theme-accent hover:shadow-premium transition-all group flex flex-col h-full relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[image:var(--accent-gradient)] opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity"></div>
                    
                    <div className="flex items-start justify-between mb-5 relative z-10">
                      <div className="p-3 bg-theme-surface rounded-2xl group-hover:scale-110 transition-transform border border-theme-border-soft group-hover:border-theme-accent/30">
                        <IconComponent className="w-6 h-6 text-theme-accent" />
                      </div>
                      {guide.premium && (
                        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-200 dark:border-amber-900/50 shadow-sm">PRO</span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-black text-theme-primary mb-3 leading-snug group-hover:text-theme-accent transition-colors relative z-10">
                      {guide.titleEn || guide.title}
                    </h3>
                    
                    <div className="mt-auto pt-5 border-t border-theme-border-soft/50 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-1.5 text-xs text-theme-muted font-bold">
                        <Clock className="w-4 h-4" /> {guide.duration}
                      </div>
                      <div className="text-theme-accent font-bold text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {filteredGuides.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-16 text-center bg-theme-card rounded-3xl border-2 border-theme-border-soft border-dashed"
                >
                  <Search className="w-12 h-12 text-theme-muted mb-4 mx-auto opacity-50" />
                  <p className="text-theme-primary font-bold text-xl">No guides found for "{searchQuery}"</p>
                  <p className="text-theme-muted font-medium mt-2">Try searching for generic terms like 'invoice' or 'settings'</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {!searchQuery && (
          <>
            {/* SECTION 5: FAQ SYSTEM */}
            <section className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-black text-theme-primary mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-theme-accent" /> Frequently Asked Questions
              </h2>
              <FAQAccordion />
            </section>

            {/* SECTION 6: TROUBLESHOOTING CENTER */}
            <section>
              <h2 className="text-2xl font-black text-theme-primary mb-6 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-rose-500" /> Troubleshooting Center
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {troubleshootIssues.map((issue, i) => (
                  <div key={i} className="bg-theme-card border border-theme-border-soft p-5 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-black text-theme-primary mb-3 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> {issue.problem}
                    </h3>
                    <div className="space-y-3 pl-6">
                      <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 p-3 rounded-xl text-xs font-bold border border-rose-100 dark:border-rose-900/30">
                        <span className="uppercase tracking-wider text-[10px] block mb-1 opacity-70">Likely Cause:</span>
                        {issue.cause}
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl text-xs font-bold border border-emerald-100 dark:border-emerald-900/30">
                        <span className="uppercase tracking-wider text-[10px] block mb-1 opacity-70">Solution:</span>
                        {issue.solution}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 7: VIDEO LEARNING READY */}
            <section>
              <h2 className="text-2xl font-black text-theme-primary mb-6 flex items-center gap-2">
                <Video className="w-6 h-6 text-indigo-500" /> Video Learning
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {videos.map((vid, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="w-full aspect-video bg-theme-surface border border-theme-border-soft rounded-2xl mb-3 flex items-center justify-center relative overflow-hidden group-hover:border-indigo-500/50 transition-colors">
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors"></div>
                      <div className="w-12 h-12 bg-white/90 rounded-full shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform z-10">
                        <Play className="w-5 h-5 text-indigo-600 ml-1" />
                      </div>
                      <span className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                        {vid.duration}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-theme-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{vid.title}</h4>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 8: SMART CONTACT SUPPORT */}
            <section className="bg-[image:var(--accent-gradient)] rounded-3xl p-8 md:p-12 text-white shadow-premium relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h2 className="text-3xl font-black mb-2">Still need help?</h2>
                  <p className="text-white/80 font-medium">Our support team and documentation are here for you.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all backdrop-blur-sm whitespace-nowrap">
                    <FileText className="w-4 h-4" /> Full Docs
                  </button>
                  <button className="px-6 py-3 bg-white text-theme-app hover:scale-95 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform shadow-xl whitespace-nowrap">
                    <Phone className="w-4 h-4" /> Contact Admin
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

      </div>

      {/* MODAL */}
      {selectedGuide && (
        <GuideDetailModal
          guide={selectedGuide}
          onClose={() => setSelectedGuide(null)}
        />
      )}
    </div>
  );
};

export default HelpCenter;
