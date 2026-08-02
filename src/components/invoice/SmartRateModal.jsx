import React from 'react';
import { X, Check, Calculator } from 'lucide-react';

const SmartRateModal = ({ 
  showSmartRate, setShowSmartRate, activeItemIndex, setActiveItemIndex, items, 
  smartCharges, setSmartCharges, applySmartRate, currencySymbol
}) => {
  return (
    <>
      {/* SMART COMPOSITE RATE MODAL */}
      {showSmartRate && activeItemIndex !== null && (
        <div className="fixed inset-0 bg-theme-card/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-theme-card dark:bg-theme-card rounded-3xl max-w-md w-full shadow-2xl border border-theme-border-soft dark:border-theme-border-soft overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-[image:var(--accent-gradient)] text-theme-button-text border-0 p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  <span>Smart Rate Composite</span>
                </h4>
                <span className="text-[10px] bg-theme-card dark:bg-theme-card/20 text-white font-bold py-1 px-2.5 rounded-full">
                  Item #{activeItemIndex + 1}
                </span>
              </div>
              <p className="text-[11px] text-white/80 font-bold mt-1.5">
                Design: {items[activeItemIndex]?.designNo || 'N/A'} • {items[activeItemIndex]?.workType || 'Standard'}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-theme-muted font-bold leading-relaxed">
                Embroidery jobs typically sum multiple service adders. Enter sub-charges to automatically sum the composite row rate.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-theme-muted">
                <div>
                  <label className="block mb-1 text-theme-muted">Embroidery Charge ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={smartCharges.embroidery || ''}
                    onChange={(e) => setSmartCharges({ ...smartCharges, embroidery: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-black text-right"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-theme-muted">Punching Charge ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={smartCharges.punching || ''}
                    onChange={(e) => setSmartCharges({ ...smartCharges, punching: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-black text-right"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-theme-muted">Repair Charge ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={smartCharges.repair || ''}
                    onChange={(e) => setSmartCharges({ ...smartCharges, repair: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-black text-right"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-theme-muted">Other/Misc Charge ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={smartCharges.other || ''}
                    onChange={(e) => setSmartCharges({ ...smartCharges, other: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-black text-right"
                  />
                </div>
              </div>

              {/* Real-time Composite Tally */}
              <div className="bg-theme-surface dark:bg-theme-surface rounded-2xl p-4 border border-theme-border-soft flex justify-between items-center mt-6">
                <div>
                  <span className="text-[10px] text-theme-muted font-extrabold uppercase block leading-none">Composite Rate</span>
                  <span className="text-xs text-theme-accent font-bold mt-1 block">Live Summed Total</span>
                </div>
                <span className="text-2xl font-black text-theme-accent">
                  {currencySymbol}
                  {((parseFloat(smartCharges.repair) || 0) + 
                    (parseFloat(smartCharges.punching) || 0) + 
                    (parseFloat(smartCharges.embroidery) || 0) + 
                    (parseFloat(smartCharges.other) || 0)).toFixed(2)}
                </span>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="bg-theme-app dark:bg-theme-surface p-4 flex gap-3 border-t border-theme-border-soft dark:border-theme-border-soft">
              <button
                type="button"
                onClick={() => {
                  setShowSmartRate(false);
                  setActiveItemIndex(null);
                }}
                className="flex-1 py-3 text-xs font-extrabold text-theme-muted hover:text-theme-primary dark:text-theme-primary hover:bg-theme-surface dark:bg-theme-card rounded-xl transition-all"
              >
                Cancel / Discard
              </button>
              
              <button
                type="button"
                onClick={applySmartRate}
                className="flex-1 py-3 bg-theme-accent hover:opacity-90 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Apply Composite Rate</span>
              </button>
            </div>

          </div>
        </div>
      )}

      
    </>
  );
};
export default SmartRateModal;
