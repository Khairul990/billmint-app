const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateInvoice.jsx', 'utf-8');

// 1. Add import for useWindowSize
if (!code.includes('useWindowSize')) {
    code = code.replace("import { toast } from 'react-hot-toast';", "import { toast } from 'react-hot-toast';\nimport { useWindowSize } from '../hooks/useWindowSize';");
}

// 2. Add useWindowSize call and mobileStep state inside component
const hookInjection = `  const { isMobile } = useWindowSize();
  const [mobileStep, setMobileStep] = useState(1);
  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? '100%' : '-100%', opacity: 0 })
  };
  const [slideDirection, setSlideDirection] = useState(1);
`;
code = code.replace("  const [showBanner, setShowBanner] = useState(true);", hookInjection + "\n  const [showBanner, setShowBanner] = useState(true);");

// 3. Extract the steps from the original code
const step1Start = code.indexOf('{/* STEP 1: CONFIGURATION & CRM */}');
const step2Start = code.indexOf('{/* STEP 2: ITEMS */}');
const step3Start = code.indexOf('{/* BILLING / TAX / TOTALS - Compact */}');
const closeColumn = code.indexOf('{/* CLOSE CENTERED COLUMN */}');

const step1Code = code.substring(step1Start, step2Start);
const step2Code = code.substring(step2Start, step3Start);
const step3Code = code.substring(step3Start, closeColumn);

// 4. Create render functions
const renderFunctions = `
  const renderStep1 = () => (
    <>
      ${step1Code}
    </>
  );

  const renderStep2 = () => (
    <>
      ${step2Code}
    </>
  );

  const renderStep3 = () => (
    <>
      ${step3Code}
    </>
  );
`;

// Insert render functions right before return statement
code = code.replace("  return (\n    <motion.div ", renderFunctions + "\n  return (\n    <motion.div ");

// 5. Replace the MAIN LAYOUT with Dual Engine logic
const mainLayoutStart = code.indexOf('{/* MAIN LAYOUT: RESPONSIVE GRID */}');
const sideLivePreviewStart = code.indexOf('{/* SIDE LIVE PREVIEW (DESKTOP) */}');
const livePreviewModalStart = code.indexOf('{/* LIVE PREVIEW MODAL */}');

// The Dual Engine block:
const dualEngineCode = `{/* MAIN LAYOUT: DUAL ENGINE */}
      {!isMobile ? (
        <div className={\`max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10 \${showPreview ? 'grid grid-cols-1 xl:grid-cols-12 gap-6' : ''}\`}>
          {/* FORM COLUMN (DESKTOP) */}
          <div className={\`w-full space-y-5 \${showPreview ? 'xl:col-span-7' : 'max-w-[1200px] mx-auto'}\`}>
            {renderStep1()}
            {renderStep2()}
            {renderStep3()}
          </div>
          
          {/* SIDE LIVE PREVIEW (DESKTOP) */}
          {showPreview && (
            <div className="hidden xl:block xl:col-span-5 h-[calc(100vh-100px)] sticky top-[88px] border-l border-theme-border-soft pl-6 animate-in slide-in-from-right-8 duration-300">
              <div className="h-full bg-theme-surface/50 border border-theme-border-soft rounded-3xl p-4 overflow-y-auto no-scrollbar shadow-inner relative">
                <div className="transform scale-[0.85] origin-top text-left w-[117%] -ml-[8.5%]">
                  <InvoicePreview 
                    items={items} 
                    invoiceNumber={invoiceNumber}
                    date={date}
                    dueDate={dueDate}
                    customerName={customerName}
                    customerPhone={customerPhone}
                    customerEmail={customerEmail}
                    customerAddress={customerAddress}
                    taxPercentage={taxPercentage}
                    discountAmount={discountAmount}
                    amountPaid={amountPaid}
                    notes={notes}
                    terms={terms}
                    businessSettings={businessSettings}
                    billType={billType}
                    visibleFields={pdfVisibleFields}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-[1400px] mx-auto w-full px-4 pb-24 relative overflow-hidden min-h-[60vh]">
          {/* Mobile Step Indicators */}
          <div className="flex justify-between items-center mb-4 bg-theme-card/80 p-2 rounded-xl border border-theme-border-soft backdrop-blur-md sticky top-[80px] z-30">
             {[1, 2, 3].map(step => (
               <div key={step} className={\`flex-1 h-1.5 mx-1 rounded-full transition-all duration-300 \${mobileStep === step ? 'bg-theme-accent scale-y-110' : mobileStep > step ? 'bg-theme-accent/50' : 'bg-theme-surface border border-theme-border-soft'}\`} />
             ))}
          </div>
          
          <div className="relative w-full">
            <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
              <motion.div
                key={mobileStep}
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                className="w-full"
              >
                {mobileStep === 1 && renderStep1()}
                {mobileStep === 2 && renderStep2()}
                {mobileStep === 3 && renderStep3()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile Navigation Buttons */}
          <div className="flex justify-between items-center mt-6 gap-3 pt-4 border-t border-theme-border-soft/50">
            <button 
              onClick={() => { setSlideDirection(-1); setMobileStep(prev => Math.max(1, prev - 1)); }}
              disabled={mobileStep === 1}
              className={\`px-6 py-3 rounded-xl font-bold transition-all \${mobileStep === 1 ? 'opacity-0 cursor-default' : 'bg-theme-surface text-theme-primary border border-theme-border-soft shadow-sm'}\`}
            >
              Previous
            </button>
            <button 
              onClick={() => {
                if (mobileStep < 3) {
                  setSlideDirection(1);
                  setMobileStep(prev => Math.min(3, prev + 1));
                } else {
                  handleSave();
                }
              }}
              className="px-8 py-3 bg-[image:var(--accent-gradient)] text-white rounded-xl font-black shadow-md border-0 ml-auto flex items-center gap-2"
            >
              {mobileStep < 3 ? (
                <>Next Step <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Finish & Save <Check className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      )}
`;

const newCode = code.substring(0, mainLayoutStart) + dualEngineCode + code.substring(livePreviewModalStart);

fs.writeFileSync('src/pages/CreateInvoice.jsx', newCode);
console.log('Refactoring complete!');
