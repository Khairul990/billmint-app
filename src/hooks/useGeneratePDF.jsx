import { useCallback, useState } from 'react';
import { downloadInvoicePDF } from '../utils/pdfUtils';

/**
 * Canonical invoice PDF download hook.
 *
 * The app previously had two PDF pipelines: this hook generated a PDF directly
 * while pdfUtils generated a second, hardened version used by other screens.
 * Keeping a single pipeline prevents Preview/PDF/Image from drifting apart.
 */
export const useGeneratePDF = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = useCallback(async (invoice, businessSettings, filename = null) => {
    if (!invoice || isGenerating) return false;

    setIsGenerating(true);
    try {
      const safeFilename = filename || `Invoice_${invoice.invoiceNumber || 'Draft'}.pdf`;
      return await downloadInvoicePDF(invoice, businessSettings, true, safeFilename);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating]);

  return { generatePDF, isGenerating };
};

export default useGeneratePDF;
