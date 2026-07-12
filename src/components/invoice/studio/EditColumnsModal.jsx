import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EditColumnsModal = ({ isOpen, onClose, onSave, initialColumns, initialExtraColumns = [] }) => {
  const [col1, setCol1] = useState(initialColumns?.col1 || 'Item Name');
  const [col2, setCol2] = useState(initialColumns?.col2 || 'Qty');
  const [col3, setCol3] = useState(initialColumns?.col3 || 'Rate (₹)');
  const [extraCols, setExtraCols] = useState(initialExtraColumns);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddExtraColumn = () => {
    const newId = `col_${Date.now()}`;
    setExtraCols([...extraCols, { id: newId, name: '' }]);
  };

  const handleUpdateExtraCol = (index, val) => {
    const updated = [...extraCols];
    updated[index].name = val;
    setExtraCols(updated);
  };

  const handleDeleteExtraCol = (index) => {
    const updated = extraCols.filter((_, i) => i !== index);
    setExtraCols(updated);
  };

  const handleSave = () => {
    // Filter out empty extra columns
    const validExtra = extraCols.filter(c => c.name.trim() !== '');
    onSave({ col1, col2, col3 }, validExtra);
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-theme-card border border-theme-border-soft rounded-2xl shadow-premium flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border-soft shrink-0">
              <h3 className="text-sm font-black text-theme-primary">Customize Columns</h3>
              <button
                onClick={onClose}
                className="p-1 text-theme-muted hover:text-theme-primary hover:bg-theme-surface rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {/* Core Columns */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-theme-muted border-b border-theme-border-soft pb-2">Core Columns</h4>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-theme-muted block mb-1.5">
                    Main Description Column
                  </label>
                  <input
                    type="text"
                    value={col1}
                    onChange={(e) => setCol1(e.target.value)}
                    placeholder="e.g. Design Name"
                    className="w-full bg-theme-surface border border-theme-border-soft rounded-xl px-4 py-2.5 outline-none text-sm font-bold text-theme-primary focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-theme-muted block mb-1.5">
                      Quantity Column
                    </label>
                    <input
                      type="text"
                      value={col2}
                      onChange={(e) => setCol2(e.target.value)}
                      placeholder="e.g. Qty"
                      className="w-full bg-theme-surface border border-theme-border-soft rounded-xl px-4 py-2.5 outline-none text-sm font-bold text-theme-primary focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-theme-muted block mb-1.5">
                      Rate/Price Column
                    </label>
                    <input
                      type="text"
                      value={col3}
                      onChange={(e) => setCol3(e.target.value)}
                      placeholder="e.g. Rate (₹)"
                      className="w-full bg-theme-surface border border-theme-border-soft rounded-xl px-4 py-2.5 outline-none text-sm font-bold text-theme-primary focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Extra Custom Columns */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-theme-border-soft pb-2">
                  <h4 className="text-xs font-bold text-theme-muted">Extra Custom Columns</h4>
                  <button 
                    onClick={handleAddExtraColumn}
                    className="text-[10px] font-bold text-theme-accent hover:text-theme-accent/80 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Column
                  </button>
                </div>
                
                {extraCols.length === 0 ? (
                  <p className="text-[11px] text-theme-muted text-center py-2 bg-theme-surface rounded-xl border border-theme-border-soft border-dashed">
                    No extra columns. Click 'Add Column' to create custom fields like "Size", "Color", etc.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {extraCols.map((col, idx) => (
                      <div key={col.id} className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="text-[9px] font-black uppercase text-theme-muted block mb-1">
                            Custom Column {idx + 1}
                          </label>
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) => handleUpdateExtraCol(idx, e.target.value)}
                            placeholder="e.g. Size, Color, Warranty"
                            className="w-full bg-theme-surface border border-theme-border-soft rounded-xl px-4 py-2.5 outline-none text-sm font-bold text-theme-primary focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/20 transition-all"
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteExtraCol(idx)}
                          className="w-10 h-10 shrink-0 flex items-center justify-center bg-theme-surface hover:bg-red-500/10 text-theme-muted hover:text-red-500 border border-theme-border-soft rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <p className="text-[10px] text-theme-muted pt-1">
                      * Keep column names short so they fit on the A4 PDF invoice.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme-border-soft bg-theme-surface/50 shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-theme-primary hover:bg-theme-surface border border-theme-border-soft rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-theme-accent text-white text-xs font-black rounded-xl hover:bg-theme-accent/90 hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" /> Save Columns
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return mounted && typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default EditColumnsModal;
