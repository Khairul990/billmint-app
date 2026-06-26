import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, FileText, LayoutDashboard, Globe, CreditCard, GraduationCap, Users, QrCode, X } from 'lucide-react';
import InvoicePreview from '../InvoicePreview';
import { DEMO_INVOICE, DEMO_BUSINESS } from './DemoData';
import { getThemePreviewColors } from '../../utils/themeUtils';

const PREVIEW_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'invoice', label: 'Invoice', icon: FileText },
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'portal', label: 'Billing Portal', icon: Globe },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'student', label: 'Student Portal', icon: GraduationCap },
  { id: 'customer', label: 'Customer Portal', icon: Users }
];

const MiniInvoicePreview = ({ colors, businessSettings }) => (
  <div className="w-full h-full flex flex-col" style={{ backgroundColor: colors.background }}>
    <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: colors.border }}>
      <div>
        <p className="text-xs font-bold" style={{ color: colors.text }}>ABC Coaching Center</p>
        <p className="text-[9px]" style={{ color: colors.muted }}>Invoice INV-10024</p>
      </div>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black" style={{ background: `linear-gradient(135deg, ${colors.btnFrom}, ${colors.btnTo})` }}>
        BQ
      </div>
    </div>
    <div className="flex-1 p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-semibold" style={{ color: colors.muted }}>Customer</span>
        <span className="text-[9px] font-semibold" style={{ color: colors.muted }}>Amount</span>
      </div>
      {DEMO_INVOICE.items.map((item, i) => (
        <div key={i} className="flex justify-between items-center py-1 border-b border-dashed" style={{ borderColor: colors.border }}>
          <span className="text-[9px]" style={{ color: colors.text }}>{item.description}</span>
          <span className="text-[9px] font-bold" style={{ color: colors.text }}>{DEMO_INVOICE.currency}{item.amount}</span>
        </div>
      ))}
      <div className="flex justify-between items-center pt-2 mt-auto" style={{ backgroundColor: colors.totalBg, borderRadius: 8, padding: '8px 12px' }}>
        <span className="text-[10px] font-bold" style={{ color: colors.headerColor }}>Total Due</span>
        <span className="text-[11px] font-black" style={{ color: colors.headerColor }}>{DEMO_INVOICE.currency}{DEMO_INVOICE.grandTotal}</span>
      </div>
    </div>
    <div className="px-3 pb-3">
      <div className="w-full py-1.5 rounded-lg text-center text-[8px] font-bold text-white" style={{ background: `linear-gradient(90deg, ${colors.btnFrom}, ${colors.btnTo})` }}>
        Pay Now - {DEMO_INVOICE.currency}{DEMO_INVOICE.grandTotal}
      </div>
    </div>
  </div>
);

const MiniDashboardPreview = ({ colors }) => (
  <div className="w-full h-full flex flex-col" style={{ backgroundColor: colors.background }}>
    <div className="p-3 border-b" style={{ borderColor: colors.border }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold" style={{ color: colors.text }}>Dashboard</p>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }} />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
    <div className="flex-1 p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Revenue', value: '\u20B91,20,000', color: colors.accent },
          { label: 'Pending', value: '\u20B945,000', color: colors.btnFrom },
          { label: 'Customers', value: '128', color: colors.accent },
          { label: 'Invoices', value: '342', color: colors.btnFrom }
        ].map((stat, i) => (
          <div key={i} className="rounded-lg p-2 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <p className="text-[8px] font-semibold" style={{ color: colors.muted }}>{stat.label}</p>
            <p className="text-xs font-black" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg p-2 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
        <p className="text-[8px] font-semibold" style={{ color: colors.muted }}>Recent Invoice</p>
        <p className="text-[9px] font-bold" style={{ color: colors.text }}>INV-10024 - \u20B91,593</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }} />
          <span className="text-[8px]" style={{ color: colors.muted }}>Pending - Rahim Sheikh</span>
        </div>
      </div>
    </div>
  </div>
);

