const dictionary = {
  en: {
    dashboard: "Dashboard",
    invoices: "Invoices",
    customers: "Customers",
    products: "Products",
    expenses: "Expenses",
    settings: "Settings",
    new_bill: "+ New Bill",
    revenue: "Revenue",
    collection: "Collection",
    pending: "Pending",
    total_received: "Total received",
    needs_collection: "Needs collection",
    active_clients: "Active clients",
    recent_invoices: "Recent Invoices",
    view_all: "View All",
    top_customers: "Top 5 Customers",
    best_selling: "Best Selling Items",
    revenue_vs_expenses: "Revenue vs Expenses",
    upgrade: "Upgrade to Premium",
    view_plans: "View Plans",
    welcome: "Welcome back, here is your business summary.",
    create_invoice: "Create Invoice",
    bill_to: "Bill To",
    items: "Items",
    total: "Total",
    save: "Save",
    language: "Language",
    english: "English",
    bengali: "Bengali (বাংলা)",
    hindi: "Hindi (हिंदी)"
  },
  bn: {
    dashboard: "ড্যাশবোর্ড",
    invoices: "বিল সমূহ",
    customers: "গ্রাহক",
    products: "পণ্য",
    expenses: "খরচ",
    settings: "সেটিংস",
    new_bill: "+ নতুন বিল",
    revenue: "মোট আয়",
    collection: "আদায়",
    pending: "বাকি",
    total_received: "মোট গৃহীত",
    needs_collection: "আদায় করতে হবে",
    active_clients: "সক্রিয় গ্রাহক",
    recent_invoices: "সাম্প্রতিক বিল",
    view_all: "সব দেখুন",
    top_customers: "শীর্ষ ৫ গ্রাহক",
    best_selling: "বেস্ট সেলিং পণ্য",
    revenue_vs_expenses: "আয় বনাম খরচ",
    upgrade: "প্রিমিয়াম কিনুন",
    view_plans: "প্ল্যান দেখুন",
    welcome: "স্বাগতম, আপনার ব্যবসার সারসংক্ষেপ নিচে দেওয়া হলো।",
    create_invoice: "নতুন বিল তৈরি করুন",
    bill_to: "বিল প্রাপক",
    items: "আইটেম",
    total: "সর্বমোট",
    save: "সেভ করুন",
    language: "ভাষা",
    english: "English",
    bengali: "বাংলা",
    hindi: "हिंदी"
  },
  hi: {
    dashboard: "डैशबोर्ड",
    invoices: "बिल",
    customers: "ग्राहक",
    products: "उत्पाद",
    expenses: "खर्च",
    settings: "सेटिंग्स",
    new_bill: "+ नया बिल",
    revenue: "कुल आय",
    collection: "प्राप्ति",
    pending: "बकाया",
    total_received: "कुल प्राप्त",
    needs_collection: "वसूली बाकी",
    active_clients: "सक्रिय ग्राहक",
    recent_invoices: "हाल के बिल",
    view_all: "सभी देखें",
    top_customers: "शीर्ष 5 ग्राहक",
    best_selling: "सबसे ज्यादा बिकने वाले उत्पाद",
    revenue_vs_expenses: "आय बनाम खर्च",
    upgrade: "प्रीमियम अपग्रेड करें",
    view_plans: "प्लान देखें",
    welcome: "वापसी पर स्वागत है, यहाँ आपके व्यवसाय का सारांश है।",
    create_invoice: "नया बिल बनाएं",
    bill_to: "बिल प्राप्तकर्ता",
    items: "सामान",
    total: "कुल",
    save: "सहेजें",
    language: "भाषा",
    english: "English",
    bengali: "বাংলা",
    hindi: "हिंदी"
  }
};

export const getLanguage = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('billqyro_settings') || '{}');
    return settings.language || 'en';
  } catch (e) {
    return 'en';
  }
};

export const t = (key) => {
  const lang = getLanguage();
  return dictionary[lang]?.[key] || dictionary['en'][key] || key;
};
