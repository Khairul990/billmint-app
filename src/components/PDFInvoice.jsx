import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register Google Fonts to support regional currency symbols and scripts
// Using reliable raw github links to prevent loading hangs
Font.register({
  family: 'Noto Sans',
  src: 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf'
});

Font.register({
  family: 'Noto Sans Bengali',
  src: 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf'
});

// Register a clean, premium font hierarchy if desired, otherwise use standard helvetica
const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontSize: 10,
    fontFamily: 'Noto Sans',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  watermark: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footerText: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.5,
  },
  
  // COMMON HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 18,
    marginBottom: 18,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a1128',
  },
  businessSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 3,
  },
  invoiceMeta: {
    alignItems: 'right',
    width: 150,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  metaText: {
    fontSize: 9,
    color: '#475569',
    marginTop: 3,
  },

  // CLIENT REGISTRY
  clientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 8,
    marginBottom: 18,
  },
  clientBox: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  clientInfo: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2,
  },

  // SMART TABLE
  table: {
    width: '100%',
    marginBottom: 18,
  },
  tableHeader: {
    flexDirection: 'row',
    color: '#ffffff',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 7,
    alignItems: 'center',
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
    marginTop: 15,
  },
  notesBox: {
    width: '55%',
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.5,
  },
  notesHeader: {
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 5,
  },
  totalsBox: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: '#cbd5e1',
    fontWeight: 'bold',
    fontSize: 11,
  },
  dueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#fee2e2',
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 10,
    borderRadius: 4,
    paddingHorizontal: 6,
    marginTop: 4,
  },

  // TEMPLATE 1 OVERRIDES (COMPACT)
  compactPage: {
    padding: 18,
    fontSize: 9,
    fontFamily: 'Noto Sans',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  compactHeader: {
    alignItems: 'center',
    textAlign: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 5,
  },
  compactTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#475569',
    color: '#ffffff',
    padding: 5,
    fontWeight: 'bold',
    fontSize: 8,
    borderRadius: 3,
  },
  compactColSN: { width: '8%', textAlign: 'center' },
  compactColDesc: { width: '52%' },
  compactColQty: { width: '12%', textAlign: 'center' },
  compactColRate: { width: '14%', textAlign: 'right' },
  compactColAmt: { width: '14%', textAlign: 'right' },
});

