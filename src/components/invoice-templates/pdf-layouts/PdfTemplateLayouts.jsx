import React from 'react';
import { View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer';

const formatCurrency = (amount) => {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
  return `Rs. ${formatted}`;
};

// Common Styles
const s = StyleSheet.create({
  page: { backgroundColor: '#ffffff', fontFamily: 'Helvetica', padding: 40 },
  row: { flexDirection: 'row' },
  col: { flexDirection: 'column' },
  justifyBetween: { justifyContent: 'space-between' },
  alignCenter: { alignItems: 'center' },
  textRight: { textAlign: 'right' },
  textCenter: { textAlign: 'center' },
  bold: { fontFamily: 'Helvetica-Bold' },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  mb32: { marginBottom: 32 },
  p16: { padding: 16 },
  wFull: { width: '100%' },
  wHalf: { width: '50%' },
  wThird: { width: '33.33%' },
  wTwoThirds: { width: '66.66%' },
});

// 1. Minimal Classic
const MinimalClassicPdf = ({ invoice, businessSettings, safeLogoBase64, qrCodeBase64 }) => {
  const totals = {
    subtotal: invoice.subtotal,
    discount: invoice.discountAmount,
    tax: invoice.taxAmount,
    grandTotal: invoice.grandTotal
  };

  return (
    <View style={s.page}>
      <View style={[s.row, s.justifyBetween, s.mb32]}>
        <View>
          <Text style={[s.bold, { fontSize: 28, color: '#111', marginBottom: 8 }]}>INVOICE</Text>
          <Text style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>{invoice.invoiceNumber}</Text>
          <Text style={{ fontSize: 10, color: '#666' }}>{invoice.date}</Text>
        </View>
        <View style={[s.col, { alignItems: 'flex-end' }]}>
          {safeLogoBase64 && <Image src={safeLogoBase64} style={{ height: 40, marginBottom: 8, objectFit: 'contain' }} />}
          <Text style={[s.bold, { fontSize: 14 }]}>{businessSettings?.businessName || 'Your Business'}</Text>
          {businessSettings?.email && <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }}>{businessSettings.email}</Text>}
          {businessSettings?.phone && <Text style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{businessSettings.phone}</Text>}
        </View>
      </View>

      <View style={s.mb32}>
        <Text style={[s.bold, { fontSize: 8, color: '#999', textTransform: 'uppercase', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 4 }]}>BILLED TO</Text>
        <Text style={[s.bold, { fontSize: 12 }]}>{invoice.customerName || 'Walk-in Customer'}</Text>
        {invoice.customerPhone && <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }}>{invoice.customerPhone}</Text>}
      </View>

      <View style={s.mb32}>
        <View style={[s.row, s.bold, { fontSize: 10, borderBottomWidth: 2, borderBottomColor: '#111', paddingBottom: 8, marginBottom: 8 }]}>
          <Text style={{ flex: 1 }}>Item</Text>
          {data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <Text style={{ width: 60, textAlign: 'right' }}>Qty</Text>}
          {data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <Text style={{ width: 80, textAlign: 'right' }}>Price</Text>}
          {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text style={{ width: 80, textAlign: 'right' }}>Total</Text>}
        </View>
        {invoice.items?.map((item, i) => (
          <View key={i} style={[s.row, { fontSize: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 }]}>
            <Text style={{ flex: 1 }}>{item.name || item.itemService || 'Item'}</Text>
            <Text style={{ width: 60, textAlign: 'right' }}>{item.qty}</Text>
            <Text style={{ width: 80, textAlign: 'right' }}>{formatCurrency(item.rate || item.price)}</Text>
            <Text style={{ width: 80, textAlign: 'right' }}>{formatCurrency(item.qty * (item.rate || item.price))}</Text>
          </View>
        ))}
      </View>

      <View style={[s.row, { justifyContent: 'flex-end', marginBottom: 32 }]}>
        <View style={{ width: 200 }}>
          <View style={[s.row, s.justifyBetween, s.mb4]}><Text style={{ fontSize: 10, color: '#666' }}>Subtotal:</Text><Text style={{ fontSize: 10 }}>{formatCurrency(totals.subtotal)}</Text></View>
          <View style={[s.row, s.justifyBetween, s.mb4]}><Text style={{ fontSize: 10, color: '#666' }}>Discount:</Text><Text style={{ fontSize: 10 }}>{formatCurrency(totals.discount)}</Text></View>
          <View style={[s.row, s.justifyBetween, s.mb8]}><Text style={{ fontSize: 10, color: '#666' }}>Tax:</Text><Text style={{ fontSize: 10 }}>{formatCurrency(totals.tax)}</Text></View>
          <View style={[s.row, s.justifyBetween, s.bold, { fontSize: 14, borderTopWidth: 2, borderTopColor: '#111', paddingTop: 8 }]}>
            <Text>Total:</Text><Text>{formatCurrency(totals.grandTotal)}</Text>
          </View>
        </View>
      </View>

      <View style={[s.row, s.justifyBetween, s.alignCenter, { marginTop: 16 }]}>
        <View style={{ width: '50%' }}>
          {qrCodeBase64 && (
            <View>
              <Text style={[s.bold, { fontSize: 8, color: '#999', textTransform: 'uppercase', marginBottom: 4 }]}>SCAN TO PAY</Text>
              <Image src={qrCodeBase64} style={{ width: 80, height: 80 }} />
            </View>
          )}
        </View>
        <View style={{ width: '50%', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 16 }}>
          {invoice.notes && (
            <View>
              <Text style={[s.bold, { fontSize: 10, marginBottom: 4 }]}>Notes / Terms</Text>
              <Text style={{ fontSize: 9, color: '#666' }}>{invoice.notes}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// 2. Modern Corporate
const ModernCorporatePdf = ({ invoice, businessSettings, safeLogoBase64, qrCodeBase64 }) => {
  return (
    <View style={[s.page, { padding: 0 }]}>
      <View style={[s.row, s.justifyBetween, s.alignCenter, { backgroundColor: '#2563eb', padding: 40, color: '#fff' }]}>
        <View>
          <Text style={[s.bold, { fontSize: 24, textTransform: 'uppercase', letterSpacing: 2 }]}>INVOICE</Text>
          <Text style={{ fontSize: 10, marginTop: 4, color: '#bfdbfe' }}># {invoice.invoiceNumber} | {invoice.date}</Text>
        </View>
        <View>
          {safeLogoBase64 ? (
            <Image src={safeLogoBase64} style={{ height: 40, backgroundColor: '#fff', padding: 4, borderRadius: 4, objectFit: 'contain' }} />
          ) : (
            <Text style={[s.bold, { fontSize: 16 }]}>{businessSettings?.businessName || 'Your Business'}</Text>
          )}
        </View>
      </View>

      <View style={{ padding: 40 }}>
        <View style={[s.row, s.justifyBetween, s.mb32]}>
          <View>
            <Text style={[s.bold, { fontSize: 9, color: '#2563eb', textTransform: 'uppercase', marginBottom: 8 }]}>INVOICE TO</Text>
            <Text style={[s.bold, { fontSize: 12 }]}>{invoice.customerName || 'Walk-in Customer'}</Text>
            {invoice.customerPhone && <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }}>{invoice.customerPhone}</Text>}
          </View>
          <View style={[s.col, { alignItems: 'flex-end' }]}>
            <Text style={[s.bold, { fontSize: 9, color: '#2563eb', textTransform: 'uppercase', marginBottom: 8 }]}>PAY TO</Text>
            <Text style={[s.bold, { fontSize: 12 }]}>{businessSettings?.businessName || 'Your Business'}</Text>
            {businessSettings?.email && <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }}>{businessSettings.email}</Text>}
          </View>
        </View>

        <View style={s.mb32}>
          <View style={[s.row, s.bold, { fontSize: 9, backgroundColor: '#f3f4f6', padding: 12, color: '#4b5563', textTransform: 'uppercase' }]}>
            {data.invoiceColumns?.find(c => c.id === 'description')?.visible !== false && <Text style={{ flex: 1 }}>Description</Text>}
            {data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <Text style={{ width: 50, textAlign: 'center' }}>Qty</Text>}
            {data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <Text style={{ width: 80, textAlign: 'right' }}>Price</Text>}
            {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text style={{ width: 80, textAlign: 'right' }}>Total</Text>}
          </View>
          {invoice.items?.map((item, i) => (
            <View key={i} style={[s.row, { fontSize: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', padding: 12 }]}>
              <Text style={{ flex: 1 }}>{item.name || item.itemService || 'Item'}</Text>
              <Text style={{ width: 50, textAlign: 'center' }}>{item.qty}</Text>
              <Text style={{ width: 80, textAlign: 'right' }}>{formatCurrency(item.rate || item.price)}</Text>
              <Text style={[s.bold, { width: 80, textAlign: 'right' }]}>{formatCurrency(item.qty * (item.rate || item.price))}</Text>
            </View>
          ))}
        </View>

        <View style={[s.row, { justifyContent: 'flex-end', marginBottom: 32 }]}>
          <View style={{ width: 220, backgroundColor: '#f9fafb', padding: 16, borderRadius: 8 }}>
            <View style={[s.row, s.justifyBetween, s.mb4]}><Text style={{ fontSize: 10, color: '#666' }}>Subtotal</Text><Text style={{ fontSize: 10 }}>{formatCurrency(invoice.subtotal)}</Text></View>
            <View style={[s.row, s.justifyBetween, s.mb4]}><Text style={{ fontSize: 10, color: '#666' }}>Discount</Text><Text style={{ fontSize: 10 }}>{formatCurrency(invoice.discountAmount)}</Text></View>
            <View style={[s.row, s.justifyBetween, s.mb8]}><Text style={{ fontSize: 10, color: '#666' }}>Tax</Text><Text style={{ fontSize: 10 }}>{formatCurrency(invoice.taxAmount)}</Text></View>
            <View style={[s.row, s.justifyBetween, s.bold, { fontSize: 14, color: '#2563eb', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 }]}>
              {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text>Total</Text>}<Text>{formatCurrency(invoice.grandTotal)}</Text>
            </View>
          </View>
        </View>

        <View style={[s.row, s.justifyBetween, { marginTop: 16 }]}>
          <View style={{ width: '40%' }}>
            {qrCodeBase64 && (
              <View style={{ padding: 8, backgroundColor: '#eff6ff', borderRadius: 4, alignSelf: 'flex-start' }}>
                <Text style={[s.bold, { fontSize: 8, color: '#1e40af', textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' }]}>SCAN & PAY</Text>
                <Image src={qrCodeBase64} style={{ width: 70, height: 70 }} />
              </View>
            )}
          </View>
          <View style={{ width: '60%' }}>
            {invoice.notes && (
              <View style={{ backgroundColor: '#eff6ff', borderLeftWidth: 4, borderLeftColor: '#2563eb', padding: 12 }}>
                <Text style={[s.bold, { fontSize: 9, color: '#1e40af', marginBottom: 4 }]}>NOTES</Text>
                <Text style={{ fontSize: 9, color: '#1e3a8a' }}>{invoice.notes}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

// 3. Teal Bold Header
const TealBoldHeaderPdf = ({ invoice, businessSettings, safeLogoBase64, qrCodeBase64 }) => {
  return (
    <View style={[s.page, { padding: 0 }]}>
      {/* Sidebar background that repeats on all pages */}
      <View fixed style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '33%', backgroundColor: '#115e59' }} />
      
      {/* Sidebar Content */}
      <View fixed style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '33%', padding: 32 }}>
        {safeLogoBase64 ? (
           <Image src={safeLogoBase64} style={{ height: 50, width: 50, backgroundColor: '#fff', padding: 4, borderRadius: 8, objectFit: 'contain', marginBottom: 24 }} />
        ) : (
           <View style={{ width: 50, height: 50, backgroundColor: '#0d9488', borderRadius: 8, marginBottom: 24, justifyContent: 'center', alignItems: 'center' }}>
             <Text style={[s.bold, { color: '#fff', fontSize: 24 }]}>{businessSettings?.businessName?.charAt(0) || 'B'}</Text>
           </View>
        )}
        <Text style={[s.bold, { fontSize: 14, color: '#fff', marginBottom: 16 }]}>{businessSettings?.businessName || 'Your Business'}</Text>
        <Text style={{ fontSize: 9, color: '#99f6e4', marginBottom: 4 }}>{businessSettings?.email}</Text>
        <Text style={{ fontSize: 9, color: '#99f6e4' }}>{businessSettings?.phone}</Text>

        <View style={{ marginTop: 64 }}>
          <Text style={[s.bold, { fontSize: 9, color: '#2dd4bf', textTransform: 'uppercase', marginBottom: 8 }]}>BILLED TO</Text>
          <Text style={[s.bold, { fontSize: 14, color: '#fff', lineHeight: 1.2 }]}>{invoice.customerName || 'Walk-in Customer'}</Text>
          <Text style={{ fontSize: 9, color: '#99f6e4', marginTop: 8 }}>{invoice.customerPhone}</Text>
        </View>
      </View>

      <View style={{ marginLeft: '33%', width: '67%', backgroundColor: '#fafafa', padding: 32 }}>
        <View style={[s.col, { alignItems: 'flex-end', marginBottom: 48 }]}>
          <Text style={[s.bold, { fontSize: 36, color: '#134e4a', letterSpacing: -1, marginBottom: 8 }]}>INVOICE</Text>
          <Text style={[s.bold, { fontSize: 10, color: '#0d9488', marginBottom: 2 }]}>No. {invoice.invoiceNumber}</Text>
          <Text style={{ fontSize: 9, color: '#666' }}>Date: {invoice.date}</Text>
        </View>

        <View style={s.mb32}>
          <View style={[s.row, s.bold, { fontSize: 10, borderBottomWidth: 2, borderBottomColor: '#115e59', paddingBottom: 8, color: '#134e4a' }]}>
            {data.invoiceColumns?.find(c => c.id === 'description')?.visible !== false && <Text style={{ flex: 1 }}>Description</Text>}
            {data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <Text style={{ width: 50, textAlign: 'center' }}>Qty</Text>}
            {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text style={{ width: 80, textAlign: 'right' }}>Amount</Text>}
          </View>
          {invoice.items?.map((item, i) => (
            <View key={i} style={[s.row, { fontSize: 10, borderBottomWidth: 1, borderBottomColor: '#e5e5e5', paddingVertical: 12 }]}>
              <Text style={[s.bold, { flex: 1, color: '#333' }]}>{item.name || item.itemService || 'Item'}</Text>
              <Text style={{ width: 50, textAlign: 'center', color: '#666' }}>{item.qty}</Text>
              <Text style={[s.bold, { width: 80, textAlign: 'right', color: '#134e4a' }]}>{formatCurrency(item.qty * (item.rate || item.price))}</Text>
            </View>
          ))}
        </View>

        <View style={[s.row, { justifyContent: 'flex-end', marginTop: 32 }]}>
          <View style={{ width: 180 }}>
            <View style={[s.row, s.justifyBetween, s.mb4]}><Text style={{ fontSize: 10, color: '#666' }}>Subtotal</Text><Text style={[s.bold, { fontSize: 10, color: '#333' }]}>{formatCurrency(invoice.subtotal)}</Text></View>
            <View style={[s.row, s.justifyBetween, s.mb4]}><Text style={{ fontSize: 10, color: '#666' }}>Discount</Text><Text style={[s.bold, { fontSize: 10, color: '#333' }]}>{formatCurrency(invoice.discountAmount)}</Text></View>
            <View style={[s.row, s.justifyBetween, { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e5e5', paddingBottom: 8 }]}><Text style={{ fontSize: 10, color: '#666' }}>Tax</Text><Text style={[s.bold, { fontSize: 10, color: '#333' }]}>{formatCurrency(invoice.taxAmount)}</Text></View>
            <View style={[s.row, s.justifyBetween, s.bold, { fontSize: 16, color: '#134e4a', paddingTop: 8 }]}>
              {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text>Total</Text>}<Text>{formatCurrency(invoice.grandTotal)}</Text>
            </View>
          </View>
        </View>

        <View style={[s.row, s.justifyBetween, s.alignCenter, { marginTop: 64 }]}>
          <View style={{ width: '50%' }}>
            {invoice.notes && (
              <View>
                <Text style={[s.bold, { fontSize: 9, color: '#333', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }]}>THANK YOU</Text>
                <Text style={{ fontSize: 9, color: '#666' }}>{invoice.notes}</Text>
              </View>
            )}
          </View>
          <View style={{ width: '50%', alignItems: 'flex-end' }}>
            {qrCodeBase64 && (
              <View style={{ border: '2pt solid #ccfbf1', padding: 4, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center' }}>
                <Image src={qrCodeBase64} style={{ width: 60, height: 60 }} />
                <Text style={[s.bold, { fontSize: 7, color: '#115e59', marginTop: 4, textTransform: 'uppercase' }]}>Scan to Pay</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

// 4. Sage Green Curved
const SageGreenCurvedPdf = ({ invoice, businessSettings, safeLogoBase64, qrCodeBase64 }) => {
  return (
    <View style={[s.page, { padding: 0, backgroundColor: '#f8faf9' }]}>
      <View style={{ backgroundColor: '#6b8e7b', padding: 40, borderBottomRightRadius: 80, marginBottom: 40 }}>
        <View style={[s.row, s.justifyBetween]}>
          <View>
            <Text style={[s.bold, { fontSize: 32, color: '#fff', marginBottom: 8 }]}>INVOICE</Text>
            <Text style={{ fontSize: 10, color: '#eef2ef', marginBottom: 2 }}>{invoice.invoiceNumber}</Text>
            <Text style={{ fontSize: 10, color: '#eef2ef' }}>{invoice.date}</Text>
          </View>
          <View style={[s.col, { alignItems: 'flex-end' }]}>
            {safeLogoBase64 ? (
              <Image src={safeLogoBase64} style={{ height: 40, backgroundColor: 'rgba(255,255,255,0.2)', padding: 4, borderRadius: 4, objectFit: 'contain', marginBottom: 8 }} />
            ) : (
              <Text style={[s.bold, { fontSize: 16, color: '#fff', marginBottom: 8 }]}>{businessSettings?.businessName || 'Your Business'}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 40 }}>
        <View style={[s.row, s.justifyBetween, s.mb32]}>
          <View style={{ width: '45%' }}>
            <Text style={[s.bold, { fontSize: 9, color: '#6b8e7b', textTransform: 'uppercase', marginBottom: 8 }]}>BILL TO</Text>
            <Text style={[s.bold, { fontSize: 14, color: '#333' }]}>{invoice.customerName || 'Walk-in Customer'}</Text>
            {invoice.customerPhone && <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }}>{invoice.customerPhone}</Text>}
          </View>
          <View style={{ width: '45%', borderLeftWidth: 1, borderLeftColor: '#d1dbd5', paddingLeft: 16 }}>
            <Text style={[s.bold, { fontSize: 9, color: '#6b8e7b', textTransform: 'uppercase', marginBottom: 8 }]}>FROM</Text>
            <Text style={[s.bold, { fontSize: 12, color: '#333' }]}>{businessSettings?.businessName || 'Your Business'}</Text>
            {businessSettings?.email && <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }}>{businessSettings.email}</Text>}
          </View>
        </View>

        <View style={s.mb32}>
          <View style={[s.row, s.bold, { fontSize: 10, borderBottomWidth: 2, borderBottomColor: '#6b8e7b', paddingBottom: 8, color: '#3d5a49' }]}>
            <Text style={{ flex: 1 }}>Service / Item</Text>
            {data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <Text style={{ width: 50, textAlign: 'center' }}>Qty</Text>}
            {data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <Text style={{ width: 80, textAlign: 'right' }}>Rate</Text>}
            {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text style={{ width: 80, textAlign: 'right' }}>Amount</Text>}
          </View>
          {invoice.items?.map((item, i) => (
            <View key={i} style={[s.row, { fontSize: 10, borderBottomWidth: 1, borderBottomColor: '#d1dbd5', paddingVertical: 12 }]}>
              <Text style={{ flex: 1, color: '#333' }}>{item.name || item.itemService || 'Item'}</Text>
              <Text style={{ width: 50, textAlign: 'center', color: '#666' }}>{item.qty}</Text>
              <Text style={{ width: 80, textAlign: 'right', color: '#666' }}>{formatCurrency(item.rate || item.price)}</Text>
              <Text style={[s.bold, { width: 80, textAlign: 'right', color: '#4a6d59' }]}>{formatCurrency(item.qty * (item.rate || item.price))}</Text>
            </View>
          ))}
        </View>

        <View style={[s.row, { justifyContent: 'flex-end', marginBottom: 32 }]}>
          <View style={{ width: 200, backgroundColor: '#fff', padding: 16, borderRadius: 8, border: '1pt solid #e8efe9' }}>
            <View style={[s.row, s.justifyBetween, s.mb4]}><Text style={{ fontSize: 10, color: '#666' }}>Subtotal</Text><Text style={{ fontSize: 10 }}>{formatCurrency(invoice.subtotal)}</Text></View>
            <View style={[s.row, s.justifyBetween, s.mb4]}><Text style={{ fontSize: 10, color: '#666' }}>Discount</Text><Text style={{ fontSize: 10 }}>{formatCurrency(invoice.discountAmount)}</Text></View>
            <View style={[s.row, s.justifyBetween, s.mb8]}><Text style={{ fontSize: 10, color: '#666' }}>Tax</Text><Text style={{ fontSize: 10 }}>{formatCurrency(invoice.taxAmount)}</Text></View>
            <View style={[s.row, s.justifyBetween, s.bold, { fontSize: 14, color: '#3d5a49', borderTopWidth: 1, borderTopColor: '#e8efe9', paddingTop: 8 }]}>
              {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text>Total</Text>}<Text>{formatCurrency(invoice.grandTotal)}</Text>
            </View>
          </View>
        </View>
        <View style={[s.row, s.justifyBetween, s.alignCenter, { marginTop: 32 }]}>
          <View style={{ width: '50%' }}>
            {qrCodeBase64 && (
              <View style={[s.row, s.alignCenter, { backgroundColor: '#fff', padding: 8, borderRadius: 8, border: '1pt solid #e8efe9', alignSelf: 'flex-start' }]}>
                <Image src={qrCodeBase64} style={{ width: 50, height: 50, borderRadius: 4, marginRight: 8 }} />
                <View>
                  <Text style={[s.bold, { fontSize: 8, color: '#3d5a49', textTransform: 'uppercase' }]}>Scan to Pay</Text>
                  <Text style={{ fontSize: 7, color: '#999', marginTop: 2 }}>Use any supported app</Text>
                </View>
              </View>
            )}
          </View>
          <View style={{ width: '50%', alignItems: 'flex-end' }}>
            {invoice.notes && (
              <View style={{ maxWidth: 200, textAlign: 'right' }}>
                <Text style={[s.bold, { fontSize: 10, color: '#3d5a49', marginBottom: 4 }]}>Notes</Text>
                <Text style={{ fontSize: 9, color: '#666' }}>{invoice.notes}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

// 5. Creative Agency
const CreativeAgencyPdf = ({ invoice, businessSettings, safeLogoBase64, qrCodeBase64 }) => {
  return (
    <View style={[s.page, { padding: 0, backgroundColor: '#111111' }]}>
      {/* Sidebar background */}
      <View fixed style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 40, backgroundColor: '#ff4a6e' }} />
      
      <View style={{ marginLeft: 40, padding: 40, flex: 1 }}>
        <View style={[s.row, s.justifyBetween, s.mb32]}>
          <View>
            {safeLogoBase64 ? (
              <Image src={safeLogoBase64} style={{ height: 40, backgroundColor: '#fff', padding: 4, borderRadius: 4, objectFit: 'contain', marginBottom: 12 }} />
            ) : (
              <Text style={[s.bold, { fontSize: 20, color: '#fff', marginBottom: 8 }]}>{businessSettings?.businessName || 'AGENCY'}</Text>
            )}
            <Text style={{ fontSize: 10, color: '#9ca3af' }}>{businessSettings?.email}</Text>
          </View>
          <View style={[s.col, { alignItems: 'flex-end' }]}>
            <Text style={[s.bold, { fontSize: 14, color: '#ff4a6e', marginBottom: 4 }]}>#{invoice.invoiceNumber}</Text>
            <Text style={{ fontSize: 10, color: '#6b7280' }}>{invoice.date}</Text>
          </View>
        </View>

        <View style={s.mb32}>
          <Text style={[s.bold, { fontSize: 9, color: '#ff4a6e', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }]}>CLIENT</Text>
          <Text style={[s.bold, { fontSize: 16, color: '#fff' }]}>{invoice.customerName || 'Walk-in Customer'}</Text>
          {invoice.customerPhone && <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>{invoice.customerPhone}</Text>}
        </View>

        <View style={s.mb32}>
          <View style={[s.row, s.bold, { fontSize: 9, color: '#6b7280', borderBottomWidth: 1, borderBottomColor: '#374151', paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }]}>
            <Text style={{ flex: 1 }}>Task / Item</Text>
            {data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <Text style={{ width: 50, textAlign: 'center' }}>Qty</Text>}
            {data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <Text style={{ width: 80, textAlign: 'right' }}>Price</Text>}
          </View>
          {invoice.items?.map((item, i) => (
            <View key={i} style={[s.row, { fontSize: 10, borderBottomWidth: 1, borderBottomColor: '#1f2937', paddingVertical: 12 }]}>
              <Text style={{ flex: 1, color: '#d1d5db' }}>{item.name || item.itemService || 'Item'}</Text>
              <Text style={{ width: 50, textAlign: 'center', color: '#6b7280' }}>{item.qty}</Text>
              <Text style={[s.bold, { width: 80, textAlign: 'right', color: '#fff' }]}>{formatCurrency(item.qty * (item.rate || item.price))}</Text>
            </View>
          ))}
        </View>

        <View style={[s.row, { justifyContent: 'flex-end', marginBottom: 32 }]}>
          <View style={{ width: 220, backgroundColor: '#161616', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#374151' }}>
            <View style={[s.row, s.justifyBetween, s.mb4]}><Text style={{ fontSize: 10, color: '#6b7280' }}>Subtotal</Text><Text style={{ fontSize: 10, color: '#d1d5db' }}>{formatCurrency(invoice.subtotal)}</Text></View>
            <View style={[s.row, s.justifyBetween, s.mb4]}><Text style={{ fontSize: 10, color: '#6b7280' }}>Discount</Text><Text style={{ fontSize: 10, color: '#d1d5db' }}>{formatCurrency(invoice.discountAmount)}</Text></View>
            <View style={[s.row, s.justifyBetween, s.mb8]}><Text style={{ fontSize: 10, color: '#6b7280' }}>Tax</Text><Text style={{ fontSize: 10, color: '#d1d5db' }}>{formatCurrency(invoice.taxAmount)}</Text></View>
            <View style={[s.row, s.justifyBetween, s.bold, { fontSize: 14, color: '#fff', borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 12, marginTop: 4 }]}>
              {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text style={{ color: '#ff4a6e' }}>Total</Text>}<Text>{formatCurrency(invoice.grandTotal)}</Text>
            </View>
          </View>
        </View>

        <View style={[s.row, s.justifyBetween, s.alignCenter, { marginTop: 48, borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 32 }]}>
          <View style={{ width: '50%' }}>
            {invoice.notes && (
              <View>
                <Text style={[s.bold, { fontSize: 9, color: '#ff4a6e', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }]}>Remarks</Text>
                <Text style={{ fontSize: 9, color: '#d1d5db' }}>{invoice.notes}</Text>
              </View>
            )}
          </View>
          <View style={{ width: '50%', alignItems: 'flex-end' }}>
            {qrCodeBase64 && (
              <View style={{ backgroundColor: '#161616', border: '1pt solid #374151', padding: 8, borderRadius: 8, alignItems: 'center' }}>
                <Image src={qrCodeBase64} style={{ width: 50, height: 50, backgroundColor: '#fff', padding: 2, borderRadius: 4 }} />
                <Text style={[s.bold, { fontSize: 7, color: '#9ca3af', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }]}>Pay Now</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

// 6. Purple Corporate
const PurpleCorporatePdf = ({ invoice, businessSettings, safeLogoBase64, qrCodeBase64 }) => (
  <View style={[{ padding: 30, backgroundColor: '#ffffff', minHeight: '100%', fontFamily: 'Helvetica' }]} wrap={true}>
    <View style={[s.row, s.justifyBetween, { borderBottomWidth: 3, borderBottomColor: '#6A5ACD', paddingBottom: 15, marginBottom: 20 }]}>
      <View style={{ width: 60, height: 60, backgroundColor: '#6A5ACD', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
        {safeLogoBase64 ? (
          <Image src={safeLogoBase64} style={{ width: 40, height: 40, objectFit: 'contain' }} />
        ) : (
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{businessSettings?.businessName?.charAt(0) || 'B'}</Text>
        )}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#6A5ACD', textTransform: 'uppercase' }}>Invoice</Text>
        <Text style={{ fontSize: 10, color: '#6A5ACD', marginTop: 2, fontWeight: 'bold' }}>#{invoice.invoiceNumber}</Text>
      </View>
    </View>

    <View style={[s.row, { backgroundColor: '#f0e6ff', padding: 15, borderRadius: 6, marginBottom: 20 }]}>
      <View style={s.wHalf}>
        <Text style={{ fontSize: 8, color: '#555', textTransform: 'uppercase', marginBottom: 2, fontWeight: 'bold' }}>Invoice Date</Text>
        <Text style={{ fontSize: 10, color: '#222', marginBottom: 6 }}>{invoice.date}</Text>
        <Text style={{ fontSize: 8, color: '#555', textTransform: 'uppercase', marginBottom: 2, fontWeight: 'bold' }}>Due Date</Text>
        <Text style={{ fontSize: 10, color: '#222' }}>{invoice.date}</Text>
      </View>
      <View style={[s.wHalf, { alignItems: 'flex-end', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 8, color: '#555', textTransform: 'uppercase', marginBottom: 2, fontWeight: 'bold' }}>Amount Due</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#6A5ACD' }}>{formatCurrency(invoice.totals?.grandTotal)}</Text>
      </View>
    </View>

    <View style={[s.row, { marginBottom: 20 }]}>
      <View style={s.wHalf}>
        <Text style={{ fontSize: 8, color: '#555', textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold' }}>From</Text>
        <Text style={{ fontSize: 10, color: '#222', fontWeight: 'bold', marginBottom: 2 }}>{businessSettings?.businessName || 'Your Business'}</Text>
        <Text style={{ fontSize: 9, color: '#444' }}>{businessSettings?.email}</Text>
        <Text style={{ fontSize: 9, color: '#444' }}>{businessSettings?.phone}</Text>
      </View>
      <View style={s.wHalf}>
        <Text style={{ fontSize: 8, color: '#555', textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold' }}>Bill To</Text>
        <Text style={{ fontSize: 10, color: '#222', fontWeight: 'bold', marginBottom: 2 }}>{invoice.customerName}</Text>
        <Text style={{ fontSize: 9, color: '#444' }}>{invoice.customerPhone}</Text>
      </View>
    </View>

    <View style={{ marginBottom: 20 }}>
      <View style={[s.row, { backgroundColor: '#6A5ACD', padding: 8, borderTopLeftRadius: 4, borderTopRightRadius: 4 }]}>
        {data.invoiceColumns?.find(c => c.id === 'description')?.visible !== false && <Text style={{ width: '40%', fontSize: 9, color: '#fff', fontWeight: 'bold', textTransform: 'uppercase' }}>Description</Text>}
        {data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>Qty</Text>}
        {data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Price</Text>}
        {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Total</Text>}
      </View>
      {invoice.items?.map((item, i) => (
        <View key={i} style={[s.row, { padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ width: '40%', fontSize: 9, color: '#222' }}>{item.name || 'Item'}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#444', textAlign: 'center' }}>{item.qty}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#444', textAlign: 'right' }}>{formatCurrency(item.price)}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#222', fontWeight: 'bold', textAlign: 'right' }}>{formatCurrency(item.qty * item.price)}</Text>
        </View>
      ))}
    </View>

    <View style={[s.row, { justifyContent: 'space-between' }]}>
      <View style={s.wHalf}>
        {qrCodeBase64 && (
          <View style={{ backgroundColor: '#f0e6ff', padding: 8, borderRadius: 6, width: 70, alignItems: 'center' }}>
            <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#6A5ACD', marginBottom: 4, textTransform: 'uppercase' }}>Scan & Pay</Text>
            <Image src={qrCodeBase64} style={{ width: 50, height: 50 }} />
          </View>
        )}
      </View>
      <View style={{ width: '40%' }}>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ fontSize: 9, color: '#555' }}>Subtotal</Text>
          <Text style={{ fontSize: 9, color: '#222' }}>{formatCurrency(invoice.totals?.subtotal)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ fontSize: 9, color: '#555' }}>Discount</Text>
          <Text style={{ fontSize: 9, color: '#222' }}>{formatCurrency(invoice.totals?.discount)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ fontSize: 9, color: '#555' }}>Tax</Text>
          <Text style={{ fontSize: 9, color: '#222' }}>{formatCurrency(invoice.totals?.tax)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 8, paddingHorizontal: 8, marginTop: 8, backgroundColor: '#6A5ACD', borderRadius: 4 }]}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#fff' }}>TOTAL DUE</Text>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#fff' }}>{formatCurrency(invoice.totals?.grandTotal)}</Text>
        </View>
      </View>
    </View>

    {invoice.notes && (
      <View style={{ marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' }}>
        <Text style={{ fontSize: 8, color: '#444' }}><Text style={{ fontWeight: 'bold', color: '#222' }}>Terms / Notes:</Text> {invoice.notes}</Text>
      </View>
    )}
  </View>
);

// 7. Orange Gradient Modern
const OrangeGradientModernPdf = ({ invoice, businessSettings, safeLogoBase64, qrCodeBase64 }) => (
  <View style={[{ padding: 30, backgroundColor: '#fcfaf8', minHeight: '100%', fontFamily: 'Helvetica' }]} wrap={true}>
    <View style={{ alignItems: 'center', marginBottom: 20 }}>
      <View style={{ backgroundColor: '#FF8C00', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', letterSpacing: 2 }}>INVOICE</Text>
      </View>
    </View>

    <View style={[s.row, { marginBottom: 20 }]}>
      <View style={[s.wHalf, { backgroundColor: '#fff', padding: 15, borderRadius: 8, border: '1pt solid #ffedd5', marginRight: 10 }]}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#FF8C00', textTransform: 'uppercase', marginBottom: 6 }}>From</Text>
        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#222', marginBottom: 2 }}>{businessSettings?.businessName || 'Your Business'}</Text>
        <Text style={{ fontSize: 9, color: '#555' }}>{businessSettings?.email}</Text>
        <Text style={{ fontSize: 9, color: '#555' }}>{businessSettings?.phone}</Text>
      </View>
      <View style={[s.wHalf, { backgroundColor: '#fff', padding: 15, borderRadius: 8, border: '1pt solid #ffedd5', marginLeft: 10 }]}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#FF8C00', textTransform: 'uppercase', marginBottom: 6 }}>Bill To</Text>
        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#222', marginBottom: 2 }}>{invoice.customerName}</Text>
        <Text style={{ fontSize: 9, color: '#555' }}>{invoice.customerPhone}</Text>
      </View>
    </View>

    <View style={[s.row, { backgroundColor: '#fff', padding: 15, borderRadius: 8, border: '1pt solid #ffedd5', marginBottom: 20, alignItems: 'center' }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 2 }}>Invoice Number</Text>
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#222' }}>#{invoice.invoiceNumber}</Text>
      </View>
      <View style={{ width: 1, height: 20, backgroundColor: '#eee', marginHorizontal: 15 }}></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 2 }}>Issue Date</Text>
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#222' }}>{invoice.date}</Text>
      </View>
      <View style={{ width: 1, height: 20, backgroundColor: '#eee', marginHorizontal: 15 }}></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 2 }}>Amount Due</Text>
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FF8C00' }}>{formatCurrency(invoice.totals?.grandTotal)}</Text>
      </View>
    </View>

    <View style={{ marginBottom: 20 }}>
      <View style={[s.row, { backgroundColor: '#FF8C00', padding: 10, borderTopLeftRadius: 6, borderTopRightRadius: 6 }]}>
        <Text style={{ width: '40%', fontSize: 9, color: '#fff', fontWeight: 'bold', textTransform: 'uppercase' }}>Item Description</Text>
        {data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>Qty</Text>}
        {data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Rate</Text>}
        {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Amount</Text>}
      </View>
      {invoice.items?.map((item, i) => (
        <View key={i} style={[s.row, { backgroundColor: '#fff', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ width: '40%', fontSize: 9, color: '#222' }}>{item.name || 'Item'}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#666', textAlign: 'center' }}>{item.qty}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#666', textAlign: 'right' }}>{formatCurrency(item.price)}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#222', fontWeight: 'bold', textAlign: 'right' }}>{formatCurrency(item.qty * item.price)}</Text>
        </View>
      ))}
    </View>

    <View style={[s.row, { alignItems: 'flex-start' }]}>
      <View style={s.wHalf}>
        {qrCodeBase64 && (
          <View style={[s.row, { backgroundColor: '#fff', padding: 10, borderRadius: 8, border: '1pt solid #ffedd5', alignItems: 'center' }]}>
            <Image src={qrCodeBase64} style={{ width: 40, height: 40, marginRight: 10 }} />
            <View>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#FF8C00', textTransform: 'uppercase', marginBottom: 2 }}>Scan to Pay</Text>
              <Text style={{ fontSize: 7, color: '#888' }}>Use any payment app</Text>
            </View>
          </View>
        )}
        {invoice.notes && (
          <View style={{ marginTop: 15, backgroundColor: '#fff7ed', borderLeftWidth: 3, borderLeftColor: '#FF8C00', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#FF8C00', textTransform: 'uppercase', marginBottom: 2 }}>Notes</Text>
            <Text style={{ fontSize: 8, color: '#555' }}>{invoice.notes}</Text>
          </View>
        )}
      </View>
      <View style={[s.wHalf, { paddingLeft: 10 }]}>
        <View style={{ backgroundColor: '#fff', padding: 15, borderRadius: 8, border: '1pt solid #ffedd5' }}>
          <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#fafafa' }]}>
            <Text style={{ fontSize: 9, color: '#555' }}>Subtotal</Text>
            <Text style={{ fontSize: 9, color: '#222', fontWeight: 'bold' }}>{formatCurrency(invoice.totals?.subtotal)}</Text>
          </View>
          <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#fafafa' }]}>
            <Text style={{ fontSize: 9, color: '#555' }}>Discount</Text>
            <Text style={{ fontSize: 9, color: '#222', fontWeight: 'bold' }}>{formatCurrency(invoice.totals?.discount)}</Text>
          </View>
          <View style={[s.row, s.justifyBetween, { paddingVertical: 4, marginBottom: 8 }]}>
            <Text style={{ fontSize: 9, color: '#555' }}>Tax</Text>
            <Text style={{ fontSize: 9, color: '#222', fontWeight: 'bold' }}>{formatCurrency(invoice.totals?.tax)}</Text>
          </View>
          <View style={[s.row, s.justifyBetween, { paddingVertical: 10, paddingHorizontal: 10, backgroundColor: '#FF8C00', borderRadius: 6 }]}>
            {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#fff' }}>Total</Text>}
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#fff' }}>{formatCurrency(invoice.totals?.grandTotal)}</Text>
          </View>
        </View>
      </View>
    </View>
  </View>
);

// 8. Orange Geometric Corner
const OrangeGeometricCornerPdf = ({ invoice, businessSettings, safeLogoBase64, qrCodeBase64 }) => (
  <View style={[{ padding: 30, backgroundColor: '#ffffff', minHeight: '100%', fontFamily: 'Helvetica' }]} wrap={true}>
    <View style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, backgroundColor: '#FF8C00', borderBottomLeftRadius: 120 }} fixed />
    
    <View style={[s.row, s.justifyBetween, { borderBottomWidth: 2, borderBottomColor: '#FF8C00', paddingBottom: 15, mb: 20 }]}>
      <View style={{ width: '40%' }}>
        {safeLogoBase64 ? (
          <Image src={safeLogoBase64} style={{ width: 40, height: 40, objectFit: 'contain' }} />
        ) : (
          <Text style={{ fontSize: 24 }}>📋</Text>
        )}
      </View>
      <View style={{ width: '60%', alignItems: 'flex-end', paddingRight: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FF8C00', letterSpacing: 2, textTransform: 'uppercase' }}>INVOICE</Text>
      </View>
    </View>

    <View style={[s.row, { marginBottom: 20 }]}>
      <View style={s.wHalf}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#555', textTransform: 'uppercase', marginBottom: 2 }}>Invoice Number</Text>
        <Text style={{ fontSize: 10, color: '#222', marginBottom: 8 }}>{invoice.invoiceNumber}</Text>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#555', textTransform: 'uppercase', marginBottom: 2 }}>Date</Text>
        <Text style={{ fontSize: 10, color: '#222' }}>{invoice.date}</Text>
      </View>
      <View style={[s.wHalf, { alignItems: 'flex-end' }]}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#555', textTransform: 'uppercase', marginBottom: 2 }}>Amount Due</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FF8C00' }}>{formatCurrency(invoice.totals?.grandTotal)}</Text>
      </View>
    </View>

    <View style={[s.row, { marginBottom: 20 }]}>
      <View style={s.wHalf}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#FF8C00', textTransform: 'uppercase', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#FF8C00', paddingBottom: 2, width: '80%' }}>From</Text>
        <Text style={{ fontSize: 10, color: '#222', fontWeight: 'bold', marginBottom: 2 }}>{businessSettings?.businessName || 'Your Business'}</Text>
        <Text style={{ fontSize: 9, color: '#444' }}>{businessSettings?.email}</Text>
        <Text style={{ fontSize: 9, color: '#444' }}>{businessSettings?.phone}</Text>
      </View>
      <View style={s.wHalf}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#FF8C00', textTransform: 'uppercase', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#FF8C00', paddingBottom: 2, width: '80%' }}>Bill To</Text>
        <Text style={{ fontSize: 10, color: '#222', fontWeight: 'bold', marginBottom: 2 }}>{invoice.customerName}</Text>
        <Text style={{ fontSize: 9, color: '#444' }}>{invoice.customerPhone}</Text>
      </View>
    </View>

    <View style={{ marginBottom: 20 }}>
      <View style={[s.row, { borderBottomWidth: 2, borderBottomColor: '#FF8C00', paddingBottom: 6, marginBottom: 6 }]}>
        <Text style={{ width: '40%', fontSize: 9, color: '#FF8C00', fontWeight: 'bold', textTransform: 'uppercase' }}>Item</Text>
        {data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#FF8C00', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>Qty</Text>}
        <Text style={{ width: '20%', fontSize: 9, color: '#FF8C00', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Unit Price</Text>
        {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#FF8C00', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Total</Text>}
      </View>
      {invoice.items?.map((item, i) => (
        <View key={i} style={[s.row, { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ width: '40%', fontSize: 9, color: '#222' }}>{item.name || 'Item'}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#666', textAlign: 'center' }}>{item.qty}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#666', textAlign: 'right' }}>{formatCurrency(item.price)}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#222', fontWeight: 'bold', textAlign: 'right' }}>{formatCurrency(item.qty * item.price)}</Text>
        </View>
      ))}
    </View>

    <View style={[s.row, { justifyContent: 'space-between' }]}>
      <View style={s.wHalf}>
        {qrCodeBase64 && (
          <View style={{ alignItems: 'center', width: 60 }}>
            <Image src={qrCodeBase64} style={{ width: 50, height: 50, marginBottom: 4 }} />
            <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#FF8C00', textTransform: 'uppercase' }}>Scan to Pay</Text>
          </View>
        )}
      </View>
      <View style={{ width: '40%' }}>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ fontSize: 9, color: '#555' }}>Subtotal</Text>
          <Text style={{ fontSize: 9, color: '#222' }}>{formatCurrency(invoice.totals?.subtotal)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ fontSize: 9, color: '#555' }}>Discount</Text>
          <Text style={{ fontSize: 9, color: '#222' }}>{formatCurrency(invoice.totals?.discount)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ fontSize: 9, color: '#555' }}>Tax</Text>
          <Text style={{ fontSize: 9, color: '#222' }}>{formatCurrency(invoice.totals?.tax)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 8, paddingHorizontal: 6, marginTop: 8, backgroundColor: '#fff7ed', borderLeftWidth: 3, borderLeftColor: '#FF8C00' }]}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FF8C00' }}>TOTAL DUE</Text>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FF8C00' }}>{formatCurrency(invoice.totals?.grandTotal)}</Text>
        </View>
      </View>
    </View>

    {invoice.notes && (
      <View style={{ marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' }}>
        <Text style={{ fontSize: 8, color: '#444' }}><Text style={{ fontWeight: 'bold', color: '#222' }}>Terms:</Text> {invoice.notes}</Text>
      </View>
    )}
  </View>
);

// 9. Black Orange Bold
const BlackOrangeBoldPdf = ({ invoice, businessSettings, safeLogoBase64, qrCodeBase64 }) => (
  <View style={[{ padding: 30, backgroundColor: '#1a1a1a', minHeight: '100%', fontFamily: 'Helvetica' }]} wrap={true}>
    <View style={[s.row, { borderBottomWidth: 2, borderBottomColor: '#FF8C00', paddingBottom: 15, marginBottom: 20, alignItems: 'center' }]}>
      <View style={{ width: '20%' }}>
        {safeLogoBase64 ? (
          <View style={{ backgroundColor: '#fff', padding: 4, borderRadius: 4, width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
            <Image src={safeLogoBase64} style={{ width: 40, height: 40, objectFit: 'contain' }} />
          </View>
        ) : (
          <View style={{ backgroundColor: '#FF8C00', borderRadius: 4, width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>{businessSettings?.businessName?.charAt(0) || 'B'}</Text>
          </View>
        )}
      </View>
      <View style={{ width: '80%' }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FF8C00', textTransform: 'uppercase', letterSpacing: 2 }}>INVOICE</Text>
        <Text style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>{invoice.invoiceNumber} | {invoice.date}</Text>
      </View>
    </View>

    <View style={[s.row, { marginBottom: 20 }]}>
      <View style={s.wHalf}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#FF8C00', textTransform: 'uppercase', marginBottom: 4 }}>From</Text>
        <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold', marginBottom: 2 }}>{businessSettings?.businessName || 'Your Business'}</Text>
        <Text style={{ fontSize: 9, color: '#ccc' }}>{businessSettings?.email}</Text>
        <Text style={{ fontSize: 9, color: '#ccc' }}>{businessSettings?.phone}</Text>
      </View>
      <View style={s.wHalf}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#FF8C00', textTransform: 'uppercase', marginBottom: 4 }}>To</Text>
        <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold', marginBottom: 2 }}>{invoice.customerName}</Text>
        <Text style={{ fontSize: 9, color: '#ccc' }}>{invoice.customerPhone}</Text>
      </View>
    </View>

    <View style={{ marginBottom: 20 }}>
      <View style={[s.row, { backgroundColor: '#FF8C00', padding: 8 }]}>
        {data.invoiceColumns?.find(c => c.id === 'description')?.visible !== false && <Text style={{ width: '40%', fontSize: 9, color: '#fff', fontWeight: 'bold', textTransform: 'uppercase' }}>Description</Text>}
        {data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>Qty</Text>}
        {data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Price</Text>}
        {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Total</Text>}
      </View>
      {invoice.items?.map((item, i) => (
        <View key={i} style={[s.row, { padding: 8, borderBottomWidth: 1, borderBottomColor: '#333' }]}>
          <Text style={{ width: '40%', fontSize: 9, color: '#eee' }}>{item.name || 'Item'}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#aaa', textAlign: 'center' }}>{item.qty}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#aaa', textAlign: 'right' }}>{formatCurrency(item.price)}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'right' }}>{formatCurrency(item.qty * item.price)}</Text>
        </View>
      ))}
    </View>

    <View style={[s.row, { justifyContent: 'space-between' }]}>
      <View style={s.wHalf}>
        {qrCodeBase64 && (
          <View style={{ backgroundColor: '#fff', padding: 4, borderRadius: 4, width: 60, alignItems: 'center' }}>
            <Image src={qrCodeBase64} style={{ width: 50, height: 50 }} />
            <Text style={{ fontSize: 6, fontWeight: 'bold', color: '#FF8C00', textTransform: 'uppercase', marginTop: 2 }}>Scan to Pay</Text>
          </View>
        )}
      </View>
      <View style={{ width: '40%' }}>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#333' }]}>
          <Text style={{ fontSize: 9, color: '#aaa' }}>Subtotal</Text>
          <Text style={{ fontSize: 9, color: '#eee' }}>{formatCurrency(invoice.totals?.subtotal)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#333' }]}>
          <Text style={{ fontSize: 9, color: '#aaa' }}>Discount</Text>
          <Text style={{ fontSize: 9, color: '#eee' }}>{formatCurrency(invoice.totals?.discount)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#333' }]}>
          <Text style={{ fontSize: 9, color: '#aaa' }}>Tax</Text>
          <Text style={{ fontSize: 9, color: '#eee' }}>{formatCurrency(invoice.totals?.tax)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 8, paddingHorizontal: 8, marginTop: 8, backgroundColor: '#FF8C00', borderRadius: 4 }]}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#fff' }}>TOTAL</Text>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#fff' }}>{formatCurrency(invoice.totals?.grandTotal)}</Text>
        </View>
      </View>
    </View>

    {invoice.notes && (
      <View style={{ marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#333' }}>
        <Text style={{ fontSize: 8, color: '#aaa' }}><Text style={{ fontWeight: 'bold', color: '#FF8C00' }}>Notes:</Text> {invoice.notes}</Text>
      </View>
    )}
  </View>
);

// 10. Luxury Gold Black
const LuxuryGoldBlackPdf = ({ invoice, businessSettings, safeLogoBase64, qrCodeBase64 }) => (
  <View style={[{ padding: 30, backgroundColor: '#1a1a1a', minHeight: '100%', fontFamily: 'Helvetica' }]} wrap={true}>
    <View style={{ border: '2pt solid #D4AF37', height: '100%', padding: 20, position: 'relative' }}>
      
      <View style={{ alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#D4AF37', paddingBottom: 15 }}>
        {safeLogoBase64 ? (
          <View style={{ backgroundColor: '#fff', padding: 4, borderRadius: 50, width: 60, height: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
            <Image src={safeLogoBase64} style={{ width: 40, height: 40, objectFit: 'contain' }} />
          </View>
        ) : (
          <View style={{ backgroundColor: '#D4AF37', borderRadius: 50, width: 60, height: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' }}>{businessSettings?.businessName?.charAt(0) || 'L'}</Text>
          </View>
        )}
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 4, marginBottom: 4 }}>INVOICE</Text>
        <Text style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>{invoice.invoiceNumber} • {invoice.date}</Text>
      </View>

      <View style={[s.row, { marginBottom: 20 }]}>
        <View style={s.wHalf}>
          <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Prepared For</Text>
          <Text style={{ fontSize: 11, color: '#fff', fontWeight: 'bold', marginBottom: 2 }}>{invoice.customerName}</Text>
          <Text style={{ fontSize: 9, color: '#ccc' }}>{invoice.customerPhone}</Text>
        </View>
        <View style={[s.wHalf, { alignItems: 'flex-end' }]}>
          <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Issued By</Text>
          <Text style={{ fontSize: 11, color: '#fff', fontWeight: 'bold', marginBottom: 2 }}>{businessSettings?.businessName || 'Your Business'}</Text>
          <Text style={{ fontSize: 9, color: '#ccc' }}>{businessSettings?.email}</Text>
          <Text style={{ fontSize: 9, color: '#ccc' }}>{businessSettings?.phone}</Text>
        </View>
      </View>

      <View style={{ marginBottom: 20 }}>
        <View style={[s.row, { borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#D4AF37', paddingVertical: 8 }]}>
          {data.invoiceColumns?.find(c => c.id === 'description')?.visible !== false && <Text style={{ width: '40%', fontSize: 8, color: '#D4AF37', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Description</Text>}
          {data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <Text style={{ width: '20%', fontSize: 8, color: '#D4AF37', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>Qty</Text>}
          {data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <Text style={{ width: '20%', fontSize: 8, color: '#D4AF37', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase', letterSpacing: 1 }}>Rate</Text>}
          {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text style={{ width: '20%', fontSize: 8, color: '#D4AF37', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase', letterSpacing: 1 }}>Total</Text>}
        </View>
        {invoice.items?.map((item, i) => (
          <View key={i} style={[s.row, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#333' }]}>
            <Text style={{ width: '40%', fontSize: 9, color: '#eee' }}>{item.name || 'Item'}</Text>
            <Text style={{ width: '20%', fontSize: 9, color: '#aaa', textAlign: 'center' }}>{item.qty}</Text>
            <Text style={{ width: '20%', fontSize: 9, color: '#aaa', textAlign: 'right' }}>{formatCurrency(item.price)}</Text>
            <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'right' }}>{formatCurrency(item.qty * item.price)}</Text>
          </View>
        ))}
      </View>

      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <View style={s.wHalf}>
          {qrCodeBase64 && (
            <View style={{ alignItems: 'center', width: 60 }}>
              <View style={{ border: '1pt solid #D4AF37', padding: 2, marginBottom: 4 }}>
                <Image src={qrCodeBase64} style={{ width: 46, height: 46, backgroundColor: '#fff' }} />
              </View>
              <Text style={{ fontSize: 6, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 1 }}>Scan & Pay</Text>
            </View>
          )}
        </View>
        <View style={{ width: '40%' }}>
          <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#333' }]}>
            <Text style={{ fontSize: 9, color: '#aaa' }}>Subtotal</Text>
            <Text style={{ fontSize: 9, color: '#eee' }}>{formatCurrency(invoice.totals?.subtotal)}</Text>
          </View>
          <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#333' }]}>
            <Text style={{ fontSize: 9, color: '#aaa' }}>Discount</Text>
            <Text style={{ fontSize: 9, color: '#eee' }}>{formatCurrency(invoice.totals?.discount)}</Text>
          </View>
          <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#333' }]}>
            <Text style={{ fontSize: 9, color: '#aaa' }}>Tax</Text>
            <Text style={{ fontSize: 9, color: '#eee' }}>{formatCurrency(invoice.totals?.tax)}</Text>
          </View>
          <View style={[s.row, s.justifyBetween, { paddingVertical: 8, paddingHorizontal: 8, marginTop: 8, backgroundColor: '#D4AF37', borderRadius: 2 }]}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1a1a1a' }}>GRAND TOTAL</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1a1a1a' }}>{formatCurrency(invoice.totals?.grandTotal)}</Text>
          </View>
        </View>
      </View>

      {invoice.notes && (
        <View style={{ marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#333', alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: '#aaa', textAlign: 'center' }}>{invoice.notes}</Text>
        </View>
      )}
    </View>
  </View>
);

// 11. Black Header Professional
const BlackHeaderProfessionalPdf = ({ invoice, businessSettings, safeLogoBase64, qrCodeBase64 }) => (
  <View style={[{ padding: 30, backgroundColor: '#ffffff', minHeight: '100%', fontFamily: 'Helvetica' }]} wrap={true}>
    <View style={[s.row, { backgroundColor: '#1a1a1a', margin: -30, marginBottom: 30, padding: 30, alignItems: 'center' }]}>
      <View style={{ width: 60, height: 60, backgroundColor: '#fff', borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 20 }}>
        {safeLogoBase64 ? (
          <Image src={safeLogoBase64} style={{ width: 40, height: 40, objectFit: 'contain' }} />
        ) : (
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' }}>{businessSettings?.businessName?.charAt(0) || 'B'}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>{businessSettings?.businessName || 'Your Business'}</Text>
        <Text style={{ fontSize: 9, color: '#ccc' }}>{businessSettings?.email} | {businessSettings?.phone}</Text>
      </View>
    </View>

    <View style={[s.row, { marginBottom: 30 }]}>
      <View style={s.wHalf}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2, width: '80%' }}>Bill To</Text>
        <Text style={{ fontSize: 11, color: '#222', fontWeight: 'bold', marginBottom: 2 }}>{invoice.customerName}</Text>
        <Text style={{ fontSize: 9, color: '#555' }}>{invoice.customerPhone}</Text>
      </View>
      <View style={[s.wHalf, { alignItems: 'flex-end' }]}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2, width: '80%', textAlign: 'right' }}>Invoice Details</Text>
        <Text style={{ fontSize: 9, color: '#222', marginBottom: 2 }}><Text style={{ fontWeight: 'bold' }}>Invoice #:</Text> {invoice.invoiceNumber}</Text>
        <Text style={{ fontSize: 9, color: '#222' }}><Text style={{ fontWeight: 'bold' }}>Date:</Text> {invoice.date}</Text>
      </View>
    </View>

    <View style={{ marginBottom: 20 }}>
      <View style={[s.row, { borderBottomWidth: 2, borderBottomStyle: 'dashed', borderBottomColor: '#1a1a1a', paddingBottom: 8, marginBottom: 8 }]}>
        {data.invoiceColumns?.find(c => c.id === 'description')?.visible !== false && <Text style={{ width: '40%', fontSize: 9, color: '#1a1a1a', fontWeight: 'bold', textTransform: 'uppercase' }}>Description</Text>}
        {data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#1a1a1a', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>Qty</Text>}
        {data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#1a1a1a', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Price</Text>}
        {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#1a1a1a', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Total</Text>}
      </View>
      {invoice.items?.map((item, i) => (
        <View key={i} style={[s.row, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ width: '40%', fontSize: 9, color: '#222' }}>{item.name || 'Item'}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#666', textAlign: 'center' }}>{item.qty}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#666', textAlign: 'right' }}>{formatCurrency(item.price)}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#222', fontWeight: 'bold', textAlign: 'right' }}>{formatCurrency(item.qty * item.price)}</Text>
        </View>
      ))}
    </View>

    <View style={[s.row, { justifyContent: 'space-between' }]}>
      <View style={s.wHalf}>
        {qrCodeBase64 && (
          <View style={{ alignItems: 'center', width: 60 }}>
            <Image src={qrCodeBase64} style={{ width: 50, height: 50, border: '1pt solid #1a1a1a', padding: 2, marginBottom: 4 }} />
            <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#1a1a1a', textTransform: 'uppercase' }}>Scan to Pay</Text>
          </View>
        )}
      </View>
      <View style={{ width: '40%' }}>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ fontSize: 9, color: '#555' }}>Subtotal</Text>
          <Text style={{ fontSize: 9, color: '#222' }}>{formatCurrency(invoice.totals?.subtotal)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ fontSize: 9, color: '#555' }}>Discount</Text>
          <Text style={{ fontSize: 9, color: '#222' }}>{formatCurrency(invoice.totals?.discount)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ fontSize: 9, color: '#555' }}>Tax</Text>
          <Text style={{ fontSize: 9, color: '#222' }}>{formatCurrency(invoice.totals?.tax)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 8, paddingHorizontal: 8, marginTop: 8, backgroundColor: '#f5f5f5', border: '1pt solid #1a1a1a' }]}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1a1a1a' }}>TOTAL DUE</Text>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1a1a1a' }}>{formatCurrency(invoice.totals?.grandTotal)}</Text>
        </View>
      </View>
    </View>

    {invoice.notes && (
      <View style={{ marginTop: 20, padding: 15, backgroundColor: '#f9f9f9', border: '1pt solid #eee' }}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#1a1a1a', textTransform: 'uppercase', marginBottom: 4 }}>Terms / Notes</Text>
        <Text style={{ fontSize: 9, color: '#555' }}>{invoice.notes}</Text>
      </View>
    )}
  </View>
);

// 12. Blue Rounded Modern
const BlueRoundedModernPdf = ({ invoice, businessSettings, safeLogoBase64, qrCodeBase64 }) => (
  <View style={[{ padding: 30, backgroundColor: '#1e90ff', minHeight: '100%', fontFamily: 'Helvetica' }]} wrap={true}>
    <View style={{ backgroundColor: '#ffffff', padding: 25, borderRadius: 16, minHeight: '100%' }}>
      
      <View style={[s.row, s.justifyBetween, { marginBottom: 30, alignItems: 'center' }]}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#1e90ff' }}>Invoice</Text>
        {safeLogoBase64 ? (
          <Image src={safeLogoBase64} style={{ width: 50, height: 50, objectFit: 'contain' }} />
        ) : (
          <View style={{ width: 50, height: 50, backgroundColor: '#f0f8ff', borderRadius: 25, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e90ff' }}>{businessSettings?.businessName?.charAt(0) || 'B'}</Text>
          </View>
        )}
      </View>

      <View style={[s.row, { marginBottom: 20 }]}>
        <View style={s.wHalf}>
          <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Billed To</Text>
          <Text style={{ fontSize: 11, color: '#222', fontWeight: 'bold', marginBottom: 2 }}>{invoice.customerName}</Text>
          <Text style={{ fontSize: 9, color: '#555' }}>{invoice.customerPhone}</Text>
        </View>
        <View style={[s.wHalf, { alignItems: 'flex-end' }]}>
          <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Invoice #{invoice.invoiceNumber}</Text>
          <Text style={{ fontSize: 9, color: '#555' }}>Date: {invoice.date}</Text>
        </View>
      </View>

      <View style={{ marginBottom: 20 }}>
        <View style={[s.row, { backgroundColor: '#1e90ff', padding: 8, borderRadius: 6 }]}>
          {data.invoiceColumns?.find(c => c.id === 'description')?.visible !== false && <Text style={{ width: '40%', fontSize: 9, color: '#fff', fontWeight: 'bold', textTransform: 'uppercase' }}>Description</Text>}
          {data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>Qty</Text>}
          {data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Price</Text>}
          {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Total</Text>}
        </View>
        {invoice.items?.map((item, i) => (
          <View key={i} style={[s.row, { padding: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }]}>
            <Text style={{ width: '40%', fontSize: 9, color: '#222' }}>{item.name || 'Item'}</Text>
            <Text style={{ width: '20%', fontSize: 9, color: '#666', textAlign: 'center' }}>{item.qty}</Text>
            <Text style={{ width: '20%', fontSize: 9, color: '#666', textAlign: 'right' }}>{formatCurrency(item.price)}</Text>
            <Text style={{ width: '20%', fontSize: 9, color: '#222', fontWeight: 'bold', textAlign: 'right' }}>{formatCurrency(item.qty * item.price)}</Text>
          </View>
        ))}
      </View>

      <View style={[s.row, { marginBottom: 20 }]}>
        <View style={s.wHalf}>
          <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>From</Text>
          <Text style={{ fontSize: 10, color: '#222', fontWeight: 'bold', marginBottom: 2 }}>{businessSettings?.businessName || 'Your Business'}</Text>
          <Text style={{ fontSize: 9, color: '#555' }}>{businessSettings?.email}</Text>
          <Text style={{ fontSize: 9, color: '#555' }}>{businessSettings?.phone}</Text>
        </View>
        <View style={s.wHalf}>
          <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' }]}>
            <Text style={{ fontSize: 9, color: '#666' }}>Subtotal</Text>
            <Text style={{ fontSize: 9, color: '#222', fontWeight: 'bold' }}>{formatCurrency(invoice.totals?.subtotal)}</Text>
          </View>
          <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' }]}>
            <Text style={{ fontSize: 9, color: '#666' }}>Discount</Text>
            <Text style={{ fontSize: 9, color: '#222', fontWeight: 'bold' }}>{formatCurrency(invoice.totals?.discount)}</Text>
          </View>
          <View style={[s.row, s.justifyBetween, { paddingVertical: 4, marginBottom: 4 }]}>
            <Text style={{ fontSize: 9, color: '#666' }}>Tax</Text>
            <Text style={{ fontSize: 9, color: '#222', fontWeight: 'bold' }}>{formatCurrency(invoice.totals?.tax)}</Text>
          </View>
          <View style={[s.row, s.justifyBetween, { paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#1e90ff', borderRadius: 8 }]}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#fff' }}>TOTAL</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#fff' }}>{formatCurrency(invoice.totals?.grandTotal)}</Text>
          </View>
        </View>
      </View>

      <View style={[s.row, { backgroundColor: '#f0f8ff', padding: 15, borderRadius: 8, alignItems: 'center' }]}>
        <View style={{ flex: 1 }}>
          {invoice.notes ? (
            <View>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#1e90ff', textTransform: 'uppercase', marginBottom: 2 }}>Notes</Text>
              <Text style={{ fontSize: 9, color: '#555' }}>{invoice.notes}</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e90ff' }}>Thank you for your business!</Text>
          )}
        </View>
        {qrCodeBase64 && (
          <View style={{ alignItems: 'center', marginLeft: 15 }}>
            <Image src={qrCodeBase64} style={{ width: 40, height: 40, backgroundColor: '#fff', padding: 2, borderRadius: 4, marginBottom: 4 }} />
            <Text style={{ fontSize: 6, fontWeight: 'bold', color: '#1e90ff', textTransform: 'uppercase' }}>Pay Now</Text>
          </View>
        )}
      </View>

    </View>
  </View>
);

// 13. Red Corporate Clean
const RedCorporateCleanPdf = ({ invoice, businessSettings, safeLogoBase64, qrCodeBase64 }) => (
  <View style={[{ padding: 30, backgroundColor: '#ffffff', minHeight: '100%', fontFamily: 'Helvetica' }]} wrap={true}>
    <View style={[s.row, { marginBottom: 30, alignItems: 'flex-start' }]}>
      <View style={{ width: 60, height: 60, backgroundColor: '#DC143C', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
        {safeLogoBase64 ? (
          <Image src={safeLogoBase64} style={{ width: 40, height: 40, objectFit: 'contain' }} />
        ) : (
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>{businessSettings?.businessName?.charAt(0) || 'B'}</Text>
        )}
      </View>
      <View>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#DC143C', letterSpacing: 2, textTransform: 'uppercase' }}>INVOICE</Text>
        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#666', textTransform: 'uppercase', marginTop: 2 }}>Invoice #{invoice.invoiceNumber}</Text>
      </View>
    </View>

    <View style={[s.row, { marginBottom: 30 }]}>
      <View style={s.wHalf}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2, width: '80%' }}>From</Text>
        <Text style={{ fontSize: 10, color: '#222', fontWeight: 'bold', marginBottom: 2 }}>{businessSettings?.businessName || 'Your Business'}</Text>
        <Text style={{ fontSize: 9, color: '#555' }}>{businessSettings?.email}</Text>
        <Text style={{ fontSize: 9, color: '#555', marginBottom: 8 }}>{businessSettings?.phone}</Text>

        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2, width: '80%' }}>Bill To</Text>
        <Text style={{ fontSize: 10, color: '#222', fontWeight: 'bold', marginBottom: 2 }}>{invoice.customerName}</Text>
        <Text style={{ fontSize: 9, color: '#555' }}>{invoice.customerPhone}</Text>
      </View>
      <View style={[s.wHalf, { alignItems: 'flex-end' }]}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2, width: '60%', textAlign: 'right' }}>Invoice Date</Text>
        <Text style={{ fontSize: 10, color: '#222', fontWeight: 'bold' }}>{invoice.date}</Text>
      </View>
    </View>

    <View style={{ marginBottom: 30 }}>
      <View style={[s.row, { backgroundColor: '#DC143C', padding: 8 }]}>
        {data.invoiceColumns?.find(c => c.id === 'description')?.visible !== false && <Text style={{ width: '40%', fontSize: 9, color: '#fff', fontWeight: 'bold', textTransform: 'uppercase' }}>Description</Text>}
        {data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>Qty</Text>}
        {data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Price</Text>}
        {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#fff', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Total</Text>}
      </View>
      {invoice.items?.map((item, i) => (
        <View key={i} style={[s.row, { padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: i % 2 === 0 ? '#fff' : '#fcfcfc' }]}>
          <Text style={{ width: '40%', fontSize: 9, color: '#222' }}>{item.name || 'Item'}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#666', textAlign: 'center' }}>{item.qty}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#666', textAlign: 'right' }}>{formatCurrency(item.price)}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#222', fontWeight: 'bold', textAlign: 'right' }}>{formatCurrency(item.qty * item.price)}</Text>
        </View>
      ))}
    </View>

    <View style={[s.row, { justifyContent: 'space-between' }]}>
      <View style={s.wHalf}>
        {qrCodeBase64 && (
          <View style={{ alignItems: 'center', width: 60 }}>
            <Image src={qrCodeBase64} style={{ width: 50, height: 50, border: '1pt solid #eee', padding: 2, marginBottom: 4 }} />
            <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#DC143C', textTransform: 'uppercase' }}>Scan & Pay</Text>
          </View>
        )}
      </View>
      <View style={{ width: '40%' }}>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ fontSize: 9, color: '#555' }}>Subtotal</Text>
          <Text style={{ fontSize: 9, color: '#222', fontWeight: 'bold' }}>{formatCurrency(invoice.totals?.subtotal)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ fontSize: 9, color: '#555' }}>Discount</Text>
          <Text style={{ fontSize: 9, color: '#222', fontWeight: 'bold' }}>{formatCurrency(invoice.totals?.discount)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
          <Text style={{ fontSize: 9, color: '#555' }}>Tax</Text>
          <Text style={{ fontSize: 9, color: '#222', fontWeight: 'bold' }}>{formatCurrency(invoice.totals?.tax)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 8, paddingHorizontal: 8, marginTop: 8, backgroundColor: '#DC143C', borderRadius: 2 }]}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#fff' }}>TOTAL DUE</Text>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#fff' }}>{formatCurrency(invoice.totals?.grandTotal)}</Text>
        </View>
      </View>
    </View>

    {invoice.notes && (
      <View style={{ marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' }}>
        <Text style={{ fontSize: 8, color: '#555' }}><Text style={{ fontWeight: 'bold', color: '#222' }}>Terms / Notes:</Text> {invoice.notes}</Text>
      </View>
    )}
  </View>
);

// 14. Clean Two-Column Modern
const CleanTwoColumnModernPdf = ({ invoice, businessSettings, safeLogoBase64, qrCodeBase64 }) => (
  <View style={[{ padding: 30, backgroundColor: '#ffffff', minHeight: '100%', fontFamily: 'Helvetica' }]} wrap={true}>
    <View style={[s.row, s.justifyBetween, { marginBottom: 30, alignItems: 'flex-start' }]}>
      <View style={s.wHalf}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2, width: '80%' }}>From</Text>
        <Text style={{ fontSize: 10, color: '#222', fontWeight: 'bold', marginBottom: 2 }}>{businessSettings?.businessName || 'Your Business'}</Text>
        <Text style={{ fontSize: 9, color: '#555' }}>{businessSettings?.email}</Text>
        <Text style={{ fontSize: 9, color: '#555', marginBottom: 10 }}>{businessSettings?.phone}</Text>

        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2, width: '80%' }}>Bill To</Text>
        <Text style={{ fontSize: 10, color: '#222', fontWeight: 'bold', marginBottom: 2 }}>{invoice.customerName}</Text>
        <Text style={{ fontSize: 9, color: '#555' }}>{invoice.customerPhone}</Text>
      </View>
      <View style={[s.wHalf, { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, border: '1pt solid #eee', alignItems: 'flex-end' }]}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 4 }}>{invoice.invoiceNumber}</Text>
        <Text style={{ fontSize: 9, color: '#666', fontWeight: 'bold', marginBottom: 15 }}>Issue Date: {invoice.date}</Text>
        {safeLogoBase64 ? (
          <Image src={safeLogoBase64} style={{ width: 40, height: 40, objectFit: 'contain' }} />
        ) : (
          <View style={{ width: 40, height: 40, backgroundColor: '#eee', borderRadius: 4, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#888' }}>{businessSettings?.businessName?.charAt(0) || 'B'}</Text>
          </View>
        )}
      </View>
    </View>

    <View style={{ marginBottom: 30 }}>
      <View style={[s.row, { borderBottomWidth: 2, borderBottomColor: '#eee', paddingBottom: 6, marginBottom: 6 }]}>
        {data.invoiceColumns?.find(c => c.id === 'description')?.visible !== false && <Text style={{ width: '40%', fontSize: 9, color: '#222', fontWeight: 'bold', textTransform: 'uppercase' }}>Description</Text>}
        {data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#222', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>Qty</Text>}
        {data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#222', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Price</Text>}
        {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text style={{ width: '20%', fontSize: 9, color: '#222', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' }}>Total</Text>}
      </View>
      {invoice.items?.map((item, i) => (
        <View key={i} style={[s.row, { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' }]}>
          <Text style={{ width: '40%', fontSize: 9, color: '#222' }}>{item.name || 'Item'}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#666', textAlign: 'center' }}>{item.qty}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#666', textAlign: 'right' }}>{formatCurrency(item.price)}</Text>
          <Text style={{ width: '20%', fontSize: 9, color: '#222', fontWeight: 'bold', textAlign: 'right' }}>{formatCurrency(item.qty * item.price)}</Text>
        </View>
      ))}
    </View>

    <View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-end' }]}>
      <View style={s.wHalf}>
        {qrCodeBase64 && (
          <View style={{ backgroundColor: '#f9f9f9', padding: 6, borderRadius: 6, border: '1pt solid #eee', width: 60, alignItems: 'center' }}>
            <Image src={qrCodeBase64} style={{ width: 46, height: 46, marginBottom: 4 }} />
            <Text style={{ fontSize: 6, fontWeight: 'bold', color: '#888', textTransform: 'uppercase' }}>Scan & Pay</Text>
          </View>
        )}
      </View>
      <View style={{ width: '40%' }}>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' }]}>
          <Text style={{ fontSize: 9, color: '#555' }}>Subtotal</Text>
          <Text style={{ fontSize: 9, color: '#222', fontWeight: 'bold' }}>{formatCurrency(invoice.totals?.subtotal)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' }]}>
          <Text style={{ fontSize: 9, color: '#555' }}>Discount</Text>
          <Text style={{ fontSize: 9, color: '#222', fontWeight: 'bold' }}>{formatCurrency(invoice.totals?.discount)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' }]}>
          <Text style={{ fontSize: 9, color: '#555' }}>Tax</Text>
          <Text style={{ fontSize: 9, color: '#222', fontWeight: 'bold' }}>{formatCurrency(invoice.totals?.tax)}</Text>
        </View>
        <View style={[s.row, s.justifyBetween, { paddingVertical: 8, paddingHorizontal: 10, marginTop: 8, backgroundColor: '#f9f9f9', borderLeftWidth: 4, borderLeftColor: '#222' }]}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#222' }}>AMOUNT DUE</Text>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#222' }}>{formatCurrency(invoice.totals?.grandTotal)}</Text>
        </View>
      </View>
    </View>

    {invoice.notes && (
      <View style={{ marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' }}>
        <Text style={{ fontSize: 8, color: '#555' }}><Text style={{ fontWeight: 'bold', color: '#222' }}>Terms & Conditions:</Text> {invoice.notes}</Text>
      </View>
    )}
  </View>
);

export const PdfTemplateLayouts = {
  'minimal-classic': MinimalClassicPdf,
  'modern-corporate': ModernCorporatePdf,
  'teal-bold-header': TealBoldHeaderPdf,
  'sage-green-curved': SageGreenCurvedPdf,
  'creative-agency': CreativeAgencyPdf,
  'purple-corporate': PurpleCorporatePdf,
  'orange-gradient-modern': OrangeGradientModernPdf,
  'orange-geometric': OrangeGeometricCornerPdf,
  'black-orange-bold': BlackOrangeBoldPdf,
  'luxury-gold-black': LuxuryGoldBlackPdf,
  'black-header-professional': BlackHeaderProfessionalPdf,
  'blue-rounded-modern': BlueRoundedModernPdf,
  'red-corporate-clean': RedCorporateCleanPdf,
  'clean-two-column': CleanTwoColumnModernPdf
};
