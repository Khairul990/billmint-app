import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '../utils/animations';
import { CardSkeleton } from '../components/PremiumSkeleton';
import {
  Building2,
  MapPin,
  FileText,
  Save,
  Image as ImageIcon,
  Phone,
  Mail,
  User,
  Check,
  CheckCircle2,
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
  HardDrive,
  Lock,
  Trash2,
  CloudLightning,
  Globe,
  Languages,
  Sliders,
  Sparkles,
  Link,
  Info,
  Smartphone,
  Search,
  AlertCircle,
  X,
  Star,
  Bell,
  Shield,
  CreditCard,
  Puzzle,
  Settings2,
  Volume2,
  MessageCircle,
  ShieldCheck,
  Key,
  Zap,
  Headphones
} from 'lucide-react';

import {
  exportBackup,
  getAuthSession,
  clearInvoices,
  clearCustomers,
  clearProducts,
  clearExpenses,
  getStorageUsage,
  cleanDuplicateDrafts,
  cleanTemporaryData,
  clearCacheOnly,
  clearAllLocalData,
  emptyTrash,
  resetAccountKeepAuth
} from '../services/dbEngine';
import { firebaseReady } from '../services/firebaseConfig';
import { toast } from 'react-hot-toast';

const compressImage = (file, maxWidth = 400) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/webp', 0.8);
        resolve(compressedBase64);
      };
    };
  });
};

const ALL_THEMES = [
  { id: 'obsidian-gold', name: 'Obsidian Gold', category: 'Premium', gradient: 'linear-gradient(90deg, #B8860B, #1F2937, #FFF9EC)' },
  { id: 'arctic-teal', name: 'Arctic Teal', category: 'Business', gradient: 'linear-gradient(90deg, #009E7F, #0F766E, #F4FFFD)' },
  { id: 'sapphire-noir', name: 'Sapphire Noir', category: 'Business', gradient: 'linear-gradient(90deg, #2563EB, #1E3A8A, #F7FAFF)' },
  { id: 'rose-platinum', name: 'Rose Platinum', category: 'Premium', gradient: 'linear-gradient(90deg, #C75C75, #8B3A4A, #FFF7FA)' },
  { id: 'carbon-violet', name: 'Carbon Violet', category: 'Business', gradient: 'linear-gradient(90deg, #7C3AFF, #4C1D95, #FAF7FF)' },
  { id: 'graphite-copper', name: 'Graphite Copper', category: 'Premium', gradient: 'linear-gradient(90deg, #B76535, #4B2A1A, #FFF8F2)' },
  { id: 'arctic-diamond', name: 'Arctic Diamond', category: 'Light', gradient: 'linear-gradient(90deg, #60A5FA, #CBD5E1, #F3F7FC)' },
  { id: 'emerald-royal', name: 'Emerald Royal', category: 'Premium', gradient: 'linear-gradient(90deg, #10B981, #D4AF37, #F0FDF4)' },
  { id: 'midnight-ruby', name: 'Midnight Ruby', category: 'Premium', gradient: 'linear-gradient(90deg, #C0392B, #7F1D1D, #FFF1F2)' },
  { id: 'titanium-blue', name: 'Titanium Blue', category: 'Business', gradient: 'linear-gradient(90deg, #2563EB, #94A3B8, #F8FAFC)' },
  { id: 'pink-blossom', name: 'Pink Blossom', category: 'Light', gradient: 'linear-gradient(90deg, #F472B6, #EC4899, #FFF1F2)' },
  { id: 'ocean-waves', name: 'Ocean Waves', category: 'Business', gradient: 'linear-gradient(90deg, #0EA5E9, #0284C7, #F0F9FF)' },
  { id: 'lush-green', name: 'Lush Green', category: 'Business', gradient: 'linear-gradient(90deg, #22C55E, #16A34A, #F0FDF4)' },
  { id: 'sunset-orange', name: 'Sunset Orange', category: 'Business', gradient: 'linear-gradient(90deg, #F97316, #EA580C, #FFF7ED)' },
  { id: 'midnight-blue', name: 'Midnight Blue', category: 'Dark', gradient: 'linear-gradient(90deg, #1E3A5F, #0F1B2D, #F8FAFC)' },
  { id: 'royal-purple', name: 'Royal Purple', category: 'Business', gradient: 'linear-gradient(90deg, #A855F7, #7C3AED, #FAF5FF)' },
  { id: 'crimson-red', name: 'Crimson Red', category: 'Business', gradient: 'linear-gradient(90deg, #DC2626, #B91C1C, #FEF2F2)' },
  { id: 'slate-gray', name: 'Slate Gray', category: 'Dark', gradient: 'linear-gradient(90deg, #64748B, #475569, #F8FAFC)' },
  { id: 'warm-amber', name: 'Warm Amber', category: 'Business', gradient: 'linear-gradient(90deg, #D97706, #B45309, #FFFBEB)' },
  { id: 'cyber-teal', name: 'Cyber Teal', category: 'Business', gradient: 'linear-gradient(90deg, #14B8A6, #0D9488, #F0FDFA)' },
  { id: 'soft-lavender', name: 'Soft Lavender', category: 'Light', gradient: 'linear-gradient(90deg, #C4B5FD, #A78BFA, #FAF5FF)' },
  { id: 'ocean-deep', name: 'Ocean Deep', category: 'Dark', gradient: 'linear-gradient(90deg, #1D4ED8, #1E40AF, #EFF6FF)' },
  { id: 'forest-pine', name: 'Forest Pine', category: 'Dark', gradient: 'linear-gradient(90deg, #047857, #065F46, #ECFDF5)' },
  { id: 'cherry-blossom', name: 'Cherry Blossom', category: 'Light', gradient: 'linear-gradient(90deg, #F43F5E, #E11D48, #FFF1F2)' },
  { id: 'gold-coast', name: 'Gold Coast', category: 'Premium', gradient: 'linear-gradient(90deg, #F59E0B, #D97706, #FFFBEB)' }
];

const THEME_CATEGORIES = ['All', 'Light', 'Dark', 'Premium', 'Business'];

const getThemePreviewColors = (preset) => {
  const isDark = document.documentElement.classList.contains('dark');

  const themes = {
    pink: {
      background: isDark ? '#130D26' : '#FFFFFF',
      sidebar: isDark ? '#06030A' : '#1E122A',
      card: isDark ? '#130D26' : '#FFFFFF',
      text: isDark ? '#FDF4F8' : '#1C0A14',
      muted: isDark ? '#A38496' : '#825D71',
      accent: isDark ? '#F472B6' : '#EC4899',
      border: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.15)',
      headerColor: isDark ? '#FDF4F8' : '#1C0A14',
      tableHeaderBg: isDark ? '#1A0F2E' : '#FDE8EF',
      totalBg: isDark ? '#120A1F' : '#FAEDF0'
    },
    blue: {
      background: isDark ? '#121A27' : '#FFFFFF',
      sidebar: isDark ? '#04070B' : '#0B1727',
      card: isDark ? '#121A27' : '#FFFFFF',
      text: isDark ? '#F8FAFC' : '#0F172A',
      muted: isDark ? '#94A3B8' : '#64748B',
      accent: isDark ? '#60A5FA' : '#3B82F6',
      border: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.15)',
      headerColor: isDark ? '#F8FAFC' : '#0F172A',
      tableHeaderBg: isDark ? '#162032' : '#EBF1F8',
      totalBg: isDark ? '#0D1421' : '#F4F7FB'
    },
    emerald: {
      background: isDark ? '#051A13' : '#FFFFFF',
      sidebar: isDark ? '#010A07' : '#064E3B',
      card: isDark ? '#051A13' : '#FFFFFF',
      text: isDark ? '#ECFDF5' : '#022C22',
      muted: isDark ? '#6EE7B7' : '#059669',
      accent: isDark ? '#34D399' : '#10B981',
      border: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)',
      headerColor: isDark ? '#ECFDF5' : '#022C22',
      tableHeaderBg: isDark ? '#06281C' : '#D1FAE5',
      totalBg: isDark ? '#031F15' : '#ECFDF5'
    },
    purple: {
      background: isDark ? '#150A24' : '#FFFFFF',
      sidebar: isDark ? '#050209' : '#1B0F2A',
      card: isDark ? '#150A24' : '#FFFFFF',
      text: isDark ? '#F5F3FA' : '#231139',
      muted: isDark ? '#A79BB8' : '#7E6B97',
      accent: isDark ? '#A78BFA' : '#8B5CF6',
      border: isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(139, 92, 246, 0.15)',
      headerColor: isDark ? '#F5F3FA' : '#231139',
      tableHeaderBg: isDark ? '#1D0F30' : '#F5F3FA',
      totalBg: isDark ? '#140A21' : '#FDFBFF'
    },
    rose: {
      background: isDark ? '#2A1C1A' : '#FFFFFF',
      sidebar: isDark ? '#0E0908' : '#2E1B1A',
      card: isDark ? '#2A1C1A' : '#FFFFFF',
      text: isDark ? '#FFF3EC' : '#3E2422',
      muted: isDark ? '#C09A8F' : '#A37E7B',
      accent: isDark ? '#FB7185' : '#E11D48',
      border: isDark ? 'rgba(251, 113, 133, 0.15)' : 'rgba(244, 63, 94, 0.2)',
      headerColor: isDark ? '#FFF3EC' : '#3E2422',
      tableHeaderBg: isDark ? '#362522' : '#FDEEE6',
      totalBg: isDark ? '#251917' : '#FFF9F6'
    }
  };
  return themes[preset] || themes.blue;
};

const SETTINGS_GROUPS = [
  {
    group: 'General',
    items: [
      { id: 'business', label: 'Business Profile', icon: Building2, description: 'Company name, logo, owner, contact info' },
      { id: 'workspace', label: 'Workspace', icon: Globe, description: 'Country, language, currency, app install' },
      { id: 'team', label: 'Team & Access', icon: Users, description: 'Invite cashiers, manage permissions' }
    ]
  },
  {
    group: 'Billing',
    items: [
      { id: 'payment', label: 'Payment Settings', icon: QrCode, description: 'UPI, bKash, Nagad, bank details, QR codes' },
      { id: 'collection', label: 'Collection Settings', icon: CircleDollarSign, description: 'Invoice prefs, live links, payment proof' },
      { id: 'subscription', label: 'Subscription', icon: CreditCard, description: 'Plan, billing history, upgrade' }
    ]
  },
  {
    group: 'Design',
    items: [
      { id: 'themes', label: 'Themes', icon: Palette, description: 'Brand colors, dark mode, presets' },
      { id: 'templates', label: 'PDF Templates', icon: LayoutTemplate, description: 'Invoice layouts, PDF fields' },
      { id: 'live-links', label: 'Live Link Templates', icon: Link, description: 'Customer portal appearance' }
    ]
  },
  {
    group: 'Communication',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email, WhatsApp, reminders, alerts' },
      { id: 'integrations', label: 'Integrations', icon: Puzzle, description: 'AI, Twilio, third-party services' }
    ]
  },
  {
    group: 'Security',
    items: [
      { id: 'security', label: 'Security', icon: Shield, description: 'API keys, session, database provider' },
      { id: 'backup', label: 'Backup & Restore', icon: Database, description: 'Export, restore, storage, reset' }
    ]
  },
  {
    group: 'System',
    items: [
      { id: 'advanced', label: 'Advanced', icon: Settings2, description: 'Team, UX, danger zone tools' }
    ]
  }
];

const ALL_CATEGORY_IDS = ['business', 'workspace', 'team', 'payment', 'collection', 'subscription', 'themes', 'templates', 'live-links', 'notifications', 'integrations', 'security', 'backup', 'advanced'];

