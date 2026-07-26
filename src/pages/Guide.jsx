import { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { guides, categories, faqs as faqsData } from '../data/guides';

// FAQ Accordion Component
const FAQAccordion = ({ language }) => {
  const [openIndex, setOpenIndex] = useState(null);
  
  return (
    <div className="space-y-3">
      {faqsData.map((faq, index) => (
        <div key={index} className="bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl overflow-hidden shadow-sm hover:border-theme-border-strong transition-colors">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-5 md:px-6 py-4 text-left flex items-center justify-between hover:bg-theme-app dark:hover:bg-theme-surface transition-colors"
          >
            <span className="font-semibold text-theme-primary dark:text-theme-primary text-sm md:text-base">
              {language === 'bn' ? faq.question : faq.questionEn}
            </span>
            <ChevronRight className={`w-5 h-5 text-theme-muted transition-transform ${
              openIndex === index ? 'rotate-90' : ''
            }`} />
          </button>
          
          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-theme-app dark:bg-theme-surface"
              >
                <div className="px-5 md:px-6 py-4 border-t border-theme-border-soft text-theme-muted text-sm leading-relaxed">
                  {language === 'bn' ? faq.answer : faq.answerEn}
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
const GuideDetailModal = ({ guide, language, onClose }) => {
  const IconComponent = Icons[guide.icon] || Icons.FileText;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-theme-app dark:bg-theme-app max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col border border-theme-border-soft"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-theme-app/90 dark:bg-theme-app/90 backdrop-blur-md border-b border-theme-border-soft px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-theme-accent-light text-theme-accent rounded-xl">
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-theme-primary dark:text-theme-primary">
                  {language === 'bn' ? guide.title : guide.titleEn}
                </h2>
                <div className="flex items-center gap-3 text-xs text-theme-muted mt-1 font-medium">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {guide.duration}
                  </div>
                  <div className={`px-2 py-0.5 rounded-md ${
                      guide.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      guide.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                    }`}>
                      {guide.difficulty === 'beginner' ? (language === 'bn' ? 'নতুন' : 'Beginner') :
                       guide.difficulty === 'intermediate' ? (language === 'bn' ? 'মধ্যম' : 'Intermediate') :
                       (language === 'bn' ? 'উন্নত' : 'Advanced')}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-theme-surface dark:hover:bg-theme-surface rounded-full transition-colors text-theme-muted hover:text-theme-primary"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-8">
            {/* Steps */}
            <div className="space-y-6">
              {guide.steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 md:gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-theme-accent text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                      {idx + 1}
                    </div>
                    {idx !== guide.steps.length - 1 && (
                      <div className="w-0.5 h-full bg-theme-border-soft dark:bg-theme-border-strong my-2 group-hover:bg-theme-accent/50 transition-colors"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <h3 className="text-base md:text-lg font-bold text-theme-primary dark:text-theme-primary mb-2">
                      {language === 'bn' ? step.title : step.titleEn}
                    </h3>
                    <p className="text-theme-muted text-sm md:text-base leading-relaxed bg-theme-card dark:bg-theme-card p-4 rounded-xl border border-theme-border-soft">
                      {language === 'bn' ? step.description : step.descriptionEn}
                    </p>
                    
                    {step.image && (
                      <div className="mt-4 w-full h-48 md:h-64 bg-theme-surface dark:bg-theme-surface border border-theme-border-soft rounded-xl flex items-center justify-center overflow-hidden relative group-hover:border-theme-accent/30 transition-colors">
                        {/* Placeholder for actual image */}
                        <div className="text-center text-theme-muted">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs font-semibold uppercase tracking-wider">Example Image</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Video Placeholder */}
            {guide.videoUrl !== undefined && (
              <div className="mt-8 pt-8 border-t border-theme-border-soft">
                <h3 className="text-sm font-bold text-theme-primary dark:text-theme-primary mb-4 flex items-center gap-2">
                  <Play className="w-4 h-4 text-theme-accent" />
                  {language === 'bn' ? 'ভিডিও টিউটোরিয়াল' : 'Video Tutorial'}
                </h3>
                <div className="w-full aspect-video bg-theme-surface dark:bg-theme-surface rounded-2xl border border-theme-border-soft flex items-center justify-center group cursor-pointer hover:border-theme-accent transition-all relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors"></div>
                  <div className="w-16 h-16 rounded-full bg-white/90 shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform z-10">
                    <Play className="w-6 h-6 text-theme-accent ml-1" />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="mt-auto border-t border-theme-border-soft p-4 flex justify-end bg-theme-card dark:bg-theme-card rounded-b-3xl">
             <button
              onClick={onClose}
              className="px-6 py-2 bg-theme-accent text-white font-bold rounded-xl shadow-md hover:bg-theme-accent/90 transition-colors"
            >
              {language === 'bn' ? 'বুঝতে পেরেছি' : 'Got it'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Guide = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [language, setLanguage] = useState('bn'); // 'bn' or 'en'
  
  // Filter guides
  const filteredGuides = useMemo(() => {
    return guides.filter(guide => {
      const matchesSearch = 
        guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.titleEn.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'all' || guide.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);
  
  return (
    <AnimatedPage>
      <div className="min-h-screen bg-theme-app dark:bg-theme-app p-4 md:p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-theme-accent-light text-theme-accent text-[10px] font-black uppercase tracking-wider mb-2">
                <Icons.HelpCircle className="w-3.5 h-3.5" />
                <span>Knowledge Base</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-theme-primary dark:text-theme-primary tracking-tight">
                {language === 'bn' ? 'সহায়তা কেন্দ্র' : 'Help Center'}
              </h1>
              <p className="text-theme-muted text-sm mt-1 font-medium">
                 {language === 'bn' ? 'কীভাবে BillQyro ব্যবহার করবেন তার বিস্তারিত গাইডলাইন' : 'Step-by-step guidelines on how to use BillQyro'}
              </p>
            </div>
            
            {/* Language Toggle */}
            <div className="flex items-center p-1 bg-theme-surface dark:bg-theme-surface border border-theme-border-soft rounded-xl shadow-sm self-start">
              <button
                onClick={() => setLanguage('bn')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  language === 'bn' 
                    ? 'bg-theme-accent text-white shadow-md' 
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  language === 'en' 
                    ? 'bg-theme-accent text-white shadow-md' 
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                English
              </button>
            </div>
          </div>
          
          {/* Search Bar (Sticky-ish) */}
          <div className="relative group z-10 max-w-3xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-theme-muted group-focus-within:text-theme-accent transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' ? 'কীভাবে ইনভয়েস তৈরি করব?' : 'How to create an invoice?'}
              className="w-full pl-12 pr-12 py-4 bg-theme-card dark:bg-theme-card border-2 border-theme-border-soft rounded-2xl text-theme-primary dark:text-theme-primary placeholder:text-theme-muted/70 font-semibold focus:outline-none focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/10 transition-all shadow-sm"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  <div className="p-1.5 bg-theme-surface rounded-full hover:bg-theme-border-soft transition-colors">
                    <X className="w-4 h-4 text-theme-muted" />
                  </div>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Category Filters */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide pt-2 -mx-4 px-4 md:mx-0 md:px-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-2.5 rounded-xl whitespace-nowrap font-bold text-sm transition-all border shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-theme-accent text-white border-theme-accent shadow-md scale-[1.02]'
                : 'bg-theme-card dark:bg-theme-card text-theme-muted border-theme-border-soft hover:border-theme-border-strong hover:text-theme-primary'
            }`}
          >
            {language === 'bn' ? 'সবগুলো' : 'All Topics'}
          </button>
          
          {categories.map(cat => {
            const IconComponent = Icons[cat.icon] || Icons.Folder;
            const isSelected = selectedCategory === cat.id;
            // Map custom colors to tailwind classes if needed, or use inline styles/theme classes
            // For simplicity, we use theme-accent for active states if custom colors aren't defined in CSS vars
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl whitespace-nowrap font-bold text-sm transition-all border shrink-0 group ${
                  isSelected
                    ? `bg-[image:var(--accent-gradient)] text-white border-transparent shadow-md scale-[1.02]`
                    : 'bg-theme-card dark:bg-theme-card text-theme-muted border-theme-border-soft hover:border-theme-border-strong hover:text-theme-primary'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-theme-muted group-hover:text-theme-primary'}`} />
                {language === 'bn' ? cat.nameBn : cat.name}
                {cat.premium && (
                  <span className={`px-2 py-0.5 text-[10px] uppercase rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    PRO
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Guides Grid */}
        <div className="space-y-4">
           <h2 className="text-xl font-extrabold text-theme-primary dark:text-theme-primary">
              {language === 'bn' ? 'টিউটোরিয়াল' : 'Tutorials'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredGuides.length > 0 ? filteredGuides.map(guide => {
                const IconComponent = Icons[guide.icon] || Icons.FileText;
                return (
                  <motion.div
                    layout
                    key={guide.id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setSelectedGuide(guide)}
                    className="p-5 md:p-6 bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-2xl cursor-pointer hover:border-theme-accent hover:shadow-premium hover:-translate-y-1 transition-all group flex flex-col h-full"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-theme-accent-light rounded-xl group-hover:scale-110 transition-transform">
                        <IconComponent className="w-6 h-6 text-theme-accent" />
                      </div>
                      
                      {guide.premium && (
                        <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-200 dark:border-amber-900/50">PRO</span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-theme-primary dark:text-theme-primary mb-3 leading-snug group-hover:text-theme-accent transition-colors">
                      {language === 'bn' ? guide.title : guide.titleEn}
                    </h3>
                    
                    <div className="mt-auto flex items-center justify-between">
                       <div className="flex items-center gap-3 text-xs text-theme-muted font-medium">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {guide.duration}
                        </div>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          guide.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          guide.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}>
                          {guide.difficulty === 'beginner' ? (language === 'bn' ? 'নতুন' : 'Beginner') :
                          guide.difficulty === 'intermediate' ? (language === 'bn' ? 'মধ্যম' : 'Intermediate') :
                          (language === 'bn' ? 'উন্নত' : 'Advanced')}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }) : (
                 <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full py-12 text-center flex flex-col items-center justify-center bg-theme-card dark:bg-theme-card rounded-2xl border border-theme-border-soft border-dashed"
                 >
                    <Search className="w-12 h-12 text-theme-muted mb-4 opacity-50" />
                    <p className="text-theme-primary dark:text-theme-primary font-bold text-lg">
                       {language === 'bn' ? 'কোন গাইড পাওয়া যায়নি' : 'No guides found'}
                    </p>
                    <p className="text-theme-muted text-sm mt-1">
                       {language === 'bn' ? 'অন্য কিছু লিখে খুঁজুন' : 'Try searching with a different keyword'}
                    </p>
                 </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="mt-12 pt-8 border-t border-theme-border-soft">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-theme-accent-light flex items-center justify-center text-theme-accent">
               <Icons.MessageCircleQuestion className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold text-theme-primary dark:text-theme-primary">
              {language === 'bn' ? 'সাধারণ প্রশ্ন ও উত্তর (FAQ)' : 'Frequently Asked Questions'}
            </h2>
          </div>
          <div className="max-w-4xl">
             <FAQAccordion language={language} />
          </div>
        </div>
        
      </div>
      
      {/* Guide Detail Modal */}
      {selectedGuide && (
        <GuideDetailModal
          guide={selectedGuide}
          language={language}
          onClose={() => setSelectedGuide(null)}
        />
      )}
    </div>
    </AnimatedPage>
  );
};

export default Guide;
