import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Layout, Crown, Archive, Copy, Save, X, Settings2, ShieldCheck, Box, SlidersHorizontal, Activity, Palette } from 'lucide-react';
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';

const INITIAL_PLAN = {
  name: '',
  slug: '',
  description: '',
  icon: '👑',
  price: 0,
  currency: 'INR',
  billingCycle: 'monthly',
  customDays: 30,
  trialDays: 0,
  limits: {
    maxInvoices: 50,
    maxCustomers: 50,
    maxProducts: 50,
    maxTeamMembers: 1,
    storageLimitMB: 50
  },
  toggles: {
    liveLink: false,
    customDomain: false,
    whatsappShare: false,
    premiumTemplates: false,
    customBranding: false,
    advancedReports: false,
    prioritySupport: false,
    apiAccess: false,
    paymentQrCustomization: false,
    customColumns: false
  },
  themeControl: {
    allowedThemes: ['theme-default', 'theme-dark', 'theme-luxury-gold', 'theme-luxury-ocean', 'theme-luxury-emerald', 'theme-cyber', 'theme-minimal'],
    allowedTemplates: ['ModernCorporate', 'MinimalClassic', 'TealBoldHeader', 'ElegantSerif', 'TechStartup', 'RetailReceipt'],
    defaultTheme: 'theme-default',
    defaultTemplate: 'MinimalClassic'
  },
  visibility: {
    active: true,
    featured: false,
    maxSubscribers: 0
  }
};

