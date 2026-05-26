import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  FileText,
  Save,
  Image as ImageIcon,
  Phone,
  Mail,
  User,
  CheckCircle2,
  Percent,
  QrCode,
  Palette,
  LayoutTemplate,
  Database,
  Download,
  Upload,
  Wifi,
  WifiOff,
  ServerOff,
  ShieldAlert,
  RotateCcw,
  RefreshCw,
  BarChart3,
  Users,
  CircleDollarSign,
  Clock,
  HardDrive,
  Megaphone,
  Lock,
  Trash2,
  CloudLightning,
  Globe,
  Languages,
  Sliders,
  Sparkles,
  Link,
  Info,
  Smartphone
} from 'lucide-react';

import {
  exportBackup,
  getAuthSession,
  clearInvoices,
  clearCustomers,
  clearProducts,
  clearExpenses,
  getStorageUsage,
  getAdminUsersList,
  getAdminPremiumRequests,
  updatePremiumRequestStatus,
  updateUserBlockStatus
} from '../utils/storage';
import { getAdminEmail } from '../utils/adminAccess';
import { firebaseReady } from '../utils/firebase';
import { toast } from 'react-hot-toast';

const getThemePreviewColors = (preset) => {
  const themes = {
    light: {
      background: '#F7F9FC',
      sidebar: '#071B3A',
      card: '#FFFFFF',
      text: '#101828',
      muted: '#667085',
      accent: '#19C3A3',
      primary: '#14284B',
      softAccent: '#ECFDF5',
      border: '#E5EAF1',
      btnFrom: '#14284B',
      btnTo: '#19C3A3',
      headerColor: '#071B3A',
      tableHeaderBg: '#ECFDF5',
      totalBg: '#E5EAF1'
    },
    dark: {
      background: '#04111F',
      sidebar: '#020B16',
      card: '#0B1F35',
      text: '#FFFFFF',
      muted: '#CBD5E1',
      accent: '#9FE5CF',
      primary: '#071B3A',
      softAccent: 'rgba(159,229,207,0.12)',
      border: 'rgba(255,255,255,0.12)',
      btnFrom: '#19C3A3',
      btnTo: '#9FE5CF',
      headerColor: '#9FE5CF',
      tableHeaderBg: 'rgba(159,229,207,0.15)',
      totalBg: 'rgba(255,255,255,0.08)'
    },
    rose: {
      background: '#FFF1F2',
      sidebar: '#4A0D19',
      card: '#FFFFFF',
      text: '#231018',
      muted: 'rgba(76, 29, 48, 0.65)',
      accent: '#F43F5E',
      primary: '#881337',
      softAccent: '#FFF1F2',
      border: '#FFE4E6',
      btnFrom: '#881337',
      btnTo: '#F43F5E',
      headerColor: '#881337',
      tableHeaderBg: '#FFE4E6',
      totalBg: '#FFE4E6'
    }
  };
  return themes[preset] || themes.light;
};

/**
 * Normal User Business Settings Page reorganized into 5 beautiful clean tabs.
 * Allows standard users to configure their own firm's profile.
 * If isAdmin is true, it also renders the Admin console section with simple Plan & Feature Control.
 */
