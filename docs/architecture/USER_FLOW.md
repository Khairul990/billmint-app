# BillQyro — User Journey Map
> VERIFIED from: App.jsx routing, OnboardingWizard.jsx, src/config/businessPresets.js

---

## Primary User Journey — New User

```
Landing Page (Landing.jsx)
         │
         ▼ [Sign Up / Login]
Login Page (Login.jsx)
         │ Firebase Auth → onAuthStateChanged
         ▼
App.jsx: isNewUser check → onboardingRequired?
         │
    YES  │  NO
         │   └──────────────────────────────►  Dashboard
         ▼
OnboardingWizard.jsx
         │
         ├── Step 1: WelcomeBoard.jsx
         ├── Step 2: BusinessDetailsForm.jsx (name, phone, address)
         ├── Step 3: CountrySelection.jsx (locale, currency)
         ├── Step 4: Business Category (from BUSINESS_PRESETS)
         │           └── Modules shown/hidden based on preset
         ├── Step 5: TemplateSelection.jsx (invoice template)
         ├── Step 6: PaymentSetup.jsx (payment methods)
         └── Step 7: InteractiveTutorial.jsx
                  │
                  ▼ [Complete Onboarding]
             Dashboard.jsx
```

---

## Core Invoice Journey

```
Dashboard.jsx
     │ [+ New Invoice] or QuickBillModal
     ▼
CreateInvoice.jsx
     │
     ├── Select Customer (customerEngine.getCustomers)
     ├── Add Products/Items (productEngine.getProducts)
     ├── Apply Discount/Tax (invoiceMath.js)
     ├── Preview (InvoicePreview.jsx)
     │
     ▼ [Save Invoice]
invoiceEngine.saveInvoice()
     │
     ▼
dbEngine.saveInvoice()
     │
     ├── IndexedDB: invoices store
     └── SyncQueue → Firestore (if online)
               │
               ▼
        Invoices.jsx (list view)
               │
               ├── [Download PDF] → pdfUtils.downloadInvoicePDF()
               ├── [Share] → invoiceShareService2.js → WhatsApp/Email
               ├── [Generate Live Link] → dbEngine.ensurePublicToken()
               │                    └── publicInvoice/{token} in Firestore
               └── [Mark Paid] → invoiceEngine.markAsPaid()
                              → bankEngine.autoPostPayment()
```

---

## Customer Portal Journey (Public)

```
Business sends share link:
/portal/{token}  OR  QR code → same URL
         │
         ▼
PublicInvoice.jsx (NO AUTH REQUIRED)
         │ reads from Firestore publicInvoices/{token}
         │
         ├── View invoice details
         ├── [Pay] → payment link / QR code
         └── [Upload Payment Proof] → Firebase Storage
                         │
                         ▼
               Firestore publicInvoices/{token}.paymentProofs[]
                         │
                         ▼ (background sweep in invoiceEngine.syncPublicInvoices)
               Local IndexedDB updated
                         │
                         ▼
               Admin: PaymentProofCenter.jsx reviews proof
```

---

## Settings Journey

```
Sidebar → Settings
         │
         ▼
SettingsStudioV2.jsx (94 KB — main settings hub)
         │
         ├── StudioLayout.jsx (navigation shell)
         │
         ├── Business Studio (BusinessStudio.jsx)
         ├── Theme Studio (ThemeStudio.jsx)
         ├── Invoice Studio (InvoiceStudio.jsx)
         ├── PDF Studio → PdfTemplateStudio.jsx
         ├── Feature Control (FeatureControlStudio.jsx)
         ├── Portal Studio (PortalStudio.jsx)
         ├── Automation Studio (AutomationStudio.jsx)
         ├── Notification Studio (NotificationStudio.jsx)
         ├── Role Studio (RoleStudio.jsx)
         ├── Security Studio (SecurityStudio.jsx)
         ├── Backup Studio (BackupStudio.jsx)
         ├── Localization Studio (LocalizationStudio.jsx)
         ├── Database Studio (DatabaseStudio.jsx)
         └── Subscription Studio (SubscriptionStudio.jsx)
                  │
                  ▼ [All settings saved via]
            settingsEngine.saveSettings()
                  │
                  ▼
            Firestore: settings/{userId/workspaceId}
                  │
                  │ dispatches:
                  └── window.dispatchEvent('billqyro:settings-updated')
                              │
                              ▼
                        ThemeContext listens → applyTheme()
```

---

## Admin Journey (Platform Owner)

```
Admin PIN Login (AdminPINLogin.jsx)
         │ Validates against adminEngine.js
         ▼
AdminLayout.jsx
         │
         ├── AdminDashboard.jsx
         ├── UserManager.jsx
         ├── SubscriptionStudio.jsx (admin version)
         ├── PremiumControlCenter.jsx
         ├── PaymentProofCenter.jsx
         ├── AnnouncementManager.jsx
         ├── ChangelogManager.jsx
         ├── SecurityCenter.jsx
         ├── AnalyticsCenter.jsx
         ├── SupportCenter.jsx
         ├── AutomationCenter.jsx
         ├── AppHealthCenter.jsx
         ├── FeatureSwitchCenter.jsx
         ├── WorkspaceAdmin.jsx
         ├── BackupCenter.jsx
         ├── DatabaseCenter.jsx
         └── OwnerTestLab.jsx (SandboxAdmin)
```

---

## Student Portal Journey (Education Mode)

```
Teacher shares link → StudentPortal.jsx
         │ Auth: student email or student ID
         ▼
invoiceEngine.getStudentInvoices(studentId, email)
         │
         └── Shows fee receipts, payment history
```
