import React, { useState } from 'react';
import { 
  Scissors, 
  ShoppingBasket, 
  Wrench, 
  ShoppingBag, 
  PenTool, 
  CheckCircle2, 
  Globe, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  QrCode, 
  CreditCard, 
  ChevronRight, 
  ChevronLeft, 
  Languages, 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Check 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const SetupBilling = ({ businessSettings, onSaveSettings, setCurrentTab }) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [country, setCountry] = useState('India');
  const [language, setLanguage] = useState('English');
  
  // Business Profile
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('custom');

  // Payments
  const [paymentQrEnabled, setPaymentQrEnabled] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [gstNumber, setGstNumber] = useState(''); // India GSTIN
  const [bkashNumber, setBkashNumber] = useState('');
  const [nagadNumber, setNagadNumber] = useState('');
  const [rocketNumber, setRocketNumber] = useState(''); // Bangladesh MFS Rocket
  const [vatTax, setVatTax] = useState(''); // Bangladesh VAT rate %
  const [customCurrency, setCustomCurrency] = useState('$'); // Other Currency Symbol
  const [customPaymentLink, setCustomPaymentLink] = useState(''); // Other Custom Bank link
  const [paymentNote, setPaymentNote] = useState('');

  const [isDragging, setIsDragging] = useState(false);

  const templates = [
    {
      id: 'embroidery',
      title: 'Embroidery / Fashion',
      icon: <Scissors className="w-5 h-5 text-theme-accent" />,
      color: 'bg-theme-surface border-theme-border-soft hover:border-theme-accent dark:bg-theme-card dark:border-theme-border-soft',
      description: 'Design No, Work Type, Size, Qty, Rate, Amount'
    },
    {
      id: 'grocery',
      title: 'Grocery / Mudi Shop',
      icon: <ShoppingBasket className="w-5 h-5 text-orange-500" />,
      color: 'bg-orange-50 border-orange-200 hover:border-orange-500 dark:bg-orange-950/20 dark:border-orange-900',
      description: 'Product Name, Unit, Quantity, Unit Price, Amount'
    },
    {
      id: 'repair',
      title: 'Repair / Service',
      icon: <Wrench className="w-5 h-5 text-theme-accent" />,
      color: 'bg-theme-accent-light border-theme-border-soft hover:border-theme-accent dark:bg-theme-accent/10 dark:border-theme-accent/30',
      description: 'Service, Problem details, Parts, Labour, Qty'
    },
    {
      id: 'retail',
      title: 'Retail / Shopping',
      icon: <ShoppingBag className="w-5 h-5 text-theme-accent" />,
      color: 'bg-theme-surface border-theme-border-soft hover:border-theme-accent dark:bg-theme-card dark:border-theme-border-soft',
      description: 'Product, Category, Variant, Qty, Price, Discount'
    },
    {
      id: 'custom',
      title: 'Custom Bill',
      icon: <PenTool className="w-5 h-5 text-theme-muted" />,
      color: 'bg-theme-app dark:bg-theme-surface border-theme-border-soft hover:border-theme-border-soft0 dark:bg-theme-surface/40 dark:border-theme-border-soft',
      description: 'Item/Service, Description, Quantity, Rate, Amount'
    }
  ];

  // Helper when changing country, auto pre-configure some options
  const handleCountryChange = (selectedCountry) => {
    setCountry(selectedCountry);
    if (selectedCountry === 'India') {
      setPaymentMethod('UPI');
      setPaymentNote('Scan QR using any UPI app to pay securely.');
      setCustomCurrency('₹');
    } else if (selectedCountry === 'Bangladesh') {
      setPaymentMethod('bKash');
      setPaymentNote('Transfer the due amount using bKash/Nagad.');
      setCustomCurrency('৳');
    } else {
      setPaymentMethod('Manual');
      setPaymentNote('Please complete the bank transfer using details above.');
      setCustomCurrency('$');
    }
  };

  const handleNext = () => {
    if (step === 1 && !country) {
      toast.error('Please select a country to proceed.');
      return;
    }
    if (step === 2) {
      if (!businessName.trim()) {
        toast.error('Business Name is required.');
        return;
      }
      if (!ownerName.trim()) {
        toast.error('Owner Name is required.');
        return;
      }
    }
    if (step === 3) {
      if (paymentQrEnabled) {
        if (country === 'India') {
          if (paymentMethod === 'UPI' && !upiId.trim()) {
            toast.error('Please enter your UPI ID.');
            return;
          }
        } else if (country === 'Bangladesh') {
          if (paymentMethod === 'bKash' && !bkashNumber.trim() && !nagadNumber.trim()) {
            toast.error('Please provide at least a bKash or Nagad wallet number.');
            return;
          }
        } else {
          if (paymentMethod === 'Manual' && !customPaymentLink.trim()) {
            toast.error('Please enter Bank transfer details or custom payment URL.');
            return;
          }
        }
      }
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = () => {
    setIsSaving(true);
    
    let currencySymbol;
    let currencyCode;
    let taxLabel;
    let computedTax;
    let dateFormat;
    let numberFormat;

    if (country === 'India') {
      currencySymbol = '₹';
      currencyCode = 'INR';
      taxLabel = 'GST';
      computedTax = 18;
      dateFormat = 'DD/MM/YYYY';
      numberFormat = 'Indian';
    } else if (country === 'Bangladesh') {
      currencySymbol = '৳';
      currencyCode = 'BDT';
      taxLabel = 'VAT';
      computedTax = parseFloat(vatTax) || 0;
      dateFormat = 'DD/MM/YYYY';
      numberFormat = 'Standard';
    } else {
      currencySymbol = customCurrency || '$';
      currencyCode = customCurrency === '$' ? 'USD' : (customCurrency === '€' ? 'EUR' : 'USD');
      taxLabel = 'Tax';
      computedTax = 0;
      dateFormat = 'DD/MM/YYYY';
      numberFormat = 'Standard';
    }

    const payload = {
      ...businessSettings,
      setupCompleted: true,
      country,
      language,
      businessName,
      ownerName,
      phone,
      email,
      address,
      logoUrl,
      defaultBillingTemplate: selectedTemplate,
      currency: currencySymbol,
      currencyCode,
      taxLabel,
      defaultTax: computedTax,
      gstNumber: gstNumber || '',
      vatTax: vatTax || '',
      paymentQrEnabled,
      paymentMethod,
      upiId,
      bkashNumber,
      nagadNumber,
      rocketNumber,
      payeeName: payeeName || businessName,
      paymentNote,
      customPaymentLink,
      brandColor: country === 'India' ? '#14b8a6' : (country === 'Bangladesh' ? '#e11d48' : '#6366f1'),
      invoiceTemplate: 'modern',
      dateFormat,
      numberFormat,
      customerLiveLinkSettings: {
        enableLiveInvoiceLink: true,
        showPaymentQr: true,
        allowCustomerPdfDownload: true,
        allowPaymentProofSubmit: true,
        showPaidDueAmount: true,
        showContactButton: true,
        requireTransactionId: true,
        requirePaymentScreenshot: false
      }
    };

    setTimeout(() => {
      onSaveSettings(payload);
      setIsSaving(false);
      toast.success('BillQyro workspace successfully initialized!');
      setCurrentTab('dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-theme-app dark:bg-theme-surface dark:bg-theme-app py-10 px-4 md:px-6 flex items-center justify-center font-sans antialiased">
      <div className="max-w-3xl w-full bg-theme-card dark:bg-theme-card rounded-3xl shadow-xl border border-theme-border-soft dark:border-theme-border-soft/80 overflow-hidden flex flex-col min-h-[580px] transition-all">
        
        {/* Top Progress bar Indicator */}
        <div className="relative h-2 bg-theme-surface dark:bg-theme-card">
          <div 
            className="absolute top-0 left-0 h-full bg-[image:var(--accent-gradient)] text-theme-button-text border-0 rounded-r-full transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        {/* Dynamic Step Header */}
        <div className="bg-[#071B3A] p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent-light rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 left-10 w-32 h-32 bg-theme-accent-light rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="text-[10px] bg-theme-accent-light text-theme-accent border border-theme-border-soft px-2.5 py-1 rounded-full uppercase tracking-wider font-extrabold">
                Step {step} of 4
              </span>
              <h1 className="text-xl md:text-2xl font-black mt-2 tracking-tight">
                {step === 1 && 'Configure Local Region'}
                {step === 2 && 'Business Information'}
                {step === 3 && 'Payment Gateway Setup'}
                {step === 4 && 'Complete Setup & Launch'}
              </h1>
              <p className="text-xs text-theme-muted font-medium mt-1">
                {step === 1 && 'Select your country to set localization defaults.'}
                {step === 2 && 'Personalize invoices with your company details.'}
                {step === 3 && 'Enable Scan-to-Pay code options for your clients.'}
                {step === 4 && 'Double check your workspace profile and language.'}
              </p>
            </div>
            
            <div className="w-12 h-12 bg-theme-card dark:bg-theme-card/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center font-bold text-white text-lg">
              {step === 1 && <Globe className="w-6 h-6 text-theme-accent" />}
              {step === 2 && <Building2 className="w-6 h-6 text-theme-accent" />}
              {step === 3 && <QrCode className="w-6 h-6 text-rose-300" />}
              {step === 4 && <Sparkles className="w-6 h-6 text-amber-300" />}
            </div>
          </div>
        </div>

        {/* Core Wizard Body */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
          
          {/* STEP 1: Select Country */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <label className="block text-xs font-black text-theme-muted dark:text-theme-muted mb-3 uppercase tracking-wider">
                  Choose your Country
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'India', flag: '🇮🇳', label: 'India', desc: 'UPI, INR ₹ Currency, GST tax defaults' },
                    { id: 'Bangladesh', flag: '🇧🇩', label: 'Bangladesh', desc: 'bKash, Nagad, Rocket, BDT ৳ Currency, VAT defaults' },
                    { id: 'Other', flag: '🌐', label: 'Other', desc: 'Manual currency selection & bank transfers' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleCountryChange(item.id)}
                      className={`p-5 rounded-2xl border-2 text-left transition-all ${
                        country === item.id 
                          ? 'border-theme-accent bg-theme-accent-light/20 dark:bg-theme-accent-light/20' 
                          : 'border-theme-border-soft dark:border-theme-border-soft hover:border-theme-border-soft dark:border-theme-border-soft bg-theme-app dark:bg-theme-surface/50 hover:bg-theme-surface dark:bg-theme-surface/40 dark:bg-theme-card/30'
                      }`}
                    >
                      <div className="text-3xl mb-2">{item.flag}</div>
                      <h3 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary">{item.label}</h3>
                      <p className="text-[10px] text-theme-muted font-semibold mt-1 leading-snug">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-theme-surface dark:bg-theme-surface dark:bg-theme-accent/5 border border-theme-border-soft dark:border-theme-border-soft rounded-2xl">
                <p className="text-[10px] text-theme-muted leading-relaxed font-bold">
                  “Choose your country to automatically set currency, payment methods, and tax labels.”
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Business Profile */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase">Registered Business Name *</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. BillQyro Embroidery"
                    className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-primary font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 XXXXX"
                    className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary dark:text-theme-secondary font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase">Business Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary dark:text-theme-secondary font-semibold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase">Corporate Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full business office address details..."
                    rows="2"
                    className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary dark:text-theme-secondary resize-none text-xs"
                  />
                </div>

                {/* Base64 Logo Upload integration */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase">Corporate Logo (Optional)</label>
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-4.5 text-center transition-all ${
                      isDragging ? 'border-theme-accent bg-theme-accent-light/30 dark:bg-theme-accent-light/20' : 'border-theme-border-soft bg-theme-app dark:bg-theme-surface hover:bg-theme-surface dark:bg-theme-card dark:border-theme-border-soft dark:bg-theme-surface/40 dark:hover:bg-slate-850'
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
                    <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                      <Upload className="w-5 h-5 text-theme-muted" />
                      <span className="text-xs font-bold text-theme-muted dark:text-theme-muted">Drag & drop logo file, or click to upload</span>
                    </div>
                  </div>
                  {logoUrl && (
                    <div className="mt-3 flex items-center gap-3.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-surface p-2.5 rounded-xl border border-theme-border-soft/40 dark:border-theme-border-soft">
                      <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain rounded-lg border bg-theme-card dark:bg-theme-card p-0.5" />
                      <span className="text-[10px] text-theme-muted font-bold uppercase truncate max-w-xs flex-1">Logo image uploaded</span>
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="p-1.5 bg-theme-danger/5 text-theme-danger hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Template selection integrated */}
              <div className="pt-2">
                <label className="block text-xs font-black text-theme-muted dark:text-theme-muted mb-2 uppercase tracking-wide">
                  Configure Your Invoicing Layout
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {templates.map((tpl) => {
                    const isSelected = selectedTemplate === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-between min-h-[90px] ${
                          isSelected 
                            ? 'border-theme-accent bg-theme-accent-light/30 dark:bg-theme-accent-light/20 text-theme-accent dark:text-theme-accent shadow-sm scale-102 font-bold' 
                            : 'border-theme-border-soft dark:border-theme-border-soft bg-theme-app dark:bg-theme-surface/50 hover:bg-theme-surface dark:bg-theme-card text-theme-muted dark:border-theme-border-soft dark:bg-theme-card/30'
                        }`}
                      >
                        <div className="p-1.5 bg-theme-card dark:bg-theme-card dark:bg-theme-surface rounded-lg shadow-xs mb-1.5">
                          {tpl.icon}
                        </div>
                        <h4 className="text-[10px] leading-tight font-extrabold">{tpl.title}</h4>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Configuration (DYNAMICS) */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Payment Enable toggle */}
              <div className="flex items-center justify-between p-3.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl">
                <div>
                  <span className="text-xs font-black text-theme-primary dark:text-theme-muted dark:text-slate-250 block">Enable Automated Scan-to-Pay QR Codes</span>
                  <span className="text-[9px] text-theme-muted font-bold">Embed a QR payment code and deep link inside digital invoices for immediate payment.</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setPaymentQrEnabled(!paymentQrEnabled)}
                  className={`w-10 h-5.5 rounded-full relative transition-colors duration-300 focus:outline-none ${paymentQrEnabled ? 'bg-theme-accent' : 'bg-theme-border-strong dark:bg-theme-surface'}`}
                >
                  <div className={`w-3.5 h-3.5 bg-theme-card dark:bg-theme-card rounded-full absolute top-1 transition-all duration-300 ${paymentQrEnabled ? 'left-5.5' : 'left-1'}`}></div>
                </button>
              </div>

              {paymentQrEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  
                  {/* DYNAMIC CONFIGS DEPENDING ON COUNTRY */}
                  {country === 'India' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase">UPI ID *</label>
                        <input
                          type="text"
                          required
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. yourbusiness@okaxis"
                          className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase">Payee / Account Name *</label>
                        <input
                          type="text"
                          required
                          value={payeeName}
                          onChange={(e) => setPayeeName(e.target.value)}
                          placeholder="e.g. BillQyro Store"
                          className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-bold"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase">GSTIN / Tax ID (Optional)</label>
                        <input
                          type="text"
                          value={gstNumber}
                          onChange={(e) => setGstNumber(e.target.value)}
                          placeholder="e.g. 29AAAAA0000A1Z5"
                          className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-bold uppercase"
                        />
                      </div>
                    </>
                  )}

                  {country === 'Bangladesh' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase">bKash Account Number *</label>
                        <input
                          type="text"
                          required
                          value={bkashNumber}
                          onChange={(e) => setBkashNumber(e.target.value)}
                          placeholder="e.g. 017XXXXXXXX"
                          className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase">Nagad Account Number</label>
                        <input
                          type="text"
                          value={nagadNumber}
                          onChange={(e) => setNagadNumber(e.target.value)}
                          placeholder="e.g. 019XXXXXXXX"
                          className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase">Rocket Account Number (Optional)</label>
                        <input
                          type="text"
                          value={rocketNumber}
                          onChange={(e) => setRocketNumber(e.target.value)}
                          placeholder="e.g. 018XXXXXXXX"
                          className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase">Default VAT/Tax % (Optional)</label>
                        <input
                          type="number"
                          value={vatTax}
                          onChange={(e) => setVatTax(e.target.value)}
                          placeholder="e.g. 7.5"
                          className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-bold"
                        />
                      </div>
                    </>
                  )}

                  {country === 'Other' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase font-black">Choose Currency *</label>
                        <select
                          value={customCurrency}
                          onChange={(e) => setCustomCurrency(e.target.value)}
                          className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary dark:text-theme-primary font-bold"
                        >
                          <option value="$">USD $ (US Dollar)</option>
                          <option value="€">EUR € (Euro)</option>
                          <option value="£">GBP £ (Pound)</option>
                          <option value="¥">JPY ¥ (Yen)</option>
                          <option value="AED">AED (Dirham)</option>
                          <option value="SAR">SAR (Riyal)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase">Custom Payment Link / QR Text *</label>
                        <input
                          type="text"
                          required
                          value={customPaymentLink}
                          onChange={(e) => setCustomPaymentLink(e.target.value)}
                          placeholder="e.g. https://paypal.me/yourbusiness or bank details"
                          className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-slate-850 dark:text-slate-250"
                        />
                      </div>
                    </>
                  )}

                  {/* Payment instructions note */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-theme-muted dark:text-theme-muted mb-1.5 uppercase">Custom Payment Instructions (Note)</label>
                    <input
                      type="text"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="Showed beneath the payment QR code module."
                      className="w-full px-4 py-2.5 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-slate-850 dark:text-theme-secondary text-xs"
                    />
                  </div>

                </div>
              )}
            </div>
          )}

          {/* STEP 4: Review Summary & Language Selection */}
          {step === 4 && (
            <div className="space-y-5 animate-fadeIn text-xs font-semibold text-theme-muted">
              
              {/* Language selection with dynamic suggests */}
              <div className="bg-theme-card dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-2xl p-4.5 space-y-3.5 shadow-sm">
                <label className="block text-xs font-black text-theme-muted dark:text-theme-muted uppercase tracking-wider">
                  Choose UI Language
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted">
                    <Languages className="w-4 h-4" />
                  </span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-theme-app dark:bg-theme-surface dark:bg-theme-card border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary dark:text-theme-muted dark:text-theme-secondary font-bold"
                  >
                    <option value="English">English (Global standard)</option>
                    <option value="Bengali">Bengali (বাংলা)</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                  </select>
                </div>

                {/* Country recommendations */}
                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                  <span className="text-[9px] text-theme-muted font-extrabold uppercase mr-1">Suggested for you:</span>
                  {country === 'India' && (
                    <>
                      <button type="button" onClick={() => setLanguage('English')} className={`px-3 py-1 text-[10px] font-black rounded-lg border transition-all ${language === 'English' ? 'bg-theme-accent text-white border-theme-accent' : 'bg-theme-app dark:bg-theme-surface text-theme-muted border-theme-border-soft dark:bg-theme-card dark:text-theme-muted dark:border-slate-750'}`}>English</button>
                      <button type="button" onClick={() => setLanguage('Hindi')} className={`px-3 py-1 text-[10px] font-black rounded-lg border transition-all ${language === 'Hindi' ? 'bg-theme-accent text-white border-theme-accent' : 'bg-theme-app dark:bg-theme-surface text-theme-muted border-theme-border-soft dark:bg-theme-card dark:text-theme-muted dark:border-slate-750'}`}>Hindi</button>
                      <button type="button" onClick={() => setLanguage('Bengali')} className={`px-3 py-1 text-[10px] font-black rounded-lg border transition-all ${language === 'Bengali' ? 'bg-theme-accent text-white border-theme-accent' : 'bg-theme-app dark:bg-theme-surface text-theme-muted border-theme-border-soft dark:bg-theme-card dark:text-theme-muted dark:border-slate-750'}`}>Bengali</button>
                    </>
                  )}
                  {country === 'Bangladesh' && (
                    <>
                      <button type="button" onClick={() => setLanguage('English')} className={`px-3 py-1 text-[10px] font-black rounded-lg border transition-all ${language === 'English' ? 'bg-theme-accent text-white border-theme-accent' : 'bg-theme-app dark:bg-theme-surface text-theme-muted border-theme-border-soft dark:bg-theme-card dark:text-theme-muted dark:border-slate-750'}`}>English</button>
                      <button type="button" onClick={() => setLanguage('Bengali')} className={`px-3 py-1 text-[10px] font-black rounded-lg border transition-all ${language === 'Bengali' ? 'bg-theme-accent text-white border-theme-accent' : 'bg-theme-app dark:bg-theme-surface text-theme-muted border-theme-border-soft dark:bg-theme-card dark:text-theme-muted dark:border-slate-750'}`}>Bengali</button>
                    </>
                  )}
                  {country === 'Other' && (
                    <button type="button" onClick={() => setLanguage('English')} className={`px-3 py-1 text-[10px] font-black rounded-lg border transition-all ${language === 'English' ? 'bg-theme-accent text-white border-theme-accent' : 'bg-theme-app dark:bg-theme-surface text-theme-muted border-theme-border-soft dark:bg-theme-card dark:text-theme-muted dark:border-slate-750'}`}>English</button>
                  )}
                </div>
              </div>

              <div className="bg-theme-app dark:bg-theme-surface dark:bg-theme-surface rounded-2xl p-5 border border-theme-border-soft dark:border-theme-border-soft space-y-4">
                <h3 className="font-extrabold text-sm text-theme-primary dark:text-theme-primary flex items-center gap-1.5 uppercase">
                  <CheckCircle2 className="w-4 h-4 text-theme-accent" /> Confirm Profile Summary
                </h3>
                
                <div className="grid grid-cols-2 gap-y-3.5 text-theme-primary dark:text-theme-muted">
                  <div>
                    <span className="text-[10px] text-theme-muted block uppercase">Business Name</span>
                    <strong className="text-theme-primary dark:text-theme-primary text-sm">{businessName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-muted block uppercase">Owner Name</span>
                    <strong className="text-theme-primary dark:text-theme-primary text-sm">{ownerName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-muted block uppercase">Region & Currency</span>
                    <span>{country} ({country === 'India' ? 'INR ₹' : (country === 'Bangladesh' ? 'BDT ৳' : customCurrency)})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-muted block uppercase">Tax Parameter</span>
                    <span>{country === 'India' ? 'GST' : (country === 'Bangladesh' ? 'VAT' : 'Tax')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-muted block uppercase">Invoicing Layout</span>
                    <span className="capitalize">{selectedTemplate} format</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-muted block uppercase">UI Language</span>
                    <span>{language}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Footer Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-theme-border-soft dark:border-theme-border-soft/80 mt-8">
            <button
              onClick={handleBack}
              disabled={step === 1 || isSaving}
              className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                step === 1 
                  ? 'border-transparent text-theme-muted dark:text-theme-primary dark:text-theme-muted cursor-default' 
                  : 'bg-theme-card dark:bg-theme-card hover:bg-theme-app dark:bg-theme-surface border-theme-border-soft dark:border-theme-border-soft dark:bg-theme-card text-theme-muted dark:text-theme-muted active:scale-95'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 rounded-xl text-xs font-black tracking-wider uppercase active:scale-98 transition-all cursor-pointer shadow-md"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 rounded-xl text-xs font-black tracking-widest uppercase active:scale-98 transition-all cursor-pointer shadow-glow"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Initializing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Launch Workspace</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default SetupBilling;
