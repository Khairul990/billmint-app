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
  BookOpen, DollarSign, Percent, Printer, Share2, Send, Box, PackageSearch
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
    icon: Building2,
    items: [
      { id: 'business', label: 'Business Profile', icon: Building2, description: 'Company details & logo', mode: 'simple' },
      { id: 'modules', label: 'Modules & Features', icon: Sliders, description: 'Enable or disable optional modules', mode: 'advanced' },
      { id: 'workspace', label: 'Workspace', icon: Globe, description: 'Regional & language', mode: 'simple' },
      { id: 'theme-engine', label: 'Appearance & Theme', icon: Palette, description: 'Colors & appearance', mode: 'simple' }
    ]
  },
  {
    group: 'INVENTORY',
    icon: Box,
    items: [
      { id: 'inventory-settings', label: 'Inventory Settings', icon: PackageSearch, description: 'Products, Variants & Tracking', mode: 'advanced' }
    ]
  },
  {
    group: 'INVOICE',
    icon: FileText,
    items: [
      { id: 'invoice-builder', label: 'Invoice & Billing', icon: LayoutTemplate, description: 'Advanced builder settings', mode: 'advanced' },
      { id: 'template-gallery', label: 'Template Gallery', icon: LayoutTemplate, description: 'Unified template selection', mode: 'simple' }
    ]
  },
  {
    group: 'PAYMENTS',
    icon: CreditCard,
    items: [
      { id: 'payment', label: 'Payment Methods', icon: QrCode, description: 'UPI, bKash, Nagad', mode: 'simple' }
    ]
  },
  {
    group: 'COMMUNICATION',
    icon: MessageCircle,
    items: [
      { id: 'whatsapp-template', label: 'Message Templates', icon: MessageCircle, description: 'Customize WhatsApp messages', mode: 'simple' },
      { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Reminders & alerts', mode: 'simple' }
    ]
  },
  {
    group: 'SECURITY',
    icon: Shield,
    items: [
      { id: 'security', label: 'Security & Access', icon: Shield, description: 'API keys & access', mode: 'advanced' },
      { id: 'users', label: 'Users & Roles', icon: Users, description: 'Team management', mode: 'advanced' }
    ]
  },
  {
    group: 'SYSTEM',
    icon: Settings2,
    items: [
      { id: 'subscription', label: 'Subscription & Plan', icon: CreditCard, description: 'Plan & billing', mode: 'simple' },
      { id: 'backup', label: 'Data & Backup', icon: Database, description: 'Data management', mode: 'simple' },
      { id: 'advanced', label: 'Advanced', icon: Settings2, description: 'Danger zone', mode: 'advanced' }
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
  const [settingsMode, setSettingsMode] = useState('All');
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

  // Search
  const getDynamicNav = () => {
    let baseNav = [...NAV_GROUPS];
    if (businessType === 'cybercafe') {
      // Just add the Cyber Cafe group, don't hide anything else so the user has full access
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
    } else {
      setEnableProductAutocomplete(true);
      setEnableTemplateSwitcher(true);
      setEnableItemLevelDiscount(false);
      setEnableItemLevelTax(false);
      setEnableDragAndDrop(true);
      setEnableDigitalSignature(true);
      setEnableLivePreview(true);
    }
    
    if (settings.inventorySettings) {
      setEnableVariantTracking(settings.inventorySettings.enableVariantTracking === true);
      setEnableWarehouseTracking(settings.inventorySettings.enableWarehouseTracking === true);
      setEnableBatchExpiry(settings.inventorySettings.enableBatchExpiry === true);
      setEnableBarcodeSku(settings.inventorySettings.enableBarcodeSku !== false);
    } else {
      setEnableVariantTracking(false);
      setEnableWarehouseTracking(false);
      setEnableBatchExpiry(false);
      setEnableBarcodeSku(true);
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
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div>
              <h2 className="text-xl font-black text-theme-primary tracking-tight">
                Business Profile & Branding
              </h2>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">
                Your official business name, logo, and store identity.
              </p>
            </div>

            {/* SECTION 1: BRAND IDENTITY */}
            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-4">
              <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">
                Brand Identity
              </h3>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-theme-surface/50 border border-theme-border-soft">
                {/* Left: Logo Preview */}
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
                    <p className="text-sm font-bold text-theme-primary truncate">
                      {businessName || 'KB.Embroidery Designer 1118'}
                    </p>
                    <p className="text-xs text-theme-muted font-medium mt-0.5 capitalize">
                      {businessType || 'Retail / Services'}
                    </p>
                  </div>
                </div>

                {/* Right: Upload / Replace Logo */}
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

              {/* Paste Image URL */}
              <div>
                <label className="block text-[11px] font-bold text-theme-muted mb-1 uppercase tracking-wider">
                  Logo URL (Optional)
                </label>
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
              <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">
                Business Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">
                    Business Name
                  </label>
                  <p className="text-[11px] text-theme-muted mb-1.5">Public business name shown to customers.</p>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="KB.Embroidery Designer"
                    className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent focus:bg-theme-card transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">
                    Owner / Manager Name
                  </label>
                  <p className="text-[11px] text-theme-muted mb-1.5">Proprietor or authorized manager name.</p>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Khairul Basar"
                    className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent focus:bg-theme-card transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">
                    Business Type / Preset
                  </label>
                  <p className="text-[11px] text-theme-muted mb-1.5">Adapts terminology and default bill columns.</p>
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
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">
                    GSTIN / Tax Number
                  </label>
                  <p className="text-[11px] text-theme-muted mb-1.5">Optional government registration or tax ID.</p>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="29ABCDE1234F1Z5"
                    className="w-full px-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent focus:bg-theme-card transition-all font-numbers"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: CONTACT & ADDRESS */}
            <div className="bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">
                  Contact & Address
                </h3>
                <p className="text-xs text-theme-muted font-medium mt-0.5">
                  Customer service phone, WhatsApp number and store address.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">
                    Phone Number
                  </label>
                  <p className="text-[11px] text-theme-muted mb-1.5">Official customer service phone number.</p>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 99035 91839"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent focus:bg-theme-card transition-all font-numbers"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">
                    WhatsApp Number
                  </label>
                  <p className="text-[11px] text-theme-muted mb-1.5">Direct number for bill sharing & reminders.</p>
                  <div className="relative">
                    <MessageCircle className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+91 99035 91839"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-theme-surface/60 border border-theme-border-soft rounded-xl text-xs font-semibold text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent focus:bg-theme-card transition-all font-numbers"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">
                    Business Email
                  </label>
                  <p className="text-[11px] text-theme-muted mb-1.5">Primary email address associated with workspace.</p>
                  <div className="relative">
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
                  <label className="block text-xs font-bold text-theme-primary mb-0.5">
                    Store / Office Address
                  </label>
                  <p className="text-[11px] text-theme-muted mb-1.5">Physical billing address printed on invoice footer.</p>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-3 pointer-events-none" />
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      placeholder="Street address, City, State, PIN"
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
            
            {/* Custom Columns & Labels */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
              <h3 className="text-lg font-bold text-theme-primary mb-4">Table Customization</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-theme-main mb-2">Item/Product Column Label</label>
                <input
                  type="text"
                  value={invoiceItemLabel}
                  onChange={(e) => setInvoiceItemLabel(e.target.value)}
                  className="w-full max-w-xs px-4 py-2 bg-theme-surface border border-theme-border rounded-xl focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent text-theme-main"
                  placeholder="e.g. Item, Product, Service"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-semibold text-theme-main">Custom Columns</label>
                    <p className="text-xs text-theme-muted mt-1">Add additional columns to your invoice table (e.g. Size, Color, Warranty)</p>
                  </div>
                  <button onClick={() => setInvoiceCustomColumns([...invoiceCustomColumns, { id: 'col_' + Date.now(), name: '', type: 'text', options: '' }])} className="px-3 py-1.5 text-xs font-bold bg-theme-accent text-white rounded-lg shadow-sm hover:brightness-110 transition-all">+ Add Column</button>
                </div>
                {invoiceCustomColumns.length === 0 ? (
                  <p className="text-sm text-theme-muted p-4 bg-gray-50 dark:bg-black/20 rounded-xl border border-dashed border-gray-300 dark:border-white/20 text-center">No custom columns added.</p>
                ) : (
                  <div className="space-y-3">
                    {invoiceCustomColumns.map((col, index) => (
                      <div key={col.id} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl">
                        <input
                          type="text"
                          value={col.name}
                          onChange={(e) => {
                            const newCols = [...invoiceCustomColumns];
                            newCols[index].name = e.target.value;
                            setInvoiceCustomColumns(newCols);
                          }}
                          className="flex-1 min-w-[120px] px-3 py-1.5 text-sm bg-theme-surface border border-theme-border rounded-lg text-theme-main focus:outline-none focus:border-theme-accent"
                          placeholder="Column Name"
                        />
                        <select
                          value={col.type}
                          onChange={(e) => {
                            const newCols = [...invoiceCustomColumns];
                            newCols[index].type = e.target.value;
                            setInvoiceCustomColumns(newCols);
                          }}
                          className="px-3 py-1.5 text-sm bg-theme-surface border border-theme-border rounded-lg text-theme-main focus:outline-none focus:border-theme-accent"
                        >
                          <option value="text">Text Input</option>
                          <option value="number">Number Input</option>
                          <option value="dropdown">Dropdown</option>
                        </select>
                        {col.type === 'dropdown' && (
                          <input
                            type="text"
                            value={col.options || ''}
                            onChange={(e) => {
                              const newCols = [...invoiceCustomColumns];
                              newCols[index].options = e.target.value;
                              setInvoiceCustomColumns(newCols);
                            }}
                            className="flex-1 min-w-[150px] px-3 py-1.5 text-sm bg-theme-surface border border-theme-border rounded-lg text-theme-main focus:outline-none focus:border-theme-accent"
                            placeholder="Options (comma separated)"
                          />
                        )}
                        <button
                          onClick={() => {
                            const newCols = invoiceCustomColumns.filter((_, i) => i !== index);
                            setInvoiceCustomColumns(newCols);
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                          title="Remove Column"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'inventory-settings':
        return (
          <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
            <div className="section-header border-b border-gray-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-sm shrink-0">
                  <PackageSearch className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="section-header-title">Inventory Configuration</h2>
                  <p className="section-header-subtitle">Enable advanced tracking features for products</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleSwitch
                enabled={enableBarcodeSku}
                onChange={setEnableBarcodeSku}
                label="SKU & Barcode Fields"
                description="Show SKU and Barcode inputs for products"
              />
              <ToggleSwitch
                enabled={enableVariantTracking}
                onChange={setEnableVariantTracking}
                label="Variant Tracking (Size/Color)"
                description="Manage product variants like size and color"
              />
              <ToggleSwitch
                enabled={enableWarehouseTracking}
                onChange={setEnableWarehouseTracking}
                label="Warehouse & Shelf Tracking"
                description="Track inventory across shelves and locations"
              />
              <ToggleSwitch
                enabled={enableBatchExpiry}
                onChange={setEnableBatchExpiry}
                label="Batch & Expiry Dates"
                description="Essential for Pharmacy or FMCG businesses"
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

      case 'whatsapp-template':
        return (
          <MessageTemplateStudio 
            settings={settings}
            whatsappMessageTemplate={whatsappMessageTemplate}
            setWhatsappMessageTemplate={setWhatsappMessageTemplate}
          />
        );

      case 'modules':
        return (
          <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
            <FeatureControlStudio workspaceId={settings?.activeWorkspaceId} />
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
                    Auto-Synced
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
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary">
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
          <span className="font-bold text-theme-primary">{settings?.businessName || 'KB.Embroidery Designer 1118'}</span>
          <span className="text-theme-border-strong">•</span>
          <span className="font-mono text-[11px] text-theme-muted">Workspace: {settings?.activeWorkspaceId || 'ws_primary'}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Synced
          </span>
          <span className="flex items-center gap-1 text-theme-muted font-bold">
            <span>▣</span> Isolated
          </span>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: CONTROL SIDEBAR + CONTENT PANE */}
      <div className="settings-content-shell flex w-full min-h-[calc(100vh-110px)]">
        {/* SETTINGS CONTROL SIDEBAR */}
        <aside className="settings-sidebar w-60 lg:w-64 border-r border-theme-border-soft bg-theme-surface/30 shrink-0 p-3 space-y-3 hidden md:flex md:flex-col">
          {/* Header */}
          <div className="settings-sidebar-header px-2 py-1">
            <h2 className="text-xs font-black text-theme-primary tracking-tight">Settings</h2>
            <p className="text-[10px] font-semibold text-theme-muted">Business preferences</p>
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
                <p className="settings-nav-group-title text-[10px] font-extrabold text-theme-muted uppercase tracking-wider px-2.5 py-1">
                  {group.group}
                </p>
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const isSelected = activeSection === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
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

          {/* Live Preview Panel on the right */}
          {showPreview && (
            <div className="settings-preview w-full lg:w-80 shrink-0">
              <LivePreviewPanel themeId={themeId} darkMode={darkMode} brandColor={brandColor} settings={settings} />
            </div>
          )}
        </div>
      </div>

      {/* Sticky Save Bar (Floating when dirty) */}
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
                  <p className="text-xs font-bold text-theme-primary">Unsaved changes</p>
                  <p className="text-[10px] text-theme-muted font-medium">You have pending modifications</p>
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

      {/* Mobile Bottom Nav */}
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
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
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
