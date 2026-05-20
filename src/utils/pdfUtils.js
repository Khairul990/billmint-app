import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Downloads a high-quality PDF of the invoice by rendering the DOM element as an image using html2canvas
 * @param {string} invoiceElementId - DOM element ID containing the invoice preview card
 * @param {string} invoiceNumber - Invoice serial string (e.g. INV-1001) for filename
 * @returns {Promise<boolean>} Success indicator
 */
export const downloadInvoicePDF = async (invoiceElementId, invoiceNumber) => {
  const element = document.getElementById(invoiceElementId);
  if (!element) {
    console.error('Invoice preview element not found.');
    return false;
  }

  try {
    // Pre-processing to ensure the entire card is captured fully, even if scrolled out of view
    const originalStyle = element.style.cssText;
    element.style.width = '800px'; // Lock width to Standard high-res desktop scale for clean PDF formatting
    element.style.height = 'auto';

    const canvas = await html2canvas(element, {
      scale: 2, // High resolution output
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
    });

    // Revert inline style mutations
    element.style.cssText = originalStyle;

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Page 1
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
    heightLeft -= pdfHeight;

    // Loop for multi-page invoices
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
      heightLeft -= pdfHeight;
    }

    pdf.save(`${invoiceNumber || 'Invoice'}.pdf`);
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    return false;
  }
};
