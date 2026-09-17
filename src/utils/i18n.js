import React, { useState, useEffect, useCallback } from 'react';

/**
 * BillQyro i18n engine
 * - Full English / বাংলা dictionaries (Hindi kept for legacy keys)
 * - t(key, fallback) — translates with English-then-fallback safety
 * - setLanguage() persists (dedicated key + settings) and broadcasts
 *   'billqyro:language' so every mounted component re-renders
 * - useI18n() React hook for reactive components
 */

const LANG_KEY = 'billqyro_language';
export const SUPPORTED_LANGUAGES = ['en', 'bn'];

const dictionary = {
  en: {
    // ── legacy keys (kept: PdfDocument / HelpCenter / older surfaces) ──
    dashboard: "Dashboard", invoices: "Invoices", customers: "Customers",
    products: "Products", expenses: "Expenses", settings: "Settings",
    new_bill: "+ New Bill", revenue: "Revenue", collection: "Collection",
    pending: "Pending", total_received: "Total received",
    needs_collection: "Needs collection", active_clients: "Active clients",
    recent_invoices: "Recent Invoices", view_all: "View All",
    top_customers: "Top 5 Customers", best_selling: "Best Selling Items",
    revenue_vs_expenses: "Revenue vs Expenses", upgrade: "Upgrade to Premium",
    view_plans: "View Plans",
    welcome: "Welcome back, here is your business summary.",
    create_invoice: "Create Invoice", bill_to: "Bill To", items: "Items",
    total: "Total", save: "Save", language: "Language",
    english: "English", bengali: "Bengali (বাংলা)", hindi: "Hindi (हिंदी)",

    // ── navigation ──
    'nav.dashboard': "Dashboard", 'nav.home': "Home", 'nav.due': "Due",
    'nav.bills': "Bills", 'nav.invoices': "Invoices", 'nav.more': "More",
    'nav.reports': "Reports", 'nav.register': "Register", 'nav.portals': "Portals",
    'nav.customers': "Customers", 'nav.products': "Products & Services",
    'nav.expenses': "Expenses", 'nav.settings': "Settings",
    'nav.help_center': "Help Center", 'nav.users_roles': "Users & Roles",
    'nav.payments': "Payments", 'nav.collections': "Collections",
    'nav.outsource': "Outsource & Vendors", 'nav.bank': "Bank & Cash",
    'nav.estimates': "Estimates & Quotes", 'nav.orders': "Order Slips",
    'nav.create_invoice': "Create Invoice",

    // ── sidebar sections ──
    'sec.main': "MAIN", 'sec.billing': "BILLING", 'sec.customers': "CUSTOMERS",
    'sec.finance': "FINANCE", 'sec.insights': "INSIGHTS", 'sec.system': "SYSTEM",

    // ── sidebar chrome ──
    'sidebar.smart_billing': "Smart Billing Platform",
    'sidebar.workspace_settings': "Workspace Settings",
    'sidebar.business_settings': "Business Settings",
    'sidebar.my_business': "My Business",
    'sidebar.sign_out': "Sign Out",
    'sidebar.toggle_lang': "Switch language",

    // ── more menu ──
    'more.business_identity': "Business & Identity",
    'more.business_identity_sub': "Core company configuration and multi-workspace",
    'more.business_profile': "Business Profile",
    'more.business_profile_desc': "Company name, logo, phone, address and tax identification",
    'more.workspace_manager': "Workspace Manager",
    'more.workspace_manager_desc': "Create, switch, or manage multiple separate business branches",
    'more.modules_presets': "Modules & Presets",
    'more.modules_presets_desc': "Configure industry presets (Retail, Tailor, Clinic, Tuition, etc.)",
    'more.templates_layouts': "Templates & Layouts",
    'more.templates_layouts_desc': "Custom invoice PDF layouts, typography & Live Link studios",
    'more.products_inventory': "Products & Inventory",
    'more.products_inventory_desc': "Manage item catalog, pricing, SKU codes & stock",
    'more.bills_finance': "Bills & Financial Intelligence",
    'more.bills_finance_sub': "Ledgers, invoicing, and incoming payments",
    'more.invoices_bills': "Invoices & Bills",
    'more.invoices_bills_desc': "View, issue, print, and track all customer bills",
    'more.estimates_quotes': "Estimates & Quotations",
    'more.estimates_quotes_desc': "Create proforma invoices, quotes and proposals",
    'more.reports_analytics': "Reports & Analytics",
    'more.reports_analytics_desc': "Revenue breakdown, collection velocity, tax & margin reports",
    'more.due_ledger': "Customer Due Ledger",
    'more.due_ledger_desc': "Comprehensive customer debit/credit balance ledger",
    'more.bank_cash': "Internal Bank & Cash",
    'more.bank_cash_desc': "Bank accounts, cash registers, and reconciled liquidity",
    'more.expenses': "Business Expenses",
    'more.expenses_desc': "Overhead, operational costs, vendor payouts & receipts",
    'more.collection_center': "Collection Center",
    'more.collection_center_desc': "Collect UPI/QR payments & verify digital payment proofs",
    'more.system_cloud': "System & Cloud Operations",
    'more.system_cloud_sub': "Safety, snapshots, and SaaS subscription",
    'more.backup_restore': "Backup & Restore",
    'more.backup_restore_desc': "Export encrypted database backup & restore offline snapshots",
    'more.storage_sync': "Storage & Sync Health",
    'more.storage_sync_desc': "Verify IndexedDB storage and real-time cloud sync queue",
    'more.subscription': "Subscription & Plan",
    'more.subscription_desc': "Manage BillQyro plan, invoice limits & cloud features",
    'more.support_compliance': "Support & Compliance",
    'more.support_compliance_sub': "Documentation, help desk, and privacy terms",
    'more.help_center': "Help Center",
    'more.help_center_desc': "Interactive guides, shortcuts, and billing tutorials",
    'more.contact_support': "Contact Support",
    'more.contact_support_desc': "Direct developer & customer service support line",
    'more.privacy_legal': "Privacy & Legal",
    'more.privacy_legal_desc': "Privacy Policy, Terms of Service & Refund commitments",
    'more.factory_reset': "Factory Reset Safe Mode",
    'more.factory_reset_desc': "Clears local cached state. Cloud database stays completely safe.",
    'more.factory_reset_btn': "Factory Reset App",
    'more.configure': "Configure", 'more.cloud_active': "Cloud Active",
    'more.main_business': "Main Business", 'more.no_phone': "No phone registered",
    'more.multi_business': "Multi-Business", 'more.intelligence': "Intelligence",
    'more.verification': "Verification",

    // ── settings studio: groups ──
    'studio.group.Command Center': "Command Center",
    'studio.group.Core Workspace': "Core Workspace",
    'studio.group.Advanced Operations': "Advanced Operations",

    // ── settings studio: labels ──
    'studio.label.overview': "Settings Overview",
    'studio.label.business': "Business Profile",
    'studio.label.theme': "Appearance & Theme",
    'studio.label.invoice': "Invoice & Billing",
    'studio.label.features': "Modules & Features",
    'studio.label.backup': "Data & Cloud Backup",
    'studio.label.subscription': "Subscription & Plan",
    'studio.label.portal': "Client Portal & Live Links",
    'studio.label.form': "Custom Form Fields",
    'studio.label.security': "Security & Access",
    'studio.label.roles': "Staff & Roles",
    'studio.label.notification': "Notifications & Alerts",
    'studio.label.localization': "Currency & Regions",
    'studio.label.dashboard': "Dashboard Widgets",
    'studio.label.automation': "Automations",
    'studio.label.database': "Data Collections",

    // ── settings studio: descriptions ──
    'studio.desc.overview': "Command center & workspace summary",
    'studio.desc.business': "Name, phone, logo, tax & address",
    'studio.desc.theme': "Themes, dark mode, accent & layout",
    'studio.desc.invoice': "Prefix, terms, tax, footer & templates",
    'studio.desc.features': "Category-aware module switches",
    'studio.desc.backup': "Export, import & cloud snapshots",
    'studio.desc.subscription': "Usage limits & active tier status",
    'studio.desc.portal': "Public bill link & customer experience",
    'studio.desc.form': "Custom invoice & customer inputs",
    'studio.desc.security': "Workspace isolation & active sessions",
    'studio.desc.roles': "User permissions & role management",
    'studio.desc.notification': "WhatsApp templates & payment reminders",
    'studio.desc.localization': "Regional currency & time formats",
    'studio.desc.dashboard': "Customize KPI card visibility",
    'studio.desc.automation': "Custom workflows & payment triggers",
    'studio.desc.database': "Inspect database tables & metrics",

    // ── settings studio: chrome ──
    'studio.settings_studio': "Settings Studio", 'studio.control_center': "Control Center",
    'studio.search': "Search settings...", 'studio.all': "All", 'studio.core': "Core",
    'studio.advanced': "Advanced", 'studio.tap_to_switch': "Tap to switch section",
    'studio.settings_menu': "Settings Menu",
    'studio.select_section': "Select a studio section to configure",
    'studio.unsaved': "Unsaved Changes", 'studio.synced': "Auto-Synced",
    'studio.discard': "Discard", 'studio.save': "Save", 'studio.saving': "Saving",
    'studio.publish': "Publish Changes", 'studio.publishing': "Publishing...",
    'studio.back': "Back to Dashboard", 'studio.switch_workspace': "Switch Workspace",
    'studio.active_workspace': "Active Workspace", 'studio.cloud_state': "Cloud State",
    'studio.synchronized': "Synchronized", 'studio.storage_guard': "Storage Guard",
    'studio.encrypted': "Encrypted", 'studio.core_config': "Core Business Configuration",
    'studio.studio_essentials': "Immediate Studio Essentials",
    'studio.advanced_config': "Advanced Operations & Security",
    'studio.deep_controls': "Deep Controls & Automation",
    'studio.loading': "Loading Studio Component...",

    // ── localization studio ──
    'loc.title': "Localization Studio",
    'loc.subtitle': "Configure regional formats, currency, and tax terminologies",
    'loc.language_card': "Language",
    'loc.language_desc': "Choose the interface language for the whole app — menus, settings and navigation.",
    'loc.interface_language': "Interface Language"
  },

  bn: {
    // ── legacy keys ──
    dashboard: "ড্যাশবোর্ড", invoices: "বিল সমূহ", customers: "গ্রাহক",
    products: "পণ্য", expenses: "খরচ", settings: "সেটিংস",
    new_bill: "+ নতুন বিল", revenue: "মোট আয়", collection: "আদায়",
    pending: "বাকি", total_received: "মোট গৃহীত",
    needs_collection: "আদায় করতে হবে", active_clients: "সক্রিয় গ্রাহক",
    recent_invoices: "সাম্প্রতিক বিল", view_all: "সব দেখুন",
    top_customers: "শীর্ষ ৫ গ্রাহক", best_selling: "বেস্ট সেলিং পণ্য",
    revenue_vs_expenses: "আয় বনাম খরচ", upgrade: "প্রিমিয়াম কিনুন",
    view_plans: "প্ল্যান দেখুন",
    welcome: "স্বাগতম, আপনার ব্যবসার সারসংক্ষেপ নিচে দেওয়া হলো।",
    create_invoice: "নতুন বিল তৈরি করুন", bill_to: "বিল প্রাপক", items: "আইটেম",
    total: "সর্বমোট", save: "সেভ করুন", language: "ভাষা",
    english: "English", bengali: "বাংলা", hindi: "हिंदी",

    // ── navigation ──
    'nav.dashboard': "ড্যাশবোর্ড", 'nav.home': "হোম", 'nav.due': "বাকি",
    'nav.bills': "বিল", 'nav.invoices': "ইনভয়েস", 'nav.more': "আরও",
    'nav.reports': "রিপোর্ট", 'nav.register': "রেজিস্টার", 'nav.portals': "পোর্টাল",
    'nav.customers': "গ্রাহক", 'nav.products': "প্রোডাক্ট ও সার্ভিস",
    'nav.expenses': "খরচ", 'nav.settings': "সেটিংস",
    'nav.help_center': "হেল্প সেন্টার", 'nav.users_roles': "ইউজার ও রোল",
    'nav.payments': "পেমেন্ট", 'nav.collections': "কালেকশন",
    'nav.outsource': "আউটসোর্স ও ভেন্ডর", 'nav.bank': "ব্যাংক ও ক্যাশ",
    'nav.estimates': "এস্টিমেট ও কোটেশন", 'nav.orders': "অর্ডার স্লিপ",
    'nav.create_invoice': "নতুন বিল তৈরি",

    // ── sidebar sections ──
    'sec.main': "মূল", 'sec.billing': "বিলিং", 'sec.customers': "গ্রাহক",
    'sec.finance': "ফাইন্যান্স", 'sec.insights': "ইনসাইট", 'sec.system': "সিস্টেম",

    // ── sidebar chrome ──
    'sidebar.smart_billing': "স্মার্ট বিলিং প্ল্যাটফর্ম",
    'sidebar.workspace_settings': "ওয়ার্কস্পেস সেটিংস",
    'sidebar.business_settings': "বিজনেস সেটিংস",
    'sidebar.my_business': "আমার ব্যবসা",
    'sidebar.sign_out': "সাইন আউট",
    'sidebar.toggle_lang': "ভাষা বদলান",

    // ── more menu ──
    'more.business_identity': "ব্যবসা ও পরিচয়",
    'more.business_identity_sub': "কোম্পানির মূল কনফিগারেশন ও মাল্টি-ওয়ার্কস্পেস",
    'more.business_profile': "বিজনেস প্রোফাইল",
    'more.business_profile_desc': "কোম্পানির নাম, লোগো, ফোন, ঠিকানা ও ট্যাক্স আইডি",
    'more.workspace_manager': "ওয়ার্কস্পেস ম্যানেজার",
    'more.workspace_manager_desc': "একাধিক আলাদা ব্যবসা-ব্রাঞ্চ তৈরি, সুইচ বা ম্যানেজ করুন",
    'more.modules_presets': "মডিউল ও প্রিসেট",
    'more.modules_presets_desc': "ইন্ডাস্ট্রি-প্রিসেট কনফিগার করুন (রিটেইল, টেইলার, ক্লিনিক, টিউশন ইত্যাদি)",
    'more.templates_layouts': "টেমপ্লেট ও লেআউট",
    'more.templates_layouts_desc': "কাস্টম ইনভয়েস PDF লেআউট, টাইপোগ্রাফি ও লাইভ লিংক স্টুডিও",
    'more.products_inventory': "প্রোডাক্ট ও ইনভেন্টরি",
    'more.products_inventory_desc': "আইটেম ক্যাটালগ, দাম, SKU কোড ও স্টক ম্যানেজ করুন",
    'more.bills_finance': "বিল ও ফাইন্যান্সিয়াল ইন্টেলিজেন্স",
    'more.bills_finance_sub': "লেজার, ইনভয়েসিং ও আসা পেমেন্ট",
    'more.invoices_bills': "ইনভয়েস ও বিল",
    'more.invoices_bills_desc': "সব কাস্টমার-বিল দেখুন, ইস্যু, প্রিন্ট ও ট্র্যাক করুন",
    'more.estimates_quotes': "এস্টিমেট ও কোটেশন",
    'more.estimates_quotes_desc': "প্রোফর্মা ইনভয়েস, কোট ও প্রপোজাল তৈরি করুন",
    'more.reports_analytics': "রিপোর্ট ও অ্যানালিটিক্স",
    'more.reports_analytics_desc': "আয়ের বিশ্লেষণ, কালেকশন-গতি, ট্যাক্স ও মার্জিন রিপোর্ট",
    'more.due_ledger': "কাস্টমার বাকির লেজার",
    'more.due_ledger_desc': "কাস্টমারের পূর্ণাঙ্গ ডেবিট/ক্রেডিট ব্যালেন্স লেজার",
    'more.bank_cash': "ইন্টারনাল ব্যাংক ও ক্যাশ",
    'more.bank_cash_desc': "ব্যাংক অ্যাকাউন্ট, ক্যাশ রেজিস্টার ও রিকনসাইল্ড লিকুইডিটি",
    'more.expenses': "ব্যবসার খরচ",
    'more.expenses_desc': "ওভারহেড, অপারেশনাল খরচ, ভেন্ডর-পেমেন্ট ও রসিদ",
    'more.collection_center': "কালেকশন সেন্টার",
    'more.collection_center_desc': "UPI/QR পেমেন্ট আদায় ও ডিজিটাল প্রমাণ যাচাই",
    'more.system_cloud': "সিস্টেম ও ক্লাউড অপারেশন",
    'more.system_cloud_sub': "নিরাপত্তা, স্ন্যাপশট ও SaaS সাবস্ক্রিপশন",
    'more.backup_restore': "ব্যাকআপ ও রিস্টোর",
    'more.backup_restore_desc': "এনক্রিপ্টেড ডেটাবেস-ব্যাকআপ এক্সপোর্ট ও অফলাইন স্ন্যাপশট রিস্টোর",
    'more.storage_sync': "স্টোরেজ ও সিঙ্ক হেলথ",
    'more.storage_sync_desc': "IndexedDB স্টোরেজ ও রিয়েল-টাইম ক্লাউড সিঙ্ক-কিউ যাচাই",
    'more.subscription': "সাবস্ক্রিপশন ও প্ল্যান",
    'more.subscription_desc': "BillQyro প্ল্যান, ইনভয়েস-লিমিট ও ক্লাউড ফিচার ম্যানেজ করুন",
    'more.support_compliance': "সাপোর্ট ও কম্প্লায়েন্স",
    'more.support_compliance_sub': "ডকুমেন্টেশন, হেল্প ডেস্ক ও প্রাইভেসি শর্ত",
    'more.help_center': "হেল্প সেন্টার",
    'more.help_center_desc': "ইন্টারঅ্যাক্টিভ গাইড, শর্টকাট ও বিলিং টিউটোরিয়াল",
    'more.contact_support': "সাপোর্টে যোগাযোগ",
    'more.contact_support_desc': "সরাসরি ডেভেলপার ও কাস্টমার সার্ভিস লাইন",
    'more.privacy_legal': "প্রাইভেসি ও লিগ্যাল",
    'more.privacy_legal_desc': "প্রাইভেসি পলিসি, সার্ভিসের শর্ত ও রিফান্ড প্রতিশ্রুতি",
    'more.factory_reset': "ফ্যাক্টরি রিসেট সেফ মোড",
    'more.factory_reset_desc': "লোকাল ক্যাশ মুছে যায়। ক্লাউড ডেটাবেস সম্পূর্ণ নিরাপদ থাকে।",
    'more.factory_reset_btn': "অ্যাপ রিসেট করুন",
    'more.configure': "কনফিগার", 'more.cloud_active': "ক্লাউড সক্রিয়",
    'more.main_business': "মূল ব্যবসা", 'more.no_phone': "ফোন নেই",
    'more.multi_business': "মাল্টি-বিজনেস", 'more.intelligence': "ইন্টেলিজেন্স",
    'more.verification': "যাচাই",

    // ── settings studio: groups ──
    'studio.group.Command Center': "কমান্ড সেন্টার",
    'studio.group.Core Workspace': "মূল ওয়ার্কস্পেস",
    'studio.group.Advanced Operations': "অ্যাডভান্সড অপারেশন",

    // ── settings studio: labels ──
    'studio.label.overview': "সেটিংস ওভারভিউ",
    'studio.label.business': "বিজনেস প্রোফাইল",
    'studio.label.theme': "চেহারা ও থিম",
    'studio.label.invoice': "ইনভয়েস ও বিলিং",
    'studio.label.features': "মডিউল ও ফিচার",
    'studio.label.backup': "ডেটা ও ক্লাউড ব্যাকআপ",
    'studio.label.subscription': "সাবস্ক্রিপশন ও প্ল্যান",
    'studio.label.portal': "ক্লায়েন্ট পোর্টাল ও লাইভ লিংক",
    'studio.label.form': "কাস্টম ফর্ম ফিল্ড",
    'studio.label.security': "সিকিউরিটি ও অ্যাক্সেস",
    'studio.label.roles': "স্টাফ ও রোল",
    'studio.label.notification': "নোটিফিকেশন ও অ্যালার্ট",
    'studio.label.localization': "কারেন্সি ও রিজিওন",
    'studio.label.dashboard': "ড্যাশবোর্ড উইজেট",
    'studio.label.automation': "অটোমেশন",
    'studio.label.database': "ডেটা কালেকশন",

    // ── settings studio: descriptions ──
    'studio.desc.overview': "কমান্ড সেন্টার ও ওয়ার্কস্পেস সারসংক্ষেপ",
    'studio.desc.business': "নাম, ফোন, লোগো, ট্যাক্স ও ঠিকানা",
    'studio.desc.theme': "থিম, ডার্ক মোড, অ্যাকসেন্ট ও লেআউট",
    'studio.desc.invoice': "প্রিফিক্স, শর্ত, ট্যাক্স, ফুটার ও টেমপ্লেট",
    'studio.desc.features': "ক্যাটাগরি-অনুযায়ী মডিউল সুইচ",
    'studio.desc.backup': "এক্সপোর্ট, ইমপোর্ট ও ক্লাউড স্ন্যাপশট",
    'studio.desc.subscription': "ব্যবহারের লিমিট ও সক্রিয় টিয়ার",
    'studio.desc.portal': "পাবলিক বিল-লিংক ও কাস্টমার অভিজ্ঞতা",
    'studio.desc.form': "কাস্টম ইনভয়েস ও কাস্টমার ইনপুট",
    'studio.desc.security': "ওয়ার্কস্পেস আইসোলেশন ও সক্রিয় সেশন",
    'studio.desc.roles': "ইউজার-পারমিশন ও রোল ম্যানেজমেন্ট",
    'studio.desc.notification': "WhatsApp টেমপ্লেট ও পেমেন্ট রিমাইন্ডার",
    'studio.desc.localization': "রিজিওনাল কারেন্সি ও সময়ের ফরম্যাট",
    'studio.desc.dashboard': "KPI-কার্ডের ভিজিবিলিটি কাস্টমাইজ",
    'studio.desc.automation': "কাস্টম ওয়ার্কফ্লো ও পেমেন্ট ট্রিগার",
    'studio.desc.database': "ডেটাবেস টেবিল ও মেট্রিক্স দেখুন",

    // ── settings studio: chrome ──
    'studio.settings_studio': "সেটিংস স্টুডিও", 'studio.control_center': "কন্ট্রোল সেন্টার",
    'studio.search': "সেটিংস খুঁজুন...", 'studio.all': "সব", 'studio.core': "মূল",
    'studio.advanced': "অ্যাডভান্সড", 'studio.tap_to_switch': "সেকশন বদলাতে ট্যাপ করুন",
    'studio.settings_menu': "সেটিংস মেনু",
    'studio.select_section': "কনফিগার করতে স্টুডিও-সেকশন বেছে নিন",
    'studio.unsaved': "অসেভ পরিবর্তন", 'studio.synced': "অটো-সিঙ্কড",
    'studio.discard': "বাতিল", 'studio.save': "সেভ", 'studio.saving': "সেভ হচ্ছে",
    'studio.publish': "পরিবর্তন পাবলিশ করুন", 'studio.publishing': "পাবলিশ হচ্ছে...",
    'studio.back': "ড্যাশবোর্ডে ফিরুন", 'studio.switch_workspace': "ওয়ার্কস্পেস বদলান",
    'studio.active_workspace': "সক্রিয় ওয়ার্কস্পেস", 'studio.cloud_state': "ক্লাউড স্টেট",
    'studio.synchronized': "সিঙ্ক্রোনাইজড", 'studio.storage_guard': "স্টোরেজ গার্ড",
    'studio.encrypted': "এনক্রিপ্টেড", 'studio.core_config': "মূল বিজনেস কনফিগারেশন",
    'studio.studio_essentials': "দরকারি স্টুডিও-সামগ্রী",
    'studio.advanced_config': "অ্যাডভান্সড অপারেশন ও সিকিউরিটি",
    'studio.deep_controls': "ডিপ কন্ট্রোল ও অটোমেশন",
    'studio.loading': "স্টুডিও লোড হচ্ছে...",

    // ── localization studio ──
    'loc.title': "লোকালাইজেশন স্টুডিও",
    'loc.subtitle': "রিজিওনাল ফরম্যাট, কারেন্সি ও ট্যাক্স-টার্ম কনফিগার করুন",
    'loc.language_card': "ভাষা",
    'loc.language_desc': "পুরো অ্যাপের ভাষা বেছে নিন — মেনু, সেটিংস ও নেভিগেশন সব বদলে যাবে।",
    'loc.interface_language': "ইন্টারফেসের ভাষা"
  },

  hi: {
    // Legacy subset (kept for compatibility; new keys fall back to English)
    dashboard: "डैशबोर्ड", invoices: "बिल", customers: "ग्राहक",
    products: "उत्पाद", expenses: "खर्च", settings: "सेटिंग्स",
    new_bill: "+ नया बिल", revenue: "कुल आय", collection: "प्राप्ति",
    pending: "बकाया", total_received: "कुल प्राप्त",
    needs_collection: "वसूली बाकी", active_clients: "सक्रिय ग्राहक",
    recent_invoices: "हाल के बिल", view_all: "सभी देखें",
    top_customers: "शीर्ष 5 ग्राहक", best_selling: "सबसे ज्यादा बिकने वाले उत्पाद",
    revenue_vs_expenses: "आय बनाम खर्च", upgrade: "प्रीमियम अपग्रेड करें",
    view_plans: "प्लान देखें",
    welcome: "वापसी पर स्वागत है, यहाँ आपके व्यवसाय का सारांश है।",
    create_invoice: "नया बिल बनाएं", bill_to: "बिल प्राप्तकर्ता", items: "सामान",
    total: "कुल", save: "सहेजें", language: "भाषा",
    english: "English", bengali: "বাংলা", hindi: "हिंदी"
  }
};