export const PDFInvoice = ({ invoice, businessSettings: liveBusinessSettings, isPremium }) => {
  const activeSettings = invoice?.businessSnapshot || liveBusinessSettings;
  const activePaymentSettings = invoice?.paymentSettingsSnapshot || activeSettings;
  
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
  const templateId = businessSettings?.invoiceTemplate || 'modern';
  
  const themePreset = businessSettings?.themePreset || 'light';
  let brandColor = '#19C3A3'; 
  let headerColor = '#0a1128';
  let tableHeaderBg = '#14284B';
  let totalHighlightBg = '#eff6ff';

  if (themePreset === 'dark') {
    brandColor = '#9FE5CF';
    headerColor = '#071B3A';
    tableHeaderBg = '#071B3A';
    totalHighlightBg = 'rgba(159, 229, 207, 0.12)';
  } else if (themePreset === 'rose') {
    brandColor = '#F43F5E';
    headerColor = '#881337';
    tableHeaderBg = '#881337';
    totalHighlightBg = '#FFF1F2';
  } else {
    brandColor = '#19C3A3';
    headerColor = '#14284B';
    tableHeaderBg = '#14284B';
    totalHighlightBg = '#ECFDF5';
  }

  const dynamicFont = regionalPrefs.country === 'Bangladesh' ? 'Noto Sans Bengali' : 'Noto Sans';

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
  
  const qrEnabled = businessSettings?.paymentQrEnabled && businessSettings?.showQrInPdf;
  const paymentMethod = businessSettings?.paymentMethod || 'UPI';
  
  const dueAmount = (invoice.balanceDue !== undefined && invoice.balanceDue !== null && invoice.balanceDue !== 0)
    ? invoice.balanceDue
    : invoice.grandTotal;

  let qrText = '';
  if (qrEnabled) {
    const verifStr = invoice.verificationCode ? ` [Code: ${invoice.verificationCode}]` : '';
    if (paymentMethod === 'UPI') {
      const upiId = businessSettings.upiId || '';
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

  const renderTemplate1 = () => (
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
          <Text style={styles.compactColSN}>S.N.</Text>
          {invoice.billType === 'grocery' ? (
            <>
              <Text style={{ width: '40%' }}>Product Name</Text>
              <Text style={{ width: '12%', textAlign: 'center' }}>Unit</Text>
            </>
          ) : invoice.billType === 'service' ? (
            <>
              <Text style={{ width: '25%' }}>Service</Text>
              <Text style={{ width: '27%' }}>Description</Text>
            </>
          ) : invoice.billType === 'tailor' ? (
            <Text style={styles.compactColDesc}>Work/Measurement</Text>
          ) : invoice.billType === 'doctor' || invoice.billType === 'teacher' ? (
            <Text style={{ width: '48%' }}>Fee Description</Text>
          ) : invoice.billType === 'repair' ? (
            <>
              <Text style={{ width: '25%' }}>Service</Text>
              <Text style={{ width: '27%' }}>Details</Text>
            </>
          ) : invoice.billType === 'retail' ? (
            <>
              <Text style={{ width: '30%' }}>Product / Variant</Text>
              <Text style={{ width: '12%', textAlign: 'center' }}>Disc</Text>
            </>
          ) : (
            <Text style={styles.compactColDesc}>Item & Design Description</Text>
          )}
          {invoice.billType === 'doctor' || invoice.billType === 'teacher' ? (
            <Text style={styles.compactColQty}>Month</Text>
          ) : invoice.billType === 'retail' ? (
            <Text style={{ width: '12%', textAlign: 'center' }}>Qty</Text>
          ) : (
            <Text style={styles.compactColQty}>Qty</Text>
          )}
          {invoice.billType === 'doctor' || invoice.billType === 'teacher' || invoice.billType === 'repair' ? (
            <Text style={styles.compactColRate}>Amount</Text>
          ) : invoice.billType === 'retail' ? (
            <Text style={{ width: '12%', textAlign: 'right' }}>Price</Text>
          ) : (
            <Text style={styles.compactColRate}>Rate</Text>
          )}
          <Text style={styles.compactColAmt}>Amount</Text>
        </View>

        {(invoice.items || []).map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.compactColSN}>{idx + 1}</Text>
            {invoice.billType === 'grocery' ? (
              <>
                <Text style={{ width: '40%' }}>{item.description || 'Product'}</Text>
                <Text style={{ width: '12%', textAlign: 'center' }}>{item.size || 'N/A'}</Text>
              </>
            ) : invoice.billType === 'service' ? (
              <>
                <Text style={{ width: '25%' }}>{item.designNo || 'Service'}</Text>
                <Text style={{ width: '27%' }}>{item.description || 'N/A'}</Text>
              </>
            ) : invoice.billType === 'tailor' ? (
              <Text style={styles.compactColDesc}>{item.description || 'Work'}</Text>
            ) : invoice.billType === 'doctor' || invoice.billType === 'teacher' ? (
              <Text style={{ width: '48%' }}>{item.description || 'Fee'}</Text>
            ) : invoice.billType === 'repair' ? (
              <>
                <Text style={{ width: '25%' }}>{item.designNo || 'Repair'}</Text>
                <Text style={{ width: '27%' }}>{item.description || 'N/A'}</Text>
              </>
            ) : invoice.billType === 'retail' ? (
              <>
                <Text style={{ width: '30%' }}>{item.description || 'Product'}{item.size ? ` (${item.size})` : ''}</Text>
                <Text style={{ width: '12%', textAlign: 'center' }}>{item.discount || 0}</Text>
              </>
            ) : (
              <Text style={styles.compactColDesc}>
                {item.workType ? `[${item.workType}] ` : ''}
                {item.description || 'Stitching Service'} 
                {item.designNo && item.designNo !== 'N/A' ? ` (${item.designNo})` : ''}
              </Text>
            )}
            {invoice.billType === 'retail' ? (
              <Text style={{ width: '12%', textAlign: 'center' }}>{item.qty}</Text>
            ) : (
              <Text style={styles.compactColQty}>{item.qty}</Text>
            )}
            {invoice.billType === 'retail' ? (
              <Text style={{ width: '12%', textAlign: 'right' }}>{parseFloat(item.rate).toFixed(2)}</Text>
            ) : (
              <Text style={styles.compactColRate}>{parseFloat(item.rate).toFixed(2)}</Text>
            )}
            <Text style={styles.compactColAmt}>{parseFloat(item.amount).toFixed(2)}</Text>
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
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: themePreset === 'rose' ? '#881337' : '#0f172a' }}>Grand Total</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: themePreset === 'rose' ? '#881337' : '#0f172a' }}>{formatVal(invoice.grandTotal)}</Text>
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

  const renderTemplate2 = () => (
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
          <Text style={styles.colSN}>S.N.</Text>
          {invoice.billType === 'grocery' ? (
            <>
              <Text style={{ width: '43%' }}>Product Name</Text>
              <Text style={{ width: '15%', textAlign: 'center' }}>Unit</Text>
              <Text style={{ width: '10%', textAlign: 'center' }}>Qty</Text>
              <Text style={{ width: '15%', textAlign: 'right' }}>Unit Price</Text>
            </>
          ) : invoice.billType === 'service' ? (
            <>
              <Text style={{ width: '25%' }}>Service Name</Text>
              <Text style={{ width: '30%' }}>Description</Text>
              <Text style={{ width: '10%', textAlign: 'center' }}>Qty</Text>
              <Text style={{ width: '18%', textAlign: 'right' }}>Rate</Text>
            </>
          ) : invoice.billType === 'tailor' ? (
            <>
              <Text style={{ width: '40%' }}>Work/Measurement</Text>
              <Text style={{ width: '10%', textAlign: 'center' }}>Qty</Text>
              <Text style={{ width: '10%', textAlign: 'right' }}>Rate</Text>
            </>
          ) : invoice.billType === 'doctor' || invoice.billType === 'teacher' ? (
            <>
              <Text style={{ width: '45%' }}>Fee Description</Text>
              <Text style={{ width: '10%', textAlign: 'center' }}>Month</Text>
              <Text style={{ width: '10%', textAlign: 'right' }}>Amount</Text>
            </>
          ) : invoice.billType === 'repair' ? (
            <>
              <Text style={{ width: '15%' }}>Service</Text>
              <Text style={{ width: '30%' }}>Details</Text>
              <Text style={{ width: '8%', textAlign: 'center' }}>Qty</Text>
              <Text style={{ width: '10%', textAlign: 'right' }}>Amount</Text>
            </>
          ) : invoice.billType === 'retail' ? (
            <>
              <Text style={{ width: '28%' }}>Product</Text>
              <Text style={{ width: '10%', textAlign: 'center' }}>Variant</Text>
              <Text style={{ width: '8%', textAlign: 'center' }}>Qty</Text>
              <Text style={{ width: '10%', textAlign: 'right' }}>Price</Text>
              <Text style={{ width: '8%', textAlign: 'right' }}>Disc</Text>
            </>
          ) : (
            <>
              <Text style={styles.colDesign}>Design No</Text>
              <Text style={styles.colWorkType}>Work Type</Text>
              <Text style={styles.colDesc}>Description</Text>
              <Text style={styles.colSize}>Size</Text>
              <Text style={styles.colQty}>Qty</Text>
              <Text style={styles.colRate}>Rate</Text>
            </>
          )}
          <Text style={styles.colAmt}>Amount</Text>
        </View>

        {(invoice.items || []).map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.colSN}>{idx + 1}</Text>
            {invoice.billType === 'grocery' ? (
              <>
                <Text style={{ width: '43%' }}>{item.description || 'Item'}</Text>
                <Text style={{ width: '15%', textAlign: 'center' }}>{item.size || 'N/A'}</Text>
                <Text style={{ width: '10%', textAlign: 'center' }}>{item.qty}</Text>
                <Text style={{ width: '15%', textAlign: 'right' }}>{parseFloat(item.rate).toFixed(2)}</Text>
              </>
            ) : invoice.billType === 'service' ? (
              <>
                <Text style={{ width: '25%' }}>{item.designNo || 'Service'}</Text>
                <Text style={{ width: '30%' }}>{item.description || 'N/A'}</Text>
                <Text style={{ width: '10%', textAlign: 'center' }}>{item.qty}</Text>
                <Text style={{ width: '18%', textAlign: 'right' }}>{parseFloat(item.rate).toFixed(2)}</Text>
              </>
            ) : invoice.billType === 'tailor' ? (
              <>
                <Text style={{ width: '40%' }}>{item.description || 'Work'}</Text>
                <Text style={{ width: '10%', textAlign: 'center' }}>{item.qty}</Text>
                <Text style={{ width: '10%', textAlign: 'right' }}>{parseFloat(item.rate).toFixed(2)}</Text>
              </>
            ) : invoice.billType === 'doctor' || invoice.billType === 'teacher' ? (
              <>
                <Text style={{ width: '45%' }}>{item.description || 'Fee'}</Text>
                <Text style={{ width: '10%', textAlign: 'center' }}>{item.qty}</Text>
                <Text style={{ width: '10%', textAlign: 'right' }}>{parseFloat(item.rate).toFixed(2)}</Text>
              </>
            ) : invoice.billType === 'repair' ? (
              <>
                <Text style={{ width: '15%' }}>{item.designNo || 'Repair'}</Text>
                <Text style={{ width: '30%' }}>{item.description || 'N/A'}</Text>
                <Text style={{ width: '8%', textAlign: 'center' }}>{item.qty}</Text>
                <Text style={{ width: '10%', textAlign: 'right' }}>{parseFloat(item.rate).toFixed(2)}</Text>
              </>
            ) : invoice.billType === 'retail' ? (
              <>
                <Text style={{ width: '28%' }}>{item.description || 'Product'}</Text>
                <Text style={{ width: '10%', textAlign: 'center' }}>{item.size || 'N/A'}</Text>
                <Text style={{ width: '8%', textAlign: 'center' }}>{item.qty}</Text>
                <Text style={{ width: '10%', textAlign: 'right' }}>{parseFloat(item.rate).toFixed(2)}</Text>
                <Text style={{ width: '8%', textAlign: 'right' }}>{item.discount || 0}</Text>
              </>
            ) : (
              <>
                <Text style={styles.colDesign}>{item.designNo || 'N/A'}</Text>
                <Text style={styles.colWorkType}>{item.workType || 'Standard'}</Text>
                <Text style={styles.colDesc}>{item.description || 'Stitching Work'}</Text>
                <Text style={styles.colSize}>{item.size || 'N/A'}</Text>
                <Text style={styles.colQty}>{item.qty}</Text>
                <Text style={styles.colRate}>{parseFloat(item.rate).toFixed(2)}</Text>
              </>
            )}
            <Text style={styles.colAmt}>{parseFloat(item.amount).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.totalsContainer}>
        <View style={styles.notesBox}>
          {qrCodeUrl ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Image src={qrCodeUrl} style={{ width: 65, height: 65, borderRadius: 4 }} />
              <View style={{ flex: 1, fontSize: 9 }}>
                <Text style={[styles.notesHeader, { fontSize: 10 }]}>Scan to Pay with {paymentMethod}</Text>
                {paymentMethod === 'UPI' && businessSettings.upiId && (
                  <Text style={{ marginTop: 3 }}>UPI ID: <Text style={{ fontWeight: 'bold' }}>{businessSettings.upiId}</Text></Text>
                )}
                {paymentMethod === 'bKash' && businessSettings.bkashNumber && (
                  <Text style={{ marginTop: 3 }}>bKash: <Text style={{ fontWeight: 'bold' }}>{businessSettings.bkashNumber}</Text></Text>
                )}
                {paymentMethod === 'Nagad' && businessSettings.nagadNumber && (
                  <Text style={{ marginTop: 3 }}>Nagad: <Text style={{ fontWeight: 'bold' }}>{businessSettings.nagadNumber}</Text></Text>
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
            <Text style={{ fontWeight: 'bold', color: themePreset === 'rose' ? '#881337' : '#0f172a' }}>Grand Total</Text>
            <Text style={{ fontWeight: 'bold', color: themePreset === 'rose' ? '#881337' : '#0f172a' }}>{formatVal(invoice.grandTotal)}</Text>
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


  return (
    <Document>
      {templateId === 'classic' ? renderTemplate1() : renderTemplate2()}
    </Document>
  );
};
