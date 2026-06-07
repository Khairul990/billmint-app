import React from 'react';
import { Building2, Globe, CreditCard, FileText, Link, Upload, Trash2, ShieldAlert } from 'lucide-react';

const BusinessProfileTab = (props) => {
  const { businessName, setBusinessName, logoUrl, handleLogoChange, handleRemoveLogo, ownerName, setOwnerName, phone, setPhone, whatsapp, setWhatsapp, email, setEmail, address, setAddress, gstNumber, setGstNumber, country, setCountry, language, setLanguage, currency, setCurrency, currencyCode, setCurrencyCode, taxLabel, setTaxLabel, vatTax, setVatTax, dateFormat, setDateFormat, numberFormat, setNumberFormat, upiId, setUpiId, bkashNumber, setBkashNumber, nagadNumber, setNagadNumber, rocketNumber, setRocketNumber, payeeName, setPayeeName, paymentNote, setPaymentNote, paymentQrEnabled, setPaymentQrEnabled, paymentMethod, setPaymentMethod, customPaymentLink, setCustomPaymentLink, invoicePrefix, setInvoicePrefix, defaultTax, setDefaultTax, defaultNotes, setDefaultNotes, terms, setTerms, pdfFooter, setPdfFooter, defaultBillingTemplate, setDefaultBillingTemplate, enableLiveLink, setEnableLiveLink, showPaymentQrOnLink, setShowPaymentQrOnLink, allowPdfDownload, setAllowPdfDownload, allowPaymentProofSubmit, setAllowPaymentProofSubmit, showPaidDueAmount, setShowPaidDueAmount, showContactButton, setShowContactButton, requireTransactionId, setRequireTransactionId, requirePaymentScreenshot, setRequirePaymentScreenshot, isDragging, setIsDragging } = props;

  return (
    <>
          <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-theme-accent-light dark:bg-theme-accent-light/40 text-theme-accent dark:text-theme-accent flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-theme-primary dark:text-theme-primary dark:text-theme-secondary">Business Profile</h2>
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Public Company Details</p>
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
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-slate-805 dark:text-theme-primary font-bold"
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
                    className="w-full pl-10 pr-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Business Logo URL</label>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${isDragging ? 'border-theme-accent bg-theme-accent-light dark:bg-teal-950/20' : 'border-theme-border-soft bg-theme-app dark:bg-theme-surface hover:bg-theme-surface dark:bg-theme-card dark:border-theme-border-soft dark:bg-theme-surface/40 dark:hover:bg-slate-850'
                    }`}
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
                    className="w-full pl-9 pr-4 py-2 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-accent dark:text-theme-accent font-medium text-xs"
                  />
                </div>

                {logoUrl && (
                  <div className="mt-3 relative inline-block group">
                    <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain rounded-lg border border-theme-border-soft dark:border-slate-750 p-1 bg-theme-card dark:bg-theme-card" onError={(e) => e.target.style.display = 'none'} />
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

              <div>
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">WhatsApp Link Number</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-medium"
                />
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
                    className="w-full pl-10 pr-20 py-3 bg-slate-100 dark:bg-theme-card/40 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:outline-none text-theme-muted dark:text-theme-muted font-medium cursor-not-allowed opacity-90 shadow-inner"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="bg-emerald-100 dark:bg-emerald-900/40 text-theme-success dark:text-emerald-400 border border-theme-success/30 dark:border-emerald-800 text-[9px] font-extrabold uppercase px-2 py-1 rounded-lg tracking-wider flex items-center gap-1 shadow-sm">
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
                    className="w-full pl-10 pr-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-medium resize-none text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1.5 BRAND THEME STUDIO TAB */}
        {activeTab === 'theme_studio' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Studio Header */}
            <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-theme-accent-light dark:bg-theme-accent-light/40 text-theme-accent dark:text-theme-accent flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-theme-primary dark:text-theme-primary">Brand Theme Studio</h2>
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Customize the look of your BillQyro workspace and invoice PDF</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Preset Selectors & Controls */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* Light/Dark Mode Toggle */}
                <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase text-theme-primary dark:text-theme-primary tracking-wider">Dark Mode</h3>
                    <p className="text-[10px] text-theme-muted font-medium">Use a dark aesthetic across your dashboard.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDarkMode(!darkMode);
                      // Instantly toggle the class so the preview is accurate
                      if (!darkMode) {
                        document.documentElement.classList.add('dark');
                      } else {
                        document.documentElement.classList.remove('dark');
                      }
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${darkMode ? 'bg-theme-accent' : 'bg-theme-border-strong dark:bg-theme-surface'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-theme-card w-4 h-4 rounded-full transition-transform duration-300 ${darkMode ? 'translate-x-6' : ''}`} />
                  </button>
                </div>

                <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-5">
                  <h3 className="text-xs font-black uppercase text-theme-muted tracking-wider">Select Brand Color</h3>
                  
                  {/* Theme Presets List */}
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
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setThemeColor(preset.id);
                              document.documentElement.setAttribute('data-theme', preset.id);
                              import('../utils/themeIcon').then(m => m.updateFaviconForTheme(preset.id));
                            }}
                            className={`w-full text-left rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer flex flex-col ${
                              isSelected 
                                ? 'border-theme-accent bg-theme-accent/[0.03] shadow-premium ring-1 ring-theme-accent' 
                                : 'border-theme-border-soft/60 dark:border-theme-border-soft hover:border-theme-border-strong bg-theme-app/50 dark:bg-theme-surface hover:shadow-md'
                            }`}
                          >
                            <div className="flex w-full h-1.5 opacity-90">
                              {preset.colors.map((c, i) => (
                                <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }}></div>
                              ))}
                            </div>
                            
                            <div className="p-4 w-full space-y-3">
                              <div className="flex justify-between items-center w-full">
                                <span className="text-xs font-extrabold text-theme-primary dark:text-theme-primary">{preset.name}</span>
                                {isSelected && (
                                  <span className="w-4 h-4 rounded-full bg-theme-accent text-white flex items-center justify-center text-[8px] font-bold shadow-sm shadow-theme-accent/30">✓</span>
                                )}
                              </div>
                              <p className="text-[10px] text-theme-muted dark:text-theme-muted font-semibold leading-relaxed">{preset.desc}</p>
                              
                              <div className="mt-3 flex rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-inner">
                                
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
                                    <div className="w-full h-2 rounded shadow-sm" style={{ background: `linear-gradient(90deg, ${lightColors.btnFrom}, ${lightColors.btnTo})` }}></div>
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
                                    <div className="w-full h-2 rounded shadow-sm" style={{ background: `linear-gradient(90deg, ${darkColors.btnFrom}, ${darkColors.btnTo})` }}></div>
                                  </div>
                                </div>

                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  {/* Actions buttons */}
                  <div className="space-y-2 pt-2 border-t border-theme-border-soft dark:border-theme-border-soft/80">
                    <button
                      type="button"
                      onClick={() => {
                        document.documentElement.setAttribute('data-theme', themeColor);
                        import('../utils/themeIcon').then(m => m.updateFaviconForTheme(themeColor));
                        toast.success(`Previewing ${themeColor} theme!`);
                      }}
                      className="w-full py-3 bg-theme-surface hover:bg-theme-border-soft/75 dark:bg-theme-card dark:hover:bg-slate-750 text-theme-primary dark:text-theme-secondary font-black text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer uppercase tracking-wider"
                    >
                      Test UI Live Now
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(null)}
                      className="w-full py-3 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 font-black text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer uppercase tracking-wider"
                    >
                      Save Theme
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setThemeColor('blue');
                        setDarkMode(false);
                        const payload = {
                          ...settings,
                          themeColor: 'blue',
                          darkMode: false,
                          themePreset: 'blue', // Legacy support
                          themeUpdatedAt: new Date().toISOString()
                        };
                        onSaveSettings(payload);
                        document.documentElement.setAttribute('data-theme', 'light');
                        import('../utils/themeIcon').then(m => m.updateFaviconForTheme('light'));
                        document.documentElement.classList.remove('dark');
                        toast.success('Reset to BillQyro Classic default theme!');
                      }}
                      className="w-full py-2 bg-transparent text-theme-muted hover:text-theme-danger text-[10px] font-bold text-center transition-all cursor-pointer block uppercase tracking-wider"
                    >
                      Reset to BillQyro Classic
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Interactive Mocks Previews */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase text-theme-muted tracking-wider">Theme Studio Live Mocks</h3>
                    <p className="text-[9px] text-theme-muted dark:text-theme-muted font-semibold leading-relaxed mt-0.5">Real-time dynamic visualization of presets applied to core panels</p>
                  </div>

                  {/* Previews Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 1. Dashboard Mock */}
                    {(() => {
                      const colors = getThemePreviewColors(themeColor);
                      return (
                        <div className="border border-theme-border-soft/60 dark:border-theme-border-soft rounded-2xl p-4 space-y-3 relative overflow-hidden flex flex-col justify-between" style={{ backgroundColor: colors.background }}>
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-theme-muted bg-theme-card/40 dark:bg-black/30 px-1.5 py-0.5 rounded border border-theme-border-soft/10">PC Workspace</span>
                          <div className="space-y-2">
                            <span className="text-[8px] font-black uppercase text-theme-muted tracking-wider block">Desktop Dashboard</span>
                            <div className="flex gap-2">
                              {/* Sidebar miniature */}
                              <div className="w-14 rounded p-1.5 space-y-1" style={{ backgroundColor: colors.sidebar }}>
                                <div className="w-8 h-1 rounded-sm bg-theme-card/40"></div>
                                <div className="w-10 h-0.5 rounded-sm bg-theme-card/20"></div>
                                <div className="w-10 h-0.5 rounded-sm bg-theme-card/20"></div>
                                <div className="w-10 h-0.5 rounded-sm bg-theme-card/20"></div>
                              </div>
                              {/* Main panel miniature */}
                              <div className="flex-1 space-y-2">
                                {/* Hero Mock */}
                                <div className="rounded p-2 text-white text-[6px] space-y-1 relative" style={{ background: `linear-gradient(135deg, ${colors.btnFrom}, ${colors.btnTo})` }}>
                                  <span className="font-extrabold block">Welcome to BillQyro</span>
                                  <div className="w-12 h-1 bg-theme-card/30 rounded-sm"></div>
                                </div>
                                {/* Stats Box mock */}
                                <div className="grid grid-cols-2 gap-1">
                                  <div className="rounded p-1 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                                    <span className="text-[5px] text-theme-muted block leading-none">Collection</span>
                                    <span className="text-[6px] font-extrabold" style={{ color: colors.text }}>$1,200</span>
                                  </div>
                                  <div className="rounded p-1 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                                    <span className="text-[5px] text-theme-muted block leading-none">Dues</span>
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
                      const colors = getThemePreviewColors(themeColor);
                      return (
                        <div className="border border-theme-border-soft/60 dark:border-theme-border-soft rounded-2xl p-4 flex flex-col justify-between items-center relative overflow-hidden bg-theme-app min-h-[145px]">
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-theme-muted bg-theme-card/10 px-1.5 py-0.5 rounded border border-white/5">Smartphone UI</span>
                          {/* Mobile Screen Shell */}
                          <div className="w-3/4 flex-1 border border-white/10 bg-theme-card rounded-t-xl overflow-hidden flex flex-col justify-between" style={{ backgroundColor: colors.background }}>
                            {/* Mobile header */}
                            <div className="p-1 flex justify-between items-center border-b" style={{ borderColor: colors.border }}>
                              <span className="text-[5px] font-bold" style={{ color: colors.text }}>BillQyro</span>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }}></span>
                            </div>
                            {/* Mobile card info */}
                            <div className="p-2 space-y-1.5">
                              <div className="rounded p-1.5 border space-y-1" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                                <div className="w-10 h-0.5 bg-theme-border-strong rounded-sm"></div>
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
                      const colors = getThemePreviewColors(themeColor);
                      return (
                        <div className="border border-theme-border-soft/60 dark:border-theme-border-soft rounded-2xl p-4 bg-theme-surface dark:bg-theme-card flex flex-col justify-between items-center relative overflow-hidden min-h-[145px]">
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-theme-muted bg-theme-card/40 dark:bg-black/30 px-1.5 py-0.5 rounded border border-theme-border-soft/10">Printable PDF</span>
                          {/* Mini paper sheet */}
                          <div className="w-[85%] flex-1 bg-theme-card border border-theme-border-soft shadow-sm p-2 flex flex-col justify-between">
                            {/* Header accent */}
                            <div className="flex justify-between items-start pb-1.5 border-b border-theme-border-soft">
                              <div className="space-y-0.5">
                                <span className="text-[6px] font-extrabold block" style={{ color: colors.headerColor }}>BillQyro Store</span>
                                <div className="w-10 h-0.5 bg-theme-border-strong rounded-sm"></div>
                              </div>
                              <span className="text-[6px] font-black tracking-wide" style={{ color: colors.headerColor }}>INVOICE</span>
                            </div>
                            {/* Table Mockup */}
                            <div className="my-1.5 space-y-0.5">
                              {/* Header Accent Line */}
                              <div className="h-1 rounded-sm w-full" style={{ backgroundColor: colors.tableHeaderBg }}></div>
                              <div className="h-0.5 bg-theme-surface w-full"></div>
                              <div className="h-0.5 bg-theme-surface w-full"></div>
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
                      const colors = getThemePreviewColors(themeColor);
                      return (
                        <div className="border border-theme-border-soft/60 dark:border-theme-border-soft rounded-2xl p-4 bg-theme-card dark:bg-theme-card flex flex-col justify-between items-center relative overflow-hidden min-h-[145px]">
                          <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider text-theme-muted bg-theme-surface dark:bg-theme-card/80 px-1.5 py-0.5 rounded border border-theme-border-soft/10">QR Pay Card</span>
                          {/* Miniature Scan Card frame */}
                          <div className="w-[85%] border border-theme-border-soft dark:border-theme-border-soft rounded-xl p-2.5 flex flex-col items-center justify-between text-center gap-1.5 shadow-sm bg-theme-app dark:bg-theme-app/20">
                            <span className="text-[6px] font-bold text-theme-muted dark:text-theme-muted uppercase tracking-widest block leading-none">Scan to Pay</span>
                            
                            {/* Mini QR border styled in theme accent */}
                            <div className="p-1 rounded border-2 border-dashed flex items-center justify-center" style={{ borderColor: colors.accent }}>
                              <div className="w-10 h-10 bg-theme-border-soft dark:bg-theme-card flex items-center justify-center text-[5px] text-theme-muted">QR Code</div>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[5.5px] text-theme-muted dark:text-theme-muted block font-semibold leading-none">BillQyro Payment</span>
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
          <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-theme-accent-light dark:bg-theme-accent-light/40 text-theme-accent dark:text-theme-accent flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-theme-primary dark:text-theme-primary dark:text-theme-secondary">Regional Settings</h2>
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Localization, currency, and language</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Workspace Country</label>
                <select
                  value={country}
                  onChange={(e) => handleCountryAutoConfigure(e.target.value)}
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
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
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
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
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Currency Code</label>
                <input
                  type="text"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  placeholder="e.g. INR, BDT, USD"
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Tax Label text</label>
                <select
                  value={['GST', 'VAT', 'Tax', 'None'].includes(taxLabel) ? taxLabel : 'Custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'Custom') {
                      setTaxLabel(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold mb-2"
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
                    className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Date Format</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 24/05/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 05/24/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-05-24)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Number Format</label>
                <select
                  value={numberFormat}
                  onChange={(e) => setNumberFormat(e.target.value)}
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
                >
                  <option value="Indian">12,34,567.89 (Indian lakh/crore)</option>
                  <option value="Standard">1,234,567.89 (Standard international)</option>
                  <option value="European">1.234.567,89 (European standard)</option>
                </select>
              </div>

              {country === 'Bangladesh' && (
                <div>
                  <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Default VAT / Tax Rate (%)</label>
                  <input
                    type="number"
                    value={vatTax}
                    onChange={(e) => setVatTax(e.target.value)}
                    placeholder="e.g. 7.5"
                    className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
                  />
                </div>
              )}
            </div>
          </div>
        )}
          <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-theme-accent-light dark:bg-theme-accent-light/40 text-theme-accent dark:text-theme-accent flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-theme-primary dark:text-theme-primary dark:text-theme-secondary">Payment Settings</h2>
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Automated billing QR configuration</p>
              </div>
            </div>

            {/* Enable switch */}
            <div className="flex items-center justify-between p-4 bg-theme-app dark:bg-theme-surface dark:bg-theme-surface border border-theme-border-soft dark:border-slate-750 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-theme-primary dark:text-theme-muted dark:text-theme-secondary block">Enable Automated Scan-to-Pay QR Code</span>
                <span className="text-[10px] text-theme-muted font-medium">Embed automated scanning codes on bills and invoice pages</span>
              </div>
              <button
                type="button"
                onClick={() => setPaymentQrEnabled(!paymentQrEnabled)}
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${paymentQrEnabled ? 'bg-theme-accent' : 'bg-theme-border-strong dark:bg-theme-surface'}`}
              >
                <div className={`w-4 h-4 bg-theme-card dark:bg-theme-card rounded-full absolute top-1 transition-all duration-300 ${paymentQrEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            {paymentQrEnabled && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Primary Payment Gateway Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
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
                      <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. business@okaxis"
                        className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
                      />
                    </div>
                  )}

                  {country === 'Bangladesh' && paymentMethod === 'bKash' && (
                    <div>
                      <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">bKash Wallet Number</label>
                      <input
                        type="text"
                        value={bkashNumber}
                        onChange={(e) => setBkashNumber(e.target.value)}
                        placeholder="e.g. 017XXXXXXXX"
                        className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
                      />
                    </div>
                  )}

                  {country === 'Bangladesh' && paymentMethod === 'Nagad' && (
                    <div>
                      <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Nagad Account Number</label>
                      <input
                        type="text"
                        value={nagadNumber}
                        onChange={(e) => setNagadNumber(e.target.value)}
                        placeholder="e.g. 019XXXXXXXX"
                        className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
                      />
                    </div>
                  )}

                  {country === 'Bangladesh' && paymentMethod === 'Rocket' && (
                    <div>
                      <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Rocket Account Number (Optional)</label>
                      <input
                        type="text"
                        value={rocketNumber}
                        onChange={(e) => setRocketNumber(e.target.value)}
                        placeholder="e.g. 018XXXXXXXX"
                        className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
                      />
                    </div>
                  )}

                  {country === 'Other' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Manual / Bank Instructions / Custom QR link</label>
                      <input
                        type="text"
                        value={customPaymentLink}
                        onChange={(e) => setCustomPaymentLink(e.target.value)}
                        placeholder="e.g. Bank name: X, A/C: Y, IFSC: Z or PayPal link..."
                        className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-medium"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Payee / Account Name</label>
                    <input
                      type="text"
                      value={payeeName}
                      onChange={(e) => setPayeeName(e.target.value)}
                      placeholder="e.g. BillQyro store"
                      className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">QR payment footnote note</label>
                    <input
                      type="text"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="e.g. Please scan to complete payment."
                      className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-slate-855 dark:text-theme-primary font-medium"
                    />
                  </div>
                </div>

                {/* PDF/Preview checks */}
                <div className="flex items-center justify-between p-3.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-surface border border-theme-border-soft dark:border-slate-750 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-theme-primary dark:text-theme-muted dark:text-theme-secondary block">Show QR in PDF Invoice</span>
                    <span className="text-[9px] text-theme-muted font-medium">Render the QR code on generated PDF documents</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQrInPdf(!showQrInPdf)}
                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${showQrInPdf ? 'bg-theme-accent' : 'bg-theme-border-strong dark:bg-theme-surface'}`}
                  >
                    <div className={`w-4 h-4 bg-theme-card dark:bg-theme-card rounded-full absolute top-1 transition-all duration-300 ${showQrInPdf ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-surface border border-theme-border-soft dark:border-slate-750 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-theme-primary dark:text-theme-muted dark:text-theme-secondary block">Show QR on Local Preview</span>
                    <span className="text-[9px] text-theme-muted font-medium">Render the QR code on invoice previews inside dashboard</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQrInPreview(!showQrInPreview)}
                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${showQrInPreview ? 'bg-theme-accent' : 'bg-theme-border-strong dark:bg-theme-surface'}`}
                  >
                    <div className={`w-4 h-4 bg-theme-card dark:bg-theme-card rounded-full absolute top-1 transition-all duration-300 ${showQrInPreview ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
          <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-theme-accent-light dark:bg-theme-accent-light/40 text-theme-accent dark:text-theme-accent flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-theme-primary dark:text-theme-primary dark:text-theme-secondary">Invoice Preferences</h2>
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Invoice templates, numbering, and color accents</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Primary Invoice Layout Structure</label>
                <select
                  value={invoiceTemplate}
                  onChange={(e) => setInvoiceTemplate(e.target.value)}
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
                >
                  <option value="modern">Modern A4 Template Layout</option>
                  <option value="classic">Classic A5 Template Layout</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Default Form Template Field Layout</label>
                <select
                  value={defaultBillingTemplate}
                  onChange={(e) => setDefaultBillingTemplate(e.target.value)}
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
                >
                  <option value="embroidery">Embroidery / Sewing / Fashion</option>
                  <option value="grocery">Grocery / Kirana Shop</option>
                  <option value="repair">Mobile Repair / Tailoring Service</option>
                  <option value="retail">Retail Shopping Store</option>
                  <option value="custom">Standard Flexible Bill</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Invoice Number Prefix</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="e.g. INV-"
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Tax ID / GST Number (Optional)</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-bold uppercase"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-2 uppercase tracking-wide flex items-center gap-2">
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
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Default Invoice Notes</label>
                <textarea
                  value={defaultNotes}
                  onChange={(e) => setDefaultNotes(e.target.value)}
                  placeholder="Thank you for your business!"
                  rows="2"
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-medium resize-none text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">Terms & Conditions</label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="1. Payment is expected within due date."
                  rows="2"
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-medium resize-none text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase tracking-wide">PDF Document Footer Note</label>
                <input
                  type="text"
                  value={pdfFooter}
                  onChange={(e) => setPdfFooter(e.target.value)}
                  placeholder="e.g. This is a computer generated invoice."
                  className="w-full px-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent text-theme-primary dark:text-theme-primary dark:text-theme-primary font-medium"
                />
              </div>
            </div>
          </div>
        )}
          <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 md:p-8 border border-theme-border-soft dark:border-theme-border-soft shadow-premium space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-theme-border-soft dark:border-theme-border-soft/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-theme-accent-light dark:bg-theme-accent-light/40 text-theme-accent dark:text-theme-accent flex items-center justify-center">
                <Link className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-theme-primary dark:text-theme-primary dark:text-theme-secondary">Customer Live Link Settings</h2>
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">Configure what public customers see and interact with</p>
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
                <div key={idx} className="flex items-start justify-between p-3.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl">
                  <div className="mr-3">
                    <span className="text-xs font-bold text-theme-primary dark:text-theme-muted dark:text-slate-250 block">{item.label}</span>
                    <span className="text-[9px] text-theme-muted dark:text-theme-muted font-semibold">{item.desc}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => item.setter(!item.state)}
                    className={`w-9 h-5 rounded-full relative transition-colors duration-300 shrink-0 mt-0.5 focus:outline-none ${item.state ? 'bg-theme-accent' : 'bg-slate-350 dark:bg-theme-surface'}`}
                  >
                    <div className={`w-3 h-3 bg-theme-card dark:bg-theme-card rounded-full absolute top-1 transition-all duration-300 ${item.state ? 'left-5' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}

            </div>
          </div>
        )}

    </>
  );
};

export default BusinessProfileTab;