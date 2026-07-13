import React, { useState } from 'react';
import { FormInput, Plus, Trash2, Settings, ArrowUp, ArrowDown } from 'lucide-react';

const FIELD_TYPES = [
  { id: 'text', label: 'Short Text' },
  { id: 'number', label: 'Number' },
  { id: 'date', label: 'Date' },
  { id: 'dropdown', label: 'Dropdown' },
  { id: 'checkbox', label: 'Checkbox' }
];

const FormBuilder = ({ settings, onUpdate }) => {
  // `settings.customFields` will hold arrays of fields for 'invoice' and 'customer'
  const customFields = settings?.customFields || { invoice: [], customer: [] };
  const [activeTab, setActiveTab] = useState('invoice');

  const fields = customFields[activeTab] || [];

  const handleAddField = () => {
    const newField = {
      id: 'field_' + Date.now(),
      label: 'New Custom Field',
      type: 'text',
      required: false,
      options: '' // used for dropdown
    };
    onUpdate({
      customFields: { ...customFields, [activeTab]: [...fields, newField] }
    });
  };

  const handleUpdateField = (index, key, value) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], [key]: value };
    onUpdate({
      customFields: { ...customFields, [activeTab]: updatedFields }
    });
  };

  const handleRemoveField = (index) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    onUpdate({
      customFields: { ...customFields, [activeTab]: updatedFields }
    });
  };

  const moveField = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === fields.length - 1) return;
    
    const updatedFields = [...fields];
    const temp = updatedFields[index];
    updatedFields[index] = updatedFields[index + direction];
    updatedFields[index + direction] = temp;
    
    onUpdate({
      customFields: { ...customFields, [activeTab]: updatedFields }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-black text-theme-primary flex items-center">
            <FormInput className="w-6 h-6 mr-3 text-rose-500" /> Form Builder
          </h2>
          <p className="text-xs text-theme-muted mt-1">Design custom data collection fields for your business entities.</p>
        </div>
        <div className="flex gap-2 p-1.5 bg-theme-surface rounded-2xl border border-theme-border-soft">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
              activeTab === 'invoice' ? 'bg-rose-500 text-white shadow-lg' : 'text-theme-muted hover:text-white'
            }`}
          >
            Invoice Fields
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
              activeTab === 'customer' ? 'bg-rose-500 text-white shadow-lg' : 'text-theme-muted hover:text-white'
            }`}
          >
            Customer Fields
          </button>
        </div>
      </div>

      <div className="card-premium p-6">
        {fields.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-theme-border-soft rounded-2xl">
            <FormInput className="w-8 h-8 text-theme-muted mx-auto mb-3" />
            <h3 className="text-sm font-bold text-theme-primary mb-1">No Custom Fields</h3>
            <p className="text-[10px] text-theme-muted mb-4">You haven't added any custom fields for {activeTab}s yet.</p>
            <button 
              onClick={handleAddField}
              className="px-4 py-2 bg-rose-500/10 text-rose-500 font-bold text-xs rounded-xl hover:bg-rose-500/20 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add First Field
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 bg-theme-surface/50 border border-theme-border-soft rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center relative group">
                <div className="flex flex-col gap-1 w-full md:w-1/3">
                  <label className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Field Label</label>
                  <input 
                    type="text"
                    value={field.label}
                    onChange={(e) => handleUpdateField(index, 'label', e.target.value)}
                    className="w-full bg-theme-main border border-theme-border-soft text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="flex flex-col gap-1 w-full md:w-1/4">
                  <label className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Field Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => handleUpdateField(index, 'type', e.target.value)}
                    className="w-full bg-theme-main border border-theme-border-soft text-white text-xs px-3 py-2 rounded-lg focus:outline-none cursor-pointer"
                  >
                    {FIELD_TYPES.map(ft => <option key={ft.id} value={ft.id}>{ft.label}</option>)}
                  </select>
                </div>
                
                {field.type === 'dropdown' && (
                  <div className="flex flex-col gap-1 w-full md:w-1/3">
                    <label className="text-[9px] font-bold text-theme-muted uppercase tracking-wider">Options (Comma separated)</label>
                    <input 
                      type="text"
                      value={field.options || ''}
                      placeholder="Opt 1, Opt 2, Opt 3"
                      onChange={(e) => handleUpdateField(index, 'options', e.target.value)}
                      className="w-full bg-theme-main border border-theme-border-soft text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-rose-500"
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-4 md:mt-0 ml-auto md:ml-4 shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-theme-muted font-bold mr-2">
                    <input 
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => handleUpdateField(index, 'required', e.target.checked)}
                      className="rounded bg-theme-main border-theme-border-soft accent-rose-500"
                    /> Required
                  </label>
                  <div className="flex items-center bg-theme-main rounded-lg border border-theme-border-soft p-1">
                    <button onClick={() => moveField(index, -1)} disabled={index === 0} className="p-1 hover:text-white text-theme-muted disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                    <button onClick={() => moveField(index, 1)} disabled={index === fields.length - 1} className="p-1 hover:text-white text-theme-muted disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                  </div>
                  <button onClick={() => handleRemoveField(index)} className="p-2 bg-theme-danger/10 text-theme-danger hover:bg-theme-danger/20 rounded-lg ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="pt-2">
              <button 
                onClick={handleAddField}
                className="w-full py-3 bg-theme-surface border border-theme-border-soft border-dashed text-theme-muted hover:text-white hover:border-theme-muted font-bold text-xs rounded-2xl transition-colors inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Custom Field
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormBuilder;