const MiniBillingPortalPreview = ({ colors }) => (
  <div className="w-full h-full flex flex-col" style={{ backgroundColor: colors.background }}>
    <div className="p-3 border-b text-center" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
      <p className="text-xs font-bold" style={{ color: colors.text }}>ABC Coaching Center</p>
      <p className="text-[8px]" style={{ color: colors.muted }}>Billing Portal</p>
    </div>
    <div className="flex-1 p-3 space-y-3">
      <div className="rounded-xl p-3 text-center" style={{ background: `linear-gradient(135deg, ${colors.btnFrom}, ${colors.btnTo})` }}>
        <p className="text-white text-[10px] font-bold">Outstanding Balance</p>
        <p className="text-white text-lg font-black">{DEMO_INVOICE.currency}{DEMO_INVOICE.grandTotal}</p>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-dashed" style={{ borderColor: colors.border }}>
            <div>
              <p className="text-[9px] font-semibold" style={{ color: colors.text }}>June 2026 Fee</p>
              <p className="text-[8px]" style={{ color: colors.muted }}>Due: 15/07/2026</p>
            </div>
            <span className="text-[9px] font-bold" style={{ color: colors.accent }}>{DEMO_INVOICE.currency}500</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MiniPaymentPreview = ({ colors }) => (
  <div className="w-full h-full flex flex-col items-center justify-center p-4" style={{ backgroundColor: colors.background }}>
    <div className="w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center mb-3" style={{ borderColor: colors.accent }}>
      <QrCode className="w-10 h-10" style={{ color: colors.accent }} />
    </div>
    <p className="text-xs font-bold" style={{ color: colors.text }}>Scan to Pay</p>
    <p className="text-[9px] text-center mt-1" style={{ color: colors.muted }}>UPI ID: abccoaching@ybl</p>
    <div className="mt-3 w-full py-2 rounded-lg text-center text-[9px] font-bold text-white" style={{ background: `linear-gradient(90deg, ${colors.btnFrom}, ${colors.btnTo})` }}>
      Pay {DEMO_INVOICE.currency}{DEMO_INVOICE.grandTotal}
    </div>
  </div>
);

const MiniStudentPortalPreview = ({ colors }) => (
  <div className="w-full h-full flex flex-col" style={{ backgroundColor: colors.background }}>
    <div className="p-3 border-b" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black" style={{ backgroundColor: colors.accent }}>R</div>
        <div>
          <p className="text-[10px] font-bold" style={{ color: colors.text }}>Rahim Sheikh</p>
          <p className="text-[8px]" style={{ color: colors.muted }}>Student ID: STU-2024-0089</p>
        </div>
      </div>
    </div>
    <div className="flex-1 p-3 space-y-2">
      <div className="rounded-lg p-2" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
        <p className="text-[8px] font-semibold" style={{ color: colors.muted }}>Current Month</p>
        <div className="flex justify-between items-center mt-1">
          <span className="text-[9px]" style={{ color: colors.text }}>Tuition Fee</span>
          <span className="text-[9px] font-bold" style={{ color: colors.accent }}>{DEMO_INVOICE.currency}1,000</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px]" style={{ color: colors.text }}>Lab Fee</span>
          <span className="text-[9px] font-bold" style={{ color: colors.accent }}>{DEMO_INVOICE.currency}150</span>
        </div>
        <div className="flex justify-between items-center mt-1 pt-1 border-t" style={{ borderColor: colors.border }}>
          <span className="text-[9px] font-bold" style={{ color: colors.text }}>Total</span>
          <span className="text-[9px] font-black" style={{ color: colors.headerColor }}>{DEMO_INVOICE.currency}{DEMO_INVOICE.grandTotal}</span>
        </div>
      </div>
      <div className="flex gap-1">
        <span className="text-[8px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: colors.accent + '20', color: colors.accent }}>Pending</span>
        <span className="text-[8px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: colors.card, color: colors.muted, border: `1px solid ${colors.border}` }}>Due: 15/07</span>
      </div>
    </div>
  </div>
);

