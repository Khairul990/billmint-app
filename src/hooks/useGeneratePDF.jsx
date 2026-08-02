import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import PdfDocument from '../components/PdfDocument';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';
import { buildCanonicalRenderModel } from '../utils/normalizeInvoiceModel';

export const useGeneratePDF = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const getQrBase64 = async (invoice, businessSettings) => {
    const { paymentPrefs, regionalPrefs } = buildCanonicalRenderModel(invoice, businessSettings) || {};
    const enableQr = paymentPrefs?.paymentQrEnabled && paymentPrefs?.showQrInPreview;
    
    if (!enableQr) return null;

    const paymentMethod = paymentPrefs?.paymentMethod || 'Manual';
    const dueAmount = invoice.balanceDue !== undefined ? invoice.balanceDue : (invoice.grandTotal || 0);
    const payeeName = paymentPrefs?.payeeName || businessSettings?.businessName || '';
    
    let qrText = '';
    if (paymentMethod === 'UPI') {
      const upiId = paymentPrefs?.upiId || '';
      qrText = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${dueAmount}&cu=${regionalPrefs?.currencyCode || 'INR'}&tn=${invoice.invoiceNumber}`;
    } else if (paymentMethod === 'bKash') {
      const bkashNumber = paymentPrefs?.bkashNumber || '';
      qrText = `bKash Payment\nMerchant/Personal Number: ${bkashNumber}\nAmount: ${dueAmount}\nInvoice: ${invoice.invoiceNumber}`;
    } else if (paymentMethod === 'Nagad') {
      const nagadNumber = paymentPrefs?.nagadNumber || '';
      qrText = `Nagad Payment\nNumber: ${nagadNumber}\nAmount: ${dueAmount}\nInvoice: ${invoice.invoiceNumber}`;
    } else {
      qrText = `${window.location.origin}/invoice/${invoice.publicToken || invoice.id}`;
    }

    try {
      return await QRCode.toDataURL(qrText, { margin: 1, width: 150 });
    } catch (err) {
      console.error('QR Generate Error:', err);
      return null;
    }
  };

  const generatePDF = async (invoice, businessSettings, filename = null) => {
    setIsGenerating(true);
    
    try {
      // 1. Prepare dynamic assets like QR Code
      const qrCodeBase64 = await getQrBase64(invoice, businessSettings);

      // 2. Generate PDF Blob using @react-pdf/renderer
      const blob = await pdf(
        <PdfDocument 
          invoice={invoice} 
          businessSettings={businessSettings} 
          qrCodeBase64={qrCodeBase64} 
        />
      ).toBlob();

      // 3. Create Object URL and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `Invoice_${invoice.invoiceNumber || 'Draft'}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // 4. Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Vector PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return { generatePDF, isGenerating };
};

export default useGeneratePDF;
