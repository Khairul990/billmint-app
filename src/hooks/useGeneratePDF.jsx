import { useCallback, useRef, useState } from 'react';
import { downloadInvoicePDF } from '../utils/pdfUtils';

/**
 * Canonical invoice PDF download hook.
 * All callers use the hardened pdfUtils pipeline so PDF output is consistent
 * with the invoice image export and avoids maintaining a second renderer.
 */
export const useGeneratePDF = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const generatingRef = useRef(false);

  const generatePDF = useCallback(async (invoice, businessSettings, filename = null) => {
    if (!invoice || generatingRef.current) return false;

    generatingRef.current = true;
    setIsGenerating(true);
    try {
      // pdfUtils owns the canonical filename and rendering pipeline.
      // The optional filename is intentionally not passed because the current
      // utility signature derives a safe filename from invoice/business data.
      return await downloadInvoicePDF(invoice, businessSettings, true);
    } finally {
      generatingRef.current = false;
      setIsGenerating(false);
    }
  }, []);

  return { generatePDF, isGenerating };
};

export default useGeneratePDF;
