import React, { useState, useEffect } from 'react';
import { isAdminUser } from './utils/adminAccess';
import { Toaster, toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import Layout from './components/Layout';
import PostLoginWelcome from './components/PostLoginWelcome';
import {
  getAuthSession,
  logout,
  getInvoices,
  saveInvoice,
  deleteInvoice,
  getCustomers,
  saveCustomer,
  deleteCustomer,
  getProducts,
  saveProduct,
  deleteProduct,
  getSettings,
  saveSettings,
  resetToDemoData,
  initializeStorage,
  getSubscriptionStatus,
  saveSubscriptionStatus,
  getExpenses,
  saveExpense,
  deleteExpense,
  importRestore,
  syncFromFirestore,
  enableRealTimeSync,
  getGlobalAdminSettings
} from './utils/storage';
import { downloadInvoicePDF } from './utils/pdfUtils';
import { auth, firebaseReady } from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { triggerSuccessFeedback } from './utils/feedback';

const Login = React.lazy(() => import('./pages/Login'));
const SetupBilling = React.lazy(() => import('./pages/SetupBilling'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Invoices = React.lazy(() => import('./pages/Invoices'));
const CreateInvoice = React.lazy(() => import('./pages/CreateInvoice'));
const Guide = React.lazy(() => import('./pages/Guide'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Products = React.lazy(() => import('./pages/Products'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Subscription = React.lazy(() => import('./pages/Subscription'));
const MoreMenu = React.lazy(() => import('./pages/MoreMenu'));
const PublicInvoice = React.lazy(() => import('./pages/PublicInvoice'));
import QuickBillModal from './components/QuickBillModal';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    
    // Automatically reload on Vite dynamic import failure (new deployment pushed)
    if (error && error.message && error.message.includes('Failed to fetch dynamically imported module')) {
      if (!sessionStorage.getItem('billqyro_chunk_failed_reload')) {
        sessionStorage.setItem('billqyro_chunk_failed_reload', 'true');
        window.location.reload();
        return;
      }
    }
    
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b', minHeight: '100vh', fontFamily: 'system-ui' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Something went wrong.</h1>
          <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Error: {this.state.error?.toString()}</p>
          <pre style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fecaca', overflowX: 'auto', fontSize: '12px' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#dc2626', color: 'white', borderRadius: '5px', cursor: 'pointer' }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}



function App() {

  // --- STATE SYSTEM (must be declared before any useEffect that references them) ---
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(getAuthSession() !== null);
  const [currentTab, setCurrentTab] = useState(() => {
    const saved = localStorage.getItem('billqyro_last_route');
    if (saved) {
      const adminRoutes = ['settings', 'more']; // routes requiring admin unlock or just checking role isn't enough, wait
      // Actually settings is accessible to regular users sometimes? No, settings is for everyone, but some tabs in settings might be admin.
      // But wait, the admin route in previous conversation was `more` or `settings`? Let's just restore `saved`.
      return saved;
    }
    return 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('billqyro_last_route', currentTab);
  }, [currentTab]);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('billqyro_user_role') || 'user');

  // Capacitor Android Back Button Handler
  useEffect(() => {
    import('@capacitor/app').then(({ App: CapApp }) => {
      CapApp.removeAllListeners('backButton');
      CapApp.addListener('backButton', () => {
        setCurrentTab((prevTab) => {
          if (prevTab !== 'dashboard') {
            return 'dashboard';
          } else {
            CapApp.exitApp();
            return prevTab;
          }
        });
      });
    }).catch(() => { /* not in capacitor env */ });
  }, []);


  // Boot Interceptor for Public Invoice
  const [publicInvoice, setPublicInvoice] = useState(null);
  const [loadingPublicInvoice, setLoadingPublicInvoice] = useState(false);
  const [publicToken, setPublicToken] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    const publicTokenMatch = path.match(/^\/i\/([a-zA-Z0-9_-]+)/);
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromQuery = urlParams.get('i');
    const token = (publicTokenMatch ? publicTokenMatch[1] : null) || tokenFromQuery;

    if (token) {
      setPublicToken(token);
      setLoadingPublicInvoice(true);
      import('./utils/storage').then(({ getInvoiceByPublicToken }) => {
        getInvoiceByPublicToken(token).then((inv) => {
          setPublicInvoice(inv);
          setLoadingPublicInvoice(false);
        });
      });
    }
  }, []);

  // Storage states
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(() => getSettings());
  const [expenses, setExpenses] = useState([]);
  const [subscription, setSubscription] = useState(() => getSubscriptionStatus());

  
  // Async Data Loader for IndexedDB
  useEffect(() => {
    const loadLocalData = async () => {
      setInvoices(await getInvoices());
      setCustomers(await getCustomers());
      setProducts(await getProducts());
      setExpenses(await getExpenses());
    };
    loadLocalData();
  }, []);

  // Workspace Contexts
  const [editingInvoice, setEditingInvoice] = useState(null);

  // PWA Installer States
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isQuickBillOpen, setIsQuickBillOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      console.log('beforeinstallprompt event stashed successfully');
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
      setIsAppInstalled(true);
      toast.success('🎉 BillQyro App installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    console.log(`User installation choice: ${outcome}`);
    setInstallPromptEvent(null);
  };

  // --- EFFECTS ---

  // Initialize Database on App mount
  useEffect(() => {
    initializeStorage();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    if (firebaseReady && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          // Check if we already have a session, if not create one
          const session = getAuthSession();
          if (!session) {
            // Re-create the session in localStorage so the app works seamlessly
            const email = user.email || '';
            const settings = getSettings() || {};

            const newSession = {
              timestamp: Date.now(),
              token: 'billqyro-secure-session',
              userEmail: email,
              uid: user.uid
            };

            localStorage.setItem('billqyro_auth', JSON.stringify(newSession));

            setIsAuthenticated(true);
            setUserRole(localStorage.getItem('billqyro_user_role') || 'user');
          } else if (session.uid !== user.uid) {
            // Upgrade existing session with UID
            session.uid = user.uid;
            localStorage.setItem('billqyro_auth', JSON.stringify(session));
            
            // Re-sync with correct UID
            import('./utils/storage').then(({ syncFromFirestore }) => {
              syncFromFirestore().then((synced) => {
                if (synced) {
                  setInvoices(synced.invoices || []);
                  setCustomers(synced.customers || []);
                  setProducts(synced.products || []);
                  if (synced.settings) setSettings(synced.settings);
                  setExpenses(synced.expenses || []);
                  if (synced.subscription) setSubscription(synced.subscription);
                }
              });
            });
          }
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Sync from Firebase Firestore when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const runSync = async () => {
        try {
          const synced = await syncFromFirestore();
          if (synced) {
            setInvoices(synced.invoices || []);
            setCustomers(synced.customers || []);
            setProducts(synced.products || []);
            if (synced.settings) setSettings(synced.settings);
            setExpenses(synced.expenses || []);
            if (synced.subscription) setSubscription(synced.subscription);
          }
          
          // Fetch global admin settings for defaults
          try {
            const adminGlobal = await getGlobalAdminSettings();
            if (adminGlobal) {
              if (adminGlobal.defaultTheme) localStorage.setItem('billqyro_admin_default_theme', adminGlobal.defaultTheme);
              if (adminGlobal.defaultMode) localStorage.setItem('billqyro_admin_default_mode', adminGlobal.defaultMode);
            }
          } catch (e) { console.warn('Could not fetch admin settings on boot.'); }

          // Enable real-time multi-device sync
          enableRealTimeSync();
        } catch (e) {
          console.warn('Could not sync Firestore on startup. Falling back to LocalStorage.', e);
        }
      };
      runSync();
    }
  }, [isAuthenticated]);

  // Listen for Real-Time cloud updates triggered by storage.js
  useEffect(() => {
    const handleSync = async () => {
      setInvoices(await getInvoices());
      setCustomers(await getCustomers());
      setProducts(await getProducts());
      setSettings(getSettings());
      setExpenses(await getExpenses());
      setSubscription(getSubscriptionStatus());
    };

    window.addEventListener('billqyro_sync', handleSync);
    return () => window.removeEventListener('billqyro_sync', handleSync);
  }, []);

  // --- AUTH BRIDGE ---
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowWelcomeAnimation(true);
    setUserRole(localStorage.getItem('billqyro_user_role') || 'user');

    getInvoices().then(setInvoices);
    getCustomers().then(setCustomers);
    getProducts().then(setProducts);
    const currentSettings = getSettings() || {};
    setSettings(currentSettings);
    getExpenses().then(setExpenses);
    setSubscription(getSubscriptionStatus());

    // Setup & Onboarding Routing
    const hasSeenGuide = localStorage.getItem('billqyro_seen_guide');
    const isLegacyConfigured = !!(currentSettings.businessName && currentSettings.businessName.trim());

    if (currentSettings.setupCompleted) {
      if (!hasSeenGuide) {
        localStorage.setItem('billqyro_seen_guide', 'true');
        setCurrentTab('guide');
      } else {
        setCurrentTab('dashboard');
      }
    } else if (isLegacyConfigured) {
      // Legacy user already has settings, silently mark setupCompleted: true to not block them
      const updated = { ...currentSettings, setupCompleted: true };
      saveSettings(updated);
      setSettings(updated);
      if (!hasSeenGuide) {
        localStorage.setItem('billqyro_seen_guide', 'true');
        setCurrentTab('guide');
      } else {
        setCurrentTab('dashboard');
      }
    } else {
      setCurrentTab('setup-billing');
    }
  };

  // Onboarding Interceptor for Authenticated Session Boot
  useEffect(() => {
    if (isAuthenticated && settings) {
      const isLegacyConfigured = !!(settings.businessName && settings.businessName.trim());
      if (!settings.setupCompleted) {
        if (isLegacyConfigured) {
          const updated = { ...settings, setupCompleted: true };
          saveSettings(updated);
          setSettings(updated);
        } else {
          setCurrentTab('setup-billing');
        }
      }
    }
  }, [isAuthenticated, settings]);

  const handleLogout = async () => {
    try {
      if (firebaseReady && auth) {
        await auth.signOut();
      }
    } catch (err) {
      console.error('Firebase sign out error', err);
    }
    logout();
    localStorage.removeItem('billqyro_user_role');
    localStorage.removeItem('billqyro_admin_unlocked');
    setUserRole('user');
    setIsAuthenticated(false);
    setCurrentTab('dashboard');
  };

  // --- DATA SYNCHRONIZERS ---

  // Invoices
  const handleSaveInvoice = async (payload, saveCustomerAsNew = false) => {
    const isNew = !payload.id || !invoices.some(inv => inv.id === payload.id);
    const freeLimit = settings?.freeInvoiceLimit !== undefined ? settings.freeInvoiceLimit : 15;
    if (isNew && subscription.status !== 'premium' && invoices.length >= freeLimit) {
      toast.error(`Free tier limit reached: You can create a maximum of ${freeLimit} invoices. Please upgrade to the Premium Plan to unlock unlimited invoicing!`, { duration: 5050 });
      setCurrentTab('subscription');
      return;
    }
    let unlinkedItems = false;
    let lowStockWarning = false;

    let productsUpdated = false;
    const currentProducts = [...products];

    // 1. If editing an existing invoice, reverse previous stock deduction
    const oldInvoice = payload.id ? invoices.find(inv => inv.id === payload.id) : null;
    if (oldInvoice && oldInvoice.items) {
      for (const oldItem of oldInvoice.items) {
        const itemName = (oldItem.description || oldItem.productName || oldItem.serviceName || oldItem.itemService || '').trim().toLowerCase();
        if (!itemName) continue;

        const matchedProduct = currentProducts.find(p => p.name.trim().toLowerCase() === itemName);
        if (matchedProduct && matchedProduct.stockQty !== undefined) {
          const oldQty = parseFloat(oldItem.qty) || 1;
          matchedProduct.stockQty += oldQty;
          productsUpdated = true;
        }
      }
    }

    // 2. Apply new stock deduction
    for (const item of payload.items) {
      const itemName = (item.description || item.productName || item.serviceName || item.itemService || '').trim().toLowerCase();
      if (!itemName) continue;

      const matchedProduct = currentProducts.find(p => p.name.trim().toLowerCase() === itemName);
      
      if (matchedProduct) {
        const requestedQty = parseFloat(item.qty) || 1;
        const currentStock = matchedProduct.stockQty !== undefined ? matchedProduct.stockQty : 0;
        if (currentStock < requestedQty) {
          lowStockWarning = true;
          matchedProduct.stockQty = 0; // Prevent going below 0 without confirmation
        } else {
          matchedProduct.stockQty = currentStock - requestedQty;
        }
        productsUpdated = true;
      } else {
        unlinkedItems = true;
      }
    }

    if (productsUpdated) {
      for (const p of currentProducts) {
        await saveProduct(p);
      }
      setProducts(currentProducts);
    }

    const { updatedInvoices, firebaseStatus } = await saveInvoice(payload);
    setInvoices(updatedInvoices);

    if (saveCustomerAsNew && payload.customerName) {
      const newCustomer = {
        id: 'cust-' + Date.now(),
        name: payload.customerName,
        phone: payload.customerPhone || '',
        email: payload.customerEmail || '',
        address: payload.customerAddress || ''
      };
      const updatedCustomers = await saveCustomer(newCustomer);
      setCustomers(updatedCustomers);
    }

    if (firebaseStatus === 'failed') {
      toast.success('Invoice created successfully. (Saved locally. Firebase sync pending.)');
    } else {
      toast.success('Invoice created successfully');
    }

    // Trigger haptic & audio feedback
    triggerSuccessFeedback();

    if (unlinkedItems) {
      toast.custom(
        (t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-amber-50 dark:bg-amber-950/40 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-amber-500/30`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <span className="text-xl">⚠️</span>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Some bill items are not linked to products, so inventory stock was not updated.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-amber-500/20">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  setCurrentTab('products');
                }}
                className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 focus:outline-none transition-colors"
              >
                Link Products
              </button>
            </div>
          </div>
        ),
        { duration: 6000 }
      );
    } else if (productsUpdated) {
      toast.success('Inventory stock updated successfully.', { duration: 4000 });
    }

    if (lowStockWarning) {
      toast.error('Low stock or insufficient stock for some products.', { duration: 4000 });
    }

    setEditingInvoice(null);
    setCurrentTab('invoices');
  };

  const handleDeleteInvoice = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action is permanent.')) {
      const { updatedInvoices, firebaseStatus } = await deleteInvoice(id);
      setInvoices(updatedInvoices);
      if (firebaseStatus === 'failed') {
        toast.success('Invoice deleted locally. Will sync with cloud when online.');
      } else {
        toast.success('Invoice deleted successfully');
      }
    }
  };

  // Customers
  const handleSaveCustomer = async (payload) => {
    try {
      const { updatedCustomers, firebaseStatus } = await saveCustomer(payload);
      setCustomers(updatedCustomers);
      if (firebaseStatus === 'failed') {
        toast.success('Customer saved locally. Will sync with cloud when online.');
      } else {
        toast.success('Customer saved successfully');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save customer');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      const { updatedCustomers, firebaseStatus } = await deleteCustomer(id);
      setCustomers(updatedCustomers);
      if (firebaseStatus === 'failed') {
        toast.success('Customer deleted locally. Will sync with cloud when online.');
      } else {
        toast.success('Customer deleted');
      }
    }
  };

  // Products
  const handleSaveProduct = async (payload) => {
    try {
      const { updatedProducts, firebaseStatus } = await saveProduct(payload);
      setProducts(updatedProducts);
      if (firebaseStatus === 'failed') {
        toast.success('Product/Service saved locally. Will sync with cloud when online.');
      } else {
        toast.success('Product/Service saved successfully');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id) => {
    const { updatedProducts, firebaseStatus } = await deleteProduct(id);
    setProducts(updatedProducts);
    if (firebaseStatus === 'failed') {
      toast.success('Product deleted locally. Will sync with cloud when online.', { id: 'delete-product-toast' });
    }
  };

  // Expenses
  const handleSaveExpense = async (payload) => {
    try {
      const { updatedExpenses, firebaseStatus } = await saveExpense(payload);
      setExpenses(updatedExpenses);
      if (firebaseStatus === 'failed') {
        toast.success('Expense saved locally. Will sync with cloud when online.');
      } else {
        toast.success('Expense saved successfully');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    const { updatedExpenses, firebaseStatus } = await deleteExpense(id);
    setExpenses(updatedExpenses);
    if (firebaseStatus === 'failed') {
      toast.success('Expense deleted locally. Will sync with cloud when online.', { id: 'delete-expense-toast' });
    }
  };

  // Subscription
  const handleSaveSubscription = (status) => {
    const updated = saveSubscriptionStatus(status);
    setSubscription(updated);
  };

  // Settings
  const handleSaveSettings = async (payload) => {
    try {
      const updatedSettings = await saveSettings(payload);
      setSettings(updatedSettings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save settings');
    }
  };

  // Reset System Data
  const handleResetDemo = () => {
    const freshData = resetToDemoData();
    setSettings(freshData.settings);
    setCustomers(freshData.customers);
    setProducts(freshData.products);
    setInvoices(freshData.invoices);
    setExpenses(freshData.expenses);
    setSubscription(freshData.subscription);
    toast.success('Demo data has been reset!');
    setCurrentTab('dashboard');
  };

  // Import Backup Data and Sync React States
  const handleImportBackup = (parsedData) => {
    importRestore(parsedData);
    setSettings(parsedData.settings);
    setCustomers(parsedData.customers);
    setProducts(parsedData.products);
    setInvoices(parsedData.invoices);
    setExpenses(parsedData.expenses);
    setSubscription(parsedData.subscription);
    setCurrentTab('dashboard');
  };

  // --- PDF GENERATOR WORKER ---
  const handleDownloadPDF = (invoice) => {
    if (!settings || !settings.businessName) {
      alert('⚠️ Business settings are incomplete. Please complete your business settings first.');
      setCurrentTab('settings');
      return;
    }
    const isPremium = subscription.status === 'premium';
    downloadInvoicePDF(invoice, settings, isPremium)
      .then((ok) => {
        if (ok) {
          console.log(`Successfully generated vector PDF for ${invoice.invoiceNumber}`);
        }
      });
  };

  // --- TAB ROUTER SWITCHBOARD ---
  const renderTabContent = () => {
    if (currentTab === 'setup-billing') {
      return (
        <SetupBilling
          businessSettings={settings}
          onSaveSettings={(newSettings) => {
            saveSettings(newSettings);
            setSettings(newSettings);
          }}
          setCurrentTab={setCurrentTab}
        />
      );
    }
    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard
            invoices={invoices}
            customers={customers}
            products={products}
            onViewInvoice={(inv) => {
              setEditingInvoice(inv);
              setCurrentTab('invoices');
            }}
            onEditInvoice={(inv) => {
              setEditingInvoice(inv);
              setCurrentTab('create-invoice');
            }}
            onDeleteInvoice={handleDeleteInvoice}
            onDownloadPDF={handleDownloadPDF}
            setCurrentTab={setCurrentTab}
            businessSettings={settings}
            installPromptEvent={installPromptEvent}
            isAppInstalled={isAppInstalled}
            onInstallApp={handleInstallApp}
            subscription={subscription}
            onQuickBillOpen={() => setIsQuickBillOpen(true)}
          />
        );
      case 'invoices':
        return (
          <Invoices
            invoices={invoices}
            editingInvoice={editingInvoice}
            onEditInvoice={setEditingInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onDownloadPDF={handleDownloadPDF}
            setCurrentTab={setCurrentTab}
            businessSettings={settings}
          />
        );
      case 'create-invoice':
        return (
          <CreateInvoice
            invoices={invoices}
            customers={customers}
            products={products}
            businessSettings={settings}
            onSaveInvoice={handleSaveInvoice}
            setCurrentTab={setCurrentTab}
            editingInvoice={editingInvoice}
            onDownloadPDF={handleDownloadPDF}
            onQuickBillOpen={() => setIsQuickBillOpen(true)}
          />
        );
      case 'guide':
        return (
          <Guide setCurrentTab={setCurrentTab} />
        );
      case 'customers':
        return (
          <Customers
            customers={customers}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        );
      case 'products':
        return (
          <Products
            products={products}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            businessSettings={settings}
          />
        );
      case 'expenses':
        return (
          <Expenses
            expenses={expenses}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
            businessSettings={settings}
          />
        );
      case 'subscription':
        return (
          <Subscription
            currentSubscription={subscription}
            onUpgrade={handleSaveSubscription}
            businessSettings={settings}
          />
        );
      case 'more':
        return (
          <MoreMenu
            setCurrentTab={setCurrentTab}
            isAuthenticated={isAuthenticated}
            onLoginSuccess={handleLoginSuccess}
            businessSettings={settings}
            userRole={userRole}
          />
        );
      case 'settings': {
        const session = getAuthSession();
        return (
          <Settings
            settings={settings}
            onSaveSettings={handleSaveSettings}
            isAdmin={isAdminUser(session)}
            onResetDemo={handleResetDemo}
            onImportBackup={handleImportBackup}
            invoices={invoices}
            customers={customers}
            installPromptEvent={installPromptEvent}
            isAppInstalled={isAppInstalled}
            onInstallApp={handleInstallApp}
          />
        );
      }
      default:
        return <div className="text-center font-bold text-theme-muted p-10">404 Tab Not Found</div>;
    }
  };

  // Intercept for Public Invoice Loading/Display (No Auth Route Interceptor)
  if (loadingPublicInvoice) {
    return (
      <div className="min-h-screen bg-theme-main flex flex-col items-center justify-center p-6 text-center text-white font-sans">
        <span className="w-10 h-10 border-4 border-theme-accent border-t-transparent rounded-full animate-spin"></span>
        <p className="text-theme-muted text-xs font-bold uppercase mt-4 tracking-widest animate-pulse">Loading secure digital invoice...</p>
      </div>
    );
  }

  if (publicToken) {
    return (
      <React.Suspense fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="w-10 h-10 border-4 border-theme-border-soft border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      }>
        <PublicInvoice initialInvoice={publicInvoice} />
      </React.Suspense>
    );
  }

  // Show onboarding/login if not authenticated
  if (!isAuthenticated) {
    return (
      <React.Suspense fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="w-10 h-10 border-4 border-theme-border-soft border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      }>
        <Login onLoginSuccess={handleLoginSuccess} />
      </React.Suspense>
    );
  }

  // --- Account Blocked Interceptor ---
  if (settings?.blocked === true) {
    const session = getAuthSession();
    if (!isAdminUser(session)) {
      return (
        <div className="min-h-screen bg-theme-main flex flex-col items-center justify-center p-6 text-center font-sans text-white">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md bg-theme-card p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6"
          >
            <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Account Deactivated</h1>
            <p className="text-theme-muted text-xs font-semibold leading-relaxed">
              Your BillQyro workspace has been temporarily blocked by the platform administrator due to policy guidelines or outstanding billing concerns.
            </p>
            <div className="p-4 bg-slate-850/50 rounded-2xl border border-slate-800/80 text-left space-y-2">
              <span className="text-[10px] text-theme-muted uppercase font-black block tracking-widest">Administrator Notice</span>
              <p className="text-[11px] text-theme-muted font-semibold leading-relaxed">
                If you believe this is an error or wish to request immediate reactivation, please contact support at <strong className="text-theme-accent select-all">{settings.email || 'support@billqyro.com'}</strong> or email your account manager directly.
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                setIsAuthenticated(false);
              }}
              className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl shadow-lg active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider"
            >
              Sign Out of Account
            </button>
          </motion.div>
        </div>
      );
    }
  }

  // --- Maintenance Mode Check ---
  if (settings?.maintenanceMode) {
    const session = getAuthSession();
    if (!isAdminUser(session)) {
      return (
        <div className="min-h-screen bg-theme-card flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl"
          >
            <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white mb-3">App Under Maintenance</h1>
            <p className="text-theme-muted font-medium leading-relaxed mb-8">
              We are currently performing scheduled maintenance to bring you a better experience. Please check back later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-theme-accent hover:opacity-90 text-white font-bold rounded-xl transition-colors"
            >
              Refresh Page
            </button>

            <button
              onClick={() => {
                logout();
                setIsAuthenticated(false);
              }}
              className="block w-full mt-4 text-xs font-bold text-theme-muted hover:text-theme-muted"
            >
              Sign out
            </button>
          </motion.div>
        </div>
      );
    }
  }

  return (
    <ErrorBoundary>
      <PostLoginWelcome 
        show={showWelcomeAnimation} 
        userName={settings?.businessName || ''} 
        onComplete={() => setShowWelcomeAnimation(false)} 
      />
      <Layout
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab !== 'create-invoice') {
            setEditingInvoice(null);
          }
          setCurrentTab(tab);
        }}
        onLogout={handleLogout}
        businessSettings={settings}
        isAuthenticated={isAuthenticated}
        userRole={userRole}
        invoices={invoices}
        subscription={subscription}
        userEmail={getAuthSession()?.email}
        onQuickBillOpen={() => setIsQuickBillOpen(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full h-full"
          >
            <React.Suspense fallback={
              <div className="flex h-64 items-center justify-center">
                <div className="w-10 h-10 border-4 border-theme-border-soft border-t-theme-accent rounded-full animate-spin"></div>
              </div>
            }>
              {renderTabContent()}
            </React.Suspense>
          </motion.div>
        </AnimatePresence>
        
        <QuickBillModal 
          isOpen={isQuickBillOpen}
          onClose={() => setIsQuickBillOpen(false)}
          onSave={handleSaveInvoice}
          businessSettings={settings}
          invoices={invoices}
        />
      </Layout>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'text-sm font-bold',
          style: { borderRadius: '12px', background: '#fff', color: '#1e293b' }
        }}
      />
    </ErrorBoundary>
  );
}

export default App;
