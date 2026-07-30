import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '../utils/animations';
import { CardSkeleton } from '../components/PremiumSkeleton';
import LivePreviewPanel from '../components/settings/LivePreviewPanel';
import { CyberPortalsConfig, CyberToolsConfig } from './cybercafe/SettingsStudioIntegration';
import Subscription from './Subscription';
import PdfTemplateStudio from './PdfTemplateStudio';
import LiveLinkTemplateStudio from './LiveLinkTemplateStudio';
import DesignStudio from './DesignStudio';
import TemplateMarketplace from './TemplateMarketplace';
import BackupRestore from './BackupRestore';
import { applyTheme } from '../hooks/useThemeEngine';
import { getThemePreviewColors, ALL_THEMES, THEME_INFO } from '../utils/themeUtils';
import { getCustomerLabelByType, isEducationBusiness, BUSINESS_PRESETS } from '../config/businessPresets';

import {
  Building2, MapPin, FileText, Save, Image as ImageIcon, Phone, Mail,
  User, Check, CheckCircle2, QrCode, Palette, LayoutTemplate, Database,
  Download, Upload, Wifi, WifiOff, ServerOff, ShieldAlert, RotateCcw,
  RefreshCw, BarChart3, Users, CircleDollarSign, HardDrive, Lock, Trash2,
  Globe, Languages, Sliders, Sparkles, Link, Info, Smartphone, Search,
  AlertCircle, X, Star, Bell, Shield, CreditCard, Puzzle, Settings2,
  Volume2, MessageCircle, ShieldCheck, Key, Zap, Headphones,
  Sun, Moon, Undo2, ChevronLeft, ChevronRight, Eye, CheckSquare,
  Clock, AlertTriangle, ArrowLeft, Layers, PaintBucket, Briefcase,
  Hash, ImageIcon as ImageIconLucide, HelpCircle, Monitor,
  BookOpen, DollarSign, Percent, Printer, Share2, Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminEngine } from '../services/adminEngine';
import { backupEngine } from '../services/backupEngine';
import { authEngine } from '../services/authEngine';
import { firebaseReady } from '../services/firebaseConfig';

const compressImage = (file, maxWidth = 400) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/webp', 0.8));
      };
    };
  });
};

const NAV_GROUPS = [
  {
    group: 'Business', icon: Building2,
    items: [
      { id: 'business', label: 'Business Profile', icon: Building2, description: 'Company details & logo' },
      { id: 'workspace', label: 'Workspace', icon: Globe, description: 'Regional & language' },
      { id: 'theme-engine', label: 'Theme Engine', icon: Palette, description: 'Colors & appearance' }
    ]
  },
  {
    group: 'Invoice', icon: FileText,
    items: [
      { id: 'invoice-builder', label: 'Invoice Builder', icon: LayoutTemplate, description: 'Advanced builder settings' },
      { id: 'template-gallery', label: 'Template Gallery', icon: LayoutTemplate, description: 'Unified template selection' }
    ]
  },
  {
    group: 'Payment', icon: CreditCard,
    items: [
      { id: 'payment', label: 'Payment Methods', icon: QrCode, description: 'UPI, bKash, Nagad' },
      { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Reminders & alerts' }
    ]
  },
  {
    group: 'Security', icon: Shield,
    items: [
      { id: 'security', label: 'Security & API', icon: Shield, description: 'API keys & access' },
      { id: 'users', label: 'Users & Roles', icon: Users, description: 'Team management' }
    ]
  },
  {
    group: 'System', icon: Settings2,
    items: [
      { id: 'subscription', label: 'Subscription', icon: CreditCard, description: 'Plan & billing' },
      { id: 'backup', label: 'Backup & Restore', icon: Database, description: 'Data management' },
      { id: 'advanced', label: 'Advanced', icon: Settings2, description: 'Danger zone' }
    ]
  }
];

const THEME_PRESETS = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'auto', label: 'Auto', icon: Monitor },
  { id: 'custom', label: 'Custom', icon: PaintBucket }
];

