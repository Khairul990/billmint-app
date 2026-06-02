const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateInvoice.jsx', 'utf-8');

// Fix syntax error
code = code.replace(
  "{isGenerating ? <Loader2 className=\"w-4 h-4 animate-spin\" /> : {isGenerating ? <Loader2 className=\"w-4 h-4 animate-spin\" /> : <Download className=\"w-4 h-4\" />}}",
  "{isGenerating ? <Loader2 className=\"w-4 h-4 animate-spin\" /> : <Download className=\"w-4 h-4\" />}"
);

// Also change /i/ to /invoice/ for handleCopyLiveLink
code = code.replace(
  "const liveLink = `${window.location.origin}/i/${token}`;",
  "const liveLink = `${window.location.origin}/invoice/${token}`;"
);

fs.writeFileSync('src/pages/CreateInvoice.jsx', code);
console.log('Fixed CreateInvoice');
