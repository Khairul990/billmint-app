import React, { useState, useMemo } from 'react';
import { useI18n } from '../utils/i18n';
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
import { invoiceEngine } from '../services/invoiceEngine';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { getUnitsByType } from '../config/businessPresets';
import { Loader2, ArrowLeft, Scan, Printer, QrCode, History, ShoppingCart, PackagePlus, Download, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { stockEngine, MOVEMENT_TYPES } from '../services/stockEngine';
import { downloadCSV, todayStr } from '../utils/moneyCenterReports';
import QRCode from 'qrcode';

/**
 * Products and Services Catalog Page
 * @param {Array} products
 * @param {Function} onSaveProduct - saves or edits product in state/storage
 * @param {Function} onDeleteProduct - deletes product
 * @param {Object} businessSettings - currency details
 */
const Products = ({ products = [], onSaveProduct, onDeleteProduct, onSaveExpense, businessSettings, setCurrentTab }) => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [modalTab, setModalTab] = useState('basic');
  
  // Modals / Add-Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState(null);
  const [barcodeLabelCount, setBarcodeLabelCount] = useState(8);
  const [generatedQrMap, setGeneratedQrMap] = useState({});
  // Phase-2 inventory states
  const [customCategories, setCustomCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('billqyro_custom_categories') || '[]'); } catch (e) { return []; }
  });
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockTypeFilter, setStockTypeFilter] = useState('all');
  const [movements, setMovements] = useState([]);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ productId: '', mode: 'add', qty: '', reason: '' });
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ supplier: '', date: todayStr(), items: [{ productId: '', name: '', qty: 1, unitCost: '' }] });

  // Form Fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [stockQty, setStockQty] = useState(0);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [brand, setBrand] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [shelf, setShelf] = useState('');
  const [batch, setBatch] = useState('');
  const [expiry, setExpiry] = useState('');

  const invSettings = businessSettings?.inventorySettings || {};

  const wsType = businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.type || businessSettings?.type || 'retail';
  const availableUnits = useMemo(() => getUnitsByType(wsType), [wsType]);
  const currencySymbol = businessSettings?.currency || '₹';

  // --- ACTIONS ---
  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setUnit('pcs');
    setDescription('');
    setCategory('');
    setStockQty(0);
    setLowStockThreshold(5);
    setSku('');
    setBarcode('');
    setBrand('');
    setWarehouse('');
    setShelf('');
    setBatch('');
    setExpiry('');
    setModalTab('basic');
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setName(prod.name);
    setPrice(prod.price !== undefined ? prod.price : (prod.rate !== undefined ? prod.rate : ''));
    setUnit(prod.unit || 'pcs');
    setDescription(prod.description || '');
    setCategory(prod.category || '');
    setStockQty(prod.stockQty !== undefined ? prod.stockQty : 0);
    setLowStockThreshold(prod.lowStockThreshold !== undefined ? prod.lowStockThreshold : 5);
    setSku(prod.sku || '');
    setBarcode(prod.barcode || '');
    setBrand(prod.brand || '');
    setWarehouse(prod.warehouse || '');
    setShelf(prod.shelf || '');
    setBatch(prod.batch || '');
    setExpiry(prod.expiry || '');
    setModalTab('basic');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
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
      unit,
      category,
      description,
      stockQty: parseInt(stockQty) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      sku,
      barcode,
      brand,
      warehouse,
      shelf,
      batch,
      expiry,
      updatedAt: new Date().toISOString()
    };

    try {
      await onSaveProduct(payload);
      setIsModalOpen(false);
    } catch {
      toast.error('Failed to save product');
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div>
        <p className="font-bold mb-2">{t('prod.delete_confirm', 'Delete this product/service? This is permanent.')}</p>
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
  const filteredProducts = useMemo(() => products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      (p.name || '').toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.barcode || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
    const matchesCategory = !categoryFilter || (p.category || '') === categoryFilter;
    return matchesSearch && matchesCategory;
  }), [products, searchQuery, categoryFilter]);

  // ===== Phase-2 derived data =====
  const stockTracked = useMemo(() => products.filter(p => p.stockQty !== undefined), [products]);
  const inventoryValue = useMemo(() => stockTracked.reduce((sum, p) => sum + (parseFloat(p.stockQty) || 0) * (parseFloat(p.price) || 0), 0), [stockTracked]);
  const lowStockProducts = useMemo(() => stockTracked.filter(p => (parseFloat(p.stockQty) || 0) <= (parseFloat(p.lowStockThreshold) || 5) && (parseFloat(p.stockQty) || 0) > 0), [stockTracked]);
  const outOfStockProducts = useMemo(() => stockTracked.filter(p => (parseFloat(p.stockQty) || 0) <= 0), [stockTracked]);

  const categoryStats = useMemo(() => {
    const map = new Map();
    products.forEach(p => {
      const c = (p.category || '').trim();
      if (!c) return;
      if (!map.has(c)) map.set(c, { name: c, count: 0, stockQty: 0, value: 0 });
      const e = map.get(c);
      e.count += 1;
      e.stockQty += parseFloat(p.stockQty) || 0;
      e.value += (parseFloat(p.stockQty) || 0) * (parseFloat(p.price) || 0);
    });
    customCategories.forEach(c => { if (c && !map.has(c)) map.set(c, { name: c, count: 0, stockQty: 0, value: 0 }); });
    return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [products, customCategories]);

  // ===== Phase-2 handlers =====
  const persistCustomCategories = (list) => {
    setCustomCategories(list);
    try { localStorage.setItem('billqyro_custom_categories', JSON.stringify(list)); } catch (e) {}
  };

  const handleAddCategory = () => {
    const c = newCategoryInput.trim();
    if (!c) return toast.error('Type a category name first');
    if (categoryStats.some(x => x.name.toLowerCase() === c.toLowerCase())) return toast.error('This category already exists');
    persistCustomCategories([...customCategories, c]);
    setNewCategoryInput('');
    toast.success(`Category "${c}" added`);
  };

  const handleDeleteCategory = (name) => {
    persistCustomCategories(customCategories.filter(c => c !== name));
    if (categoryFilter === name) setCategoryFilter('');
    toast.success('Custom category removed (products keep their tags)');
  };

  const loadMovements = () => setMovements(stockEngine.getMovements(150));

  const openAdjust = (productId = '') => { setAdjustForm({ productId, mode: 'add', qty: '', reason: '' }); setIsAdjustOpen(true); };

  const handleAdjustStock = (e) => {
    e.preventDefault();
    const prod = products.find(p => p.id === adjustForm.productId);
    if (!prod) return toast.error('Select a product');
    const qty = parseFloat(adjustForm.qty);
    if (!Number.isFinite(qty) || qty <= 0) return toast.error('Enter a valid quantity');
    const current = parseFloat(prod.stockQty) || 0;
    const delta = adjustForm.mode === 'add' ? qty : -qty;
    const newQty = Math.max(0, Math.round((current + delta) * 100) / 100);
    onSaveProduct({ ...prod, stockQty: newQty, stockAdjustmentReason: adjustForm.reason || `Manual ${adjustForm.mode} adjustment` });
    setIsAdjustOpen(false);
    toast.success(`${prod.name}: ${current} → ${newQty}`);
  };

  const openPurchase = (prefillProduct = null) => {
    setPurchaseForm({ supplier: '', date: todayStr(), items: [{ productId: prefillProduct?.id || '', name: prefillProduct?.name || '', qty: Math.max(1, (parseFloat(prefillProduct?.lowStockThreshold) || 5) * 2 - (parseFloat(prefillProduct?.stockQty) || 0)), unitCost: prefillProduct ? (parseFloat(prefillProduct.cost) || parseFloat(prefillProduct.price) || '') : '' }] });
    setIsPurchaseOpen(true);
  };

  const purchaseTotal = purchaseForm.items.reduce((sum, it) => sum + ((parseFloat(it.qty) || 0) * (parseFloat(it.unitCost) || 0)), 0);

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    const validItems = purchaseForm.items.filter(it => it.productId && parseFloat(it.qty) > 0);
    if (!validItems.length) return toast.error('Add at least one product with quantity');
    let applied = 0;
    for (const it of validItems) {
      const prod = products.find(p => p.id === it.productId);
      if (!prod) continue;
      const newQty = (parseFloat(prod.stockQty) || 0) + (parseFloat(it.qty) || 0);
      onSaveProduct({ ...prod, stockQty: newQty, stockAdjustmentReason: `Purchase${purchaseForm.supplier ? ' from ' + purchaseForm.supplier : ''}` });
      applied += 1;
    }
    if (onSaveExpense) {
      onSaveExpense({
        title: `Stock Purchase${purchaseForm.supplier ? ' — ' + purchaseForm.supplier : ' (' + applied + ' item' + (applied !== 1 ? 's' : '') + ')'}`,
        category: 'Supplies',
        amount: Math.round(purchaseTotal * 100) / 100,
        date: purchaseForm.date,
        source: 'purchase_entry',
        supplier: purchaseForm.supplier
      });
    }
    setIsPurchaseOpen(false);
    toast.success(`Purchase recorded: ${applied} item(s) restocked, expense booked`);
    setTimeout(loadMovements, 400);
  };

  React.useEffect(() => { if (activeTab === 'stock') loadMovements(); }, [activeTab, products.length]);

  const ITEMS_PER_PAGE = 30;
  const { displayCount, loadMoreRef } = useInfiniteScroll(filteredProducts.length, ITEMS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(0, displayCount);
  }, [filteredProducts, displayCount]);

  const handleRefresh = async () => {
    await invoiceEngine.syncFromCloud();
    window.dispatchEvent(new Event('billqyro_sync'));
  };

  return (
    <AnimatedPage>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6 pb-24">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {setCurrentTab && (
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="p-2 rounded-xl bg-theme-surface hover:bg-theme-border-soft transition-colors text-theme-primary"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-base font-extrabold text-theme-primary tracking-tight">{t('prod.hub', 'Inventory Hub')}</h2>
              <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-0.5">CATALOG OF ASSETS & SERVICES</p>
            </div>
          </div>

          <div className="flex overflow-x-auto no-scrollbar gap-2 p-1 bg-theme-surface/50 border border-theme-border-soft rounded-xl shadow-inner max-w-full">
            {[
              { id: 'products', label: 'Products & Services', icon: Layers },
              { id: 'categories', label: 'Categories & Brands', icon: Tag },
              { id: 'stock', label: 'Stock Alerts', icon: Package },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-theme-card shadow-sm text-theme-primary border border-theme-border-soft/50' 
                    : 'text-theme-muted hover:text-theme-primary hover:bg-theme-surface'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center gap-1.5 bg-theme-surface border border-theme-border-soft text-theme-primary font-bold text-xs px-3.5 py-3 rounded-2xl hover:bg-theme-card shadow-sm transition-all"
              title="Scan Barcode / QR"
            >
              <Scan className="w-4 h-4 text-theme-accent" />
              <span className="hidden sm:inline">Scan</span>
            </button>
            <button
              onClick={() => {
                setSelectedProductForBarcode(products[0] || null);
                setIsBarcodeModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 bg-theme-surface border border-theme-border-soft text-theme-primary font-bold text-xs px-3.5 py-3 rounded-2xl hover:bg-theme-card shadow-sm transition-all"
              title="Print Barcode Labels"
            >
              <Printer className="w-4 h-4 text-theme-accent" />
              <span className="hidden sm:inline">Print Labels</span>
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 bg-gradient-to-tr from-theme-accent to-theme-accent-dark text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('prod.add', 'Add Product')}</span>
            </button>
          </div>
        </div>

        {activeTab === 'products' && (
          <>
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
              placeholder={t('prod.search_ph', 'Search catalog items by description, code name...')}
              className="w-full pl-10 pr-4 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent focus:bg-theme-card dark:bg-theme-card transition-all text-theme-primary dark:text-theme-primary"
            />
          </div>
        </div>

        {/* DYNAMIC LIST GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {paginatedProducts.map((prod) => (
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
                      className="tap-target p-2 text-theme-muted hover:text-theme-accent hover:bg-theme-accent-light rounded-xl transition-all"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="tap-target p-2 text-theme-muted hover:text-theme-danger hover:bg-theme-danger/5 rounded-xl transition-all"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {prod.stockQty !== undefined && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      prod.stockQty <= (prod.lowStockThreshold || 5) 
                        ? 'bg-theme-danger/5 text-theme-danger border border-theme-danger/20' 
                        : 'bg-theme-accent-light text-theme-accent border border-theme-border-soft'
                    }`}>
                      {prod.stockQty <= (prod.lowStockThreshold || 5) && <BadgeAlert className="w-3 h-3" />}
                      {t('prod.stock', 'Stock')}: {prod.stockQty} {prod.stockQty <= (prod.lowStockThreshold || 5) && t('prod.low', '(Low)')}
                    </span>
                    {prod.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-theme-accent-light text-theme-accent border border-theme-border-soft">
                        {prod.category}
                      </span>
                    )}
                    {invSettings.enableBarcodeSku !== false && prod.sku && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-gray-300 border border-slate-200 dark:border-white/10">
                        SKU: {prod.sku}
                      </span>
                    )}
                  </div>
                )}
                {prod.stockQty === undefined && prod.category && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-theme-accent-light text-theme-accent border border-theme-border-soft">
                      {prod.category}
                    </span>
                    {invSettings.enableBarcodeSku !== false && prod.sku && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-gray-300 border border-slate-200 dark:border-white/10">
                        SKU: {prod.sku}
                      </span>
                    )}
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
                  {prod.unit && <span className="text-[10px] text-theme-muted font-bold ml-1">/{prod.unit}</span>}
                </span>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 bg-theme-card dark:bg-theme-card rounded-3xl p-12 border border-theme-border-soft dark:border-theme-border-soft text-center shadow-premium">
              <Layers className="w-12 h-12 text-theme-primary mx-auto mb-3 animate-pulse" />
              <h4 className="font-extrabold text-theme-primary dark:text-theme-muted">{t('prod.empty_title', 'Inventory Empty')}</h4>
              <p className="text-xs text-theme-muted font-semibold mt-1 max-w-xs mx-auto">
                {t('prod.empty_sub', 'Populate items, packages, or services inside the catalog to make selecting products during invoice generation immediate.')}
              </p>
            </div>
          )}
        </div>

        {displayCount < filteredProducts.length && (
          <div ref={loadMoreRef} className="flex justify-center items-center py-6 w-full text-theme-muted font-bold text-sm opacity-50">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading more products...
          </div>
        )}

        {/* DYNAMIC MODAL OVERLAY */}
        <CenteredModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={editingProduct ? t('prod.update_item', 'Update Catalog Item') : t('prod.add_item', 'Add Catalog Item')}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-theme-muted pb-4">
            
            <div className="flex overflow-x-auto no-scrollbar gap-2 mb-4 p-1 bg-theme-surface/50 border border-theme-border-soft rounded-xl shadow-inner max-w-full">
              {[
                { id: 'basic', label: t('prod.tab_basic', 'Basic Info') },
                { id: 'stock', label: t('prod.tab_stock', 'Pricing & Stock') },
                { id: 'advanced', label: t('prod.tab_advanced', 'Advanced Settings') },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    modalTab === tab.id 
                      ? 'bg-theme-card shadow-sm text-theme-primary border border-theme-border-soft/50' 
                      : 'text-theme-muted hover:text-theme-primary hover:bg-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {modalTab === 'basic' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block mb-1 text-theme-muted">{t('prod.title_label', 'Product/Service Title')}</label>
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
                    <label className="block mb-1 text-theme-muted">{t('prod.category_label', 'Category Tag')}</label>
                    <input
                      type="text"
                      list="category-options-list"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Services"
                      className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-theme-muted">{t('prod.brand_label', 'Brand (Optional)')}</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-theme-muted">{t('prod.desc_label', 'Detailed Description (Optional)')}</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 1 Year AWS Managed Hosting with 99.9% SLA..."
                    rows="3"
                    className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary leading-relaxed font-semibold text-xs"
                  />
                </div>
              </div>
            )}

            {modalTab === 'stock' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-theme-muted">{t('prod.price_label', 'Unit Price')} ({currencySymbol})</label>
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
                    <label className="block mb-1 text-theme-muted">{t('prod.unit_label', 'Unit Measure')}</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
                    >
                      {availableUnits.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-theme-border-soft dark:border-theme-border-soft/60 mt-4">
                  <div>
                    <label className="block mb-1 text-theme-muted font-bold">{t('prod.stock_label', 'Current Stock Qty')}</label>
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
                      {t('prod.low_stock_label', 'Low Stock Alert At')}
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
              </div>
            )}

            {modalTab === 'advanced' && (
              <div className="space-y-4 animate-fadeIn">
                {invSettings.enableBarcodeSku !== false && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-theme-muted">{t('prod.sku_label', 'SKU (Stock Keeping Unit)')}</label>
                      <input
                        type="text"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="e.g. WH-101"
                        className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:border-theme-accent"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-theme-muted">{t('prod.barcode_label', 'Barcode (EAN/UPC)')}</label>
                      <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="Scan or type barcode"
                        className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:border-theme-accent"
                      />
                    </div>
                  </div>
                )}
                
                {invSettings.enableWarehouseTracking === true && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-theme-muted">Warehouse</label>
                      <input
                        type="text"
                        value={warehouse}
                        onChange={(e) => setWarehouse(e.target.value)}
                        placeholder="Main Warehouse"
                        className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:border-theme-accent"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-theme-muted">Shelf/Rack</label>
                      <input
                        type="text"
                        value={shelf}
                        onChange={(e) => setShelf(e.target.value)}
                        placeholder="A1-05"
                        className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:border-theme-accent"
                      />
                    </div>
                  </div>
                )}

                {invSettings.enableBatchExpiry === true && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-theme-muted">Batch Number</label>
                      <input
                        type="text"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                        placeholder="BT-990"
                        className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:border-theme-accent"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-theme-muted">Expiry Date</label>
                      <input
                        type="date"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:border-theme-accent"
                      />
                    </div>
                  </div>
                )}

                {!invSettings.enableBarcodeSku && !invSettings.enableWarehouseTracking && !invSettings.enableBatchExpiry && (
                  <div className="text-center p-6 text-theme-muted bg-theme-surface rounded-xl">
                    No advanced features enabled. Enable them in Settings {'>'} Inventory Settings.
                  </div>
                )}
              </div>
            )}

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
          </>
        )}
        
        {activeTab === 'categories' && (
          <div className="space-y-5">
            <div className="card-premium p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-black text-theme-primary flex items-center gap-2"><Tag className="w-4 h-4 text-theme-accent" /> Categories</h3>
                <p className="text-[11px] text-theme-muted mt-0.5">Tap a category to filter the catalog. Tags set on products are collected automatically.</p>
              </div>
              <div className="flex gap-2">
                <input
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder="New category name"
                  className="input-premium !min-h-[38px] text-xs flex-1 sm:w-48"
                />
                <button onClick={handleAddCategory} className="btn-premium !min-h-[38px] !px-4 text-xs flex items-center gap-1.5 shrink-0">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {categoryFilter && (
              <div className="card-premium p-3 flex items-center justify-between bg-theme-accent/5 border border-theme-accent/20">
                <p className="text-xs font-bold text-theme-primary">Catalog filtered by: <span className="text-theme-accent">{categoryFilter}</span></p>
                <button onClick={() => setCategoryFilter('')} className="btn-premium-ghost !min-h-[30px] !px-3 text-[11px]">Clear filter</button>
              </div>
            )}

            {categoryStats.length === 0 ? (
              <div className="card-premium p-10 text-center">
                <Tag className="w-10 h-10 text-theme-muted mx-auto mb-2 opacity-40" />
                <p className="text-xs text-theme-muted font-semibold">No categories yet — add one above or set a "Category Tag" on any product.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categoryStats.map(cs => (
                  <div
                    key={cs.name}
                    onClick={() => { const next = categoryFilter === cs.name ? '' : cs.name; setCategoryFilter(next); if (next) setActiveTab('products'); }}
                    className={`card-premium p-4 cursor-pointer transition-all hover:shadow-premium ${categoryFilter === cs.name ? 'ring-2 ring-theme-accent' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 rounded-xl bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                        {getCategoryIcon(cs.name)}
                      </div>
                      {customCategories.includes(cs.name) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cs.name); }}
                          className="text-theme-muted hover:text-theme-danger p-1"
                          title="Remove custom category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm font-black text-theme-primary truncate">{cs.name}</p>
                    <p className="text-[11px] text-theme-muted font-bold mt-0.5">{cs.count} product{cs.count !== 1 ? 's' : ''}</p>
                    {cs.stockQty > 0 && (
                      <p className="text-[10px] text-theme-muted mt-1">Stock: {Math.round(cs.stockQty * 100) / 100} &bull; Value: {formatCurrency(cs.value, businessSettings?.currency || '₹')}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="card-premium p-4 border-l-4 border-l-theme-accent">
                <div className="text-2xs font-bold text-theme-muted uppercase mb-1">Tracked Items</div>
                <div className="text-xl font-black text-theme-primary tabular-nums">{stockTracked.length}</div>
                <div className="text-[10px] text-theme-muted mt-0.5">Products with stock enabled</div>
              </div>
              <div className="card-premium p-4 border-l-4 border-l-emerald-500">
                <div className="text-2xs font-bold text-theme-muted uppercase mb-1">Inventory Value</div>
                <div className="text-xl font-black text-emerald-600 tabular-nums">{formatCurrency(inventoryValue, businessSettings?.currency || '₹')}</div>
                <div className="text-[10px] text-theme-muted mt-0.5">Stock &times; selling price</div>
              </div>
              <div className="card-premium p-4 border-l-4 border-l-amber-500">
                <div className="text-2xs font-bold text-theme-muted uppercase mb-1">Low Stock</div>
                <div className="text-xl font-black text-amber-600 tabular-nums">{lowStockProducts.length}</div>
                <div className="text-[10px] text-theme-muted mt-0.5">At or below threshold</div>
              </div>
              <div className="card-premium p-4 border-l-4 border-l-rose-500">
                <div className="text-2xs font-bold text-theme-muted uppercase mb-1">Out of Stock</div>
                <div className="text-xl font-black text-rose-600 tabular-nums">{outOfStockProducts.length}</div>
                <div className="text-[10px] text-theme-muted mt-0.5">Needs purchase now</div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="card-premium p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-theme-primary flex items-center gap-2"><Package className="w-4 h-4 text-theme-accent" /> Stock Center</h3>
                <p className="text-[11px] text-theme-muted mt-0.5">Record purchases, fix counts, and audit every stock change.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => openPurchase()} className="btn-premium !min-h-[36px] !px-4 text-xs flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5" /> Record Purchase
                </button>
                <button onClick={() => openAdjust()} className="btn-premium-ghost !min-h-[36px] !px-3.5 text-xs flex items-center gap-1.5">
                  <PackagePlus className="w-3.5 h-3.5" /> Adjust Stock
                </button>
                <button
                  onClick={() => {
                    downloadCSV(`StockMovements_${todayStr()}.csv`, movements.map(m => ({
                      Date: m.date, Product: m.productName, Type: MOVEMENT_TYPES[m.type]?.label || m.type,
                      Change: m.delta, QtyAfter: m.qtyAfter ?? '', Reason: m.reason, Ref: m.refNumber || ''
                    })));
                    toast.success('Stock movement history exported');
                  }}
                  className="btn-premium-ghost !min-h-[36px] !px-3.5 text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Movements CSV
                </button>
              </div>
            </div>

            {/* Low / Out of stock list */}
            <div className="card-premium p-4">
              <h4 className="text-2xs font-black text-theme-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Attention Needed ({lowStockProducts.length + outOfStockProducts.length})
              </h4>
              {lowStockProducts.length + outOfStockProducts.length === 0 ? (
                <p className="text-xs text-theme-muted text-center py-6">All stocked items are above their thresholds. 🎉</p>
              ) : (
                <div className="divide-y divide-theme-border-soft/40 max-h-[300px] overflow-y-auto">
                  {[...outOfStockProducts, ...lowStockProducts].map(p => {
                    const qty = parseFloat(p.stockQty) || 0;
                    const out = qty <= 0;
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-theme-primary truncate">{p.name}</p>
                          <p className="text-[10px] text-theme-muted">Threshold: {p.lowStockThreshold || 5} &bull; {p.sku ? `SKU ${p.sku}` : 'No SKU'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${out ? 'text-rose-600 bg-rose-500/10 border-rose-500/30' : 'text-amber-600 bg-amber-500/10 border-amber-500/30'}`}>
                            {qty} left
                          </span>
                          <button onClick={() => openPurchase(p)} className="btn-premium-ghost !min-h-[28px] !px-2.5 text-[10px] flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" /> Restock
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Movement history */}
            <div className="card-premium p-4">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <h4 className="text-2xs font-black text-theme-muted uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-theme-accent" /> Stock Movement History
                </h4>
                <div className="flex gap-1.5">
                  {['all', 'sale', 'purchase', 'adjustment'].map(f => (
                    <button
                      key={f}
                      onClick={() => setStockTypeFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${stockTypeFilter === f ? 'bg-theme-accent text-white border-theme-accent' : 'text-theme-muted border-theme-border-soft hover:text-theme-primary'}`}
                    >
                      {f === 'all' ? 'All' : MOVEMENT_TYPES[f]?.label || f}
                    </button>
                  ))}
                </div>
              </div>
              {movements.length === 0 ? (
                <p className="text-xs text-theme-muted text-center py-6">No stock movements yet. Sell something, record a purchase, or make an adjustment — every change will be logged here.</p>
              ) : (
                <div className="divide-y divide-theme-border-soft/40 max-h-[360px] overflow-y-auto">
                  {movements
                    .filter(m => stockTypeFilter === 'all' || m.type === stockTypeFilter || (stockTypeFilter === 'sale' && m.type === 'sale-return'))
                    .map(m => {
                      const cfg = MOVEMENT_TYPES[m.type] || MOVEMENT_TYPES.adjustment;
                      const positive = m.delta > 0;
                      return (
                        <div key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-theme-primary truncate">{m.productName || 'Product'}</p>
                            <p className="text-[10px] text-theme-muted truncate">
                              {new Date(m.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              {m.refNumber ? ` • ${m.refNumber}` : ''}{m.reason ? ` • ${m.reason}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${cfg.color}`}>{cfg.label}</span>
                            <span className={`text-xs font-black tabular-nums ${positive ? 'text-emerald-600' : m.delta < 0 ? 'text-rose-600' : 'text-theme-muted'}`}>
                              {positive ? '+' : ''}{m.delta}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
        </div>
        </PullToRefresh>

        <datalist id="category-options-list">
          {categoryStats.map(cs => (
            <option key={cs.name} value={cs.name} />
          ))}
        </datalist>

        {/* PURCHASE ENTRY MODAL */}
        <CenteredModal isOpen={isPurchaseOpen} onClose={() => setIsPurchaseOpen(false)} title="Record Purchase (Stock In)">
          <form onSubmit={handlePurchaseSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-theme-muted text-xs font-bold">Supplier / Shop</label>
                <input value={purchaseForm.supplier} onChange={(e) => setPurchaseForm(f => ({ ...f, supplier: e.target.value }))} placeholder="e.g. Kolkata Wholesale" className="input-premium w-full text-xs" />
              </div>
              <div>
                <label className="block mb-1 text-theme-muted text-xs font-bold">Purchase Date</label>
                <input type="date" value={purchaseForm.date} onChange={(e) => setPurchaseForm(f => ({ ...f, date: e.target.value }))} className="input-premium w-full text-xs" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-theme-muted text-xs font-bold">Items Purchased</label>
              {purchaseForm.items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    value={it.productId}
                    onChange={(e) => { const pid = e.target.value; const prod = products.find(p => p.id === pid); setPurchaseForm(f => ({ ...f, items: f.items.map((x, i) => i === idx ? { ...x, productId: pid, name: prod?.name || '', unitCost: prod ? (parseFloat(prod.cost) || parseFloat(prod.price) || '') : x.unitCost } : x) })); }}
                    className="input-premium col-span-6 text-xs"
                  >
                    <option value="">Select product</option>
                    {products.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                  </select>
                  <input type="number" min="0.01" step="any" value={it.qty} onChange={(e) => setPurchaseForm(f => ({ ...f, items: f.items.map((x, i) => i === idx ? { ...x, qty: e.target.value } : x) }))} placeholder="Qty" className="input-premium col-span-2 text-xs" />
                  <input type="number" min="0" step="any" value={it.unitCost} onChange={(e) => setPurchaseForm(f => ({ ...f, items: f.items.map((x, i) => i === idx ? { ...x, unitCost: e.target.value } : x) }))} placeholder="Cost" className="input-premium col-span-2 text-xs" />
                  <span className="col-span-1 text-[11px] font-black text-theme-primary tabular-nums text-right">{formatCurrency((parseFloat(it.qty) || 0) * (parseFloat(it.unitCost) || 0), businessSettings?.currency || '₹')}</span>
                  <button type="button" onClick={() => setPurchaseForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))} className="col-span-1 text-theme-muted hover:text-theme-danger p-1" title="Remove line"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setPurchaseForm(f => ({ ...f, items: [...f.items, { productId: '', name: '', qty: 1, unitCost: '' }] }))} className="btn-premium-ghost !min-h-[32px] !px-3 text-[11px] flex items-center gap-1"><Plus className="w-3 h-3" /> Add another item</button>
            </div>
            <div className="flex items-center justify-between bg-theme-surface border border-theme-border-soft rounded-xl px-4 py-3">
              <span className="text-xs font-bold text-theme-muted">Total Purchase Cost</span>
              <span className="text-lg font-black text-theme-accent tabular-nums">{formatCurrency(purchaseTotal, businessSettings?.currency || '₹')}</span>
            </div>
            <p className="text-[10px] text-theme-muted">On save: stock increases for every item, a movement is logged, and the total is booked as a Supplies expense.</p>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setIsPurchaseOpen(false)} className="btn-premium-ghost flex-1 py-3 text-xs">Cancel</button>
              <button type="submit" className="btn-premium flex-1 py-3 text-xs">Save Purchase</button>
            </div>
          </form>
        </CenteredModal>

        {/* STOCK ADJUSTMENT MODAL */}
        <CenteredModal isOpen={isAdjustOpen} onClose={() => setIsAdjustOpen(false)} title="Stock Adjustment">
          <form onSubmit={handleAdjustStock} className="space-y-4">
            <div>
              <label className="block mb-1 text-theme-muted text-xs font-bold">Product</label>
              <select value={adjustForm.productId} onChange={(e) => setAdjustForm(f => ({ ...f, productId: e.target.value }))} className="input-premium w-full text-xs">
                <option value="">Select product</option>
                {stockTracked.map(p => (<option key={p.id} value={p.id}>{p.name} (current: {parseFloat(p.stockQty) || 0})</option>))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-theme-muted text-xs font-bold">Direction</label>
                <div className="flex gap-2">
                  {['add', 'reduce'].map(mode => (
                    <button key={mode} type="button" onClick={() => setAdjustForm(f => ({ ...f, mode }))} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${adjustForm.mode === mode ? (mode === 'add' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/40' : 'bg-rose-500/10 text-rose-600 border-rose-500/40') : 'text-theme-muted border-theme-border-soft'}`}>
                      {mode === 'add' ? '+ Add' : '− Reduce'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-1 text-theme-muted text-xs font-bold">Quantity</label>
                <input type="number" min="0.01" step="any" value={adjustForm.qty} onChange={(e) => setAdjustForm(f => ({ ...f, qty: e.target.value }))} placeholder="0" className="input-premium w-full text-xs" required />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-theme-muted text-xs font-bold">Reason (optional)</label>
              <input value={adjustForm.reason} onChange={(e) => setAdjustForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Damaged items, recount, theft" className="input-premium w-full text-xs" />
            </div>
            {adjustForm.productId && adjustForm.qty && (
              (() => {
                const prod = products.find(p => p.id === adjustForm.productId);
                if (!prod) return null;
                const cur = parseFloat(prod.stockQty) || 0;
                const next = Math.max(0, cur + (adjustForm.mode === 'add' ? 1 : -1) * (parseFloat(adjustForm.qty) || 0));
                return (
                  <div className="text-xs font-bold text-theme-muted bg-theme-surface border border-theme-border-soft rounded-xl px-4 py-3 flex items-center justify-between">
                    <span>Result</span>
                    <span className="text-theme-primary">{cur} → <span className={next >= cur ? 'text-emerald-600' : 'text-rose-600'}>{Math.round(next * 100) / 100}</span></span>
                  </div>
                );
              })()
            )}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setIsAdjustOpen(false)} className="btn-premium-ghost flex-1 py-3 text-xs">Cancel</button>
              <button type="submit" className="btn-premium flex-1 py-3 text-xs">Apply Adjustment</button>
            </div>
          </form>
        </CenteredModal>

        {/* SCANNER MODAL */}
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          products={products}
          currencySymbol={currencySymbol}
          onProductScanned={(prod) => {
            setSearchQuery(prod.name);
            setIsScannerOpen(false);
          }}
        />

        {/* PRINTABLE BARCODE LABELS MODAL */}
        <CenteredModal
          isOpen={isBarcodeModalOpen}
          onClose={() => setIsBarcodeModalOpen(false)}
          title="Print Product Barcode Labels"
        >
          <div className="space-y-4 text-xs font-semibold text-theme-muted">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-theme-muted uppercase font-bold text-2xs">Select Product</label>
                <select
                  className="input-premium w-full text-xs bg-theme-surface"
                  value={selectedProductForBarcode?.id || ''}
                  onChange={(e) => {
                    const found = products.find(p => p.id === e.target.value);
                    setSelectedProductForBarcode(found || null);
                  }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sku ? `(${p.sku})` : ''} - ₹{p.price || p.rate || 0}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-theme-muted uppercase font-bold text-2xs">Label Count (Sheet)</label>
                <select
                  className="input-premium w-full text-xs bg-theme-surface"
                  value={barcodeLabelCount}
                  onChange={(e) => setBarcodeLabelCount(Number(e.target.value))}
                >
                  <option value={4}>4 Labels (Sample)</option>
                  <option value={8}>8 Labels (Grid 2x4)</option>
                  <option value={12}>12 Labels (Grid 3x4)</option>
                  <option value={24}>24 Labels (Full Sheet)</option>
                </select>
              </div>
            </div>

            {/* Label Preview Grid */}
            <div className="border border-theme-border-soft rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-inner max-h-[300px] overflow-y-auto">
              <p className="text-2xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">Print Preview (A4 Sticker Sheet)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Array.from({ length: barcodeLabelCount }).map((_, idx) => (
                  <div key={idx} className="border border-dashed border-slate-300 dark:border-slate-700 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-center flex flex-col items-center justify-between min-h-[95px]">
                    <p className="text-[10px] font-black text-slate-900 dark:text-white line-clamp-1">
                      {selectedProductForBarcode?.name || 'Sample Product'}
                    </p>
                    <div className="w-10 h-10 my-1 bg-white p-0.5 rounded border border-slate-200 flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-slate-900" />
                    </div>
                    <div className="w-full flex justify-between items-center text-[9px] font-mono text-slate-600 dark:text-slate-300">
                      <span>{selectedProductForBarcode?.sku || 'SKU-001'}</span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {formatCurrency(selectedProductForBarcode?.price || selectedProductForBarcode?.rate || 0, currencySymbol)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBarcodeModalOpen(false)}
                className="btn-premium-outline flex-1 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-premium flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Labels
              </button>
            </div>
          </div>
        </CenteredModal>
    </AnimatedPage>
  );
};

export default Products;
