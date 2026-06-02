const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateInvoice.jsx', 'utf-8');

// 1. Add hook import
if (!code.includes('useGeneratePDF')) {
    code = code.replace("import { toast } from 'react-hot-toast';", "import { toast } from 'react-hot-toast';\nimport useGeneratePDF from '../hooks/useGeneratePDF';");
}

// 2. Add Loader2 to lucide-react imports
if (!code.includes('Loader2')) {
    code = code.replace("Download,", "Loader2, Download,");
}

// 3. Initialize hook inside component
if (!code.includes('const { generatePDF, isGenerating }')) {
    code = code.replace("const { isMobile } = useWindowSize();", "const { isMobile } = useWindowSize();\n  const { generatePDF, isGenerating } = useGeneratePDF();");
}

// 4. Update the actual Download PDF buttons (we can replace handleDownloadPDF usages)
// First, find the handleDownloadPDF function call and replace it with a wrapper that prepares the invoice object
const wrapper = `
  const handlePdfClick = () => {
    generatePDF({ 
      items, invoiceNumber, date, dueDate, customerName, customerPhone, customerEmail, customerAddress, customerId, paymentType, paymentStatus, orderStatus, subtotal, taxPercentage, taxAmount, discountAmount, grandTotal, amountPaid, balanceDue, notes, terms, billType, businessSnapshot: businessSettings, paymentSettingsSnapshot: businessSettings, regionalSettingsSnapshot: businessSettings 
    }, businessSettings);
  };
`;
if (!code.includes('handlePdfClick')) {
    code = code.replace("  const [showBanner, setShowBanner] = useState(true);", wrapper + "\n  const [showBanner, setShowBanner] = useState(true);");
}

// Replace onClick={handleDownloadPDF} with onClick={handlePdfClick}
code = code.replace(/onClick=\{handleDownloadPDF\}/g, "onClick={handlePdfClick} disabled={isGenerating}");

// Fix the button UI for the main top bar button
code = code.replace(/<Download className="w-4 h-4 text-theme-muted" \/>/g, "{isGenerating ? <Loader2 className=\"w-4 h-4 animate-spin text-theme-muted\" /> : <Download className=\"w-4 h-4 text-theme-muted\" />}");

code = code.replace(/<Download className="w-4 h-4" \/>\s*Download PDF/g, "{isGenerating ? <Loader2 className=\"w-4 h-4 animate-spin\" /> : <Download className=\"w-4 h-4\" />}\n                    {isGenerating ? \"Generating...\" : \"Download PDF\"}");

code = code.replace(/<Download className="w-4 h-4" \/>/g, "{isGenerating ? <Loader2 className=\"w-4 h-4 animate-spin\" /> : <Download className=\"w-4 h-4\" />}");


fs.writeFileSync('src/pages/CreateInvoice.jsx', code);
console.log('Done');
