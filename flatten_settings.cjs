const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/SettingsStudioV2.jsx');
let code = fs.readFileSync(file, 'utf8');

// 1. We replace the huge block of useStates with a single formData
const stateRegex = /const \[([a-zA-Z0-9_]+), set[A-Z][a-zA-Z0-9_]*\] = useState\(([^)]*)\);/g;
let match;
let stateVars = [];

while ((match = stateRegex.exec(code)) !== null) {
  // Ignore structural UI states that shouldn't be flattened
  if (['activeSection', 'searchQuery', 'isDirty', 'isSaving', 'saveState', 'showNav', 'showPreview', 'isLoading', 'storageInfo', 'lastSaved', 'isDragging', 'dbProvider'].includes(match[1])) {
    continue;
  }
  stateVars.push(match[1]);
}

console.log('Variables to flatten:', stateVars.length);

// 2. Replace the state declarations block with formData
let newCode = code.replace(/  \/\/ Business states[\s\S]*?const session = getAuthSession\(\);/, `
  const [formData, setFormData] = useState({});
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };
  const session = getAuthSession();
`);

// 3. Replace initialization logic
const initRegex = /if \(settings && Object\.keys\(settings\)\.length > 0 && !isInitialized\.current\) \{[\s\S]*?\}\n  \}, \[settings\]\);/g;

newCode = newCode.replace(initRegex, `if (settings && Object.keys(settings).length > 0 && !isInitialized.current) {
      isInitialized.current = true;
      setFormData({
        ...settings,
        businessName: settings.businessName || '',
        logoUrl: settings.logoUrl || '',
        ownerName: settings.ownerName || '',
        phone: settings.phone || '',
        whatsapp: settings.whatsapp || '',
        email: settings.email || '',
        address: settings.address || '',
        gstNumber: settings.gstNumber || '',
        geminiApiKey: settings.geminiApiKey || '',
        twilioAccountSid: settings.twilioAccountSid || '',
        twilioAuthToken: settings.twilioAuthToken || '',
        country: settings.country || 'India',
        language: settings.language || 'English',
        currency: settings.currency || '\\u20B9',
        currencyCode: settings.currencyCode || 'INR',
        taxLabel: settings.taxLabel || 'GST',
        vatTax: settings.vatTax || '',
        dateFormat: settings.dateFormat || 'DD/MM/YYYY',
        numberFormat: settings.numberFormat || 'Indian',
        invoicePrefix: settings.invoicePrefix || 'INV-',
        defaultTax: settings.defaultTax !== undefined ? settings.defaultTax : 18,
        defaultNotes: settings.defaultNotes || '',
        terms: settings.terms || '',
        pdfFooter: settings.pdfFooter || '',
        upiId: settings.upiId || '',
        paymentQrEnabled: settings.paymentQrEnabled || false,
        paymentMethod: settings.paymentMethod || 'UPI',
        bkashNumber: settings.bkashNumber || '',
        nagadNumber: settings.nagadNumber || '',
        rocketNumber: settings.rocketNumber || '',
        payeeName: settings.payeeName || '',
        paymentNote: settings.paymentNote || '',
        showQrInPdf: settings.showQrInPdf !== undefined ? settings.showQrInPdf : true,
        showQrInPreview: settings.showQrInPreview !== undefined ? settings.showQrInPreview : true,
        customPaymentLink: settings.customPaymentLink || '',
        brandColor: settings.brandColor || '#14b8a6',
        invoiceTemplate: settings.invoiceTemplate || 'modern',
        defaultBillingTemplate: settings.defaultBillingTemplate || 'custom',
        themeId: settings.themeColor || 'obsidian-gold',
        darkMode: settings.darkMode ?? false,
        themePreset: settings.darkMode ? 'dark' : 'light',
        enableLiveLink: settings.customerLiveLinkSettings?.enableLiveInvoiceLink !== undefined ? settings.customerLiveLinkSettings.enableLiveInvoiceLink : true,
        showPaymentQrOnLink: settings.customerLiveLinkSettings?.showPaymentQr !== undefined ? settings.customerLiveLinkSettings.showPaymentQr : true,
        allowPdfDownload: settings.customerLiveLinkSettings?.allowCustomerPdfDownload !== undefined ? settings.customerLiveLinkSettings.allowCustomerPdfDownload : true,
        allowPaymentProofSubmit: settings.customerLiveLinkSettings?.allowPaymentProofSubmit !== undefined ? settings.customerLiveLinkSettings.allowPaymentProofSubmit : true,
        showPaidDueAmount: settings.customerLiveLinkSettings?.showPaidDueAmount !== undefined ? settings.customerLiveLinkSettings.showPaidDueAmount : true,
        showContactButton: settings.customerLiveLinkSettings?.showContactButton !== undefined ? settings.customerLiveLinkSettings.showContactButton : true,
        requireTransactionId: settings.customerLiveLinkSettings?.requireTransactionId !== undefined ? settings.customerLiveLinkSettings.requireTransactionId : true,
        requirePaymentScreenshot: settings.customerLiveLinkSettings?.requirePaymentScreenshot !== undefined ? settings.customerLiveLinkSettings.requirePaymentScreenshot : false,
        emailNotifications: settings.notifications?.email !== false,
        whatsappNotifications: settings.notifications?.whatsapp !== false,
        dueDateReminders: settings.notifications?.dueDateReminders !== false,
        paymentConfirmation: settings.notifications?.paymentConfirmation !== false,
        marketingEmails: settings.notifications?.marketing || false,
        securityAlerts: settings.notifications?.securityAlerts !== false,
        cornerRadius: settings.cornerRadius || 12,
        shadowIntensity: settings.shadowIntensity || 50,
        animationSpeed: settings.animationSpeed || 1,
        fontDensity: settings.fontDensity || 'normal'
      });
    }
  }, [settings]);`);

