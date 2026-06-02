import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { formatCurrency } from '../utils/invoiceUtils';

// Register Fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf', fontWeight: 400 }, // Regular
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf', fontWeight: 700 } // Bold
  ]
});

// Styles mapping tailwind-like utility classes to React-PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    color: '#334155',
    backgroundColor: '#ffffff'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 20
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
  },
  logoFallback: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#6366f1',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: 'bold',
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
    lineHeight: 1.4,
  },
  invoiceInfoBox: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusPaid: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
  },
  statusPending: {
    backgroundColor: '#fffbeb',
    color: '#d97706',
  },
  statusUnpaid: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  invoiceLabel: {
    color: '#64748b',
    marginRight: 5,
  },
  invoiceValue: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  crmGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  crmSection: {
    width: '45%',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
  },
  tableCell: {
    fontSize: 10,
    color: '#334155',
  },
  colDesc: { width: '45%', paddingRight: 10 },
  colQty: { width: '15%', textAlign: 'center' },
  colRate: { width: '20%', textAlign: 'right' },
  colAmt: { width: '20%', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' },
  totalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20,
    marginTop: 10,
  },
  notesSection: {
    width: '50%',
  },
  notesBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  totalsSection: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  paymentSection: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrCode: {
    width: 100,
    height: 100,
    marginRight: 20,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  }
});

