import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  Save, 
  Tag, 
  ReceiptText,
  BadgeAlert
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import BottomSheet from '../components/BottomSheet';
import PullToRefresh from '../components/PullToRefresh';
import { syncFromFirestore } from '../utils/storage';

/**
 * Products and Services Catalog Page
 * @param {Array} products
 * @param {Function} onSaveProduct - saves or edits product in state/storage
 * @param {Function} onDeleteProduct - deletes product
 * @param {Object} businessSettings - currency details
 */
const Products = ({ products = [], onSaveProduct, onDeleteProduct, businessSettings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals / Add-Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [stockQty, setStockQty] = useState(0);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  const currencySymbol = businessSettings?.currency || '₹';

  // --- ACTIONS ---
  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setDescription('');
    setCategory('');
    setStockQty(0);
    setLowStockThreshold(5);
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setName(prod.name);
    setPrice(prod.price !== undefined ? prod.price : (prod.rate !== undefined ? prod.rate : ''));
    setDescription(prod.description || '');
    setCategory(prod.category || '');
    setStockQty(prod.stockQty !== undefined ? prod.stockQty : 0);
    setLowStockThreshold(prod.lowStockThreshold !== undefined ? prod.lowStockThreshold : 5);
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name) {
      alert('Please specify an item name.');
      return;
    }
    if (parseFloat(price) < 0 || isNaN(parseFloat(price))) {
      alert('Please specify a valid numeric price.');
      return;
    }

    const payload = {
      id: editingProduct ? editingProduct.id : null,
      productId: editingProduct ? (editingProduct.productId || editingProduct.id) : null,
      name,
      price: parseFloat(price) || 0,
      rate: parseFloat(price) || 0,
      category,
      description,
      stockQty: parseInt(stockQty) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      updatedAt: new Date().toISOString()
    };

    onSaveProduct(payload);
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this product/service? This action is permanent.')) {
      onDeleteProduct(id);
    }
  };

  // Filter Catalog
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  const handleRefresh = async () => {
    await syncFromFirestore();
    window.dispatchEvent(new Event('billqyro_sync'));
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6 pb-24">
        
        {/* Header Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Billing Inventory</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">CATALOG OF ASSETS & SERVICES</p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product/Service</span>
          </button>
        </div>

        {/* SEARCH CARD */}
        <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-premium flex items-center justify-between">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catalog items by description, code name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
            />
          </div>
        </div>

        {/* DYNAMIC LIST GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filteredProducts.map((prod) => (
            <div 
              key={prod.id}
              className="bg-white border border-slate-100 rounded-3xl p-5 shadow-premium hover:shadow-premium-hover transition-all duration-300 relative flex flex-col justify-between"
            >
              {/* Top section: Avatar and Actions */}
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/30 flex items-center justify-center font-extrabold text-blue-600 text-sm">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 tracking-tight leading-tight">{prod.name}</h3>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 inline-block">Item Resource</span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(prod)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stock Status Badge */}
                {prod.stockQty !== undefined && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      prod.stockQty <= (prod.lowStockThreshold || 5) 
                        ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {prod.stockQty <= (prod.lowStockThreshold || 5) && <BadgeAlert className="w-3 h-3" />}
                      Stock: {prod.stockQty} {prod.stockQty <= (prod.lowStockThreshold || 5) && '(Low)'}
                    </span>
                    {prod.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {prod.category}
                      </span>
                    )}
                  </div>
                )}
                {prod.stockQty === undefined && prod.category && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {prod.category}
                    </span>
                  </div>
                )}

                {/* Description Body */}
                <div className="mt-3 min-h-12 leading-relaxed text-xs text-slate-400 font-semibold line-clamp-2">
                  {prod.description || 'No detailed specifications added.'}
                </div>
              </div>

              {/* Bottom section: Pricing */}
              <div className="border-t border-slate-50 pt-4 mt-5 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">M.R.P. Rate</span>
                <span className="text-base font-black text-indigo-600">
                  {formatCurrency(prod.price, currencySymbol)}
                </span>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 bg-white rounded-3xl p-12 border border-slate-100 text-center shadow-premium">
              <Layers className="w-12 h-12 text-slate-200 mx-auto mb-3 animate-pulse" />
              <h4 className="font-extrabold text-slate-700">Inventory Empty</h4>
              <p className="text-xs text-slate-400 font-semibold mt-1 max-w-xs mx-auto">
                Populate items, packages, or services inside the catalog to make selecting products during invoice generation immediate.
              </p>
            </div>
          )}
        </div>

        {/* DYNAMIC MODAL OVERLAY */}
        <BottomSheet 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={editingProduct ? 'Update Catalog Item' : 'Add Catalog Item'}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-slate-500 pb-4">
            <div>
              <label className="block mb-1 text-slate-400">Product/Service Title</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dedicated Server Hosting"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-slate-400">Unit Price ({currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-400">Category Tag</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Services"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>
            </div>

            {/* NEW INVENTORY STOCK FIELDS */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100/60 mt-4">
              <div>
                <label className="block mb-1 text-slate-400 font-bold">Current Stock Qty</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={stockQty}
                  onChange={(e) => setStockQty(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-black"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-400 font-bold flex items-center gap-1">
                  Low Stock Alert At
                  <BadgeAlert className="w-3 h-3 text-rose-500" />
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 font-black"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-slate-400">Detailed Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 1 Year AWS Managed Hosting with 99.9% SLA..."
                rows="3"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 leading-relaxed font-semibold text-xs"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold hover:from-indigo-700 hover:to-blue-700 shadow-md shadow-indigo-100/50 hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingProduct ? 'Save Changes' : 'Add to Catalog'}</span>
              </button>
            </div>
          </form>
        </BottomSheet>
      </div>
    </PullToRefresh>
  );
};

export default Products;
