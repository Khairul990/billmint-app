import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import Login from './pages/Login';
import WelcomeOnboarding from './pages/WelcomeOnboarding';
import SetupBilling from './pages/SetupBilling';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import Guide from './pages/Guide';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Settings from './pages/Settings';
import Expenses from './pages/Expenses';
import Subscription from './pages/Subscription';
import MoreMenu from './pages/MoreMenu';
import AdminSettings from './pages/AdminSettings';
import AdminUnlock from './pages/AdminUnlock';
import Layout from './components/Layout';

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
  enableRealTimeSync
} from './utils/storage';
import { downloadInvoicePDF } from './utils/pdfUtils';
import { auth, firebaseReady } from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {

  // --- STATE SYSTEM (must be declared before any useEffect that references them) ---
  const [isAuthenticated, setIsAuthenticated] = useState(getAuthSession() !== null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  
  // Role & Admin State
  const [userRole, setUserRole] = useState(localStorage.getItem('billqyro_user_role') || 'user');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(localStorage.getItem('billqyro_admin_unlocked') === 'true');

  // Storage states
  const [invoices, setInvoices] = useState(() => getInvoices());
  const [customers, setCustomers] = useState(() => getCustomers());
  const [products, setProducts] = useState(() => getProducts());
  const [settings, setSettings] = useState(() => getSettings());
  const [expenses, setExpenses] = useState(() => getExpenses());
  const [subscription, setSubscription] = useState(() => getSubscriptionStatus());

  // Workspace Contexts
  const [editingInvoice, setEditingInvoice] = useState(null);

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
            const emailLower = email.toLowerCase().trim();
            const settings = getSettings() || {};
            const activeAdminEmail = settings.adminEmail || 'Khairul20052007@gmail.com';
            const isMasterAdmin = emailLower === 'khairul20052007@gmail.com' || emailLower === 'khairul2052007@gmail.com';
            const isAdmin = (emailLower === activeAdminEmail.toLowerCase()) || isMasterAdmin;
            
            const newSession = { 
              timestamp: Date.now(), 
              token: 'billqyro-secure-session',
              userEmail: email 
            };
            
            localStorage.setItem('billqyro_auth', JSON.stringify(newSession));
            localStorage.setItem('billqyro_user_role', isAdmin ? 'admin' : 'user');
            
            if (isAdmin) {
              localStorage.setItem('billqyro_admin_unlocked', 'true');
            } else {
              localStorage.removeItem('billqyro_admin_unlocked');
            }
            
            setIsAuthenticated(true);
            setUserRole(isAdmin ? 'admin' : 'user');
            setIsAdminUnlocked(isAdmin);
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
    const handleSync = () => {
      setInvoices(getInvoices());
      setCustomers(getCustomers());
      setProducts(getProducts());
      setSettings(getSettings());
      setExpenses(getExpenses());
      setSubscription(getSubscriptionStatus());
    };

    window.addEventListener('billqyro_sync', handleSync);
    return () => window.removeEventListener('billqyro_sync', handleSync);
  }, []);

  // Listen for /admin and #/admin to route to admin panel automatically
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || hash === '#/admin' || hash === '#admin') {
        setCurrentTab('admin-panel');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Sync current virtual tab with URL hash
  useEffect(() => {
    if (currentTab === 'admin-panel') {
      if (window.location.hash !== '#/admin' && window.location.pathname !== '/admin') {
        window.location.hash = '#/admin';
      }
    } else {
      if (window.location.hash === '#/admin' || window.location.hash === '#admin') {
        window.location.hash = '';
      }
    }
  }, [currentTab]);

  // Auto-upgrade Master Admin if they haven't logged out yet
  useEffect(() => {
    if (isAuthenticated && userRole !== 'admin') {
      const session = getAuthSession();
      const email = session?.userEmail?.toLowerCase()?.trim() || '';
      if (email === 'khairul20052007@gmail.com' || email === 'khairul2052007@gmail.com') {
        setUserRole('admin');
        setIsAdminUnlocked(true);
        localStorage.setItem('billqyro_user_role', 'admin');
        localStorage.setItem('billqyro_admin_unlocked', 'true');
      }
    }
  }, [isAuthenticated, userRole]);

  // --- AUTH BRIDGE ---
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setUserRole(localStorage.getItem('billqyro_user_role') || 'user');
    setIsAdminUnlocked(localStorage.getItem('billqyro_admin_unlocked') === 'true');

    setInvoices(getInvoices());
    setCustomers(getCustomers());
    setProducts(getProducts());
    const currentSettings = getSettings();
    setSettings(currentSettings);
    setExpenses(getExpenses());
    setSubscription(getSubscriptionStatus());
    
    // Setup & Onboarding Routing
    const hasSeenGuide = localStorage.getItem('billqyro_seen_guide');
    if (!currentSettings.defaultBillingTemplate) {
      setCurrentTab('setup-billing');
    } else if (!hasSeenGuide) {
      localStorage.setItem('billqyro_seen_guide', 'true');
      setCurrentTab('guide');
    } else {
      setCurrentTab('dashboard');
    }
  };

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
    setIsAuthenticated(false);
    setUserRole('user');
    setIsAdminUnlocked(false);
    setCurrentTab('dashboard');
  };

  // --- DATA SYNCHRONIZERS ---

  // Invoices
  const handleSaveInvoice = async (payload, saveCustomerAsNew = false) => {
    const isNew = !payload.id || !invoices.some(inv => inv.id === payload.id);
    if (isNew && subscription.status !== 'premium' && invoices.length >= 5) {
      toast.error('Free tier limit reached: You can create a maximum of 5 invoices. Please upgrade to the Premium Plan to unlock unlimited invoicing!', { duration: 5000 });
      setCurrentTab('subscription');
      return;
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
      const updatedCustomers = saveCustomer(newCustomer);
      setCustomers(updatedCustomers);
    }
    
    if (firebaseStatus === 'failed') {
      toast.success('Invoice created successfully. (Saved locally. Firebase sync pending.)');
    } else {
      toast.success('Invoice created successfully');
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
      const updated = await saveCustomer(payload);
      setCustomers(updated);
      toast.success('Customer saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save customer');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      const updatedCustomers = await deleteCustomer(id);
      setCustomers(updatedCustomers);
      toast.success('Customer deleted');
    }
  };

  // Products
  const handleSaveProduct = async (payload) => {
    try {
      const updatedProducts = await saveProduct(payload);
      setProducts(updatedProducts);
      toast.success('Product/Service saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = (id) => {
    const updated = deleteProduct(id);
    setProducts(updated);
  };

  // Expenses
  const handleSaveExpense = async (payload) => {
    try {
      const updatedExpenses = await saveExpense(payload);
      setExpenses(updatedExpenses);
      toast.success('Expense saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save expense');
    }
  };

  const handleDeleteExpense = (id) => {
    const updated = deleteExpense(id);
    setExpenses(updated);
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
          />
        );
      case 'invoices':
        return (
          <Invoices
            invoices={invoices}
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
      case 'settings':
        return (
          <Settings
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        );
      case 'admin-panel':
        if (!isAuthenticated) {
          return <Login onLoginSuccess={handleLoginSuccess} />;
        }
        if (!isAdminUnlocked) {
          return (
            <AdminUnlock 
              onUnlock={() => {
                setIsAdminUnlocked(true);
                setUserRole('admin');
                localStorage.setItem('billqyro_user_role', 'admin');
                localStorage.setItem('billqyro_admin_unlocked', 'true');
              }} 
              onCancel={() => setCurrentTab('dashboard')} 
            />
          );
        }
        return (
          <AdminSettings
            settings={settings}
            invoices={invoices}
            customers={customers}
            onSaveSettings={handleSaveSettings}
            onResetDemo={handleResetDemo}
            onLogout={handleLogout}
            onImportBackup={handleImportBackup}
          />
        );
      default:
        return <div className="text-center font-bold text-slate-400 p-10">404 Tab Not Found</div>;
    }
  };

  // Show onboarding/login if not authenticated
  if (!isAuthenticated) {
    return (
      <WelcomeOnboarding 
        onLoginSuccess={handleLoginSuccess}
        onQuickStart={() => {
          initializeStorage();
          const session = { timestamp: Date.now(), token: 'billqyro-secure-session', userEmail: 'demo@billqyro.com' };
          localStorage.setItem('billqyro_auth', JSON.stringify(session));
          localStorage.setItem('billqyro_user_role', 'user');
          localStorage.removeItem('billqyro_admin_unlocked');
          handleLoginSuccess();
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
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
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
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