const PdfDocument = ({ invoice, businessSettings, qrCodeBase64 }) => {
  if (!invoice) return null;

  const regionalPrefs = invoice.regionalSettingsSnapshot || {
    country: businessSettings?.country || 'India',
    currency: businessSettings?.currency || '₹',
    currencyCode: businessSettings?.currencyCode || 'INR',
    language: businessSettings?.language || 'English',
    taxLabel: businessSettings?.taxLabel || 'GST',
    dateFormat: businessSettings?.dateFormat || 'DD/MM/YYYY',
    numberFormat: businessSettings?.numberFormat || 'Indian'
  };

  const paymentPrefs = invoice.paymentSettingsSnapshot || {
    paymentQrEnabled: businessSettings?.paymentQrEnabled || false,
    paymentMethod: businessSettings?.paymentMethod || 'Manual',
    payeeName: businessSettings?.payeeName || businessSettings?.businessName || '',
    showQrInPreview: businessSettings?.showQrInPreview !== undefined ? businessSettings?.showQrInPreview : true
  };

  const businessPrefs = invoice.businessSnapshot || {
    businessName: businessSettings?.businessName || 'BillQyro Store',
    logoUrl: businessSettings?.logoUrl || '',
    phone: businessSettings?.phone || '',
    email: businessSettings?.email || '',
    address: businessSettings?.address || '',
    gstNumber: businessSettings?.gstNumber || '',
  };

  const currencySymbol = regionalPrefs.currency || '₹';

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Paid': return styles.statusPaid;
      case 'Pending': return styles.statusPending;
      default: return styles.statusUnpaid;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header: Brand & Invoice Info */}
        <View style={styles.headerRow}>
          <View style={styles.brandContainer}>
            {businessPrefs.logoUrl ? (
              <Image src={businessPrefs.logoUrl} style={styles.logo} />
            ) : (
              <View style={styles.logoFallback}>
                <Text>{businessPrefs.businessName?.charAt(0) || 'B'}</Text>
              </View>
            )}
            <View>
              <Text style={styles.businessName}>{businessPrefs.businessName}</Text>
              {businessPrefs.gstNumber ? (
                <Text style={styles.metaText}>{regionalPrefs.taxLabel}: {businessPrefs.gstNumber}</Text>
              ) : null}
              <Text style={styles.metaText}>{businessPrefs.address}</Text>
              <Text style={styles.metaText}>Ph: {businessPrefs.phone}</Text>
              <Text style={styles.metaText}>{businessPrefs.email}</Text>
            </View>
          </View>

          <View style={styles.invoiceInfoBox}>
            <View style={[styles.statusBadge, getStatusStyle(invoice.paymentStatus)]}>
              <Text>{invoice.paymentStatus}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Invoice:</Text>
              <Text style={styles.invoiceValue}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Date:</Text>
              <Text style={styles.invoiceValue}>{invoice.date}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Due Date:</Text>
              <Text style={styles.invoiceValue}>{invoice.dueDate}</Text>
            </View>
          </View>
        </View>

        {/* CRM Info */}
        <View style={styles.crmGrid}>
          <View style={styles.crmSection}>
            <Text style={styles.sectionTitle}>Billed To</Text>
            <Text style={styles.customerName}>{invoice.customerName}</Text>
            <Text style={styles.metaText}>{invoice.customerAddress || 'No address provided'}</Text>
            <Text style={styles.metaText}>Phone: {invoice.customerPhone || 'N/A'}</Text>
            <Text style={styles.metaText}>Email: {invoice.customerEmail || 'N/A'}</Text>
          </View>
          <View style={[styles.crmSection, { alignItems: 'flex-end' }]}>
            <Text style={styles.sectionTitle}>Payment Terms</Text>
            <Text style={[styles.metaText, { textAlign: 'right', fontWeight: 'bold' }]}>
              Please pay on or before the due date.
            </Text>
            <Text style={[styles.metaText, { textAlign: 'right' }]}>
              Amounts are calculated in {currencySymbol}.
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Item Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmt]}>Total</Text>
          </View>
          
          {(invoice.items || []).map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: 3 }}>
                  {item.description || item.name || item.productName || item.serviceName || item.itemService || item.designNo || 'Item'}
                </Text>
                {item.workType && <Text style={{ fontSize: 8, color: '#64748b' }}>Work Type: {item.workType}</Text>}
                {item.size && <Text style={{ fontSize: 8, color: '#64748b' }}>Size: {item.size}</Text>}
              </View>
              <Text style={[styles.tableCell, styles.colQty]}>{item.qty !== undefined ? item.qty : item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colRate]}>{formatCurrency(item.rate !== undefined ? item.rate : item.price, currencySymbol, regionalPrefs.numberFormat)}</Text>
              <Text style={[styles.tableCell, styles.colAmt]}>{formatCurrency(item.amount !== undefined ? item.amount : item.total, currencySymbol, regionalPrefs.numberFormat)}</Text>
            </View>
          ))}

          {(!invoice.items || invoice.items.length === 0) && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8' }}>No items listed on this invoice.</Text>
            </View>
          )}
        </View>

        {/* Totals & Notes */}
        <View style={styles.totalsGrid}>
          <View style={styles.notesSection}>
            {invoice.notes && (
              <>
                <Text style={styles.sectionTitle}>Notes & Terms</Text>
                <View style={styles.notesBox}>
                  <Text style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic' }}>
                    "{invoice.notes}"
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.metaText}>Subtotal</Text>
              <Text style={{ fontWeight: 'bold' }}>{formatCurrency(invoice.subtotal, currencySymbol, regionalPrefs.numberFormat)}</Text>
            </View>
            
            {invoice.discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={{ fontSize: 9, color: '#dc2626' }}>Discount</Text>
                <Text style={{ fontSize: 9, color: '#dc2626', fontWeight: 'bold' }}>-{formatCurrency(invoice.discountAmount, currencySymbol, regionalPrefs.numberFormat)}</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.metaText}>{regionalPrefs.taxLabel || 'Tax'} ({invoice.taxPercentage}%)</Text>
              <Text style={{ fontWeight: 'bold' }}>{formatCurrency(invoice.taxAmount, currencySymbol, regionalPrefs.numberFormat)}</Text>
            </View>

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(invoice.grandTotal, currencySymbol, regionalPrefs.numberFormat)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment / QR Section */}
        {paymentPrefs?.paymentQrEnabled && paymentPrefs?.showQrInPreview && qrCodeBase64 && (
          <View style={styles.paymentSection}>
            <Image src={qrCodeBase64} style={styles.qrCode} />
            <View style={styles.paymentDetails}>
              <Text style={styles.sectionTitle}>Scan to View Live Invoice</Text>
              <Text style={styles.paymentTitle}>{paymentPrefs.payeeName}</Text>
              <Text style={styles.metaText}>Due Amount: {formatCurrency(invoice.balanceDue || invoice.grandTotal, currencySymbol, regionalPrefs.numberFormat)}</Text>
              <Text style={styles.metaText}>Invoice Number: {invoice.invoiceNumber}</Text>
              {paymentPrefs.paymentNote && (
                <Text style={{ fontSize: 8, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>Note: {paymentPrefs.paymentNote}</Text>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>SECURELY GENERATED VIA BILLQYRO INVOICING SAAS</Text>
        </View>

      </Page>
    </Document>
  );
};

export default PdfDocument;
