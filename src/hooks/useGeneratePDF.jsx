import { useCallback, useRef, useState } from 'react';
import { downloadStableInvoicePDF } from '../utils/stableInvoicePdf';

export const useGeneratePDF = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const generatingRef = useRef(false);

  const generatePDF = useCallback(async (invoice, businessSettings) => {
    if (!invoice || generatingRef.current) return false;

    generatingRef.current = true;
    setIsGenerating(true);
    try {
      return await downloadStableInvoicePDF(invoice, businessSettings);
    } finally {
      generatingRef.current = false;
      setIsGenerating(false);
    }
  }, []);

  return { generatePDF, isGenerating };
};

export default useGeneratePDF;
