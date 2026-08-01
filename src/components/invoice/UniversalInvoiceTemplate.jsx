import React from 'react';

const UniversalInvoiceTemplate = ({ 
  invoiceData, 
  businessSettings,
  isLiveLink = false 
}) => {
  // Destructure with fallbacks
  const themeColor = businessSettings?.brandColor || businessSettings?.themeColor || '#C9A227';
  const isDark = businessSettings?.darkMode || false;
  const logo = businessSettings?.logoUrl;
  const bName = businessSettings?.businessName || 'Business Name';
  const bAddress = businessSettings?.address || '123 Business Rd, City';
  const bEmail = businessSettings?.email || 'contact@business.com';
  const bPhone = businessSettings?.phone || '123-456-7890';
  
  // Customization
  const invoiceBuilderSettings = businessSettings?.invoiceBuilderSettings || {};
  const itemLabel = invoiceBuilderSettings.itemLabel || 'Item';
  const customCols = invoiceBuilderSettings.customColumns || [];
  const taxLabel = invoiceBuilderSettings.taxLabel || businessSettings?.taxLabel || 'Tax';
  const showDiscount = invoiceBuilderSettings.showDiscount !== false;
  const bankDetails = invoiceBuilderSettings.bankDetails;

  // Colors
  const bgMain = isDark ? '#1a1a1a' : '#ffffff';
  const textMain = isDark ? '#ffffff' : '#111827';
  const textMuted = isDark ? '#9ca3af' : '#6b7280';
  const borderSoft = isDark ? '#374151' : '#e5e7eb';
  
  return (
    <div 
      className="universal-invoice max-w-4xl mx-auto w-full p-8 md:p-12 font-sans" 
      style={{ backgroundColor: bgMain, color: textMain }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
          {logo ? (
            <img src={logo} alt={bName} className="h-16 object-contain mb-4" />
          ) : (
            <h2 className="text-3xl font-black mb-4" style={{ color: themeColor }}>{bName}</h2>
          )}
          <div className="text-sm space-y-1" style={{ color: textMuted }}>
            <p>{bAddress}</p>
            <p>{bEmail}</p>
            <p>{bPhone}</p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-4xl font-black uppercase tracking-widest mb-4" style={{ color: themeColor }}>
            INVOICE
          </h1>
          <div className="text-sm font-bold space-y-2">
            <p className="flex justify-between gap-6">
              <span style={{ color: textMuted }}>Invoice No:</span> 
              <span>{invoiceData?.invoiceNumber || '#INV-001'}</span>
            </p>
            <p className="flex justify-between gap-6">
              <span style={{ color: textMuted }}>Date:</span> 
              <span>{invoiceData?.date || new Date().toLocaleDateString()}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-12 border-l-4 pl-4" style={{ borderColor: themeColor }}>
        <h3 className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: textMuted }}>Bill To</h3>
        <p className="text-xl font-bold">{invoiceData?.customerName || 'Customer Name'}</p>
        <p className="text-sm mt-1" style={{ color: textMuted }}>{invoiceData?.customerPhone || 'Customer Details'}</p>
      </div>

      {/* Table */}
      <div className="mb-12 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2" style={{ borderColor: borderSoft }}>
              <th className="py-3 px-2 text-sm font-black uppercase tracking-wider" style={{ color: themeColor }}>S.No</th>
              <th className="py-3 px-2 text-sm font-black uppercase tracking-wider" style={{ color: themeColor }}>{itemLabel}</th>
              <th className="py-3 px-2 text-sm font-black uppercase tracking-wider" style={{ color: themeColor }}>Qty</th>
              <th className="py-3 px-2 text-sm font-black uppercase tracking-wider" style={{ color: themeColor }}>Rate</th>
              {customCols.map(c => (
                <th key={c.id} className="py-3 px-2 text-sm font-black uppercase tracking-wider" style={{ color: themeColor }}>{c.name}</th>
              ))}
              <th className="py-3 px-2 text-sm font-black uppercase tracking-wider text-right" style={{ color: themeColor }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoiceData?.items || [{ sNo: '1', description: 'Example Service', qty: 1, rate: 100, amount: 100 }]).map((item, idx) => (
              <tr key={idx} className="border-b" style={{ borderColor: borderSoft }}>
                <td className="py-4 px-2 font-bold text-sm text-theme-muted">{item.sNo || (idx + 1)}</td>
                <td className="py-4 px-2 font-bold">{item.description}</td>
                <td className="py-4 px-2">{item.qty}</td>
                <td className="py-4 px-2">{businessSettings?.currency || '$'}{item.rate}</td>
                {customCols.map(c => (
                  <td key={c.id} className="py-4 px-2 text-sm text-theme-muted">{item[c.name] || '-'}</td>
                ))}
                <td className="py-4 px-2 font-black text-right">{businessSettings?.currency || '$'}{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals & Notes */}
      <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
        <div className="flex-1">
          {invoiceData?.notes && (
            <div className="mb-6">
              <h4 className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: textMuted }}>Notes</h4>
              <p className="text-sm whitespace-pre-wrap">{invoiceData.notes}</p>
            </div>
          )}
          {businessSettings?.terms && (
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: textMuted }}>Terms & Conditions</h4>
              <p className="text-xs whitespace-pre-wrap" style={{ color: textMuted }}>{businessSettings.terms}</p>
            </div>
          )}
        </div>
        
        <div className="w-full md:w-72 space-y-3">
          <div className="flex justify-between text-sm">
            <span style={{ color: textMuted }}>Subtotal:</span>
            <span className="font-bold">{businessSettings?.currency || '$'}{invoiceData?.subtotal || 100}</span>
          </div>
          {showDiscount && (
            <div className="flex justify-between text-sm">
              <span style={{ color: textMuted }}>Discount:</span>
              <span className="font-bold text-red-500">-{businessSettings?.currency || '$'}{invoiceData?.discountAmount || 0}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span style={{ color: textMuted }}>{taxLabel}:</span>
            <span className="font-bold">{businessSettings?.currency || '$'}{invoiceData?.taxAmount || 0}</span>
          </div>
          <div className="flex justify-between text-xl font-black pt-4 border-t-2" style={{ borderColor: borderSoft }}>
            <span>Total:</span>
            <span style={{ color: themeColor }}>{businessSettings?.currency || '$'}{invoiceData?.grandTotal || 100}</span>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      {bankDetails && (bankDetails.name || bankDetails.account) && (
        <div className="mb-12 p-4 rounded-xl border" style={{ borderColor: borderSoft, backgroundColor: isDark ? '#262626' : '#f9fafb' }}>
          <h4 className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: textMuted }}>Bank & Payment Details</h4>
          <div className="text-sm space-y-1">
            {bankDetails.name && <p><span style={{ color: textMuted }}>Bank:</span> <span className="font-bold">{bankDetails.name}</span></p>}
            {bankDetails.account && <p><span style={{ color: textMuted }}>Account:</span> <span className="font-bold">{bankDetails.account}</span></p>}
            {bankDetails.ifsc && <p><span style={{ color: textMuted }}>IFSC/Routing:</span> <span className="font-bold">{bankDetails.ifsc}</span></p>}
          </div>
        </div>
      )}

      {/* Live Link Extra Section (Payment) */}
      {isLiveLink && (
        <div className="mt-12 p-6 rounded-2xl border-2 text-center" style={{ borderColor: themeColor, backgroundColor: isDark ? '#262626' : '#fafafa' }}>
          <h3 className="text-lg font-black mb-2" style={{ color: themeColor }}>Secure Payment Gateway</h3>
          <p className="text-sm mb-6" style={{ color: textMuted }}>Please complete your payment below to settle this invoice.</p>
          <button className="px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-105" style={{ backgroundColor: themeColor }}>
            Pay {businessSettings?.currency || '$'}{invoiceData?.balanceDue || invoiceData?.grandTotal || 100} Now
          </button>
        </div>
      )}
    </div>
  );
};

export default UniversalInvoiceTemplate;
