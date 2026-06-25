import React, { useState } from 'react';
import AnimatedPage from '../components/AnimatedPage';
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
  BadgeAlert,
  Scissors,
  Wrench,
  Shirt,
  Coffee,
  Package
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import CenteredModal from '../components/CenteredModal';
import { toast } from 'react-hot-toast';
import PullToRefresh from '../components/PullToRefresh';
import { syncFromFirestore } from '../services/dbEngine';

/**
 * Products and Services Catalog Page
 * @param {Array} products
 * @param {Function} onSaveProduct - saves or edits product in state/storage
 * @param {Function} onDeleteProduct - deletes product
 * @param {Object} businessSettings - currency details
 */
const Products = ({ products = [], onSaveProduct, onDeleteProduct, businessSettings, setCurrentTab }) => {
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
      toast.error('Please specify an item name.');
      return;
    }
    if (parseFloat(price) < 0 || isNaN(parseFloat(price))) {
      toast.error('Please specify a valid numeric price.');
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
    toast((t) => (
      <div>
        <p className="font-bold mb-2">Delete this product/service? This is permanent.</p>
        <div className="flex gap-2">
          <button onClick={() => { onDeleteProduct(id); toast.dismiss(t.id); }} className="bg-theme-danger text-white px-3 py-1 rounded-lg text-xs font-bold">Delete</button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-theme-surface px-3 py-1 rounded-lg text-xs font-bold">Cancel</button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const getCategoryIcon = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('embroidery') || cat.includes('stitch') || cat.includes('tailor')) return <Scissors className="w-4 h-4" />;
    if (cat.includes('repair') || cat.includes('maintenance')) return <Wrench className="w-4 h-4" />;
    if (cat.includes('cloth') || cat.includes('garment')) return <Shirt className="w-4 h-4" />;
    if (cat.includes('food') || cat.includes('grocery') || cat.includes('cafe')) return <Coffee className="w-4 h-4" />;
    if (cat.includes('product') || cat.includes('box')) return <Package className="w-4 h-4" />;
    return <Tag className="w-4 h-4" />;
  };

  // Filter Catalog
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  const handleRefresh = async () => {
    await syncFromFirestore();
    window.dispatchEvent(new Event('billqyro_sync'));
  };

  return (
    <AnimatedPage>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6 pb-24">
        
        {/* Header Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {setCurrentTab && (
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="p-2 rounded-xl bg-theme-surface hover:bg-theme-border-soft transition-colors text-theme-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            )}
            <div>
              <h2 className="text-base font-extrabold text-theme-primary dark:text-theme-primary tracking-tight">Billing Inventory</h2>
              <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-0.5">CATALOG OF ASSETS & SERVICES</p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-gradient-to-tr from-theme-accent to-theme-accent-dark text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product/Service</span>
          </button>
        </div>

        {/* SEARCH CARD */}
        <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-4 md:p-5 border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center justify-between">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catalog items by description, code name..."
              className="w-full pl-10 pr-4 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent focus:bg-theme-card dark:bg-theme-card transition-all text-theme-primary dark:text-theme-primary"
            />
          </div>
        </div>

        {/* DYNAMIC LIST GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filteredProducts.map((prod) => (
            <div 
              key={prod.id}
              className="bg-theme-card dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-3xl p-5 shadow-premium hover:shadow-premium-hover transition-all duration-300 relative flex flex-col justify-between"
            >
              {/* Top section: Avatar and Actions */}
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-theme-accent-light border border-theme-border-soft flex items-center justify-center font-extrabold text-theme-accent text-sm">
                      {getCategoryIcon(prod.category)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary tracking-tight leading-tight">{prod.name}</h3>
                      <span className="text-[10px] text-theme-muted font-bold uppercase tracking-widest mt-0.5 inline-block">Item Resource</span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(prod)}
                      className="p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-accent-light rounded-xl transition-all"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="p-2 text-theme-muted hover:text-theme-danger hover:bg-theme-danger/5 rounded-xl transition-all"
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
                        ? 'bg-theme-danger/5 text-theme-danger border border-theme-danger/20' 
                        : 'bg-theme-accent-light text-theme-accent border border-theme-border-soft'
                    }`}>
                      {prod.stockQty <= (prod.lowStockThreshold || 5) && <BadgeAlert className="w-3 h-3" />}
                      Stock: {prod.stockQty} {prod.stockQty <= (prod.lowStockThreshold || 5) && '(Low)'}
                    </span>
                    {prod.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-theme-accent-light text-theme-accent border border-theme-border-soft">
                        {prod.category}
                      </span>
                    )}
                  </div>
                )}
                {prod.stockQty === undefined && prod.category && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-theme-accent-light text-theme-accent border border-theme-border-soft">
                      {prod.category}
                    </span>
                  </div>
                )}

                {/* Description Body */}
                <div className="mt-3 min-h-12 leading-relaxed text-xs text-theme-muted font-semibold line-clamp-2">
                  {prod.description || 'No detailed specifications added.'}
                </div>
              </div>

              {/* Bottom section: Pricing */}
              <div className="border-t border-theme-border-soft pt-4 mt-5 flex justify-between items-center">
                <span className="text-[10px] text-theme-muted font-extrabold uppercase tracking-wider">M.R.P. Rate</span>
                <span className="text-base font-black text-theme-accent">
                  {formatCurrency(prod.price, currencySymbol)}
                </span>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 bg-theme-card dark:bg-theme-card rounded-3xl p-12 border border-theme-border-soft dark:border-theme-border-soft text-center shadow-premium">
              <Layers className="w-12 h-12 text-theme-primary mx-auto mb-3 animate-pulse" />
              <h4 className="font-extrabold text-theme-primary dark:text-theme-muted">Inventory Empty</h4>
              <p className="text-xs text-theme-muted font-semibold mt-1 max-w-xs mx-auto">
                Populate items, packages, or services inside the catalog to make selecting products during invoice generation immediate.
              </p>
            </div>
          )}
        </div>

        {/* DYNAMIC MODAL OVERLAY */}
        <CenteredModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={editingProduct ? 'Update Catalog Item' : 'Add Catalog Item'}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-theme-muted pb-4">
            <div>
              <label className="block mb-1 text-theme-muted">Product/Service Title</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dedicated Server Hosting"
                className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-theme-muted">Unit Price ({currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 text-theme-muted">Category Tag</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Services"
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary"
                />
              </div>
            </div>

            {/* NEW INVENTORY STOCK FIELDS */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-theme-border-soft dark:border-theme-border-soft/60 mt-4">
              <div>
                <label className="block mb-1 text-theme-muted font-bold">Current Stock Qty</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={stockQty}
                  onChange={(e) => setStockQty(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-black"
                />
              </div>
              <div>
                <label className="block mb-1 text-theme-muted font-bold flex items-center gap-1">
                  Low Stock Alert At
                  <BadgeAlert className="w-3 h-3 text-theme-danger" />
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-theme-primary dark:text-theme-primary font-black"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-theme-muted">Detailed Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 1 Year AWS Managed Hosting with 99.9% SLA..."
                rows="3"
                className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary leading-relaxed font-semibold text-xs"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-4 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 rounded-2xl font-bold hover:opacity-90 shadow-premium transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingProduct ? 'Save Changes' : 'Add to Catalog'}</span>
              </button>
            </div>
          </form>
        </CenteredModal>
      </div>
        </PullToRefresh>
    </AnimatedPage>
  );
};

export default Products;
