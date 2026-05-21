const fs = require('fs');
const path = require('path');

const filePath = path.join('e:', 'Billmint', 'src', 'pages', 'CreateInvoice.jsx');
let code = fs.readFileSync(filePath, 'utf8');

const getExpandedGridColsFunc = `
  const getExpandedGridCols = () => {
    if (billType === 'grocery')
      return '60px minmax(300px,2fr) 120px 100px 150px 160px 120px';
    if (billType === 'repair')
      return '60px minmax(250px,1.5fr) minmax(250px,1.5fr) 140px 140px 100px 160px 120px';
    if (billType === 'retail')
      return '60px minmax(250px,1.5fr) 150px 130px 100px 150px 130px 160px 120px';
    if (billType === 'custom')
      return '60px minmax(250px,1.5fr) minmax(300px,2fr) 100px 150px 160px 120px';
    // embroidery (default)
    return '60px 170px 190px minmax(300px,2fr) 100px 100px 130px 140px 120px';
  };
`;

// Insert getExpandedGridCols after getGridCols
code = code.replace(
  `  const getGridCols = () => {`,
  `${getExpandedGridColsFunc}\n  const getGridCols = () => {`
);

// We need to extract the JSX for the items table so we can duplicate it for the modal,
// but with updated padding/sizes. 
// Actually, it's easier to just inject the exact JSX string.