const ToggleSwitch = ({ enabled, onChange, label, description }) => (
  <div className="flex items-start justify-between p-4 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-2xl gap-3">
    <div className="flex-1 min-w-0">
      <span className="text-xs font-bold text-theme-primary dark:text-theme-secondary block">{label}</span>
      {description && (
        <span className="text-[9px] text-theme-muted dark:text-theme-muted font-semibold mt-0.5 block">{description}</span>
      )}
    </div>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={'relative w-12 h-6 rounded-full transition-all duration-500 ease-in-out shadow-inner flex items-center p-1 shrink-0 focus:outline-none ' + (enabled ? 'bg-[image:var(--accent-gradient)] shadow-md shadow-theme-accent/30' : 'bg-slate-300 dark:bg-slate-700/60 border border-slate-400/20 dark:border-white/5')}
    >
      <span className={'w-4 h-4 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-in-out ' + (enabled ? 'translate-x-6' : 'translate-x-0')} />
    </button>
  </div>
);

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
  const [activeCategory, setActiveCategory] = useState('business');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  const [storageInfo, setStorageInfo] = useState(null);

  useEffect(() => {
    if (activeCategory === 'backup') {
      try {
        setStorageInfo(getStorageUsage());
      } catch (e) {

      }
    }
  }, [activeCategory]);

  const handleCleanTemporaryData = async () => {
    if (window.confirm("Are you sure you want to clean temporary data? (Logs, 7-day old sync queue items)")) {
      const removed = await cleanTemporaryData();
      toast.success('Temporary data cleaned. Removed ' + removed + ' items.');
      setStorageInfo(getStorageUsage());
    }
  };

  const handleCleanDuplicateDrafts = async () => {
    if (window.confirm("Are you sure you want to clean duplicate zero-amount drafts? Real invoices will NOT be deleted.")) {
      const removed = await cleanDuplicateDrafts();
      toast.success('Duplicate drafts cleaned. Removed ' + removed + ' items.');
      setStorageInfo(getStorageUsage());
    }
  };

  const handleClearCacheOnly = () => {
    if (window.confirm("This will clear LocalStorage cache. Real data stays in IndexedDB. Proceed?")) {
      clearCacheOnly();
      toast.success('Cache cleared! Please refresh the page.');
      setStorageInfo(getStorageUsage());
    }
  };

  const handleClearAllLocalData = async () => {
    if (window.confirm("CRITICAL WARNING: This will completely wipe ALL local data including IndexedDB, Cache, and LocalStorage. You will be logged out. Are you absolutely sure?")) {
      await clearAllLocalData();
      toast.success('All local app data cleared! Logging out...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  };

  const handleEmptyTrash = async () => {
    if (window.confirm("Are you sure you want to PERMANENTLY delete all invoices currently in the Trash? This cannot be undone.")) {
      const res = await emptyTrash();
      toast.success('Successfully deleted ' + res.count + ' trash invoices forever.');
      setStorageInfo(getStorageUsage());
    }
  };

  const [dbProvider, setDbProvider] = useState(() => localStorage.getItem('billmint_db_provider') || 'firebase');
  const handleSetDbProvider = (provider) => {
    setDbProvider(provider);
    localStorage.setItem('billmint_db_provider', provider);
    toast.success('Database provider updated to: ' + provider);
  };

  const [themeColor, setThemeColor] = useState('light');
  const [darkMode, setDarkMode] = useState(false);

  // Business Profile States
  const [businessName, setBusinessName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');

  // Regional Settings States
  const [country, setCountry] = useState('India');
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('\u20B9');
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
  const [brandColor, setBrandColor] = useState('#14b8a6');
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

  // Premium UX Settings (Phase 6)
  const [enableHaptics, setEnableHaptics] = useState(true);
  const [enableSounds, setEnableSounds] = useState(true);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [dueDateReminders, setDueDateReminders] = useState(true);
  const [paymentConfirmation, setPaymentConfirmation] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  const [showToast, setShowToast] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [themeSearch, setThemeSearch] = useState('');
  const [themeCategory, setThemeCategory] = useState('All');
  const [favoriteThemes, setFavoriteThemes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('billqyro_favorite_themes') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('billqyro_favorite_themes', JSON.stringify(favoriteThemes));
  }, [favoriteThemes]);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0 && !isInitialized.current) {
      isInitialized.current = true;
      setBusinessName(settings.businessName || '');
      setLogoUrl(settings.logoUrl || '');
      setOwnerName(settings.ownerName || '');
      setPhone(settings.phone || '');
      setWhatsapp(settings.whatsapp || '');
      setEmail(settings.email || '');
      setAddress(settings.address || '');
      setGstNumber(settings.gstNumber || '');
      setGeminiApiKey(settings.geminiApiKey || '');
      setTwilioAccountSid(settings.twilioAccountSid || '');
      setTwilioAuthToken(settings.twilioAuthToken || '');

      setCountry(settings.country || 'India');
      setLanguage(settings.language || 'English');
      setCurrency(settings.currency || '\u20B9');
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

      setEnableHaptics(settings.enableHaptics !== false);
      setEnableSounds(settings.enableSounds !== false);
      setThemeColor(settings.themeColor || (settings.themePreset === 'dark' ? 'light' : settings.themePreset) || 'light');
      setDarkMode(settings.darkMode ?? (settings.themePreset === 'dark') ?? false);

      if (settings.notifications) {
        setEmailNotifications(settings.notifications.email !== false);
        setWhatsappNotifications(settings.notifications.whatsapp !== false);
        setDueDateReminders(settings.notifications.dueDateReminders !== false);
        setPaymentConfirmation(settings.notifications.paymentConfirmation !== false);
        setMarketingEmails(settings.notifications.marketing || false);
        setSecurityAlerts(settings.notifications.securityAlerts !== false);
      }
    }
  }, [settings]);
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setIsLoading(false);
    } else {
      const timer = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [settings]);

  useEffect(() => {
    if (!isInitialized.current) return;
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    const allCats = SETTINGS_GROUPS.flatMap(g => g.items);
    const match = allCats.find(cat =>
      cat.label.toLowerCase().includes(q) ||
      cat.id.includes(q) ||
      cat.description.toLowerCase().includes(q)
    );
    if (match) {
      setActiveCategory(match.id);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!isInitialized.current) return;
    setIsDirty(true);
  }, [
    businessName, ownerName, phone, whatsapp, email, address, gstNumber,
    geminiApiKey, twilioAccountSid, twilioAuthToken,
    country, language, currency, currencyCode, taxLabel, vatTax, dateFormat, numberFormat,
    invoicePrefix, defaultTax, defaultNotes, terms, pdfFooter, brandColor, invoiceTemplate, defaultBillingTemplate,
    upiId, bkashNumber, nagadNumber, rocketNumber, payeeName, paymentNote, paymentQrEnabled, paymentMethod,
    customPaymentLink, showQrInPdf, showQrInPreview,
    enableLiveLink, showPaymentQrOnLink, allowPdfDownload, allowPaymentProofSubmit,
    showPaidDueAmount, showContactButton, requireTransactionId, requirePaymentScreenshot,
    enableHaptics, enableSounds, themeColor, darkMode, logoUrl,
    emailNotifications, whatsappNotifications, dueDateReminders, paymentConfirmation,
    marketingEmails, securityAlerts
  ]);

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    if (!businessName) {
      alert('Please specify a Business Name.');
      setIsSaving(false);
      return;
    }

    if (paymentQrEnabled) {
      if (paymentMethod === 'UPI' && !upiId.trim()) {
        alert('Please specify your UPI ID.');
        setIsSaving(false);
        return;
      }
      if (paymentMethod === 'bKash' && !bkashNumber.trim()) {
        alert('Please specify your bKash Number.');
        setIsSaving(false);
        return;
      }
      if (paymentMethod === 'Nagad' && !nagadNumber.trim()) {
        alert('Please specify your Nagad Number.');
        setIsSaving(false);
        return;
      }
      if (paymentMethod === 'Manual' && !customPaymentLink.trim()) {
        alert('Please specify your Custom Payment Link / QR Text.');
        setIsSaving(false);
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
      geminiApiKey,
      twilioAccountSid,
      twilioAuthToken,

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

      themeColor,
      themePreset: themeColor,
      darkMode,
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

      notifications: {
        email: emailNotifications,
        whatsapp: whatsappNotifications,
        dueDateReminders,
        paymentConfirmation,
        marketing: marketingEmails,
        securityAlerts
      }
    };

    onSaveSettings(payload);
    setIsDirty(false);

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setIsSaving(false);
    }, 3500);
  };

  const handleExport = async () => {
    try {
      const data = await exportBackup();
      const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(
        JSON.stringify(data, null, 2)
      );
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);

      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('download', 'billqyro-full-backup-' + dateStr + '.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      alert('Export failed: ' + error.message);
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
          toast.success('Database successfully restored from backup!');
        } else {
          toast.error('Import feature not properly wired in the system.');
        }
      } catch (error) {
        alert('Failed to import backup: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('CAUTION: This will wipe out all invoices, customers, and catalog items, replacing them with default demo assets. Proceed?')) {
      onResetDemo();
      toast.success('Database successfully reset to demo data!');
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
      setCurrency('\u20B9');
      setCurrencyCode('INR');
      setTaxLabel('GST');
      setPaymentMethod('UPI');
      setDateFormat('DD/MM/YYYY');
      setNumberFormat('Indian');
      setDefaultTax(18);
    } else if (selectedCountry === 'Bangladesh') {
      setCurrency('\u09F3');
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
    const confirmText = 'CAUTION: This will permanently wipe out all ' + type + ' from the database. This action is not reversible. Proceed?';
    if (window.confirm(confirmText)) {
      if (type === 'Invoices') clearInvoices();
      if (type === 'Customers') clearCustomers();
      if (type === 'Products') clearProducts();
      if (type === 'Expenses') clearExpenses();
      toast.success(type + ' have been completely wiped.');
      window.location.reload();
    }
  };

  const handleExportData = async () => {
    try {
      await exportBackup();
      toast.success('Backup exported successfully');
    } catch (e) {
      toast.error('Failed to export backup');
    }
  };

  const handleImportData = async (e) => {
    toast.error('Import is not fully implemented in this view yet.');
  };

  const handleForceSync = () => {
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
    toast.success('Forced local data to sync with Cloud (if configured).');
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
    connected: 'bg-theme-accent-light text-theme-accent border-theme-border-soft dark:bg-theme-accent/10 dark:text-theme-accent dark:border-theme-accent/30',
    offline: 'bg-theme-warning/5 text-theme-warning border-theme-warning/30 dark:bg-theme-warning/5 dark:text-theme-warning dark:border-theme-warning/30',
    'not-configured': 'bg-theme-app dark:bg-theme-surface text-theme-muted border-theme-border-soft dark:bg-theme-surface/40 dark:text-theme-muted dark:border-theme-border-soft',
  }[firebaseStatus];

  const firebaseStatusDot = {
    connected: 'bg-theme-accent',
    offline: 'bg-theme-warning',
    'not-configured': 'bg-slate-400',
  }[firebaseStatus];

  const FirebaseIcon = {
    connected: Wifi,
    offline: WifiOff,
    'not-configured': ServerOff,
  }[firebaseStatus];

  const isSearching = searchQuery.trim().length > 0;
  const filteredGroups = SETTINGS_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(cat => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        cat.label.toLowerCase().includes(q) ||
        cat.id.includes(q) ||
        cat.description.toLowerCase().includes(q)
      );
    })
  })).filter(group => group.items.length > 0);
  const effectiveActiveCategory = isSearching ? (
    filteredGroups.flatMap(g => g.items).find(cat => cat.id === activeCategory) ? activeCategory : (filteredGroups.flatMap(g => g.items)[0]?.id || 'business')
  ) : activeCategory;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-7xl mx-auto pb-28 relative font-sans text-theme-primary dark:text-theme-secondary"
    >
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="skeleton-block w-8 h-8 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-line w-48 h-5" />
              <div className="skeleton-line w-64 h-3" />
            </div>
          </div>
          <CardSkeleton lines={4} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={5} />
        </div>
      )}

      {!isLoading && (
      <>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-[image:var(--accent-gradient)] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-top-4 fade-in duration-300 border border-white/10">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">All settings saved successfully</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-theme-primary dark:text-theme-primary tracking-tight">Settings</h1>
          <p className="text-xs text-theme-muted dark:text-theme-muted font-medium mt-0.5">Configure your business, workspace, and preferences.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[10px] text-theme-muted font-semibold">Ctrl+S to save</span>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-premium flex items-center justify-center gap-2 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 font-bold text-xs px-6 py-3 rounded-xl shadow-glow active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Settings Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search settings sections..."
          className="input-premium w-full pl-10 pr-4 py-3.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-medium text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex gap-6 flex-col lg:flex-row">

        {/* Sidebar Navigation */}
        <div className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-4 space-y-3 bg-theme-surface dark:bg-theme-card/60 p-2 rounded-2xl border border-theme-border-soft dark:border-theme-border-soft">
            {filteredGroups.map((group) => (
              <div key={group.group}>
                <div className="px-3 py-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-theme-muted/60">{group.group}</span>
                </div>
                {group.items.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = effectiveActiveCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-left group ' + (
                        isSelected
                          ? 'bg-[image:var(--accent-gradient)] text-white shadow-md shadow-theme-accent/20'
                          : 'text-theme-muted hover:text-theme-primary hover:bg-theme-card dark:hover:bg-theme-surface/60'
                      )}
                    >
                      <Icon className={'w-4 h-4 shrink-0 ' + (isSelected ? 'text-white' : 'text-theme-muted group-hover:text-theme-accent')} />
                      <div className="min-w-0">
                        <span className={'text-[11px] font-bold block leading-tight ' + (isSelected ? 'text-white' : '')}>{cat.label}</span>
                        {isSelected && (
                          <span className="text-[8px] text-white/70 font-medium block truncate">{cat.description}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ============ BUSINESS ============ */}
          {activeCategory === 'business' && (
            <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
              <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="section-header-title">Business Profile</h2>
                    <p className="section-header-subtitle">Manage your business identity — company name, owner details, logo, and contact information that appears on every invoice.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Registered Business Name</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. BillQyro Technologies"
                    className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Owner Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted"><User className="w-4 h-4" /></span>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="input-premium w-full pl-10 pr-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Business Logo</label>
                  <div
                    className={'relative border-2 border-dashed rounded-xl p-4 text-center transition-all ' + (isDragging ? 'border-theme-accent bg-theme-accent-light dark:bg-teal-950/20' : 'border-theme-border-soft bg-theme-app dark:bg-theme-surface hover:bg-theme-surface dark:bg-theme-card dark:border-theme-border-soft dark:bg-theme-surface/40 dark:hover:bg-theme-surface/60')}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) {
                        const compressedBase64 = await compressImage(file);
                        setLogoUrl(compressedBase64);
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file && file.type.startsWith('image/')) {
                          const compressedBase64 = await compressImage(file);
                          setLogoUrl(compressedBase64);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <Upload className="w-5 h-5 text-theme-muted" />
                      <span className="text-xs font-bold text-theme-muted dark:text-theme-muted">Drag & drop logo, or click to browse</span>
                    </div>
                  </div>

                  <div className="mt-3 relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted"><ImageIcon className="w-3.5 h-3.5" /></span>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="Or paste logo image URL..."
                      className="input-premium w-full pl-9 pr-4 py-2 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-accent dark:text-theme-accent font-medium text-xs"
                    />
                  </div>

                  {logoUrl && (
                    <div className="mt-3 relative inline-block group">
                      <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain rounded-lg border border-theme-border-soft dark:border-theme-border-soft p-1 bg-theme-card dark:bg-theme-card" onError={(e) => e.target.style.display = 'none'} />
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="absolute -top-2 -right-2 bg-theme-danger text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 00000"
                      className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">WhatsApp Link Number</label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+91 98765 00000"
                      className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-medium"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Contact Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted"><Mail className="w-4 h-4" /></span>
                    <input
                      type="email"
                      value={loggedInEmail}
                      readOnly
                      title="Contact email is locked to your verified Google account identity for security."
                      className="w-full pl-10 pr-20 py-3 bg-theme-surface/50 dark:bg-theme-card/40 border border-theme-border-soft dark:border-theme-border-soft/50 rounded-xl focus:outline-none text-theme-muted dark:text-theme-muted font-medium cursor-not-allowed opacity-90 shadow-inner"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="bg-theme-success/10 dark:bg-theme-success/10 text-theme-success dark:text-theme-success border border-theme-success/30 dark:border-theme-success/30 text-[9px] font-extrabold uppercase px-2 py-1 rounded-lg tracking-wider flex items-center gap-1 shadow-sm">
                        <Check className="w-2.5 h-2.5" /> Verified
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Corporate Address</label>
                  <div className="relative">
                    <span className="absolute top-3.5 left-3.5 text-theme-muted"><MapPin className="w-4 h-4" /></span>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Full office address details..."
                      rows="2"
                      className="input-premium w-full pl-10 pr-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-medium resize-none text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ============ WORKSPACE ============ */}
          {activeCategory === 'workspace' && (
            <>
              {/* Regional Settings */}
              <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
                <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="section-header-title">Regional Settings</h2>
                      <p className="section-header-subtitle">Configure country-specific currency, tax labels, date formats, and number notations for regionally accurate invoices.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Workspace Country</label>
                    <select
                      value={country}
                      onChange={(e) => handleCountryAutoConfigure(e.target.value)}
                      className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
                    >
                      <option value="India">🇮🇳 India</option>
                      <option value="Bangladesh">🇧🇩 Bangladesh</option>
                      <option value="Other">🌐 Other / General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Interface UI Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
                    >
                      <option value="English">English</option>
                      <option value="Bengali">Bengali (বাংলা)</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                    </select>
                    <p className="text-[9px] text-theme-muted mt-1 font-semibold">Language controls interface UI labels. Country controls calculations/payment options.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Currency Symbol</label>
                    <input
                      type="text"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      placeholder="e.g. ₹, ৳, $, €"
                      className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Currency Code</label>
                    <input
                      type="text"
                      value={currencyCode}
                      onChange={(e) => setCurrencyCode(e.target.value)}
                      placeholder="e.g. INR, BDT, USD"
                      className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Tax Label</label>
                    <div className="tooltip-premium" title="Choose the tax terminology used on invoices.">
                      <select
                        value={['GST', 'VAT', 'Tax', 'None'].includes(taxLabel) ? taxLabel : 'Custom'}
                        onChange={(e) => { if (e.target.value !== 'Custom') setTaxLabel(e.target.value); }}
                        className="w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold mb-2"
                      >
                        <option value="GST">GST</option>
                        <option value="VAT">VAT</option>
                        <option value="Tax">Tax</option>
                        <option value="None">None</option>
                        <option value="Custom">Custom (Type below)</option>
                      </select>
                      {(!['GST', 'VAT', 'Tax', 'None'].includes(taxLabel) || taxLabel === 'Custom') && (
                        <input type="text" value={taxLabel === 'Custom' ? '' : taxLabel} onChange={(e) => setTaxLabel(e.target.value)} placeholder="Enter custom tax label..." className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold" />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Date Format</label>
                    <select
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 24/05/2026)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 05/24/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-05-24)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Number Format</label>
                    <div className="tooltip-premium" title="Controls how large numbers are displayed.">
                      <select
                        value={numberFormat}
                        onChange={(e) => setNumberFormat(e.target.value)}
                        className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
                      >
                        <option value="Indian">12,34,567.89 (Indian lakh/crore)</option>
                        <option value="Standard">1,234,567.89 (Standard international)</option>
                        <option value="European">1.234.567,89 (European standard)</option>
                      </select>
                    </div>
                  </div>

                  {country === 'Bangladesh' && (
                    <div>
                      <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Default VAT / Tax Rate (%)</label>
                      <input type="number" value={vatTax} onChange={(e) => setVatTax(e.target.value)} placeholder="e.g. 7.5" className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold" />
                    </div>
                  )}
                </div>
              </div>

              {/* PWA / App Install */}
              <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
                <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="section-header-title">Install BillQyro App</h2>
                      <p className="section-header-subtitle">Install as a standalone app for offline access and faster performance.</p>
                    </div>
                  </div>
                </div>

                {isAppInstalled ? (
                  <div className="p-6 bg-theme-accent-light dark:bg-theme-accent-light/20 border border-theme-accent/30 dark:border-theme-accent/60 rounded-3xl text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-tr from-theme-accent to-theme-accent-dark rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-glow">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-extrabold text-theme-primary dark:text-theme-primary">BillQyro App is Installed!</h3>
                    <p className="text-xs text-theme-muted dark:text-theme-muted max-w-md mx-auto leading-relaxed font-semibold">You are running the standalone application with high-performance local database caching and full offline capabilities.</p>
                  </div>
                ) : installPromptEvent ? (
                  <div className="p-6 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-3xl text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-tr from-theme-accent to-theme-accent-dark rounded-2xl flex items-center justify-center mx-auto shadow-glow text-white font-black text-xl">BQ</div>
                    <h3 className="text-lg font-extrabold text-theme-primary dark:text-theme-primary">BillQyro Standalone Application</h3>
                    <p className="text-xs text-theme-muted max-w-md mx-auto leading-relaxed font-semibold">Install BillQyro directly to your desktop or mobile home screen.</p>
                    <button type="button" onClick={onInstallApp} className="btn-premium inline-flex items-center gap-2 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 font-black text-xs px-6 py-4 rounded-2xl shadow-glow active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider animate-pulse">
                      <Download className="w-4 h-4" />
                      <span>Install BillQyro Now</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-5 bg-theme-warning/5 dark:bg-theme-warning/5 border border-theme-warning/30 dark:border-theme-warning/30 rounded-2xl flex gap-3">
                      <div className="p-2 bg-theme-card dark:bg-theme-card rounded-xl text-theme-warning shadow-xs h-fit"><Info className="w-5 h-5" /></div>
                      <div>
                        <h4 className="text-xs font-black text-theme-warning uppercase tracking-widest mb-1">Manual Installation Guide</h4>
                        <p className="text-[11px] font-semibold text-theme-muted leading-relaxed">Follow the instructions below to install manually.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-theme-app dark:bg-theme-surface/40 p-5 rounded-2xl border border-theme-border-soft space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-theme-surface dark:bg-theme-card text-[10px] font-black text-theme-muted uppercase">🍎 Apple iOS</div>
                        <ol className="text-xs text-theme-muted font-semibold space-y-2 list-decimal list-inside">
                          <li>Open in <strong className="text-theme-primary">Safari</strong>.</li>
                          <li>Tap <strong className="text-theme-primary">Share</strong> button.</li>
                          <li>Select <strong className="text-theme-primary">Add to Home Screen</strong>.</li>
                          <li>Tap <strong className="text-theme-accent font-black">Add</strong>.</li>
                        </ol>
                      </div>
                      <div className="bg-theme-app dark:bg-theme-surface/40 p-5 rounded-2xl border border-theme-border-soft space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-theme-surface dark:bg-theme-card text-[10px] font-black text-theme-muted uppercase">🤖 Android</div>
                        <ol className="text-xs text-theme-muted font-semibold space-y-2 list-decimal list-inside">
                          <li>Open in <strong className="text-theme-primary">Chrome</strong>.</li>
                          <li>Tap <strong className="text-theme-primary">Menu</strong> (three dots).</li>
                          <li>Select <strong className="text-theme-primary">Add to Home screen</strong>.</li>
                          <li>Tap <strong className="text-theme-accent font-black">Install</strong>.</li>
                        </ol>
                      </div>
                      <div className="bg-theme-app dark:bg-theme-surface/40 p-5 rounded-2xl border border-theme-border-soft space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-theme-surface dark:bg-theme-card text-[10px] font-black text-theme-muted uppercase">💻 Desktop</div>
                        <ol className="text-xs text-theme-muted font-semibold space-y-2 list-decimal list-inside">
                          <li>Open in <strong className="text-theme-primary">Chrome</strong> or <strong className="text-theme-primary">Edge</strong>.</li>
                          <li>Click the address bar <strong className="text-theme-primary">Install</strong> icon.</li>
                          <li>Click <strong className="text-theme-accent font-black">Install</strong>.</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {/* ============ THEMES ============ */}
          {activeCategory === 'themes' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="card-premium p-6">
                <div className="section-header">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="section-header-title">Brand Theme Studio</h2>
                      <p className="section-header-subtitle">Personalize your workspace and invoice output with curated color presets, light/dark mode, and interface language.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-premium p-5 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                    <input type="text" value={themeSearch} onChange={(e) => setThemeSearch(e.target.value)} placeholder="Search themes..." className="input-premium w-full pl-10 pr-4 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary" />
                    {themeSearch && <button onClick={() => setThemeSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"><X className="w-3.5 h-3.5" /></button>}
                  </div>
                  <span className="text-[10px] font-bold text-theme-muted whitespace-nowrap">{ALL_THEMES.filter(t => (themeCategory === 'All' || t.category === themeCategory) && t.name.toLowerCase().includes(themeSearch.toLowerCase())).length} themes</span>
                </div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                  {THEME_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setThemeCategory(cat)} className={'px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all chip-premium ' + (themeCategory === cat ? 'bg-theme-accent text-white shadow-md shadow-theme-accent/30' : 'bg-theme-app dark:bg-theme-surface text-theme-muted hover:text-theme-primary border border-theme-border-soft')}>{cat}</button>
                  ))}
                </div>
              </div>

              <div className="card-premium p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">All Themes</h3>
                  <span className="badge-premium text-[9px] font-black text-theme-muted bg-theme-card px-3 py-1 rounded-full border border-theme-border-soft">{ALL_THEMES.length} Available</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {ALL_THEMES.filter(t => (themeCategory === 'All' || t.category === themeCategory) && t.name.toLowerCase().includes(themeSearch.toLowerCase())).map((theme) => {
                    const isDefault = themeColor === theme.id;
                    const isFav = favoriteThemes.includes(theme.id);
                    return (
                      <motion.div key={theme.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className={'card-premium rounded-2xl overflow-hidden border-2 transition-all duration-300 relative group ' + (isDefault ? 'border-theme-accent shadow-md shadow-theme-accent/20' : 'border-theme-border-soft hover:border-theme-accent/40')}>
                        <div className="h-10 w-full" style={{ background: theme.gradient }} />
                        <button onClick={(e) => { e.stopPropagation(); setFavoriteThemes(prev => prev.includes(theme.id) ? prev.filter(id => id !== theme.id) : [...prev, theme.id]); }} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-black/40 z-10">
                          <Star className={'w-3 h-3 ' + (isFav ? 'text-amber-400 fill-amber-400' : 'text-white/70')} />
                        </button>
                        <div className="absolute top-1 left-1 flex gap-1">
                          {isDefault && <span className="bg-theme-accent text-white text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-sm badge-premium">Default</span>}
                        </div>
                        <div className="p-2.5">
                          <p className="text-[10px] font-extrabold text-theme-primary truncate">{theme.name}</p>
                          <span className="text-[8px] font-bold text-theme-muted uppercase tracking-wider">{theme.category}</span>
                        </div>
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-2xl">
                          <button onClick={() => { setThemeColor(theme.id); document.documentElement.setAttribute('data-theme', theme.id); import('../utils/themeIcon').then(m => m.updateFaviconForTheme(theme.id)); toast.success('Previewing ' + theme.name); }} className="px-2.5 py-1.5 bg-white/90 text-gray-900 text-[9px] font-black rounded-lg hover:bg-white transition-all">Preview</button>
                          <button onClick={() => { setThemeColor(theme.id); document.documentElement.setAttribute('data-theme', theme.id); import('../utils/themeIcon').then(m => m.updateFaviconForTheme(theme.id)); toast.success(theme.name + ' applied!'); }} className="px-2.5 py-1.5 bg-theme-accent text-white text-[9px] font-black rounded-lg hover:opacity-90 transition-all btn-premium">Apply</button>
                          <button onClick={(e) => { e.stopPropagation(); setFavoriteThemes(prev => prev.includes(theme.id) ? prev.filter(id => id !== theme.id) : [...prev, theme.id]); }} className={'px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all ' + (isFav ? 'bg-amber-400/90 text-white' : 'bg-white/90 text-gray-900 hover:bg-white')}><Star className={'w-3 h-3 ' + (isFav ? 'fill-white' : '')} /></button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="card-premium p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-theme-accent/20 flex items-center justify-center"><Star className="w-5 h-5 text-theme-accent" /></div>
                  <div>
                    <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Default Theme</h3>
                    <p className="text-[10px] text-theme-muted font-semibold">Current: {ALL_THEMES.find(t => t.id === themeColor)?.name || themeColor}</p>
                  </div>
                </div>
                <button onClick={() => { setThemeColor(themeColor); document.documentElement.setAttribute('data-theme', themeColor); import('../utils/themeIcon').then(m => m.updateFaviconForTheme(themeColor)); toast.success('"' + (ALL_THEMES.find(t => t.id === themeColor)?.name || themeColor) + '" set as default!'); }} className="btn-premium text-[10px] px-4 py-2 bg-theme-accent text-white"><Check className="w-3.5 h-3.5" /> Set as Default</button>
              </div>

              <div className="divider-premium h-px bg-gradient-to-r from-transparent via-theme-border-soft to-transparent my-2" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 space-y-5">
                  <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase text-theme-primary tracking-wider">Dark Mode</h3>
                      <p className="text-[10px] text-theme-muted font-medium">Use a dark aesthetic across your dashboard.</p>
                    </div>
                    <button type="button" onClick={() => { setDarkMode(!darkMode); if (!darkMode) { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); } }} className={'relative w-12 h-6 rounded-full transition-all duration-500 ease-in-out shadow-inner flex items-center p-1 focus:outline-none ' + (darkMode ? 'bg-[image:var(--accent-gradient)] shadow-md shadow-theme-accent/30' : 'bg-slate-300 dark:bg-slate-700/60 border border-slate-400/20 dark:border-white/5')}>
                      <span className={'w-4 h-4 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-in-out ' + (darkMode ? 'translate-x-6' : 'translate-x-0')} />
                    </button>
                  </div>

                  <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase text-theme-primary tracking-wider">Language</h3>
                      <p className="text-[10px] text-theme-muted font-medium">App interface language</p>
                    </div>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-lg px-3 py-1.5 text-xs font-bold text-theme-primary outline-none focus:ring-2 focus:ring-theme-accent/20 cursor-pointer">
                      <option value="en">English</option>
                      <option value="bn">Bengali (বাংলা)</option>
                      <option value="hi">Hindi (हिंदी)</option>
                    </select>
                  </div>

                  <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium space-y-5">
                    <h3 className="text-xs font-black uppercase text-theme-muted tracking-wider">Select Brand Color</h3>
                    <div className="space-y-3">
                      {[
                        { id: 'obsidian-gold', name: 'Obsidian Gold', desc: 'Ultra Premium Executive', colors: ['#B8860B', '#1F2937', '#FFF9EC', '#1A1A1A', '#6B5B3E'] },
                        { id: 'arctic-teal', name: 'Arctic Teal', desc: 'Clean Premium Business', colors: ['#009E7F', '#0F766E', '#F4FFFD', '#10201D', '#4B6F68'] },
                        { id: 'sapphire-noir', name: 'Sapphire Noir', desc: 'Financial Corporate', colors: ['#2563EB', '#1E3A8A', '#F7FAFF', '#0F172A', '#4B5D7A'] },
                        { id: 'rose-platinum', name: 'Rose Platinum', desc: 'Luxury Elegant', colors: ['#C75C75', '#8B3A4A', '#FFF7FA', '#2A1118', '#7A4B58'] },
                        { id: 'carbon-violet', name: 'Carbon Violet', desc: 'Modern Tech Startup', colors: ['#7C3AFF', '#4C1D95', '#FAF7FF', '#1E1238', '#67548A'] },
                        { id: 'graphite-copper', name: 'Graphite Copper', desc: 'Industrial Luxury', colors: ['#B76535', '#4B2A1A', '#FFF8F2', '#24130C', '#7A5642'] },
                        { id: 'arctic-diamond', name: 'Arctic Diamond', desc: 'Luxury White & Ice Blue', colors: ['#60A5FA', '#CBD5E1', '#F3F7FC', '#0F172A', '#64748B'] },
                        { id: 'emerald-royal', name: 'Emerald Royal', desc: 'Emerald & Gold Finance', colors: ['#10B981', '#D4AF37', '#F0FDF4', '#052E16', '#4B635A'] },
                        { id: 'midnight-ruby', name: 'Midnight Ruby', desc: 'Ruby Red Luxury', colors: ['#C0392B', '#7F1D1D', '#FFF1F2', '#2B0D0D', '#7C4A4A'] },
                        { id: 'titanium-blue', name: 'Titanium Blue', desc: 'Modern SaaS Stripe Style', colors: ['#2563EB', '#94A3B8', '#F8FAFC', '#0F172A', '#64748B'] }
                      ].map((preset) => {
                        const isSelected = themeColor === preset.id;
                        const lightColors = getThemePreviewColors(preset.id, 'light');
                        const darkColors = getThemePreviewColors(preset.id, 'dark');
                        return (
                          <button key={preset.id} type="button" title={preset.name + ': ' + preset.desc} onClick={() => { setThemeColor(preset.id); document.documentElement.setAttribute('data-theme', preset.id); import('../utils/themeIcon').then(m => m.updateFaviconForTheme(preset.id)); }}
                            className={'tooltip-premium w-full text-left rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer flex flex-col ' + (isSelected ? 'border-theme-accent bg-theme-accent/[0.03] shadow-premium ring-1 ring-theme-accent' : 'border-theme-border-soft/60 dark:border-theme-border-soft hover:border-theme-border-strong bg-theme-app/50 dark:bg-theme-surface hover:shadow-md')}>
                            <div className="flex w-full h-1.5 opacity-90">{preset.colors.map((c, i) => (<div key={i} className="flex-1 h-full" style={{ backgroundColor: c }}></div>))}</div>
                            <div className="p-4 w-full space-y-3">
                              <div className="flex justify-between items-center w-full">
                                <span className="text-xs font-extrabold text-theme-primary">{preset.name}</span>
                                {isSelected && <span className="w-4 h-4 rounded-full bg-theme-accent text-white flex items-center justify-center text-[8px] font-bold shadow-sm">✓</span>}
                              </div>
                              <p className="text-[10px] text-theme-muted font-semibold leading-relaxed">{preset.desc}</p>
                              <div className="mt-3 flex rounded-xl overflow-hidden border border-theme-border-soft shadow-inner">
                                <div className="flex-1 p-2 flex gap-1.5" style={{ backgroundColor: lightColors.background }}>
                                  <div className="w-5 rounded shadow-sm p-1 space-y-1" style={{ backgroundColor: lightColors.sidebar }}>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lightColors.accent }}></div>
                                    <div className="w-full h-0.5 rounded-full opacity-30" style={{ backgroundColor: lightColors.text }}></div>
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="w-full h-5 rounded shadow-sm p-1 flex items-end justify-center gap-0.5" style={{ backgroundColor: lightColors.card }}>
                                      <div className="w-1 h-2 rounded-t-sm" style={{ backgroundColor: lightColors.btnFrom }}></div>
                                      <div className="w-1 h-3 rounded-t-sm" style={{ backgroundColor: lightColors.btnTo }}></div>
                                      <div className="w-1 h-2 rounded-t-sm" style={{ backgroundColor: lightColors.btnFrom }}></div>
                                    </div>
                                    <div className="w-full h-2 rounded shadow-sm" style={{ background: 'linear-gradient(90deg, ' + lightColors.btnFrom + ', ' + lightColors.btnTo + ')' }}></div>
                                  </div>
                                </div>
                                <div className="flex-1 p-2 flex gap-1.5 border-l border-white/10" style={{ backgroundColor: darkColors.background }}>
                                  <div className="w-5 rounded shadow-sm p-1 space-y-1" style={{ backgroundColor: darkColors.sidebar }}>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: darkColors.accent }}></div>
                                    <div className="w-full h-0.5 rounded-full opacity-30" style={{ backgroundColor: darkColors.text }}></div>
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="w-full h-5 rounded shadow-sm p-1 flex items-end justify-center gap-0.5" style={{ backgroundColor: darkColors.card }}>
                                      <div className="w-1 h-2 rounded-t-sm" style={{ backgroundColor: darkColors.btnFrom }}></div>
                                      <div className="w-1 h-3 rounded-t-sm" style={{ backgroundColor: darkColors.btnTo }}></div>
                                      <div className="w-1 h-2 rounded-t-sm" style={{ backgroundColor: darkColors.btnFrom }}></div>
                                    </div>
                                    <div className="w-full h-2 rounded shadow-sm" style={{ background: 'linear-gradient(90deg, ' + darkColors.btnFrom + ', ' + darkColors.btnTo + ')' }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-theme-border-soft/80">
                      <button type="button" onClick={() => { document.documentElement.setAttribute('data-theme', themeColor); import('../utils/themeIcon').then(m => m.updateFaviconForTheme(themeColor)); toast.success('Previewing ' + themeColor + ' theme!'); }} className="btn-premium-outline w-full py-3 bg-theme-surface hover:bg-theme-border-soft/75 dark:bg-theme-card dark:hover:bg-theme-surface/80 text-theme-primary font-black text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer uppercase tracking-wider">Test UI Live Now</button>
                      <button type="button" onClick={() => handleSave(null)} disabled={isSaving} className="btn-premium w-full py-3 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 font-black text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-wider">{isSaving ? (<span className="inline-flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</span>) : 'Save Theme'}</button>
                      <button type="button" onClick={() => { setThemeColor('blue'); setDarkMode(false); const payload = { ...settings, themeColor: 'blue', darkMode: false, themePreset: 'blue', themeUpdatedAt: new Date().toISOString() }; onSaveSettings(payload); document.documentElement.setAttribute('data-theme', 'light'); import('../utils/themeIcon').then(m => m.updateFaviconForTheme('light')); document.documentElement.classList.remove('dark'); toast.success('Reset to BillQyro Classic default theme!'); }} className="w-full py-2 bg-transparent text-theme-muted hover:text-theme-danger text-[10px] font-bold text-center transition-all cursor-pointer block uppercase tracking-wider">Reset to BillQyro Classic</button>
                    </div>
                  </div>
                </div>

                <div className="divider-premium h-px bg-gradient-to-r from-transparent via-theme-border-soft to-transparent my-4 lg:hidden" />

                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium space-y-6">
                    <div>
                      <h3 className="text-xs font-black uppercase text-theme-muted tracking-wider">Theme Studio Live Mocks</h3>
                      <p className="text-[9px] text-theme-muted font-semibold leading-relaxed mt-0.5">Real-time visualization of presets applied to core panels</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {(() => { const colors = getThemePreviewColors(themeColor); return (
                        <div className="border border-theme-border-soft/60 rounded-2xl p-4 space-y-3 relative overflow-hidden flex flex-col justify-between" style={{ backgroundColor: colors.background }}>
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-theme-muted bg-theme-card/40 px-1.5 py-0.5 rounded border border-theme-border-soft/10">PC Workspace</span>
                          <div className="space-y-2">
                            <span className="text-[8px] font-black uppercase text-theme-muted tracking-wider block">Desktop Dashboard</span>
                            <div className="flex gap-2">
                              <div className="w-14 rounded p-1.5 space-y-1" style={{ backgroundColor: colors.sidebar }}>
                                <div className="w-8 h-1 rounded-sm bg-theme-card/40"></div>
                                <div className="w-10 h-0.5 rounded-sm bg-theme-card/20"></div>
                                <div className="w-10 h-0.5 rounded-sm bg-theme-card/20"></div>
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="rounded p-2 text-white text-[6px] space-y-1 relative" style={{ background: 'linear-gradient(135deg, ' + colors.btnFrom + ', ' + colors.btnTo + ')' }}>
                                  <span className="font-extrabold block">Welcome to BillQyro</span>
                                  <div className="w-12 h-1 bg-theme-card/30 rounded-sm"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                  <div className="rounded p-1 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}><span className="text-[5px] text-theme-muted block leading-none">Collection</span><span className="text-[6px] font-extrabold" style={{ color: colors.text }}>$1,200</span></div>
                                  <div className="rounded p-1 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}><span className="text-[5px] text-theme-muted block leading-none">Dues</span><span className="text-[6px] font-extrabold" style={{ color: colors.text }}>$450</span></div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="w-full h-5 rounded-lg flex items-center justify-center text-[7px] font-black uppercase tracking-wider text-white shadow-sm" style={{ background: 'linear-gradient(90deg, ' + colors.btnFrom + ', ' + colors.btnTo + ')' }}>Create Invoice</div>
                        </div>
                      );})()}
                      {(() => { const colors = getThemePreviewColors(themeColor); return (
                        <div className="border border-theme-border-soft/60 rounded-2xl p-4 flex flex-col justify-between items-center relative overflow-hidden bg-theme-app min-h-[145px]">
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-theme-muted bg-theme-card/10 px-1.5 py-0.5 rounded border border-theme-border-soft/20">Smartphone UI</span>
                          <div className="w-3/4 flex-1 border border-white/10 bg-theme-card rounded-t-xl overflow-hidden flex flex-col justify-between" style={{ backgroundColor: colors.background }}>
                            <div className="p-1 flex justify-between items-center border-b" style={{ borderColor: colors.border }}><span className="text-[5px] font-bold" style={{ color: colors.text }}>BillQyro</span><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }}></span></div>
                            <div className="p-2 space-y-1.5">
                              <div className="rounded p-1.5 border space-y-1" style={{ backgroundColor: colors.card, borderColor: colors.border }}><div className="w-10 h-0.5 bg-theme-border-strong rounded-sm"></div><div className="w-14 h-1 rounded-sm" style={{ backgroundColor: colors.accent }}></div></div>
                            </div>
                            <div className="flex justify-center -mb-2"><span className="px-2 py-0.5 rounded-full text-[4.5px] font-black text-white shadow-sm flex items-center gap-0.5" style={{ background: 'linear-gradient(90deg, ' + colors.btnFrom + ', ' + colors.btnTo + ')' }}>⚡ Quick Bill</span></div>
                            <div className="h-4 border-t flex justify-around items-center" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                              <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                              <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                              <span className="w-2.5 h-1 rounded-sm" style={{ backgroundColor: colors.accent }}></span>
                              <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                            </div>
                          </div>
                        </div>
                      );})()}
                      {(() => { const colors = getThemePreviewColors(themeColor); return (
                        <div className="border border-theme-border-soft/60 rounded-2xl p-4 bg-theme-surface dark:bg-theme-card flex flex-col justify-between items-center relative overflow-hidden min-h-[145px]">
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-theme-muted bg-theme-card/40 px-1.5 py-0.5 rounded border border-theme-border-soft/10">Printable PDF</span>
                          <div className="w-[85%] flex-1 bg-theme-card border border-theme-border-soft shadow-sm p-2 flex flex-col justify-between">
                            <div className="flex justify-between items-start pb-1.5 border-b border-theme-border-soft">
                              <div className="space-y-0.5"><span className="text-[6px] font-extrabold block" style={{ color: colors.headerColor }}>BillQyro Store</span><div className="w-10 h-0.5 bg-theme-border-strong rounded-sm"></div></div>
                              <span className="text-[6px] font-black tracking-wide" style={{ color: colors.headerColor }}>INVOICE</span>
                            </div>
                            <div className="my-1.5 space-y-0.5"><div className="h-1 rounded-sm w-full" style={{ backgroundColor: colors.tableHeaderBg }}></div><div className="h-0.5 bg-theme-surface w-full"></div><div className="h-0.5 bg-theme-surface w-full"></div></div>
                            <div className="flex justify-between items-center p-1 rounded-sm" style={{ backgroundColor: colors.totalBg }}><span className="text-[5px] font-black" style={{ color: colors.headerColor }}>GRAND TOTAL</span><span className="text-[5.5px] font-black" style={{ color: colors.headerColor }}>$1,650.00</span></div>
                          </div>
                        </div>
                      );})()}
                      {(() => { const colors = getThemePreviewColors(themeColor); return (
                        <div className="border border-theme-border-soft/60 rounded-2xl p-4 bg-theme-card dark:bg-theme-card flex flex-col justify-between items-center relative overflow-hidden min-h-[145px]">
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-theme-muted bg-theme-surface/80 px-1.5 py-0.5 rounded border border-theme-border-soft/10">QR Pay Card</span>
                          <div className="w-[85%] border border-theme-border-soft rounded-xl p-2.5 flex flex-col items-center justify-between text-center gap-1.5 shadow-sm bg-theme-app/20">
                            <span className="text-[6px] font-bold text-theme-muted uppercase tracking-widest block leading-none">Scan to Pay</span>
                            <div className="p-1 rounded border-2 border-dashed flex items-center justify-center" style={{ borderColor: colors.accent }}><div className="w-10 h-10 bg-theme-border-soft dark:bg-theme-card flex items-center justify-center text-[5px] text-theme-muted">QR Code</div></div>
                            <div className="space-y-0.5"><span className="text-[5.5px] text-theme-muted block font-semibold leading-none">BillQyro Payment</span><span className="text-[7px] font-black block leading-tight" style={{ color: colors.headerColor }}>$1,650.00 Due</span></div>
                          </div>
                        </div>
                      );})()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ============ PAYMENT SETTINGS ============ */}
          {activeCategory === 'payment' && (
            <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
              <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><QrCode className="w-5 h-5" /></div>
                  <div>
                    <h2 className="section-header-title">Payment Settings</h2>
                    <p className="section-header-subtitle">Set up digital payment integration via UPI, bKash, Nagad, or custom QR codes.</p>
                  </div>
                </div>
              </div>

              <ToggleSwitch enabled={paymentQrEnabled} onChange={setPaymentQrEnabled} label="Enable Automated Scan-to-Pay QR Code" description="Embed automated scanning codes on bills and invoice pages" />

              {paymentQrEnabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Primary Payment Method</label>
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-bold">
                        {country === 'India' && <option value="UPI">UPI (India)</option>}
                        {country === 'Bangladesh' && (<><option value="bKash">bKash (Bangladesh)</option><option value="Nagad">Nagad (Bangladesh)</option><option value="Rocket">Rocket (Bangladesh)</option></>)}
                        <option value="Manual">Manual QR / Custom Bank Details</option>
                      </select>
                    </div>
                    {country === 'India' && (
                      <div>
                        <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">UPI ID</label>
                        <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="e.g. business@okaxis" className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-bold" />
                      </div>
                    )}
                    {country === 'Bangladesh' && paymentMethod === 'bKash' && (
                      <div>
                        <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">bKash Wallet Number</label>
                        <input type="text" value={bkashNumber} onChange={(e) => setBkashNumber(e.target.value)} placeholder="e.g. 017XXXXXXXX" className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-bold" />
                      </div>
                    )}
                    {country === 'Bangladesh' && paymentMethod === 'Nagad' && (
                      <div>
                        <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Nagad Account Number</label>
                        <input type="text" value={nagadNumber} onChange={(e) => setNagadNumber(e.target.value)} placeholder="e.g. 019XXXXXXXX" className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-bold" />
                      </div>
                    )}
                    {country === 'Bangladesh' && paymentMethod === 'Rocket' && (
                      <div>
                        <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Rocket Account Number</label>
                        <input type="text" value={rocketNumber} onChange={(e) => setRocketNumber(e.target.value)} placeholder="e.g. 018XXXXXXXX" className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-bold" />
                      </div>
                    )}
                    {country === 'Other' && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Manual / Bank Details / QR Link</label>
                        <input type="text" value={customPaymentLink} onChange={(e) => setCustomPaymentLink(e.target.value)} placeholder="e.g. Bank name: X, A/C: Y, IFSC: Z" className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-medium" />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Payee / Account Name</label>
                      <input type="text" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} placeholder="e.g. BillQyro store" className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">QR Payment Footnote</label>
                      <input type="text" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="e.g. Please scan to pay." className="w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-medium" />
                    </div>
                  </div>
                  <ToggleSwitch enabled={showQrInPdf} onChange={setShowQrInPdf} label="Show QR in PDF Invoice" description="Render QR code on generated PDF documents" />
                  <ToggleSwitch enabled={showQrInPreview} onChange={setShowQrInPreview} label="Show QR on Local Preview" description="Render QR code on invoice previews inside dashboard" />
                </>
              )}
            </div>
          )}

          {/* ============ COLLECTION SETTINGS ============ */}
          {activeCategory === 'collection' && (
            <>
              <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
                <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><FileText className="w-5 h-5" /></div>
                    <div>
                      <h2 className="section-header-title">Invoice Preferences</h2>
                      <p className="section-header-subtitle">Control invoice layout, numbering, default tax rates, brand colors, and document notes.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Invoice Layout Template</label>
                    <select value={invoiceTemplate} onChange={(e) => setInvoiceTemplate(e.target.value)} className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-bold">
                      <option value="modern">Modern A4 Template</option>
                      <option value="classic">Classic A5 Template</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Default Form Field Layout</label>
                    <select value={defaultBillingTemplate} onChange={(e) => setDefaultBillingTemplate(e.target.value)} className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-bold">
                      <option value="embroidery">Embroidery / Fashion</option>
                      <option value="grocery">Grocery / Kirana Shop</option>
                      <option value="repair">Mobile Repair / Service</option>
                      <option value="retail">Retail Shopping Store</option>
                      <option value="custom">Standard Flexible Bill</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Invoice Number Prefix</label>
                    <input type="text" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="e.g. INV-" className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Tax ID / GST Number</label>
                    <input type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="e.g. 29AAAAA0000A1Z5" className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-bold uppercase" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-2 uppercase tracking-wide flex items-center gap-2"><Palette className="w-3.5 h-3.5" /> Corporate Brand Color</label>
                    <div className="flex flex-wrap gap-3">
                      {[{ name: 'Teal', hex: '#14b8a6' }, { name: 'Indigo', hex: '#6366f1' }, { name: 'Rose', hex: '#f43f5e' }, { name: 'Blue', hex: '#3b82f6' }, { name: 'Emerald', hex: '#10b981' }, { name: 'Amber', hex: '#f59e0b' }, { name: 'Slate', hex: '#475569' }].map((color) => (
                        <button key={color.hex} type="button" onClick={() => setBrandColor(color.hex)} style={{ backgroundColor: color.hex }} title={color.name} className={'w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer tooltip-premium ' + (brandColor === color.hex ? 'ring-4 ring-offset-2 scale-110' : 'hover:scale-105')}>
                          {brandColor === color.hex && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Default Invoice Notes</label>
                    <textarea value={defaultNotes} onChange={(e) => setDefaultNotes(e.target.value)} placeholder="Thank you for your business!" rows="2" className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-medium resize-none text-xs" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Terms & Conditions</label>
                    <textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="1. Payment is expected within due date." rows="2" className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-medium resize-none text-xs" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">PDF Footer Note</label>
                    <input type="text" value={pdfFooter} onChange={(e) => setPdfFooter(e.target.value)} placeholder="e.g. Computer generated invoice." className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-medium" />
                  </div>
                </div>
              </div>

              {/* Customer Live Link Settings */}
              <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
                <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><Link className="w-5 h-5" /></div>
                    <div>
                      <h2 className="section-header-title">Customer Live Link Settings</h2>
                      <p className="section-header-subtitle">Define customer-facing invoice portal features.</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { state: enableLiveLink, setter: setEnableLiveLink, label: 'Enable Secure Live Link', desc: 'Generate unique public URL endpoints' },
                    { state: showPaymentQrOnLink, setter: setShowPaymentQrOnLink, label: 'Show Payment QR Code', desc: 'Display scan-to-pay QR on public pages' },
                    { state: allowPdfDownload, setter: setAllowPdfDownload, label: 'Allow Customer PDF Download', desc: 'Let clients print/download invoice PDFs' },
                    { state: allowPaymentProofSubmit, setter: setAllowPaymentProofSubmit, label: 'Allow Payment Proof Submission', desc: 'Enable "I Have Paid" flow' },
                    { state: showPaidDueAmount, setter: setShowPaidDueAmount, label: 'Show Paid & Due Amounts', desc: 'Display collected vs balance due' },
                    { state: showContactButton, setter: setShowContactButton, label: 'Show Contact Support Button', desc: 'Embed email/phone links for customers' },
                    { state: requireTransactionId, setter: setRequireTransactionId, label: 'Require Transaction Reference ID', desc: 'Make Transaction ID mandatory' },
                    { state: requirePaymentScreenshot, setter: setRequirePaymentScreenshot, label: 'Require Payment Screenshot', desc: 'Make file upload mandatory for proof' }
                  ].map((item, idx) => (
                    <ToggleSwitch key={idx} enabled={item.state} onChange={item.setter} label={item.label} description={item.desc} />
                  ))}
                </div>
              </div>
            </>
          )}
          {/* ============ TEMPLATES ============ */}
          {activeCategory === 'templates' && (
            <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
              <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><LayoutTemplate className="w-5 h-5" /></div>
                  <div>
                    <h2 className="section-header-title">Invoice Templates</h2>
                    <p className="section-header-subtitle">Configure invoice layouts, PDF visible fields, and document structure.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Primary Invoice Layout</label>
                  <select value={invoiceTemplate} onChange={(e) => setInvoiceTemplate(e.target.value)} className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-bold">
                    <option value="modern">Modern A4 Template</option>
                    <option value="classic">Classic A5 Template</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Default Field Layout</label>
                  <select value={defaultBillingTemplate} onChange={(e) => setDefaultBillingTemplate(e.target.value)} className="input-premium w-full px-4 py-3 bg-theme-app dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary font-bold">
                    <option value="embroidery">Embroidery / Fashion</option>
                    <option value="grocery">Grocery / Kirana</option>
                    <option value="repair">Repair / Service</option>
                    <option value="retail">Retail Store</option>
                    <option value="custom">Standard Flex Bill</option>
                  </select>
                </div>
              </div>
              <div className="divider-premium h-px bg-gradient-to-r from-transparent via-theme-border-soft to-transparent" />
              <div className="flex items-center justify-between p-4 bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-theme-primary block">PDF Visible Fields</span>
                  <span className="text-[9px] text-theme-muted font-semibold mt-0.5 block">Customize which fields appear on PDF invoices per template type.</span>
                </div>
                <span className="badge-premium text-[9px] font-black text-theme-accent bg-theme-accent-light px-3 py-1.5 rounded-full border border-theme-accent/30">{defaultBillingTemplate} template active</span>
              </div>
            </div>
          )}

          {/* ============ NOTIFICATIONS ============ */}
          {activeCategory === 'notifications' && (
            <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
              <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><Bell className="w-5 h-5" /></div>
                  <div>
                    <h2 className="section-header-title">Notification Preferences</h2>
                    <p className="section-header-subtitle">Control how and when you receive alerts about invoices, payments, and system updates.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <ToggleSwitch enabled={emailNotifications} onChange={setEmailNotifications} label="Email Notifications" description="Receive invoice and payment updates via email" />
                <ToggleSwitch enabled={whatsappNotifications} onChange={setWhatsappNotifications} label="WhatsApp Notifications" description="Get real-time updates through WhatsApp (requires Twilio)" />
                <ToggleSwitch enabled={dueDateReminders} onChange={setDueDateReminders} label="Due Date Reminders" description="Automatic reminders before invoice due dates" />
                <ToggleSwitch enabled={paymentConfirmation} onChange={setPaymentConfirmation} label="Payment Confirmations" description="Get notified when a customer submits payment proof" />
                <ToggleSwitch enabled={securityAlerts} onChange={setSecurityAlerts} label="Security Alerts" description="Receive alerts about login activity and security changes" />
                <ToggleSwitch enabled={marketingEmails} onChange={setMarketingEmails} label="Marketing & Updates" description="Product updates, tips, and promotional content" />
              </div>
            </div>
          )}

          {/* ============ SECURITY ============ */}
          {activeCategory === 'security' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="card-premium p-6 md:p-8 space-y-6">
                <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><Shield className="w-5 h-5" /></div>
                    <div>
                      <h2 className="section-header-title">Security & API Keys</h2>
                      <p className="section-header-subtitle">Manage API credentials, monitor account security, and configure database provider.</p>
                    </div>
                  </div>
                </div>

                {/* Account Security Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-theme-success" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-theme-success">Account Status</span>
                    </div>
                    <p className="text-xs font-bold text-theme-primary">Authenticated</p>
                    <p className="text-[9px] text-theme-muted font-medium truncate">{loggedInEmail}</p>
                  </div>
                  <div className="bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-theme-accent" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-theme-accent">Database Provider</span>
                    </div>
                    <p className="text-xs font-bold text-theme-primary capitalize">{dbProvider}</p>
                    <select value={dbProvider} onChange={(e) => handleSetDbProvider(e.target.value)} className="text-[9px] w-full bg-transparent border border-theme-border-soft rounded-lg px-2 py-1 text-theme-muted font-bold outline-none cursor-pointer">
                      <option value="firebase">Firebase</option>
                      <option value="indexeddb">IndexedDB (Local)</option>
                    </select>
                  </div>
                  <div className="bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-theme-accent" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-theme-accent">Sync Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={'w-2 h-2 rounded-full ' + firebaseStatusDot}></span>
                      <p className="text-xs font-bold text-theme-primary">{firebaseStatusLabel}</p>
                    </div>
                    <p className="text-[9px] text-theme-muted font-medium">Last online: {isOnline ? 'Connected' : 'Disconnected'}</p>
                  </div>
                </div>

                {/* Gemini API Key */}
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1.5 tooltip-premium" title="Get your free API key from Google AI Studio">Gemini API Key (AI Scanner)</label>
                    <input type="password" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} placeholder="AIzaSy..." className="input-premium w-full bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-2xl px-4 py-3.5 text-xs font-bold text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-theme-accent/20 outline-none transition-all" />
                    <p className="text-[10px] text-theme-muted font-medium mt-1.5">Required for AI Bill Scanner. Get a free key from Google AI Studio.</p>
                  </div>
                  <div className="pt-4 border-t border-theme-border-soft/60">
                    <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1.5">Twilio Account SID (WhatsApp Bot)</label>
                    <input type="text" value={twilioAccountSid} onChange={(e) => setTwilioAccountSid(e.target.value)} placeholder="AC..." className="w-full bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-2xl px-4 py-3.5 text-xs font-bold text-theme-primary focus:ring-2 focus:ring-theme-accent/20 outline-none transition-all mb-3" />
                    <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1.5">Twilio Auth Token</label>
                    <input type="password" value={twilioAuthToken} onChange={(e) => setTwilioAuthToken(e.target.value)} placeholder="Auth token..." className="input-premium w-full bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-2xl px-4 py-3.5 text-xs font-bold text-theme-primary focus:ring-2 focus:ring-theme-accent/20 outline-none transition-all" />
                    <p className="text-[10px] text-theme-muted font-medium mt-1.5">Required for automated due-date reminders via WhatsApp.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ============ BACKUP ============ */}
          {activeCategory === 'backup' && (
            <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
              <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><Database className="w-5 h-5" /></div>
                  <div>
                    <h2 className="section-header-title">Data Backup & Storage</h2>
                    <p className="section-header-subtitle">Export full backups, monitor storage health, clear temporary cache, and reset data safely.</p>
                  </div>
                </div>
              </div>

              {storageInfo && (
                <div className="space-y-4">
                  <div className="stat-premium bg-theme-bg/50 dark:bg-theme-dark-bg/50 rounded-2xl p-6 border border-theme-border-soft relative overflow-hidden group hover:border-theme-accent/30 transition-all duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-theme-text dark:text-theme-dark-text">LocalStorage Usage</span>
                      <span className={'font-bold ' + (storageInfo.percentage > 95 ? 'text-theme-danger' : storageInfo.percentage > 80 ? 'text-theme-warning' : 'text-theme-success')}>
                        {storageInfo.percentage}% ({storageInfo.kb}/{storageInfo.limitKb} KB)
                      </span>
                    </div>
                    <div className="w-full bg-theme-border-soft dark:bg-theme-border-soft/50 rounded-full h-3 overflow-hidden">
                      <div className={'h-3 rounded-full transition-all duration-1000 ' + (storageInfo.percentage > 95 ? 'bg-theme-danger' : storageInfo.percentage > 80 ? 'bg-theme-warning/50' : 'bg-theme-success')} style={{ width: storageInfo.percentage + '%' }}></div>
                    </div>
                    <p className="text-xs text-theme-text-soft dark:text-theme-dark-text-soft mt-2">
                      {storageInfo.percentage > 95 ? 'CRITICAL: Clear cache or delete items.' : storageInfo.percentage > 80 ? 'WARNING: Usage is getting high.' : 'SAFE: Storage is healthy.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={handleExport} className="btn-premium-outline flex items-center gap-3 p-4 rounded-xl border border-theme-success/30 bg-theme-success/5 hover:bg-theme-success/10 transition-colors text-left col-span-1">
                      <Database className="text-theme-success" size={24} />
                      <div>
                        <div className="font-semibold text-theme-text dark:text-theme-dark-text">Download Full Backup</div>
                        <div className="text-xs text-theme-text-soft">Save complete JSON backup of workspace</div>
                      </div>
                    </button>

                    <label className="btn-premium-outline flex items-center gap-3 p-4 rounded-xl border border-theme-accent/20 bg-theme-accent/5 hover:bg-theme-accent/10 transition-colors text-left cursor-pointer col-span-1">
                      <Upload className="text-theme-accent" size={24} />
                      <div>
                        <div className="font-semibold text-theme-text">Import Backup File</div>
                        <div className="text-xs text-theme-text-soft">Restore from a previously saved backup</div>
                      </div>
                      <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>

                    <button onClick={handleClearCacheOnly} className="btn-premium-outline flex items-center gap-3 p-4 rounded-xl border border-theme-warning/30 bg-theme-warning/5 hover:bg-theme-warning/10 transition-colors text-left">
                      <RotateCcw className="text-theme-warning" size={24} />
                      <div>
                        <div className="font-semibold text-theme-text">Clear App Cache</div>
                        <div className="text-xs text-theme-text-soft">Reset temporary cache, keep your data</div>
                      </div>
                    </button>

                    <button onClick={() => setShowResetModal(true)} className="btn-premium-outline flex items-center gap-3 p-4 rounded-xl border border-theme-danger/30 bg-theme-danger/5 hover:bg-theme-danger/10 transition-colors text-left">
                      <Trash2 className="text-theme-danger" size={24} />
                      <div>
                        <div className="font-semibold text-theme-danger">Reset All Data</div>
                        <div className="text-xs text-theme-danger/80">Wipe invoices, customers & settings</div>
                      </div>
                    </button>

                    {isAdmin && (
                      <>
                        <button onClick={handleCleanTemporaryData} className="btn-premium-outline flex items-center gap-3 p-4 rounded-xl border border-theme-success/30 bg-theme-success/5 hover:bg-theme-success/10 transition-colors text-left">
                          <RefreshCw className="text-theme-success" size={24} />
                          <div>
                            <div className="font-semibold text-theme-text">Clean Temporary Data</div>
                            <div className="text-xs text-theme-text-soft">Clear logs & old sync queue</div>
                          </div>
                        </button>
                        <button onClick={handleCleanDuplicateDrafts} className="btn-premium-outline flex items-center gap-3 p-4 rounded-xl border border-theme-warning/30 bg-theme-warning/5 hover:bg-theme-warning/10 transition-colors text-left">
                          <Trash2 className="text-theme-warning" size={24} />
                          <div>
                            <div className="font-semibold text-theme-text">Clean Duplicate Drafts</div>
                            <div className="text-xs text-theme-text-soft">Remove empty/zero drafts</div>
                          </div>
                        </button>
                        <button onClick={handleClearAllLocalData} className="btn-premium-outline flex items-center gap-3 p-4 rounded-xl border border-theme-danger/20 bg-theme-danger/5 hover:bg-theme-danger/10 transition-colors text-left">
                          <ShieldAlert className="text-theme-danger" size={24} />
                          <div>
                            <div className="font-semibold text-theme-danger">Hard Reset (Admin)</div>
                            <div className="text-xs text-theme-danger/80">Completely wipe ALL local storage</div>
                          </div>
                        </button>
                        <button onClick={handleEmptyTrash} className="btn-premium-outline flex items-center gap-3 p-4 rounded-xl border border-theme-danger/30 bg-theme-danger/5 hover:bg-theme-danger/10 transition-colors text-left">
                          <Trash2 className="text-theme-danger" size={24} />
                          <div>
                            <div className="font-semibold text-theme-danger">Empty Trash Data</div>
                            <div className="text-xs text-theme-danger/80">Permanently delete soft-deleted invoices</div>
                          </div>
                        </button>
                      </>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="bg-theme-warning/5 border border-theme-warning/30 rounded-2xl p-4 flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 text-theme-warning shrink-0" />
                      <p className="text-[10px] font-semibold text-theme-warning/90">Admin tools: Use granular wipes below to selectively clear data types without full reset.</p>
                    </div>
                  )}
                </div>
              )}

              {!storageInfo && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-theme-accent-light dark:bg-theme-accent-light/20 text-theme-accent flex items-center justify-center"><HardDrive className="w-7 h-7" /></div>
                  <div className="text-center max-w-xs">
                    <h3 className="text-xs font-extrabold text-theme-primary">Storage data loading</h3>
                    <p className="text-[10px] text-theme-muted font-medium mt-1">View storage usage and backup options.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============ SUBSCRIPTION ============ */}
          {activeCategory === 'subscription' && (
            <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
              <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><CreditCard className="w-5 h-5" /></div>
                  <div>
                    <h2 className="section-header-title">Subscription & Billing</h2>
                    <p className="section-header-subtitle">Manage your plan, view usage limits, and upgrade for premium features.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-theme-accent/5 to-theme-accent/10 border border-theme-accent/20 rounded-3xl text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-tr from-theme-accent to-theme-accent-dark rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-extrabold text-theme-primary dark:text-theme-primary">Free Plan Active</h3>
                <p className="text-xs text-theme-muted max-w-md mx-auto leading-relaxed font-semibold">
                  You are currently on the Free Starter plan. Upgrade to Premium for unlimited invoices, premium templates, live invoice links, and priority support.
                </p>
                <div className="inline-flex items-center gap-2 text-[10px] text-theme-muted font-semibold bg-theme-app dark:bg-theme-surface px-4 py-2 rounded-full border border-theme-border-soft">
                  <CheckCircle2 className="w-3.5 h-3.5 text-theme-success" />
                  {invoices.length} invoices created this month
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: FileText, label: 'Invoice Limit', value: '15 / month', desc: 'Free plan limit' },
                  { icon: Users, label: 'Customers', value: customers.length, desc: 'Total customers' },
                  { icon: CircleDollarSign, label: 'Revenue Tracked', value: '₹' + totalRevenue.toLocaleString(), desc: 'All time total' }
                ].map((stat, i) => (
                  <div key={i} className="bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-2xl p-4 text-center">
                    <stat.icon className="w-5 h-5 text-theme-accent mx-auto mb-2" />
                    <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">{stat.label}</p>
                    <p className="text-lg font-extrabold text-theme-primary mt-1">{stat.value}</p>
                    <p className="text-[9px] text-theme-muted font-medium mt-1">{stat.desc}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => window.open('/premium-pricing', '_self')} className="btn-premium w-full py-4 bg-[image:var(--accent-gradient)] text-white font-black text-sm rounded-xl shadow-glow hover:opacity-90 transition-all">
                <Zap className="w-4 h-4" /> Upgrade to Premium — Unlock Everything
              </button>
            </div>
          )}
          {/* ============ INTEGRATIONS ============ */}
          {activeCategory === 'integrations' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="card-premium p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent-light blur-3xl opacity-30 rounded-full pointer-events-none"></div>
                <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><Puzzle className="w-5 h-5" /></div>
                    <div>
                      <h2 className="section-header-title">Integrations</h2>
                      <p className="section-header-subtitle">Connect third-party services to extend BillQyro capabilities.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Gemini Integration */}
                  <div className="bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-sm"><Sparkles className="w-5 h-5" /></div>
                        <div>
                          <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Google Gemini AI</h3>
                          <p className="text-[9px] text-theme-muted font-semibold">AI-powered bill scanning & data extraction</p>
                        </div>
                      </div>
                      <span className={'badge-premium text-[8px] font-black uppercase px-2 py-1 rounded-full border ' + (geminiApiKey ? 'bg-theme-success/10 text-theme-success border-theme-success/30' : 'bg-theme-muted/10 text-theme-muted border-theme-muted/20')}>{geminiApiKey ? 'Connected' : 'Not Connected'}</span>
                    </div>
                    <input type="password" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} placeholder="Enter Gemini API Key..." className="input-premium w-full bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl px-4 py-3 text-xs font-bold text-theme-primary focus:ring-2 focus:ring-theme-accent/20 outline-none transition-all" />
                    <p className="text-[9px] text-theme-muted font-medium">Get your free API key from Google AI Studio.</p>
                  </div>

                  {/* Twilio Integration */}
                  <div className="bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 text-white flex items-center justify-center shadow-sm"><MessageCircle className="w-5 h-5" /></div>
                        <div>
                          <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Twilio WhatsApp</h3>
                          <p className="text-[9px] text-theme-muted font-semibold">Automated payment reminders via WhatsApp</p>
                        </div>
                      </div>
                      <span className={'badge-premium text-[8px] font-black uppercase px-2 py-1 rounded-full border ' + (twilioAccountSid && twilioAuthToken ? 'bg-theme-success/10 text-theme-success border-theme-success/30' : 'bg-theme-muted/10 text-theme-muted border-theme-muted/20')}>{twilioAccountSid && twilioAuthToken ? 'Connected' : 'Not Connected'}</span>
                    </div>
                    <input type="text" value={twilioAccountSid} onChange={(e) => setTwilioAccountSid(e.target.value)} placeholder="Twilio Account SID..." className="w-full bg-theme-card border border-theme-border-soft rounded-xl px-4 py-3 text-xs font-bold text-theme-primary focus:ring-2 focus:ring-theme-accent/20 outline-none transition-all mb-2" />
                    <input type="password" value={twilioAuthToken} onChange={(e) => setTwilioAuthToken(e.target.value)} placeholder="Twilio Auth Token..." className="input-premium w-full bg-theme-card border border-theme-border-soft rounded-xl px-4 py-3 text-xs font-bold text-theme-primary focus:ring-2 focus:ring-theme-accent/20 outline-none transition-all" />
                  </div>

                  {/* Future Integrations */}
                  <div className="bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-2xl p-5">
                    <h3 className="text-xs font-black text-theme-muted uppercase tracking-wider mb-4">Coming Soon</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { icon: Zap, name: 'Zapier', desc: 'Automate workflows', color: 'from-amber-400 to-orange-500' },
                        { icon: MessageCircle, name: 'Slack', desc: 'Invoice notifications', color: 'from-purple-400 to-purple-600' },
                        { icon: CircleDollarSign, name: 'Stripe', desc: 'Payment processing', color: 'from-blue-400 to-indigo-500' },
                        { icon: Headphones, name: 'Zoho', desc: 'CRM sync', color: 'from-green-400 to-emerald-500' },
                        { icon: BarChart3, name: 'QuickBooks', desc: 'Accounting sync', color: 'from-teal-400 to-cyan-500' },
                        { icon: CloudLightning, name: 'Webhooks', desc: 'Custom callbacks', color: 'from-rose-400 to-pink-500' }
                      ].map((item, i) => (
                        <div key={i} className="bg-theme-card dark:bg-theme-card/40 border border-theme-border-soft/50 rounded-xl p-3.5 text-center opacity-40 hover:opacity-70 transition-opacity">
                          <div className={'w-8 h-8 rounded-lg bg-gradient-to-br ' + item.color + ' text-white flex items-center justify-center mx-auto mb-2 shadow-sm'}><item.icon className="w-4 h-4" /></div>
                          <p className="text-[11px] font-extrabold text-theme-primary">{item.name}</p>
                          <p className="text-[8px] text-theme-muted font-semibold">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ TEAM ============ */}
          {activeCategory === 'team' && (
            <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
              <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><Users className="w-5 h-5" /></div>
                  <div>
                    <h2 className="section-header-title">Team & Access</h2>
                    <p className="section-header-subtitle">Invite cashiers with limited bill-creation access.</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center py-10 space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-theme-accent-light dark:bg-theme-accent-light/20 text-theme-accent flex items-center justify-center"><Users className="w-8 h-8" /></div>
                <div className="text-center max-w-sm">
                  <h3 className="text-sm font-extrabold text-theme-primary">No Team Members Yet</h3>
                  <p className="text-xs text-theme-muted font-medium mt-1.5 leading-relaxed">Invite cashiers to help manage billing without accessing your dashboard or expenses.</p>
                </div>
                <button className="btn-premium bg-[image:var(--accent-gradient)] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md cursor-pointer hover:opacity-90 transition-opacity" onClick={() => alert("Firebase Auth modification required.")}>+ Invite Cashier</button>
              </div>
            </div>
          )}

          {/* ============ LIVE LINK TEMPLATES ============ */}
          {activeCategory === 'live-links' && (
            <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
              <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><Link className="w-5 h-5" /></div>
                  <div>
                    <h2 className="section-header-title">Live Link Templates</h2>
                    <p className="section-header-subtitle">Configure how your customer invoice portal looks.</p>
                  </div>
                </div>
              </div>
              <div className="bg-theme-app dark:bg-theme-surface border border-theme-border-soft rounded-2xl p-6 text-center space-y-4">
                <Link className="w-12 h-12 text-theme-accent mx-auto" />
                <h3 className="text-sm font-extrabold text-theme-primary">Open Live Link Template Studio</h3>
                <p className="text-xs text-theme-muted font-medium max-w-md mx-auto">Design and customize the customer-facing invoice portal with themes, CTAs, and layout options.</p>
                <button onClick={() => { if (typeof setCurrentTab === 'function') setCurrentTab('live-link-templates'); else window.open('/live-link-templates', '_self'); }} className="btn-premium bg-[image:var(--accent-gradient)] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md hover:opacity-90 transition-all">
                  Open Template Studio
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { state: enableLiveLink, setter: setEnableLiveLink, label: 'Enable Secure Live Link', desc: 'Generate unique public URL endpoints' },
                  { state: showPaymentQrOnLink, setter: setShowPaymentQrOnLink, label: 'Show Payment QR Code', desc: 'Display scan-to-pay QR on public pages' },
                  { state: allowPdfDownload, setter: setAllowPdfDownload, label: 'Allow Customer PDF Download', desc: 'Let clients print/download invoice PDFs' },
                  { state: allowPaymentProofSubmit, setter: setAllowPaymentProofSubmit, label: 'Allow Payment Proof Submission', desc: 'Enable "I Have Paid" flow' }
                ].map((item, idx) => (
                  <ToggleSwitch key={idx} enabled={item.state} onChange={item.setter} label={item.label} description={item.desc} />
                ))}
              </div>
            </div>
          )}

          {/* ============ ADVANCED ============ */}
          {activeCategory === 'advanced' && (
            <>
              {/* Premium UX */}
              <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
                <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><Smartphone className="w-5 h-5" /></div>
                    <div>
                      <h2 className="section-header-title">Premium Mobile UX</h2>
                      <p className="section-header-subtitle">Toggle haptic feedback and premium sound effects.</p>
                    </div>
                  </div>
                </div>
                <ToggleSwitch enabled={enableHaptics} onChange={setEnableHaptics} label="Enable Haptic Feedback" description="Vibrate on success, errors, and key actions" />
                <ToggleSwitch enabled={enableSounds} onChange={setEnableSounds} label="Enable Premium Sounds" description="Play audio cues when bills are saved" />
              </div>

              {/* Advanced Data Tools */}
              {isAdmin && (
                <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn border-theme-danger/20">
                  <div className="section-header border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-theme-danger/10 text-theme-danger flex items-center justify-center shrink-0"><ShieldAlert className="w-5 h-5" /></div>
                      <div>
                        <h2 className="section-header-title text-theme-danger">Danger Zone</h2>
                        <p className="section-header-subtitle">Granular data management tools for administrators.</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => handleGranularWipe('Invoices')} className="btn-premium-outline flex items-center gap-3 p-4 rounded-xl border border-theme-danger/30 bg-theme-danger/5 hover:bg-theme-danger/10 transition-colors text-left"><Trash2 className="text-theme-danger" size={24} /><div><div className="font-semibold text-theme-danger">Wipe All Invoices</div><div className="text-xs text-theme-danger/80">Permanently delete all invoice records</div></div></button>
                    <button onClick={() => handleGranularWipe('Customers')} className="btn-premium-outline flex items-center gap-3 p-4 rounded-xl border border-theme-danger/30 bg-theme-danger/5 hover:bg-theme-danger/10 transition-colors text-left"><Users className="text-theme-danger" size={24} /><div><div className="font-semibold text-theme-danger">Wipe All Customers</div><div className="text-xs text-theme-danger/80">Permanently delete all customer records</div></div></button>
                    <button onClick={() => handleGranularWipe('Products')} className="btn-premium-outline flex items-center gap-3 p-4 rounded-xl border border-theme-danger/30 bg-theme-danger/5 hover:bg-theme-danger/10 transition-colors text-left"><FileText className="text-theme-danger" size={24} /><div><div className="font-semibold text-theme-danger">Wipe All Products</div><div className="text-xs text-theme-danger/80">Permanently delete all product records</div></div></button>
                    <button onClick={() => handleGranularWipe('Expenses')} className="btn-premium-outline flex items-center gap-3 p-4 rounded-xl border border-theme-danger/30 bg-theme-danger/5 hover:bg-theme-danger/10 transition-colors text-left"><CircleDollarSign className="text-theme-danger" size={24} /><div><div className="font-semibold text-theme-danger">Wipe All Expenses</div><div className="text-xs text-theme-danger/80">Permanently delete all expense records</div></div></button>
                    <button onClick={handleForceSync} className="btn-premium-outline flex items-center gap-3 p-4 rounded-xl border border-theme-accent/20 bg-theme-accent/5 hover:bg-theme-accent/10 transition-colors text-left"><RefreshCw className="text-theme-accent" size={24} /><div><div className="font-semibold text-theme-text">Force Cloud Sync</div><div className="text-xs text-theme-text-soft">Sync local data with cloud provider</div></div></button>
                    <button onClick={handleResetData} className="btn-premium-outline flex items-center gap-3 p-4 rounded-xl border border-theme-warning/30 bg-theme-warning/5 hover:bg-theme-warning/10 transition-colors text-left"><RotateCcw className="text-theme-warning" size={24} /><div><div className="font-semibold text-theme-warning">Reset to Demo Data</div><div className="text-xs text-theme-warning/80">Load default demo assets</div></div></button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>{/* END content area */}
      </div>{/* END sidebar+content layout */}
      {/* Reset All Data Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 md:p-8 max-w-md w-full border border-theme-danger/30 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 border-b border-theme-border-soft pb-4">
              <div className="w-12 h-12 rounded-xl bg-theme-danger/10 text-theme-danger flex items-center justify-center"><ShieldAlert className="w-6 h-6" /></div>
              <div>
                <h3 className="text-lg font-black text-theme-primary">Reset Account Data</h3>
                <p className="text-[10px] text-theme-danger font-bold uppercase tracking-wider">Danger Zone</p>
              </div>
            </div>
            <p className="text-sm text-theme-muted font-medium leading-relaxed">
              You are about to permanently wipe all your data including invoices, customers, products, and settings. <strong className="text-theme-primary">This cannot be undone.</strong>
            </p>
            <div className="bg-theme-app dark:bg-theme-surface p-4 rounded-2xl border border-theme-border-soft text-xs text-theme-muted font-medium space-y-2">
              <p>💡 <strong className="text-theme-primary">Recommendation:</strong> Download a full backup before resetting.</p>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <button type="button" onClick={handleExport} className="btn-premium-outline w-full px-4 py-3 bg-theme-surface border border-theme-border-soft hover:bg-theme-surface/60 text-theme-primary text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                <Download className="w-4 h-4" /> Download Backup Data
              </button>
              <button type="button" onClick={() => { if (confirm("Are you absolutely sure you want to delete all data?")) { resetAccountKeepAuth(); } }} className="btn-premium w-full px-4 py-3 bg-theme-danger hover:bg-theme-danger/80 text-white text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors">
                <Trash2 className="w-4 h-4" /> Yes, Reset All Data
              </button>
              <button type="button" onClick={() => setShowResetModal(false)} className="w-full px-4 py-3 text-theme-muted hover:text-theme-primary text-sm font-bold rounded-xl transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Save Button Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-theme-border-soft px-4 py-3 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-theme-warning dark:text-theme-warning bg-theme-warning/5 dark:bg-theme-warning/5 px-3 py-1.5 rounded-full border border-theme-warning/30">
                <AlertCircle className="w-3.5 h-3.5" /> Unsaved changes
              </span>
            )}
            {!isDirty && (
              <span className="text-[11px] font-bold text-theme-muted px-3 py-1.5">All changes saved</span>
            )}
          </div>
          <button onClick={(e) => { handleSave(e); }} disabled={isSaving} className="btn-premium flex items-center gap-2 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 font-black text-xs px-6 py-3 rounded-xl shadow-glow active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
            {isSaving ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saving...</span></>
            ) : (
              <><Save className="w-4 h-4" /><span>Save Changes</span></>
            )}
          </button>
        </div>
      </div>
      </>)}
    </motion.div>
  );
};

export default Settings;