const Settings = ({
  settings,
  onSaveSettings,
  isAdmin,
  onResetDemo,
  onImportBackup,
  invoices = [],
  customers = [],
  installPromptEvent = null,
  isAppInstalled = false,
  onInstallApp
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [themePreset, setThemePreset] = useState('light');

  // Business Profile States
  const [businessName, setBusinessName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  // Regional Settings States
  const [country, setCountry] = useState('India');
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('₹');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [taxLabel, setTaxLabel] = useState('GST');
  const [vatTax, setVatTax] = useState('');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [numberFormat, setNumberFormat] = useState('Indian');

  // Payment Settings States
  const [upiId, setUpiId] = useState('');
  const [bkashNumber, setBkashNumber] = useState('');
  const [nagadNumber, setNagadNumber] = useState('');
  const [rocketNumber, setRocketNumber] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentQrEnabled, setPaymentQrEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [customPaymentLink, setCustomPaymentLink] = useState('');
  const [showQrInPdf, setShowQrInPdf] = useState(true);
  const [showQrInPreview, setShowQrInPreview] = useState(true);

  // Invoice Preferences States
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [defaultTax, setDefaultTax] = useState(18);
  const [defaultNotes, setDefaultNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [pdfFooter, setPdfFooter] = useState('');
  const [brandColor, setBrandColor] = useState('#14b8a6'); // default teal
  const [invoiceTemplate, setInvoiceTemplate] = useState('modern');
  const [defaultBillingTemplate, setDefaultBillingTemplate] = useState('custom');

  // Customer Live Link Settings States
  const [enableLiveLink, setEnableLiveLink] = useState(true);
  const [showPaymentQrOnLink, setShowPaymentQrOnLink] = useState(true);
  const [allowPdfDownload, setAllowPdfDownload] = useState(true);
  const [allowPaymentProofSubmit, setAllowPaymentProofSubmit] = useState(true);
  const [showPaidDueAmount, setShowPaidDueAmount] = useState(true);
  const [showContactButton, setShowContactButton] = useState(true);
  const [requireTransactionId, setRequireTransactionId] = useState(true);
  const [requirePaymentScreenshot, setRequirePaymentScreenshot] = useState(false);

  // PDF Visibility preferences fields mapping
  const [pdfVisibleFields, setPdfVisibleFields] = useState({
    embroidery: ['designNo', 'workType', 'description', 'size', 'quantity', 'rate', 'amount'],
    grocery: ['productName', 'unit', 'quantity', 'unitPrice', 'amount'],
    repair: ['serviceName', 'problemDetails', 'partsCost', 'labourCharge', 'quantity', 'amount'],
    retail: ['productName', 'category', 'sizeVariant', 'quantity', 'price', 'discount', 'amount'],
    custom: ['itemService', 'description', 'quantity', 'rate', 'amount']
  });

  // Premium Admin States (TASK 8)
  const [freeInvoiceLimit, setFreeInvoiceLimit] = useState(15);
  const [feature_liveInvoiceLink, setFeature_liveInvoiceLink] = useState('Premium');
  const [feature_paymentProof, setFeature_paymentProof] = useState('Premium');
  const [feature_customLogo, setFeature_customLogo] = useState('Premium');
  const [feature_premiumPdfThemes, setFeature_premiumPdfThemes] = useState('Premium');
  const [feature_whatsappShare, setFeature_whatsappShare] = useState('Premium');
  const [feature_cloudSync, setFeature_cloudSync] = useState('Premium');
  const [feature_reports, setFeature_reports] = useState('Premium');
  const [feature_customerDatabase, setFeature_customerDatabase] = useState('Premium');
  const [globalAnnouncement, setGlobalAnnouncement] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Premium UX Settings (Phase 6)
  const [enableHaptics, setEnableHaptics] = useState(true);
  const [enableSounds, setEnableSounds] = useState(true);

  // Admin Panel Tab & Data States
  const [adminSubTab, setAdminSubTab] = useState('features');
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [showRejectionModalFor, setShowRejectionModalFor] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const fetchAdminData = async () => {
    if (!isAdmin) return;
    setLoadingAdminData(true);
    try {
      const [users, requests] = await Promise.all([
        getAdminUsersList(),
        getAdminPremiumRequests()
      ]);
      setAdminUsers(users || []);
      // Sort requests by createdAt desc
      const sortedRequests = (requests || []).sort((a, b) => b.createdAt - a.createdAt);
      setAdminRequests(sortedRequests);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin directories.');
    } finally {
      setLoadingAdminData(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const handleToggleBlock = async (targetUserId, currentBlocked) => {
    const action = currentBlocked ? 'Unblock' : 'Block';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    const success = await updateUserBlockStatus(targetUserId, !currentBlocked);
    if (success) {
      toast.success(`User successfully ${currentBlocked ? 'unblocked' : 'blocked'}.`);
      fetchAdminData();
    } else {
      toast.error(`Failed to update user block status.`);
    }
  };

  const handleApproveRequest = async (request) => {
    if (!confirm(`Approve premium upgrade request for ${request.userEmail}?`)) return;

    toast.loading('Processing approval...', { id: 'approve' });
    const success = await updatePremiumRequestStatus(request.requestId, 'Approved', request.userId, request.plan);
    toast.dismiss('approve');

    if (success) {
      toast.success('Premium plan successfully approved and activated.');
      fetchAdminData();
    } else {
      toast.error('Failed to approve request.');
    }
  };

  const handleOpenRejectModal = (requestId) => {
    setShowRejectionModalFor(requestId);
    setRejectionReasonInput('');
  };

  const handleConfirmRejectRequest = async () => {
    if (!rejectionReasonInput.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }
    const requestId = showRejectionModalFor;
    const request = adminRequests.find(r => r.requestId === requestId);
    if (!request) return;

    toast.loading('Processing rejection...', { id: 'reject' });
    const success = await updatePremiumRequestStatus(requestId, 'Rejected', request.userId, request.plan, rejectionReasonInput);
    toast.dismiss('reject');

    if (success) {
      toast.success('Request rejected and user notified.');
      setShowRejectionModalFor(null);
      setRejectionReasonInput('');
      fetchAdminData();
    } else {
      toast.error('Failed to reject request.');
    }
  };

  const [showToast, setShowToast] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || '');
      setLogoUrl(settings.logoUrl || '');
      setOwnerName(settings.ownerName || '');
      setPhone(settings.phone || '');
      setWhatsapp(settings.whatsapp || '');
      setEmail(settings.email || '');
      setAddress(settings.address || '');
      setGstNumber(settings.gstNumber || '');

      setCountry(settings.country || 'India');
      setLanguage(settings.language || 'English');
      setCurrency(settings.currency || '₹');
      setCurrencyCode(settings.currencyCode || (settings.country === 'Bangladesh' ? 'BDT' : settings.country === 'Other' ? 'USD' : 'INR'));
      setTaxLabel(settings.taxLabel || (settings.country === 'Bangladesh' ? 'VAT' : settings.country === 'Other' ? 'Tax' : 'GST'));
      setVatTax(settings.vatTax || '');
      setDateFormat(settings.dateFormat || 'DD/MM/YYYY');
      setNumberFormat(settings.numberFormat || 'Indian');

      setInvoicePrefix(settings.invoicePrefix || 'INV-');
      setDefaultTax(settings.defaultTax !== undefined ? settings.defaultTax : 18);
      setDefaultNotes(settings.defaultNotes || '');
      setTerms(settings.terms || '');
      setPdfFooter(settings.pdfFooter || '');

      setUpiId(settings.upiId || '');
      setPaymentQrEnabled(settings.paymentQrEnabled || false);
      setPaymentMethod(settings.paymentMethod || 'UPI');
      setBkashNumber(settings.bkashNumber || '');
      setNagadNumber(settings.nagadNumber || '');
      setRocketNumber(settings.rocketNumber || '');
      setPayeeName(settings.payeeName || '');
      setPaymentNote(settings.paymentNote || '');
      setShowQrInPdf(settings.showQrInPdf !== undefined ? settings.showQrInPdf : true);
      setShowQrInPreview(settings.showQrInPreview !== undefined ? settings.showQrInPreview : true);
      setCustomPaymentLink(settings.customPaymentLink || '');

      setBrandColor(settings.brandColor || '#14b8a6');
      setInvoiceTemplate(settings.invoiceTemplate || 'modern');
      setDefaultBillingTemplate(settings.defaultBillingTemplate || 'custom');

      if (settings.pdfVisibleFields) {
        setPdfVisibleFields(settings.pdfVisibleFields);
      }

      // Live link toggles
      if (settings.customerLiveLinkSettings) {
        setEnableLiveLink(settings.customerLiveLinkSettings.enableLiveInvoiceLink !== undefined ? settings.customerLiveLinkSettings.enableLiveInvoiceLink : true);
        setShowPaymentQrOnLink(settings.customerLiveLinkSettings.showPaymentQr !== undefined ? settings.customerLiveLinkSettings.showPaymentQr : true);
        setAllowPdfDownload(settings.customerLiveLinkSettings.allowCustomerPdfDownload !== undefined ? settings.customerLiveLinkSettings.allowCustomerPdfDownload : true);
        setAllowPaymentProofSubmit(settings.customerLiveLinkSettings.allowPaymentProofSubmit !== undefined ? settings.customerLiveLinkSettings.allowPaymentProofSubmit : true);
        setShowPaidDueAmount(settings.customerLiveLinkSettings.showPaidDueAmount !== undefined ? settings.customerLiveLinkSettings.showPaidDueAmount : true);
        setShowContactButton(settings.customerLiveLinkSettings.showContactButton !== undefined ? settings.customerLiveLinkSettings.showContactButton : true);
        setRequireTransactionId(settings.customerLiveLinkSettings.requireTransactionId !== undefined ? settings.customerLiveLinkSettings.requireTransactionId : true);
        setRequirePaymentScreenshot(settings.customerLiveLinkSettings.requirePaymentScreenshot !== undefined ? settings.customerLiveLinkSettings.requirePaymentScreenshot : false);
      }

      // Admin states
      setFreeInvoiceLimit(settings.freeInvoiceLimit !== undefined ? settings.freeInvoiceLimit : 15);
      setFeature_liveInvoiceLink(settings.feature_liveInvoiceLink || 'Premium');
      setFeature_paymentProof(settings.feature_paymentProof || 'Premium');
      setFeature_customLogo(settings.feature_customLogo || 'Premium');
      setFeature_premiumPdfThemes(settings.feature_premiumPdfThemes || 'Premium');
      setFeature_whatsappShare(settings.feature_whatsappShare || 'Premium');
      setFeature_cloudSync(settings.feature_cloudSync || 'Premium');
      setFeature_reports(settings.feature_reports || 'Premium');
      setFeature_customerDatabase(settings.feature_customerDatabase || 'Premium');
      setGlobalAnnouncement(settings.globalAnnouncement || '');
      setMaintenanceMode(settings.maintenanceMode || false);

      setEnableHaptics(settings.enableHaptics !== false);
      setEnableSounds(settings.enableSounds !== false);
      setThemePreset(settings.themePreset || 'light');
    }
  }, [settings]);

  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!businessName) {
      alert('Please specify a Business Name.');
      return;
    }

    if (paymentQrEnabled) {
      if (paymentMethod === 'UPI' && !upiId.trim()) {
        alert('Please specify your UPI ID.');
        return;
      }
      if (paymentMethod === 'bKash' && !bkashNumber.trim()) {
        alert('Please specify your bKash Number.');
        return;
      }
      if (paymentMethod === 'Nagad' && !nagadNumber.trim()) {
        alert('Please specify your Nagad Number.');
        return;
      }
      if (paymentMethod === 'Manual' && !customPaymentLink.trim()) {
        alert('Please specify your Custom Payment Link / QR Text.');
        return;
      }
    }

    const payload = {
      ...settings,
      businessName,
      logoUrl,
      ownerName,
      phone,
      whatsapp,
      email,
      address,
      gstNumber,

      country,
      language,
      currency,
      currencyCode,
      taxLabel,
      vatTax,
      dateFormat,
      numberFormat,

      invoicePrefix,
      defaultTax: parseFloat(defaultTax) || 0,
      defaultNotes,
      terms,
      pdfFooter,

      upiId,
      paymentQrEnabled,
      paymentMethod,
      bkashNumber,
      nagadNumber,
      rocketNumber,
      payeeName,
      paymentNote,
      showQrInPdf,
      showQrInPreview,
      customPaymentLink,

      themePreset,
      brandColor,
      invoiceTemplate,
      defaultBillingTemplate,
      pdfVisibleFields,
      enableHaptics,
      enableSounds,

      customerLiveLinkSettings: {
        enableLiveInvoiceLink: enableLiveLink,
        showPaymentQr: showPaymentQrOnLink,
        allowCustomerPdfDownload: allowPdfDownload,
        allowPaymentProofSubmit: allowPaymentProofSubmit,
        showPaidDueAmount: showPaidDueAmount,
        showContactButton: showContactButton,
        requireTransactionId,
        requirePaymentScreenshot
      },

      // Admin config
      freeInvoiceLimit: parseInt(freeInvoiceLimit) || 15,
      feature_liveInvoiceLink,
      feature_paymentProof,
      feature_customLogo,
      feature_premiumPdfThemes,
      feature_whatsappShare,
      feature_cloudSync,
      feature_reports,
      feature_customerDatabase,
      globalAnnouncement,
      maintenanceMode
    };

    onSaveSettings(payload);

    // Show Toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleExport = () => {
    try {
      const data = exportBackup();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);

      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('download', `billqyro-backup-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      alert(`Export failed: ${error.message}`);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        if (onImportBackup) {
          onImportBackup(parsedData);
          alert('Database successfully restored from backup!');
        } else {
          alert('Import feature not properly wired in the system.');
        }
      } catch (error) {
        alert(`Failed to import backup: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('CAUTION: This will wipe out all invoices, customers, and catalog items, replacing them with default demo assets. Proceed?')) {
      onResetDemo();
      alert('Database successfully reset to demo data!');
    }
  };

  const handleCountryAutoConfigure = (selectedCountry) => {
    const confirmChange = window.confirm(
      "Changing country will update default currency, payment methods, and tax labels. Existing saved invoices will keep their original invoice snapshot."
    );
    if (!confirmChange) {
      return;
    }

    setCountry(selectedCountry);
    if (selectedCountry === 'India') {
      setCurrency('₹');
      setCurrencyCode('INR');
      setTaxLabel('GST');
      setPaymentMethod('UPI');
      setDateFormat('DD/MM/YYYY');
      setNumberFormat('Indian');
      setDefaultTax(18);
    } else if (selectedCountry === 'Bangladesh') {
      setCurrency('৳');
      setCurrencyCode('BDT');
      setTaxLabel('VAT');
      setPaymentMethod('bKash');
      setDateFormat('DD/MM/YYYY');
      setNumberFormat('Standard');
      setDefaultTax(0);
      setVatTax('');
    } else {
      setCurrency('$');
      setCurrencyCode('USD');
      setTaxLabel('Tax');
      setPaymentMethod('Manual');
      setDateFormat('DD/MM/YYYY');
      setNumberFormat('Standard');
      setDefaultTax(0);
    }
  };

  // Stats for Admin Panel
  const totalInvoices = invoices.length;
  const totalCustomers = customers.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.grandTotal) || 0), 0);
  const paidRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amountPaid) || 0), 0);
  const pendingPayments = invoices.reduce((sum, inv) => sum + (parseFloat(inv.balanceDue) || 0), 0);
  const paidCount = invoices.filter(inv => inv.paymentStatus === 'Paid').length;
  const pendingCount = invoices.filter(inv => inv.paymentStatus !== 'Paid').length;

  const storageHealth = getStorageUsage();
  const session = getAuthSession();
  const loggedInEmail = session?.userEmail || 'unknown';

  const handleGranularWipe = (type) => {
    const confirmText = `CAUTION: This will permanently wipe out all ${type} from the database. This action is not reversible. Proceed?`;
    if (window.confirm(confirmText)) {
      if (type === 'Invoices') clearInvoices();
      if (type === 'Customers') clearCustomers();
      if (type === 'Products') clearProducts();
      if (type === 'Expenses') clearExpenses();
      alert(`${type} have been completely wiped.`);
      window.location.reload();
    }
  };

  const handleForceSync = () => {
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
    alert('Forced local data to sync with Cloud (if configured).');
  };

  // Firebase status
  const isOnline = navigator.onLine;
  const firebaseStatus = firebaseReady && isOnline
    ? 'connected'
    : firebaseReady && !isOnline
      ? 'offline'
      : 'not-configured';

  const firebaseStatusLabel = {
    connected: 'Firebase Connected',
    offline: 'Offline Mode Active',
    'not-configured': 'Firebase Not Configured',
  }[firebaseStatus];

  const firebaseStatusColor = {
    connected: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900',
    offline: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900',
    'not-configured': 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700',
  }[firebaseStatus];

  const firebaseStatusDot = {
    connected: 'bg-emerald-500',
    offline: 'bg-amber-400',
    'not-configured': 'bg-slate-400',
  }[firebaseStatus];

  const FirebaseIcon = {
    connected: Wifi,
    offline: WifiOff,
    'not-configured': ServerOff,
  }[firebaseStatus];

  return (
    <div className="max-w-4xl mx-auto pb-12 relative font-sans text-slate-800 dark:text-slate-100 dark:text-slate-200">

      {/* DEVELOPMENT DEBUG BLOCK */}
      <div className="bg-slate-800 text-[10px] text-green-400 p-2 mb-4 rounded font-mono break-all dark:bg-slate-900 dark:border dark:border-slate-800 flex justify-between">
        <span>Logged in as: {loggedInEmail} | Admin access: {isAdmin ? 'true' : 'false'}</span>
        <span>Target Admin: {getAdminEmail()}</span>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">Settings saved successfully</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Business settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Configure your company profile and invoicing configurations.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>

      {/* Modern 5-Tab Selection Menu */}
      <div className="flex bg-slate-100 dark:bg-slate-800 dark:bg-slate-900/60 p-1.5 rounded-2xl mb-6 overflow-x-auto no-scrollbar gap-1">
        {[
          { id: 'profile', label: 'Profile', icon: Building2 },
          { id: 'theme', label: 'Theme Studio', icon: Palette },
          { id: 'regional', label: 'Regional', icon: Globe },
          { id: 'payment', label: 'Payments', icon: QrCode },
          { id: 'preferences', label: 'Invoices', icon: FileText },
          { id: 'livelink', label: 'Live Links', icon: Link },
          { id: 'premiumux', label: 'Premium UX', icon: Smartphone },
          { id: 'pwa', label: 'Install App', icon: Download },
          { id: 'backup', label: 'Data Backup', icon: Database }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${isSelected
                  ? 'bg-white dark:bg-slate-900 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-slate-800/50 dark:border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-500' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tabs Content Sections */}
      <div className="space-y-6">

        {/* 1. BUSINESS PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 dark:text-slate-200">Business Profile</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Public Company Details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Registered Business Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. BillQyro Technologies"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-805 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Owner Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><User className="w-4 h-4" /></span>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Business Logo URL</label>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${isDragging ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/20' : 'border-slate-200 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-850'
                    }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = (event) => setLogoUrl(event.target.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (event) => setLogoUrl(event.target.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Drag & drop logo, or click to browse</span>
                  </div>
                </div>

                <div className="mt-3 relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><ImageIcon className="w-3.5 h-3.5" /></span>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Or paste logo image URL..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-indigo-600 dark:text-indigo-400 font-medium text-xs"
                  />
                </div>

                {logoUrl && (
                  <div className="mt-3 relative inline-block group">
                    <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain rounded-lg border border-slate-200 dark:border-slate-750 p-1 bg-white dark:bg-slate-900" onError={(e) => e.target.style.display = 'none'} />
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">WhatsApp Link Number</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Contact Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Mail className="w-4 h-4" /></span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="billing@firm.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Corporate Address</label>
                <div className="relative">
                  <span className="absolute top-3.5 left-3.5 text-slate-400"><MapPin className="w-4 h-4" /></span>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full office address details..."
                    rows="2"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-medium resize-none text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1.5 BRAND THEME STUDIO TAB */}
        {activeTab === 'theme' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Studio Header */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-premium flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-650 dark:text-teal-400 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Brand Theme Studio</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Customize the look of your BillQyro workspace and invoice PDF</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Preset Selectors & Controls */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-premium space-y-5">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Select Preset Theme</h3>
                  
                  {/* Theme Presets List */}
                  <div className="space-y-3">
                    {[
                      {
                        id: 'light',
                        name: 'Light Professional',
                        desc: 'Clean white, navy text, mint action buttons. Best default for all businesses.',
                        colors: ['#f0f3f6', '#071B3A', '#19C3A3']
                      },
                      {
                        id: 'dark',
                        name: 'Dark Premium',
                        desc: 'Dark navy dashboard with teal glow. Best for night use and premium finance look.',
                        colors: ['#04111F', '#020B16', '#9FE5CF']
                      },
                      {
                        id: 'rose',
                        name: 'Rose Business',
                        desc: 'Burgundy, rose, and soft white. Great for fashion, boutique, beauty, and embroidery businesses.',
                        colors: ['#FFF1F2', '#4A0D19', '#F43F5E']
                      }
                    ].map((preset) => {
                      const isSelected = themePreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setThemePreset(preset.id)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer flex flex-col gap-2 ${
                            isSelected 
                              ? 'border-emerald-500 bg-emerald-500/[0.03] shadow-premium glow-emerald' 
                              : 'border-slate-200/60 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-extrabold text-slate-850 dark:text-slate-100">{preset.name}</span>
                            <div className="flex gap-1 items-center">
                              {preset.colors.map((c, i) => (
                                <span key={i} className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: c }}></span>
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold leading-relaxed pr-6">{preset.desc}</p>
                          {isSelected && (
                            <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-bold">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Actions buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        document.documentElement.setAttribute('data-theme', themePreset);
                        if (themePreset === 'dark') {
                          document.documentElement.classList.add('dark');
                        } else {
                          document.documentElement.classList.remove('dark');
                        }
                        toast.success(`Previewing ${themePreset === 'light' ? 'Light Professional' : themePreset === 'dark' ? 'Dark Premium' : 'Rose Business'} theme!`);
                      }}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200/75 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-black text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer uppercase tracking-wider"
                    >
                      Preview Theme
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(null)}
                      className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer uppercase tracking-wider"
                    >
                      Save Theme
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setThemePreset('light');
                        const payload = {
                          ...settings,
                          themePreset: 'light',
                          themeUpdatedAt: new Date().toISOString()
                        };
                        onSaveSettings(payload);
                        document.documentElement.setAttribute('data-theme', 'light');
                        document.documentElement.classList.remove('dark');
                        toast.success('Reset to BillQyro Classic default theme!');
                      }}
                      className="w-full py-2 bg-transparent text-slate-400 hover:text-rose-500 text-[10px] font-bold text-center transition-all cursor-pointer block uppercase tracking-wider"
                    >
                      Reset to BillQyro Classic
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Interactive Mocks Previews */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Theme Studio Live Mocks</h3>
                    <p className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold leading-relaxed mt-0.5">Real-time dynamic visualization of presets applied to core panels</p>
                  </div>

                  {/* Previews Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 1. Dashboard Mock */}
                    {(() => {
                      const colors = getThemePreviewColors(themePreset);
                      return (
                        <div className="border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden flex flex-col justify-between" style={{ backgroundColor: colors.background }}>
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-slate-400 bg-white/40 dark:bg-black/30 px-1.5 py-0.5 rounded border border-slate-200/10">PC Workspace</span>
                          <div className="space-y-2">
                            <span className="text-[8px] font-black uppercase text-slate-455 tracking-wider block">Desktop Dashboard</span>
                            <div className="flex gap-2">
                              {/* Sidebar miniature */}
                              <div className="w-14 rounded p-1.5 space-y-1" style={{ backgroundColor: colors.sidebar }}>
                                <div className="w-8 h-1 rounded-sm bg-white/40"></div>
                                <div className="w-10 h-0.5 rounded-sm bg-white/20"></div>
                                <div className="w-10 h-0.5 rounded-sm bg-white/20"></div>
                                <div className="w-10 h-0.5 rounded-sm bg-white/20"></div>
                              </div>
                              {/* Main panel miniature */}
                              <div className="flex-1 space-y-2">
                                {/* Hero Mock */}
                                <div className="rounded p-2 text-white text-[6px] space-y-1 relative" style={{ background: `linear-gradient(135deg, ${colors.btnFrom}, ${colors.btnTo})` }}>
                                  <span className="font-extrabold block">Welcome to BillQyro</span>
                                  <div className="w-12 h-1 bg-white/30 rounded-sm"></div>
                                </div>
                                {/* Stats Box mock */}
                                <div className="grid grid-cols-2 gap-1">
                                  <div className="rounded p-1 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                                    <span className="text-[5px] text-slate-400 block leading-none">Collection</span>
                                    <span className="text-[6px] font-extrabold" style={{ color: colors.text }}>$1,200</span>
                                  </div>
                                  <div className="rounded p-1 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                                    <span className="text-[5px] text-slate-400 block leading-none">Dues</span>
                                    <span className="text-[6px] font-extrabold" style={{ color: colors.text }}>$450</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Create button */}
                          <div className="w-full h-5 rounded-lg flex items-center justify-center text-[7px] font-black uppercase tracking-wider text-white shadow-sm" style={{ background: `linear-gradient(90deg, ${colors.btnFrom}, ${colors.btnTo})` }}>
                            Create Invoice
                          </div>
                        </div>
                      );
                    })()}

                    {/* 2. Mobile screen Mock */}
                    {(() => {
                      const colors = getThemePreviewColors(themePreset);
                      return (
                        <div className="border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between items-center relative overflow-hidden bg-slate-950 min-h-[145px]">
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-slate-400 bg-white/10 px-1.5 py-0.5 rounded border border-white/5">Smartphone UI</span>
                          {/* Mobile Screen Shell */}
                          <div className="w-3/4 flex-1 border border-white/10 bg-slate-900 rounded-t-xl overflow-hidden flex flex-col justify-between" style={{ backgroundColor: colors.background }}>
                            {/* Mobile header */}
                            <div className="p-1 flex justify-between items-center border-b" style={{ borderColor: colors.border }}>
                              <span className="text-[5px] font-bold" style={{ color: colors.text }}>BillQyro</span>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }}></span>
                            </div>
                            {/* Mobile card info */}
                            <div className="p-2 space-y-1.5">
                              <div className="rounded p-1.5 border space-y-1" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                                <div className="w-10 h-0.5 bg-slate-300 rounded-sm"></div>
                                <div className="w-14 h-1 rounded-sm" style={{ backgroundColor: colors.accent }}></div>
                              </div>
                            </div>
                            {/* Floating pill action mock */}
                            <div className="flex justify-center -mb-2">
                              <span className="px-2 py-0.5 rounded-full text-[4.5px] font-black text-white shadow-sm flex items-center gap-0.5" style={{ background: `linear-gradient(90deg, ${colors.btnFrom}, ${colors.btnTo})` }}>
                                ⚡ Quick Bill
                              </span>
                            </div>
                            {/* Mobile Bottom navigation bar mockup */}
                            <div className="h-4 border-t flex justify-around items-center" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                              <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                              <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                              <span className="w-2.5 h-1 rounded-sm" style={{ backgroundColor: colors.accent }}></span>
                              <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 3. A4 Printable PDF Mock */}
                    {(() => {
                      const colors = getThemePreviewColors(themePreset);
                      return (
                        <div className="border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 bg-slate-100 dark:bg-slate-900/50 flex flex-col justify-between items-center relative overflow-hidden min-h-[145px]">
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-slate-400 bg-white/40 dark:bg-black/30 px-1.5 py-0.5 rounded border border-slate-200/10">Printable PDF</span>
                          {/* Mini paper sheet */}
                          <div className="w-[85%] flex-1 bg-white border border-slate-200 shadow-sm p-2 flex flex-col justify-between">
                            {/* Header accent */}
                            <div className="flex justify-between items-start pb-1.5 border-b border-slate-150">
                              <div className="space-y-0.5">
                                <span className="text-[6px] font-extrabold block" style={{ color: colors.headerColor }}>BillQyro Store</span>
                                <div className="w-10 h-0.5 bg-slate-300 rounded-sm"></div>
                              </div>
                              <span className="text-[6px] font-black tracking-wide" style={{ color: colors.headerColor }}>INVOICE</span>
                            </div>
                            {/* Table Mockup */}
                            <div className="my-1.5 space-y-0.5">
                              {/* Header Accent Line */}
                              <div className="h-1 rounded-sm w-full" style={{ backgroundColor: colors.tableHeaderBg }}></div>
                              <div className="h-0.5 bg-slate-100 w-full"></div>
                              <div className="h-0.5 bg-slate-100 w-full"></div>
                            </div>
                            {/* Total Highlight Accent Row */}
                            <div className="flex justify-between items-center p-1 rounded-sm" style={{ backgroundColor: colors.totalBg }}>
                              <span className="text-[5px] font-black" style={{ color: colors.headerColor }}>GRAND TOTAL</span>
                              <span className="text-[5.5px] font-black" style={{ color: colors.headerColor }}>$1,650.00</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 4. Scan to Pay QR Card Preview */}
                    {(() => {
                      const colors = getThemePreviewColors(themePreset);
                      return (
                        <div className="border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 flex flex-col justify-between items-center relative overflow-hidden min-h-[145px]">
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/10">QR Pay Card</span>
                          {/* Miniature Scan Card frame */}
                          <div className="w-[85%] border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 flex flex-col items-center justify-between text-center gap-1.5 shadow-sm bg-slate-50 dark:bg-slate-950/20">
                            <span className="text-[6px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block leading-none">Scan to Pay</span>
                            
                            {/* Mini QR border styled in theme accent */}
                            <div className="p-1 rounded border-2 border-dashed flex items-center justify-center" style={{ borderColor: colors.accent }}>
                              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[5px] text-slate-400">QR Code</div>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[5.5px] text-slate-500 dark:text-slate-400 block font-semibold leading-none">BillQyro Payment</span>
                              <span className="text-[7px] font-black block leading-tight" style={{ color: colors.headerColor }}>$1,650.00 Due</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. REGIONAL SETTINGS TAB */}
        {activeTab === 'regional' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 dark:text-slate-200">Regional Settings</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Localization, currency, and language</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Workspace Country</label>
                <select
                  value={country}
                  onChange={(e) => handleCountryAutoConfigure(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                >
                  <option value="India">🇮🇳 India</option>
                  <option value="Bangladesh">🇧🇩 Bangladesh</option>
                  <option value="Other">🌐 Other / General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Interface UI Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                >
                  <option value="English">English</option>
                  <option value="Bengali">Bengali (বাংলা)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
                <p className="text-[9px] text-slate-400 mt-1 font-semibold">Language controls interface UI labels. Country controls calculations/payment options.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Currency Symbol</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="e.g. ₹, ৳, $, €"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Currency Code</label>
                <input
                  type="text"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  placeholder="e.g. INR, BDT, USD"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Tax Label text</label>
                <select
                  value={['GST', 'VAT', 'Tax', 'None'].includes(taxLabel) ? taxLabel : 'Custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'Custom') {
                      setTaxLabel(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold mb-2"
                >
                  <option value="GST">GST</option>
                  <option value="VAT">VAT</option>
                  <option value="Tax">Tax</option>
                  <option value="None">None</option>
                  <option value="Custom">Custom (Type below)</option>
                </select>
                {(!['GST', 'VAT', 'Tax', 'None'].includes(taxLabel) || taxLabel === 'Custom') && (
                  <input
                    type="text"
                    value={taxLabel === 'Custom' ? '' : taxLabel}
                    onChange={(e) => setTaxLabel(e.target.value)}
                    placeholder="Enter custom tax label..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Date Format</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 24/05/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 05/24/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-05-24)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Number Format</label>
                <select
                  value={numberFormat}
                  onChange={(e) => setNumberFormat(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                >
                  <option value="Indian">12,34,567.89 (Indian lakh/crore)</option>
                  <option value="Standard">1,234,567.89 (Standard international)</option>
                  <option value="European">1.234.567,89 (European standard)</option>
                </select>
              </div>

              {country === 'Bangladesh' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Default VAT / Tax Rate (%)</label>
                  <input
                    type="number"
                    value={vatTax}
                    onChange={(e) => setVatTax(e.target.value)}
                    placeholder="e.g. 7.5"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. PAYMENT SETTINGS TAB */}
        {activeTab === 'payment' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 dark:text-slate-200">Payment Settings</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Automated billing QR configuration</p>
              </div>
            </div>

            {/* Enable switch */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200 block">Enable Automated Scan-to-Pay QR Code</span>
                <span className="text-[10px] text-slate-400 font-medium">Embed automated scanning codes on bills and invoice pages</span>
              </div>
              <button
                type="button"
                onClick={() => setPaymentQrEnabled(!paymentQrEnabled)}
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${paymentQrEnabled ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`w-4 h-4 bg-white dark:bg-slate-900 rounded-full absolute top-1 transition-all duration-300 ${paymentQrEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            {paymentQrEnabled && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Primary Payment Gateway Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                    >
                      {country === 'India' && <option value="UPI">UPI (Unified Payments Interface - India)</option>}
                      {country === 'Bangladesh' && (
                        <>
                          <option value="bKash">bKash (Mobile Wallet - Bangladesh)</option>
                          <option value="Nagad">Nagad (Mobile Wallet - Bangladesh)</option>
                          <option value="Rocket">Rocket (Mobile Wallet - Bangladesh)</option>
                        </>
                      )}
                      <option value="Manual">Manual QR / Custom Bank Details / instructions</option>
                    </select>
                  </div>

                  {/* Country based options */}
                  {country === 'India' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. business@okaxis"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                      />
                    </div>
                  )}

                  {country === 'Bangladesh' && paymentMethod === 'bKash' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">bKash Wallet Number</label>
                      <input
                        type="text"
                        value={bkashNumber}
                        onChange={(e) => setBkashNumber(e.target.value)}
                        placeholder="e.g. 017XXXXXXXX"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                      />
                    </div>
                  )}

                  {country === 'Bangladesh' && paymentMethod === 'Nagad' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Nagad Account Number</label>
                      <input
                        type="text"
                        value={nagadNumber}
                        onChange={(e) => setNagadNumber(e.target.value)}
                        placeholder="e.g. 019XXXXXXXX"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                      />
                    </div>
                  )}

                  {country === 'Bangladesh' && paymentMethod === 'Rocket' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Rocket Account Number (Optional)</label>
                      <input
                        type="text"
                        value={rocketNumber}
                        onChange={(e) => setRocketNumber(e.target.value)}
                        placeholder="e.g. 018XXXXXXXX"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                      />
                    </div>
                  )}

                  {country === 'Other' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Manual / Bank Instructions / Custom QR link</label>
                      <input
                        type="text"
                        value={customPaymentLink}
                        onChange={(e) => setCustomPaymentLink(e.target.value)}
                        placeholder="e.g. Bank name: X, A/C: Y, IFSC: Z or PayPal link..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-medium"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Payee / Account Name</label>
                    <input
                      type="text"
                      value={payeeName}
                      onChange={(e) => setPayeeName(e.target.value)}
                      placeholder="e.g. BillQyro store"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 mb-1.5 uppercase tracking-wide">QR payment footnote note</label>
                    <input
                      type="text"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="e.g. Please scan to complete payment."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-855 dark:text-white font-medium"
                    />
                  </div>
                </div>

                {/* PDF/Preview checks */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200 block">Show QR in PDF Invoice</span>
                    <span className="text-[9px] text-slate-400 font-medium">Render the QR code on generated PDF documents</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQrInPdf(!showQrInPdf)}
                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${showQrInPdf ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white dark:bg-slate-900 rounded-full absolute top-1 transition-all duration-300 ${showQrInPdf ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200 block">Show QR on Local Preview</span>
                    <span className="text-[9px] text-slate-400 font-medium">Render the QR code on invoice previews inside dashboard</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQrInPreview(!showQrInPreview)}
                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${showQrInPreview ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white dark:bg-slate-900 rounded-full absolute top-1 transition-all duration-300 ${showQrInPreview ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 4. INVOICE PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 dark:text-slate-200">Invoice Preferences</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Invoice templates, numbering, and color accents</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Primary Invoice Layout Structure</label>
                <select
                  value={invoiceTemplate}
                  onChange={(e) => setInvoiceTemplate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                >
                  <option value="modern">Modern A4 Template Layout</option>
                  <option value="classic">Classic A5 Template Layout</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Default Form Template Field Layout</label>
                <select
                  value={defaultBillingTemplate}
                  onChange={(e) => setDefaultBillingTemplate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                >
                  <option value="embroidery">Embroidery / Sewing / Fashion</option>
                  <option value="grocery">Grocery / Kirana Shop</option>
                  <option value="repair">Mobile Repair / Tailoring Service</option>
                  <option value="retail">Retail Shopping Store</option>
                  <option value="custom">Standard Flexible Bill</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Invoice Number Prefix</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="e.g. INV-"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Tax ID / GST Number (Optional)</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-bold uppercase"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-2 uppercase tracking-wide flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5" /> Corporate Theme Accent Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { name: 'Teal (Default)', hex: '#14b8a6' },
                    { name: 'Indigo', hex: '#6366f1' },
                    { name: 'Rose', hex: '#f43f5e' },
                    { name: 'Blue', hex: '#3b82f6' },
                    { name: 'Emerald', hex: '#10b981' },
                    { name: 'Amber', hex: '#f59e0b' },
                    { name: 'Slate', hex: '#475569' }
                  ].map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setBrandColor(color.hex)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${brandColor === color.hex ? 'ring-4 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: color.hex, ringColor: color.hex }}
                      title={color.name}
                    >
                      {brandColor === color.hex && <CheckCircle2 className="w-5 h-5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Default Invoice Notes</label>
                <textarea
                  value={defaultNotes}
                  onChange={(e) => setDefaultNotes(e.target.value)}
                  placeholder="Thank you for your business!"
                  rows="2"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-medium resize-none text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">Terms & Conditions</label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="1. Payment is expected within due date."
                  rows="2"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-medium resize-none text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wide">PDF Document Footer Note</label>
                <input
                  type="text"
                  value={pdfFooter}
                  onChange={(e) => setPdfFooter(e.target.value)}
                  placeholder="e.g. This is a computer generated invoice."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 dark:text-white font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. CUSTOMER LIVE LINK SETTINGS TAB */}
        {activeTab === 'livelink' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Link className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 dark:text-slate-200">Customer Live Link Settings</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configure what public customers see and interact with</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Checkboxes */}
              {[
                { state: enableLiveLink, setter: setEnableLiveLink, label: 'Enable Secure Live Link', desc: 'Generate unique public url endpoints for customers' },
                { state: showPaymentQrOnLink, setter: setShowPaymentQrOnLink, label: 'Show Payment QR Code', desc: 'Display scan-to-pay QR module on public invoice pages' },
                { state: allowPdfDownload, setter: setAllowPdfDownload, label: 'Allow Customer PDF Download', desc: 'Allow client to print/download official invoice PDF documents' },
                { state: allowPaymentProofSubmit, setter: setAllowPaymentProofSubmit, label: 'Allow Payment Proof Submission', desc: 'Render "I Have Paid" flow to submit payment proofs' },
                { state: showPaidDueAmount, setter: setShowPaidDueAmount, label: 'Show Paid & Due Amounts', desc: 'Explicitly display amount collected vs balance due totals' },
                { state: showContactButton, setter: setShowContactButton, label: 'Show Contact Support Button', desc: 'Embed rapid email/phone direct links for customers' },
                { state: requireTransactionId, setter: setRequireTransactionId, label: 'Require Transaction Reference ID', desc: 'Make Transaction ID mandatory in the proof verification flow' },
                { state: requirePaymentScreenshot, setter: setRequirePaymentScreenshot, label: 'Require Payment Screenshot Proof', desc: 'Make file upload mandatory to submit "I Have Paid"' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <div className="mr-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-slate-250 block">{item.label}</span>
                    <span className="text-[9px] text-slate-450 dark:text-slate-400 font-semibold">{item.desc}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => item.setter(!item.state)}
                    className={`w-9 h-5 rounded-full relative transition-colors duration-300 shrink-0 mt-0.5 focus:outline-none ${item.state ? 'bg-teal-500' : 'bg-slate-350 dark:bg-slate-700'}`}
                  >
                    <div className={`w-3 h-3 bg-white dark:bg-slate-900 rounded-full absolute top-1 transition-all duration-300 ${item.state ? 'left-5' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}

            </div>
          </div>
        )}

        {/* 5.5 PREMIUM UX SETTINGS TAB */}
        {activeTab === 'premiumux' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 dark:text-slate-200">Premium Mobile UX</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configure haptic vibrations and premium sounds</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { state: enableHaptics, setter: setEnableHaptics, label: 'Enable Haptic Feedback', desc: 'Vibrate on success, errors, and key actions' },
                { state: enableSounds, setter: setEnableSounds, label: 'Enable Premium Sounds', desc: 'Play satisfying audio cues when bills are saved' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <div className="mr-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-slate-250 block">{item.label}</span>
                    <span className="text-[9px] text-slate-450 dark:text-slate-400 font-semibold">{item.desc}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => item.setter(!item.state)}
                    className={`w-9 h-5 rounded-full relative transition-colors duration-300 shrink-0 mt-0.5 focus:outline-none ${item.state ? 'bg-teal-500' : 'bg-slate-350 dark:bg-slate-700'}`}
                  >
                    <div className={`w-3 h-3 bg-white dark:bg-slate-900 rounded-full absolute top-1 transition-all duration-300 ${item.state ? 'left-5' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. APP INSTALL / PWA TAB */}
        {activeTab === 'pwa' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-650 dark:text-teal-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 dark:text-slate-200">Install BillQyro App</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Run BillQyro as a premium standalone software</p>
              </div>
            </div>

            {isAppInstalled ? (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/60 rounded-3xl text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">BillQyro App is Installed!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-semibold">
                  You are running the standalone application with high-performance local database caching, full offline capabilities, and a borderless dedicated workspace window.
                </p>
              </div>
            ) : installPromptEvent ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-850 rounded-3xl text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20 text-white flex items-center justify-center font-black text-xl">
                  BQ
                </div>
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">BillQyro Standalone Application</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 max-w-md mx-auto leading-relaxed font-semibold">
                  Install BillQyro directly to your desktop or mobile home screen. Unlocks faster loading speeds, borderless full-screen workspace, and robust offline accounting access.
                </p>
                <button
                  type="button"
                  onClick={onInstallApp}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-650 hover:to-emerald-650 text-white font-black text-xs px-6 py-4 rounded-2xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider animate-pulse"
                >
                  <Download className="w-4 h-4" />
                  <span>Install BillQyro Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex gap-3">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-amber-500 shadow-xs h-fit flex items-center justify-center">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-widest mb-1">Manual Installation Guide</h4>
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                      Native one-click installation is not supported by your current browser environment (e.g. iOS Safari) or the app is already installed. Follow the quick instructions below to install manually!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Apple iOS */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-850/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-650 dark:text-slate-400 uppercase">
                      🍎 Apple iOS (iPhone/iPad)
                    </div>
                    <ol className="text-xs text-slate-500 dark:text-slate-400 font-semibold space-y-2 list-decimal list-inside">
                      <li>Open BillQyro in <strong className="text-slate-700 dark:text-slate-300 dark:text-slate-200">Safari</strong> browser.</li>
                      <li>Tap the <strong className="text-slate-700 dark:text-slate-300 dark:text-slate-200">Share</strong> button (box with an up-arrow).</li>
                      <li>Scroll and select <strong className="text-slate-700 dark:text-slate-300 dark:text-slate-200">Add to Home Screen</strong>.</li>
                      <li>Tap <strong className="text-teal-650 dark:text-teal-400 font-black">Add</strong> in the top-right corner.</li>
                    </ol>
                  </div>

                  {/* Android Chrome */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-850/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-650 dark:text-slate-400 uppercase">
                      🤖 Android Mobile (Chrome)
                    </div>
                    <ol className="text-xs text-slate-500 dark:text-slate-450 font-semibold space-y-2 list-decimal list-inside">
                      <li>Open BillQyro in <strong className="text-slate-700 dark:text-slate-300 dark:text-slate-200">Chrome</strong>.</li>
                      <li>Tap the <strong className="text-slate-700 dark:text-slate-300 dark:text-slate-200">Menu</strong> icon (three vertical dots).</li>
                      <li>Select <strong className="text-slate-700 dark:text-slate-300 dark:text-slate-200">Add to Home screen</strong> or <strong className="text-slate-700 dark:text-slate-300 dark:text-slate-200">Install app</strong>.</li>
                      <li>Confirm by tapping <strong className="text-teal-650 dark:text-teal-400 font-black">Install</strong>.</li>
                    </ol>
                  </div>

                  {/* Desktop PCs */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-850/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-655 dark:text-slate-400 uppercase">
                      💻 Desktop Computers
                    </div>
                    <ol className="text-xs text-slate-500 dark:text-slate-400 font-semibold space-y-2 list-decimal list-inside">
                      <li>Open BillQyro in <strong className="text-slate-700 dark:text-slate-300 dark:text-slate-200">Chrome</strong> or <strong className="text-slate-700 dark:text-slate-300 dark:text-slate-200">Edge</strong>.</li>
                      <li>Look at the right side of the browser's address bar.</li>
                      <li>Click the <strong className="text-slate-700 dark:text-slate-300 dark:text-slate-200">Install App</strong> icon (square with overlapping shapes).</li>
                      <li>Click <strong className="text-teal-655 dark:text-teal-400 font-black">Install</strong> in the confirmation box.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* --- SIMPLIFIED ADMIN FEATURE & PLAN CONTROL PANEL (TASK 8) --- */}
      {isAdmin && (
        <div className="mt-12 space-y-6 pt-12 border-t-2 border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Superuser Admin Console</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">SaaS tier levels, announcements, and global databases control</p>
              </div>
            </div>
            {/* Storage Quota */}
            <div className="flex flex-col sm:items-end">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Local storage quota</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${storageHealth.percentage > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${storageHealth.percentage}%` }}></div>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-slate-350">{storageHealth.percentage}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* SUB TAB SELECTOR PILLS */}
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl mb-2 gap-1.5 w-fit border border-slate-200 dark:border-slate-700/50">
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
                          ? 'bg-white dark:bg-slate-900 dark:bg-slate-700 text-indigo-650 dark:text-indigo-300 shadow-sm border border-slate-100 dark:border-slate-800 dark:border-slate-650'
                          : 'text-slate-505 hover:text-slate-700 dark:text-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                      <span>{subTab.label}</span>
                      {pendingCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-rose-500 text-white rounded-full font-black animate-pulse">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {adminSubTab === 'features' && (
                <div className="space-y-6">
                  {/* PLAN & FEATURE CONTROL SECTION */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-premium space-y-5">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 dark:text-slate-250 border-b border-slate-50 dark:border-slate-800 pb-3 flex items-center gap-2">
                      <Sliders className="w-4.5 h-4.5 text-indigo-500" />
                      <span>SaaS Plan & Feature control</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-550 dark:text-slate-300">
                      <div>
                        <label className="block mb-1.5 text-slate-400 uppercase text-[9px] font-black tracking-wider">Free Monthly Invoice Limit</label>
                        <input
                          type="number"
                          value={freeInvoiceLimit}
                          onChange={(e) => setFreeInvoiceLimit(Math.max(1, parseInt(e.target.value) || 15))}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white font-extrabold"
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
                          <label className="block mb-1.5 text-slate-400 uppercase text-[9px] font-black tracking-wider">{feat.label}</label>
                          <select
                            value={feat.state}
                            onChange={(e) => feat.setter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-805 dark:text-white font-bold"
                          >
                            <option value="Free">Free (Standard tier allowed)</option>
                            <option value="Premium">Premium Only (Requires Growth upgrade)</option>
                          </select>
                        </div>
                      ))}

                      {/* Premium PDF Themes: locked to premium only */}
                      <div>
                        <label className="block mb-1.5 text-slate-400 uppercase text-[9px] font-black tracking-wider">Premium PDF Themes Tier</label>
                        <select
                          disabled
                          value="Premium"
                          className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 font-bold cursor-not-allowed"
                        >
                          <option value="Premium">Premium Only (Strict Lock)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Feature Policies</span>
                      </button>
                    </div>
                  </div>

                  {/* BANNERS & ANNOUNCEMENTS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-premium flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-xs font-black text-indigo-900 dark:text-indigo-300 mb-1 flex items-center gap-2 uppercase tracking-wide">
                          <Megaphone className="w-4 h-4 text-indigo-500" /> Global Announcement
                        </h3>
                        <p className="text-[9px] text-slate-400 font-medium mb-3">Broadcast platform messages to all user dashboards.</p>
                        <textarea
                          value={globalAnnouncement}
                          onChange={(e) => setGlobalAnnouncement(e.target.value)}
                          placeholder="Type announcement text..."
                          className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none h-20 text-slate-800 dark:text-slate-100 dark:text-white"
                        />
                      </div>
                      <button onClick={handleSave} className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all cursor-pointer dark:bg-indigo-950/20 dark:text-indigo-400">
                        Publish Banner
                      </button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-premium flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-xs font-black text-rose-900 dark:text-rose-300 mb-1 flex items-center gap-2 uppercase tracking-wide">
                          <Lock className="w-4 h-4 text-rose-500" /> Maintenance Mode Lock
                        </h3>
                        <p className="text-[9px] text-slate-400 font-medium mb-3">Shut down standard users workspace, presenting lock screen.</p>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-slate-250">Maintenance Lockout</span>
                          <button
                            onClick={() => setMaintenanceMode(!maintenanceMode)}
                            className={`w-10 h-5 rounded-full relative transition-colors duration-300 focus:outline-none ${maintenanceMode ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                          >
                            <div className={`w-3.5 h-3.5 bg-white dark:bg-slate-900 rounded-full absolute top-0.5 transition-all duration-300 ${maintenanceMode ? 'left-6' : 'left-0.5'}`}></div>
                          </button>
                        </div>
                      </div>
                      <button onClick={handleSave} className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer dark:bg-rose-950/20 dark:text-rose-450">
                        Apply lockout state
                      </button>
                    </div>
                  </div>

                  {/* DATABASE BACKUP AND RESTORE */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-100 dark:border-slate-800 shadow-premium space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 pb-3 flex items-center gap-2">
                      <Database className="w-4.5 h-4.5 text-indigo-500" />
                      <span>Platform Data Backup & Restore</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      Export your entire workspace (invoices, clients CRM catalog, overhead expenses, preferences) to a single local JSON file.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 py-3 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 font-bold text-xs rounded-2xl transition-all cursor-pointer dark:bg-indigo-950/20 dark:text-indigo-400"
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
                          className="flex items-center justify-center gap-2 py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl cursor-pointer transition-all text-center"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Import Database (JSON)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {adminSubTab === 'users' && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-premium space-y-5">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 dark:text-slate-250 border-b border-slate-50 dark:border-slate-800 pb-3 flex items-center gap-2">
                    <Users className="w-4.5 h-4.5 text-indigo-500" />
                    <span>Registered Users Directory</span>
                  </h3>

                  {loadingAdminData ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-slate-400 font-bold">Querying users list...</span>
                    </div>
                  ) : adminUsers.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-450 dark:text-slate-500 font-bold">
                      No users registered in this directory.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-850/60 text-slate-550 dark:text-slate-400 font-black uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
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
                            <tr key={user.userId} className="hover:bg-slate-50 dark:bg-slate-800/50/50 dark:hover:bg-slate-850/20 transition-all">
                              <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100 dark:text-slate-200">{user.email}</td>
                              <td className="p-3.5 text-slate-500 dark:text-slate-400">{user.businessName || '—'}</td>
                              <td className="p-3.5 text-slate-500 dark:text-slate-400">{user.country || 'India'}</td>
                              <td className="p-3.5">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${user.planStatus === 'premium'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-450'
                                    : 'bg-slate-105 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  }`}>
                                  {user.planStatus || 'free'}
                                </span>
                              </td>
                              <td className="p-3.5 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${user.blocked
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/25 dark:text-rose-455'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-450'
                                  }`}>
                                  {user.blocked ? 'Blocked' : 'Active'}
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => handleToggleBlock(user.userId, user.blocked)}
                                  className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer active:scale-95 transition-all ${user.blocked
                                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10'
                                      : 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/10'
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
                  )}
                </div>
              )}

              {adminSubTab === 'requests' && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-premium space-y-5">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 dark:text-slate-250 border-b border-slate-50 dark:border-slate-800 pb-3 flex items-center gap-2">
                    <CircleDollarSign className="w-4.5 h-4.5 text-indigo-500" />
                    <span>Manual Premium Upgrade Requests Queue</span>
                  </h3>

                  {loadingAdminData ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-slate-400 font-bold">Querying request logs...</span>
                    </div>
                  ) : adminRequests.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-450 dark:text-slate-500 font-bold">
                      No manual premium requests submitted.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {adminRequests.map((req) => (
                        <div
                          key={req.requestId}
                          className="p-5 border border-slate-100 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-800/50/50 dark:bg-slate-850/10 hover:shadow-md transition-all space-y-4"
                        >
                          {/* Top Row: User details & status */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                            <div>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-100 dark:text-slate-200 block">{req.userEmail}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                Request ID: {req.requestId} • {new Date(req.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${req.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-450'
                                  : req.status === 'Rejected'
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/25 dark:text-rose-455'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/25 dark:text-amber-450 animate-pulse'
                                }`}>
                                {req.status}
                              </span>
                            </div>
                          </div>

                          {/* Middle Section: Request specifics */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">Upgrade Plan</span>
                              <span className="text-slate-800 dark:text-slate-100 dark:text-slate-200 font-black">{req.plan}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">Amount Paid</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-black">{currency}{req.paidAmount}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">Method</span>
                              <span className="text-slate-800 dark:text-slate-100 dark:text-slate-200 font-bold">{req.paymentMethod}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">TXN Reference ID</span>
                              <span className="text-slate-805 dark:text-slate-200 font-mono font-bold select-all">{req.transactionId}</span>
                            </div>
                          </div>

                          {/* Screenshots & Rejection Reason */}
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-1">
                            {req.screenshotBase64 ? (
                              <div className="flex items-center gap-3">
                                <img
                                  src={req.screenshotBase64}
                                  alt="Thumbnail"
                                  className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-900 cursor-pointer hover:scale-105 transition-all"
                                  onClick={() => setSelectedScreenshot(req.screenshotBase64)}
                                />
                                <button
                                  type="button"
                                  onClick={() => setSelectedScreenshot(req.screenshotBase64)}
                                  className="text-[10px] text-teal-650 dark:text-teal-400 font-black hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  <span>View Receipt Proof</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 font-bold italic py-2">
                                No attachment proof uploaded.
                              </div>
                            )}

                            {req.status === 'Rejected' && req.rejectionReason && (
                              <div className="text-[10px] text-rose-600 dark:text-rose-450 font-bold bg-rose-50/30 dark:bg-rose-950/10 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/20 max-w-md w-full">
                                <span className="uppercase tracking-widest block text-[8px] text-rose-500 mb-1">Rejection Reason</span>
                                "{req.rejectionReason}"
                              </div>
                            )}

                            {req.status === 'Pending' && (
                              <div className="flex gap-2 w-full sm:w-auto sm:self-end">
                                <button
                                  onClick={() => handleOpenRejectModal(req.requestId)}
                                  className="flex-1 sm:flex-initial px-4 py-2 border border-rose-250 hover:bg-rose-50 text-rose-700 font-black text-[10px] rounded-xl uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleApproveRequest(req)}
                                  className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] rounded-xl shadow-md shadow-emerald-500/10 uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                                >
                                  Approve
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Side column: Real-Time Stats Overview & Wipes */}
            <div className="space-y-6">

              {/* REAL-TIME SYSTEM STATISTICS CARD */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 border border-slate-850 shadow-xl text-white">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Administration Overview</h3>
                    <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider block">Workspace scale totals</span>
                  </div>
                  <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase ${firebaseStatusColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${firebaseStatusDot} ${firebaseStatus === 'connected' ? 'animate-pulse' : ''}`}></span>
                    <FirebaseIcon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-white dark:bg-slate-900/5 border border-white/5 rounded-xl p-2.5">
                    <FileText className="w-4 h-4 text-indigo-300 mx-auto mb-1" />
                    <p className="text-lg font-black text-white">{totalInvoices}</p>
                    <span className="text-[8px] text-slate-400 uppercase font-black block">Invoices</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900/5 border border-white/5 rounded-xl p-2.5">
                    <Users className="w-4 h-4 text-cyan-300 mx-auto mb-1" />
                    <p className="text-lg font-black text-white">{totalCustomers}</p>
                    <span className="text-[8px] text-slate-400 uppercase font-black block">CRM Clients</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900/5 border border-white/5 rounded-xl p-2.5">
                    <Users className="w-4 h-4 text-indigo-300 mx-auto mb-1" />
                    <p className="text-lg font-black text-white">{adminUsers.length}</p>
                    <span className="text-[8px] text-slate-400 uppercase font-black block">Total Users</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900/5 border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 text-[10px] font-bold mt-1">
                      <span className="text-emerald-400">{adminUsers.filter(u => u.planStatus === 'premium').length}</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-slate-400">{adminUsers.filter(u => u.planStatus !== 'premium').length}</span>
                    </div>
                    <span className="text-[7px] text-slate-500 uppercase font-black block mt-0.5">Premium / Free</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900/5 border border-white/5 rounded-xl p-2.5 md:col-span-2">
                    <span className="text-[8px] text-slate-400 uppercase font-black block">Outstanding Dues</span>
                    <p className="text-base font-black text-amber-300 mt-0.5">{currency}{pendingPayments.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={handleForceSync}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-slate-900/10 hover:bg-white dark:bg-slate-900/20 text-white font-extrabold text-[10px] rounded-xl transition-all cursor-pointer border border-white/5"
                  >
                    <CloudLightning className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Sync Platform Cloud Data</span>
                  </button>
                </div>
              </div>

              {/* DANGER ZONE GRANULAR WIPES */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-rose-100 dark:border-rose-950/20 shadow-premium space-y-3.5">
                <h3 className="text-xs font-black text-rose-600 dark:text-rose-455 border-b border-rose-50 dark:border-rose-950/20 pb-3 flex items-center gap-2 uppercase tracking-wide">
                  <Trash2 className="w-4.5 h-4.5 text-rose-500" />
                  <span>Granular Data Wipes</span>
                </h3>
                <div className="space-y-2">
                  {['Invoices', 'Customers', 'Products', 'Expenses'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleGranularWipe(type)}
                      className="w-full flex items-center justify-between px-3.5 py-2 border border-rose-100 dark:border-rose-900/20 bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-700 dark:text-rose-400 font-extrabold text-[10px] rounded-xl transition-all cursor-pointer"
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
      )}

      {/* Lightbox for screenshots */}
      {selectedScreenshot && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="relative max-w-3xl max-h-[85vh] w-full flex flex-col items-center bg-slate-900 rounded-3xl p-4 overflow-hidden border border-slate-800">
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-4 right-4 bg-slate-800/80 hover:bg-slate-700 text-white font-bold p-2.5 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all"
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
            <p className="text-slate-400 text-xs font-semibold mt-4 tracking-wide">Click close or press ✕ to exit preview</p>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModalFor && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-rose-600 dark:text-rose-455 uppercase tracking-widest">Reject Upgrade Request</h3>
            <p className="text-xs text-slate-505 dark:text-slate-400 font-semibold leading-relaxed">
              Please specify the exact reason for rejecting this upgrade request. This reason will be stored in the request log for user visibility.
            </p>
            <textarea
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. Transaction ID could not be verified on bank records..."
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-800 dark:text-slate-100 dark:text-white"
              rows={3}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectionModalFor(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-750 text-slate-505 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-850 text-xs font-bold rounded-xl cursor-pointer"
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
      )}
    </div>
  );
};

export default Settings;
