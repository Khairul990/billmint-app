const fs = require('fs');
const path = require('path');

const orphanedFiles = [
  "src/components/AnimatedButton.jsx",
  "src/components/EmptyStates/EmptyBills.jsx",
  "src/components/EmptyStates/EmptyCustomers.jsx",
  "src/components/EmptyStates/EmptyDueLedger.jsx",
  "src/components/EmptyStates/EmptyExpenses.jsx",
  "src/components/EmptyStates/EmptyInvoices.jsx",
  "src/components/EmptyStates/EmptyPayments.jsx",
  "src/components/EmptyStates/EmptyProducts.jsx",
  "src/components/EmptyStates/EmptyReports.jsx",
  "src/components/invoice/AIInvoiceScanner.jsx",
  "src/components/invoice/ItemsSheetModal.jsx",
  "src/components/invoice/PdfFieldsModal.jsx",
  "src/components/invoice/quick/QuickBillForm.jsx",
  "src/components/invoice/SmartRateModal.jsx",
  "src/components/invoice/studio/ExcelBillTable.jsx",
  "src/components/invoice/studio/StickyTotalPanel.jsx",
  "src/components/NewUserGuide.jsx",
  "src/components/settings/PremiumThemePicker.jsx",
  "src/components/SetupProgress.jsx",
  "src/components/ShineBorder.jsx",
  "src/components/StaggerList.jsx",
  "src/components/SuccessAnimation.jsx",
  "src/hooks/usePremiumUX.js",
  "src/pages/AdminUnlock.jsx",
  "src/pages/onboarding/BusinessDetailsForm.jsx",
  "src/pages/onboarding/CountrySelection.jsx",
  "src/pages/onboarding/InteractiveTutorial.jsx",
  "src/pages/onboarding/PaymentSetup.jsx",
  "src/pages/onboarding/TemplateSelection.jsx",
  "src/pages/settings/AdminConsoleTab.jsx",
  "src/pages/settings/BusinessProfileTab.jsx",
  "src/pages/settings/DataBackupTab.jsx",
  "src/pages/settings/SettingsSidebar.jsx",
  "src/pages/settings/ThemeStudioTab.jsx",
  "src/pages/SettingsStudioV2.jsx",
  "src/pages/SetupBilling.jsx",
  "src/services/activityEngine.js",
  "src/services/automationEngine.js",
  "src/services/migrationEngine.js",
  "src/services/pdfEngine.js",
  "src/services/reportEngine.js",
  "src/services/roleEngine.js",
  "src/services/screenshotAnalysisService.js",
  "src/services/searchEngine.js",
  "src/services/themeEngine.js",
  "src/utils/categoryUtils.js",
  "src/utils/featureFlags.js",
  "src/utils/invoiceMath.js"
];

orphanedFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log('Deleted:', file);
  }
});