const modalJSX = `
      {/* Expand Sheet Modal */}
      {isSheetExpanded && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-0 md:p-6 overflow-hidden">
          <div className="bg-white md:rounded-3xl shadow-2xl w-full h-full md:max-w-[95vw] lg:max-w-[1300px] md:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#071B3A] to-[#0d2b55] px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Invoice Items Sheet</h3>
                  <p className="text-xs text-slate-300 font-medium">Template: <span className="text-teal-400 font-bold capitalize">{billType}</span> | Add products or services.</p>
                </div>
              </div>
              <button onClick={() => setIsSheetExpanded(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-300" />
              </button>
            </div>

            {/* Quick Fill & Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50">
              <div className="p-4 md:p-6 space-y-6 max-w-full">
                
                <div className="flex gap-2 flex-wrap pb-4 border-b border-slate-200/60">
                  <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest py-1.5 mr-2">Quick Fill:</span>
                  <button onClick={() => addQuickFillItem('Embroidery', 'Embroidery Work', 0)} className="px-3.5 py-1.5 bg-white text-teal-700 border border-teal-200 hover:border-teal-400 hover:bg-teal-50 shadow-sm rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">🧵 Embroidery</button>
                  <button onClick={() => addQuickFillItem('Repair', 'Repair Work', 0)} className="px-3.5 py-1.5 bg-white text-amber-700 border border-amber-200 hover:border-amber-400 hover:bg-amber-50 shadow-sm rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">🔧 Repair</button>
                  <button onClick={() => addQuickFillItem('Design Work', 'Custom Design', 0)} className="px-3.5 py-1.5 bg-white text-indigo-700 border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 shadow-sm rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">📝 Custom Design</button>
                </div>

                {/* Table Headers */}
                <div className="hidden lg:grid gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest px-4 pb-3 border-b-2 border-slate-200" style={{ gridTemplateColumns: getExpandedGridCols() }}>
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
                      className="flex flex-col lg:grid items-center gap-3 lg:gap-3 px-4 py-4 lg:py-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-teal-200 transition-colors"
                      style={{ gridTemplateColumns: getExpandedGridCols() }}
                    >
                      {/* Mobile Header */}
                      <div className="flex justify-between items-center w-full lg:hidden mb-2 pb-2 border-b border-slate-100">
                        <span className="text-sm font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">Item #{index + 1}</span>
                      </div>

                      {/* Desktop S.N. */}
                      <div className="hidden lg:flex items-center justify-center min-h-[52px]">
                        <span className="text-sm font-extrabold text-slate-400 w-9 h-9 flex items-center justify-center bg-slate-100 rounded-full">{index + 1}</span>
                      </div>

                      {/* ITEM FIELDS */}
                      {(billType === 'embroidery') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Design / Item Code</label>
                          <input
                            type="text"
                            value={item.designNo || ''}
                            onChange={(e) => handleItemChange(index, 'designNo', e.target.value)}
                            placeholder="e.g. D-101"
                            className="w-full px-4 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-bold text-[14px] transition-all placeholder:text-slate-300"
                          />
                        </div>
                      )}

                      {/* ... Other specific fields ... */}
                      {(billType === 'embroidery' || billType === 'repair' || billType === 'custom') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">{billType === 'embroidery' ? 'Work Type' : billType === 'repair' ? 'Service' : 'Item / Service'}</label>
                          {billType === 'embroidery' ? (
                            <select
                              value={item.workType || 'Embroidery'}
                              onChange={(e) => handleItemChange(index, 'workType', e.target.value)}
                              className="w-full px-4 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-700 font-bold text-[14px] transition-all appearance-auto truncate"
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
                              className="w-full px-4 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-bold text-[14px] transition-all placeholder:text-slate-300"
                            />
                          )}
                        </div>
                      )}

                      {(billType === 'retail' || billType === 'grocery') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Product Name</label>
                          <input
                            type="text"
                            value={item.productName || item.description || ''}
                            onChange={(e) => handleItemChange(index, billType === 'retail' ? 'productName' : 'description', e.target.value)}
                            placeholder="e.g. T-Shirt / Rice"
                            className="w-full px-4 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-bold text-[14px] transition-all placeholder:text-slate-300"
                          />
                        </div>
                      )}

                      {/* Description */}
                      {(billType === 'embroidery' || billType === 'custom') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Description</label>
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Detailed description..."
                            className="w-full px-4 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-bold text-[14px] transition-all placeholder:text-slate-300"
                          />
                        </div>
                      )}

                      {/* Size */}
                      {(billType === 'embroidery' || billType === 'grocery') && (
                        <div className="w-full">
                          <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">{billType === 'grocery' ? 'Unit' : 'Size'}</label>
                          <input
                            type="text"
                            value={item.size || ''}
                            onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                            placeholder={billType === 'grocery' ? "Kg" : "L/XL"}
                            className="w-full px-3 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] text-center focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-700 font-bold text-[14px] transition-all placeholder:text-slate-300"
                          />
                        </div>
                      )}

                      {/* Qty */}
                      <div className="w-full">
                        <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Quantity</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={item.qty || ''}
                            onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] text-center focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-black text-[15px] transition-all"
                          />
                        </div>
                      </div>

                      {/* Rate */}
                      <div className="w-full">
                        <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Rate / Price</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currencySymbol}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate ?? item.price ?? ''}
                            onChange={(e) => handleItemChange(index, billType === 'retail' ? 'price' : 'rate', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-3 min-h-[52px] bg-white border border-slate-200 rounded-[14px] text-right focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:border-teal-400 focus:border-teal-500 text-slate-800 font-extrabold text-[15px] transition-all placeholder:text-slate-300"
                          />
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="w-full">
                        <label className="lg:hidden block mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Amount</label>
                        <div className="w-full pl-4 pr-4 py-3 min-h-[52px] bg-slate-50 border border-slate-200 rounded-[14px] flex items-center justify-end shadow-inner">
                          <span className="text-teal-600 font-black text-[15px] tracking-tight">{currencySymbol}{(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="w-full flex lg:justify-center items-center gap-2 mt-2 lg:mt-0 pt-3 lg:pt-0 border-t border-slate-100 lg:border-t-0">
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(index)}
                          title="Duplicate item"
                          className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 p-3 min-h-[52px] text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-[14px] transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          <span className="lg:hidden text-xs font-bold">Duplicate</span>
                        </button>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            title="Remove item"
                            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 p-3 min-h-[52px] text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-[14px] transition-colors"
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
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="w-full lg:w-auto px-5 py-3.5 border-2 border-dashed border-teal-200 hover:border-teal-400 text-teal-600 hover:text-teal-700 bg-teal-50/50 hover:bg-teal-50 rounded-2xl flex items-center justify-center gap-2 text-sm font-black transition-all shadow-sm"
                    >
                      <Plus className="w-5 h-5" />
                      Add Another Item Line
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white border-t border-slate-200 px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
              <div className="flex gap-6 w-full md:w-auto justify-between md:justify-start">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Items Total</p>
                  <p className="text-xl font-extrabold text-slate-800">{currencySymbol}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-teal-600/70 uppercase tracking-wider mb-1">Grand Total</p>
                  <p className="text-2xl font-black text-teal-600">{currencySymbol}{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsSheetExpanded(false)}
                  className="flex-1 md:flex-none px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setIsSheetExpanded(false)}
                  className="flex-1 md:flex-none px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white rounded-xl font-black text-sm transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Apply & Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
`;

code = code.replace(
  `{/* Customize PDF Fields Modal */}`,
  `${modalJSX}\n      {/* Customize PDF Fields Modal */}`
);

fs.writeFileSync(filePath, code);
console.log('Successfully updated CreateInvoice.jsx with Expanded Sheet Modal.');
