import { getCategoryWording } from '../config/businessPresets';

/**
 * Provides a unified schema for rendering invoice columns across all output views
 * (PDF, Public Link, Preview, etc.) to guarantee identical layouts.
 * 
 * @param {Object} invoice - The invoice object containing items and settings.
 * @param {Object} businessSettings - The global business settings as a fallback.
 * @returns {Array} - Array of column definitions
 */
export const DEFAULT_INVOICE_COLUMNS = [
  { id: 'sn', label: 'S.No', visible: true, order: 1 },
  { id: 'item', label: 'Item/Service', visible: true, order: 2 },
  { id: 'hsn', label: 'HSN/SAC', visible: false, order: 3 },
  { id: 'qty', label: 'Quantity', visible: true, order: 4 },
  { id: 'rate', label: 'Rate', visible: true, order: 5 },
  { id: 'discount', label: 'Discount', visible: false, order: 6 },
  { id: 'tax', label: 'Tax', visible: false, order: 7 },
  { id: 'amount', label: 'Amount', visible: true, order: 8 }
];

export const getInvoiceColumns = (invoice, businessSettings = {}) => {
  if (!invoice) return [];

  const bType = invoice.billType || 'default';
  const categoryWords = getCategoryWording(bType);

  const builderSettings = invoice.settings?.invoiceBuilderSettings || businessSettings?.invoiceBuilderSettings || {};
  const customCols = invoice.settings?.customColumns || businessSettings?.customColumns || {};
  const extraCols = builderSettings.customColumns || invoice.settings?.extraColumns || businessSettings?.extraColumns || [];
  
  // Use user's configured columns or fallback to default visibility logic
  let configuredColumns = invoice.invoiceColumns || invoice.settings?.invoiceColumns || businessSettings?.invoiceColumns;
  if (!configuredColumns || !Array.isArray(configuredColumns) || configuredColumns.length === 0) {
    configuredColumns = DEFAULT_INVOICE_COLUMNS;
  }

  const columns = [];
  const sortedConfig = [...configuredColumns].sort((a, b) => a.order - b.order);

  // The builder UI might have old legacy columns like 'sNo', 'description', 'total'
  const legacyMap = { 'sNo': 'sn', 'description': 'item', 'total': 'amount' };
  
  sortedConfig.forEach(conf => {
    if (!conf.visible) return;
    
    const schemaId = legacyMap[conf.id] || conf.id;
    
    if (baseSchema[schemaId]) {
      // Inject custom columns before qty or rate
      if (schemaId === 'qty' || (schemaId === 'rate' && !sortedConfig.find(c => (legacyMap[c.id] || c.id) === 'qty'))) {
        if (!columns.some(c => c.isExtra)) {
          columns.push(...dynamicExtraCols);
        }
      }
      
      let finalLabel = conf.label || baseSchema[schemaId].label;
      if (schemaId === 'item' && builderSettings.itemLabel) {
        finalLabel = builderSettings.itemLabel;
      }
      if (schemaId === 'tax' && builderSettings.taxLabel) {
        finalLabel = builderSettings.taxLabel;
      }
      
      columns.push({
        ...baseSchema[schemaId],
        label: finalLabel
      });
      
      // If unit data exists, inject it after qty
      if (schemaId === 'qty') {
        const hasUnit = (invoice.items || []).some(item => item.unit);
        if (hasUnit && !sortedConfig.find(c => c.id === 'unit')) {
          columns.push(baseSchema.unit);
        }
      }
    } else {
      // It's a custom column from configuredColumns
      columns.push({
        id: conf.id,
        label: conf.label,
        align: 'center',
        width: '10%',
        isExtra: true
      });
    }
  });
  
  if (!columns.some(c => c.isExtra)) {
    columns.push(...dynamicExtraCols);
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
      
    case 'sn':
      return item.sNo !== undefined ? item.sNo : (item.sn !== undefined ? item.sn : '');

    default:
      // Includes 'unit', 'discount', 'tax', 'hsn', and extra custom columns
      return item[colId] !== undefined ? item[colId] : (item.customFields?.[colId] || '');
  }
};
