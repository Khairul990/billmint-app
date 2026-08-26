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
import MessageTemplateStudio, { DEFAULT_WHATSAPP_TEMPLATE } from './studios/MessageTemplateStudio';
import FeatureControlStudio from './studios/FeatureControlStudio';
import { applyTheme } from '../hooks/useThemeEngine';
import { getThemePreviewColors, ALL_THEMES, THEME_INFO } from '../utils/themeUtils';
import { BUSINESS_PRESETS } from '../config/businessPresets';

import {
  Building2, MapPin, FileText, Save, Phone, Mail,
  Check, CheckCircle2, QrCode, Palette, LayoutTemplate, Database,
  Download, Upload, Wifi, WifiOff, RotateCcw, Users,
  Globe, Sliders, Sparkles, Link, Smartphone, Search,
  X, Star, Bell, Shield, CreditCard, Settings2,
  MessageCircle, ShieldCheck, Key, Zap,
  Sun, Moon, Eye, Clock, AlertTriangle, ArrowLeft,
  Layers, PaintBucket, Briefcase,
  Trash2, Box, PackageSearch, Tag, CheckSquare, RefreshCw
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
    group: 'BUSINESS',
    description: 'Profile, workspace, features & theme',
    icon: Building2,
    items: [
      { id: 'business', label: 'Business Profile', icon: Building2, description: 'Company details & brand logo', mode: 'simple' },
      { id: 'workspace', label: 'Workspace & Regional', icon: Globe, description: 'Currency, locale & number format', mode: 'simple' },
      { id: 'modules', label: 'Modules & Features', icon: Sliders, description: 'Enable or disable optional capabilities', mode: 'advanced' },
      { id: 'theme-engine', label: 'Appearance & Theme', icon: Palette, description: 'Design swatches & visual styling', mode: 'simple' }
    ]
  },
  {
    group: 'BILLING',
    description: 'Invoice numbering, tax & payment methods',
    icon: FileText,
    items: [
      { id: 'invoice-builder', label: 'Invoice & Numbering', icon: LayoutTemplate, description: 'Prefix, table columns & signature', mode: 'advanced' },
      { id: 'payment', label: 'Payment Methods & QR', icon: QrCode, description: 'UPI, bKash, Nagad & QR codes', mode: 'simple' }
    ]
  },
  {
    group: 'TEMPLATES & BRAND',
    description: 'PDF, Live link, marketplace & design studio',
    icon: Layers,
    items: [
      { id: 'pdf-templates', label: 'PDF Invoice Templates', icon: FileText, description: 'A4/A5 print & export templates', mode: 'simple' },
      { id: 'live-link-templates', label: 'Live Link Templates', icon: Smartphone, description: 'Customer self-service portal look', mode: 'simple' },
      { id: 'design-studio', label: 'Design Studio', icon: Sparkles, description: 'Universal branding & color studio', mode: 'advanced' },
      { id: 'template-marketplace', label: 'Template Marketplace', icon: LayoutTemplate, description: 'Explore community & pro templates', mode: 'simple' }
    ]
  },
  {
    group: 'INVENTORY',
    description: 'Products, stock tracking & barcode',
    icon: Box,
    items: [
      { id: 'inventory-settings', label: 'Inventory Settings', icon: PackageSearch, description: 'SKU, variants, batch & warehouse', mode: 'advanced' }
    ]
  },
  {
    group: 'COMMUNICATION',
    description: 'WhatsApp messages & automated alerts',
    icon: MessageCircle,
    items: [
      { id: 'whatsapp-template', label: 'Message Templates', icon: MessageCircle, description: 'WhatsApp share & reminder templates', mode: 'simple' },
      { id: 'notifications', label: 'Notifications & Alerts', icon: Bell, description: 'Due date, payment & system alerts', mode: 'simple' }
    ]
  },
  {
    group: 'SECURITY & TEAM',
    description: 'Credentials, API keys & access control',
    icon: Shield,
    items: [
      { id: 'security', label: 'Security & Access', icon: ShieldCheck, description: 'API keys, database & auth status', mode: 'advanced' },
      { id: 'users', label: 'Users & Roles', icon: Users, description: 'Team members & permissions', mode: 'advanced' }
    ]
  },
  {
    group: 'DATA & SYSTEM',
    description: 'Plan, backup, recovery & maintenance',
    icon: Settings2,
    items: [
      { id: 'subscription', label: 'Subscription & Plan', icon: CreditCard, description: 'Plan tier & billing status', mode: 'simple' },
      { id: 'backup', label: 'Backup & Restore', icon: Database, description: 'JSON backup export & import', mode: 'simple' },
      { id: 'advanced', label: 'Advanced / Danger Zone', icon: AlertTriangle, description: 'Cache, duplicate cleaner & data reset', mode: 'advanced' }
    ]
  }
];

