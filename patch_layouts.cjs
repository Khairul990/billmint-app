const fs = require('fs');
const path = require('path');

const applyColumnPatches = (fileContent) => {
  // Replace standard table headers in HTML (LivePreviewLayouts)
  let patched = fileContent.replace(/<th([^>]*)>Description<\/th>/g, "{data.invoiceColumns?.find(c => c.id === 'description')?.visible !== false && <th$1>Description</th>}");
  patched = patched.replace(/<th([^>]*)>Qty<\/th>/g, "{data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <th$1>Qty</th>}");
  patched = patched.replace(/<th([^>]*)>Rate<\/th>/g, "{data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <th$1>Rate</th>}");
  patched = patched.replace(/<th([^>]*)>Price<\/th>/g, "{data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <th$1>Price</th>}");
  patched = patched.replace(/<th([^>]*)>Total<\/th>/g, "{data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <th$1>Total</th>}");
  patched = patched.replace(/<th([^>]*)>Amount<\/th>/g, "{data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <th$1>Amount</th>}");

  // Replace standard table cells in HTML (LivePreviewLayouts)
  // For Description (usually item.name)
  patched = patched.replace(/<td([^>]*)>\{item\.name([^}]*)\}<\/td>/g, "{data.invoiceColumns?.find(c => c.id === 'description')?.visible !== false && <td$1>{item.name$2}</td>}");
  
  // For Qty
  patched = patched.replace(/<td([^>]*)>\{item\.qty\}<\/td>/g, "{data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <td$1>{item.qty}</td>}");
  
  // For Price/Rate
  patched = patched.replace(/<td([^>]*)>\{formatCurrency\(item\.price\)\}<\/td>/g, "{data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <td$1>{formatCurrency(item.price)}</td>}");
  
  // For Total
  patched = patched.replace(/<td([^>]*)>\{formatCurrency\(item\.qty \* item\.price\)\}<\/td>/g, "{data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <td$1>{formatCurrency(item.qty * item.price)}</td>}");

  // PDF Layouts (View & Text tags)
  patched = patched.replace(/<Text([^>]*)>Description<\/Text>/g, "{data.invoiceColumns?.find(c => c.id === 'description')?.visible !== false && <Text$1>Description</Text>}");
  patched = patched.replace(/<Text([^>]*)>Qty<\/Text>/g, "{data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <Text$1>Qty</Text>}");
  patched = patched.replace(/<Text([^>]*)>Rate<\/Text>/g, "{data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <Text$1>Rate</Text>}");
  patched = patched.replace(/<Text([^>]*)>Price<\/Text>/g, "{data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <Text$1>Price</Text>}");
  patched = patched.replace(/<Text([^>]*)>Total<\/Text>/g, "{data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text$1>Total</Text>}");
  patched = patched.replace(/<Text([^>]*)>Amount<\/Text>/g, "{data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <Text$1>Amount</Text>}");

  // PDF Table Cells
  patched = patched.replace(/<View([^>]*)>\s*<Text([^>]*)>\{item\.name([^}]*)\}<\/Text>\s*<\/View>/g, "{data.invoiceColumns?.find(c => c.id === 'description')?.visible !== false && <View$1><Text$2>{item.name$3}</Text></View>}");
  patched = patched.replace(/<View([^>]*)>\s*<Text([^>]*)>\{item\.qty\}<\/Text>\s*<\/View>/g, "{data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <View$1><Text$2>{item.qty}</Text></View>}");
  patched = patched.replace(/<View([^>]*)>\s*<Text([^>]*)>\{formatCurrency\(item\.price\)\}<\/Text>\s*<\/View>/g, "{data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <View$1><Text$2>{formatCurrency(item.price)}</Text></View>}");
  patched = patched.replace(/<View([^>]*)>\s*<Text([^>]*)>\{formatCurrency\(item\.qty \* item\.price\)\}<\/Text>\s*<\/View>/g, "{data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <View$1><Text$2>{formatCurrency(item.qty * item.price)}</Text></View>}");

  return patched;
};

const livePreviewPath = path.join(__dirname, 'src', 'components', 'invoice-templates', 'layouts', 'LivePreviewLayouts.jsx');
let lpContent = fs.readFileSync(livePreviewPath, 'utf8');
fs.writeFileSync(livePreviewPath, applyColumnPatches(lpContent));

const pdfTemplatePath = path.join(__dirname, 'src', 'components', 'invoice-templates', 'pdf-layouts', 'PdfTemplateLayouts.jsx');
let pdfContent = fs.readFileSync(pdfTemplatePath, 'utf8');
fs.writeFileSync(pdfTemplatePath, applyColumnPatches(pdfContent));

console.log('Successfully patched columns visibility.');
