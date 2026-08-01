import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { getInvoiceColumns, getItemValue } from '../utils/invoiceSchema';
import { getTemplateLayoutFamily } from '../services/TemplateEngine';

// Register Google Fonts to support regional currency symbols and scripts
// Using reliable raw github links to prevent loading hangs
Font.register({
  family: 'Noto Sans',
  src: '/fonts/NotoSans-Regular.ttf'
});

Font.register({
  family: 'Noto Sans Bengali',
  src: '/fonts/NotoSansBengali-Regular.ttf'
});

// Register a clean, premium font hierarchy if desired, otherwise use standard helvetica
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Noto Sans',
    color: '#334155',
    backgroundColor: '#ffffff',
  },
  watermark: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#cbd5e1',
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  footerText: {
    position: 'absolute',
    bottom: 35,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    lineHeight: 1.5,
  },
  
  // COMMON HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 25,
    marginBottom: 25,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  businessSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 1.4,
  },
  invoiceMeta: {
    alignItems: 'right',
    width: 180,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 1,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 9.5,
    color: '#475569',
    marginTop: 4,
  },

  // CLIENT REGISTRY
  clientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 18,
    borderRadius: 8,
    marginBottom: 25,
  },
  clientBox: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 8.5,
    color: '#94a3b8',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 3,
  },
  clientInfo: {
    fontSize: 9.5,
    color: '#475569',
    marginTop: 2,
    lineHeight: 1.4,
  },

  // SMART TABLE
  table: {
    width: '100%',
    marginBottom: 25,
  },
  tableHeader: {
    flexDirection: 'row',
    color: '#ffffff',
    padding: 10,
    fontWeight: 'bold',
    fontSize: 9,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 9,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#fbfbfb',
  },
  colSN: { width: '5%', textAlign: 'center' },
  colDesign: { width: '11%' },
  colWorkType: { width: '14%' },
  colDesc: { width: '33%' },
  colSize: { width: '10%', textAlign: 'center' },
  colQty: { width: '8%', textAlign: 'center' },
  colRate: { width: '8%', textAlign: 'right' },
  colAmt: { width: '11%', textAlign: 'right' },

  // TOTALS SECTION
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  notesBox: {
    width: '50%',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.6,
  },
  notesHeader: {
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 6,
    fontSize: 9.5,
  },
  totalsBox: {
    width: '45%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    fontWeight: 'bold',
    fontSize: 12,
  },
  dueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 11,
    paddingHorizontal: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    marginTop: 6,
  },

  // TEMPLATE 1 OVERRIDES (COMPACT)
  compactPage: {
    padding: 24,
    fontSize: 9.5,
    fontFamily: 'Noto Sans',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  compactHeader: {
    alignItems: 'center',
    textAlign: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 16,
    marginBottom: 16,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  compactTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#475569',
    color: '#ffffff',
    padding: 7,
    fontWeight: 'bold',
    fontSize: 8.5,
    borderRadius: 4,
  },
  compactColSN: { width: '8%', textAlign: 'center' },
  compactColDesc: { width: '52%' },
  compactColQty: { width: '12%', textAlign: 'center' },
  compactColRate: { width: '14%', textAlign: 'right' },
  compactColAmt: { width: '14%', textAlign: 'right' },
});

