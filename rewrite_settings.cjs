const fs = require('fs');

let settingsCode = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

const returnMatch = settingsCode.match(/return \(\s*<div/);
if (!returnMatch) {
    console.error("Could not find return statement");
    process.exit(1);
}
const returnIndex = returnMatch.index;

// Keep everything before the return
const header = settingsCode.substring(0, returnIndex);

const imports = `import SettingsSidebar from './settings/SettingsSidebar';
import BusinessProfileTab from './settings/BusinessProfileTab';
import ThemeStudioTab from './settings/ThemeStudioTab';
import AdminConsoleTab from './settings/AdminConsoleTab';
import DataBackupTab from './settings/DataBackupTab';
`;

// Insert the imports at the top
let newCode = header.replace(/import React(.*?)\n/, "import React$1\n" + imports);

// Add the new return
newCode += `  // Combine all needed state to pass as props
  const tabProps = {
    // Shared State
    activeTab, setActiveTab,
    toast, currency, handleSave, onSaveSettings, dbProvider, handleSetDbProvider,
    handleForceSync, handleGranularWipe, handleResetData,
    
    // Admin Info
    totalInvoices, totalCustomers, pendingPayments,
    firebaseStatus, firebaseStatusColor, firebaseStatusDot,
    
    // Tab Specific State...
    businessName, setBusinessName, logoUrl, handleLogoChange, handleRemoveLogo,
    ownerName, setOwnerName, phone, setPhone, whatsapp, setWhatsapp, email, setEmail,
    address, setAddress, gstNumber, setGstNumber, country, setCountry, language, setLanguage,
    currency, setCurrency, currencyCode, setCurrencyCode, taxLabel, setTaxLabel, vatTax, setVatTax,
    dateFormat, setDateFormat, numberFormat, setNumberFormat, upiId, setUpiId,
    bkashNumber, setBkashNumber, nagadNumber, setNagadNumber, rocketNumber, setRocketNumber,
    payeeName, setPayeeName, paymentNote, setPaymentNote, paymentQrEnabled, setPaymentQrEnabled,
    paymentMethod, setPaymentMethod, customPaymentLink, setCustomPaymentLink, invoicePrefix,
    setInvoicePrefix, defaultTax, setDefaultTax, defaultNotes, setDefaultNotes, terms, setTerms,
    pdfFooter, setPdfFooter, defaultBillingTemplate, setDefaultBillingTemplate,
    enableLiveLink, setEnableLiveLink, showPaymentQrOnLink, setShowPaymentQrOnLink,
    allowPdfDownload, setAllowPdfDownload, allowPaymentProofSubmit, setAllowPaymentProofSubmit,
    showPaidDueAmount, setShowPaidDueAmount, showContactButton, setShowContactButton,
    requireTransactionId, setRequireTransactionId, requirePaymentScreenshot, setRequirePaymentScreenshot,
    isDragging, setIsDragging,
    
    // Theme Studio
    themeColor, setThemeColor, darkMode, setDarkMode, brandColor, setBrandColor,
    pdfVisibleFields, setPdfVisibleFields, enableHaptics, setEnableHaptics,
    enableSounds, setEnableSounds, getThemePreviewColors,
    
    // Admin
    adminSubTab, setAdminSubTab, loadingAdminData, adminUsers, adminRequests,
    globalSettings, adminGlobalTheme, setAdminGlobalTheme, adminGlobalMode, setAdminGlobalMode,
    updateGlobalAdminSettings, setSelectedScreenshot, setShowRejectionModalFor,
    rejectionReasonInput, setRejectionReasonInput, handleConfirmRejectRequest,
    selectedScreenshot, showRejectionModalFor,
    
    // Data Backup
    handleExportData, handleImportData, storageInfo
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 relative font-sans text-theme-primary dark:text-theme-primary dark:text-theme-secondary">
      {/* DEVELOPMENT DEBUG BLOCK */}
      {isAdmin && (
        <div className="bg-theme-card text-[10px] text-green-400 p-2 mb-4 rounded font-mono break-all dark:bg-theme-card dark:border dark:border-theme-border-soft flex justify-between">
          <span>Logged in as: {loggedInEmail} | Admin access: {isAdmin ? 'true' : 'false'}</span>
          <span>Target Admin: {getAdminEmail()}</span>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 bg-theme-accent text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">Settings saved successfully</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-theme-primary dark:text-theme-primary tracking-tight">Business settings</h1>
          <p className="text-xs text-theme-muted dark:text-theme-muted font-medium mt-0.5">Configure your company profile and invoicing configurations.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 font-bold text-xs px-6 py-3 rounded-xl shadow-glow active:scale-[0.98] transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 space-y-6">
          {activeTab === 'business_profile' && <BusinessProfileTab {...tabProps} />}
          {activeTab === 'theme_studio' && <ThemeStudioTab {...tabProps} />}
          {activeTab === 'admin_console' && <AdminConsoleTab {...tabProps} />}
          {activeTab === 'data_backup' && <DataBackupTab {...tabProps} />}
        </div>
      </div>

      {/* Lightbox for screenshots */}
      {selectedScreenshot && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="relative max-w-3xl max-h-[85vh] w-full flex flex-col items-center bg-theme-card rounded-3xl p-4 overflow-hidden border border-slate-800">
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-4 right-4 bg-theme-card/80 hover:bg-slate-700 text-white font-bold p-2.5 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              ✕
            </button>
            <div className="flex-1 overflow-auto flex items-center justify-center p-2">
              <img
                src={selectedScreenshot}
                alt="Payment Proof Receipt"
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
            <p className="text-theme-muted text-xs font-semibold mt-4 tracking-wide">Click close or press ✕ to exit preview</p>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModalFor && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 max-w-md w-full border border-theme-border-soft dark:border-theme-border-soft shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-theme-danger dark:text-rose-455 uppercase tracking-widest">Reject Upgrade Request</h3>
            <p className="text-xs text-slate-505 dark:text-theme-muted font-semibold leading-relaxed">
              Please specify the exact reason for rejecting this upgrade request. This reason will be stored in the request log for user visibility.
            </p>
            <textarea
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. Transaction ID could not be verified on bank records..."
              className="w-full text-xs p-3 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-theme-primary"
              rows={3}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectionModalFor(null)}
                className="px-4 py-2 border border-theme-border-soft dark:border-slate-750 text-slate-505 dark:text-theme-muted hover:bg-theme-app dark:hover:bg-slate-850 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectRequest}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
`;

fs.writeFileSync('src/pages/Settings.jsx', newCode);
