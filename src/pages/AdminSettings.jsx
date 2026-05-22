import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  RotateCcw, 
  LogOut, 
  Building2, 
  User, 
  MapPin, 
  Coins, 
  ShieldAlert,
  Key,
  Database,
  Download,
  Upload,
  Wifi,
  WifiOff,
  ServerOff,
  HardDrive,
  BarChart3,
  Users,
  FileText,
  CircleDollarSign,
  Clock
} from 'lucide-react';
import { exportBackup } from '../utils/storage';
import { firebaseReady } from '../utils/firebase';

/**
 * Settings & Administrator Management Page
 * @param {Object} settings - active business configuration
 * @param {Function} onSaveSettings - saves modifications
 * @param {Function} onResetDemo - resets database back to seeded mock assets
 * @param {Function} onLogout - clears active user session
 */
const AdminSettings = ({ settings, invoices = [], customers = [], onSaveSettings, onResetDemo, onLogout, onImportBackup }) => {
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

  // --- FORM STATES ---
  const [businessName, setBusinessName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [defaultTax, setDefaultTax] = useState(18);
  const [adminPasscode, setAdminPasscode] = useState('1118');
  const [adminEmail, setAdminEmail] = useState('admin@billqyro.com');

  // Sync state with settings prop
  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || '');
      setLogoUrl(settings.logoUrl || '');
      setOwnerName(settings.ownerName || '');
      setPhone(settings.phone || '');
      setEmail(settings.email || '');
      setAddress(settings.address || '');
      setGstNumber(settings.gstNumber || '');
      setCurrency(settings.currency || '₹');
      setDefaultTax(settings.defaultTax !== undefined ? settings.defaultTax : 18);
      setAdminPasscode(settings.adminPasscode || '1118');
      setAdminEmail(settings.adminEmail || 'admin@billqyro.com');
    }
  }, [settings]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!businessName) {
      alert('Please specify a company name.');
      return;
    }

    const payload = {
      businessName,
      logoUrl,
      ownerName,
      phone,
      email,
      address,
      gstNumber,
      currency,
      defaultTax: parseFloat(defaultTax) || 0,
      adminPasscode,
      adminEmail,
    };

    onSaveSettings(payload);
    alert('Settings saved successfully!');
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

  return (
    <form onSubmit={handleSave} className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          ADMINISTRATION & SYSTEM STATUS PANEL (Real Data)
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 md:p-6 border border-indigo-800/40 shadow-xl">
        {/* Panel Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight">Administration Overview</h3>
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mt-0.5">REAL-TIME SYSTEM STATISTICS</p>
          </div>
          {/* Firebase Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-extrabold uppercase tracking-wider ${firebaseStatusColor}`}>
            <span className={`w-2 h-2 rounded-full ${firebaseStatusDot} ${firebaseStatus === 'connected' ? 'animate-pulse' : ''}`}></span>
            <FirebaseIcon className="w-3 h-3" />
            <span className="hidden sm:inline">{firebaseStatusLabel}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {/* Total Invoices */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-sm">
            <FileText className="w-5 h-5 text-indigo-300 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-white">{totalInvoices}</p>
            <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider mt-0.5">Total Invoices</p>
          </div>

          {/* Total Customers */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-sm">
            <Users className="w-5 h-5 text-cyan-300 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-white">{totalCustomers}</p>
            <p className="text-[9px] text-cyan-300 font-bold uppercase tracking-wider mt-0.5">Clients</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-sm">
            <CircleDollarSign className="w-5 h-5 text-emerald-300 mx-auto mb-1.5" />
            <p className="text-lg font-black text-white truncate">{settings?.currency || '₹'}{totalRevenue.toLocaleString('en-IN')}</p>
            <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider mt-0.5">Total Revenue</p>
          </div>

          {/* Pending Payments */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-sm">
            <Clock className="w-5 h-5 text-amber-300 mx-auto mb-1.5" />
            <p className="text-lg font-black text-white truncate">{settings?.currency || '₹'}{pendingPayments.toLocaleString('en-IN')}</p>
            <p className="text-[9px] text-amber-300 font-bold uppercase tracking-wider mt-0.5">Pending Due</p>
          </div>
        </div>

        {/* Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Firebase Connection */}
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

          {/* Local Backup Status */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border bg-indigo-50 text-indigo-700 border-indigo-200">
            <HardDrive className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-extrabold">Local Backup Active</p>
              <p className="text-[9px] opacity-70 font-medium">{totalInvoices} invoices stored</p>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">
            <BarChart3 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-extrabold">{paidCount} Paid · {pendingCount} Pending</p>
              <p className="text-[9px] opacity-70 font-medium">{settings?.currency || '₹'}{paidRevenue.toLocaleString('en-IN')} collected</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {totalInvoices === 0 && (
          <div className="mt-4 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <BarChart3 className="w-4 h-4 text-indigo-300 flex-shrink-0" />
            <p className="text-[10px] text-indigo-200 font-medium">Revenue &amp; invoice statistics will appear here after you create your first bill.</p>
          </div>
        )}
      </div>
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight">System Settings</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">MANAGE COMPANY IDENTITIES</p>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: COMPANY & LOGO IDENTITY */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Firm profile */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
              <Building2 className="w-4.5 h-4.5 text-indigo-500" />
              <span>Business Profile</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
              <div className="sm:col-span-2">
                <label className="block mb-1 text-slate-400">Registered Business Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. BillQyro Technologies"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1 text-slate-400">Business Logo URL</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-indigo-600 font-medium"
                />
                {logoUrl && (
                  <div className="mt-3 flex items-center gap-3 p-2 bg-slate-50 rounded-xl w-fit">
                    <img 
                      src={logoUrl} 
                      onError={(e) => e.target.style.display = 'none'}
                      alt="Logo Preview" 
                      className="w-12 h-12 rounded-lg object-cover bg-white shadow-sm border border-slate-100" 
                    />
                    <span className="text-[10px] text-slate-400 font-bold">Image previsualized</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1 text-slate-400">Owner Full Name</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>
              
              <div>
                <label className="block mb-1 text-slate-400">Tax ID / GSTIN / VAT (Optional)</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold uppercase"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-400">Contact Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="billing@firm.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-400">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1 text-slate-400">Corporate Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full office address details..."
                  rows="3"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 leading-relaxed font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section: Security Vault */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
              <Key className="w-4.5 h-4.5 text-indigo-500" />
              <span>Security Vault & Passcode</span>
            </h3>

            <div className="space-y-4 text-xs font-semibold text-slate-500">
              <div>
                <label className="block mb-1 text-slate-400">Admin Passcode</label>
                <input
                  type="password"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  placeholder="e.g. 1118"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Used to access this administrative console and secure areas of the app.</p>
              </div>
              
              <div>
                <label className="block mb-1 text-slate-400">Admin Email Address</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="e.g. admin@billqyro.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Logging in with this email automatically grants admin privileges without needing the passcode.</p>
              </div>
            </div>
          </div>

          {/* Section: Data Backup & Restore */}
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
                {/* Export Button */}
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 py-3 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 font-bold text-xs rounded-2xl transition-all"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Export Backup (JSON)</span>
                </button>

                {/* Import Button / Trigger */}
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

        {/* RIGHT COLUMN: TAX PARAMS & DANGER ZONE ACTIONS */}
        <div className="space-y-6">
          
          {/* Section 2: Taxation and Currency presets */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
              <Coins className="w-4.5 h-4.5 text-indigo-500" />
              <span>Presets & Currency</span>
            </h3>

            <div className="space-y-4 text-xs font-semibold text-slate-500">
              
              {/* Currency Selector */}
              <div>
                <label className="block mb-1 text-slate-400">Active Currency Standard</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-extrabold"
                >
                  <option value="₹">INR ₹ (Indian Rupee)</option>
                  <option value="$">USD $ (US Dollar)</option>
                  <option value="€">EUR € (Euro)</option>
                  <option value="£">GBP £ (British Pound)</option>
                  <option value="¥">JPY ¥ (Japanese Yen)</option>
                </select>
              </div>

              {/* Default Tax Rate */}
              <div>
                <label className="block mb-1 text-slate-400">Default Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={defaultTax}
                  onChange={(e) => setDefaultTax(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Dangerous admin actions (Reset, Logout) */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-premium space-y-4">
            <h3 className="text-sm font-extrabold text-rose-600 border-b border-slate-50 pb-3 flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
              <span>Administrative Console</span>
            </h3>

            <div className="space-y-2">
              {/* Reset Demo Data Button */}
              <button
                type="button"
                onClick={handleResetData}
                className="w-full flex items-center justify-center gap-2 py-3.5 border border-amber-200 bg-amber-50 hover:bg-amber-100/80 text-amber-800 font-bold text-xs rounded-2xl transition-all"
              >
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Reset System Database</span>
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-50 border border-rose-100 hover:bg-rose-100/80 text-rose-700 font-bold text-xs rounded-2xl transition-all"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Exit Secure Workspace</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </form>
  );
};

export default AdminSettings;
