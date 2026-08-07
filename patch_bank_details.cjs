const fs = require('fs');

function addBankDetails(filepath, isPdf) {
  let c = fs.readFileSync(filepath, 'utf8');
  let bankCodeHtml = `
    {data.businessSettings?.bankDetails?.bankName && (
      <div className="pt-5 mt-5 border-t border-current/20 text-[11px] opacity-80 flex flex-col gap-1">
        <strong className="opacity-100">Bank Details</strong>
        <span>Bank: {data.businessSettings.bankDetails.bankName}</span>
        <span>A/C No: {data.businessSettings.bankDetails.accountNumber}</span>
        <span>IFSC: {data.businessSettings.bankDetails.ifscCode}</span>
        {data.businessSettings.bankDetails.upiId && <span>UPI ID: {data.businessSettings.bankDetails.upiId}</span>}
      </div>
    )}
    {data.notes && (`.trim();

  let bankCodePdf = `
    {data.businessSettings?.bankDetails?.bankName && (
      <View style={{ marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderColor: '#e2e8f0' }}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>Bank Details</Text>
        <Text style={{ fontSize: 9, color: '#374151' }}>Bank: {data.businessSettings.bankDetails.bankName}</Text>
        <Text style={{ fontSize: 9, color: '#374151' }}>A/C No: {data.businessSettings.bankDetails.accountNumber}</Text>
        <Text style={{ fontSize: 9, color: '#374151' }}>IFSC: {data.businessSettings.bankDetails.ifscCode}</Text>
        {data.businessSettings.bankDetails.upiId && <Text style={{ fontSize: 9, color: '#374151' }}>UPI ID: {data.businessSettings.bankDetails.upiId}</Text>}
      </View>
    )}
    {data.notes && (`.trim();

  if (isPdf) {
    c = c.replace(/\{data\.notes && \(/g, bankCodePdf);
  } else {
    c = c.replace(/\{data\.notes && \(/g, bankCodeHtml);
  }
  
  fs.writeFileSync(filepath, c);
}

addBankDetails('src/components/invoice-templates/layouts/LivePreviewLayouts.jsx', false);
addBankDetails('src/components/invoice-templates/pdf-layouts/PdfTemplateLayouts.jsx', true);
console.log('Bank details injected');
