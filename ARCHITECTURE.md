# BillQyro Enterprise V8 - Architecture & Context Map

এই ডকুমেন্টটি BillQyro প্রজেক্টের সম্পূর্ণ আর্কিটেকচার, ডেটা ফ্লো এবং ফাইল স্ট্রাকচারের একটি মাস্টার রেফারেন্স। ভবিষ্যতে যেকোনো বড় পরিবর্তনের আগে এই ডকুমেন্টটি পড়া বাধ্যতামূলক, যাতে পুরো প্রজেক্টের কন্টেক্সট মাথায় থাকে এবং কোনো ফাইল বা ফিচার ভেঙে না যায়।

---

## ১. High-Level Overview
**BillQyro** হলো একটি Premium, Offline-first, Multi-tenant Invoicing এবং Business Management Platform। 

> [!IMPORTANT]
> **Complete Architecture Documentation Suite:**
> The deep 0-100 architectural maps have been broken down into specialized documents to maintain readability. You **must** review the following documents located in the `docs/architecture/` folder depending on the task:
> - **[Feature Inventory Map](file:///d:/Khair_Murafiq_Empire/BillQyro/docs/architecture/FEATURE_MAP.md):** Complete list of features, dependencies, and risk levels.
> - **[Domain Map](file:///d:/Khair_Murafiq_Empire/BillQyro/docs/architecture/DOMAIN_MAP.md):** The core business contexts, their assigned engines, and UI boundaries.
> - **[Data Model Map](file:///d:/Khair_Murafiq_Empire/BillQyro/docs/architecture/DATA_MODEL.md):** The Firestore and IndexedDB schema and derivations.

**Tech Stack:**
- **Frontend Framework:** React 18 (Vite-এর মাধ্যমে বিল্ড করা)
- **Styling:** Tailwind CSS (Custom Theme Engine ও Premium CSS classes সহ)
- **Backend & Database:** Firebase (Authentication, Firestore, Storage)
- **Offline Storage:** IndexedDB (localForage এর মাধ্যমে) ও LocalStorage
- **State Management:** React Context API (e.g., ThemeContext, InvoiceContext) ও Custom Hooks
- **Architecture Pattern:** Offline-First Sync Pattern (প্রথমে লোকালি সেভ হয়, পরে ব্যাকগ্রাউন্ডে ফায়ারবেসে সিঙ্ক হয়)।

---

## ২. Folder Structure Map
পুরো `src/` ডিরেক্টরির স্ট্রাকচার নিচে দেওয়া হলো:

```text
src/
├── assets/         # ছবি, আইকন এবং স্ট্যাটিক ফাইল
├── components/     # Reusable UI components (Sidebar, InvoiceRow, Buttons, Modals)
├── config/         # কনফিগারেশন ফাইল (businessPresets, theme configs)
├── contexts/       # React Contexts (ThemeContext.jsx, InvoiceContext.jsx, OnboardingContext.jsx)
├── hooks/          # Custom React Hooks (useSettingsHistory, useFeatureControl, useDebounce)
├── pages/          # Main application pages (Dashboard, Invoices, Settings, Studios)
│   ├── admin/      # Platform Admin Panel pages
│   ├── business/   # Business-specific pages (Patients, Students, Clients)
│   ├── cybercafe/  # Cyber Cafe mode specific pages
│   ├── settings/   # Settings & Configuration pages
│   └── studios/    # Premium Customization Studios (ThemeStudio, FeatureControlStudio, etc.)
├── services/       # Core Business Logic & Firebase integration (Engine files)
│   ├── communication/ # WhatsApp, Email integration 
│   └── ...         # dbEngine.js, authEngine.js, pdfEngine.js ইত্যাদি
├── state/          # Global state management utilities
├── utils/          # Helper functions (i18n, feedback, invoiceUtils)
├── App.jsx         # Main Application Router ও Layout Container
├── main.jsx        # React Application Entry Point
├── index.css       # Base Tailwind & Custom Utility classes
├── premium-design.css # Premium UI/UX styles ও animations
└── themes.css      # Dynamic CSS Variables (Theme Engine)
```

---

## ৩. Core Data Flow

### Authentication Flow (Firebase)
1. ইউজার `authEngine.js`-এর মাধ্যমে ইমেইল/পাসওয়ার্ড বা গুগল দিয়ে লগইন করে।
2. Firebase Auth টোকেন জেনারেট করে।
3. `App.jsx`-এ `useEffect` লিসেনার ইউজার স্টেট ধরে এবং `dbEngine` কল করে ইউজারের ডাটা ফেচ করে।

### Invoice Creation Flow (Offline-First)
1. **State:** ইউজার `CreateInvoice.jsx`-এ ডেটা ইনপুট দেয়, যা React State-এ থাকে।
2. **Local Save:** Save বাটনে ক্লিক করলে `invoiceEngine.js` কল হয়। এটি প্রথমে ডেটাটি IndexedDB-তে (via `localDb.js`) সেভ করে।
3. **Queue:** এরপর এটি `syncQueue`-তে একটি টাস্ক যোগ করে।
4. **Cloud Sync:** ইন্টারনেট থাকলে `dbEngine.js` ব্যাকগ্রাউন্ডে `syncQueue` থেকে ডেটা নিয়ে Firestore-এ পুশ করে। সফল হলে Queue থেকে মুছে ফেলে।

### Offline Sync Mechanism
- `dbEngine.js` এবং `offlineEngine.js` মিলে সিঙ্ক ম্যানেজ করে।
- ডেটা প্রথমে `localForage` (IndexedDB) এ সেভ হয়।
- `window.addEventListener('online')` ট্রিগার হলে পেন্ডিং `syncQueue` প্রসেস করে Firestore-এ পাঠায়।

---

## ৪. Key Files এবং তাদের দায়িত্ব

- **`dbEngine.js`**: প্রজেক্টের সবচেয়ে বড় ফাইল (প্রায় ৩০০০+ লাইন)। এটি Firebase Firestore-এর সাথে যোগাযোগ, Offline Sync, Data Migration, এবং CRUD অপারেশন হ্যান্ডেল করে। (নির্ভরশীল: `localDb.js`, Firebase SDK)।
- **`ThemeContext.jsx` & `themeEngine.js`**: ইউজারের সিলেক্ট করা থিম (কালার, ফন্ট, বর্ডার রেডিয়াস) CSS Variable হিসেবে DOM-এ ইনজেক্ট করে।
- **`PdfDocument.jsx` & `pdfEngine.js`**: ইনভয়েস ডেটা থেকে react-pdf ব্যবহার করে প্রিন্ট-রেডি PDF জেনারেট করে।
- **`invoiceShareService.js`**: ইনভয়েস PDF জেনারেট করে WhatsApp বা ইমেইলে সরাসরি শেয়ার করার লজিক।
- **`PublicInvoice.jsx`**: কাস্টমারদের জন্য Live Link ভিউ। এখানে লগইন ছাড়াই কাস্টমার ইনভয়েস দেখতে এবং Payment Proof আপলোড করতে পারে।
- **`firebaseConfig.js`**: Firebase App initialization এবং SDK export।
- **`App.jsx`**: পুরো অ্যাপের রাউটিং, গ্লোবাল স্টেট প্রোভাইডার, এবং লেআউট (Sidebar, Topbar) রেন্ডার করে।

---

## ৫. Firestore Data Model

**মূল Collection সমূহ (User ID এর আন্ডারে Sub-collection হিসেবে থাকে):**
- **`usersList` (Global):** ইউজারের প্রোফাইল, প্ল্যান স্ট্যাটাস (free/premium), সাবস্ক্রিপশন ম্যাথ মেয়াদ।
- **`settings` (User):** ইউজারের বিজনেস নাম, লোগো, থিম, ট্যাক্স রেট, এক্টিভ মডিউলস।
- **`invoices` (User -> items):** 
  - Schema: `id`, `invoiceNumber`, `customerId`, `items[]`, `total`, `status` (paid/unpaid), `createdAt`, `publicToken`।
- **`customers` (User -> items):** কাস্টমার ডিটেইলস, ব্যালেন্স।
- **`products` (User -> items):** ইনভেন্টরি, প্রাইজ, স্টক।
- **`staff` (User -> items):** স্টাফ ডিটেইলস ও লেজার।
- **`publicInvoices` (Global):** পাবলিক পেমেন্ট লিংকের জন্য। `publicToken` দিয়ে এক্সেস হয়।
- **`auditLogs` (User -> items):** সিকিউরিটি ও এক্টিভিটি ট্র্যাকিং।
- **`premiumRequests` (Global):** এডমিন প্যানেলে আপগ্রেড রিকোয়েস্ট।

**Relationship:** `invoices` কালেকশনের ডাটা `customers` (via `customerId`) এবং `products` (via `productId`) এর সাথে সম্পর্কিত।

---

## ৬. Feature-to-File Mapping

| ফিচার | মূল ফাইল(গুলো) | নির্ভরশীল ফাইল / মডিউল |
|---|---|---|
| **Invoice তৈরি ও ম্যানেজমেন্ট** | `CreateInvoice.jsx`, `Invoices.jsx`, `InvoiceRow.jsx` | `invoiceEngine.js`, `dbEngine.js` |
| **PDF Template System** | `PdfDocument.jsx`, `PdfTemplateStudio.jsx`, `InvoicePreview.jsx` | `pdfEngine.js`, `react-pdf` |
| **Theme & UI Engine** | `ThemeStudio.jsx`, `ThemeContext.jsx` | `themeEngine.js`, `themes.css` |
| **WhatsApp/Email Share** | `invoiceShareService.js`, `invoiceShareService2.js` | `pdfEngine.js`, Firebase Storage |
| **Payment Proof Upload** | `PublicInvoice.jsx`, `PaymentDueScreen.jsx` | `dbEngine.js`, `firebaseConfig.js` (Storage Rules) |
| **Offline Sync Logic** | `dbEngine.js`, `offlineEngine.js` | `localDb.js` (localForage) |
| **Feature Toggles (Modules)**| `FeatureControlStudio.jsx`, `useFeatureControl.js` | `featureControlEngine.js`, `featureRegistry.js` |
| **Admin Panel** | `AdminPanel.jsx`, `AdminUnlock.jsx` | `adminEngine.js` |
| **Subscription & Plans** | `SubscriptionStudio.jsx`, `PaywallModal` | `subscriptionEngine.js` |
| **Sidebar Routing** | `Sidebar.jsx`, `App.jsx` | `authEngine.js`, `useFeatureControl` |

---

## ৭. Known Constraints ও Fragile Areas

1. **`dbEngine.js` এর আকার:** ফাইলটি বিশাল হওয়ার কারণে এখানে কোনো পরিবর্তন করলে পুরো সিঙ্ক সিস্টেমে প্রভাব পড়তে পারে। নতুন ফাংশন যোগ করার সময় বিদ্যমান offline-sync লজিক যেন ব্রেক না করে সেদিকে সতর্ক থাকতে হবে।
2. **Workspace ID Mismatch:** সেটিংস সেভ করার সময় `workspaceId` (যেমন 'default') এবং `userId` (যেমন 'khairul123') এর মধ্যে কনফিউশন তৈরি হয়। *Rule:* গ্লোবাল সেটিংস `userId` তে এবং স্পেসিফিক মডিউল ডাটা `activeWorkspaceId` তে সেভ করতে হবে।
3. **Sidebar Rendering:** `Sidebar.jsx` এ মেনু আইটেমগুলো `featureRegistry` এবং `useFeatureControl` হুক দিয়ে ডায়নামিকালি রেন্ডার হয়। নতুন পেজ বানালে `App.jsx`-এ রাউট এবং `Sidebar.jsx`-এ আইটেম ঠিকমতো যোগ করতে হবে (যেমন Staff Ledger এর ক্ষেত্রে হয়েছিল)।
4. **Duplicate Sync Logic:** কিছু কিছু জায়গায় `dbEngine.js` এবং নির্দিষ্ট ইঞ্জিনের (যেমন `invoiceEngine.js`) মধ্যে সিঙ্ক লজিক ওভারল্যাপ করে। ডেটা সেভ করার সময় যেকোনো একটি পাথ ব্যবহার করা উচিত।

---

## ৮. Conventions এবং Patterns

- **Engine Pattern:** যেকোনো বিজনেস লজিক সরাসরি Component-এ না লিখে `services/` ফোল্ডারে `[name]Engine.js` (যেমন `staffEngine.js`) ফাইলে লিখতে হবে।
- **Local First:** ডেটা রিড/রাইট সবসময় প্রথমে IndexedDB/LocalState থেকে হবে, তারপর ব্যাকগ্রাউন্ডে Firebase-এ পুশ হবে। সরাসরি Firestore থেকে রিড করে UI ব্লক করা যাবে না।
- **Naming Convention:** 
  - Components: `PascalCase.jsx`
  - Services/Hooks: `camelCase.js`
  - CSS Variables: `--theme-[name]` (যেমন `--theme-primary`)
- **Modifying Features:** নতুন ফিচার যোগ করলে তা অবশ্যই `featureRegistry.js`-এ রেজিস্টার করতে হবে এবং `FeatureControlStudio` এর মাধ্যমে টগল করার ব্যবস্থা রাখতে হবে।

---
*Note: This ARCHITECTURE.md file must be reviewed before initiating any major refactor, feature addition, or deep debugging session.*
