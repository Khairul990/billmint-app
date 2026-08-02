import React from 'react';
import { X, Plus, Trash2, Calculator, Copy, CheckCircle2, Maximize2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ItemsSheetModal = ({ 
  isSheetExpanded, setIsSheetExpanded, items, setItems, billType, currencySymbol,
  addQuickFillItem, removeItemRow, handleDuplicateItem, openSmartRateCalculator,
  customerName, handleItemChange, getExpandedGridCols, addItemRow, subtotal, grandTotal
}) => {
  // Pass through component
  return (
    <>
      {/* --- MODAL 2: EXPANDED INVOICE ITEMS SHEET --- */}
      <AnimatePresence>
        {isSheetExpanded && (
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
              className="bg-theme-card dark:bg-theme-card md:rounded-3xl shadow-2xl w-full h-full md:w-[98vw] md:max-w-[1550px] md:h-[90vh] flex flex-col overflow-hidden"
            >
            {/* Modal Header */}
            <div className="bg-theme-surface border-b border-theme-border-soft px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-theme-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-theme-primary">Invoice Items Sheet</h3>
                  <p className="text-xs text-theme-muted font-medium">Template: <span className="text-theme-accent font-bold capitalize">{billType}</span> | Add products or services.</p>
                </div>
              </div>
              <button onClick={() => setIsSheetExpanded(false)} className="p-2 hover:bg-theme-card dark:bg-theme-card/10 rounded-xl transition-colors">
                <X className="w-6 h-6 text-theme-muted" />
              </button>
            </div>

            {/* Quick Fill & Body */}
            <div className="flex-1 overflow-y-auto bg-theme-app dark:bg-theme-surface">
              <div className="p-4 md:p-6 space-y-6 max-w-full">
                
                <div className="flex gap-2 flex-wrap pb-4 border-b border-theme-border-soft/60">
                  <span className="text-[11px] text-theme-muted font-black uppercase tracking-widest py-1.5 mr-2">Quick Fill:</span>
                  <button onClick={() => addQuickFillItem('Embroidery', 'Embroidery Work', 0)} className="px-3.5 py-1.5 bg-theme-card dark:bg-theme-card text-theme-accent border border-theme-border-soft hover:border-theme-accent hover:bg-theme-accent-light shadow-sm rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">🧵 Embroidery</button>
                  <button onClick={() => addQuickFillItem('Repair', 'Repair Work', 0)} className="px-3.5 py-1.5 bg-theme-card dark:bg-theme-card text-amber-700 border border-theme-warning/30 hover:border-amber-400 hover:bg-theme-warning/5 shadow-sm rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">🔧 Repair</button>
                  <button onClick={() => addQuickFillItem('Design Work', 'Custom Design', 0)} className="px-3.5 py-1.5 bg-theme-card dark:bg-theme-card text-theme-accent border border-theme-border-soft hover:border-theme-accent hover:bg-theme-accent-light shadow-sm rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">📝 Custom Design</button>
                </div>

                <div className="w-full overflow-x-auto pb-4 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="min-w-max w-full flex flex-col px-1">
                    {/* Table Headers */}
                    <div className="hidden lg:grid gap-3 text-[11px] font-black text-theme-muted uppercase tracking-widest px-4 pb-3 border-b-2 border-theme-border-soft" style={{ gridTemplateColumns: getExpandedGridCols() }}>
                  <div className="text-center">#</div>
                  {billType === 'grocery' ? (
                    <>
                      <div>Product Name</div>
                      <div className="text-center">Unit</div>
                      <div className="text-center">Qty</div>
                      <div className="text-right">Unit Price</div>
                    </>
                  ) : billType === 'repair' ? (
                    <>
                      <div>Service / Item</div>
                      <div>Problem / Details</div>
                      <div className="text-right">Parts Cost</div>
                      <div className="text-right">Labour</div>
                      <div className="text-center">Qty</div>
                    </>
                  ) : billType === 'retail' ? (
                    <>
                      <div>Product Name</div>
                      <div>Category</div>
                      <div className="text-center">Size/Variant</div>
                      <div className="text-center">Qty</div>
                      <div className="text-right">Price</div>
                      <div className="text-right">Discount</div>
                    </>
                  ) : billType === 'custom' ? (
                    <>
                      <div>Item / Service</div>
                      <div>Description</div>
                      <div className="text-center">Qty</div>
                      <div className="text-right">Rate</div>
                    </>
                  ) : (
                    <>
                      <div>Design / Item Code</div>
                      <div>Work Type</div>
                      <div>Description</div>
                      <div className="text-center">Size</div>
                      <div className="text-center">Qty</div>
                      <div className="text-right">Rate</div>
                    </>
                  )}
                  <div className="text-right">Amount</div>
                  <div className="text-center">Actions</div>
                </div>

                {/* Expanded Items Map */}
                <div className="space-y-3 lg:space-y-2">
                  {items.map((item, index) => (
                    <div 
                      key={index}
                      className="flex flex-col lg:grid items-center gap-3 lg:gap-3 px-4 py-4 lg:py-2.5 bg-theme-card dark:bg-theme-card rounded-2xl border border-theme-border-soft shadow-sm hover:border-theme-border-soft transition-colors"
                      style={{ gridTemplateColumns: getExpandedGridCols() }}
                    >
                      {/* Mobile Header */}
                      <div className="flex justify-between items-center w-full lg:hidden mb-2 pb-2 border-b border-theme-border-soft dark:border-theme-border-soft">
                        <span className="text-sm font-black text-theme-primary dark:text-theme-muted bg-theme-surface dark:bg-theme-card px-3 py-1 rounded-xl">Item #{index + 1}</span>
                      </div>

                      {/* Desktop S.N. */}
                      <div className="hidden lg:flex items-center justify-center min-h-[52px]">
                        <span className="text-sm font-extrabold text-theme-muted w-9 h-9 flex items-center justify-center bg-theme-surface dark:bg-theme-card rounded-full">{index + 1}</span>
                      </div>

                      {/* ITEM FIELDS */}
                      {(billType === 'embroidery') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">Design / Item Code</label>
                          <input
                            type="text"
                            value={item.designNo || ''}
                            onChange={(e) => handleItemChange(index, 'designNo', e.target.value)}
                            placeholder="e.g. D-101"
                            className="w-full px-4 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold text-[14px] transition-all placeholder:text-theme-muted"
                          />
                        </div>
                      )}

                      {/* ... Other specific fields ... */}
                      {(billType === 'embroidery' || billType === 'repair' || billType === 'custom') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">{billType === 'embroidery' ? 'Work Type' : billType === 'repair' ? 'Service' : 'Item / Service'}</label>
                          {billType === 'embroidery' ? (
                            <select
                              value={item.workType || 'Embroidery'}
                              onChange={(e) => handleItemChange(index, 'workType', e.target.value)}
                              className="w-full px-4 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-muted font-bold text-[14px] transition-all appearance-auto truncate"
                            >
                              <option value="Embroidery">Embroidery</option>
                              <option value="Stitching">Stitching</option>
                              <option value="Printing">Printing</option>
                              <option value="Design Work">Design Work</option>
                              <option value="Repair">Repair</option>
                              <option value="Other Service">Other Service</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={item.serviceName || item.itemService || ''}
                              onChange={(e) => handleItemChange(index, billType === 'repair' ? 'serviceName' : 'itemService', e.target.value)}
                              placeholder={billType === 'repair' ? "e.g. Screen Replacement" : "e.g. Logo Design"}
                              className="w-full px-4 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold text-[14px] transition-all placeholder:text-theme-muted"
                            />
                          )}
                        </div>
                      )}

                      {(billType === 'retail' || billType === 'grocery') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">Product Name</label>
                          <input
                            type="text"
                            value={item.productName || item.description || ''}
                            onChange={(e) => handleItemChange(index, billType === 'retail' ? 'productName' : 'description', e.target.value)}
                            placeholder="e.g. T-Shirt / Rice"
                            className="w-full px-4 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold text-[14px] transition-all placeholder:text-theme-muted"
                          />
                        </div>
                      )}

                      {/* Description */}
                      {(billType === 'embroidery' || billType === 'custom') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">Description</label>
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Detailed description..."
                            className="w-full px-4 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold text-[14px] transition-all placeholder:text-theme-muted"
                          />
                        </div>
                      )}

                      {/* Size */}
                      {(billType === 'embroidery' || billType === 'grocery') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">{billType === 'grocery' ? 'Unit' : 'Size'}</label>
                          <input
                            type="text"
                            value={item.size || ''}
                            onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                            placeholder={billType === 'grocery' ? "Kg" : "L/XL"}
                            className="w-full px-3 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] text-center focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-muted font-bold text-[14px] transition-all placeholder:text-theme-muted"
                          />
                        </div>
                      )}

                      {/* Qty */}
                      <div className="w-full">
                        <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">Quantity</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={item.qty || ''}
                            onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] text-center focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-black text-[15px] transition-all"
                          />
                        </div>
                      </div>

                      {/* Rate */}
                      <div className="w-full">
                        <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">Rate / Price</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted font-bold">{currencySymbol}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate ?? item.price ?? ''}
                            onChange={(e) => handleItemChange(index, billType === 'retail' ? 'price' : 'rate', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-3 min-h-[52px] bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-[14px] text-right focus:outline-none focus:ring-2 focus:ring-theme-accent/30 hover:border-theme-accent focus:border-theme-accent text-theme-primary dark:text-theme-primary font-extrabold text-[15px] transition-all placeholder:text-theme-muted"
                          />
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="w-full">
                        <label className="lg:hidden block mb-1 text-[11px] font-bold text-theme-muted uppercase tracking-wide">Amount</label>
                        <div className="w-full pl-4 pr-4 py-3 min-h-[52px] bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-[14px] flex items-center justify-end shadow-inner">
                          <span className="text-theme-accent font-black text-[15px] tracking-tight">{currencySymbol}{(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="w-full flex lg:justify-center items-center gap-2 mt-2 lg:mt-0 pt-3 lg:pt-0 border-t border-theme-border-soft dark:border-theme-border-soft lg:border-t-0">
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(index)}
                          title="Duplicate item"
                          className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 p-3 min-h-[52px] text-theme-accent bg-theme-accent-light border border-theme-border-soft hover:bg-theme-accent-light rounded-[14px] transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          <span className="lg:hidden text-xs font-bold">Duplicate</span>
                        </button>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            title="Remove item"
                            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 p-3 min-h-[52px] text-theme-danger bg-theme-danger/5 border border-rose-100 hover:bg-rose-100 rounded-[14px] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="lg:hidden text-xs font-bold">Remove</span>
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                  
                  {/* Add Row Button Inside Modal */}
                  <div className="pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={addItemRow}
                      className="w-full lg:w-auto px-5 py-3.5 border-2 border-dashed border-theme-border-soft hover:border-theme-accent text-theme-accent hover:text-theme-accent bg-theme-surface dark:bg-theme-surface hover:bg-theme-accent-light rounded-2xl flex items-center justify-center gap-2 text-sm font-black transition-colors shadow-sm cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                      Add Another Item Line
                    </motion.button>
                  </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-theme-card dark:bg-theme-card border-t border-theme-border-soft px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
              <div className="flex gap-6 w-full md:w-auto justify-between md:justify-start">
                <div>
                  <p className="text-[11px] font-bold text-theme-muted uppercase tracking-wider mb-1">Items Total</p>
                  <p className="text-xl font-extrabold text-theme-primary dark:text-theme-primary">{currencySymbol}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-theme-accent/70 uppercase tracking-wider mb-1">Grand Total</p>
                  <p className="text-2xl font-black text-theme-accent">{currencySymbol}{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setIsSheetExpanded(false)}
                  className="flex-1 md:flex-none px-6 py-3 bg-theme-surface dark:bg-theme-card hover:bg-theme-border-soft text-theme-primary dark:text-theme-muted rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setIsSheetExpanded(false)}
                  className="flex-1 md:flex-none px-8 py-3 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 rounded-xl font-black text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Apply & Close
                </motion.button>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      
    </>
  );
};
export default ItemsSheetModal;
