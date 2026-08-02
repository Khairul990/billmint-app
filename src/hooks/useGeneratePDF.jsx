import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import PdfDocument from '../components/PdfDocument';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';

export const useGeneratePDF = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const getQrBase64 = async (invoice, businessSettings) => {
    const invoiceBuilderSettings = businessSettings?.invoiceBuilderSettings || {};
    const bankDetails = invoiceBuilderSettings.bankDetails || {};
    
    const paySnap = invoice?.paymentSettingsSnapshot || {};
    const paymentQrEnabled = bankDetails?.showQr ?? businessSettings?.paymentQrEnabled ?? paySnap.paymentQrEnabled ?? false;
    const showQrInPreview = businessSettings?.showQrInPreview !== undefined ? businessSettings.showQrInPreview : (paySnap.showQrInPreview !== undefined ? paySnap.showQrInPreview : true);
    
    if (!(paymentQrEnabled && showQrInPreview)) return null;

    const paymentMethod = (bankDetails?.upiId ? 'UPI' : businessSettings?.paymentMethod) || paySnap.paymentMethod || 'Manual';
    const upiId = bankDetails?.upiId || businessSettings?.upiId || paySnap.upiId || '';
    const bkashNumber = businessSettings?.bkashNumber || paySnap.bkashNumber || '';
    const nagadNumber = businessSettings?.nagadNumber || paySnap.nagadNumber || '';
    const payeeName = businessSettings?.payeeName || businessSettings?.businessName || paySnap.payeeName || '';
    const currencyCode = businessSettings?.currencyCode || invoice?.regionalSettingsSnapshot?.currencyCode || 'INR';

    const dueAmount = invoice?.balanceDue !== undefined ? invoice.balanceDue : (invoice?.grandTotal || 0);
    
    let qrText = '';
    if (paymentMethod === 'UPI') {
      qrText = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${dueAmount}&cu=${currencyCode}&tn=${invoice?.invoiceNumber || ''}`;
    } else if (paymentMethod === 'bKash') {
      qrText = `bKash Payment\nMerchant/Personal Number: ${bkashNumber}\nAmount: ${dueAmount}\nInvoice: ${invoice?.invoiceNumber || ''}`;
    } else if (paymentMethod === 'Nagad') {
      qrText = `Nagad Payment\nNumber: ${nagadNumber}\nAmount: ${dueAmount}\nInvoice: ${invoice?.invoiceNumber || ''}`;
    } else {
      qrText = `${window.location.origin}/invoice/${invoice?.publicToken || invoice?.id || ''}`;
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