const MiniCustomerPortalPreview = ({ colors }) => (
  <div className="w-full h-full flex flex-col" style={{ backgroundColor: colors.background }}>
    <div className="p-3 border-b" style={{ borderColor: colors.border }}>
      <p className="text-[10px] font-bold" style={{ color: colors.text }}>Invoice Portal</p>
    </div>
    <div className="flex-1 p-3 space-y-2">
      <div className="rounded-lg p-3" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[9px] font-semibold" style={{ color: colors.muted }}>INV-10024</p>
            <p className="text-[8px]" style={{ color: colors.muted }}>15 Jun 2026</p>
          </div>
          <span className="text-[8px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: colors.btnFrom + '20', color: colors.btnFrom }}>Pending</span>
        </div>
        <div className="mt-2 flex justify-between items-center">
          <span className="text-[10px] font-bold" style={{ color: colors.text }}>{DEMO_INVOICE.currency}{DEMO_INVOICE.grandTotal}</span>
          <button className="text-[8px] px-3 py-1 rounded-lg font-bold text-white" style={{ backgroundColor: colors.accent }}>Pay Now</button>
        </div>
      </div>
      <div className="rounded-lg p-3" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
        <p className="text-[8px] font-semibold" style={{ color: colors.muted }}>Contact</p>
        <p className="text-[9px] font-bold" style={{ color: colors.text }}>khairul@abccoaching.com</p>
        <p className="text-[9px]" style={{ color: colors.text }}>+91 98765 43210</p>
      </div>
    </div>
  </div>
);

const LivePreviewPanel = ({ themeId, darkMode, brandColor, settings = {} }) => {
  const [activePreview, setActivePreview] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const colors = useMemo(() => {
    const effectiveTheme = brandColor && themeId === 'custom' ? 'obsidian-gold' : (themeId || 'obsidian-gold');
    return getThemePreviewColors(effectiveTheme, darkMode ? 'dark' : 'light');
  }, [themeId, darkMode, brandColor]);

  const renderPreview = () => {
    switch (activePreview) {
      case 'dashboard': return <MiniDashboardPreview colors={colors} />;
      case 'invoice': return <MiniInvoicePreview colors={colors} businessSettings={settings} />;
      case 'pdf': return <MiniInvoicePreview colors={colors} businessSettings={settings} />;
      case 'portal': return <MiniBillingPortalPreview colors={colors} />;
      case 'payment': return <MiniPaymentPreview colors={colors} />;
      case 'student': return <MiniStudentPortalPreview colors={colors} />;
      case 'customer': return <MiniCustomerPortalPreview colors={colors} />;
      default: return <MiniDashboardPreview colors={colors} />;
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-l-xl flex items-center justify-center shadow-lg border border-r-0"
        style={{ backgroundColor: colors.accent, borderColor: colors.border }}
      >
        <Eye className="w-4 h-4 text-white" />
      </button>
    );
  }

  return (
    <div
      className="fixed right-0 top-20 bottom-24 w-80 z-40 flex flex-col border-l shadow-2xl"
      style={{ backgroundColor: colors.background, borderColor: colors.border }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5" style={{ color: colors.accent }} />
          <span className="text-[10px] font-bold" style={{ color: colors.text }}>Live Preview</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/10"
        >
          <X className="w-3 h-3" style={{ color: colors.muted }} />
        </button>
      </div>

      {/* Preview Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-0.5 px-2 py-1.5 border-b" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
        {PREVIEW_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activePreview === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePreview(tab.id)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all shrink-0 min-w-[48px]"
              style={{
                backgroundColor: isActive ? colors.accent + '20' : 'transparent',
                color: isActive ? colors.accent : colors.muted
              }}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span className="text-[7px] font-semibold whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePreview}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 overflow-y-auto"
          >
            {renderPreview()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Status Bar */}
      <div className="px-3 py-1.5 border-t flex items-center justify-between" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
        <span className="text-[7px] font-semibold" style={{ color: colors.muted }}>Instant Preview</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }} />
          <span className="text-[7px]" style={{ color: colors.muted }}>Live</span>
        </div>
      </div>
    </div>
  );
};

export default LivePreviewPanel;
