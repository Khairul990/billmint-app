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
  BarChart3,
  Users,
  CircleDollarSign,
  Clock,
  HardDrive
} from 'lucide-react';

import { exportBackup, getAuthSession } from '../utils/storage';
import { getAdminEmail } from '../utils/adminAccess';
import { firebaseReady } from '../utils/firebase';

/**
 * Normal User Business Settings Page
 * Allows standard users to configure their own firm's profile.
 * If isAdmin is true, it also renders the Admin console section.
 */
const Settings = ({ 
  settings, 
  onSaveSettings, 
  isAdmin, 
  onResetDemo, 
  onImportBackup, 
  invoices = [], 
  customers = [] 
}) => {
  const [businessName, setBusinessName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [defaultTax, setDefaultTax] = useState(18);
  const [defaultNotes, setDefaultNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [pdfFooter, setPdfFooter] = useState('');
  const [upiId, setUpiId] = useState('');
  const [brandColor, setBrandColor] = useState('#14b8a6'); // default teal
  const [invoiceTemplate, setInvoiceTemplate] = useState('modern');
  const [defaultBillingTemplate, setDefaultBillingTemplate] = useState('custom');
  const [pdfVisibleFields, setPdfVisibleFields] = useState({
    embroidery: ['designNo', 'workType', 'description', 'size', 'quantity', 'rate', 'amount'],
    grocery: ['productName', 'unit', 'quantity', 'unitPrice', 'amount'],
    repair: ['serviceName', 'problemDetails', 'partsCost', 'labourCharge', 'quantity', 'amount'],
    retail: ['productName', 'category', 'sizeVariant', 'quantity', 'price', 'discount', 'amount'],
    custom: ['itemService', 'description', 'quantity', 'rate', 'amount']
  });
  
  const [showToast, setShowToast] = useState(false);

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
      setCurrency(settings.currency || '₹');
      setInvoicePrefix(settings.invoicePrefix || 'INV-');
      setDefaultTax(settings.defaultTax !== undefined ? settings.defaultTax : 18);
      setDefaultNotes(settings.defaultNotes || '');
      setTerms(settings.terms || '');
      setPdfFooter(settings.pdfFooter || '');
      setUpiId(settings.upiId || '');
      setBrandColor(settings.brandColor || '#14b8a6');
      setInvoiceTemplate(settings.invoiceTemplate || 'modern');
      setDefaultBillingTemplate(settings.defaultBillingTemplate || 'custom');
      if (settings.pdfVisibleFields) {
        setPdfVisibleFields(settings.pdfVisibleFields);
      }
    }
  }, [settings]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!businessName) {
      alert('Please specify a Business Name.');
      return;
    }

    const payload = {
      ...settings, // Preserves admin fields like adminPasscode
      businessName,
      logoUrl,
      ownerName,
      phone,
      whatsapp,
      email,
      address,
      gstNumber,
      currency,
      invoicePrefix,
      defaultTax: parseFloat(defaultTax) || 0,
      defaultNotes,
      terms,
      pdfFooter,
      upiId,
      brandColor,
      invoiceTemplate,
      defaultBillingTemplate,
      pdfVisibleFields
    };

    onSaveSettings(payload);
    
    onSaveSettings(payload);
    
    // Show Toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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

  // --- REAL-TIME ADMIN STATS (calculated from live data) ---
  const totalInvoices   = invoices.length;
  const totalCustomers  = customers.length;
  const totalRevenue    = invoices.reduce((sum, inv) => sum + (parseFloat(inv.grandTotal) || 0), 0);
  const paidRevenue     = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amountPaid) || 0), 0);
  const pendingPayments = invoices.reduce((sum, inv) => sum + (parseFloat(inv.balanceDue) || 0), 0);
  const paidCount       = invoices.filter(inv => inv.paymentStatus === 'Paid').length;
  const pendingCount    = invoices.filter(inv => inv.paymentStatus !== 'Paid').length;

  // Firebase status detection
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
    connected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    offline: 'bg-amber-50 text-amber-700 border-amber-200',
    'not-configured': 'bg-slate-50 text-slate-500 border-slate-200',
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

  const session = getAuthSession();
  const loggedInEmail = session?.userEmail || 'unknown';

  return (
    <div className="max-w-4xl mx-auto pb-12 relative">
      
      {/* DEVELOPMENT DEBUG BLOCK (Temporarily added as requested) */}
      <div className="bg-slate-800 text-[10px] text-green-400 p-2 mb-4 rounded font-mono break-all">
        Logged in as: {loggedInEmail}
        <br />
        Target Admin: {getAdminEmail()}
        <br />
        Admin access: {isAdmin ? 'true' : 'false'}
      </div>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">Settings saved successfully</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Business Settings</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Configure your company profile and invoice preferences.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>

      <div className="space-y-6">
        
        {/* Section 1: Business Profile & Logo */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-premium">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Business Profile</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Public Company Details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Registered Business Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. BillQyro Technologies"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Owner Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><User className="w-4 h-4"/></span>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Business Logo URL</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><ImageIcon className="w-4 h-4"/></span>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-indigo-600 font-medium"
                />
              </div>
              {logoUrl && (
                <div className="mt-3">
                  <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain rounded-lg border border-slate-200 p-1 bg-white" onError={(e) => e.target.style.display = 'none'} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Contact Details */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-premium">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Contact Details</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">How Customers Reach You</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-medium"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">WhatsApp Number</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Contact Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Mail className="w-4 h-4"/></span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="billing@firm.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Corporate Address</label>
              <div className="relative">
                <span className="absolute top-3.5 left-3.5 text-slate-400"><MapPin className="w-4 h-4"/></span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full office address details..."
                  rows="3"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-medium resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Invoice Preferences */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-premium">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Invoice Preferences</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Defaults & Taxation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-extrabold"
              >
                <option value="₹">INR ₹ (Indian Rupee)</option>
                <option value="$">USD $ (US Dollar)</option>
                <option value="€">EUR € (Euro)</option>
                <option value="£">GBP £ (British Pound)</option>
                <option value="¥">JPY ¥ (Japanese Yen)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Default Tax Rate (%)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Percent className="w-4 h-4"/></span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={defaultTax}
                  onChange={(e) => setDefaultTax(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Invoice Prefix</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                placeholder="e.g. INV-"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-bold uppercase tracking-wider"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Tax ID / GSTIN (Optional)</label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="e.g. 29AAAAA0000A1Z5"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-bold uppercase"
              />
            </div>
          </div>
        </div>

        {/* Section 4: PDF Branding / Extras */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-premium">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">PDF Branding</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Default Notes & Terms</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Default Invoice Notes</label>
              <textarea
                value={defaultNotes}
                onChange={(e) => setDefaultNotes(e.target.value)}
                placeholder="Thank you for your business!"
                rows="2"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-medium resize-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Terms & Conditions</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="1. Payment is due within 30 days.&#10;2. Goods once sold are not returnable."
                rows="3"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-medium resize-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">PDF Invoice Footer</label>
              <input
                type="text"
                value={pdfFooter}
                onChange={(e) => setPdfFooter(e.target.value)}
                placeholder="e.g. This is a computer generated invoice and requires no signature."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Payment & Advanced Branding */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-premium">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Payment & Aesthetics</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">UPI QR & Templates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Scan-to-Pay UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. name@okhdfcbank"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">Adding this will print a Scan-to-Pay QR code on your PDF invoices.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Invoice Template Style</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><LayoutTemplate className="w-4 h-4"/></span>
                <select
                  value={invoiceTemplate}
                  onChange={(e) => setInvoiceTemplate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-extrabold"
                >
                  <option value="modern">Modern SaaS Style</option>
                  <option value="classic">Classic Minimalist</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide flex items-center gap-2">
                <Palette className="w-3.5 h-3.5" /> Brand Accent Color
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${brandColor === color.hex ? 'ring-4 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color.hex, ringColor: color.hex }}
                    title={color.name}
                  >
                    {brandColor === color.hex && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* --- ADMIN ONLY SECTION --- */}
      {isAdmin && (
        <div className="mt-12 space-y-6 pt-12 border-t-2 border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Administrative Console</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Superuser controls and real-time statistics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* REAL-TIME ADMIN STATS */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 md:p-6 border border-indigo-800/40 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-tight">Administration Overview</h3>
                    <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mt-0.5">REAL-TIME SYSTEM STATISTICS</p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-extrabold uppercase tracking-wider ${firebaseStatusColor}`}>
                    <span className={`w-2 h-2 rounded-full ${firebaseStatusDot} ${firebaseStatus === 'connected' ? 'animate-pulse' : ''}`}></span>
                    <FirebaseIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">{firebaseStatusLabel}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-sm">
                    <FileText className="w-5 h-5 text-indigo-300 mx-auto mb-1.5" />
                    <p className="text-2xl font-black text-white">{totalInvoices}</p>
                    <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider mt-0.5">Total Invoices</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-sm">
                    <Users className="w-5 h-5 text-cyan-300 mx-auto mb-1.5" />
                    <p className="text-2xl font-black text-white">{totalCustomers}</p>
                    <p className="text-[9px] text-cyan-300 font-bold uppercase tracking-wider mt-0.5">Clients</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-sm">
                    <CircleDollarSign className="w-5 h-5 text-emerald-300 mx-auto mb-1.5" />
                    <p className="text-lg font-black text-white truncate">{currency}{totalRevenue.toLocaleString('en-IN')}</p>
                    <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider mt-0.5">Total Revenue</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-sm">
                    <Clock className="w-5 h-5 text-amber-300 mx-auto mb-1.5" />
                    <p className="text-lg font-black text-white truncate">{currency}{pendingPayments.toLocaleString('en-IN')}</p>
                    <p className="text-[9px] text-amber-300 font-bold uppercase tracking-wider mt-0.5">Pending Due</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${firebaseStatusColor}`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${firebaseStatusDot}`}></span>
                    <div>
                      <p className="text-[10px] font-extrabold">{firebaseStatusLabel}</p>
                      <p className="text-[9px] opacity-70 font-medium">
                        {firebaseStatus === 'connected' ? 'Syncing data to cloud' :
                         firebaseStatus === 'offline' ? 'Using local backup' :
                         'Add .env Firebase keys'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border bg-indigo-50 text-indigo-700 border-indigo-200">
                    <HardDrive className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-extrabold">Local Backup Active</p>
                      <p className="text-[9px] opacity-70 font-medium">{totalInvoices} invoices stored</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">
                    <BarChart3 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-extrabold">{paidCount} Paid · {pendingCount} Pending</p>
                      <p className="text-[9px] opacity-70 font-medium">{currency}{paidRevenue.toLocaleString('en-IN')} collected</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Backup & Restore */}
              <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
                  <Database className="w-4.5 h-4.5 text-indigo-500" />
                  <span>Data Backup & Restore</span>
                </h3>
                <div className="space-y-4 text-xs font-semibold text-slate-500">
                  <p className="text-slate-400 font-medium leading-relaxed">
                    Export your entire workspace (invoices, customers, settings, and expenses) to a local JSON file, or restore a previous backup.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleExport}
                      className="flex items-center justify-center gap-2 py-3 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 font-bold text-xs rounded-2xl transition-all"
                    >
                      <Download className="w-4 h-4 text-indigo-600" />
                      <span>Export Backup (JSON)</span>
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
                        className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl cursor-pointer transition-all text-center"
                      >
                        <Upload className="w-4 h-4 text-white" />
                        <span>Import Backup (JSON)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
                <h3 className="text-sm font-extrabold text-rose-600 border-b border-slate-50 pb-3 flex items-center gap-2">
                  <RotateCcw className="w-4.5 h-4.5 text-rose-500" />
                  <span>Danger Zone</span>
                </h3>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="w-full flex items-center justify-center gap-2 py-3.5 border border-amber-200 bg-amber-50 hover:bg-amber-100/80 text-amber-800 font-bold text-xs rounded-2xl transition-all"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>Reset System Database</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
