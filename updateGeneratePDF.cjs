const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGeneratePDF.jsx', 'utf-8');

// Add QRCode import
if (!code.includes("import QRCode from 'qrcode';")) {
  code = code.replace("import { toast } from 'react-hot-toast';", "import { toast } from 'react-hot-toast';\nimport QRCode from 'qrcode';");
}

// Replace getQrBase64 implementation
const newQrBase64 = `const getQrBase64 = async (invoice, businessSettings) => {
    const paymentPrefs = invoice.paymentSettingsSnapshot || businessSettings;
    if (!paymentPrefs?.paymentQrEnabled || !paymentPrefs?.showQrInPreview) return null;

    const liveLink = \`\${window.location.origin}/invoice/\${invoice.publicToken || invoice.id}\`;
    try {
      return await QRCode.toDataURL(liveLink, { margin: 1, width: 150 });
    } catch (err) {
      console.error('QR Generate Error:', err);
      return null;
    }
  };`;

code = code.replace(/const getQrBase64 = async \(invoice, businessSettings\) => \{[\s\S]*?^\s*\};/m, newQrBase64);

fs.writeFileSync('src/hooks/useGeneratePDF.jsx', code);
console.log('Updated useGeneratePDF.jsx');
