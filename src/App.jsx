import React, { useState, useEffect } from 'react';
import { isAdminUser } from './utils/adminAccess';
import { toast, Toaster } from 'react-hot-toast';
import { useThemeEngine } from './hooks/useThemeEngine';
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
} from './services/dbEngine';
import { downloadInvoicePDF } from './utils/pdfUtils';
import { auth, firebaseReady } from './services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { triggerSuccessFeedback } from './utils/feedback';
import { sendEmpireEvent, sendEmpireError, sendEmpireHealth } from './services/empireAgent';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './services/firebaseConfig';

const Landing = React.lazy(() => import('./pages/Landing'));
const Login = React.lazy(() => import('./pages/Login'));
const OnboardingWizard = React.lazy(() => import('./pages/onboarding/OnboardingWizard'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Invoices = React.lazy(() => import('./pages/Invoices'));
const Estimates = React.lazy(() => import('./pages/Estimates'));
const PdfTemplateStudio = React.lazy(() => import('./pages/PdfTemplateStudio'));
const LiveLinkTemplateStudio = React.lazy(() => import('./pages/LiveLinkTemplateStudio'));
const CreateInvoice = React.lazy(() => import('./pages/CreateInvoice'));
const HelpCenter = React.lazy(() => import('./pages/HelpCenter'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Products = React.lazy(() => import('./pages/Products'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Subscription = React.lazy(() => import('./pages/Subscription'));
const MoreMenu = React.lazy(() => import('./pages/MoreMenu'));
const PublicInvoice = React.lazy(() => import('./pages/PublicInvoice'));
const PendingPayments = React.lazy(() => import('./pages/PendingPayments'));
const DueLedger = React.lazy(() => import('./pages/DueLedger'));
const TemplateMarketplace = React.lazy(() => import('./pages/TemplateMarketplace'));
const BackupRestore = React.lazy(() => import('./pages/BackupRestore'));
const Reports = React.lazy(() => import('./pages/Reports'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const RefundPolicy = React.lazy(() => import('./pages/RefundPolicy'));
const DataDeletion = React.lazy(() => import('./pages/DataDeletion'));
const Support = React.lazy(() => import('./pages/Support'));
const SystemHealth = React.lazy(() => import('./pages/SystemHealth'));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs'));
const WorkspaceManager = React.lazy(() => import('./pages/WorkspaceManager'));
const Appointments = React.lazy(() => import('./pages/Appointments'));
const Orders = React.lazy(() => import('./pages/Orders'));
const Patients = React.lazy(() => import('./pages/business/Patients'));
const Students = React.lazy(() => import('./pages/business/Students'));
const Clients = React.lazy(() => import('./pages/business/Clients'));
const Measurements = React.lazy(() => import('./pages/business/Measurements'));
const DesignBook = React.lazy(() => import('./pages/business/DesignBook'));
const Devices = React.lazy(() => import('./pages/business/Devices'));
const ServiceJobs = React.lazy(() => import('./pages/business/ServiceJobs'));
const Projects = React.lazy(() => import('./pages/business/Projects'));
const Delivery = React.lazy(() => import('./pages/business/Delivery'));
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
    
    sendEmpireError({
      errorType: "app_crash",
      message: error?.toString() || "Unknown error",
      severity: "Critical",
      page: window.location.pathname
    });

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
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAuthSession());
  const [syncStatus, setSyncStatus] = useState('Synced');
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
    sendEmpireEvent({
      eventType: "page_view",
      message: `Navigated to ${currentTab}`,
      page: currentTab
    });
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
    const publicTokenMatch = path.match(/^\/invoice\/([a-zA-Z0-9_-]+)/);
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromQuery = urlParams.get('uuid') || urlParams.get('i');
    const token = (publicTokenMatch ? publicTokenMatch[1] : null) || tokenFromQuery;

    if (token) {
      setPublicToken(token);
      setLoadingPublicInvoice(true);
      import('./services/dbEngine').then(({ getInvoiceByPublicToken }) => {
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
  // Settings with workspace support
  const [settings, setSettings] = useState(() => {
    const s = getSettings() || {};
    if (!s.businessWorkspaces) {
      // Initialize default workspace
      const defaultWs = {
        id: 'ws_default_001',
        name: 'Default Workspace',
        type: 'default',
        enabledModules: ['billing', 'customers', 'products', 'dueLedger', 'reports'],
      };
      s.businessWorkspaces = [defaultWs];
      s.activeWorkspaceId = defaultWs.id;
    } else if (!s.activeWorkspaceId && s.businessWorkspaces.length) {
      s.activeWorkspaceId = s.businessWorkspaces[0].id;
    }
    // Persist defaults if newly added
    saveSettings(s);
    return s;
  });
  const [expenses, setExpenses] = useState([]);
  const [subscription, setSubscription] = useState(() => getSubscriptionStatus());
  // Workspace state
  const [businessWorkspaces, setBusinessWorkspaces] = useState(settings.businessWorkspaces || []);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(settings.activeWorkspaceId || (settings.businessWorkspaces && settings.businessWorkspaces[0]?.id));

  // Update settings when workspaces change
  useEffect(() => {
    const updated = { ...settings, businessWorkspaces, activeWorkspaceId };
    saveSettings(updated);
    // Notify other components
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
  }, [businessWorkspaces, activeWorkspaceId]);

  const setActiveWorkspace = (id) => {
    setActiveWorkspaceId(id);
  };

  // Real-time Pending Payments state
  const [pendingPayments, setPendingPayments] = useState([]);
  
  useEffect(() => {
    if (!isAuthenticated || !db || !auth) return;
    
    let unsubscribe = () => {};
    
    // Listen for auth state changes to get current user UID
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(
          collection(db, 'payment_proofs'),
          where('ownerId', '==', user.uid),
          where('status', '==', 'pending')
        );
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const proofs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPendingPayments(proofs);
        });
      } else {
        setPendingPayments([]);
      }
    });
    
    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, [isAuthenticated]);
  
  // --- 🚀 GLOBAL BOOT & LOADING STATE ---
  const [isAppBooting, setIsAppBooting] = useState(true);

  // Safety timeout to ensure app never gets stuck on boot screen
  useEffect(() => {
    if (isAppBooting) {
      const timeout = setTimeout(() => {
        console.warn('[BOOT TIMEOUT] 7 seconds reached, forcing app load.');
        setIsAppBooting(false);
      }, 7000);
      return () => clearTimeout(timeout);
    }
  }, [isAppBooting]);

  // Async Data Loader & Boot Sequence
  useEffect(() => {
    const loadLocalData = async () => {
      sendEmpireEvent({ eventType: "app_opened", message: "BillQyro Web App Opened", page: "init" });
      sendEmpireHealth({ status: "Healthy", healthScore: 100, note: "App initialized successfully" });
      
      try {
        setInvoices(await getInvoices() || []);
        setCustomers(await getCustomers() || []);
        setProducts(await getProducts() || []);
        setExpenses(await getExpenses() || []);
      } catch (err) {
        console.error("Error loading local data:", err);
      }
      // Removing the arbitrary setTimeout that forces isAppBooting(false).
      // We will let onAuthStateChanged and syncFromFirestore handle it cleanly.
    };
    loadLocalData();

    const handleSync = async () => {
      try {
        setInvoices(await getInvoices() || []);
        setCustomers(await getCustomers() || []);
        setProducts(await getProducts() || []);
        setExpenses(await getExpenses() || []);
        const latestSettings = getSettings();
        if (latestSettings) setSettings(latestSettings);
      } catch (err) {
        console.error("Error reloading data on sync:", err);
      }
    };
    window.addEventListener('billqyro_sync', handleSync);
    
    // --- Pro Sync Engine Event Bus ---
    const handleSettingsUpdated = (e) => {
      if (e.detail) setSettings(e.detail);
    };
    const handleDataUpdated = async (e) => {
      const col = e.detail?.collectionName;
      if (col === 'invoices') setInvoices(await getInvoices() || []);
      if (col === 'customers') setCustomers(await getCustomers() || []);
      if (col === 'products') setProducts(await getProducts() || []);
    };
    const handleSyncStatus = (e) => {
      if (e.detail) setSyncStatus(e.detail);
    };
    window.addEventListener('billqyro:settings-updated', handleSettingsUpdated);
    window.addEventListener('billqyro:data-updated', handleDataUpdated);
    window.addEventListener('billqyro:sync-status', handleSyncStatus);
    
    const handleNavigate = (e) => {
      if (e.detail) {
        setCurrentTab(e.detail);
      }
    };
    window.addEventListener('navigate_tab', handleNavigate);

    return () => {
      window.removeEventListener('billqyro_sync', handleSync);
      window.removeEventListener('billqyro:settings-updated', handleSettingsUpdated);
      window.removeEventListener('billqyro:data-updated', handleDataUpdated);
      window.removeEventListener('billqyro:sync-status', handleSyncStatus);
      window.removeEventListener('navigate_tab', handleNavigate);
    };
  }, []);

  // Workspace Contexts
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  // PWA Installer States
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isQuickBillOpen, setIsQuickBillOpen] = useState(false);

  // Initialize Smart SVG Dynamic Theme Engine
  useThemeEngine(settings);

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
        console.log("Firebase authReady: ", user ? `User found (uid: ${user.uid})` : "No real user found");
        if (user) {
          const session = getAuthSession();
          const newSession = {
            timestamp: Date.now(),
            token: 'billqyro-secure-session',
            userEmail: user.email || '',
            uid: user.uid
          };
          localStorage.setItem('billqyro_auth', JSON.stringify(newSession));
          setIsAuthenticated(true);
          setUserRole(localStorage.getItem('billqyro_user_role') || 'user');
        } else {
          setIsAuthenticated(false);
          setIsAppBooting(false); // Force exit loading state if no real user exists
        }
      });
      return () => unsubscribe();
    } else {
      setIsAppBooting(false);
    }
  }, []);

  // Sync from Firebase Firestore when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const runSync = async () => {
        console.log('Sync start: Attempting to sync from Firestore');
        try {
          const synced = await syncFromFirestore();
          console.log('Sync result: ', synced ? 'Success' : 'Failed/Null');
          if (synced) {
            if (synced.invoices) setInvoices(synced.invoices);
            if (synced.customers) setCustomers(synced.customers);
            if (synced.products) setProducts(synced.products);
            if (synced.settings) setSettings(synced.settings);
            if (synced.expenses) setExpenses(synced.expenses);
            if (synced.subscription) setSubscription(synced.subscription);
          }
          
          // Fetch global admin settings for defaults
          try {
            const adminGlobal = await getGlobalAdminSettings();
            if (adminGlobal) {
              if (adminGlobal.defaultTheme) {
                localStorage.setItem('billqyro_admin_default_theme', adminGlobal.defaultTheme);
                if (!synced?.settings?.themeColor && !synced?.settings?.brandColor) {
                  document.documentElement.setAttribute('data-theme', adminGlobal.defaultTheme);
                  import('./utils/themeIcon').then(m => m.updateFaviconForTheme(adminGlobal.defaultTheme));
                }
              }
              if (adminGlobal.defaultMode) {
                localStorage.setItem('billqyro_admin_default_mode', adminGlobal.defaultMode);
                if (!synced?.settings?.displayMode) {
                  if (adminGlobal.defaultMode === 'dark') document.documentElement.classList.add('dark');
                  else document.documentElement.classList.remove('dark');
                }
              }
            }
          } catch (e) { console.warn('Could not fetch admin settings on boot.'); }

          // Enable real-time multi-device sync via new Sync Engine
          import('./services/syncEngine').then(({ startRealTimeSync }) => {
            const userId = auth.currentUser?.uid;
            if (userId) {
              startRealTimeSync(userId, (newSettings) => {
                setSettings(newSettings);
              });
            }
          });
        } catch (e) {
          sendEmpireError({ errorType: "sync_failed", message: "Could not sync Firestore on startup", severity: "Medium" });
          console.warn('Could not sync Firestore on startup. Falling back to LocalStorage.', e);
        } finally {
          setIsAppBooting(false); // ALWAYS EXIT BOOT
        }
      };
      runSync();
    }
  }, [isAuthenticated]);



  // --- AUTH BRIDGE ---
  const handleLoginSuccess = () => {
    if (!sessionStorage.getItem('billqyro_welcome_shown')) {
      setShowWelcomeAnimation(true);
      sessionStorage.setItem('billqyro_welcome_shown', 'true');
    }
    // Auth state changes (isAuthenticated, sync) are handled reactively by onAuthStateChanged.
  };

  // Onboarding Interceptor for Authenticated Session Boot
  useEffect(() => {
    // Wait until boot and sync is completely finished
    if (isAuthenticated && !isAppBooting && settings) {
      console.log("Onboarding Check:", { setupCompleted: settings.setupCompleted, currentTab });
      const isLegacyConfigured = !!(settings.businessName && settings.businessName.trim());
      
      if (!settings.setupCompleted && !isLegacyConfigured) {
        if (currentTab !== 'onboarding') {
          setCurrentTab('onboarding');
        }
      } else if (!settings.setupCompleted && isLegacyConfigured) {
        // Silently upgrade legacy users to completed setup
        const updated = { ...settings, setupCompleted: true };
        saveSettings(updated);
        setSettings(updated);
        if (currentTab === 'onboarding') {
          setCurrentTab('dashboard');
        }
      } else if (settings.setupCompleted) {
        if (currentTab === 'onboarding') {
          setCurrentTab('dashboard');
        }
      }
    }
  }, [isAuthenticated, isAppBooting, settings, currentTab]);

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
      setShowPaywallModal(true);
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
    
    sendEmpireEvent({
      eventType: "invoice_created",
      message: "Invoice created in BillQyro",
      page: "create-invoice",
      metadata: { feature: "invoice", action: "created", privateDataIncluded: false }
    });

    // Trigger haptic & audio feedback
    triggerSuccessFeedback();

    if (unlinkedItems) {
      toast.custom(
        (t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-theme-warning/5 dark:bg-amber-950/40 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-amber-500/30`}>
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
                className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-theme-warning/10 focus:outline-none transition-colors"
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

  const handleDeleteInvoice = async (id, permanent = false) => {
    let shouldDelete = true;
    if (!permanent) {
      shouldDelete = window.confirm('Are you sure you want to move this invoice to trash?');
    }
    
    if (shouldDelete) {
      const { updatedInvoices, firebaseStatus } = await deleteInvoice(id, permanent);
      setInvoices(updatedInvoices);
      if (firebaseStatus === 'failed') {
        toast.success(permanent ? 'Invoice permanently deleted locally. Will sync when online.' : 'Invoice moved to trash locally.');
      } else {
        toast.success(permanent ? 'Invoice permanently deleted!' : 'Invoice moved to trash.');
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
      sendEmpireEvent({
        eventType: "customer_added",
        message: "Customer saved",
        page: "customers",
        metadata: { feature: "customer", action: "added", privateDataIncluded: false }
      });
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
      sendEmpireEvent({
        eventType: "product_added",
        message: "Product saved",
        page: "products",
        metadata: { feature: "product", action: "added", privateDataIncluded: false }
      });
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
      sendEmpireEvent({
        eventType: "settings_updated",
        message: "App settings updated",
        page: "settings",
        metadata: { privateDataIncluded: false }
      });
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
          sendEmpireEvent({
            eventType: "pdf_downloaded",
            message: "Invoice PDF generated",
            page: "invoice",
            metadata: { feature: "pdf", action: "downloaded", privateDataIncluded: false }
          });
        }
      })
      .catch((err) => {
        sendEmpireError({
          errorType: "pdf_failed",
          message: err?.toString() || "PDF generation failed",
          severity: "Medium",
          page: "invoice"
        });
      });
  };

  // --- TAB ROUTER SWITCHBOARD ---
  const renderTabContent = () => {
    const isProfileIncomplete = settings && !settings.profileSetupCompleted && !settings.businessName;
    const activeTab = isProfileIncomplete ? 'onboarding' : currentTab;

    if (activeTab === 'onboarding') {
      return (
        <OnboardingWizard
          businessSettings={settings}
          onSaveSettings={(newSettings) => {
            saveSettings(newSettings);
            setSettings(newSettings);
            setCurrentTab('dashboard');
          }}
          setCurrentTab={setCurrentTab}
        />
      );
    }
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            invoices={invoices}
            customers={customers}
            products={products}
            expenses={expenses}
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
            pendingPaymentsCount={pendingPayments.length}
          />
        );
      case 'pending-payments':
        return (
          <PendingPayments 
            setCurrentTab={setCurrentTab}
            pendingPayments={pendingPayments}
          />
        );
      case 'help-center':
        return (
          <HelpCenter />
        );
      case 'system-health':
        return (
          <SystemHealth setCurrentTab={setCurrentTab} />
        );
      case 'audit-logs':
        return (
          <AuditLogs setCurrentTab={setCurrentTab} />
        );
      case 'due-ledger':
        return (
          <DueLedger 
            customers={customers} 
            invoices={invoices} 
            businessSettings={settings}
          />
        );
      case 'reports':
        return (
          <Reports 
            invoices={invoices} 
            customers={customers} 
            businessSettings={settings}
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
      case 'estimates':
        return (
          <Estimates
            invoices={invoices}
            editingInvoice={editingInvoice}
            onEditInvoice={setEditingInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onDownloadPDF={handleDownloadPDF}
            setCurrentTab={setCurrentTab}
            businessSettings={settings}
            onSaveInvoice={handleSaveInvoice}
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
        // Legacy fallback
        return (
          <HelpCenter />
        );
      case 'customers':
        return (
          <Customers
            customers={customers}
            invoices={invoices}
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
      case 'appointments':
        return <Appointments />;
      case 'orders':
        return <Orders />;
      case 'patients':
        return <Patients />;
      case 'students':
        return <Students />;
      case 'clients':
        return <Clients />;
      case 'measurements':
        return <Measurements />;
      case 'designBook':
        return <DesignBook />;
      case 'devices':
        return <Devices />;
      case 'serviceJobs':
        return <ServiceJobs />;
      case 'projects':
        return <Projects />;
      case 'delivery':
        return <Delivery />;
      case 'subscription':
        return (
          <Subscription
            currentSubscription={subscription}
            onUpgrade={handleSaveSubscription}
            businessSettings={settings}
          />
        );
      case 'admin-panel':
        return <AdminPanel currentTab={currentTab} setCurrentTab={setCurrentTab} />;
      case 'pdf-templates':
        return (
          <PdfTemplateStudio 
            businessSettings={settings} 
            setSettings={setSettings} 
            setCurrentTab={setCurrentTab}
            subscription={subscription}
          />
        );
      case 'live-link-templates':
        return (
          <LiveLinkTemplateStudio 
            settings={settings}
            onSaveSettings={handleSaveSettings}
            subscription={subscription}
            setCurrentTab={setCurrentTab}
          />
        );
      case 'marketplace':
        return (
          <TemplateMarketplace
            settings={settings}
            onSaveSettings={handleSaveSettings}
            subscription={subscription}
            setCurrentTab={setCurrentTab}
          />
        );
      case 'backup-restore':
        return (
          <BackupRestore
            settings={settings}
            invoices={invoices}
            customers={customers}
            products={products}
            expenses={expenses}
            onImportBackup={handleImportBackup}
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
            pendingPaymentsCount={pendingPayments.length}
          />
        );
      case 'privacy':
        return <PrivacyPolicy setCurrentTab={setCurrentTab} />;
      case 'terms':
        return <TermsOfService setCurrentTab={setCurrentTab} />;
      case 'refund':
        return <RefundPolicy setCurrentTab={setCurrentTab} />;
      case 'data-deletion':
        return <DataDeletion onBack={() => setCurrentTab('more')} />;
      case 'support':
        return <Support onBack={() => setCurrentTab('more')} />;
      case 'workspace-manager':
        return (
          <WorkspaceManager
            businessWorkspaces={businessWorkspaces}
            activeWorkspaceId={activeWorkspaceId}
            setActiveWorkspace={setActiveWorkspace}
            settings={settings}
            onSaveSettings={handleSaveSettings}
            setCurrentTab={setCurrentTab}
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
            className="max-w-md bg-theme-card p-8 rounded-3xl border border-theme-border-soft shadow-2xl space-y-6"
          >
            <div className="w-16 h-16 bg-theme-danger/20 text-theme-danger rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Account Deactivated</h1>
            <p className="text-theme-muted text-xs font-semibold leading-relaxed">
              Your BillQyro workspace has been temporarily blocked by the platform administrator due to policy guidelines or outstanding billing concerns.
            </p>
            <div className="p-4 bg-theme-surface/50 rounded-2xl border border-theme-border-soft/80 text-left space-y-2">
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
              className="w-full py-3 bg-theme-card hover:bg-theme-surface text-white font-bold text-xs rounded-xl shadow-lg active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider"
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
            className="max-w-md bg-theme-card p-8 rounded-3xl border border-theme-border-strong shadow-2xl"
          >
            <div className="w-16 h-16 bg-theme-danger/20 text-theme-danger rounded-2xl flex items-center justify-center mx-auto mb-6">
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
      <AnimatePresence mode="wait">
        {isAppBooting ? (
          <motion.div 
            key="global-loader"
            exit={{ opacity: 0, transition: { duration: 0.25, ease: 'easeOut' } }}
            className="fixed inset-0 z-[9999] bg-theme-main flex flex-col items-center justify-center font-sans"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center"
            >
              {/* Premium Logo Pulse Effect */}
              <div className="relative flex items-center justify-center w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-theme-accent/20 rounded-3xl animate-ping" style={{ animationDuration: '2s' }}></div>
                <div className="absolute inset-0 bg-theme-accent/30 rounded-3xl blur-xl animate-pulse"></div>
                <div className="relative z-10 w-20 h-20 bg-gradient-to-tr from-theme-accent to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl border border-white/10">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">BillQyro</h1>
              <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mt-2 animate-pulse">
                Initializing Secure Workspace
              </p>
              
              {/* Glassmorphism Skeleton Loader Bar */}
              <div className="w-48 h-1 bg-theme-surface rounded-full mt-8 overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="w-1/2 h-full bg-gradient-to-r from-transparent via-theme-accent to-transparent"
                ></motion.div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="main-app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="w-full h-full">
            <PostLoginWelcome 
              show={showWelcomeAnimation} 
              userName={settings?.businessName || ''} 
              onComplete={() => setShowWelcomeAnimation(false)} 
            />
            {currentTab === 'onboarding' ? (
              <OnboardingWizard 
                onComplete={() => setCurrentTab('dashboard')} 
                businessSettings={settings} 
                onSaveSettings={handleSaveSettings}
                invoices={invoices}
              />
            ) : (
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
                userEmail={getAuthSession()?.userEmail}
                onQuickBillOpen={() => setIsQuickBillOpen(true)}
                pendingPaymentsCount={pendingPayments.length}
                businessWorkspaces={businessWorkspaces}
                activeWorkspaceId={activeWorkspaceId}
                setActiveWorkspace={setActiveWorkspace}
                syncSource="cloud"
                syncStatus={syncStatus}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTab}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="w-full h-full flex flex-col"
                  >
                    <React.Suspense fallback={
                      <div className="flex flex-1 min-h-[calc(100vh-250px)] items-center justify-center">
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
            )}
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: 'text-sm font-bold',
                style: { borderRadius: '12px', background: '#fff', color: '#1e293b' }
              }}
            />
            {/* Sync Badge moved to Layout Header */}
            
            {/* Paywall Modal */}
            <AnimatePresence>
              {showPaywallModal && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowPaywallModal(false)}
                  />
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-theme-card relative z-10 w-full max-w-md p-8 rounded-3xl shadow-2xl border border-theme-border-soft text-center"
                  >
                    <div className="w-16 h-16 mx-auto bg-[image:var(--accent-gradient)] rounded-2xl flex items-center justify-center mb-6 shadow-glow">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-theme-primary mb-2">Limit Reached</h2>
                    <p className="text-sm font-semibold text-theme-muted mb-6">
                      You've hit your free tier limit of {settings?.freeInvoiceLimit || 15} invoices. Upgrade to the Premium Plan for unlimited invoicing and exclusive SaaS features.
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setShowPaywallModal(false);
                          setCurrentTab('subscription');
                        }}
                        className="w-full py-3.5 bg-[image:var(--accent-gradient)] text-white font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95"
                      >
                        Upgrade Now
                      </button>
                      <button
                        onClick={() => setShowPaywallModal(false)}
                        className="w-full py-3.5 bg-transparent border border-theme-border-soft text-theme-muted font-bold rounded-xl hover:text-theme-primary hover:bg-theme-surface transition-all active:scale-95"
                      >
                        Not Right Now
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
}

export default App;