const SubscriptionStudio = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'subscriptionPlans'));
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPlans(fetched.sort((a, b) => a.price - b.price));
    } catch (e) {
      console.error(e);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSave = async () => {
    if (!editingPlan.name) {
      toast.error('Plan name is required');
      return;
    }
    try {
      const planId = editingPlan.id || editingPlan.slug || editingPlan.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const payload = { ...editingPlan, updatedAt: Date.now() };
      if (!editingPlan.id) {
        payload.createdAt = Date.now();
      }
      
      await setDoc(doc(db, 'subscriptionPlans', planId), payload);
      toast.success('Plan saved successfully!');
      setIsModalOpen(false);
      fetchPlans();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save plan');
    }
  };

  const handleDuplicate = (plan) => {
    const duplicate = { ...plan, id: null, name: `${plan.name} (Copy)`, slug: `${plan.slug}-copy` };
    setEditingPlan(duplicate);
    setIsModalOpen(true);
    setActiveTab('basic');
  };

  const handleArchive = async (id, currentStatus) => {
    if (confirm(`Are you sure you want to ${currentStatus ? 'archive' : 'unarchive'} this plan?`)) {
      try {
        await updateDoc(doc(db, 'subscriptionPlans', id), { 'visibility.active': !currentStatus });
        toast.success(`Plan ${currentStatus ? 'archived' : 'activated'}`);
        fetchPlans();
      } catch (e) {
        console.error(e);
        toast.error('Action failed');
      }
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Studio Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-theme-surface to-theme-surface border border-theme-border-soft p-8 shadow-glass z-10 group">
        <div className="absolute inset-0 bg-gradient-to-r from-theme-primary/10 to-blue-500/10 opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-theme-primary to-blue-600 p-0.5 shadow-premium">
              <div className="w-full h-full bg-theme-surface/90 backdrop-blur-xl rounded-[15px] flex items-center justify-center">
                <Settings2 className="w-8 h-8 text-theme-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-theme-primary tracking-tight">Subscription Studio</h1>
              <p className="text-sm font-semibold text-theme-muted mt-1.5 max-w-md leading-relaxed">
                Architect subscription tiers, manage pricing, and control feature availability across the platform.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => { setEditingPlan({ ...INITIAL_PLAN }); setIsModalOpen(true); setActiveTab('basic'); }}
            className="shrink-0 px-6 py-3.5 rounded-xl font-bold bg-theme-primary hover:bg-theme-primary/90 text-white shadow-lg shadow-theme-primary/20 h-[48px]"
          >
            <Plus className="w-5 h-5 mr-2" /> Create New Plan
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-12 h-12 relative">
            <div className="absolute inset-0 border-t-2 border-theme-primary rounded-full animate-spin"></div>
            <div className="absolute inset-1 border-r-2 border-blue-500 rounded-full animate-spin direction-reverse"></div>
          </div>
          <span className="text-sm font-bold text-theme-muted animate-pulse">Loading blueprints...</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-theme-surface/50 border border-theme-border-soft rounded-[2rem] border-dashed">
          <div className="w-20 h-20 bg-theme-primary/5 rounded-full flex items-center justify-center mb-6">
            <Box className="w-10 h-10 text-theme-primary/40" />
          </div>
          <h3 className="text-2xl font-black text-theme-primary mb-2">No Plans Created Yet</h3>
          <p className="text-theme-muted max-w-sm mb-8">You haven't set up any subscription tiers. Click 'Create New Plan' to get started.</p>
          <Button onClick={() => { setEditingPlan({ ...INITIAL_PLAN }); setIsModalOpen(true); setActiveTab('basic'); }} variant="primary" className="bg-theme-primary">
            Create First Plan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={plan.id} 
              className={`relative overflow-hidden rounded-[2rem] p-[1px] group transition-all duration-300 hover:-translate-y-1 hover:shadow-premium ${!plan.visibility.active ? 'opacity-60 grayscale' : 'shadow-glass'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-theme-border-soft to-theme-border-soft group-hover:from-theme-primary/50 group-hover:to-blue-500/50 transition-colors duration-500"></div>
              <div className="relative h-full bg-theme-surface/90 backdrop-blur-xl rounded-[calc(2rem-1px)] p-6 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-theme-app border border-theme-border-soft flex items-center justify-center text-2xl shadow-sm">
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-theme-primary leading-tight">{plan.name}</h3>
                      <p className="text-[10px] font-mono text-theme-muted uppercase tracking-wider mt-1">{plan.id}</p>
                    </div>
                  </div>
                  {plan.visibility.featured && (
                    <span className="bg-gradient-to-r from-theme-accent/20 to-purple-500/20 text-theme-accent border border-theme-accent/20 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      Featured
                    </span>
                  )}
                </div>
                
                <div className="mb-6 flex-1">
                  <div className="flex items-end gap-1 mb-2">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-black text-theme-primary">Free</span>
                    ) : (
                      <>
                        <span className="text-xl font-bold text-theme-muted mb-1">{plan.currency}</span>
                        <span className="text-4xl font-black text-theme-primary">{plan.price.toLocaleString()}</span>
                      </>
                    )}
                    {plan.price > 0 && <span className="text-sm font-bold text-theme-muted mb-1">/{plan.billingCycle}</span>}
                  </div>
                  <p className="text-xs font-semibold text-theme-secondary line-clamp-2">{plan.description || 'No description provided.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="bg-theme-app rounded-xl p-3 border border-theme-border-soft">
                    <span className="block text-[10px] uppercase font-black text-theme-muted tracking-widest mb-1">Invoices</span>
                    <span className="text-sm font-bold text-theme-primary">{plan.limits.maxInvoices === -1 ? 'Unlimited' : plan.limits.maxInvoices}</span>
                  </div>
                  <div className="bg-theme-app rounded-xl p-3 border border-theme-border-soft">
                    <span className="block text-[10px] uppercase font-black text-theme-muted tracking-widest mb-1">Features</span>
                    <span className="text-sm font-bold text-theme-primary">
                      {Object.values(plan.toggles).filter(Boolean).length} Enabled
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-theme-border-soft">
                  <Button onClick={() => handleArchive(plan.id, plan.visibility.active)} variant="ghost" className="p-2 h-10 w-10 shrink-0 rounded-xl text-theme-muted hover:text-theme-warning hover:bg-theme-warning/10">
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => handleDuplicate(plan)} variant="ghost" className="p-2 h-10 w-10 shrink-0 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-theme-primary/10">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => { setEditingPlan(plan); setIsModalOpen(true); setActiveTab('basic'); }} className="flex-1 rounded-xl h-10 font-bold bg-theme-app border border-theme-border-soft hover:border-theme-primary text-theme-primary">
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Plan
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-theme-main/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-theme-surface w-full max-w-5xl h-[90vh] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col relative z-10 border border-theme-border-soft"
            >
              <div className="flex justify-between items-center p-6 border-b border-theme-border-soft bg-theme-surface z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-theme-primary/10 flex items-center justify-center">
                    <SlidersHorizontal className="w-5 h-5 text-theme-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-theme-primary">{editingPlan.id ? 'Edit Blueprint' : 'New Blueprint'}</h2>
                    <p className="text-xs font-semibold text-theme-muted">Configure plan details and limitations</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-theme-app flex items-center justify-center text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-2 p-4 border-b border-theme-border-soft bg-theme-app/50 overflow-x-auto no-scrollbar shrink-0">
                {[
                  { id: 'basic', icon: Box, label: 'Basics' },
                  { id: 'pricing', icon: Crown, label: 'Pricing' },
                  { id: 'limits', icon: ShieldCheck, label: 'Usage Limits' },
                  { id: 'features', icon: Activity, label: 'Feature Access' },
                  { id: 'themes', icon: Palette, label: 'Themes & Templates' },
                  { id: 'visibility', icon: Layout, label: 'Display' }
                ].map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setActiveTab(t.id)} 
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                      activeTab === t.id 
                        ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/20' 
                        : 'bg-theme-surface border border-theme-border-soft text-theme-muted hover:text-theme-primary hover:border-theme-primary/30'
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-8 overflow-y-auto flex-1 bg-theme-app">
                <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                
                {activeTab === 'basic' && (
                  <div className="grid grid-cols-2 gap-6 max-w-3xl">
                    <div className="col-span-2 group">
                      <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Plan Name</label>
                      <input type="text" className="w-full px-4 py-3.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/50 transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.02)]" value={editingPlan.name} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} placeholder="e.g. Professional Plan" />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Plan Slug/ID</label>
                      <input type="text" className="w-full px-4 py-3.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/50 transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.02)] font-mono text-xs" value={editingPlan.slug} onChange={e => setEditingPlan({...editingPlan, slug: e.target.value})} placeholder="e.g. pro-monthly" disabled={!!editingPlan.id} />
                      {!!editingPlan.id && <p className="text-[10px] text-theme-warning mt-1 font-bold">Slug cannot be changed after creation.</p>}
                    </div>
                    <div className="group">
                      <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Badge Emoji</label>
                      <input type="text" className="w-full px-4 py-3.5 bg-theme-surface border border-theme-border-soft rounded-xl text-xl text-center font-bold text-theme-primary focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/50 transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.02)]" value={editingPlan.icon} onChange={e => setEditingPlan({...editingPlan, icon: e.target.value})} />
                    </div>
                    <div className="col-span-2 group">
                      <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Description</label>
                      <textarea className="w-full px-4 py-3.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/50 transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.02)] h-32 resize-none" value={editingPlan.description} onChange={e => setEditingPlan({...editingPlan, description: e.target.value})} placeholder="Short description seen on the pricing page..."></textarea>
                    </div>
                  </div>
                )}

                {activeTab === 'pricing' && (
                  <div className="grid grid-cols-2 gap-6 max-w-3xl">
                    <div className="group">
                      <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Price Amount</label>
                      <input type="number" className="w-full px-4 py-3.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/50 transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.02)]" value={editingPlan.price} onChange={e => setEditingPlan({...editingPlan, price: Number(e.target.value)})} />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Currency</label>
                      <input type="text" className="w-full px-4 py-3.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/50 transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.02)]" value={editingPlan.currency} onChange={e => setEditingPlan({...editingPlan, currency: e.target.value})} />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Billing Cycle</label>
                      <select className="w-full px-4 py-3.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/50 transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.02)] appearance-none" value={editingPlan.billingCycle} onChange={e => setEditingPlan({...editingPlan, billingCycle: e.target.value})}>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="lifetime">Lifetime</option>
                        <option value="custom">Custom Days</option>
                      </select>
                    </div>
                    {editingPlan.billingCycle === 'custom' && (
                      <div className="group">
                        <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Custom Days</label>
                        <input type="number" className="w-full px-4 py-3.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/50 transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.02)]" value={editingPlan.customDays} onChange={e => setEditingPlan({...editingPlan, customDays: Number(e.target.value)})} />
                      </div>
                    )}
                    <div className="col-span-2 group">
                      <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Trial Period (Days)</label>
                      <input type="number" className="w-full px-4 py-3.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/50 transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.02)]" value={editingPlan.trialDays} onChange={e => setEditingPlan({...editingPlan, trialDays: Number(e.target.value)})} />
                      <p className="text-[10px] text-theme-muted mt-2 font-bold">Set to 0 to disable trial period.</p>
                    </div>
                  </div>
                )}

                {activeTab === 'limits' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                    {Object.keys(editingPlan.limits).map(key => (
                      <div key={key} className="bg-theme-surface p-5 rounded-2xl border border-theme-border-soft shadow-sm">
                        <label className="block text-xs font-black text-theme-primary uppercase tracking-wider mb-3">{key.replace(/([A-Z])/g, ' $1')}</label>
                        <div className="flex gap-3">
                          <input type="number" className="flex-1 px-4 py-3 bg-theme-app border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/50 transition-all disabled:opacity-50 disabled:bg-theme-surface" value={editingPlan.limits[key]} onChange={e => setEditingPlan({...editingPlan, limits: { ...editingPlan.limits, [key]: Number(e.target.value) }})} disabled={editingPlan.limits[key] === -1} />
                          <button 
                            onClick={() => setEditingPlan({...editingPlan, limits: { ...editingPlan.limits, [key]: editingPlan.limits[key] === -1 ? 0 : -1 }})} 
                            className={`px-5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                              editingPlan.limits[key] === -1 
                                ? 'bg-theme-success/10 text-theme-success border border-theme-success/20' 
                                : 'bg-theme-app border border-theme-border-soft text-theme-muted hover:text-theme-primary'
                            }`}
                          >
                            Unlimited
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'features' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                    {Object.keys(editingPlan.toggles || {}).map(key => (
                      <div key={key} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${editingPlan.toggles[key] ? 'bg-theme-primary/5 border-theme-primary/30' : 'bg-theme-surface border-theme-border-soft hover:border-theme-primary/20'}`}>
                        <div>
                          <span className="block text-sm font-bold text-theme-primary capitalize mb-1">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-theme-muted">{editingPlan.toggles[key] ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <button onClick={() => setEditingPlan({...editingPlan, toggles: { ...editingPlan.toggles, [key]: !editingPlan.toggles[key] }})} className={`w-12 h-7 rounded-full transition-colors relative shadow-inner ${editingPlan.toggles[key] ? 'bg-theme-primary' : 'bg-theme-border-soft'}`}>
                          <div className={`w-5 h-5 rounded-full bg-white absolute top-1 shadow-md transition-transform ${editingPlan.toggles[key] ? 'left-6' : 'left-1'}`}></div>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'themes' && (
                  <div className="space-y-8 max-w-5xl">
                    <div>
                      <div className="mb-4">
                        <h3 className="text-sm font-black text-theme-primary uppercase tracking-wider">Allowed Themes</h3>
                        <p className="text-xs text-theme-muted mt-1 font-bold">Select which color themes are available for this plan.</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { id: 'obsidian-gold', name: 'Obsidian Gold' },
                          { id: 'arctic-teal', name: 'Arctic Teal' },
                          { id: 'rose-gold', name: 'Rose Gold' },
                          { id: 'neon-cyber', name: 'Neon Cyber' },
                          { id: 'pink-premium', name: 'Pink Premium' },
                          { id: 'emerald-business', name: 'Emerald' }
                        ].map(theme => {
                          const isAllowed = ((editingPlan.themeControl || {}).allowedThemes || []).includes(theme.id) || ((editingPlan.themeControl || {}).allowedThemes || []).includes('all');
                          return (
                            <label key={theme.id} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${isAllowed ? 'border-theme-primary bg-theme-primary/5 shadow-[inset_0_0_0_1px_var(--text-primary)]' : 'border-theme-border-soft bg-theme-surface hover:border-theme-primary/40'}`}>
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded text-theme-primary focus:ring-theme-primary cursor-pointer accent-theme-primary" 
                                checked={isAllowed}
                                onChange={(e) => {
                                  let current = [...((editingPlan.themeControl || {}).allowedThemes || [])];
                                  if (current.includes('all')) current = ['obsidian-gold', 'arctic-teal', 'rose-gold', 'neon-cyber', 'pink-premium', 'emerald-business'];
                                  if (e.target.checked) {
                                    if (!current.includes(theme.id)) current.push(theme.id);
                                  } else {
                                    current = current.filter(t => t !== theme.id && t !== 'all');
                                  }
                                  setEditingPlan({...editingPlan, themeControl: { ...(editingPlan.themeControl || {}), allowedThemes: current }});
                                }}
                              />
                              <span className="text-sm font-bold text-theme-primary">{theme.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="mb-4">
                        <h3 className="text-sm font-black text-theme-primary uppercase tracking-wider">Allowed Templates</h3>
                        <p className="text-xs text-theme-muted mt-1 font-bold">Select which invoice templates this plan can use.</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { id: 'standard', name: 'Standard Professional' },
                          { id: 'modern', name: 'Modern Minimal' },
                          { id: 'classic', name: 'Classic Corporate' },
                          { id: 'elegant', name: 'Elegant Serif' },
                          { id: 'retail', name: 'Retail Receipt' }
                        ].map(template => {
                          const isAllowed = ((editingPlan.themeControl || {}).allowedTemplates || []).includes(template.id) || ((editingPlan.themeControl || {}).allowedTemplates || []).includes('all');
                          return (
                            <label key={template.id} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${isAllowed ? 'border-theme-primary bg-theme-primary/5 shadow-[inset_0_0_0_1px_var(--text-primary)]' : 'border-theme-border-soft bg-theme-surface hover:border-theme-primary/40'}`}>
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded text-theme-primary focus:ring-theme-primary cursor-pointer accent-theme-primary" 
                                checked={isAllowed}
                                onChange={(e) => {
                                  let current = [...((editingPlan.themeControl || {}).allowedTemplates || [])];
                                  if (current.includes('all')) current = ['standard', 'modern', 'classic', 'elegant', 'retail'];
                                  if (e.target.checked) {
                                    if (!current.includes(template.id)) current.push(template.id);
                                  } else {
                                    current = current.filter(t => t !== template.id && t !== 'all');
                                  }
                                  setEditingPlan({...editingPlan, themeControl: { ...(editingPlan.themeControl || {}), allowedTemplates: current }});
                                }}
                              />
                              <span className="text-sm font-bold text-theme-primary">{template.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-theme-border-soft">
                      <div className="group">
                        <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Default Theme Setting</label>
                        <select className="w-full px-4 py-3.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/50 transition-all cursor-pointer" value={(editingPlan.themeControl || {}).defaultTheme || 'obsidian-gold'} onChange={e => setEditingPlan({...editingPlan, themeControl: { ...(editingPlan.themeControl || {}), defaultTheme: e.target.value }})}>
                          <option value="obsidian-gold">Obsidian Gold</option>
                          <option value="arctic-teal">Arctic Teal</option>
                          <option value="rose-gold">Rose Gold</option>
                          <option value="neon-cyber">Neon Cyber</option>
                          <option value="pink-premium">Pink Premium</option>
                          <option value="emerald-business">Emerald</option>
                        </select>
                      </div>
                      <div className="group">
                        <label className="block text-xs font-black text-theme-muted uppercase tracking-wider mb-2">Default Template Setting</label>
                        <select className="w-full px-4 py-3.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/50 transition-all cursor-pointer" value={(editingPlan.themeControl || {}).defaultTemplate || 'standard'} onChange={e => setEditingPlan({...editingPlan, themeControl: { ...(editingPlan.themeControl || {}), defaultTemplate: e.target.value }})}>
                          <option value="standard">Standard Professional</option>
                          <option value="modern">Modern Minimal</option>
                          <option value="classic">Classic Corporate</option>
                          <option value="elegant">Elegant Serif</option>
                          <option value="retail">Retail Receipt</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'visibility' && (
                  <div className="space-y-4 max-w-3xl">
                    <div className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${editingPlan.visibility.active ? 'bg-theme-success/5 border-theme-success/30' : 'bg-theme-surface border-theme-border-soft'}`}>
                      <div>
                        <span className="block text-base font-black text-theme-primary mb-1">Plan Active</span>
                        <span className="text-xs font-semibold text-theme-muted">Inactive plans cannot be purchased by new users.</span>
                      </div>
                      <button onClick={() => setEditingPlan({...editingPlan, visibility: { ...editingPlan.visibility, active: !editingPlan.visibility.active }})} className={`w-12 h-7 rounded-full transition-colors relative shadow-inner ${editingPlan.visibility.active ? 'bg-theme-success' : 'bg-theme-border-soft'}`}>
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-1 shadow-md transition-transform ${editingPlan.visibility.active ? 'left-6' : 'left-1'}`}></div>
                      </button>
                    </div>
                    
                    <div className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${editingPlan.visibility.featured ? 'bg-theme-accent/5 border-theme-accent/30' : 'bg-theme-surface border-theme-border-soft'}`}>
                      <div>
                        <span className="block text-base font-black text-theme-primary mb-1">Featured Plan</span>
                        <span className="text-xs font-semibold text-theme-muted">Highlight this plan on the public pricing page.</span>
                      </div>
                      <button onClick={() => setEditingPlan({...editingPlan, visibility: { ...editingPlan.visibility, featured: !editingPlan.visibility.featured }})} className={`w-12 h-7 rounded-full transition-colors relative shadow-inner ${editingPlan.visibility.featured ? 'bg-theme-accent' : 'bg-theme-border-soft'}`}>
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-1 shadow-md transition-transform ${editingPlan.visibility.featured ? 'left-6' : 'left-1'}`}></div>
                      </button>
                    </div>
                  </div>
                )}

                </motion.div>
              </div>

              <div className="p-6 border-t border-theme-border-soft bg-theme-surface flex justify-end gap-3 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold h-auto border border-theme-border-soft">Cancel</Button>
                <Button onClick={handleSave} className="px-8 py-3 rounded-xl font-bold bg-theme-primary hover:bg-theme-primary/90 text-white shadow-lg shadow-theme-primary/20 h-auto">
                  <Save className="w-5 h-5 mr-2" /> Save Blueprint
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionStudio;
