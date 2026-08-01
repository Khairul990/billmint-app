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

  const builderSettings = invoice.settings?.invoiceBuilderSettings || businessSettings?.invoiceBuilderSettings || {};
  const customCols = invoice.settings?.customColumns || businessSettings?.customColumns || {};
  const extraCols = builderSettings.customColumns || invoice.settings?.extraColumns || businessSettings?.extraColumns || [];
  
  // Use user's configured columns or fallback to default visibility logic
  const configuredColumns = invoice.settings?.invoiceColumns || businessSettings?.invoiceColumns;

  const col1Label = builderSettings.itemLabel || customCols.col1 || (bType === 'grocery' || bType === 'retail' ? 'Product' : bType === 'repair' ? 'Service' : bType === 'custom' ? 'Item' : categoryWords.items || 'Item Name');
  const col2Label = customCols.col2 || categoryWords.qty || 'Qty';
  const col3Label = customCols.col3 || categoryWords.price || 'Rate';

  const baseSchema = {
    sn: { id: 'sn', label: '#', align: 'center', width: '5%' },
    item: { id: 'item', label: col1Label, align: 'left', width: '25%' },
    hsn: { id: 'hsn', label: 'HSN/SAC', align: 'center', width: '10%' },
    description: { id: 'description', label: 'Details', align: 'left', width: '20%' },
    qty: { id: 'qty', label: col2Label, align: 'center', width: '10%' },
    unit: { id: 'unit', label: 'Unit', align: 'center', width: '8%' },
    rate: { id: 'rate', label: col3Label, align: 'right', width: '12%' },
    discount: { id: 'discount', label: 'Disc', align: 'right', width: '8%' },
    tax: { id: 'tax', label: 'Tax', align: 'right', width: '8%' },
    amount: { id: 'amount', label: 'Total', align: 'right', width: '15%' }
  };

  const dynamicExtraCols = extraCols.map((col) => ({
    id: col.id, // e.g. col_123
    label: col.name,
    align: 'center',
    width: '10%',
    isExtra: true
  }));

  const columns = [];

  // SN is always first
  columns.push(baseSchema.sn);

  if (configuredColumns) {
    // If studio columns are configured, follow their visibility and order
    const sortedConfig = [...configuredColumns].sort((a, b) => a.order - b.order);
    
    sortedConfig.forEach(conf => {
      if (conf.visible && baseSchema[conf.id]) {
        columns.push(baseSchema[conf.id]);
        
        // Add description right after item if configured
        if (conf.id === 'item') {
          const hasDescription = (invoice.items || []).some(item => item.description || (bType !== 'custom' && item.workType));
          if (hasDescription) {
            columns.push(baseSchema.description);
          }
          // Also insert custom columns after item
          columns.push(...dynamicExtraCols);
        }
        
        // If unit data exists, inject it after qty
        if (conf.id === 'qty') {
          const hasUnit = (invoice.items || []).some(item => item.unit);
          if (hasUnit) {
            columns.push(baseSchema.unit);
          }
        }
      }
    });
  } else {
    // Fallback legacy logic
    columns.push(baseSchema.item);
    
    const hasDescription = (invoice.items || []).some(item => item.description || (bType !== 'custom' && item.workType));
    if (hasDescription) {
      columns.push(baseSchema.description);
    }
    
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
    
    const hasTax = (invoice.items || []).some(item => parseFloat(item.tax || 0) > 0);
    if (hasTax) {
      columns.push(baseSchema.tax);
    }
    
    columns.push(baseSchema.amount);
  }

  const fixedWidths = { 'sn': 5, 'amount': 15, 'qty': 8, 'rate': 12 };
  let remainingWidth = 100 - Object.values(fixedWidths).reduce((a, b) => a + b, 0);
  
  const flexibleCols = columns.filter(c => !fixedWidths[c.id]);
  const flexWidth = Math.floor(remainingWidth / (flexibleCols.length || 1));

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
    case 'item':
    case 'col1':
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
      // Includes 'unit', 'discount', 'tax', 'hsn', and extra custom columns
      return item[colId] || item.customFields?.[colId] || '';
  }
};