// 4. Replace save logic
const saveRegex = /const payload = \{[\s\S]*?notifications: \{[^\}]+\}\n        \};/g;
newCode = newCode.replace(saveRegex, `const payload = {
          ...settings, ...formData,
          defaultTax: parseFloat(formData.defaultTax) || 0,
          customerLiveLinkSettings: {
            ...settings?.customerLiveLinkSettings, 
            enableLiveInvoiceLink: formData.enableLiveLink,
            showPaymentQr: formData.showPaymentQrOnLink, 
            allowCustomerPdfDownload: formData.allowPdfDownload,
            allowPaymentProofSubmit: formData.allowPaymentProofSubmit, 
            showPaidDueAmount: formData.showPaidDueAmount,
            showContactButton: formData.showContactButton, 
            requireTransactionId: formData.requireTransactionId, 
            requirePaymentScreenshot: formData.requirePaymentScreenshot,
            selectedLiveLinkTemplate: settings?.customerLiveLinkSettings?.selectedLiveLinkTemplate || 'classic',
            themePreset: settings?.customerLiveLinkSettings?.themePreset || formData.themeId,
            ctaPreset: settings?.customerLiveLinkSettings?.ctaPreset || 'payNow',
            conversionLayout: settings?.customerLiveLinkSettings?.conversionLayout || 'modern'
          },
          notifications: { 
            email: formData.emailNotifications, 
            whatsapp: formData.whatsappNotifications, 
            dueDateReminders: formData.dueDateReminders, 
            paymentConfirmation: formData.paymentConfirmation, 
            marketing: formData.marketingEmails, 
            securityAlerts: formData.securityAlerts 
          }
        };`);

// 5. Replace state accesses in JSX
stateVars.forEach(v => {
  // Replace value={var}
  const valRegex = new RegExp('value=\\\\{(?:' + v + ')\\\\\\}', 'g');
  newCode = newCode.replace(valRegex, 'value={formData.' + v + ' || ""}');

  // Replace {var ? with {formData.var ?
  const valCondRegex = new RegExp('\\\\{(!?)' + v + ' (\\\\?|&&)', 'g');
  newCode = newCode.replace(valCondRegex, '{$1formData.' + v + ' $2');

  // Replace setVar(e.target.value) -> updateField('var', e.target.value)
  const setRegex = new RegExp('set' + v.charAt(0).toUpperCase() + v.slice(1) + '\\\\(e\\.target\\.value\\\\)', 'g');
  newCode = newCode.replace(setRegex, "updateField('" + v + "', e.target.value)");
  
  // Replace setVar(val) -> updateField('var', val)
  const setRegex2 = new RegExp('set' + v.charAt(0).toUpperCase() + v.slice(1) + '\\\\((.*?)\\\\)', 'g');
  newCode = newCode.replace(setRegex2, "updateField('" + v + "', $1)");
});

// Replace straight var occurrences that might have been missed in conditions like if(var)
newCode = newCode.replace(/if \(([^)]*?)\bbrandColor\b(.*?)\)/g, 'if ($1formData.brandColor$2)');
newCode = newCode.replace(/if \(([^)]*?)\bdarkMode\b(.*?)\)/g, 'if ($1formData.darkMode$2)');
newCode = newCode.replace(/if \(([^)]*?)\bbusinessName\b(.*?)\)/g, 'if ($1formData.businessName$2)');
newCode = newCode.replace(/if \(([^)]*?)\bpaymentQrEnabled\b(.*?)\)/g, 'if ($1formData.paymentQrEnabled$2)');
newCode = newCode.replace(/if \(([^)]*?)\bpaymentMethod\b(.*?)\)/g, 'if ($1formData.paymentMethod$2)');
newCode = newCode.replace(/if \(([^)]*?)\bupiId\b(.*?)\)/g, 'if ($1formData.upiId$2)');
newCode = newCode.replace(/if \(([^)]*?)\bbkashNumber\b(.*?)\)/g, 'if ($1formData.bkashNumber$2)');
newCode = newCode.replace(/if \(([^)]*?)\bnagadNumber\b(.*?)\)/g, 'if ($1formData.nagadNumber$2)');


// Remove massive useEffect for isDirty
const isDirtyRegex = /  \/\/ Mark dirty on changes[\s\S]*?\}\);/g;
newCode = newCode.replace(isDirtyRegex, '  // isDirty is handled by updateField');

// Fix theme toggle
newCode = newCode.replace(/const newMode = !darkMode;/g, 'const newMode = !formData.darkMode;');
newCode = newCode.replace(/setDarkMode\(newMode\);/g, "updateField('darkMode', newMode);");
newCode = newCode.replace(/setThemePreset\(newMode \? 'dark' : 'light'\);/g, "updateField('themePreset', newMode ? 'dark' : 'light');");
newCode = newCode.replace(/applyTheme\(themeId, null, newMode\);/g, 'applyTheme(formData.themeId, null, newMode);');

fs.writeFileSync(file, newCode);
console.log('Refactored SettingsStudioV2.jsx');