const ToggleSwitch = ({ enabled, onChange, label, description }) => (
  <div className="flex items-start justify-between p-3.5 bg-theme-surface/60 border border-theme-border-soft rounded-2xl gap-3 transition-all hover:bg-theme-surface/80">
    <div className="flex-1 min-w-0">
      <span className="text-xs font-bold text-theme-primary block">{label}</span>
      {description && <span className="text-[10px] text-theme-muted font-medium mt-0.5 block leading-relaxed">{description}</span>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out shadow-inner flex items-center p-0.5 shrink-0 focus:outline-none cursor-pointer ${
        enabled ? 'bg-theme-accent shadow-xs' : 'bg-slate-300 dark:bg-slate-700/60 border border-slate-400/20 dark:border-white/5'
      }`}
    >
      <span className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

const SettingsStudioV2 = ({
  settings, onSaveSettings, isAdmin, onResetDemo, onImportBackup,
  invoices = [], customers = [], installPromptEvent = null,
  isAppInstalled = false, onInstallApp, subscription = null,
  onUpgrade, setCurrentTab, products = [], expenses = []
}) => {
  const [activeSection, setActiveSection] = useState('business');
  const [settingsMode, setSettingsMode] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [showPreview, setShowPreview] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
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
  const [allowWhatsappProofSubmit, setAllowWhatsappProofSubmit] = useState(false);
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
  const [whatsappMessageTemplate, setWhatsappMessageTemplate] = useState('');

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
  const [invoiceItemLabel, setInvoiceItemLabel] = useState('Item');
  const [invoiceCustomColumns, setInvoiceCustomColumns] = useState([]);

  // Inventory states
  const [enableVariantTracking, setEnableVariantTracking] = useState(false);
  const [enableWarehouseTracking, setEnableWarehouseTracking] = useState(false);
  const [enableBatchExpiry, setEnableBatchExpiry] = useState(false);
  const [enableBarcodeSku, setEnableBarcodeSku] = useState(true);

  const [dbProvider, setDbProvider] = useState(() => localStorage.getItem('billmint_db_provider') || 'firebase');
  const session = authEngine.getAuthSession();

  const loggedInEmail = session?.userEmail || 'unknown';
  const isOnline = navigator.onLine;
  const firebaseStatus = firebaseReady && isOnline ? 'connected' : firebaseReady && !isOnline ? 'offline' : 'not-configured';

  // Load initial settings
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
        setAllowWhatsappProofSubmit(settings.customerLiveLinkSettings.allowWhatsappProofSubmit !== undefined ? settings.customerLiveLinkSettings.allowWhatsappProofSubmit : false);
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
      setWhatsappMessageTemplate(settings.whatsappMessageTemplate || DEFAULT_WHATSAPP_TEMPLATE);

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
        setInvoiceItemLabel(settings.invoiceBuilderSettings.itemLabel || 'Item');
        setInvoiceCustomColumns(settings.invoiceBuilderSettings.customColumns || []);
      }

      if (settings.inventorySettings) {
        setEnableVariantTracking(settings.inventorySettings.enableVariantTracking === true);
        setEnableWarehouseTracking(settings.inventorySettings.enableWarehouseTracking === true);
        setEnableBatchExpiry(settings.inventorySettings.enableBatchExpiry === true);
        setEnableBarcodeSku(settings.inventorySettings.enableBarcodeSku !== false);
      }
    }
  }, [settings]);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) setIsLoading(false);
    else { const t = setTimeout(() => setIsLoading(false), 500); return () => clearTimeout(t); }
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

  // Mark dirty on any field change
  useEffect(() => {
    if (!isInitialized.current) return;
    setIsDirty(true);
  }, [
    businessName, businessType, ownerName, phone, whatsapp, email, address, gstNumber, geminiApiKey, twilioAccountSid, twilioAuthToken,
    country, language, currency, currencyCode, taxLabel, vatTax, dateFormat, numberFormat,
    invoicePrefix, defaultTax, defaultNotes, terms, pdfFooter, brandColor, invoiceTemplate, defaultBillingTemplate,
    upiId, bkashNumber, nagadNumber, rocketNumber, payeeName, paymentNote, paymentQrEnabled, paymentMethod,
    customPaymentLink, showQrInPdf, showQrInPreview,
    enableLiveLink, showPaymentQrOnLink, allowPdfDownload, allowPaymentProofSubmit, allowWhatsappProofSubmit,
    showPaidDueAmount, showContactButton, requireTransactionId, requirePaymentScreenshot,
    themeId, darkMode, logoUrl, cornerRadius, shadowIntensity, animationSpeed, fontDensity,
    emailNotifications, whatsappNotifications, dueDateReminders, paymentConfirmation, marketingEmails, securityAlerts,
    whatsappMessageTemplate,
    cyberPortals, removeBgApiKey, enablePhotoMaker,
    invoiceItemLabel, invoiceCustomColumns,
    enableVariantTracking, enableWarehouseTracking, enableBatchExpiry, enableBarcodeSku
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

  // Navigation Filter
  const getDynamicNav = () => {
    let baseNav = [...NAV_GROUPS];
    if (businessType === 'cybercafe') {
      baseNav.splice(1, 0, {
        group: 'Cyber Cafe',
        description: 'Portal Hub & AI photo tools',
        icon: Zap,
        items: [
          { id: 'cyber-portals', label: 'Portal Hub Config', icon: Link, description: 'Manage quick links', mode: 'simple' },
          { id: 'cyber-tools', label: 'Tools & AI Config', icon: Zap, description: 'Background remover & APIs', mode: 'advanced' }
        ]
      });
    }
    return baseNav;
  };

  const filteredNav = useMemo(() => {
    const dNav = getDynamicNav();
    return dNav.map(g => {
      let items = g.items;
      if (settingsMode === 'Simple') {
        items = items.filter(item => item.mode !== 'advanced');
      } else if (settingsMode === 'Advanced') {
        items = items.filter(item => item.mode === 'advanced' || item.id === 'business');
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        items = items.filter(item =>
          (item.label?.toLowerCase().includes(q)) || 
          (item.description?.toLowerCase().includes(q)) || 
          (item.id.includes(q))
        );
      }
      return { ...g, items };
    }).filter(g => g.items.length > 0);
  }, [searchQuery, businessType, settingsMode]);

  const currentSectionItem = useMemo(() => {
    const dNav = getDynamicNav();
    for (const g of dNav) {
      const found = g.items.find(i => i.id === activeSection);
      if (found) return found;
    }
    return { label: 'Business Profile', icon: Building2 };
  }, [activeSection, businessType]);

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

  // Save Settings Payload
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
          allowPaymentProofSubmit: allowPaymentProofSubmit, allowWhatsappProofSubmit: allowWhatsappProofSubmit, showPaidDueAmount: showPaidDueAmount,
          showContactButton: showContactButton, requireTransactionId, requirePaymentScreenshot,
          selectedLiveLinkTemplate: settings?.customerLiveLinkSettings?.selectedLiveLinkTemplate || 'classic',
          themePreset: settings?.customerLiveLinkSettings?.themePreset || themeId,
          ctaPreset: settings?.customerLiveLinkSettings?.ctaPreset || 'payNow',
          conversionLayout: settings?.customerLiveLinkSettings?.conversionLayout || 'modern'
        },
        whatsappMessageTemplate,
        notifications: { email: emailNotifications, whatsapp: whatsappNotifications, dueDateReminders, paymentConfirmation, marketing: marketingEmails, securityAlerts },
        cyberCafeConfig: { portals: cyberPortals, removeBgApiKey, enablePhotoMaker },
        invoiceBuilderSettings: {
          enableProductAutocomplete,
          enableTemplateSwitcher,
          enableItemLevelDiscount,
          enableItemLevelTax,
          enableDragAndDrop,
          enableDigitalSignature,
          enableLivePreview,
          itemLabel: invoiceItemLabel,
          customColumns: invoiceCustomColumns
        },
        inventorySettings: {
          enableVariantTracking,
          enableWarehouseTracking,
          enableBatchExpiry,
          enableBarcodeSku
        }
      };
      onSaveSettings(payload);
      setIsDirty(false);
      setSaveState('saved');
      setLastSaved(new Date());
      toast.success('Settings saved successfully');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
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
      setAllowWhatsappProofSubmit(settings.customerLiveLinkSettings.allowWhatsappProofSubmit !== undefined ? settings.customerLiveLinkSettings.allowWhatsappProofSubmit : false);
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
    setWhatsappMessageTemplate(settings.whatsappMessageTemplate || DEFAULT_WHATSAPP_TEMPLATE);
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
    }
    
    if (settings.inventorySettings) {
      setEnableVariantTracking(settings.inventorySettings.enableVariantTracking === true);
      setEnableWarehouseTracking(settings.inventorySettings.enableWarehouseTracking === true);
      setEnableBatchExpiry(settings.inventorySettings.enableBatchExpiry === true);
      setEnableBarcodeSku(settings.inventorySettings.enableBarcodeSku !== false);
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
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-theme-primary tracking-tight">Business Profile & Identity</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Your official business name, logo, legal tax identifiers, and contact details.</p>
            </div>

            {/* SECTION 1: BRAND IDENTITY */}
            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-4">
              <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Brand Identity</h3>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-theme-surface/50 border border-theme-border-soft">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-2xl border border-theme-border-soft bg-theme-card flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-xs">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Business Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center font-black text-base">
                        {businessName ? businessName.slice(0, 2).toUpperCase() : 'BQ'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-theme-primary truncate">{businessName || 'Your Business Name'}</p>
                    <p className="text-xs text-theme-muted font-medium mt-0.5 capitalize">{businessType || 'Retail / Services'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <label className="px-3.5 py-2 rounded-xl bg-theme-card border border-theme-border-soft hover:bg-theme-surface text-theme-primary font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-theme-accent" />
                    <span>{logoUrl ? 'Replace Logo' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files[0];
                        if (f && f.type.startsWith('image/')) setLogoUrl(await compressImage(f));
                      }}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <button
                      onClick={() => setLogoUrl('')}
                      className="px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-500 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-theme-muted mb-1 uppercase tracking-wider">Logo URL (Optional Direct Link)</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent focus:bg-theme-card transition-all"
                />
              </div>
            </div>

            {/* SECTION 2: BUSINESS INFORMATION */}
            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-4">
              <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Legal & Trade Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">Business Name</label>
                  <p className="text-[11px] text-theme-muted mb-1.5">Official company or store name displayed on invoices.</p>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Innovations Ltd."
                    className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent focus:bg-theme-card transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">Owner / Manager Name</label>
                  <p className="text-[11px] text-theme-muted mb-1.5">Authorized signatory or proprietor name.</p>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent focus:bg-theme-card transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">Business Category / Preset</label>
                  <p className="text-[11px] text-theme-muted mb-1.5">Adapts bill columns and terminology.</p>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent focus:bg-theme-card transition-all"
                  >
                    {BUSINESS_PRESETS.map(preset => (
                      <option key={preset.id} value={preset.id}>{preset.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">GSTIN / Tax Registration ID</label>
                  <p className="text-[11px] text-theme-muted mb-1.5">Official government tax ID printed on invoice header.</p>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent focus:bg-theme-card transition-all font-numbers"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: CONTACT & LOCATION */}
            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-4">
              <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Contact & Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">Phone Number</label>
                  <div className="relative mt-1">
                    <Phone className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent focus:bg-theme-card transition-all font-numbers"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">WhatsApp Number</label>
                  <div className="relative mt-1">
                    <MessageCircle className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent focus:bg-theme-card transition-all font-numbers"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">Primary Business Email</label>
                  <div className="relative mt-1">
                    <Mail className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={loggedInEmail}
                      readOnly
                      className="w-full pl-9 pr-3.5 py-2.5 bg-theme-surface/40 border border-theme-border-soft/60 rounded-xl text-xs font-medium text-theme-muted cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">Physical / Billing Address</label>
                  <div className="relative mt-1">
                    <MapPin className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-3 pointer-events-none" />
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      placeholder="Shop No, Street, City, State, ZIP code"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent focus:bg-theme-card transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'workspace':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-theme-primary tracking-tight">Workspace & Regional Settings</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Localization, currencies, numerical formats, and tax labels.</p>
            </div>

            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-4">
              <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Regional Formatting</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-1">Country Setup</label>
                  <select value={country} onChange={(e) => handleCountryAutoConfigure(e.target.value)} className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all">
                    <option value="India">India (INR, GST, UPI)</option>
                    <option value="Bangladesh">Bangladesh (BDT, VAT, bKash)</option>
                    <option value="Other">International (USD, Standard)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-1">Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all">
                    <option value="English">English</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-1">Currency Symbol</label>
                  <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all font-numbers" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-1">Currency Code (ISO)</label>
                  <input type="text" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all font-numbers" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-1">Tax Nomenclature</label>
                  <select value={taxLabel} onChange={(e) => setTaxLabel(e.target.value)} className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all">
                    <option value="GST">GST</option>
                    <option value="VAT">VAT</option>
                    <option value="Tax">Sales Tax</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-1">Date Format</label>
                  <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-1">Number Formatting</label>
                  <select value={numberFormat} onChange={(e) => setNumberFormat(e.target.value)} className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all">
                    <option value="Indian">Indian Lakh/Crore (1,23,456.78)</option>
                    <option value="Standard">Standard International (123,456.78)</option>
                    <option value="European">European (123.456,78)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-1">Default Tax Rate (%)</label>
                  <input type="number" value={defaultTax} onChange={(e) => setDefaultTax(e.target.value)} className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all font-numbers" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'modules':
        return (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-theme-primary tracking-tight">Modules & Feature Control</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Toggle optional capabilities for your workspace. Disabling a module hides its UI without deleting data.</p>
            </div>
            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs">
              <FeatureControlStudio workspaceId={settings?.activeWorkspaceId} />
            </div>
          </div>
        );

      case 'theme-engine':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-theme-primary tracking-tight">Brand Theme & Appearance</h2>
                <p className="text-xs font-semibold text-theme-muted mt-0.5">Curated luxury colorways, dark mode, and interface dynamics.</p>
              </div>
              <button
                type="button"
                onClick={handleToggleDark}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-card border border-theme-border-soft text-xs font-bold text-theme-primary hover:bg-theme-surface transition-all cursor-pointer shadow-xs"
              >
                {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
              </button>
            </div>

            {/* LUXURY THEME SWATCHES */}
            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Design System Colorways</h3>
                <span className="text-[10px] font-bold text-theme-muted uppercase">{ALL_THEMES.length} Presets Available</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {ALL_THEMES.map(({ id, name, category }) => {
                  const info = THEME_INFO[id];
                  const isActive = themeId === id;
                  const colors = info?.colors || ['#14b8a6', '#0f172a', '#f8fafc'];
                  return (
                    <button
                      key={id}
                      onClick={() => handleApplyTheme(id)}
                      className={`relative rounded-2xl p-3 text-left transition-all cursor-pointer border flex flex-col justify-between group ${
                        isActive
                          ? 'border-theme-accent bg-theme-accent/5 ring-2 ring-theme-accent/30 shadow-md scale-[1.02]'
                          : 'border-theme-border-soft bg-theme-surface/50 hover:border-theme-accent/40 hover:bg-theme-surface'
                      }`}
                    >
                      <div>
                        {/* Mini Color Swatch Bar */}
                        <div className="flex items-center gap-1.5 mb-2.5">
                          {colors.slice(0, 3).map((c, i) => (
                            <div
                              key={i}
                              className="h-3.5 flex-1 rounded-md shadow-2xs border border-black/10"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <p className="text-xs font-bold text-theme-primary truncate">{name}</p>
                        <p className="text-[9px] font-semibold text-theme-muted uppercase tracking-wider mt-0.5">{category}</p>
                      </div>

                      {isActive && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-theme-accent text-white flex items-center justify-center text-[9px] shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CUSTOM BRAND COLOR & METRICS */}
            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-4">
              <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Custom Accent & Styling Metrics</h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-theme-surface/50 border border-theme-border-soft">
                <div>
                  <label className="block text-xs font-bold text-theme-primary">Custom Brand Accent</label>
                  <p className="text-[11px] text-theme-muted mt-0.5">Use your exact brand hex code.</p>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => {
                      setBrandColor(e.target.value);
                      setThemeId('custom');
                      applyTheme('custom', e.target.value, darkMode, false);
                    }}
                    className="w-9 h-9 rounded-xl cursor-pointer border border-theme-border-soft bg-transparent"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => {
                      setBrandColor(e.target.value);
                      setThemeId('custom');
                      applyTheme('custom', e.target.value, darkMode, false);
                    }}
                    className="w-28 px-3 py-2 bg-theme-card border border-theme-border-soft rounded-xl text-xs font-mono font-bold text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {[
                  { label: 'Corner Radius', value: cornerRadius, set: (v) => { setCornerRadius(v); applyTheme(themeId, brandColor, darkMode, false); document.documentElement.style.setProperty('--radius-base', `${v}px`); }, min: 4, max: 24, unit: 'px' },
                  { label: 'Shadow Depth', value: shadowIntensity, set: (v) => { setShadowIntensity(v); document.documentElement.style.setProperty('--shadow-opacity', `${v / 100}`); }, min: 0, max: 100, unit: '%' },
                  { label: 'Motion Speed', value: animationSpeed, set: (v) => { setAnimationSpeed(v); document.documentElement.style.setProperty('--animation-multiplier', `${v}s`); }, min: 0.25, max: 2, step: 0.25, unit: 'x' },
                  { label: 'UI Density', value: fontDensity === 'compact' ? 0 : fontDensity === 'normal' ? 1 : 2, set: (v) => { const newDensity = ['compact', 'normal', 'relaxed'][v]; setFontDensity(newDensity); }, min: 0, max: 2, step: 1, unit: '', display: fontDensity }
                ].map((opt, i) => (
                  <div key={i} className="p-3.5 bg-theme-surface/50 border border-theme-border-soft rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-theme-muted uppercase">
                      <span>{opt.label}</span>
                      <span className="text-theme-primary font-mono">{opt.display || opt.value}{opt.unit}</span>
                    </div>
                    <input
                      type="range"
                      min={opt.min}
                      max={opt.max}
                      step={opt.step || 1}
                      value={typeof opt.value === 'number' ? opt.value : 0}
                      onChange={(e) => opt.set(parseFloat(e.target.value))}
                      className="w-full accent-theme-accent h-1.5 bg-theme-border-soft rounded-lg cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'invoice-builder':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-theme-primary tracking-tight">Invoice Builder & Numbering</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Customize default invoice prefixes, numbering, line-item capabilities, and custom table columns.</p>
            </div>

            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-4">
              <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Numbering & Default Terms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-1">Invoice Prefix</label>
                  <input type="text" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="INV-" className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-1">Default Item / Product Label</label>
                  <input type="text" value={invoiceItemLabel} onChange={(e) => setInvoiceItemLabel(e.target.value)} placeholder="e.g. Item, Product, Service" className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-theme-primary mb-1">Default Payment Terms</label>
                  <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} placeholder="e.g. Payment due within 7 days of invoice date." className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all resize-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-theme-primary mb-1">PDF Footer Notice / Bank Details</label>
                  <textarea value={pdfFooter} onChange={(e) => setPdfFooter(e.target.value)} rows={2} placeholder="e.g. Thank you for your business! Bank: HDFC Bank, A/C: 1234567890" className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all resize-none" />
                </div>
              </div>
            </div>

            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-4">
              <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Line Item & Builder Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ToggleSwitch enabled={enableProductAutocomplete} onChange={setEnableProductAutocomplete} label="Product Autocomplete" description="Auto-suggest items from catalog as you type." />
                <ToggleSwitch enabled={enableTemplateSwitcher} onChange={setEnableTemplateSwitcher} label="Template Switcher" description="Allow instant theme & layout switching during creation." />
                <ToggleSwitch enabled={enableItemLevelDiscount} onChange={setEnableItemLevelDiscount} label="Item-Level Discount" description="Allow per-item discount % or amount." />
                <ToggleSwitch enabled={enableItemLevelTax} onChange={setEnableItemLevelTax} label="Item-Level Tax Breakdown" description="Allow distinct tax rates per line item." />
                <ToggleSwitch enabled={enableDragAndDrop} onChange={setEnableDragAndDrop} label="Drag & Drop Rows" description="Reorder invoice line items interactively." />
                <ToggleSwitch enabled={enableDigitalSignature} onChange={setEnableDigitalSignature} label="Digital Signature Pad" description="Add authorized sign-off box on bills." />
              </div>
            </div>

            {/* CUSTOM TABLE COLUMNS */}
            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Custom Table Columns</h3>
                  <p className="text-[11px] text-theme-muted mt-0.5">Add extra fields to line items (e.g. Size, Batch No, HSN code, Warranty).</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInvoiceCustomColumns([...invoiceCustomColumns, { id: 'col_' + Date.now(), name: '', type: 'text', options: '' }])}
                  className="px-3 py-1.5 text-xs font-bold bg-theme-accent text-white rounded-xl shadow-xs hover:opacity-90 transition-all cursor-pointer"
                >
                  + Add Column
                </button>
              </div>

              {invoiceCustomColumns.length === 0 ? (
                <p className="text-xs text-theme-muted p-4 bg-theme-surface/40 rounded-xl border border-dashed border-theme-border-soft text-center font-medium">No custom columns added yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {invoiceCustomColumns.map((col, index) => (
                    <div key={col.id} className="flex flex-wrap items-center gap-3 p-3 bg-theme-surface/50 border border-theme-border-soft rounded-xl">
                      <input
                        type="text"
                        value={col.name}
                        onChange={(e) => {
                          const newCols = [...invoiceCustomColumns];
                          newCols[index].name = e.target.value;
                          setInvoiceCustomColumns(newCols);
                        }}
                        className="flex-1 min-w-[120px] px-3 py-1.5 text-xs font-semibold bg-theme-card border border-theme-border-soft rounded-lg text-theme-primary focus:outline-none focus:border-theme-accent"
                        placeholder="Column Name (e.g. HSN)"
                      />
                      <select
                        value={col.type}
                        onChange={(e) => {
                          const newCols = [...invoiceCustomColumns];
                          newCols[index].type = e.target.value;
                          setInvoiceCustomColumns(newCols);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-theme-card border border-theme-border-soft rounded-lg text-theme-primary focus:outline-none focus:border-theme-accent"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="dropdown">Dropdown</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setInvoiceCustomColumns(invoiceCustomColumns.filter((_, i) => i !== index))}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Remove Column"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-theme-primary tracking-tight">Payment Methods & QR Gateway</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Configure UPI, bKash, Nagad, dynamic payment QR codes, and customer proof submissions.</p>
            </div>

            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-4">
              <ToggleSwitch
                enabled={paymentQrEnabled}
                onChange={setPaymentQrEnabled}
                label="Enable Digital Payments & QR"
                description="Display dynamic QR codes and gateway options on PDF and Live Link invoices."
              />

              {paymentQrEnabled && (
                <div className="space-y-4 pt-2 border-t border-theme-border-soft">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-theme-primary mb-1">Primary Payment Channel</label>
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all">
                        <option value="UPI">UPI (India - GPay, PhonePe, Paytm)</option>
                        <option value="bKash">bKash (Bangladesh Mobile Banking)</option>
                        <option value="Nagad">Nagad (Bangladesh)</option>
                        <option value="Rocket">Rocket (DBBL)</option>
                        <option value="Bank">Bank Account Transfer</option>
                        <option value="Manual">Custom Payment Link</option>
                      </select>
                    </div>

                    {paymentMethod === 'UPI' && (
                      <div>
                        <label className="block text-xs font-bold text-theme-primary mb-1">UPI VPA / ID</label>
                        <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="merchant@okhdfcbank" className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all font-mono" />
                      </div>
                    )}

                    {paymentMethod === 'bKash' && (
                      <div>
                        <label className="block text-xs font-bold text-theme-primary mb-1">bKash Merchant / Personal Number</label>
                        <input type="text" value={bkashNumber} onChange={(e) => setBkashNumber(e.target.value)} placeholder="01XXXXXXXXX" className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all font-numbers" />
                      </div>
                    )}

                    {paymentMethod === 'Nagad' && (
                      <div>
                        <label className="block text-xs font-bold text-theme-primary mb-1">Nagad Number</label>
                        <input type="text" value={nagadNumber} onChange={(e) => setNagadNumber(e.target.value)} placeholder="01XXXXXXXXX" className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all font-numbers" />
                      </div>
                    )}

                    {paymentMethod === 'Rocket' && (
                      <div>
                        <label className="block text-xs font-bold text-theme-primary mb-1">Rocket Number</label>
                        <input type="text" value={rocketNumber} onChange={(e) => setRocketNumber(e.target.value)} placeholder="01XXXXXXXXXX" className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all font-numbers" />
                      </div>
                    )}

                    {paymentMethod === 'Manual' && (
                      <div>
                        <label className="block text-xs font-bold text-theme-primary mb-1">Custom Payment Link</label>
                        <input type="url" value={customPaymentLink} onChange={(e) => setCustomPaymentLink(e.target.value)} placeholder="https://buy.stripe.com/..." className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all" />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-theme-primary mb-1">Payee Name (Receiver Display)</label>
                      <input type="text" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} placeholder="e.g. Khairul Basar" className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-theme-primary mb-1">Payment Instructions Note</label>
                      <input type="text" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="e.g. Scan QR and attach screenshot of receipt" className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-theme-border-soft">
                    <ToggleSwitch enabled={showQrInPreview} onChange={setShowQrInPreview} label="Show QR on Interactive Preview" description="Display QR in browser preview modal." />
                    <ToggleSwitch enabled={showQrInPdf} onChange={setShowQrInPdf} label="Show QR on PDF Export" description="Print dynamic scannable QR on downloaded A4/A5 PDFs." />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'pdf-templates':
        return (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-theme-primary tracking-tight">PDF Invoice Templates</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Select and configure visual layout styles for printed and downloaded PDF documents.</p>
            </div>
            <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs">
              <PdfTemplateStudio
                setCurrentTab={(tab) => {
                  if (tab === 'dashboard') setCurrentTab?.('dashboard');
                  else if (tab === 'settings') setActiveSection('business');
                  else setActiveSection(tab);
                }}
                businessSettings={settings}
                setSettings={onSaveSettings}
              />
            </div>
          </div>
        );

      case 'live-link-templates':
        return (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-theme-primary tracking-tight">Live Link Invoice Templates</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Configure client-facing live web links, self-service payments, and proof upload layouts.</p>
            </div>
            <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs">
              <LiveLinkTemplateStudio
                setCurrentTab={(tab) => {
                  if (tab === 'dashboard') setCurrentTab?.('dashboard');
                  else if (tab === 'settings') setActiveSection('business');
                  else setActiveSection(tab);
                }}
                businessSettings={settings}
                setSettings={onSaveSettings}
              />
            </div>
          </div>
        );

      case 'design-studio':
        return (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-theme-primary tracking-tight">Universal Design Studio</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Unified design center connecting themes, templates, and branding tokens.</p>
            </div>
            <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs">
              <DesignStudio
                setCurrentTab={setCurrentTab}
                businessSettings={settings}
                onSaveSettings={onSaveSettings}
              />
            </div>
          </div>
        );

      case 'template-marketplace':
        return (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-theme-primary tracking-tight">Template Marketplace</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Browse community layouts, thermal receipt templates, and specialized industry designs.</p>
            </div>
            <div className="bg-theme-card rounded-2xl p-4 border border-theme-border-soft shadow-xs">
              <TemplateMarketplace
                setCurrentTab={setCurrentTab}
                businessSettings={settings}
              />
            </div>
          </div>
        );

      case 'inventory-settings':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-theme-primary tracking-tight">Inventory & Product Tracking</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Enable SKU barcoding, size/color variant matrices, multi-warehouse tracking, and batch expiry dates.</p>
            </div>
            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ToggleSwitch enabled={enableBarcodeSku} onChange={setEnableBarcodeSku} label="Barcode & SKU Tracking" description="Enable barcode scanners and SKU lookups across catalog." />
                <ToggleSwitch enabled={enableVariantTracking} onChange={setEnableVariantTracking} label="Product Variants (Size/Color)" description="Manage size, color, material, and style matrices." />
                <ToggleSwitch enabled={enableWarehouseTracking} onChange={setEnableWarehouseTracking} label="Multi-Warehouse & Shelf" description="Track physical inventory locations and stock bins." />
                <ToggleSwitch enabled={enableBatchExpiry} onChange={setEnableBatchExpiry} label="Batch & Expiry Dates" description="Crucial for pharmacy, FMCG, and perishable inventory." />
              </div>
            </div>
          </div>
        );

      case 'whatsapp-template':
        return (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-theme-primary tracking-tight">WhatsApp & Message Templates</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Customize automatic billing share texts and payment reminder notices.</p>
            </div>
            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs">
              <MessageTemplateStudio
                settings={settings}
                whatsappMessageTemplate={whatsappMessageTemplate}
                setWhatsappMessageTemplate={setWhatsappMessageTemplate}
              />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-theme-primary tracking-tight">Notifications & Automated Alerts</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Configure client email notices, WhatsApp reminders, and system alerts.</p>
            </div>
            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-3">
              <ToggleSwitch enabled={emailNotifications} onChange={setEmailNotifications} label="Email Invoices & Receipts" description="Send PDF copy automatically when invoice is generated." />
              <ToggleSwitch enabled={whatsappNotifications} onChange={setWhatsappNotifications} label="WhatsApp Dispatch" description="Prompt instant WhatsApp share modal after invoice creation." />
              <ToggleSwitch enabled={dueDateReminders} onChange={setDueDateReminders} label="Due Date Reminders" description="Alert customers 24 hours before payment is due." />
              <ToggleSwitch enabled={paymentConfirmation} onChange={setPaymentConfirmation} label="Payment Confirmation Receipts" description="Notify customer when digital payment proof is verified." />
              <ToggleSwitch enabled={securityAlerts} onChange={setSecurityAlerts} label="Security & Sync Alerts" description="Notify on unverified logins or offline sync conflicts." />
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-theme-primary tracking-tight">Security, API Keys & Credentials</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Manage external AI keys, SMS gateways, and cloud sync providers securely.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Account</span>
                </div>
                <p className="text-xs font-bold text-theme-primary">Authenticated</p>
                <p className="text-[10px] font-mono text-theme-muted truncate mt-0.5">{loggedInEmail}</p>
              </div>

              <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-theme-accent" />
                  <span className="text-[10px] font-bold text-theme-accent uppercase tracking-wider">Storage Engine</span>
                </div>
                <select
                  value={dbProvider}
                  onChange={(e) => { setDbProvider(e.target.value); localStorage.setItem('billmint_db_provider', e.target.value); }}
                  className="text-xs w-full bg-theme-surface border border-theme-border-soft rounded-xl px-2.5 py-1.5 font-bold text-theme-primary"
                >
                  <option value="firebase">Firebase (Cloud-Synced)</option>
                  <option value="indexeddb">IndexedDB (Local-First)</option>
                </select>
              </div>

              <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  {firebaseStatus === 'connected' ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-amber-500" />}
                  <span className="text-[10px] font-bold uppercase tracking-wider">{firebaseStatus === 'connected' ? 'Connected' : 'Offline Mode'}</span>
                </div>
                <p className="text-xs font-semibold text-theme-muted">
                  {firebaseStatus === 'connected' ? 'Real-time database active' : 'Storing locally in IndexedDB'}
                </p>
              </div>
            </div>

            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-4">
              <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">API Keys (Encrypted)</h3>
              <div>
                <label className="block text-xs font-bold text-theme-primary mb-1">Gemini AI API Key (Smart Invoice OCR & Assist)</label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-mono text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-1">Twilio Account SID</label>
                  <input
                    type="text"
                    value={twilioAccountSid}
                    onChange={(e) => setTwilioAccountSid(e.target.value)}
                    placeholder="AC..."
                    className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-mono text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-1">Twilio Auth Token</label>
                  <input
                    type="password"
                    value={twilioAuthToken}
                    onChange={(e) => setTwilioAuthToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-mono text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-theme-primary tracking-tight">Users & Workspace Roles</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Team management, role-based access control (RBAC), and session permissions.</p>
            </div>
            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-theme-surface/50 border border-theme-border-soft">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-theme-accent/10 text-theme-accent flex items-center justify-center font-bold">
                    {loggedInEmail.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-theme-primary">{ownerName || loggedInEmail.split('@')[0]}</p>
                    <p className="text-[11px] text-theme-muted font-mono">{loggedInEmail}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-theme-accent/10 text-theme-accent font-bold text-[10px] uppercase border border-theme-accent/20">
                  Workspace Owner (Admin)
                </span>
              </div>
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="animate-fadeIn">
            <Subscription currentSubscription={subscription} onUpgrade={onUpgrade} businessSettings={settings} />
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-theme-primary tracking-tight">Backup & Data Recovery</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Download full JSON workspace archive or restore records safely.</p>
            </div>
            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs">
              <BackupRestore
                settings={settings}
                invoices={invoices}
                customers={customers}
                products={products}
                expenses={expenses}
                onImportBackup={onImportBackup}
              />
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-black text-rose-500 tracking-tight">Advanced / Danger Zone</h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">Perform maintenance tasks and database cleanups with extreme care.</p>
            </div>
            <div className="bg-theme-card rounded-2xl p-5 border border-rose-500/20 shadow-xs space-y-3">
              {[
                {
                  label: 'Clean Duplicate Draft Invoices',
                  desc: 'Remove blank zero-amount draft invoices safely without affecting completed sales.',
                  action: async () => {
                    const r = await adminEngine.cleanDuplicateDrafts();
                    toast.success('Cleaned ' + (r || 0) + ' draft invoices');
                  },
                  danger: false
                },
                {
                  label: 'Empty Trashed Invoices',
                  desc: 'Permanently purge soft-deleted invoices from trash.',
                  action: async () => {
                    const r = await adminEngine.emptyTrash();
                    toast.success('Purged ' + (r?.count || 0) + ' trashed items');
                  },
                  danger: false
                },
                {
                  label: 'Clear Local Storage Cache',
                  desc: 'Reset UI cache and local storage keys without deleting Firestore cloud data.',
                  action: async () => {
                    if (confirm('Clear temporary local cache?')) {
                      adminEngine.clearCacheOnly();
                      toast.success('Cache cleared successfully');
                    }
                  },
                  danger: false
                },
                {
                  label: 'Factory Reset All Local Data',
                  desc: 'Permanently wipe local IndexedDB store. Cloud data remains untouched.',
                  action: async () => {
                    if (confirm('Permanently wipe local workspace data? This cannot be undone.')) {
                      await adminEngine.clearAllLocalData();
                      toast.success('Data wiped successfully');
                      window.location.href = '/';
                    }
                  },
                  danger: true
                }
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    item.danger
                      ? 'border-rose-500/30 bg-rose-500/5'
                      : 'border-theme-border-soft bg-theme-surface/50'
                  }`}
                >
                  <div className="pr-4">
                    <p className={`text-xs font-bold ${item.danger ? 'text-rose-500' : 'text-theme-primary'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-theme-muted font-medium mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={item.action}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      item.danger
                        ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-xs'
                        : 'bg-theme-card border border-theme-border-soft hover:bg-theme-surface text-theme-primary'
                    }`}
                  >
                    Execute
                  </button>
                </div>
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
        return null;
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="settings-studio-premium min-h-screen pb-32 font-sans w-full bg-theme-app text-theme-primary">
      {/* 1. TOP SETTINGS HEADER */}
      <header className="settings-topbar sticky top-0 z-30 bg-theme-app/90 backdrop-blur-xl border-b border-theme-border-soft">
        <div className="w-full px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Back + Current Section Info + Status */}
          <div className="flex items-center gap-3 min-w-0">
            {setCurrentTab && (
              <button 
                onClick={() => setCurrentTab('dashboard')} 
                title="Back to Dashboard"
                aria-label="Back to Dashboard"
                className="w-8 h-8 rounded-xl bg-theme-surface border border-theme-border-soft hover:border-theme-accent/40 transition-all flex items-center justify-center text-theme-secondary hover:text-theme-primary shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
                {currentSectionItem?.icon && React.createElement(currentSectionItem.icon, { className: "w-3.5 h-3.5" })}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black text-theme-primary tracking-tight truncate">
                    {currentSectionItem?.label || 'Business Profile'}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Synced
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Search Settings */}
          <div className="hidden md:flex flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-muted pointer-events-none" />
            <input
              type="text" 
              value={searchQuery} 
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search settings..." 
              className="w-full pl-9 pr-8 py-1.5 bg-theme-surface/70 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Right: Actions + Save */}
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <>
                <button onClick={handleExport} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-theme-secondary bg-theme-surface border border-theme-border-soft hover:bg-theme-surface-elevated transition-all cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Export</span>
                </button>
                <label className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-theme-secondary bg-theme-surface border border-theme-border-soft hover:bg-theme-surface-elevated cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Import</span>
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </>
            )}

            <button 
              onClick={() => setShowPreview(!showPreview)}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showPreview 
                  ? 'text-theme-accent bg-theme-accent/10 border-theme-accent/30' 
                  : 'text-theme-secondary bg-theme-surface border-theme-border-soft hover:bg-theme-surface-elevated'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> <span>Preview</span>
            </button>

            {isDirty && (
              <button 
                onClick={handleDiscard}
                title="Discard Changes"
                aria-label="Discard Changes"
                className="px-3 py-1.5 text-xs font-bold text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
              >
                Discard
              </button>
            )}

            <button 
              onClick={() => handleSave(null)} 
              disabled={isSaving || !isDirty}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isDirty 
                  ? 'bg-theme-accent text-white hover:opacity-95 shadow-sm' 
                  : 'bg-theme-surface border border-theme-border-soft text-theme-muted opacity-60 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. WORKSPACE CONTEXT BAR */}
      <div className="settings-contextbar bg-theme-surface/50 border-b border-theme-border-soft/70 px-4 lg:px-6 py-2 flex items-center justify-between text-xs text-theme-muted">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-theme-accent" />
          <span className="font-bold text-theme-primary">{settings?.businessName || 'BillQyro Workspace'}</span>
          <span className="text-theme-border-strong">•</span>
          <span className="font-mono text-[11px] text-theme-muted">ID: {settings?.activeWorkspaceId || 'ws_primary'}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Cloud Sync
          </span>
          <span className="flex items-center gap-1 text-theme-muted font-bold">
            <span>▣</span> Workspace Isolated
          </span>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: CONTROL SIDEBAR + CONTENT PANE */}
      <div className="settings-content-shell flex w-full min-h-[calc(100vh-110px)]">
        {/* SETTINGS CONTROL SIDEBAR */}
        <aside className="settings-sidebar w-60 lg:w-64 border-r border-theme-border-soft bg-theme-surface/30 shrink-0 p-3 space-y-3 hidden md:flex md:flex-col">
          <div className="settings-sidebar-header px-2 py-1">
            <h2 className="text-xs font-black text-theme-primary tracking-tight">Settings</h2>
            <p className="text-[10px] font-semibold text-theme-muted">SaaS Control Center</p>
          </div>

          {/* Mode Tabs: All | Simple | Advanced */}
          <div className="settings-mode-tabs flex bg-theme-surface p-0.5 rounded-lg border border-theme-border-soft text-[11px] font-bold">
            {['All', 'Simple', 'Advanced'].map(mode => (
              <button
                key={mode}
                onClick={() => setSettingsMode(mode)}
                className={`flex-1 py-1 text-center rounded-md transition-all cursor-pointer ${
                  settingsMode === mode 
                    ? 'bg-theme-card text-theme-primary shadow-xs border border-theme-border-soft' 
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Navigation Groups */}
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
            {filteredNav.map(group => (
              <div key={group.group} className="settings-nav-group space-y-1">
                <div className="settings-nav-group-title">
                  <span className="settings-nav-group-title-main">{group.group}</span>
                  <span className="settings-nav-group-count">{group.items.length}</span>
                  <span className="settings-nav-group-description">{group.description}</span>
                </div>
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const isSelected = activeSection === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        data-selected={isSelected ? 'true' : 'false'}
                        className={`settings-nav-item w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface))] border-l-[3px] border-theme-accent text-theme-accent font-bold shadow-xs'
                            : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-surface/70'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-theme-accent' : 'text-theme-muted'}`} />
                        <span className="truncate flex-1">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* CONTENT PANE & LIVE PREVIEW */}
        <div className="settings-main-pane flex-1 min-w-0 p-4 lg:p-6 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0 settings-render-surface">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Contextual Live Preview Panel */}
          {showPreview && (
            <div className="settings-preview w-full lg:w-80 shrink-0">
              <LivePreviewPanel themeId={themeId} darkMode={darkMode} brandColor={brandColor} settings={settings} />
            </div>
          )}
        </div>
      </div>

      {/* Sticky Floating Save Bar */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="sticky-save-bar fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-theme-card/95 border-t border-theme-border-soft shadow-2xl"
          >
            <div className="max-w-full mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-primary">Unsaved changes pending</p>
                  <p className="text-[10px] text-theme-muted font-medium">Press Ctrl+S or click Save Changes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDiscard}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-theme-secondary bg-theme-surface border border-theme-border-soft hover:bg-theme-surface-elevated transition-all cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={() => handleSave(null)}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-theme-accent hover:opacity-95 transition-all disabled:opacity-40 shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-3.5 h-3.5" /> Save Changes</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Horizontal Category Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-theme-card border-t border-theme-border-soft overflow-x-auto custom-scrollbar">
        <div className="flex items-center justify-around px-2 py-1.5 min-w-max">
          {NAV_GROUPS.map((group) => {
            const firstItem = group.items[0];
            const Icon = group.icon;
            const isActive = group.items.some(i => i.id === activeSection);
            return (
              <button
                key={group.group}
                onClick={() => setActiveSection(firstItem?.id || group.group)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all min-w-[50px] min-h-[44px] justify-center cursor-pointer ${
                  isActive ? 'text-theme-accent font-bold' : 'text-theme-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[8px] font-bold whitespace-nowrap">{group.group}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsStudioV2;