export const getLanguage = () => {
  try {
    const direct = localStorage.getItem(LANG_KEY);
    if (direct && SUPPORTED_LANGUAGES.includes(direct)) return direct;
    const settings = JSON.parse(localStorage.getItem('billqyro_settings') || '{}');
    const s = settings?.language;
    if (s && SUPPORTED_LANGUAGES.includes(s)) return s;
  } catch { /* ignore */ }
  return 'en';
};

export const setLanguage = (lang) => {
  if (!SUPPORTED_LANGUAGES.includes(lang)) return;
  try {
    localStorage.setItem(LANG_KEY, lang);
    const settings = JSON.parse(localStorage.getItem('billqyro_settings') || '{}');
    settings.language = lang;
    localStorage.setItem('billqyro_settings', JSON.stringify(settings));
  } catch { /* ignore */ }
  try {
    window.dispatchEvent(new CustomEvent('billqyro:language', { detail: { lang } }));
  } catch { /* ignore (SSR/tests) */ }
};

export const t = (key, fallback) => {
  const lang = getLanguage();
  return dictionary[lang]?.[key] ?? dictionary.en[key] ?? fallback ?? key;
};

/**
 * Reactive i18n hook — re-renders the component whenever the language
 * changes (own toggle, another tab, or the Localization Studio selector).
 */
export const useI18n = () => {
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('billqyro:language', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('billqyro:language', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const translate = useCallback((key, fallback) => {
    return dictionary[lang]?.[key] ?? dictionary.en[key] ?? fallback ?? key;
  }, [lang]);

  const changeLanguage = useCallback((next) => {
    setLanguage(next);
    setLang(getLanguage());
  }, []);

  return { t: translate, lang, setLanguage: changeLanguage };
};

export default { t, getLanguage, setLanguage, useI18n, SUPPORTED_LANGUAGES };