export const PDFInvoice = ({ invoice, businessSettings: liveBusinessSettings, isPremium, qrCodeDataUrl }) => {
  const activeSettings = {
    ...liveBusinessSettings,
    ...(invoice?.businessSnapshot || {})
  };
  const activePaymentSettings = {
    ...liveBusinessSettings,
    ...(invoice?.paymentSettingsSnapshot || {})
  };
  
  const businessSettings = {
    ...activeSettings,
    ...activePaymentSettings
  };

  const regionalPrefs = invoice?.regionalSettingsSnapshot || {
    country: businessSettings?.country || 'India',
    currency: businessSettings?.currency || '\u20b9',
    currencyCode: businessSettings?.currencyCode || (businessSettings?.country === 'Bangladesh' ? 'BDT' : businessSettings?.country === 'Other' ? 'USD' : 'INR'),
    language: businessSettings?.language || 'English',
    taxLabel: businessSettings?.taxLabel || (businessSettings?.country === 'Bangladesh' ? 'VAT' : businessSettings?.country === 'Other' ? 'Tax' : 'GST'),
    dateFormat: businessSettings?.dateFormat || 'DD/MM/YYYY',
    numberFormat: businessSettings?.numberFormat || 'Indian'
  };

  const currencySymbol = regionalPrefs.currency || '\u20b9';
  const rawTemplateId = (businessSettings?.selectedPdfTemplate || invoice?.pdfTemplate || businessSettings?.invoiceTemplate || 'classic').toLowerCase();
  
  // Resolve layout family instead of binary classic/modern
  const layoutFamily = getTemplateLayoutFamily(rawTemplateId);
  const templateId = layoutFamily;
  
  const themePreset = businessSettings?.themePreset || 'light';
  let brandColor = '#19C3A3'; 
  let headerColor = '#0a1128';
  let tableHeaderBg = '#14284B';
  let totalHighlightBg = '#eff6ff';

  if (themePreset === 'dark' || layoutFamily === 'gold') {
    brandColor = layoutFamily === 'gold' ? '#D4AF37' : '#9FE5CF'; // Gold accent for gold family
    headerColor = '#071B3A';
    tableHeaderBg = layoutFamily === 'gold' ? '#1a1a1a' : '#071B3A'; // Darker table header for gold
    totalHighlightBg = layoutFamily === 'gold' ? '#262626' : 'rgba(159, 229, 207, 0.12)';
  } else if (themePreset === 'rose') {
    brandColor = '#F43F5E';
    headerColor = '#881337';
    tableHeaderBg = '#881337';
    totalHighlightBg = '#FFF1F2';
  } else if (layoutFamily === 'corporate') {
    brandColor = '#10B981';
    headerColor = '#064E3B';
    tableHeaderBg = '#064E3B';
    totalHighlightBg = '#F0FDF4';
  } else if (layoutFamily === 'minimal') {
    brandColor = '#1e293b';
    headerColor = '#0f172a';
    tableHeaderBg = '#f8fafc';
    totalHighlightBg = '#f1f5f9';
  } else {
    brandColor = '#19C3A3';
    headerColor = '#14284B';
    tableHeaderBg = '#14284B';
    totalHighlightBg = '#ECFDF5';
  }

  const hasBengali = (text) => /[\u0980-\u09FF]/.test(text || '');
  const needsBengaliFont = 
    hasBengali(businessSettings?.businessName) || 
    hasBengali(businessSettings?.address) || 
    hasBengali(invoice?.customerName) ||
    hasBengali(invoice?.customerAddress) ||
    (invoice?.items || []).some(i => hasBengali(i.name) || hasBengali(i.description));

  const dynamicFont = (regionalPrefs.country === 'Bangladesh' || needsBengaliFont) ? 'Noto Sans Bengali' : 'Noto Sans';

  const formatVal = (num) => {
    const numericAmount = parseFloat(num || 0);
    let locale = 'en-IN';
    if (regionalPrefs.numberFormat === 'Standard') {
      locale = 'en-US';
    } else if (regionalPrefs.numberFormat === 'European') {
      locale = 'de-DE';
    }
    return `${currencySymbol}${numericAmount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };
  
  const invoiceBuilderSettings = businessSettings?.invoiceBuilderSettings || {};
  const bankDetails = invoiceBuilderSettings.bankDetails || {};

  const qrEnabled = bankDetails?.showQr || (businessSettings?.paymentQrEnabled && businessSettings?.showQrInPdf);
  const paymentMethod = (bankDetails?.upiId ? 'UPI' : businessSettings?.paymentMethod) || 'UPI';
  
  const dueAmount = (invoice.balanceDue !== undefined && invoice.balanceDue !== null && invoice.balanceDue !== 0)
    ? invoice.balanceDue
    : invoice.grandTotal;

  let qrText = '';
  if (qrEnabled) {
    const verifStr = invoice.verificationCode ? ` [Code: ${invoice.verificationCode}]` : '';
    if (paymentMethod === 'UPI') {
      const upiId = bankDetails?.upiId || businessSettings.upiId || '';
      const payeeName = businessSettings.payeeName || businessSettings.businessName || '';
      const txnNote = `Invoice ${invoice.invoiceNumber}${verifStr}`;
      qrText = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${dueAmount}&cu=${regionalPrefs.currencyCode || 'INR'}&tn=${encodeURIComponent(txnNote)}`;
    } else if (paymentMethod === 'bKash') {
      const bkashNumber = businessSettings.bkashNumber || '';
      qrText = `bKash Payment\nMerchant/Personal Number: ${bkashNumber}\nAmount: ${dueAmount}\nInvoice: ${invoice.invoiceNumber}${invoice.verificationCode ? `\nCode: ${invoice.verificationCode}` : ''}`;
    } else if (paymentMethod === 'Nagad') {
      const nagadNumber = businessSettings.nagadNumber || '';
      qrText = `Nagad Payment\nNumber: ${nagadNumber}\nAmount: ${dueAmount}\nInvoice: ${invoice.invoiceNumber}${invoice.verificationCode ? `\nCode: ${invoice.verificationCode}` : ''}`;
    } else if (paymentMethod === 'Manual') {
      qrText = businessSettings.customPaymentLink || '';
    }
  }

  const qrCodeUrl = qrEnabled && qrText
    ? `https://quickchart.io/qr?size=150&text=${encodeURIComponent(qrText)}`
    : null;

  const getInvoiceTitle = (billType) => {
    const titles = {
      tailor: 'TAILOR INVOICE',
      doctor: 'DOCTOR INVOICE',
      teacher: 'TEACHER INVOICE',
      repair: 'REPAIR INVOICE',
      retail: 'RETAIL INVOICE',
      grocery: 'GROCERY INVOICE',
      service: 'SERVICE INVOICE',
      embroidery: 'EMBROIDERY INVOICE',
    };
    return titles[billType] || 'INVOICE';
  };

  const getDefaultNotesText = (billType) => {
    const notes = {
      tailor: 'Thank you for choosing our tailoring service!',
      doctor: 'Thank you for your visit. Wishing you good health!',
      teacher: 'Thank you for your continued learning!',
      repair: 'Thank you for trusting us with your repair!',
      retail: 'Thank you for shopping with us!',
    };
    return notes[billType] || 'Thank you for your business!';
  };

  const renderTemplate1 = () => {
    const extraCols = invoice?.settings?.extraColumns || businessSettings?.extraColumns || [];
    const extraColWidth = Math.min(8, Math.floor(24 / Math.max(1, extraCols.length)));
    const totalExtraWidth = extraCols.length * extraColWidth;
    const getDescWidth = (base) => `${Math.max(15, parseInt(base) - totalExtraWidth)}%`;
    const cCol1 = invoice?.settings?.customColumns?.col1 || businessSettings?.customColumns?.col1 || null;
    const cCol2 = invoice?.settings?.customColumns?.col2 || businessSettings?.customColumns?.col2 || 'Qty';
    const cCol3 = invoice?.settings?.customColumns?.col3 || businessSettings?.customColumns?.col3 || 'Rate';

    return (
    <Page size="A5" style={[styles.compactPage, { fontFamily: dynamicFont }]}>
      <View style={styles.compactHeader}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0a1128' }}>
          {businessSettings?.businessName || 'BillQyro Store'}
        </Text>
        <Text style={{ fontSize: 8, color: '#64748b', marginTop: 3 }}>
          {businessSettings?.address || ''}  |  {businessSettings?.phone || ''}
        </Text>
        <Text style={styles.compactTitle}>{getInvoiceTitle(invoice.billType)}</Text>
        <Text style={{ fontSize: 9, color: '#475569', marginTop: 4 }}>
          #{invoice.invoiceNumber}  |  Date: {invoice.date}
        </Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 8, color: '#94a3b8', fontWeight: 'bold', letterSpacing: 0.5 }}>BILL TO:</Text>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a', marginTop: 3 }}>{invoice.customerName}</Text>
        <Text style={{ fontSize: 8, color: '#475569', marginTop: 2 }}>
          Ph: {invoice.customerPhone || 'N/A'}  |  Pay Type: {invoice.paymentType || 'Cash'}
        </Text>
      </View>

        <View style={styles.table}>
          <View style={[styles.compactTableHeader, { backgroundColor: tableHeaderBg }]}>
            {getInvoiceColumns(invoice, businessSettings).map(col => (
              <Text key={col.id} style={{ width: col.width, textAlign: col.align === 'left' ? 'left' : (col.align === 'right' ? 'right' : 'center'), color: layoutFamily === 'minimal' ? '#0f172a' : '#ffffff' }}>
                {col.label}
              </Text>
            ))}
          </View>

        {(invoice.items || []).map((item, idx) => (
          <View key={idx} style={[styles.tableRow, idx % 2 !== 0 ? styles.tableRowAlt : null]}>
            {getInvoiceColumns(invoice, businessSettings).map(col => {
              const val = getItemValue(item, col.id, invoice.billType);
              let align = col.align === 'left' ? 'left' : (col.align === 'right' ? 'right' : 'center');
              
              if (col.id === 'sn') {
                return (
                  <Text key={col.id} style={{ width: col.width, textAlign: align, color: '#475569' }}>
                    {val || (idx + 1)}
                  </Text>
                );
              }
              if (col.id === 'item' || col.id === 'col1') {
                return (
                  <Text key={col.id} style={{ width: col.width, textAlign: align, fontWeight: 'bold', color: '#0f172a' }}>
                    {val}
                  </Text>
                );
              }
              if (col.id === 'qty') {
                return <Text key={col.id} style={{ width: col.width, textAlign: align }}>{val}{item.unit ? ` ${item.unit}` : ''}</Text>;
              }
              if (col.id === 'amount' || col.id === 'rate' || col.id === 'tax' || col.id === 'discount') {
                return (
                  <Text key={col.id} style={{ width: col.width, textAlign: align, fontWeight: col.id === 'amount' ? 'bold' : 'normal', color: col.id === 'discount' && val > 0 ? '#ef4444' : '#1e293b' }}>
                    {col.id === 'discount' && val > 0 ? '-' : ''}{val}
                  </Text>
                );
              }
              return <Text key={col.id} style={{ width: col.width, textAlign: align }}>{val}</Text>;
            })}
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, borderTopWidth: 1.5, borderTopColor: '#e2e8f0', paddingTop: 8 }}>
        <View style={{ width: '48%' }}>
          {qrCodeUrl ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Image src={qrCodeUrl} style={{ width: 50, height: 50, borderRadius: 4 }} />
              <View style={{ flex: 1, fontSize: 7 }}>
                <Text style={{ fontWeight: 'bold', color: '#0f172a', fontSize: 8 }}>Pay with {paymentMethod}</Text>
                <Text style={{ fontSize: 6.5, color: '#64748b', marginTop: 2 }}>
                  {paymentMethod === 'UPI' && `UPI: ${businessSettings.upiId}`}
                  {paymentMethod === 'bKash' && `bKash: ${businessSettings.bkashNumber}`}
                  {paymentMethod === 'Nagad' && `Nagad: ${businessSettings.nagadNumber}`}
                  {paymentMethod === 'Manual' && `Custom Transfer`}
                </Text>
                {businessSettings.paymentNote && (
                  <Text style={{ fontSize: 6, color: '#94a3b8', fontStyle: 'italic', marginTop: 2 }}>{businessSettings.paymentNote}</Text>
                )}
              </View>
            </View>
          ) : (
            <View style={{ fontSize: 7.5, color: '#64748b' }}>
              <Text style={{ fontWeight: 'bold', color: '#475569', fontSize: 8 }}>Notes:</Text>
              <Text style={{ marginTop: 2, lineHeight: 1.5 }}>{businessSettings?.defaultNotes || getDefaultNotesText(invoice.billType)}</Text>
            </View>
          )}
        </View>
        <View style={{ width: '48%' }}>
          <View style={styles.totalRow}>
            <Text style={{ fontSize: 8, color: '#64748b' }}>Subtotal</Text>
            <Text style={{ fontSize: 8 }}>{formatVal(invoice.subtotal)}</Text>
          </View>
          {invoice.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ fontSize: 8, color: '#64748b' }}>Discount</Text>
              <Text style={{ fontSize: 8 }}>-{formatVal(invoice.discountAmount)}</Text>
            </View>
          )}
          {invoice.taxAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ fontSize: 8, color: '#64748b' }}>{regionalPrefs.taxLabel || 'Tax'} ({invoice.taxPercentage}%)</Text>
              <Text style={{ fontSize: 8 }}>{formatVal(invoice.taxAmount)}</Text>
            </View>
          )}
          <View style={[styles.grandTotalRow, { backgroundColor: totalHighlightBg }]}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: themePreset === 'rose' || layoutFamily === 'minimal' ? '#881337' : (layoutFamily === 'gold' ? '#D4AF37' : '#0f172a') }}>Grand Total</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: themePreset === 'rose' || layoutFamily === 'minimal' ? '#881337' : (layoutFamily === 'gold' ? '#D4AF37' : '#0f172a') }}>{formatVal(invoice.grandTotal)}</Text>
          </View>
          {invoice.balanceDue > 0 && (
            <View style={styles.dueRow}>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Balance Due</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatVal(invoice.balanceDue)}</Text>
            </View>
          )}
        </View>
      </View>

      {businessSettings?.pdfFooter && (
        <Text style={styles.footerText}>{businessSettings.pdfFooter}</Text>
      )}

      {businessSettings?.businessName && (
        <Text style={[styles.footerText, { bottom: 20, fontSize: 7, color: '#94a3b8' }]}>
          {businessSettings.businessName} | {businessSettings?.phone || ''} | {businessSettings?.address || ''}
        </Text>
      )}

      {!isPremium && (
        <Text style={styles.watermark}>Powered by BillQyro Invoicing SaaS</Text>
      )}
    </Page>
    );
  }

  const renderTemplate2 = () => {
    return (
    <Page size="A4" style={[styles.page, { fontFamily: dynamicFont }]}>
      <View style={styles.header}>
        <View style={styles.businessInfo}>
          <Text style={[styles.businessName, { color: headerColor }]}>
            {businessSettings?.businessName || 'BillQyro Technologies'}
          </Text>
          <Text style={styles.businessSub}>
            Address: {businessSettings?.address || 'N/A'}
          </Text>
          <Text style={styles.businessSub}>
            Email: {businessSettings?.email || 'N/A'} | Phone: {businessSettings?.phone || 'N/A'}
          </Text>
          {businessSettings?.gstNumber && (
            <Text style={[styles.businessSub, { fontWeight: 'bold', color: '#0a1128' }]}>
              {regionalPrefs.taxLabel || 'Tax ID / GSTIN'}: {businessSettings.gstNumber}
            </Text>
          )}
        </View>

        <View style={styles.invoiceMeta}>
          <Text style={[styles.invoiceTitle, { color: brandColor }]}>{getInvoiceTitle(invoice.billType)}</Text>
          <Text style={[styles.metaText, { fontWeight: 'bold', marginTop: 5 }]}>
            Invoice No: {invoice.invoiceNumber}
          </Text>
          <Text style={styles.metaText}>Date: {invoice.date}</Text>
          <Text style={styles.metaText}>Due Date: {invoice.dueDate}</Text>
        </View>
      </View>

      <View style={styles.clientSection}>
        <View style={styles.clientBox}>
          <Text style={styles.sectionTitle}>Invoiced To</Text>
          <Text style={styles.clientName}>{invoice.customerName}</Text>
          <Text style={styles.clientInfo}>Phone: {invoice.customerPhone || 'N/A'}</Text>
          <Text style={styles.clientInfo}>Address: {invoice.customerAddress || 'N/A'}</Text>
        </View>

        <View style={{ width: 120 }}>
          <Text style={styles.sectionTitle}>Registry Details</Text>
          <Text style={styles.clientInfo}>
            Customer ID: <Text style={{ fontWeight: 'bold' }}>{invoice.customerId || 'N/A'}</Text>
          </Text>
          <Text style={styles.clientInfo}>
            Payment Term: <Text style={{ fontWeight: 'bold' }}>{invoice.paymentType || 'Cash'}</Text>
          </Text>
          <Text style={styles.clientInfo}>
            Status: <Text style={{ fontWeight: 'bold', color: invoice.paymentStatus === 'Paid' ? '#16a34a' : '#d97706' }}>{invoice.paymentStatus}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableHeader, { backgroundColor: tableHeaderBg }]}>
          {getInvoiceColumns(invoice, businessSettings).map(col => (
            <Text key={col.id} style={{ width: col.width, textAlign: col.align === 'left' ? 'left' : (col.align === 'right' ? 'right' : 'center'), color: layoutFamily === 'minimal' ? '#0f172a' : '#ffffff' }}>
              {col.label}
            </Text>
          ))}
        </View>

        {(invoice.items || []).map((item, idx) => (
          <View key={idx} style={[styles.tableRow, idx % 2 !== 0 ? styles.tableRowAlt : null]}>
            {getInvoiceColumns(invoice, businessSettings).map(col => {
              const val = getItemValue(item, col.id, invoice.billType);
              let align = col.align === 'left' ? 'left' : (col.align === 'right' ? 'right' : 'center');
              
              if (col.id === 'sn') {
                return (
                  <Text key={col.id} style={{ width: col.width, textAlign: align, color: '#475569' }}>
                    {val || (idx + 1)}
                  </Text>
                );
              }
              if (col.id === 'item' || col.id === 'col1') {
                return (
                  <View key={col.id} style={{ width: col.width, paddingRight: 4 }}>
                    <Text style={[styles.itemName, { textAlign: align }]}>{val}</Text>
                    {item.workType && item.workType !== 'Embroidery' && <Text style={[styles.itemSub, { textAlign: align }]}>Type: {item.workType}</Text>}
                    {item.designNo && item.designNo !== 'N/A' && <Text style={[styles.itemSub, { textAlign: align }]}>Design: {item.designNo}</Text>}
                  </View>
                );
              }
              if (col.id === 'qty') {
                return <Text key={col.id} style={{ width: col.width, textAlign: align, color: '#475569' }}>{val}{item.unit ? ` ${item.unit}` : ''}</Text>;
              }
              if (col.id === 'amount' || col.id === 'rate' || col.id === 'tax' || col.id === 'discount') {
                return (
                  <Text key={col.id} style={{ width: col.width, textAlign: align, fontWeight: col.id === 'amount' ? 'bold' : 'normal', color: col.id === 'discount' && val > 0 ? '#ef4444' : '#1e293b' }}>
                    {col.id === 'discount' && val > 0 ? '-' : ''}{val}
                  </Text>
                );
              }
              return <Text key={col.id} style={{ width: col.width, textAlign: align, color: '#475569' }}>{val}</Text>;
            })}
          </View>
        ))}
      </View>

      <View style={styles.totalsContainer}>
        <View style={styles.notesBox}>
          {qrCodeDataUrl ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Image src={qrCodeDataUrl} style={{ width: 55, height: 55, borderRadius: 3 }} />
              <View style={{ flex: 1, fontSize: 8 }}>
                <Text style={[styles.notesHeader, { fontSize: 9 }]}>Scan to Pay with {paymentMethod}</Text>
                {paymentMethod === 'UPI' && businessSettings.upiId && (
                  <Text style={{ marginTop: 2 }}>UPI ID: <Text style={{ fontWeight: 'bold' }}>{businessSettings.upiId}</Text></Text>
                )}
                {paymentMethod === 'bKash' && businessSettings.bkashNumber && (
                  <Text style={{ marginTop: 2 }}>bKash: <Text style={{ fontWeight: 'bold' }}>{businessSettings.bkashNumber}</Text></Text>
                )}
                {paymentMethod === 'Nagad' && businessSettings.nagadNumber && (
                  <Text style={{ marginTop: 2 }}>Nagad: <Text style={{ fontWeight: 'bold' }}>{businessSettings.nagadNumber}</Text></Text>
                )}
                {paymentMethod === 'Manual' && businessSettings.customPaymentLink && (
                  <Text style={{ fontSize: 8, marginTop: 3 }}>Details: {businessSettings.customPaymentLink}</Text>
                )}
                
                <Text style={{ marginTop: 4, fontWeight: 'bold', color: '#0f172a' }}>
                  Payee: {businessSettings.payeeName || businessSettings.businessName}
                </Text>

                {businessSettings.paymentNote ? (
                  <Text style={{ marginTop: 5, color: '#64748b', fontSize: 8, fontStyle: 'italic' }}>
                    {businessSettings.paymentNote}
                  </Text>
                ) : (
                  <Text style={{ marginTop: 5, color: '#94a3b8', fontSize: 8 }}>
                    Scan the QR code above to complete your secure payment.
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.notesHeader}>Notes & Business Conditions:</Text>
              <Text style={{ lineHeight: 1.5 }}>{businessSettings?.defaultNotes || getDefaultNotesText(invoice.billType)}</Text>
              {businessSettings?.terms && (
                <Text style={{ marginTop: 6, color: '#475569' }}>{businessSettings.terms}</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={{ color: '#64748b' }}>Subtotal</Text>
            <Text style={{ fontWeight: 'medium' }}>{formatVal(invoice.subtotal)}</Text>
          </View>
          
          {invoice.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: '#64748b' }}>Discount</Text>
              <Text style={{ color: '#16a34a' }}>-{formatVal(invoice.discountAmount)}</Text>
            </View>
          )}

          {invoice.taxAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: '#64748b' }}>{regionalPrefs.taxLabel || 'Tax'} ({invoice.taxPercentage}%)</Text>
              <Text>{formatVal(invoice.taxAmount)}</Text>
            </View>
          )}

          <View style={[styles.grandTotalRow, { backgroundColor: totalHighlightBg }]}>
            <Text style={{ fontWeight: 'bold', color: themePreset === 'rose' || layoutFamily === 'minimal' ? '#881337' : (layoutFamily === 'gold' ? '#D4AF37' : '#0f172a') }}>Grand Total</Text>
            <Text style={{ fontWeight: 'bold', color: themePreset === 'rose' || layoutFamily === 'minimal' ? '#881337' : (layoutFamily === 'gold' ? '#D4AF37' : '#0f172a') }}>{formatVal(invoice.grandTotal)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={{ color: '#64748b' }}>Amount Paid</Text>
            <Text style={{ fontWeight: 'medium' }}>{formatVal(invoice.amountPaid)}</Text>
          </View>

          {invoice.balanceDue > 0 && (
            <View style={styles.dueRow}>
              <Text style={{ fontWeight: 'bold' }}>Balance Due</Text>
              <Text style={{ fontWeight: 'bold' }}>{formatVal(invoice.balanceDue)}</Text>
            </View>
          )}
        </View>
      </View>

      {businessSettings?.pdfFooter && (
        <Text style={styles.footerText}>{businessSettings.pdfFooter}</Text>
      )}

      {businessSettings?.businessName && (
        <Text style={[styles.footerText, { bottom: 18, fontSize: 8, color: '#94a3b8' }]}>
          {businessSettings.businessName} | {businessSettings?.phone || ''} | {businessSettings?.address || ''}
        </Text>
      )}

      {!isPremium && (
        <Text style={styles.watermark}>Powered by BillQyro Invoicing SaaS</Text>
      )}
    </Page>
    );
  }


  return (
    <Document>
      {(layoutFamily === 'classic' || layoutFamily === 'retail' || layoutFamily === 'repair' || layoutFamily === 'teacher') 
        ? renderTemplate1() 
        : renderTemplate2()}
    </Document>
  );
};
