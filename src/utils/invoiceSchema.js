import { getCategoryWording } from '../config/businessPresets';

/**
 * Provides a unified schema for rendering invoice columns across all output views
 * (PDF, Public Link, Preview, etc.) to guarantee identical layouts.
 * 
 * @param {Object} invoice - The invoice object containing items and settings.
 * @param {Object} businessSettings - The global business settings as a fallback.
 * @returns {Array} - Array of column definitions
 */
export const getInvoiceColumns = (invoice, businessSettings = {}) => {
  if (!invoice) return [];

  const bType = invoice.billType || 'default';
  const categoryWords = getCategoryWording(bType);

  // Extract customizations
  const customCols = invoice.settings?.customColumns || businessSettings?.customColumns || {};
  const extraCols = invoice.settings?.extraColumns || businessSettings?.extraColumns || [];

  // Define base columns based on bill type for semantic fallback labels
  const col1Label = customCols.col1 || (bType === 'grocery' || bType === 'retail' ? 'Product' : bType === 'repair' ? 'Service' : bType === 'custom' ? 'Item' : categoryWords.items || 'Item Name');
  const col2Label = customCols.col2 || categoryWords.qty || 'Qty';
  const col3Label = customCols.col3 || categoryWords.price || 'Rate';

  // Base Schema definition for all standard fields
  const baseSchema = {
    sn: { id: 'sn', label: '#', align: 'center', width: '5%' },
    col1: { id: 'col1', label: col1Label, align: 'left', width: '25%' },
    description: { id: 'description', label: 'Details', align: 'left', width: '20%' },
    qty: { id: 'qty', label: col2Label, align: 'center', width: '10%' },
    unit: { id: 'unit', label: 'Unit', align: 'center', width: '8%' },
    rate: { id: 'rate', label: col3Label, align: 'right', width: '12%' },
    discount: { id: 'discount', label: 'Disc', align: 'right', width: '8%' },
    tax: { id: 'tax', label: 'Tax', align: 'right', width: '8%' },
    amount: { id: 'amount', label: 'Total', align: 'right', width: '15%' }
  };

  // Convert extra columns into the same format
  const dynamicExtraCols = extraCols.map((col) => ({
    id: col.id,
    label: col.label,
    align: 'center',
    width: '10%', // will be adjusted relative to the container
    isExtra: true
  }));

  // Build the final array of columns to render
  const columns = [];

  columns.push(baseSchema.sn);
  columns.push(baseSchema.col1);

  // If the invoice actually has description data OR it's not a retail bill, show description
  // Note: some legacy templates didn't show description for retail, but if we are unifying, we should check if data exists or just always show it if it's in the builder.
  // The builder ALWAYS has description. We should include it, but perhaps check if ANY item has it to save space?
  const hasDescription = (invoice.items || []).some(item => item.description || (bType !== 'custom' && item.workType));
  if (hasDescription) {
    columns.push(baseSchema.description);
  }

  // Insert extra columns BEFORE qty
  columns.push(...dynamicExtraCols);

  columns.push(baseSchema.qty);

  const hasUnit = (invoice.items || []).some(item => item.unit);
  if (hasUnit) {
    columns.push(baseSchema.unit);
  }

  columns.push(baseSchema.rate);

  const hasDiscount = (invoice.items || []).some(item => parseFloat(item.discount || 0) > 0);
  if (hasDiscount) {
    columns.push(baseSchema.discount);
  }

  // Tax column
  const hasTax = (invoice.items || []).some(item => parseFloat(item.tax || 0) > 0);
  if (hasTax) {
    columns.push(baseSchema.tax);
  }

  columns.push(baseSchema.amount);

  // Recalculate widths to ensure they sum to roughly 100%
  const count = columns.length;
  // Sn: 5%, Amount: 15%, col1 takes remaining
  const fixedWidths = { 'sn': 5, 'amount': 15, 'qty': 8, 'rate': 12 };
  let remainingWidth = 100 - Object.values(fixedWidths).reduce((a, b) => a + b, 0);
  
  const flexibleCols = columns.filter(c => !fixedWidths[c.id]);
  const flexWidth = Math.floor(remainingWidth / flexibleCols.length);

  return columns.map(col => ({
    ...col,
    width: fixedWidths[col.id] ? `${fixedWidths[col.id]}%` : `${flexWidth}%`
  }));
};

/**
 * Unified item value getter
 */
export const getItemValue = (item, colId, bType) => {
  if (!item) return '';

  switch (colId) {
    case 'col1':
      // Map UI values based on billType legacy support
      if (bType === 'grocery') return item.description || item.itemService || 'Product';
      if (bType === 'retail') return item.productName || item.itemService || 'Product';
      if (bType === 'repair') return item.designNo || item.itemService || 'Service';
      if (bType === 'default' || bType === 'embroidery') return item.designNo || item.itemService || '—';
      return item.itemService || 'Item';
    
    case 'description':
      if (bType === 'retail') return item.sizeVariant || item.description || '';
      if (bType === 'grocery') return item.size || item.description || '';
      if (bType === 'default' || bType === 'embroidery') {
        const wt = item.workType ? `[${item.workType}] ` : '';
        const sz = item.size && item.size !== 'N/A' ? ` Size: ${item.size}` : '';
        return `${wt}${item.description || ''}${sz}`;
      }
      return item.description || '';
      
    case 'qty':
      return item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1);
      
    case 'rate':
      return item.rate !== undefined ? item.rate : (item.price !== undefined ? item.price : 0);
      
    case 'amount':
      return item.amount !== undefined ? item.amount : (item.total !== undefined ? item.total : 0);
      
    default:
      // Includes 'unit', 'discount', 'tax', and extraCols
      return item[colId] || '';
  }
};
