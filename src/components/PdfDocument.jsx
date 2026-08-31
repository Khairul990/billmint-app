import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { formatCurrency } from '../utils/invoiceUtils';
import { roundTo2 } from '../utils/invoiceMath';
import { t } from '../utils/i18n';
import { getInvoiceColumns, getItemValue } from '../utils/invoiceSchema';
import { PdfTemplateLayouts } from './invoice-templates/pdf-layouts/PdfTemplateLayouts';

// Using standard Helvetica to prevent network/CORS font fetch failures

// Styles mapping tailwind-like utility classes to React-PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 80,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#334155',
    backgroundColor: '#ffffff',
    lineHeight: 1.6,
  },
  pageA5: {
    padding: 24,
    paddingBottom: 60,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#334155',
    backgroundColor: '#ffffff',
    lineHeight: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderBottomColor: '#e2e8f0',
    paddingBottom: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 14,
  },
  logoFallback: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: '#6366f1',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
  },
  businessName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 3,
  },
  metaText: {
    fontSize: 8.5,
    color: '#64748b',
    marginBottom: 1.5,
    lineHeight: 1.5,
  },
  invoiceInfoBox: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
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
    marginBottom: 3,
  },
  invoiceLabel: {
    color: '#64748b',
    marginRight: 4,
  },
  invoiceValue: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  crmGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  crmSection: {
    width: '45%',
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 1,
  },
  customerName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 3,
  },
  table: {
    width: '100%',
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderBottomColor: '#cbd5e1',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingRight: 4,
    paddingLeft: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderBottomColor: '#f1f5f9',
    paddingVertical: 8,
  },
  tableCell: {
    fontSize: 9.5,
    color: '#334155',
    paddingRight: 4,
    paddingLeft: 4,
  },
  colDesc: { width: '45%', paddingRight: 10 },
  colQty: { width: '15%', textAlign: 'center' },
  colRate: { width: '20%', textAlign: 'right' },
  colAmt: { width: '20%', textAlign: 'right', fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  totalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderStyle: 'solid',
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
    marginTop: 8,
  },
  notesSection: {
    width: '50%',
  },
  notesBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  totalsSection: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderStyle: 'solid',
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    marginTop: 3,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  grandTotalValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#4f46e5',
  },
  paymentSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
  },
  qrCode: {
    width: 90,
    height: 90,
    marginRight: 16,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: 'center',
    borderTopWidth: 1,
    borderStyle: 'solid',
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  businessFooterName: {
    fontSize: 9,
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  thanksSection: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#f1f5f9',
    textAlign: 'center',
  },
  thanksText: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 1.6,
  },
  balanceDueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderStyle: 'solid',
    borderTopColor: '#fee2e2',
    paddingTop: 5,
    marginTop: 3,
  },
  balanceDueLabel: {
    fontSize: 9,
    color: '#dc2626',
    fontFamily: 'Helvetica-Bold',
  },
  balanceDueValue: {
    fontSize: 9,
    color: '#dc2626',
    fontFamily: 'Helvetica-Bold',
  },
});

import { getCategoryWording } from '../config/businessPresets';
import { getTemplateLayoutFamily } from '../services/TemplateEngine';
import { buildCanonicalRenderModel, resolveInvoiceTemplate } from '../utils/normalizeInvoiceModel';

