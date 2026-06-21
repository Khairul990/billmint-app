import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, TrendingUp, CheckCircle, XCircle, Eye, Settings as SettingsIcon, CloudLightning, Hash, RotateCcw, Download, CheckCircle2, Info, Sliders, Save, Megaphone, Lock, Database, Upload, CircleDollarSign, ImageIcon, FileText, Trash2 } from 'lucide-react';
import { auth } from '../../services/firebaseConfig';
import { getCounterStatus, resetCounter } from '../../services/invoiceNumberService';
import { toast } from 'react-hot-toast';

const InvoiceNumberSettings = () => {
  const [counterStatus, setCounterStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const userId = auth?.currentUser?.uid;
      if (userId) {
        const status = await getCounterStatus(userId);
        setCounterStatus(status);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset the invoice counter to 0? This will start numbering from INV-[Year]-001 again.")) {
      try {
        const userId = auth?.currentUser?.uid;
        if (userId) {
          await resetCounter(userId);
          toast.success("Invoice counter reset successfully!");
          fetchStatus();
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to reset counter");
      }
    }
  };

  if (loading) return null;

  return (
    <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-5">
      <h3 className="text-sm font-extrabold text-theme-primary dark:text-theme-primary border-b border-theme-border-soft pb-3 flex items-center gap-2">
        <Hash className="w-4.5 h-4.5 text-theme-accent" />
        <span>Auto-Numbering Settings</span>
      </h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-theme-muted font-bold mb-1">Current Year Tracker: <span className="text-theme-primary font-black">{new Date().getFullYear()}</span></p>
          <p className="text-xs text-theme-muted font-bold">Next Invoice Number: <span className="text-theme-accent font-black">INV-{new Date().getFullYear()}-{String((counterStatus?.count || 0) + 1).padStart(3, '0')}</span></p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-theme-danger/10 hover:bg-theme-danger/20 text-theme-danger font-bold text-[10px] uppercase rounded-xl transition-all shadow-sm border border-theme-danger/20"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Counter</span>
        </button>
      </div>
    </div>
  );
};

const AdminConsoleTab = (props) => {
  const { adminSubTab, setAdminSubTab, loadingAdminData, adminUsers, adminRequests, handleForceSync, globalSettings, adminGlobalTheme, setAdminGlobalTheme, adminGlobalMode, setAdminGlobalMode, updateGlobalAdminSettings, setSelectedScreenshot, setShowRejectionModalFor, rejectionReasonInput, setRejectionReasonInput, handleConfirmRejectRequest } = props;

  return (
    <>
        
          <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-theme-accent-light dark:bg-theme-accent-light/40 text-theme-accent dark:text-theme-accent flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-theme-primary dark:text-theme-primary dark:text-theme-secondary">Install BillQyro App</h2>
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Run BillQyro as a premium standalone software</p>
              </div>
            </div>

            {isAppInstalled ? (
              <div className="p-6 bg-theme-accent-light dark:bg-theme-accent-light/20 border border-theme-accent/30 dark:border-theme-accent/60 rounded-3xl text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-tr from-theme-accent to-theme-accent-dark rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-glow">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-extrabold text-theme-primary dark:text-theme-primary">BillQyro App is Installed!</h3>
                <p className="text-xs text-theme-muted dark:text-theme-muted max-w-md mx-auto leading-relaxed font-semibold">
                  You are running the standalone application with high-performance local database caching, full offline capabilities, and a borderless dedicated workspace window.
                </p>
              </div>
            ) : installPromptEvent ? (
              <div className="p-6 bg-theme-app dark:bg-theme-surface dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-3xl text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-tr from-theme-accent to-theme-accent-dark rounded-2xl flex items-center justify-center mx-auto shadow-glow text-white flex items-center justify-center font-black text-xl">
                  BQ
                </div>
                <h3 className="text-lg font-extrabold text-theme-primary dark:text-theme-primary">BillQyro Standalone Application</h3>
                <p className="text-xs text-theme-muted dark:text-theme-muted max-w-md mx-auto leading-relaxed font-semibold">
                  Install BillQyro directly to your desktop or mobile home screen. Unlocks faster loading speeds, borderless full-screen workspace, and robust offline accounting access.
                </p>
                <button
                  type="button"
                  onClick={onInstallApp}
                  className="inline-flex items-center gap-2 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 font-black text-xs px-6 py-4 rounded-2xl shadow-glow active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider animate-pulse"
                >
                  <Download className="w-4 h-4" />
                  <span>Install BillQyro Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-5 bg-theme-warning/5 dark:bg-amber-950/20 border border-theme-warning/30 dark:border-amber-900/60 rounded-2xl flex gap-3">
                  <div className="p-2 bg-theme-card dark:bg-theme-card rounded-xl text-theme-warning shadow-xs h-fit flex items-center justify-center">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-widest mb-1">Manual Installation Guide</h4>
                    <p className="text-[11px] font-semibold text-theme-muted dark:text-theme-muted leading-relaxed">
                      Native one-click installation is not supported by your current browser environment (e.g. iOS Safari) or the app is already installed. Follow the quick instructions below to install manually!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Apple iOS */}
                  <div className="bg-theme-app dark:bg-theme-surface dark:bg-theme-surface/40 p-5 rounded-2xl border border-theme-border-soft dark:border-theme-border-soft space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-theme-surface dark:bg-theme-card text-[10px] font-black text-theme-primary dark:text-theme-muted uppercase">
                      🍎 Apple iOS (iPhone/iPad)
                    </div>
                    <ol className="text-xs text-theme-muted dark:text-theme-muted font-semibold space-y-2 list-decimal list-inside">
                      <li>Open BillQyro in <strong className="text-theme-primary dark:text-theme-muted dark:text-theme-secondary">Safari</strong> browser.</li>
                      <li>Tap the <strong className="text-theme-primary dark:text-theme-muted dark:text-theme-secondary">Share</strong> button (box with an up-arrow).</li>
                      <li>Scroll and select <strong className="text-theme-primary dark:text-theme-muted dark:text-theme-secondary">Add to Home Screen</strong>.</li>
                      <li>Tap <strong className="text-theme-accent dark:text-theme-accent font-black">Add</strong> in the top-right corner.</li>
                    </ol>
                  </div>

                  {/* Android Chrome */}
                  <div className="bg-theme-app dark:bg-theme-surface dark:bg-theme-surface/40 p-5 rounded-2xl border border-theme-border-soft dark:border-theme-border-soft space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-theme-surface dark:bg-theme-card text-[10px] font-black text-theme-primary dark:text-theme-muted uppercase">
                      🤖 Android Mobile (Chrome)
                    </div>
                    <ol className="text-xs text-theme-muted dark:text-theme-muted font-semibold space-y-2 list-decimal list-inside">
                      <li>Open BillQyro in <strong className="text-theme-primary dark:text-theme-muted dark:text-theme-secondary">Chrome</strong>.</li>
                      <li>Tap the <strong className="text-theme-primary dark:text-theme-muted dark:text-theme-secondary">Menu</strong> icon (three vertical dots).</li>
                      <li>Select <strong className="text-theme-primary dark:text-theme-muted dark:text-theme-secondary">Add to Home screen</strong> or <strong className="text-theme-primary dark:text-theme-muted dark:text-theme-secondary">Install app</strong>.</li>
                      <li>Confirm by tapping <strong className="text-theme-accent dark:text-theme-accent font-black">Install</strong>.</li>
                    </ol>
                  </div>

                  {/* Desktop PCs */}
                  <div className="bg-theme-app dark:bg-theme-surface dark:bg-theme-surface/40 p-5 rounded-2xl border border-theme-border-soft dark:border-theme-border-soft space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-theme-surface dark:bg-theme-card text-[10px] font-black text-theme-primary dark:text-theme-muted uppercase">
                      💻 Desktop Computers
                    </div>
                    <ol className="text-xs text-theme-muted dark:text-theme-muted font-semibold space-y-2 list-decimal list-inside">
                      <li>Open BillQyro in <strong className="text-theme-primary dark:text-theme-muted dark:text-theme-secondary">Chrome</strong> or <strong className="text-theme-primary dark:text-theme-muted dark:text-theme-secondary">Edge</strong>.</li>
                      <li>Look at the right side of the browser's address bar.</li>
                      <li>Click the <strong className="text-theme-primary dark:text-theme-muted dark:text-theme-secondary">Install App</strong> icon (square with overlapping shapes).</li>
                      <li>Click <strong className="text-theme-accent dark:text-theme-accent font-black">Install</strong> in the confirmation box.</li>
                    </ol>
                  </div>
                </div>
              </div>
          </div>
      </div>

      {/* --- SIMPLIFIED ADMIN FEATURE & PLAN CONTROL PANEL (TASK 8) --- */}
      {isAdmin && (
        <div className="mt-12 space-y-6 pt-12 border-t-2 border-theme-border-soft dark:border-theme-border-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-theme-accent to-theme-accent-dark text-white flex items-center justify-center shadow-glow">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-theme-primary dark:text-theme-primary tracking-tight">Superuser Admin Console</h2>
                <p className="text-xs text-theme-muted dark:text-theme-muted font-medium mt-0.5">SaaS tier levels, announcements, and global databases control</p>
              </div>
            </div>
            {/* Storage Quota */}
            <div className="flex flex-col sm:items-end">
              <span className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Local storage quota</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-1.5 bg-theme-border-soft dark:bg-theme-surface rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${storageHealth.percentage > 80 ? 'bg-theme-danger' : 'bg-theme-accent'}`} style={{ width: `${storageHealth.percentage}%` }}></div>
                </div>
                <span className="text-xs font-bold text-theme-primary dark:text-theme-muted dark:text-theme-muted">{storageHealth.percentage}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* SUB TAB SELECTOR PILLS */}
              <div className="flex bg-theme-surface dark:bg-theme-card/80 p-1.5 rounded-2xl mb-2 gap-1.5 w-fit border border-theme-border-soft dark:border-theme-border-soft/50">
                {[
                  { id: 'features', label: 'Feature Policies' },
                  { id: 'users', label: 'Users Directory' },
                  { id: 'requests', label: 'Manual Requests' }
                ].map((subTab) => {
                  const isSelected = adminSubTab === subTab.id;
                  const pendingCount = subTab.id === 'requests'
                    ? adminRequests.filter(r => r.status === 'Pending').length
                    : 0;
                  return (
                    <button
                      key={subTab.id}
                      type="button"
                      onClick={() => setAdminSubTab(subTab.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${isSelected
                          ? 'bg-theme-card dark:bg-theme-card dark:bg-theme-surface text-theme-accent dark:text-theme-accent shadow-sm border border-theme-border-soft dark:border-theme-border-soft dark:border-theme-border-soft'
                          : 'text-theme-primary hover:text-theme-primary dark:text-theme-muted dark:text-theme-muted dark:hover:text-theme-primary'
                        }`}
                    >
                      <span>{subTab.label}</span>
                      {pendingCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-theme-danger text-white rounded-full font-black animate-pulse">
                          {pendingCount}
                        </span>
                    </button>
                  );
                })}
              </div>

              {adminSubTab === 'features' && (
                <div className="space-y-6">
                  {/* PLAN & FEATURE CONTROL SECTION */}
                  <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-5">
                    <h3 className="text-sm font-extrabold text-theme-primary dark:text-theme-primary dark:text-theme-primary border-b border-theme-border-soft dark:border-theme-border-soft pb-3 flex items-center gap-2">
                      <Sliders className="w-4.5 h-4.5 text-theme-accent" />
                      <span>SaaS Plan & Feature control</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-theme-primary dark:text-theme-muted">
                      <div>
                        <label className="block mb-1.5 text-theme-muted uppercase text-[9px] font-black tracking-wider">Free Monthly Invoice Limit</label>
                        <input
                          type="number"
                          value={freeInvoiceLimit}
                          onChange={(e) => setFreeInvoiceLimit(Math.max(1, parseInt(e.target.value) || 15))}
                          className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-extrabold"
                        />
                      </div>

                      {/* Feature Dropdowns */}
                      {[
                        { state: feature_liveInvoiceLink, setter: setFeature_liveInvoiceLink, id: 'liveInvoiceLink', label: 'Live Public Links Tier' },
                        { state: feature_paymentProof, setter: setFeature_paymentProof, id: 'paymentProof', label: 'UPI/Mobile payment verification Tier' },
                        { state: feature_customLogo, setter: setFeature_customLogo, id: 'customLogo', label: 'Custom Corporate Logo Tier' },
                        { state: feature_whatsappShare, setter: setFeature_whatsappShare, id: 'whatsappShare', label: 'WhatsApp direct sharing Tier' },
                        { state: feature_cloudSync, setter: setFeature_cloudSync, id: 'cloudSync', label: 'Dedicated cloud Syncing Tier' },
                        { state: feature_reports, setter: setFeature_reports, id: 'reports', label: 'Financial reports & charts Tier' },
                        { state: feature_customerDatabase, setter: setFeature_customerDatabase, id: 'customerDatabase', label: 'CRM Client Database Tier' },
                      ].map((feat) => (
                        <div key={feat.id}>
                          <label className="block mb-1.5 text-theme-muted uppercase text-[9px] font-black tracking-wider">{feat.label}</label>
                          <select
                            value={feat.state}
                            onChange={(e) => feat.setter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-bold"
                          >
                            <option value="Free">Free (Standard tier allowed)</option>
                            <option value="Premium">Premium Only (Requires Growth upgrade)</option>
                          </select>
                        </div>
                      ))}

                      {/* Premium PDF Themes: locked to premium only */}
                      <div>
                        <label className="block mb-1.5 text-theme-muted uppercase text-[9px] font-black tracking-wider">Premium PDF Themes Tier</label>
                        <select
                          disabled
                          value="Premium"
                          className="w-full px-4 py-2.5 bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl text-theme-muted font-bold cursor-not-allowed"
                        >
                          <option value="Premium">Premium Only</option>
                        </select>
                      </div>

                      {/* GLOBAL BRAND THEME DEFAULTS */}
                      <div className="md:col-span-2 mt-4 pt-4 border-t border-theme-border-soft dark:border-theme-border-soft">
                        <h4 className="text-xs font-black uppercase text-theme-primary mb-3">Global Default Theme Settings</h4>
                        <p className="text-[10px] text-theme-muted mb-4 font-semibold">These settings will be applied instantly to all new visitors and unauthenticated users when they open the platform.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-1.5 text-theme-muted uppercase text-[9px] font-black tracking-wider">Default Brand Theme</label>
                            <select
                              value={adminGlobalTheme}
                              onChange={(e) => setAdminGlobalTheme(e.target.value)}
                              className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-bold"
                            >
                              <option value="classic">BillQyro Classic</option>
                                <option value="indigo">Royal Indigo</option>
                                <option value="emerald">Emerald Business</option>
                                <option value="rose">Rose Gold Luxe</option>
                                <option value="midnight">Midnight Blue</option>
                                <option value="champagne">Champagne Black</option>
                                <option value="ruby">Ruby Burgundy</option>
                              </select>
                          </div>
                          <div>
                            <label className="block mb-1.5 text-theme-muted uppercase text-[9px] font-black tracking-wider">Default Display Mode</label>
                            <select
                              value={adminGlobalMode}
                              onChange={(e) => setAdminGlobalMode(e.target.value)}
                              className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-bold"
                            >
                              <option value="light">Light Mode</option>
                              <option value="dark">Dark Mode</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            const success = await updateGlobalAdminSettings({
                              defaultTheme: adminGlobalTheme,
                              defaultMode: adminGlobalMode
                            });
                            if (success) {
                              toast.success("Global Admin Settings saved!");
                            } else {
                              toast.error("Failed to save global settings.");
                            }
                          }}
                          className="mt-4 px-5 py-2 bg-theme-surface border border-theme-border-strong text-theme-primary hover:bg-theme-app dark:bg-theme-card dark:hover:bg-theme-card text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          Save Global Config
                        </button>
                      </div>

                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-theme-accent hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Feature Policies</span>
                      </button>
                    </div>
                  </div>
                  </div>

                  <InvoiceNumberSettings />

                  {/* BANNERS & ANNOUNCEMENTS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-5 border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-xs font-black text-theme-accent dark:text-theme-accent mb-1 flex items-center gap-2 uppercase tracking-wide">
                          <Megaphone className="w-4 h-4 text-theme-accent" /> Global Announcement
                        </h3>
                        <p className="text-[9px] text-theme-muted font-medium mb-3">Broadcast platform messages to all user dashboards.</p>
                        <textarea
                          value={globalAnnouncement}
                          onChange={(e) => setGlobalAnnouncement(e.target.value)}
                          placeholder="Type announcement text..."
                          className="w-full text-xs p-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 resize-none h-20 text-theme-primary dark:text-theme-primary dark:text-theme-primary"
                        />
                      </div>
                      <button onClick={handleSave} className="w-full py-2 bg-theme-accent-light hover:bg-theme-accent-light text-theme-accent font-bold text-xs rounded-xl transition-all cursor-pointer dark:bg-theme-accent-light dark:text-theme-accent">
                        Publish Banner
                      </button>
                    </div>

                    <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-5 border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-xs font-black text-rose-900 dark:text-rose-300 mb-1 flex items-center gap-2 uppercase tracking-wide">
                          <Lock className="w-4 h-4 text-theme-danger" /> Maintenance Mode Lock
                        </h3>
                        <p className="text-[9px] text-theme-muted font-medium mb-3">Shut down standard users workspace, presenting lock screen.</p>
                        <div className="flex items-center justify-between p-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl">
                          <span className="text-xs font-bold text-theme-primary dark:text-theme-muted dark:text-theme-primary">Maintenance Lockout</span>
                          <button
                            onClick={() => setMaintenanceMode(!maintenanceMode)}
                            className={`w-10 h-5 rounded-full relative transition-all duration-500 ease-in-out shadow-inner flex items-center p-0.5 focus:outline-none ${maintenanceMode ? 'bg-[image:var(--accent-gradient)] shadow-sm shadow-theme-accent/30' : 'bg-slate-300 dark:bg-slate-700/60 border border-slate-400/20 dark:border-white/5'}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-in-out ${maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                          </button>
                        </div>
                      </div>
                      <button onClick={handleSave} className="w-full py-2 bg-theme-danger/5 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer dark:bg-rose-950/20 dark:text-rose-450">
                        Apply lockout state
                      </button>
                    </div>
                  </div>

                  {/* DATABASE BACKUP AND RESTORE */}
                  <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-5 md:p-6 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-4">
                    <h3 className="text-sm font-extrabold text-theme-primary dark:text-theme-secondary border-b border-theme-border-soft dark:border-theme-border-soft pb-3 flex items-center gap-2">
                      <Database className="w-4.5 h-4.5 text-theme-accent" />
                      <span>Platform Data Backup & Restore</span>
                    </h3>
                    <p className="text-xs text-theme-muted font-medium leading-relaxed">
                      Export your entire workspace (invoices, clients CRM catalog, overhead expenses, preferences) to a single local JSON file.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 py-3 bg-theme-accent-light hover:bg-theme-accent-light/80 text-theme-accent font-bold text-xs rounded-2xl transition-all cursor-pointer dark:bg-theme-accent-light dark:text-theme-accent"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export Database (JSON)</span>
                      </button>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImport}
                          id="backup-upload"
                          className="hidden"
                        />
                        <label
                          htmlFor="backup-upload"
                          className="flex items-center justify-center gap-2 py-3 bg-theme-accent hover:opacity-90 text-white font-bold text-xs rounded-2xl cursor-pointer transition-all text-center"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Import Database (JSON)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              {adminSubTab === 'users' && (
                <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-5">
                  <h3 className="text-sm font-extrabold text-theme-primary dark:text-theme-primary dark:text-theme-primary border-b border-theme-border-soft dark:border-theme-border-soft pb-3 flex items-center gap-2">
                    <Users className="w-4.5 h-4.5 text-theme-accent" />
                    <span>Registered Users Directory</span>
                  </h3>

                  {loadingAdminData ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-theme-accent border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-theme-muted font-bold">Querying users list...</span>
                    </div>
                  ) : adminUsers.length === 0 ? (
                    <div className="py-12 text-center text-xs text-theme-muted dark:text-theme-muted font-bold">
                      No users registered in this directory.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-theme-border-soft dark:border-theme-border-soft">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-theme-app dark:bg-theme-surface dark:bg-theme-surface/60 text-theme-primary dark:text-theme-muted font-black uppercase tracking-wider border-b border-theme-border-soft dark:border-theme-border-soft">
                            <th className="p-3.5">User Email</th>
                            <th className="p-3.5">Business Name</th>
                            <th className="p-3.5">Country</th>
                            <th className="p-3.5">Current Plan</th>
                            <th className="p-3.5 text-center">Status</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium">
                          {adminUsers.map((user) => (
                            <tr key={user.userId} className="hover:bg-theme-app dark:bg-theme-surface/50 dark:hover:bg-theme-surface/20 transition-all">
                              <td className="p-3.5 font-bold text-theme-primary dark:text-theme-primary dark:text-theme-secondary">{user.email}</td>
                              <td className="p-3.5 text-theme-muted dark:text-theme-muted">{user.businessName || '—'}</td>
                              <td className="p-3.5 text-theme-muted dark:text-theme-muted">{user.country || 'India'}</td>
                              <td className="p-3.5">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${user.planStatus === 'premium'
                                    ? 'bg-theme-accent-light text-theme-accent dark:bg-theme-accent-light/20 dark:text-theme-accent'
                                    : 'bg-theme-surface text-theme-muted dark:bg-theme-card dark:text-theme-muted'
                                  }`}>
                                  {user.planStatus || 'free'}
                                </span>
                              </td>
                              <td className="p-3.5 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${user.blocked
                                    ? 'bg-theme-danger/5 text-rose-700 dark:bg-rose-950/25 dark:text-rose-455'
                                    : 'bg-theme-accent-light text-theme-accent dark:bg-theme-accent-light/20 dark:text-theme-accent'
                                  }`}>
                                  {user.blocked ? 'Blocked' : 'Active'}
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => handleToggleBlock(user.userId, user.blocked)}
                                  className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer active:scale-95 transition-all ${user.blocked
                                      ? 'bg-theme-accent hover:bg-theme-accent text-white shadow-md shadow-glow'
                                      : 'bg-theme-danger hover:bg-rose-600 text-white shadow-md shadow-rose-500/10'
                                    }`}
                                >
                                  {user.blocked ? 'Unblock' : 'Block'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                </div>
              {adminSubTab === 'requests' && (
                <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-5">
                  <h3 className="text-sm font-extrabold text-theme-primary dark:text-theme-primary dark:text-theme-primary border-b border-theme-border-soft dark:border-theme-border-soft pb-3 flex items-center gap-2">
                    <CircleDollarSign className="w-4.5 h-4.5 text-theme-accent" />
                    <span>Manual Premium Upgrade Requests Queue</span>
                  </h3>

                  {loadingAdminData ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-theme-accent border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-theme-muted font-bold">Querying request logs...</span>
                    </div>
                  ) : adminRequests.length === 0 ? (
                    <div className="py-12 text-center text-xs text-theme-muted dark:text-theme-muted font-bold">
                      No manual premium requests submitted.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {adminRequests.map((req) => (
                        <div
                          key={req.requestId}
                          className="p-5 border border-theme-border-soft dark:border-theme-border-soft rounded-3xl bg-theme-app dark:bg-theme-surface/50 dark:bg-theme-surface/10 hover:shadow-md transition-all space-y-4"
                        >
                          {/* Top Row: User details & status */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-border-soft dark:border-theme-border-soft/60 pb-3">
                            <div>
                              <span className="text-xs font-black text-theme-primary dark:text-theme-primary dark:text-theme-secondary block">{req.userEmail}</span>
                              <span className="text-[9px] text-theme-muted font-bold uppercase tracking-wider">
                                Request ID: {req.requestId} • {new Date(req.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${req.status === 'Approved'
                                  ? 'bg-theme-accent-light text-theme-accent dark:bg-theme-accent-light/20 dark:text-theme-accent'
                                  : req.status === 'Rejected'
                                    ? 'bg-theme-danger/5 text-rose-700 dark:bg-rose-950/25 dark:text-rose-455'
                                    : 'bg-theme-warning/5 text-amber-700 dark:bg-amber-950/25 dark:text-amber-450 animate-pulse'
                                }`}>
                                {req.status}
                              </span>
                            </div>
                          </div>

                          {/* Middle Section: Request specifics */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                            <div>
                              <span className="text-[9px] text-theme-muted uppercase tracking-widest block mb-0.5">Upgrade Plan</span>
                              <span className="text-theme-primary dark:text-theme-primary dark:text-theme-secondary font-black">{req.plan}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-theme-muted uppercase tracking-widest block mb-0.5">Amount Paid</span>
                              <span className="text-theme-accent dark:text-theme-accent font-black">{currency}{req.paidAmount}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-theme-muted uppercase tracking-widest block mb-0.5">Method</span>
                              <span className="text-theme-primary dark:text-theme-primary dark:text-theme-secondary font-bold">{req.paymentMethod}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-theme-muted uppercase tracking-widest block mb-0.5">TXN Reference ID</span>
                              <span className="text-theme-primary dark:text-theme-secondary font-mono font-bold select-all">{req.transactionId}</span>
                            </div>
                          </div>

                          {/* Screenshots & Rejection Reason */}
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-1">
                            {req.screenshotBase64 ? (
                              <div className="flex items-center gap-3">
                                <img
                                  src={req.screenshotBase64}
                                  alt="Thumbnail"
                                  className="w-16 h-16 object-cover rounded-xl border border-theme-border-soft dark:border-theme-border-soft p-1 bg-theme-card dark:bg-theme-card cursor-pointer hover:scale-105 transition-all"
                                  onClick={() => setSelectedScreenshot(req.screenshotBase64)}
                                />
                                <button
                                  type="button"
                                  onClick={() => setSelectedScreenshot(req.screenshotBase64)}
                                  className="text-[10px] text-theme-accent dark:text-theme-accent font-black hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  <span>View Receipt Proof</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-[10px] text-theme-muted font-bold italic py-2">
                                No attachment proof uploaded.
                              </div>
                            {req.status === 'Rejected' && req.rejectionReason && (
                              <div className="text-[10px] text-theme-danger dark:text-rose-450 font-bold bg-theme-danger/5/30 dark:bg-rose-950/10 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/20 max-w-md w-full">
                                <span className="uppercase tracking-widest block text-[8px] text-theme-danger mb-1">Rejection Reason</span>
                                "{req.rejectionReason}"
                              </div>
                            {req.status === 'Pending' && (
                              <div className="flex gap-2 w-full sm:w-auto sm:self-end">
                                <button
                                  onClick={() => handleOpenRejectModal(req.requestId)}
                                  className="flex-1 sm:flex-initial px-4 py-2 border border-rose-250 hover:bg-theme-danger/5 text-rose-700 font-black text-[10px] rounded-xl uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleApproveRequest(req)}
                                  className="flex-1 sm:flex-initial px-4 py-2 bg-theme-accent hover:bg-theme-accent text-white font-black text-[10px] rounded-xl shadow-md shadow-glow uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                                >
                                  Approve
                                </button>
                              </div>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
            </div>

            {/* Side column: Real-Time Stats Overview & Wipes */}
            <div className="space-y-6">

              {/* REAL-TIME SYSTEM STATISTICS CARD */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 border border-theme-border-soft shadow-xl text-white">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-theme-muted">Administration Overview</h3>
                    <span className="text-[9px] text-theme-accent font-bold uppercase tracking-wider block">Workspace scale totals</span>
                  </div>
                  <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${firebaseStatusColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${firebaseStatusDot} ${firebaseStatus === 'connected' ? 'animate-pulse' : ''}`}></span>
                    <FirebaseIcon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-theme-card dark:bg-theme-surface/5 border border-white/5 rounded-xl p-2.5">
                    <FileText className="w-4 h-4 text-theme-accent mx-auto mb-1" />
                    <p className="text-lg font-black text-white">{totalInvoices}</p>
                    <span className="text-[8px] text-theme-muted uppercase font-black block">Invoices</span>
                  </div>
                  <div className="bg-theme-card dark:bg-theme-surface/5 border border-white/5 rounded-xl p-2.5">
                    <Users className="w-4 h-4 text-theme-accent mx-auto mb-1" />
                    <p className="text-lg font-black text-white">{totalCustomers}</p>
                    <span className="text-[8px] text-theme-muted uppercase font-black block">CRM Clients</span>
                  </div>
                  <div className="bg-theme-card dark:bg-theme-surface/5 border border-white/5 rounded-xl p-2.5">
                    <Users className="w-4 h-4 text-theme-accent mx-auto mb-1" />
                    <p className="text-lg font-black text-white">{adminUsers.length}</p>
                    <span className="text-[8px] text-theme-muted uppercase font-black block">Total Users</span>
                  </div>
                  <div className="bg-theme-card dark:bg-theme-surface/5 border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 text-[10px] font-bold mt-1">
                      <span className="text-theme-accent">{adminUsers.filter(u => u.planStatus === 'premium').length}</span>
                      <span className="text-theme-muted">/</span>
                      <span className="text-theme-muted">{adminUsers.filter(u => u.planStatus !== 'premium').length}</span>
                    </div>
                    <span className="text-[7px] text-theme-muted uppercase font-black block mt-0.5">Premium / Free</span>
                  </div>
                  <div className="bg-theme-card dark:bg-theme-surface/5 border border-white/5 rounded-xl p-2.5 md:col-span-2">
                    <span className="text-[8px] text-theme-muted uppercase font-black block">Outstanding Dues</span>
                    <p className="text-base font-black text-amber-300 mt-0.5">{currency}{pendingPayments.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={handleForceSync}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-theme-card dark:bg-theme-card/10 hover:bg-theme-card dark:bg-theme-card/20 text-white font-extrabold text-[10px] rounded-xl transition-all cursor-pointer border border-white/5"
                  >
                    <CloudLightning className="w-3.5 h-3.5 text-theme-accent" />
                    <span>Sync Platform Cloud Data</span>
                  </button>
                </div>
              </div>

              {/* DATABASE PROVIDER SETTING */}
              <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-5 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-3.5">
                <h3 className="text-xs font-black text-theme-primary dark:text-theme-secondary border-b border-theme-border-soft dark:border-theme-border-soft/50 pb-3 flex items-center gap-2 uppercase tracking-wide">
                  <Database className="w-4.5 h-4.5 text-theme-accent" />
                  <span>Database Provider</span>
                </h3>
                <div className="space-y-2">
                  <div className="flex gap-2 mb-2">
                    {['firebase'].map(provider => (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => handleSetDbProvider(provider)}
                        className={`flex-1 py-1.5 px-2 text-[10px] font-black uppercase rounded-lg border transition-all ${dbProvider === provider ? 'bg-theme-accent text-white border-theme-accent shadow-md cursor-default' : 'bg-transparent text-theme-muted border-theme-border-soft hover:bg-theme-app dark:hover:bg-theme-card cursor-pointer'}`}
                      >
                        {provider === 'dual' ? 'Dual Sync' : provider}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] p-2.5 rounded-xl border font-bold text-center bg-theme-surface border-theme-border-soft text-theme-muted dark:bg-theme-card/50 dark:border-theme-border-soft dark:text-theme-muted">
                    {dbProvider === 'firebase' ? 'Firebase Active' : dbProvider === 'supabase' ? 'Supabase Ready (Experimental - writes not ready)' : 'Dual Sync Not Enabled Yet'}
                  </div>
                </div>
              </div>

              {/* DANGER ZONE GRANULAR WIPES */}
              <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-5 border border-rose-100 dark:border-rose-950/20 shadow-premium space-y-3.5">
                <h3 className="text-xs font-black text-theme-danger dark:text-rose-455 border-b border-rose-50 dark:border-rose-950/20 pb-3 flex items-center gap-2 uppercase tracking-wide">
                  <Trash2 className="w-4.5 h-4.5 text-theme-danger" />
                  <span>Granular Data Wipes</span>
                </h3>
                <div className="space-y-2">
                  {['Invoices', 'Customers', 'Products', 'Expenses'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleGranularWipe(type)}
                      className="w-full flex items-center justify-between px-3.5 py-2 border border-rose-100 dark:border-rose-900/20 bg-theme-danger/5/20 dark:bg-rose-950/10 hover:bg-theme-danger/5 dark:hover:bg-rose-950/20 text-rose-700 dark:text-theme-danger font-extrabold text-[10px] rounded-xl transition-all cursor-pointer"
                    >
                      <span>Clear All {type}</span>
                      <Trash2 className="w-3 h-3 opacity-60" />
                    </button>
                  ))}

                  <div className="pt-3 mt-3 border-t border-rose-100 dark:border-rose-900/30">
                    <button
                      type="button"
                      onClick={handleResetData}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Factory Reset Demo Data</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      {/* Lightbox for screenshots */}
      {selectedScreenshot && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="relative max-w-3xl max-h-[85vh] w-full flex flex-col items-center bg-theme-card rounded-3xl p-4 overflow-hidden border border-theme-border-soft">
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-4 right-4 bg-theme-card/80 hover:bg-theme-surface text-white font-bold p-2.5 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              ✕
            </button>
            <div className="flex-1 overflow-auto flex items-center justify-center p-2">
              <img
                src={selectedScreenshot}
                alt="Payment Proof Receipt"
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
            <p className="text-theme-muted text-xs font-semibold mt-4 tracking-wide">Click close or press ✕ to exit preview</p>
          </div>
        </div>
      {/* Rejection Reason Modal */}
      {showRejectionModalFor && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 max-w-md w-full border border-theme-border-soft dark:border-theme-border-soft shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-theme-danger dark:text-rose-455 uppercase tracking-widest">Reject Upgrade Request</h3>
            <p className="text-xs text-theme-primary dark:text-theme-muted font-semibold leading-relaxed">
              Please specify the exact reason for rejecting this upgrade request. This reason will be stored in the request log for user visibility.
            </p>
            <textarea
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. Transaction ID could not be verified on bank records..."
              className="w-full text-xs p-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-theme-primary dark:text-theme-primary dark:text-theme-primary"
              rows={3}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectionModalFor(null)}
                className="px-4 py-2 border border-theme-border-soft dark:border-theme-border-soft text-theme-primary dark:text-theme-muted hover:bg-theme-app dark:bg-theme-surface dark:hover:bg-theme-surface text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectRequest}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
    </div>
      </div>
    </>
  );
};

export default AdminConsoleTab;