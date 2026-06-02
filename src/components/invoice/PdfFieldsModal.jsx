import React from 'react';
import { X, Check } from 'lucide-react';

const PdfFieldsModal = ({ 
  showPdfSettings, setShowPdfSettings, pdfVisibleFields, togglePdfField, billType 
}) => {
  return (
    <>
      {/* --- MODAL 3: PDF VISIBLE FIELDS CUSTOMIZER --- */}
      <AnimatePresence>
        {showPdfSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-theme-card/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-theme-card dark:bg-theme-card rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-theme-primary dark:text-theme-primary">Customize PDF Fields</h3>
                  <p className="text-[11px] text-theme-muted font-bold mt-0.5 capitalize">Template: {billType}</p>
                </div>
                <button onClick={() => setShowPdfSettings(false)} className="p-2 hover:bg-theme-surface dark:bg-theme-card rounded-xl transition-colors">
                  <X className="w-5 h-5 text-theme-muted" />
                </button>
              </div>
              <p className="text-xs text-theme-muted leading-relaxed">
                Select which columns will be <strong>visible in the PDF invoice</strong>. Uncheck to hide a column from the printed bill.
              </p>
              <div className="space-y-3">
                {(() => {

                  const fields = ALL_FIELDS_BY_TEMPLATE[billType] || ALL_FIELDS_BY_TEMPLATE['custom'];
                  return fields.map((field) => {
                    const isChecked = pdfVisibleFields.length === 0 || pdfVisibleFields.includes(field.key);
                    return (
                      <label key={field.key} className="flex items-center gap-3 p-3 rounded-xl hover:bg-theme-app dark:bg-theme-surface cursor-pointer border border-theme-border-soft dark:border-theme-border-soft transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPdfVisibleFields(prev => prev.length === 0
                                ? fields.filter(f => f.key !== field.key).map(f => f.key).concat(field.key)
                                : [...prev, field.key]
                              );
                            } else {
                              const allKeys = fields.map(f => f.key);
                              const currentVisible = pdfVisibleFields.length === 0 ? allKeys : pdfVisibleFields;
                              setPdfVisibleFields(currentVisible.filter(k => k !== field.key));
                            }
                          }}
                          className="w-4 h-4 rounded accent-teal-500 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-theme-primary dark:text-theme-muted">{field.label}</span>
                        {field.key === 'amount' && (
                          <span className="ml-auto text-[9px] font-bold text-theme-muted uppercase">Always shown</span>
                        )}
                      </label>
                    );
                  });
                })()}
              </div>
              <div className="flex gap-3 pt-2 border-t border-theme-border-soft dark:border-theme-border-soft">
                <button
                  onClick={() => setPdfVisibleFields((ALL_FIELDS_BY_TEMPLATE[billType] || ALL_FIELDS_BY_TEMPLATE['custom']).map(f => f.key))}
                  className="flex-1 py-2.5 text-xs font-bold text-theme-muted hover:bg-theme-app dark:bg-theme-surface rounded-xl border border-theme-border-soft transition-colors"
                >
                  Show All
                </button>
                <button
                  onClick={() => setShowPdfSettings(false)}
                  className="flex-1 py-2.5 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 text-xs font-black rounded-xl shadow-md transition-all"
                >
                  Save & Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      
    </>
  );
};
export default PdfFieldsModal;