const PdfDocument = ({ invoice, businessSettings, qrCodeBase64, safeLogoBase64, pageSize = 'A4', templateOverride = null }) => {
  if (!invoice) return null;

  const canonical = buildCanonicalRenderModel(invoice, businessSettings, templateOverride);
  const resolvedTemplateId = canonical?.rawTemplateId || resolveInvoiceTemplate(invoice, businessSettings, templateOverride);

  if (resolvedTemplateId && PdfTemplateLayouts[resolvedTemplateId]) {
    const SelectedPdfLayout = PdfTemplateLayouts[resolvedTemplateId];
    return (
      <Document>
        <Page size={pageSize} wrap>
          <SelectedPdfLayout 
            invoice={invoice} 
            businessSettings={businessSettings} 
            safeLogoBase64={safeLogoBase64} 
            qrCodeBase64={qrCodeBase64}
          />
        </Page>
      </Document>
    );
  }

  const {
    templateId,
    isDarkTheme,
    businessPrefs,
    regionalPrefs,
    paymentPrefs,
    bankDetails,
    currencySymbol: rawCurrencySymbol,
    categoryWords,
    financials
  } = canonical || buildCanonicalRenderModel(invoice, businessSettings, templateOverride);
  let currencySymbol = rawCurrencySymbol || '₹';
  // PDF standard fonts (Helvetica) do not support Unicode symbols like ₹ or ৳. Fallback to ASCII text.
  if (currencySymbol === '₹') currencySymbol = 'Rs. ';
  else if (currencySymbol === '৳') currencySymbol = 'Tk. ';

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Paid': return styles.statusPaid;
      case 'Pending': return styles.statusPending;
      default: return styles.statusUnpaid;
    }
  };

  // Dynamic Theme Colors
  let tPrimary = '#0f172a';
  let tBg = '#ffffff';
  let tAccent = '#4f46e5';
  let tText = '#334155';
  
  if (templateId === 'modern') { tPrimary = '#1e293b'; tAccent = '#3b82f6'; }
  else if (templateId === 'gold') { tPrimary = '#1a1a1a'; tAccent = '#d97706'; }
  else if (templateId === 'corporate') { tPrimary = '#27272a'; tAccent = '#059669'; }
  else if (templateId === 'minimal') { tPrimary = '#000000'; tAccent = '#000000'; tText = '#000000'; }
  else if (templateId === 'professional') { tPrimary = '#1e3a8a'; tAccent = '#1d4ed8'; }
  else if (templateId === 'retail') { tPrimary = '#0f172a'; tAccent = '#eab308'; }
  else if (templateId === 'embroidery') { tPrimary = '#831843'; tAccent = '#ec4899'; }
  else if (templateId === 'doctor') { tPrimary = '#064e3b'; tAccent = '#10b981'; }
  else if (templateId === 'repair') { tPrimary = '#451a03'; tAccent = '#f97316'; }
  else if (templateId === 'tailor') { tPrimary = '#1e1b4b'; tAccent = '#6366f1'; }
  else if (templateId === 'teacher') { tPrimary = '#064e3b'; tAccent = '#10b981'; }

  const isDarkHeader = templateId === 'modern' || templateId === 'gold';
  const hasCorporateBorder = templateId === 'corporate';

  const useA5 = pageSize === 'A5';
  const pageStyle = useA5 ? styles.pageA5 : styles.page;

  return (
    <Document>
      <Page size={pageSize} style={[pageStyle, { color: tText }]}>
        
        {/* Header: Brand & Invoice Info */}
        <View style={[styles.headerRow, isDarkHeader ? { backgroundColor: templateId === 'gold' ? '#111827' : tPrimary, padding: useA5 ? 12 : 20, color: templateId === 'gold' ? '#fef3c7' : '#fff', marginHorizontal: useA5 ? -24 : -36, marginTop: useA5 ? -24 : -36, marginBottom: useA5 ? 24 : 40, borderBottomWidth: templateId === 'gold' ? 1 : 0, borderBottomColor: 'rgba(245, 158, 11, 0.3)' } : hasCorporateBorder ? { borderBottomColor: '#064e3b', borderBottomWidth: 4 } : templateId === 'minimal' ? { borderBottomColor: '#000' } : {}]}>
          <View style={styles.brandContainer}>
            {safeLogoBase64 ? (
              <Image src={safeLogoBase64} style={useA5 ? { ...styles.logo, width: 36, height: 36, borderRadius: templateId === 'minimal' ? 0 : 8 } : { ...styles.logo, borderRadius: templateId === 'minimal' ? 0 : 8 }} />
            ) : (
              <View style={[styles.logoFallback, { backgroundColor: tAccent, borderRadius: templateId === 'minimal' ? 0 : 8 }, useA5 ? { width: 36, height: 36, fontSize: 18 } : {}]}>
                <Text style={{ color: '#fff' }}>{businessPrefs.businessName?.charAt(0) || 'B'}</Text>
              </View>
            )}
            <View>
              <Text style={[styles.businessName, useA5 ? { fontSize: 15 } : {}, isDarkHeader ? { color: templateId === 'gold' ? '#f59e0b' : '#fff' } : hasCorporateBorder ? { color: '#064e3b' } : { color: tPrimary }]}>{businessPrefs.businessName}</Text>
              {businessPrefs.gstNumber ? (
                <Text style={[styles.metaText, isDarkHeader ? { color: templateId === 'gold' ? 'rgba(254, 243, 199, 0.7)' : '#cbd5e1' } : {}]}>{regionalPrefs.taxLabel}: {businessPrefs.gstNumber}</Text>
              ) : null}
              {businessPrefs.address ? <Text style={[styles.metaText, isDarkHeader ? { color: templateId === 'gold' ? 'rgba(254, 243, 199, 0.7)' : '#cbd5e1' } : {}]}>{businessPrefs.address}</Text> : null}
              <Text style={[styles.metaText, isDarkHeader ? { color: templateId === 'gold' ? 'rgba(254, 243, 199, 0.7)' : '#cbd5e1' } : {}]}>Ph: {businessPrefs.phone}</Text>
              <Text style={[styles.metaText, isDarkHeader ? { color: templateId === 'gold' ? 'rgba(254, 243, 199, 0.7)' : '#cbd5e1' } : {}]}>{businessPrefs.email}</Text>
            </View>
          </View>

          <View style={styles.invoiceInfoBox}>
            <View style={[styles.statusBadge, getStatusStyle(financials.paymentStatus)]}>
              <Text>{financials.paymentStatus}</Text>
            </View>
            {templateId === 'retail' && (
              <View style={{ marginBottom: 6, padding: 4, borderWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0', borderRadius: 2, alignItems: 'center', backgroundColor: '#fff' }}>
                <Text style={{ fontFamily: 'Courier', fontSize: 6, letterSpacing: 2, color: '#1e293b', marginBottom: 2 }}>||| |||| || |||</Text>
                <Text style={{ fontSize: 5, color: '#94a3b8', letterSpacing: 1 }}>{invoice.invoiceNumber}</Text>
              </View>
            )}
            <View style={styles.invoiceRow}>
              <Text style={[styles.invoiceLabel, isDarkHeader ? { color: templateId === 'gold' ? 'rgba(254, 243, 199, 0.7)' : '#cbd5e1' } : {}]}>
                {invoice.billType === 'Estimate' ? 'Estimate:' : invoice.billType === 'Quotation' ? 'Quote:' : 'Invoice:'}
              </Text>
              <Text style={[styles.invoiceValue, isDarkHeader ? { color: templateId === 'gold' ? '#fef3c7' : '#fff' } : { color: tPrimary }]}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={[styles.invoiceLabel, isDarkHeader ? { color: templateId === 'gold' ? 'rgba(254, 243, 199, 0.7)' : '#cbd5e1' } : {}]}>Date:</Text>
              <Text style={[styles.invoiceValue, isDarkHeader ? { color: templateId === 'gold' ? '#fef3c7' : '#fff' } : { color: tPrimary }]}>{invoice.date}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={[styles.invoiceLabel, isDarkHeader ? { color: templateId === 'gold' ? 'rgba(254, 243, 199, 0.7)' : '#cbd5e1' } : {}]}>Due Date:</Text>
              <Text style={[styles.invoiceValue, isDarkHeader ? { color: templateId === 'gold' ? '#fef3c7' : '#fff' } : { color: tPrimary }]}>{invoice.dueDate}</Text>
            </View>
          </View>
        </View>

        {/* CRM Info */}
        <View style={styles.crmGrid}>
          <View style={styles.crmSection}>
            <Text style={[styles.sectionTitle, { color: tAccent }]}>{templateId === 'teacher' ? 'Student Details' : 'Bill To'}</Text>
            <Text style={[styles.customerName, { color: tPrimary }]}>{invoice.customerName}</Text>
            
            {templateId === 'doctor' && (
              <View style={{ marginTop: 6, marginBottom: 4, paddingLeft: 6, borderLeftWidth: 2, borderStyle: 'solid', borderLeftColor: tAccent }}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: tPrimary, marginBottom: 2 }}>Patient Details</Text>
                <Text style={styles.metaText}>Name: {invoice.customerName}</Text>
                {invoice.orderNotes && <Text style={styles.metaText}>Diagnosis/Ref: {invoice.orderNotes}</Text>}
              </View>
            )}

            <Text style={styles.metaText}>{invoice.customerAddress || 'No address provided'}</Text>
            <Text style={styles.metaText}>Phone: {invoice.customerPhone || 'N/A'}</Text>
            <Text style={styles.metaText}>Email: {invoice.customerEmail || 'N/A'}</Text>
          </View>
          <View style={[styles.crmSection, { alignItems: 'flex-end' }]}>
            {templateId === 'repair' && invoice.orderNotes ? (
              <>
                <Text style={styles.sectionTitle}>Device & Job Notes</Text>
                <View style={{ backgroundColor: '#fffbeb', padding: 8, borderRadius: 4, borderWidth: 1, borderStyle: 'solid', borderColor: '#fde68a', width: '100%' }}>
                  <Text style={{ fontSize: 9, color: '#92400e', lineHeight: 1.4 }}>{invoice.orderNotes}</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Payment Terms</Text>
                <Text style={[styles.metaText, { textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
                  Please pay on or before the due date.
                </Text>
                <Text style={[styles.metaText, { textAlign: 'right' }]}>
                  Amounts calculated in {currencySymbol}.
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={[styles.tableHeaderRow, templateId === 'minimal' ? { borderTopWidth: 1, borderTopColor: '#000', paddingTop: 6, borderBottomColor: '#000' } : { borderBottomColor: tAccent }]}>
            {getInvoiceColumns(invoice, businessSettings).map((col) => (
              <Text key={col.id} style={[styles.tableHeaderCell, { width: col.width, textAlign: col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left' }]}>
                {col.label}
              </Text>
            ))}
          </View>
          
          {(invoice.items || []).map((item, idx) => (
            <View key={idx} style={[styles.tableRow, templateId === 'minimal' ? { borderBottomColor: '#ccc' } : {}]} wrap={false}>
              {getInvoiceColumns(invoice, businessSettings).map((col) => {
                const val = getItemValue(item, col.id, invoice.billType);
                
                if (col.id === 'sn') {
                  return (
                    <Text key={col.id} style={[styles.tableCell, { width: col.width, textAlign: col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left' }]}>
                      {idx + 1}
                    </Text>
                  );
                }

                if (col.id === 'item') {
                  return (
                    <View key={col.id} style={{ width: col.width, paddingRight: 4 }}>
                      <Text style={{ fontFamily: 'Helvetica-Bold', color: tPrimary, marginBottom: 2 }}>
                        {item.description || item.name || item.productName || item.serviceName || item.itemService || item.designNo || 'Item'}
                      </Text>
                      {item.workType && <Text style={[(templateId === 'embroidery' || templateId === 'tailor') ? { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#be185d', marginTop: 2 } : { fontSize: 7.5, color: '#64748b' }]}>Work Type: {item.workType}</Text>}
                      {item.size && <Text style={[(templateId === 'embroidery' || templateId === 'tailor') ? { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#4338ca', marginTop: 1 } : { fontSize: 7.5, color: '#64748b' }]}>Size: {item.size}</Text>}
                      {item.sizeVariant && <Text style={{ fontSize: 7.5, color: '#64748b' }}>Variant: {item.sizeVariant}</Text>}
                    </View>
                  );
                }

                if (col.id === 'amount') {
                  return (
                    <Text key={col.id} style={[styles.tableCell, { width: col.width, textAlign: col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left', fontFamily: 'Helvetica-Bold', color: '#0f172a' }]}>
                      {formatCurrency(val, currencySymbol, regionalPrefs.numberFormat)}
                    </Text>
                  );
                }

                if (col.id === 'rate' || col.id === 'discount' || col.id === 'tax') {
                  return (
                    <Text key={col.id} style={[styles.tableCell, { width: col.width, textAlign: col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left' }]}>
                      {col.id === 'discount' && val > 0 ? '-' : ''}{formatCurrency(val, currencySymbol, regionalPrefs.numberFormat)}
                    </Text>
                  );
                }
                
                if (col.id === 'qty') {
                  return (
                    <Text key={col.id} style={[styles.tableCell, { width: col.width, textAlign: col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left', fontFamily: 'Helvetica-Bold', color: '#64748b' }]}>
                      {val} {item.unit ? item.unit.toUpperCase() : ''}
                    </Text>
                  );
                }

                return (
                  <Text key={col.id} style={[styles.tableCell, { width: col.width, textAlign: col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left' }]}>
                    {val}
                  </Text>
                );
              })}
            </View>
          ))}

          {(!invoice.items || invoice.items.length === 0) && (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8' }}>No items listed on this invoice.</Text>
            </View>
          )}
        </View>

        {/* Totals & Notes */}
        <View style={styles.totalsGrid}>
          <View style={styles.notesSection}>
            {invoice.notes && (
              <>
                <Text style={styles.sectionTitle}>{categoryWords.noteLabel}</Text>
                <View style={styles.notesBox}>
                  <Text style={{ fontSize: 9, color: '#64748b', lineHeight: 1.6 }}>
                    {invoice.notes}
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.metaText}>Subtotal</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>{formatCurrency(financials.subtotal, currencySymbol, regionalPrefs.numberFormat)}</Text>
            </View>
            
            {(businessSettings?.invoiceBuilderSettings?.showDiscount !== false) && financials.discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={{ fontSize: 8.5, color: '#dc2626' }}>Discount</Text>
                <Text style={{ fontSize: 8.5, color: '#dc2626', fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>-{formatCurrency(financials.discountAmount, currencySymbol, regionalPrefs.numberFormat)}</Text>
              </View>
            )}

            {(businessSettings?.invoiceBuilderSettings?.showTax !== false) && financials.taxAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.metaText}>{regionalPrefs.taxLabel || 'Tax'} ({invoice.taxPercentage || 0}%)</Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>{formatCurrency(financials.taxAmount, currencySymbol, regionalPrefs.numberFormat)}</Text>
              </View>
            )}

            {(businessSettings?.invoiceBuilderSettings?.showShipping) && financials.shipping > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.metaText}>Shipping</Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>{formatCurrency(financials.shipping, currencySymbol, regionalPrefs.numberFormat)}</Text>
              </View>
            )}

            {(financials.previousDue > 0 || financials.amountPaid > 0) && (
              <View style={styles.totalRow}>
                <Text style={styles.metaText}>Current Invoice</Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>{formatCurrency(financials.currentInvoiceTotal, currencySymbol, regionalPrefs.numberFormat)}</Text>
              </View>
            )}

            {((businessSettings?.invoiceBuilderSettings?.showOldDue) || financials.previousDue > 0) && (
              <View style={styles.totalRow}>
                <Text style={{ fontSize: 8.5, color: '#d97706' }}>Previous / Old Due</Text>
                <Text style={{ fontSize: 8.5, color: '#d97706', fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>+{formatCurrency(financials.previousDue, currencySymbol, regionalPrefs.numberFormat)}</Text>
              </View>
            )}

            {((businessSettings?.invoiceBuilderSettings?.showOldDue) || financials.previousDue > 0) && (
              <View style={styles.totalRow}>
                <Text style={styles.metaText}>Total Receivable</Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>{formatCurrency(financials.totalReceivable, currencySymbol, regionalPrefs.numberFormat)}</Text>
              </View>
            )}

            {financials.amountPaid > 0 && (
              <View style={styles.totalRow}>
                <Text style={{ fontSize: 8.5, color: '#16a34a' }}>Amount Paid</Text>
                <Text style={{ fontSize: 8.5, color: '#16a34a', fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>-{formatCurrency(financials.amountPaid, currencySymbol, regionalPrefs.numberFormat)}</Text>
              </View>
            )}

            <View style={[styles.summaryRow, styles.balanceDueRow, { borderTopColor: tAccent }]} wrap={false}>
              <Text style={[styles.balanceDueLabel, { color: tPrimary }]}>
                {(financials.amountPaid > 0 || financials.previousDue > 0) ? 'Balance Due' : 'Grand Total'}
              </Text>
              <Text style={[styles.balanceDueValue, { color: tAccent }]}>
                {formatCurrency(financials.customerTotalDue ?? (financials.previousDue > 0 ? (financials.remainingOldDue + financials.currentBillDue) : financials.balanceDue), currencySymbol, regionalPrefs.numberFormat)}
              </Text>
            </View>
          </View>
        </View>

        {/* Thanks Message */}
        <View style={[styles.thanksSection, templateId === 'minimal' ? { backgroundColor: 'transparent', borderColor: '#000000' } : {}]} wrap={false}>
          <Text style={styles.thanksText}>
            Thank you for your business, {invoice.customerName || 'valued customer'}!
          </Text>
        </View>

        {/* Doctor Disclaimer */}
        {templateId === 'doctor' && (
          <View style={{ marginTop: 16, padding: 8, borderLeftWidth: 3, borderStyle: 'solid', borderLeftColor: tAccent, backgroundColor: tBg }}>
            <Text style={{ fontSize: 7.5, color: tPrimary, lineHeight: 1.5 }}>
              Disclaimer: This document is for billing purposes only and does not constitute medical advice or a formal prescription unless explicitly signed by a registered practitioner.
            </Text>
          </View>
        )}

        {/* Payment / QR Section */}
        {paymentPrefs?.paymentQrEnabled && paymentPrefs?.showQrInPreview && qrCodeBase64 && (
          <View style={[styles.paymentSection, templateId === 'minimal' ? { backgroundColor: 'transparent', borderColor: '#000000' } : {}]} wrap={false}>
            <Image src={qrCodeBase64} style={useA5 ? { ...styles.qrCode, width: 70, height: 70 } : styles.qrCode} />
            <View style={styles.paymentDetails}>
              <Text style={[styles.sectionTitle, { color: tAccent }]}>
                {paymentPrefs?.paymentMethod === 'Manual' ? 'Scan to View Live Invoice' : `Scan to Pay with ${paymentPrefs?.paymentMethod || 'UPI'}`}
              </Text>
              <Text style={[styles.paymentTitle, useA5 ? { fontSize: 10 } : {}, { color: tPrimary }]}>{paymentPrefs.payeeName}</Text>
              <Text style={styles.metaText}>Due: {formatCurrency((financials.remainingOldDue !== undefined && financials.currentBillDue !== undefined) ? roundTo2(financials.remainingOldDue + financials.currentBillDue) : (financials.totalReceivable || financials.balanceDue || 0), currencySymbol, regionalPrefs.numberFormat)}</Text>
              <Text style={styles.metaText}>Invoice: {invoice.invoiceNumber}</Text>
              {paymentPrefs.paymentNote && (
                <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 3 }}>Note: {paymentPrefs.paymentNote}</Text>
              )}
            </View>
          </View>
        )}

        {templateId === 'professional' && (
          <View style={{ marginTop: 24, paddingRight: 24, alignItems: 'flex-end' }} wrap={false}>
            <View style={{ width: 140, borderBottomWidth: 1, borderStyle: 'solid', borderBottomColor: tPrimary, marginBottom: 4 }} />
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: tPrimary, textTransform: 'uppercase', textAlign: 'center', width: 140 }}>Authorized Signatory</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          {businessPrefs.businessName && (
            <Text style={styles.businessFooterName}>{businessPrefs.businessName}</Text>
          )}
          <Text style={styles.footerText}>SECURELY GENERATED VIA BILLQYRO INVOICING SAAS</Text>
        </View>

      </Page>
    </Document>
  );
};

export default PdfDocument;
