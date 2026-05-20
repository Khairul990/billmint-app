import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Register a clean, premium font hierarchy if desired, otherwise use standard helvetica
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  watermark: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  
  // COMMON HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 15,
    marginBottom: 15,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a1128', // Dark blue corporate accent
  },
  businessSub: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  invoiceMeta: {
    alignItems: 'right',
    width: 150,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  metaText: {
    fontSize: 8,
    color: '#475569',
    marginTop: 2,
  },

  // CLIENT REGISTRY
  clientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  clientBox: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  clientName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  clientInfo: {
    fontSize: 8,
    color: '#475569',
    marginTop: 2,
  },

  // SMART TABLE
  table: {
    width: '100%',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0a1128',
    color: '#ffffff',
    padding: 6,
    fontWeight: 'bold',
    fontSize: 8,
    borderRadius: 3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 6,
    alignItems: 'center',
  },
  colSN: { width: '6%', textAlign: 'center' },
  colDesign: { width: '12%' },
  colWorkType: { width: '15%' },
  colDesc: { width: '32%' },
  colSize: { width: '10%', textAlign: 'center' },
  colQty: { width: '8%', textAlign: 'center' },
  colRate: { width: '8%', textAlign: 'right' },
  colAmt: { width: '9%', textAlign: 'right' },

  // TOTALS SECTION
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  notesBox: {
    width: '55%',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.4,
  },
  notesHeader: {
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 4,
  },
  totalsBox: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 4,
    fontWeight: 'bold',
  },
  dueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#fee2e2',
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 9,
  },

  // TEMPLATE 1 OVERRIDES (COMPACT)
  compactPage: {
    padding: 15,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  compactHeader: {
    alignItems: 'center',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 4,
  },
  compactTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#475569',
    color: '#ffffff',
    padding: 4,
    fontWeight: 'bold',
    fontSize: 7,
    borderRadius: 2,
  },
  compactColSN: { width: '8%', textAlign: 'center' },
  compactColDesc: { width: '52%' },
  compactColQty: { width: '12%', textAlign: 'center' },
  compactColRate: { width: '14%', textAlign: 'right' },
  compactColAmt: { width: '14%', textAlign: 'right' },
});

