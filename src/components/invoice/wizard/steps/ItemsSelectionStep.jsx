import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInvoice } from '../../../../contexts/InvoiceContext';
import { invoiceTemplates } from '../../../../config/invoiceTemplates';
import { Plus, Trash2, GripVertical, Package, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as Icons from 'lucide-react';
import ProductSearch from '../../ProductSearch';

const CustomTemplateBuilder = ({ templateFields, setTemplateFields }) => {
  const addField = (type) => {
    const newField = {
      id: `field_${Date.now()}`,
      label: '',
      labelEn: '',
      type: type,
      required: false
    };
    setTemplateFields([...templateFields, newField]);
  };
  
  return (
    <div className="p-6 bg-theme-surface rounded-2xl border border-theme-border-soft mb-6">
      <h4 className="font-extrabold text-theme-primary mb-4 text-sm">Build Custom Template Fields</h4>
      
      <div className="flex gap-2 mb-6">
        <button type="button" onClick={() => addField('text')} className="px-4 py-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-xl text-xs font-bold transition-all">
          + Text Field
        </button>
        <button type="button" onClick={() => addField('number')} className="px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-xl text-xs font-bold transition-all">
          + Number Field
        </button>
        <button type="button" onClick={() => addField('select')} className="px-4 py-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 rounded-xl text-xs font-bold transition-all">
          + Dropdown
        </button>
      </div>
      
      <div className="space-y-3">
        {templateFields.map((field, idx) => (
          <div key={field.id} className="flex items-center gap-3 p-3 bg-theme-card rounded-xl border border-theme-border-soft">
            <input
              placeholder="Field Label (e.g. Serial No)"
              value={field.label}
              onChange={(e) => {
                const updated = [...templateFields];
                updated[idx].label = e.target.value;
                setTemplateFields(updated);
              }}
              className="flex-1 px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-lg text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-accent"
            />
            <span className="text-[10px] font-black uppercase text-theme-muted bg-theme-surface px-2 py-1 rounded">{field.type}</span>
            <button type="button" onClick={() => setTemplateFields(templateFields.filter(f => f.id !== field.id))} className="text-theme-danger hover:bg-theme-danger/10 p-2 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const SortableItem = ({ id, item, index, handleItemChange, removeItemRow, templateFields, currencySymbol, products }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative flex items-start gap-3 p-4 bg-theme-surface border ${isDragging ? 'border-theme-accent shadow-2xl opacity-50 scale-95 rotate-2 z-50' : 'border-theme-border-soft hover:border-theme-border-strong'} rounded-2xl transition-all duration-300 group origin-center`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="mt-3 cursor-grab active:cursor-grabbing text-theme-muted hover:text-theme-primary transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-1 flex flex-wrap gap-3">
        {templateFields.map((field) => {
          let flexBasis = 'flex-1 min-w-[120px]';
          if (field.id === 'item' || field.id === 'product' || field.id === 'service' || field.id === 'design' || field.id === 'issue' || field.id === 'patientName') {
            flexBasis = 'flex-[2] min-w-[200px]';
          }
          if (field.type === 'calculated') {
            flexBasis = 'min-w-[100px]';
          }

          return (
            <div key={field.id} className={`${flexBasis} space-y-1`}>
              <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">{field.label}</label>
              
              {field.type === 'text' && (
                <>
                  {['item', 'product', 'service', 'description'].includes(field.id) ? (
                    <ProductSearch 
                      value={item[field.id] || ''}
                      onChange={(val) => handleItemChange(index, field.id, val)}
                      onSelectProduct={(p) => {
                        const updates = { [field.id]: p.name || p.productName };
                        if (p.price || p.rate) {
                          const rateField = templateFields.find(f => ['rate', 'mrp', 'price'].includes(f.id));
                          if (rateField) updates[rateField.id] = p.price || p.rate;
                        }
                        handleItemChange(index, updates);
                      }}
                      products={products}
                      placeholder={field.labelEn || "Search product..."}
                    />
                  ) : (
                    <input
                      type="text"
                      value={item[field.id] || ''}
                      onChange={(e) => handleItemChange(index, field.id, e.target.value)}
                      className="w-full px-4 py-2.5 bg-theme-card border border-theme-border-soft rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary transition-all"
                      placeholder={field.labelEn}
                    />
                  )}
                </>
              )}
              
              {field.type === 'number' && (
                <div className="relative">
                  {['rate', 'mrp', 'fee', 'labor', 'parts', 'amount'].includes(field.id) && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted font-bold text-sm">{currencySymbol}</span>}
                  <input
                    type="number"
                    value={item[field.id] === 0 ? '' : item[field.id] || ''}
                    onChange={(e) => handleItemChange(index, field.id, e.target.value)}
                    className={`w-full px-4 py-2.5 bg-theme-card border border-theme-border-soft rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary transition-all ${['rate', 'mrp', 'fee', 'labor', 'parts', 'amount'].includes(field.id) ? 'pl-8 text-right' : 'text-center'}`}
                    placeholder="0"
                  />
                </div>
              )}
              
              {field.type === 'select' && (
                <select
                  value={item[field.id] || (field.options && field.options[0]) || ''}
                  onChange={(e) => handleItemChange(index, field.id, e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-card border border-theme-border-soft rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary transition-all"
                >
                  {field.options && field.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
              
              {field.type === 'calculated' && (
                <div className="w-full px-4 py-2.5 bg-theme-app border border-theme-border-soft rounded-xl text-sm font-black text-theme-accent flex items-center justify-end">
                  {currencySymbol}{(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => removeItemRow(index)}
        className="mt-2.5 p-2 text-theme-danger/70 hover:text-theme-danger hover:bg-theme-danger/10 rounded-xl transition-all"
        title="Remove Item"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

const ItemsSelectionStep = ({ products = [] }) => {
  const { state, dispatch, businessSettings } = useInvoice();
  const { items, selectedTemplate, templateFields } = state;
  const currencySymbol = businessSettings?.currency || '₹';
  
  const currentTemplate = invoiceTemplates.find(t => t.id === selectedTemplate) || invoiceTemplates[0];
  const TemplateIcon = currentTemplate.icon ? Icons[currentTemplate.icon] : null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      dispatch({ type: 'SET_ITEMS', payload: newItems });
    }
  };

  const setCustomTemplateFields = (newFields) => {
    dispatch({
        type: 'INIT_INVOICE',
        payload: { templateFields: newFields }
    });
  };

  const safeEval = (expr) => {
    const cleaned = expr.replace(/[^0-9+\-*/.() ]/g, '');
    if (cleaned !== expr.trim()) return NaN;
    try {
      return Function('"use strict"; return (' + cleaned + ')')();
    } catch { return NaN; }
  };

  const calculateFieldValue = (item, formula) => {
    if (!formula) return 0;
    try {
      let evaluated = formula;
      Object.keys(item).forEach(key => {
        const val = parseFloat(item[key]) || 0;
        evaluated = evaluated.replace(new RegExp(`\\b${key}\\b`, 'g'), val);
      });
      const result = safeEval(evaluated);
      return isNaN(result) ? 0 : result;
    } catch (e) {
      return 0;
    }
  };

  const handleItemChange = (index, fieldOrUpdates, optionalValue) => {
    const newItems = [...items];
    
    if (typeof fieldOrUpdates === 'string') {
        const field = fieldOrUpdates;
        const isNumField = templateFields.find(f => f.id === field)?.type === 'number';
        newItems[index][field] = isNumField ? (optionalValue === '' ? '' : (parseFloat(optionalValue) || 0)) : optionalValue;
    } else {
        Object.entries(fieldOrUpdates).forEach(([field, val]) => {
            const isNumField = templateFields.find(f => f.id === field)?.type === 'number';
            newItems[index][field] = isNumField ? (val === '' ? '' : (parseFloat(val) || 0)) : val;
        });
    }

    // Auto-calculate formula fields
    const calcField = templateFields.find(f => f.type === 'calculated');
    if (calcField && calcField.formula) {
        newItems[index].amount = calculateFieldValue(newItems[index], calcField.formula);
    }

    dispatch({ type: 'SET_ITEMS', payload: newItems });
  };

  const handleAddItem = () => {
    const generateId = () => {
      try {
        return crypto.randomUUID();
      } catch (e) {
        return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    };

    const newItem = { 
        ...currentTemplate.defaultItem, 
        id: generateId(),
        sn: items.length + 1
    };
    dispatch({ type: 'SET_ITEMS', payload: [...items, newItem] });
  };

  const removeItemRow = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    dispatch({ type: 'SET_ITEMS', payload: newItems });
  };

  return (
    <div className="bg-theme-card border border-theme-border-soft rounded-3xl p-6 shadow-premium h-full flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-theme-primary flex items-center gap-2">
            {TemplateIcon && <TemplateIcon className="w-6 h-6 text-theme-accent" />}
            {currentTemplate.name} Items
          </h2>
          <p className="text-sm text-theme-muted font-medium mt-1">Add products or services and drag to reorder.</p>
        </div>
        
        <button
          onClick={handleAddItem}
          className="px-4 py-2 bg-theme-accent text-white rounded-xl hover:shadow-lg transition-all font-bold text-sm hidden sm:block"
        >
          + Add Item
        </button>
      </div>

      {selectedTemplate === 'custom' && (
        <CustomTemplateBuilder 
          templateFields={templateFields} 
          setTemplateFields={setCustomTemplateFields} 
        />
      )}

      {/* ITEMS LIST */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-6">
        {items.length === 0 ? (
           <div className="text-center py-16 border-2 border-dashed border-theme-border-soft rounded-2xl">
            <Package className="w-16 h-16 mx-auto text-theme-border-strong mb-4" />
            <p className="text-theme-muted font-bold mb-4">No items added yet</p>
            <button
              onClick={handleAddItem}
              className="px-6 py-3 bg-theme-accent text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Add First Item
            </button>
          </div>
        ) : (
            <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            >
            <SortableContext
                items={items.map(i => i.id)}
                strategy={verticalListSortingStrategy}
            >
                {items.map((item, index) => (
                <SortableItem 
                    key={item.id}
                    id={item.id}
                    item={item}
                    index={index}
                    handleItemChange={handleItemChange}
                    removeItemRow={removeItemRow}
                    templateFields={templateFields}
                    currencySymbol={currencySymbol}
                    products={products}
                />
                ))}
            </SortableContext>
            </DndContext>
        )}

        {items.length > 0 && (
            <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleAddItem}
            className="w-full mt-4 py-4 border-2 border-dashed border-theme-border-strong hover:border-theme-accent text-theme-muted hover:text-theme-accent bg-theme-surface hover:bg-theme-accent-light rounded-2xl flex items-center justify-center gap-2 text-sm font-black transition-colors"
            >
            <Plus className="w-5 h-5" /> Add Another Item
            </motion.button>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-theme-border-soft flex justify-end">
        <div className="text-right">
          <p className="text-xs font-bold text-theme-muted uppercase tracking-wider mb-1">Subtotal</p>
          <p className="text-2xl font-black text-theme-primary">{currencySymbol}{state.totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
    </div>
  );
};

export default ItemsSelectionStep;