const ToggleSwitch = ({ enabled, onChange, label, description }) => (
  <div className="flex items-start justify-between p-4 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl gap-3">
    <div className="flex-1 min-w-0">
      <span className="text-xs font-bold text-gray-900 dark:text-white block">{label}</span>
      {description && <span className="text-[9px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5 block">{description}</span>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={'relative w-12 h-6 rounded-full transition-all duration-500 ease-in-out shadow-inner flex items-center p-1 shrink-0 focus:outline-none ' + (enabled ? 'bg-[image:var(--accent-gradient)] shadow-md shadow-[var(--accent)]/30' : 'bg-slate-300 dark:bg-slate-700/60 border border-slate-400/20 dark:border-white/5')}
    >
      <span className={'w-4 h-4 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-in-out ' + (enabled ? 'translate-x-6' : 'translate-x-0')} />
    </button>
  </div>
);

const SettingsStudioV2 = ({
  settings, onSaveSettings, isAdmin, onResetDemo, onImportBackup,
  invoices = [], customers = [], installPromptEvent = null,
  isAppInstalled = false, onInstallApp, subscription = null,
  onUpgrade, setCurrentTab
}) => {
  const [activeSection, setActiveSection] = useState('business');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [showNav, setShowNav] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const isInitialized = useRef(false);

  // Business states
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('retail');
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

  // Regional states
  const [country, setCountry] = useState('India');
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('\u20B9');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [taxLabel, setTaxLabel] = useState('GST');
  const [vatTax, setVatTax] = useState('');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [numberFormat, setNumberFormat] = useState('Indian');

  // Payment states
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

  // Invoice states
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [defaultTax, setDefaultTax] = useState(18);
  const [defaultNotes, setDefaultNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [pdfFooter, setPdfFooter] = useState('');
  const [brandColor, setBrandColor] = useState('#14b8a6');
  const [invoiceTemplate, setInvoiceTemplate] = useState('modern');
  const [defaultBillingTemplate, setDefaultBillingTemplate] = useState('custom');

  // Theme states
  const [themePreset, setThemePreset] = useState('light');
  const [themeId, setThemeId] = useState('obsidian-gold');
  const [darkMode, setDarkMode] = useState(false);
  const [cornerRadius, setCornerRadius] = useState(12);
  const [shadowIntensity, setShadowIntensity] = useState(50);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [fontDensity, setFontDensity] = useState('normal');

  // Live Link states
  const [enableLiveLink, setEnableLiveLink] = useState(true);
  const [showPaymentQrOnLink, setShowPaymentQrOnLink] = useState(true);
  const [allowPdfDownload, setAllowPdfDownload] = useState(true);
  const [allowPaymentProofSubmit, setAllowPaymentProofSubmit] = useState(true);
  const [showPaidDueAmount, setShowPaidDueAmount] = useState(true);
  const [showContactButton, setShowContactButton] = useState(true);
  const [requireTransactionId, setRequireTransactionId] = useState(true);
  const [requirePaymentScreenshot, setRequirePaymentScreenshot] = useState(false);

  // Notification states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [dueDateReminders, setDueDateReminders] = useState(true);
  const [paymentConfirmation, setPaymentConfirmation] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  // Cyber Cafe states
  const [cyberPortals, setCyberPortals] = useState([]);
  const [removeBgApiKey, setRemoveBgApiKey] = useState('');
  const [enablePhotoMaker, setEnablePhotoMaker] = useState(true);

  // Invoice Builder states
  const [enableProductAutocomplete, setEnableProductAutocomplete] = useState(true);
  const [enableTemplateSwitcher, setEnableTemplateSwitcher] = useState(true);
  const [enableItemLevelDiscount, setEnableItemLevelDiscount] = useState(false);
  const [enableItemLevelTax, setEnableItemLevelTax] = useState(false);
  const [enableDragAndDrop, setEnableDragAndDrop] = useState(true);
  const [enableDigitalSignature, setEnableDigitalSignature] = useState(true);
  const [enableLivePreview, setEnableLivePreview] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const [dbProvider, setDbProvider] = useState(() => localStorage.getItem('billmint_db_provider') || 'firebase');
  const session = authEngine.getAuthSession();

  const loggedInEmail = session?.userEmail || 'unknown';
  const isOnline = navigator.onLine;
  const firebaseStatus = firebaseReady && isOnline ? 'connected' : firebaseReady && !isOnline ? 'offline' : 'not-configured';

  // Load settings
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0 && !isInitialized.current) {
      isInitialized.current = true;
      setBusinessName(settings.businessName || '');
      setBusinessType(settings.businessType || 'retail');
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
      setCurrencyCode(settings.currencyCode || 'INR');
      setTaxLabel(settings.taxLabel || 'GST');
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
      setThemeId(settings.themeColor || 'obsidian-gold');
      setDarkMode(settings.darkMode ?? false);
      setThemePreset(settings.darkMode ? 'dark' : 'light');

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
      if (settings.notifications) {
        setEmailNotifications(settings.notifications.email !== false);
        setWhatsappNotifications(settings.notifications.whatsapp !== false);
        setDueDateReminders(settings.notifications.dueDateReminders !== false);
        setPaymentConfirmation(settings.notifications.paymentConfirmation !== false);
        setMarketingEmails(settings.notifications.marketing || false);
        setSecurityAlerts(settings.notifications.securityAlerts !== false);
      }

      if (settings.cyberCafeConfig) {
        setCyberPortals(settings.cyberCafeConfig.portals || []);
        setRemoveBgApiKey(settings.cyberCafeConfig.removeBgApiKey || '');
        setEnablePhotoMaker(settings.cyberCafeConfig.enablePhotoMaker !== false);
      }

      if (settings.invoiceBuilderSettings) {
        setEnableProductAutocomplete(settings.invoiceBuilderSettings.enableProductAutocomplete !== false);
        setEnableTemplateSwitcher(settings.invoiceBuilderSettings.enableTemplateSwitcher !== false);
        setEnableItemLevelDiscount(settings.invoiceBuilderSettings.enableItemLevelDiscount === true);
        setEnableItemLevelTax(settings.invoiceBuilderSettings.enableItemLevelTax === true);
        setEnableDragAndDrop(settings.invoiceBuilderSettings.enableDragAndDrop !== false);
        setEnableDigitalSignature(settings.invoiceBuilderSettings.enableDigitalSignature !== false);
        setEnableLivePreview(settings.invoiceBuilderSettings.enableLivePreview !== false);
      }
    }
  }, [settings]);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) setIsLoading(false);
    else { const t = setTimeout(() => setIsLoading(false), 800); return () => clearTimeout(t); }
  }, [settings]);

  useEffect(() => {
    if (!isInitialized.current) return;
    const handleBeforeUnload = (e) => { if (isDirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(null); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty]);

  // Mark dirty on changes
  useEffect(() => {
    if (!isInitialized.current) return;
    setIsDirty(true);
  }, [businessName, businessType, ownerName, phone, whatsapp, email, address, gstNumber, geminiApiKey, twilioAccountSid, twilioAuthToken,
    country, language, currency, currencyCode, taxLabel, vatTax, dateFormat, numberFormat,
    invoicePrefix, defaultTax, defaultNotes, terms, pdfFooter, brandColor, invoiceTemplate, defaultBillingTemplate,
    upiId, bkashNumber, nagadNumber, rocketNumber, payeeName, paymentNote, paymentQrEnabled, paymentMethod,
    customPaymentLink, showQrInPdf, showQrInPreview,
    enableLiveLink, showPaymentQrOnLink, allowPdfDownload, allowPaymentProofSubmit,
    showPaidDueAmount, showContactButton, requireTransactionId, requirePaymentScreenshot,
    themeId, darkMode, logoUrl, cornerRadius, shadowIntensity, animationSpeed, fontDensity,
    emailNotifications, whatsappNotifications, dueDateReminders, paymentConfirmation, marketingEmails, securityAlerts,
    cyberPortals, removeBgApiKey, enablePhotoMaker
  ]);

  // Theme application
  const handleApplyTheme = useCallback((id, mode) => {
    const effectiveMode = mode !== undefined ? mode : darkMode;
    setThemeId(id);
    applyTheme(id, null, effectiveMode);
  }, [darkMode]);

  const handleToggleDark = useCallback(() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    setThemePreset(newMode ? 'dark' : 'light');
    applyTheme(themeId, null, newMode);
  }, [darkMode, themeId]);

  // Search
  const getDynamicNav = () => {
    let baseNav = [...NAV_GROUPS];
    if (businessType === 'cybercafe') {
      baseNav = baseNav.filter(g => g.group !== 'Invoice' && g.group !== 'Payment');
      baseNav.splice(1, 0, {
        group: 'Cyber Cafe', icon: Monitor,
        items: [
          { id: 'cyber-portals', label: 'Portal Hub Config', icon: Link, description: 'Manage quick links' },
          { id: 'cyber-tools', label: 'Tools & AI Config', icon: Zap, description: 'Background remover, APIs' }
        ]
      });
    }
    return baseNav;
  };

  const filteredNav = useMemo(() => {
    const dNav = getDynamicNav();
    if (!searchQuery.trim()) return dNav;
    const q = searchQuery.toLowerCase();
    return dNav.map(g => ({
      ...g, items: g.items.filter(item =>
        (item.label?.toLowerCase().includes(q)) || 
        (item.description?.toLowerCase().includes(q)) || 
        (item.id.includes(q))
      )
    })).filter(g => g.items.length > 0);
  }, [searchQuery, businessType]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (val.trim()) {
      const q = val.toLowerCase();
      const dNav = getDynamicNav();
      for (const g of dNav) {
        for (const item of g.items) {
          if ((item.label?.toLowerCase().includes(q)) || (item.description?.toLowerCase().includes(q)) || (item.id.includes(q))) {
            setActiveSection(item.id);
            return;
          }
        }
      }
    }
  };

  // Save
  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!businessName) { toast.error('Please specify a Business Name.'); return; }
    setIsSaving(true);
    setSaveState('saving');

    if (paymentQrEnabled) {
      if (paymentMethod === 'UPI' && !upiId.trim()) { toast.error('Please specify your UPI ID.'); setIsSaving(false); setSaveState('idle'); return; }
      if (paymentMethod === 'bKash' && !bkashNumber.trim()) { toast.error('Please specify your bKash Number.'); setIsSaving(false); setSaveState('idle'); return; }
      if (paymentMethod === 'Nagad' && !nagadNumber.trim()) { toast.error('Please specify your Nagad Number.'); setIsSaving(false); setSaveState('idle'); return; }
    }

    try {
      const payload = {
        ...settings, businessName, businessType, logoUrl, ownerName, phone, whatsapp, email, address, gstNumber,
        geminiApiKey, twilioAccountSid, twilioAuthToken, country, language, currency, currencyCode,
        taxLabel, vatTax, dateFormat, numberFormat, invoicePrefix, defaultTax: parseFloat(defaultTax) || 0,
        defaultNotes, terms, pdfFooter, upiId, paymentQrEnabled, paymentMethod, bkashNumber, nagadNumber,
        rocketNumber, payeeName, paymentNote, showQrInPdf, showQrInPreview, customPaymentLink,
        themeColor: themeId, themePreset, darkMode, brandColor, invoiceTemplate, defaultBillingTemplate,
        enableHaptics: true, enableSounds: true, cornerRadius, shadowIntensity, animationSpeed, fontDensity,
        customerLiveLinkSettings: {
          ...settings?.customerLiveLinkSettings, enableLiveInvoiceLink: enableLiveLink,
          showPaymentQr: showPaymentQrOnLink, allowCustomerPdfDownload: allowPdfDownload,
          allowPaymentProofSubmit: allowPaymentProofSubmit, showPaidDueAmount: showPaidDueAmount,
          showContactButton: showContactButton, requireTransactionId, requirePaymentScreenshot,
          selectedLiveLinkTemplate: settings?.customerLiveLinkSettings?.selectedLiveLinkTemplate || 'classic',
          themePreset: settings?.customerLiveLinkSettings?.themePreset || themeId,
          ctaPreset: settings?.customerLiveLinkSettings?.ctaPreset || 'payNow',
          conversionLayout: settings?.customerLiveLinkSettings?.conversionLayout || 'modern'
        },
        notifications: { email: emailNotifications, whatsapp: whatsappNotifications, dueDateReminders, paymentConfirmation, marketing: marketingEmails, securityAlerts },
        cyberCafeConfig: { portals: cyberPortals, removeBgApiKey, enablePhotoMaker },
        invoiceBuilderSettings: {
          enableProductAutocomplete,
          enableTemplateSwitcher,
          enableItemLevelDiscount,
          enableItemLevelTax,
          enableDragAndDrop,
          enableDigitalSignature,
          enableLivePreview
        }
      };
      onSaveSettings(payload);
      setIsDirty(false);
      setSaveState('saved');
      setLastSaved(new Date());
      toast.success('Settings saved successfully');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (err) {
      setSaveState('error');
      toast.error('Failed to save settings');
    }
    setIsSaving(false);
  };

  const resetStateFromSettings = () => {
    if (!settings || Object.keys(settings).length === 0) return;
    setBusinessName(settings.businessName || '');
    setBusinessType(settings.businessType || 'retail');
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
    setCurrencyCode(settings.currencyCode || 'INR');
    setTaxLabel(settings.taxLabel || 'GST');
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
    setThemeId(settings.themeColor || 'obsidian-gold');
    setDarkMode(settings.darkMode ?? false);
    setThemePreset(settings.darkMode ? 'dark' : 'light');
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
    if (settings.notifications) {
      setEmailNotifications(settings.notifications.email !== false);
      setWhatsappNotifications(settings.notifications.whatsapp !== false);
      setDueDateReminders(settings.notifications.dueDateReminders !== false);
      setPaymentConfirmation(settings.notifications.paymentConfirmation !== false);
      setMarketingEmails(settings.notifications.marketing || false);
      setSecurityAlerts(settings.notifications.securityAlerts !== false);
    }
    if (settings.cyberCafeConfig) {
      setCyberPortals(settings.cyberCafeConfig.portals || []);
      setRemoveBgApiKey(settings.cyberCafeConfig.removeBgApiKey || '');
      setEnablePhotoMaker(settings.cyberCafeConfig.enablePhotoMaker !== false);
    } else {
      setCyberPortals([]);
      setRemoveBgApiKey('');
      setEnablePhotoMaker(true);
    }
    
    if (settings.invoiceBuilderSettings) {
      setEnableProductAutocomplete(settings.invoiceBuilderSettings.enableProductAutocomplete !== false);
      setEnableTemplateSwitcher(settings.invoiceBuilderSettings.enableTemplateSwitcher !== false);
      setEnableItemLevelDiscount(settings.invoiceBuilderSettings.enableItemLevelDiscount === true);
      setEnableItemLevelTax(settings.invoiceBuilderSettings.enableItemLevelTax === true);
      setEnableDragAndDrop(settings.invoiceBuilderSettings.enableDragAndDrop !== false);
      setEnableDigitalSignature(settings.invoiceBuilderSettings.enableDigitalSignature !== false);
      setEnableLivePreview(settings.invoiceBuilderSettings.enableLivePreview !== false);
    } else {
      setEnableProductAutocomplete(true);
      setEnableTemplateSwitcher(true);
      setEnableItemLevelDiscount(false);
      setEnableItemLevelTax(false);
      setEnableDragAndDrop(true);
      setEnableDigitalSignature(true);
      setEnableLivePreview(true);
    }
  };

  const handleDiscard = () => {
    resetStateFromSettings();
    isInitialized.current = true;
    setIsDirty(false);
    toast('Changes discarded');
  };

  const handleExport = async () => {
    try {
      await backupEngine.exportLocal();
      toast.success('Backup downloaded successfully!');
    } catch (e) {
      toast.error('Export failed: ' + e.message);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);
      if (onImportBackup) { await onImportBackup(parsedData); toast.success('Backup restored!'); setTimeout(() => window.location.reload(), 1500); }
      else toast.error('Import not wired');
    } catch (err) { toast.error('Import failed: ' + err.message); }
  };

  const handleCountryAutoConfigure = (selectedCountry) => {
    if (!window.confirm('Changing country will update defaults. Proceed?')) return;
    setCountry(selectedCountry);
    if (selectedCountry === 'India') { setCurrency('\u20B9'); setCurrencyCode('INR'); setTaxLabel('GST'); setPaymentMethod('UPI'); setDateFormat('DD/MM/YYYY'); setNumberFormat('Indian'); setDefaultTax(18); }
    else if (selectedCountry === 'Bangladesh') { setCurrency('\u09F3'); setCurrencyCode('BDT'); setTaxLabel('VAT'); setPaymentMethod('bKash'); setDateFormat('DD/MM/YYYY'); setNumberFormat('Standard'); setDefaultTax(0); }
    else { setCurrency('$'); setCurrencyCode('USD'); setTaxLabel('Tax'); setPaymentMethod('Manual'); setDateFormat('DD/MM/YYYY'); setNumberFormat('Standard'); setDefaultTax(0); }
  };

  const saveTimeAgo = lastSaved ? Math.floor((Date.now() - lastSaved.getTime()) / 1000) + 's ago' : null;

  if (isLoading) {
    return (
      <div className="max-w-full mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="skeleton-block w-8 h-8 rounded-xl" />
          <div className="flex-1 space-y-2"><div className="skeleton-line w-48 h-5" /><div className="skeleton-line w-64 h-3" /></div>
        </div>
        <CardSkeleton lines={4} /><CardSkeleton lines={3} /><CardSkeleton lines={5} />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'business':
        return (
          <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
            <div className="section-header border-b border-gray-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="section-header-title">Business Profile</h2>
                  <p className="section-header-subtitle">Manage your business identity on every invoice</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Business Type</label>
                <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] text-gray-900 dark:text-white font-bold">
                  {BUSINESS_PRESETS.map(preset => (
                    <option key={preset.id} value={preset.id}>{preset.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Business Name</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="ABC Coaching Center" className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] text-gray-900 dark:text-white font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Owner Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400"><User className="w-4 h-4" /></span>
                  <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Khairul Basar" className="input-premium w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] text-gray-900 dark:text-white font-medium" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Business Logo</label>
                <div className={'relative border-2 border-dashed rounded-xl p-4 text-center transition-all ' + (isDragging ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5')}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={async (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) setLogoUrl(await compressImage(f)); }}
                >
                  <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files[0]; if (f && f.type.startsWith('image/')) setLogoUrl(await compressImage(f)); }} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload className="w-5 h-5 mx-auto text-gray-400" />
                  <span className="text-xs font-bold text-gray-400 mt-1 block">Upload Logo</span>
                </div>
                {logoUrl && (
                  <div className="mt-2 relative inline-block group">
                    <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain rounded-lg border border-gray-200 dark:border-white/10 p-1 bg-white dark:bg-white/5" />
                    <button onClick={() => setLogoUrl('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                  </div>
                )}
                <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Or paste image URL..." className="input-premium w-full mt-2 px-3 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Phone</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">WhatsApp</label>
                <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+91 98765 43210" className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
                <input type="email" value={loggedInEmail} readOnly className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 cursor-not-allowed" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Address</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl resize-none text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">GST Number</label>
                <input type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="29ABCDE1234F1Z5" className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl" />
              </div>
            </div>
          </div>
        );

      case 'workspace':
        return (
          <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
            <div className="section-header border-b border-gray-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><Globe className="w-5 h-5" /></div>
                <div><h2 className="section-header-title">Workspace Settings</h2><p className="section-header-subtitle">Regional preferences and localization</p></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Country</label>
                <select value={country} onChange={(e) => handleCountryAutoConfigure(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                  <option value="India">India</option><option value="Bangladesh">Bangladesh</option><option value="Other">Other</option>
                </select></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                  <option value="English">English</option><option value="Bengali">Bengali</option><option value="Hindi">Hindi</option>
                </select></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Currency Symbol</label>
                <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl" /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Currency Code</label>
                <input type="text" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl" /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Tax Label</label>
                <select value={taxLabel} onChange={(e) => setTaxLabel(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                  <option value="GST">GST</option><option value="VAT">VAT</option><option value="Tax">Tax</option><option value="None">None</option>
                </select></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Date Format</label>
                <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Number Format</label>
                <select value={numberFormat} onChange={(e) => setNumberFormat(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                  <option value="Indian">Indian (lakh/crore)</option><option value="Standard">Standard (1,234,567)</option><option value="European">European (1.234.567,89)</option>
                </select></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Default Tax Rate (%)</label>
                <input type="number" value={defaultTax} onChange={(e) => setDefaultTax(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl" /></div>
            </div>
          </div>
        );

      case 'theme-engine':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="card-premium p-6 space-y-6">
              <div className="section-header border-b border-gray-200 dark:border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><Palette className="w-5 h-5" /></div>
                  <div><h2 className="section-header-title">Theme Engine</h2><p className="section-header-subtitle">Customize every visual aspect instantly</p></div>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">Dark Mode</h3>
                  <p className="text-[9px] text-gray-500">Toggle dark/light appearance</p>
                </div>
                <button onClick={handleToggleDark} className={'relative w-12 h-6 rounded-full transition-all flex items-center p-1 ' + (darkMode ? 'bg-[image:var(--accent-gradient)]' : 'bg-slate-300 dark:bg-slate-700/60')}>
                  <span className={'w-4 h-4 bg-white rounded-full shadow-md transition-transform ' + (darkMode ? 'translate-x-6' : 'translate-x-0')} />
                </button>
              </div>

              {/* Theme Presets Grid */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Theme Presets</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {ALL_THEMES.map(({ id, name, category }) => {
                    const info = THEME_INFO[id];
                    const isActive = themeId === id;
                    return (
                      <button key={id} onClick={() => handleApplyTheme(id)}
                        className={'relative rounded-xl border-2 p-3 text-left transition-all hover:scale-[1.02] ' + (isActive ? 'border-[var(--accent)] shadow-lg shadow-[var(--accent)]/20' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20')}
                      >
                        <div className="flex gap-1 mb-2">
                          {info?.colors?.slice(0, 3).map((c, i) => <div key={i} className="flex-1 h-3 rounded-sm" style={{ backgroundColor: c }} />)}
                        </div>
                        <p className="text-[10px] font-bold text-gray-900 dark:text-white truncate">{name}</p>
                        <p className="text-[8px] text-gray-400 uppercase tracking-wider">{category}</p>
                        {isActive && <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[8px]">+</div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color */}
              <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">Custom Brand Color</h3>
                  <p className="text-[9px] text-gray-500">Set a specific accent color</p>
                </div>
                <input type="color" value={brandColor} onChange={(e) => { setBrandColor(e.target.value); setThemeId('custom'); applyTheme('custom', e.target.value, darkMode, false); }} className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200" />
                <input type="text" value={brandColor} onChange={(e) => { setBrandColor(e.target.value); setThemeId('custom'); applyTheme('custom', e.target.value, darkMode, false); }} className="flex-1 px-3 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-mono" />
              </div>

              {/* Advanced Settings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Corner Radius', value: cornerRadius, set: (v) => { setCornerRadius(v); applyTheme(themeId, brandColor, darkMode, false); document.documentElement.style.setProperty('--radius-base', `${v}px`); }, min: 4, max: 24, unit: 'px' },
                  { label: 'Shadow Intensity', value: shadowIntensity, set: (v) => { setShadowIntensity(v); document.documentElement.style.setProperty('--shadow-opacity', `${v / 100}`); }, min: 0, max: 100, unit: '%' },
                  { label: 'Animation Speed', value: animationSpeed, set: (v) => { setAnimationSpeed(v); document.documentElement.style.setProperty('--animation-multiplier', `${v}s`); }, min: 0.25, max: 2, step: 0.25, unit: 'x' },
                  { label: 'Font Density', value: fontDensity === 'compact' ? 0 : fontDensity === 'normal' ? 1 : 2, set: (v) => { const newDensity = ['compact', 'normal', 'relaxed'][v]; setFontDensity(newDensity); }, min: 0, max: 2, step: 1, unit: '', display: fontDensity }
                ].map((opt, i) => (
                  <div key={i} className="p-4 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{opt.label}</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input type="range" min={opt.min} max={opt.max} step={opt.step || 1} value={typeof opt.value === 'number' ? opt.value : 0} onChange={(e) => opt.set(parseFloat(e.target.value))} className="flex-1 accent-[var(--accent)] h-1.5" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white w-12 text-right">{opt.display || opt.value}{opt.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
            <div className="section-header border-b border-gray-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><QrCode className="w-5 h-5" /></div>
                <div><h2 className="section-header-title">Payment Methods</h2><p className="section-header-subtitle">Configure how customers pay you</p></div>
              </div>
            </div>
            <ToggleSwitch enabled={paymentQrEnabled} onChange={setPaymentQrEnabled} label="Enable Digital Payments" description="Show payment details on invoices" />
            {paymentQrEnabled && (
              <div className="bg-white/50 dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10 space-y-4">
                <div><label className="block text-xs font-bold text-gray-500 mb-1.5">Payment Method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl">
                    <option value="UPI">UPI (India)</option><option value="bKash">bKash (Bangladesh)</option><option value="Nagad">Nagad (Bangladesh)</option><option value="Bank">Bank Transfer</option><option value="Manual">Custom Link</option>
                  </select></div>
                {paymentMethod === 'UPI' && <div><label className="block text-xs font-bold text-gray-500 mb-1.5">UPI ID</label><input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="example@ybl" className="input-premium w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl" /></div>}
                {paymentMethod === 'bKash' && <div><label className="block text-xs font-bold text-gray-500 mb-1.5">bKash Number</label><input type="text" value={bkashNumber} onChange={(e) => setBkashNumber(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl" /></div>}
                {paymentMethod === 'Nagad' && <div><label className="block text-xs font-bold text-gray-500 mb-1.5">Nagad Number</label><input type="text" value={nagadNumber} onChange={(e) => setNagadNumber(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl" /></div>}
                {paymentMethod === 'Rocket' && <div><label className="block text-xs font-bold text-gray-500 mb-1.5">Rocket Number</label><input type="text" value={rocketNumber} onChange={(e) => setRocketNumber(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl" /></div>}
                {paymentMethod === 'Manual' && <div><label className="block text-xs font-bold text-gray-500 mb-1.5">Custom Payment Link / Details</label><input type="text" value={customPaymentLink} onChange={(e) => setCustomPaymentLink(e.target.value)} placeholder="https:// or bank details" className="input-premium w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl" /></div>}
                <div><label className="block text-xs font-bold text-gray-500 mb-1.5">Payee Name</label><input type="text" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl" /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1.5">Payment Note</label><input type="text" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl" /></div>
                <div className="flex items-center justify-between p-3 bg-white/50 border border-gray-200 rounded-xl">
                  <span className="text-xs font-bold text-gray-700">Show QR on Invoice Preview</span>
                  <button onClick={() => setShowQrInPreview(!showQrInPreview)} className={'relative w-10 h-5 rounded-full transition-all flex items-center p-0.5 ' + (showQrInPreview ? 'bg-[image:var(--accent-gradient)]' : 'bg-slate-300')}>
                    <span className={'w-4 h-4 bg-white rounded-full shadow transition-transform ' + (showQrInPreview ? 'translate-x-5' : 'translate-x-0')} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 border border-gray-200 rounded-xl">
                  <span className="text-xs font-bold text-gray-700">Show QR on PDF</span>
                  <button onClick={() => setShowQrInPdf(!showQrInPdf)} className={'relative w-10 h-5 rounded-full transition-all flex items-center p-0.5 ' + (showQrInPdf ? 'bg-[image:var(--accent-gradient)]' : 'bg-slate-300')}>
                    <span className={'w-4 h-4 bg-white rounded-full shadow transition-transform ' + (showQrInPdf ? 'translate-x-5' : 'translate-x-0')} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
            <div className="section-header border-b border-gray-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><Bell className="w-5 h-5" /></div>
                <div><h2 className="section-header-title">Notifications</h2><p className="section-header-subtitle">Manage alerts and reminders</p></div>
              </div>
            </div>
            <div className="space-y-3">
              <ToggleSwitch enabled={emailNotifications} onChange={setEmailNotifications} label="Email Notifications" description="Invoice and payment updates via email" />
              <ToggleSwitch enabled={whatsappNotifications} onChange={setWhatsappNotifications} label="WhatsApp Notifications" description="Real-time WhatsApp updates" />
              <ToggleSwitch enabled={dueDateReminders} onChange={setDueDateReminders} label="Due Date Reminders" description="Automatic reminders before due dates" />
              <ToggleSwitch enabled={paymentConfirmation} onChange={setPaymentConfirmation} label="Payment Confirmations" description="When customer submits payment proof" />
              <ToggleSwitch enabled={securityAlerts} onChange={setSecurityAlerts} label="Security Alerts" description="Login activity and security changes" />
              <ToggleSwitch enabled={marketingEmails} onChange={setMarketingEmails} label="Marketing & Updates" description="Product updates and tips" />
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
            <div className="section-header border-b border-gray-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><Shield className="w-5 h-5" /></div>
                <div><h2 className="section-header-title">Security & API Keys</h2><p className="section-header-subtitle">API credentials and account protection</p></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 text-green-500" /><span className="text-[10px] font-bold text-green-500 uppercase">Account</span></div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">Authenticated</p>
                <p className="text-[9px] text-gray-500 truncate">{loggedInEmail}</p>
              </div>
              <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2"><Key className="w-4 h-4 text-[var(--accent)]" /><span className="text-[10px] font-bold text-[var(--accent)] uppercase">Database</span></div>
                <select value={dbProvider} onChange={(e) => { setDbProvider(e.target.value); localStorage.setItem('billmint_db_provider', e.target.value); }} className="text-xs w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 font-bold">
                  <option value="firebase">Firebase</option><option value="indexeddb">IndexedDB (Local)</option>
                </select>
              </div>
              <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  {firebaseStatus === 'connected' ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-yellow-500" />}
                  <span className="text-[10px] font-bold uppercase">{firebaseStatus === 'connected' ? 'Connected' : 'Offline'}</span>
                </div>
                <p className="text-xs text-gray-500">Sync status: {firebaseStatus === 'connected' ? 'All good' : 'Working offline'}</p>
              </div>
            </div>
            <div className="space-y-4 pt-2">
              <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Gemini API Key (AI Scanner)</label>
                <input type="password" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} placeholder="AIzaSy..." className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs" /></div>
              <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Twilio Account SID</label>
                <input type="text" value={twilioAccountSid} onChange={(e) => setTwilioAccountSid(e.target.value)} placeholder="AC..." className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs mb-3" />
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Twilio Auth Token</label>
                <input type="password" value={twilioAuthToken} onChange={(e) => setTwilioAuthToken(e.target.value)} className="input-premium w-full px-4 py-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs" /></div>
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
            <div className="section-header border-b border-gray-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><Database className="w-5 h-5" /></div>
                <div><h2 className="section-header-title">Backup & Restore</h2><p className="section-header-subtitle">Export, import, and manage your data</p></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={handleExport} className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-left transition-colors">
                <Download className="text-emerald-500 w-5 h-5 shrink-0" />
                <div>
                  <div className="font-extrabold text-sm text-theme-primary">Export Backup</div>
                  <div className="text-[10px] font-semibold text-theme-muted mt-0.5">Download all data as JSON</div>
                </div>
              </button>
              <label className="flex items-center gap-3 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer text-left transition-colors">
                <Upload className="text-blue-500 w-5 h-5 shrink-0" />
                <div>
                  <div className="font-extrabold text-sm text-theme-primary">Import Backup</div>
                  <div className="text-[10px] font-semibold text-theme-muted mt-0.5">Restore from a backup file</div>
                </div>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
              <button onClick={() => { if (confirm('Clear cache?')) { adminEngine.clearCacheOnly(); toast.success('Cache cleared'); } }} className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-left transition-colors">
                <RotateCcw className="text-amber-500 w-5 h-5 shrink-0" />
                <div>
                  <div className="font-extrabold text-sm text-theme-primary">Clear Cache</div>
                  <div className="text-[10px] font-semibold text-theme-muted mt-0.5">Reset temporary data</div>
                </div>
              </button>
              <button onClick={() => { if (confirm('Reset all data? This cannot be undone.')) { adminEngine.factoryResetAllData(); toast.success('Data reset in progress...'); } }} className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-left transition-colors">
                <Trash2 className="text-rose-500 w-5 h-5 shrink-0" />
                <div>
                  <div className="font-extrabold text-sm text-rose-600 dark:text-rose-400">Factory Reset</div>
                  <div className="text-[10px] font-bold text-rose-500/80 mt-0.5">Wipe all local data permanently</div>
                </div>
              </button>
            </div>
          </div>
        );

      case 'invoice-builder':
        return (
          <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
            <div className="section-header border-b border-gray-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="section-header-title">Invoice Builder Controls</h2>
                  <p className="section-header-subtitle">Enable or disable premium features in the invoice builder</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleSwitch
                enabled={enableProductAutocomplete}
                onChange={setEnableProductAutocomplete}
                label="Product Autocomplete"
                description="Auto-suggest items from your catalog"
              />
              <ToggleSwitch
                enabled={enableTemplateSwitcher}
                onChange={setEnableTemplateSwitcher}
                label="Template Switcher"
                description="Allow switching invoice designs"
              />
              <ToggleSwitch
                enabled={enableItemLevelDiscount}
                onChange={setEnableItemLevelDiscount}
                label="Item-Level Discount"
                description="Allow adding discounts per line item"
              />
              <ToggleSwitch
                enabled={enableItemLevelTax}
                onChange={setEnableItemLevelTax}
                label="Item-Level Tax"
                description="Allow adding tax per line item"
              />
              <ToggleSwitch
                enabled={enableDragAndDrop}
                onChange={setEnableDragAndDrop}
                label="Drag & Drop Rows"
                description="Reorder items by dragging"
              />
              <ToggleSwitch
                enabled={enableDigitalSignature}
                onChange={setEnableDigitalSignature}
                label="Digital Signature"
                description="Enable signature pad on invoice"
              />
              <ToggleSwitch
                enabled={enableLivePreview}
                onChange={setEnableLivePreview}
                label="Live PDF Preview"
                description="Real-time PDF rendering preview"
              />
            </div>
          </div>
        );

      case 'subscription':
        return <div className="animate-fadeIn"><Subscription currentSubscription={subscription} onUpgrade={onUpgrade} businessSettings={settings} /></div>;

      case 'template-gallery':
        return (
          <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <div className="section-header">
                <h2 className="section-header-title">Universal Template Gallery</h2>
                <p className="section-header-subtitle">Select a single design to unify your PDF, Live Link, and Printed invoices.</p>
              </div>
            </div>
            <PdfTemplateStudio setCurrentTab={(tab) => {
              if (tab === 'dashboard') setCurrentTab?.('dashboard');
              else if (tab === 'settings') setActiveSection('business');
              else setActiveSection(tab);
            }} businessSettings={settings} setSettings={onSaveSettings} />
          </div>
        );

      case 'users':
        return (
          <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
            <div className="section-header border-b border-gray-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0"><Users className="w-5 h-5" /></div>
                <div><h2 className="section-header-title">Users & Roles</h2><p className="section-header-subtitle">Manage team access</p></div>
              </div>
            </div>
            <p className="text-sm text-gray-500">Team management coming soon. Currently, accounts are managed through Firebase Auth.</p>
          </div>
        );

      case 'advanced':
        return (
          <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
            <div className="section-header border-b border-gray-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-sm shrink-0"><Settings2 className="w-5 h-5" /></div>
                <div><h2 className="section-header-title text-red-600">Advanced</h2><p className="section-header-subtitle">Danger zone — proceed with caution</p></div>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Clear All Local Data', desc: 'Wipe everything including IndexedDB', action: async () => { if (confirm('Permanently wipe all local data?')) { await adminEngine.clearAllLocalData(); toast.success('Data wiped'); window.location.href = '/'; } }, danger: true },
                { label: 'Clean Duplicate Drafts', desc: 'Remove empty zero-amount invoices', action: async () => { const r = await adminEngine.cleanDuplicateDrafts(); toast.success('Removed ' + r + ' drafts'); } },
                { label: 'Empty Trash', desc: 'Permanently delete trashed invoices', action: async () => { const r = await adminEngine.emptyTrash(); toast.success('Deleted ' + r.count + ' items'); } }
              ].map((item, i) => (
                <button key={i} onClick={item.action} className={'w-full flex items-center justify-between p-4 rounded-xl border text-left ' + (item.danger ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10' : 'border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10')}>
                  <div><p className={'text-xs font-bold ' + (item.danger ? 'text-red-600' : 'text-gray-900 dark:text-white')}>{item.label}</p><p className="text-[9px] text-gray-500">{item.desc}</p></div>
                  <span className={'text-[9px] font-bold ' + (item.danger ? 'text-red-500' : 'text-gray-400')}>Run</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'cyber-portals':
        return <CyberPortalsConfig cyberPortals={cyberPortals} setCyberPortals={setCyberPortals} />;

      case 'cyber-tools':
        return (
          <CyberToolsConfig 
            enablePhotoMaker={enablePhotoMaker} setEnablePhotoMaker={setEnablePhotoMaker} 
            removeBgApiKey={removeBgApiKey} setRemoveBgApiKey={setRemoveBgApiKey} 
          />
        );

      default:
        return <div className="p-8 text-center text-gray-500">Select a section from the navigation</div>;
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="min-h-screen pb-32 font-sans">
      {/* Premium Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-[var(--app-bg)]/80 border-b border-gray-200 dark:border-white/10">
        <div className="max-w-full mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-3 min-w-0">
              {setCurrentTab && (
                <button onClick={() => setCurrentTab('dashboard')} className="w-9 h-9 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-[var(--accent)]/30 transition-all flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight truncate">
                    Settings Studio
                  </h1>
                  <span className="hidden md:inline-block text-[8px] font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-full border border-[var(--accent)]/20 uppercase tracking-wider">V2</span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">{settings?.businessName || 'Workspace'}</p>
              </div>
            </div>

            {/* Center: Search */}
            <div className="hidden md:flex flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search all settings..." 
                className="w-full pl-9 pr-8 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-white dark:bg-white/10 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Right: Status + Actions */}
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="hidden lg:inline-flex items-center gap-1 text-[9px] text-gray-400 bg-white dark:bg-white/5 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10">
                  <Clock className="w-3 h-3" /> Saved {saveTimeAgo}
                </span>
              )}
              {isDirty && (
                <span className="hidden lg:inline-flex items-center gap-1 text-[9px] text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-200 dark:border-yellow-500/30">
                  <AlertTriangle className="w-3 h-3" /> Unsaved
                </span>
              )}
              {saveState === 'saved' && (
                <span className="inline-flex items-center gap-1 text-[9px] text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-lg border border-green-200 dark:border-green-500/30 animate-fadeIn">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
              <span className="hidden lg:inline-flex text-[9px] text-gray-400 bg-white dark:bg-white/5 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10">
                Ctrl+S
              </span>
              <button onClick={handleSave} disabled={isSaving || !isDirty}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold text-white bg-[image:var(--accent-gradient)] hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md active:scale-95"
              >
                {isSaving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              {isAdmin && (
                <>
                  <button onClick={handleExport} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                  <label className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5" /> Import
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </label>
                </>
              )}
              <button onClick={() => setShowPreview(!showPreview)}
                className={'hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ' + (showPreview ? 'text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/30' : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10')}
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Navigation Bar (Replaces Left Sidebar) */}
      <div className="max-w-full mx-auto px-4 md:px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          {filteredNav.flatMap(group => group.items).map((item) => {
            const isEdu = isEducationBusiness(settings.defaultBillingTemplate);
            const label = item.dynamicLabel ? item.dynamicLabel(isEdu) : item.label;
            const Icon = item.icon;
            const isSelected = activeSection === item.id;
            return (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={'flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all ' + (isSelected ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm' : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10')}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-full mx-auto px-4 md:px-6 mt-4">
        <div className="flex gap-6">

          {/* Content Area */}
          <div className={'flex-1 min-w-0 ' + (showPreview ? 'lg:mr-80' : '')}>
            <div className="space-y-6 w-full">
              <AnimatePresence mode="wait">
                <motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview Panel */}
      {showPreview && (
        <LivePreviewPanel themeId={themeId} darkMode={darkMode} brandColor={brandColor} settings={settings} />
      )}

      {/* Sticky Save Bar */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-t border-gray-200 dark:border-white/10 shadow-2xl"
          >
            <div className="max-w-full mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Unsaved changes</p>
                  <p className="text-[9px] text-gray-500">You have pending modifications</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDiscard} className="px-4 py-2 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
                  Discard
                </button>
                <button onClick={() => handleSave(null)} disabled={isSaving}
                  className="px-6 py-2 rounded-xl text-[10px] font-bold text-white bg-[image:var(--accent-gradient)] hover:opacity-90 transition-all disabled:opacity-40 shadow-md flex items-center gap-1.5"
                >
                  {isSaving ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-white/10 overflow-x-auto hide-scrollbar">
        <div className="flex items-center justify-around px-2 py-1.5 min-w-max">
          {NAV_GROUPS.map((group) => {
            const firstItem = group.items[0];
            const Icon = group.icon;
            const isActive = group.items.some(i => i.id === activeSection);
            return (
              <button key={group.group} onClick={() => setActiveSection(firstItem?.id || group.group)}
                className={'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ' + (isActive ? 'text-[var(--accent)]' : 'text-gray-400')}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[7px] font-bold whitespace-nowrap">{group.group}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsStudioV2;