export const PDFInvoice = ({ invoice, businessSettings, isPremium }) => {
  const currencySymbol = businessSettings?.currency || '₹';
  const templateId = invoice.templateId || 'template-2';

  const formatVal = (num) => {
    return `${currencySymbol}${parseFloat(num || 0).toFixed(2)}`;
  };

  const renderTemplate1 = () => (
    <Page size="A5" style={styles.compactPage}>
      {/* Centered Compact Header */}
      <View style={styles.compactHeader}>
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0a1128' }}>
          {businessSettings?.businessName || 'BillMint Store'}
        </Text>
        <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>
          {businessSettings?.address || ''} | {businessSettings?.phone || ''}
        </Text>
        <Text style={styles.compactTitle}>QUICK INVOICE</Text>
        <Text style={{ fontSize: 8, color: '#475569', marginTop: 3 }}>
          #{invoice.invoiceNumber} | Date: {invoice.date}
        </Text>
      </View>

      {/* Customer summary */}
      <View style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 7, color: '#94a3b8', fontWeight: 'bold' }}>BILL TO:</Text>
        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#0f172a' }}>{invoice.customerName}</Text>
        <Text style={{ fontSize: 7, color: '#475569', marginTop: 1 }}>
          Ph: {invoice.customerPhone || 'N/A'} | Pay Type: {invoice.paymentType || 'Cash'}
        </Text>
      </View>

      {/* Compact Item Table */}
      <View style={styles.table}>
        <View style={styles.compactTableHeader}>
          <Text style={styles.compactColSN}>S.N.</Text>
          <Text style={styles.compactColDesc}>Item & Design Description</Text>
          <Text style={styles.compactColQty}>Qty</Text>
          <Text style={styles.compactColRate}>Rate</Text>
          <Text style={styles.compactColAmt}>Amount</Text>
        </View>

        {invoice.items.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.compactColSN}>{idx + 1}</Text>
            <Text style={styles.compactColDesc}>
              {item.workType ? `[${item.workType}] ` : ''}
              {item.description || 'Stitching Service'} 
              {item.designNo && item.designNo !== 'N/A' ? ` (${item.designNo})` : ''}
            </Text>
            <Text style={styles.compactColQty}>{item.qty}</Text>
            <Text style={styles.compactColRate}>{parseFloat(item.rate).toFixed(2)}</Text>
            <Text style={styles.compactColAmt}>{parseFloat(item.amount).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Small Totals */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5 }}>
        <View style={{ width: '50%' }}>
          <View style={styles.totalRow}>
            <Text style={{ fontSize: 7, color: '#64748b' }}>Subtotal</Text>
            <Text style={{ fontSize: 7 }}>{formatVal(invoice.subtotal)}</Text>
          </View>
          {invoice.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ fontSize: 7, color: '#64748b' }}>Discount</Text>
              <Text style={{ fontSize: 7 }}>-{formatVal(invoice.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>Grand Total</Text>
            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{formatVal(invoice.grandTotal)}</Text>
          </View>
          {invoice.balanceDue > 0 && (
            <View style={styles.dueRow}>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>Balance Due</Text>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{formatVal(invoice.balanceDue)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Small Watermark */}
      {!isPremium && (
        <Text style={styles.watermark}>Powered by BillMint Invoicing SaaS</Text>
      )}
    </Page>
  );

  const renderTemplate2 = () => (
    <Page size="A4" style={styles.page}>
      {/* Elegant Invoice Header */}
      <View style={styles.header}>
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>
            {businessSettings?.businessName || 'BillMint Technologies'}
          </Text>
          <Text style={styles.businessSub}>
            Address: {businessSettings?.address || 'N/A'}
          </Text>
          <Text style={styles.businessSub}>
            Email: {businessSettings?.email || 'N/A'} | Phone: {businessSettings?.phone || 'N/A'}
          </Text>
          {businessSettings?.gstNumber && (
            <Text style={[styles.businessSub, { fontWeight: 'bold', color: '#0a1128' }]}>
              Tax ID / GSTIN: {businessSettings.gstNumber}
            </Text>
          )}
        </View>

        <View style={styles.invoiceMeta}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={[styles.metaText, { fontWeight: 'bold', marginTop: 5 }]}>
            Invoice No: {invoice.invoiceNumber}
          </Text>
          <Text style={styles.metaText}>Date: {invoice.date}</Text>
          <Text style={styles.metaText}>Due Date: {invoice.dueDate}</Text>
        </View>
      </View>

      {/* Customer details registry */}
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

      {/* smart item A4 table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colSN}>S.N.</Text>
          <Text style={styles.colDesign}>Design No</Text>
          <Text style={styles.colWorkType}>Work Type</Text>
          <Text style={styles.colDesc}>Description of Services</Text>
          <Text style={styles.colSize}>Size</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colRate}>Rate</Text>
          <Text style={styles.colAmt}>Amount</Text>
        </View>

        {invoice.items.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.colSN}>{idx + 1}</Text>
            <Text style={styles.colDesign}>{item.designNo || 'N/A'}</Text>
            <Text style={styles.colWorkType}>{item.workType || 'Standard'}</Text>
            <Text style={styles.colDesc}>{item.description || 'Stitching Work'}</Text>
            <Text style={styles.colSize}>{item.size || 'N/A'}</Text>
            <Text style={styles.colQty}>{item.qty}</Text>
            <Text style={styles.colRate}>{parseFloat(item.rate).toFixed(2)}</Text>
            <Text style={styles.colAmt}>{parseFloat(item.amount).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totals segment */}
      <View style={styles.totalsContainer}>
        <View style={styles.notesBox}>
          <Text style={styles.notesHeader}>Notes & Business Conditions:</Text>
          <Text>• Please check all details before payment.</Text>
          <Text>• No return or exchange after payment completion.</Text>
          <Text>• Payment is due by the due date mentioned.</Text>
          <Text>• Thank you for your embroidery and service business!</Text>
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={{ color: '#64748b' }}>Subtotal</Text>
            <Text>{formatVal(invoice.subtotal)}</Text>
          </View>
          
          {invoice.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: '#64748b' }}>Discount</Text>
              <Text>-{formatVal(invoice.discountAmount)}</Text>
            </View>
          )}

          {invoice.taxAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: '#64748b' }}>Tax ({invoice.taxPercentage}%)</Text>
              <Text>{formatVal(invoice.taxAmount)}</Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={{ fontWeight: 'bold' }}>Grand Total</Text>
            <Text style={{ fontWeight: 'bold' }}>{formatVal(invoice.grandTotal)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={{ color: '#64748b' }}>Amount Paid</Text>
            <Text>{formatVal(invoice.amountPaid)}</Text>
          </View>

          {invoice.balanceDue > 0 && (
            <View style={styles.dueRow}>
              <Text style={{ fontWeight: 'bold' }}>Balance Due</Text>
              <Text style={{ fontWeight: 'bold' }}>{formatVal(invoice.balanceDue)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Free tier watermark */}
      {!isPremium && (
        <Text style={styles.watermark}>Powered by BillMint Invoicing SaaS</Text>
      )}
    </Page>
  );

  return (
    <Document>
      {templateId === 'template-1' ? renderTemplate1() : renderTemplate2()}
    </Document>
  );
};
