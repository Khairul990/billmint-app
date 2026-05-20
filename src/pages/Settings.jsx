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
  ShieldAlert 
} from 'lucide-react';

/**
 * Settings & Administrator Management Page
 * @param {Object} settings - active business configuration
 * @param {Function} onSaveSettings - saves modifications
 * @param {Function} onResetDemo - resets database back to seeded mock assets
 * @param {Function} onLogout - clears active user session
 */
const Settings = ({ settings, onSaveSettings, onResetDemo, onLogout }) => {
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
    };

    onSaveSettings(payload);
    alert('Settings saved successfully!');
  };

  const handleResetData = () => {
    if (confirm('CAUTION: This will wipe out all invoices, customers, and catalog items, replacing them with default demo assets. Proceed?')) {
      onResetDemo();
      alert('Database successfully reset to demo data!');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      
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
                  placeholder="e.g. BillMint Technologies"
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

export default Settings;
