import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import WelcomeOnboarding from './pages/WelcomeOnboarding';
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
import Layout from './components/Layout';

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
  syncFromFirestore
} from './utils/storage';
import { downloadInvoicePDF } from './utils/pdfUtils';

function App() {

  // --- STATE SYSTEM (must be declared before any useEffect that references them) ---
  const [isAuthenticated, setIsAuthenticated] = useState(getAuthSession() !== null);
  const [currentTab, setCurrentTab] = useState('dashboard');

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
        } catch (e) {
          console.warn('Could not sync Firestore on startup. Falling back to LocalStorage.', e);
        }
      };
      runSync();
    }
  }, [isAuthenticated]);

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

  // --- AUTH BRIDGE ---
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setInvoices(getInvoices());
    setCustomers(getCustomers());
    setProducts(getProducts());
    setSettings(getSettings());
    setExpenses(getExpenses());
    setSubscription(getSubscriptionStatus());
    
    // Check if new user
    const hasSeenGuide = localStorage.getItem('billqyro_seen_guide');
    if (!hasSeenGuide) {
      localStorage.setItem('billqyro_seen_guide', 'true');
      setCurrentTab('guide');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setCurrentTab('dashboard');
  };

  // --- DATA SYNCHRONIZERS ---

  // Invoices
  const handleSaveInvoice = (payload) => {
    const isNew = !payload.id || !invoices.some(inv => inv.id === payload.id);
    if (isNew && subscription.status !== 'premium' && invoices.length >= 5) {
      alert('⚠️ Free tier limit reached: You can create a maximum of 5 invoices. Please upgrade to the Premium Plan to unlock unlimited invoicing!');
      setCurrentTab('subscription');
      return;
    }
    const updated = saveInvoice(payload);
    setInvoices(updated);
    setEditingInvoice(null);
  };

  const handleDeleteInvoice = (id) => {
    if (confirm('Are you sure you want to delete this invoice? This action is permanent.')) {
      const updated = deleteInvoice(id);
      setInvoices(updated);
    }
  };

  // Customers
  const handleSaveCustomer = (payload) => {
    const updated = saveCustomer(payload);
    setCustomers(updated);
  };

  const handleDeleteCustomer = (id) => {
    const updated = deleteCustomer(id);
    setCustomers(updated);
  };

  // Products
  const handleSaveProduct = (payload) => {
    const updated = saveProduct(payload);
    setProducts(updated);
  };

  const handleDeleteProduct = (id) => {
    const updated = deleteProduct(id);
    setProducts(updated);
  };

  // Expenses
  const handleSaveExpense = (payload) => {
    const updated = saveExpense(payload);
    setExpenses(updated);
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
  const handleSaveSettings = (payload) => {
    const updated = saveSettings(payload);
    setSettings(updated);
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
      setCurrentTab('admin-panel');
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
          />
        );
      case 'admin-panel':
        if (!isAuthenticated) {
          return <Login onLoginSuccess={handleLoginSuccess} />;
        }
        return (
          <Settings
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
          handleLoginSuccess();
        }}
      />
    );
  }

  return (
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
    >
      {renderTabContent()}
    </Layout>
  );
}

export default App;
