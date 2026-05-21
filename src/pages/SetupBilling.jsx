import React, { useState } from 'react';
import { Scissors, ShoppingBasket, Wrench, ShoppingBag, PenTool, CheckCircle2 } from 'lucide-react';

const SetupBilling = ({ businessSettings, onSaveSettings, setCurrentTab }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const templates = [
    {
      id: 'embroidery',
      title: 'Embroidery / Fashion',
      icon: <Scissors className="w-6 h-6 text-pink-500" />,
      color: 'bg-pink-50 border-pink-200 hover:border-pink-500',
      description: 'For embroidery, fashion, dress, blouse, stitching, design, and custom work.',
      fields: 'Design No, Work Type, Description, Size, Quantity, Rate, Amount'
    },
    {
      id: 'grocery',
      title: 'Grocery / Mudi Shop',
      icon: <ShoppingBasket className="w-6 h-6 text-orange-500" />,
      color: 'bg-orange-50 border-orange-200 hover:border-orange-500',
      description: 'For grocery, kirana, product, unit, quantity, and fast shop billing.',
      fields: 'Product Name, Unit, Quantity, Unit Price, Amount'
    },
    {
      id: 'repair',
      title: 'Repair / Service',
      icon: <Wrench className="w-6 h-6 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200 hover:border-blue-500',
      description: 'For mobile repair, machine repair, tailoring service, labour charge, and service work.',
      fields: 'Service Name, Problem Details, Parts Cost, Labour Charge, Quantity, Amount'
    },
    {
      id: 'retail',
      title: 'Retail / Shopping',
      icon: <ShoppingBag className="w-6 h-6 text-purple-500" />,
      color: 'bg-purple-50 border-purple-200 hover:border-purple-500',
      description: 'For clothes, shoes, products, shopping store, discount, and customer bills.',
      fields: 'Product Name, Category, Size/Variant, Quantity, Price, Discount, Amount'
    },
    {
      id: 'custom',
      title: 'Custom Bill',
      icon: <PenTool className="w-6 h-6 text-slate-500" />,
      color: 'bg-slate-50 border-slate-200 hover:border-slate-500',
      description: 'Flexible invoice format for any business.',
      fields: 'Item/Service, Description, Quantity, Rate, Amount'
    }
  ];

  const handleSave = () => {
    if (!selectedTemplate) {
      alert('Please select a billing setup to continue.');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      onSaveSettings({
        ...businessSettings,
        defaultBillingTemplate: selectedTemplate
      });
      setCurrentTab('dashboard');
    }, 400); // Small delay for UX feel
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F9FC] to-[#E5EAF1] p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="bg-[#071B3A] text-white p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#19C3A3]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black mb-3">Choose Your Billing Setup</h1>
            <p className="text-slate-300 max-w-xl mx-auto">
              Select your business type. BillQyro will prepare the right invoice format for you. You can change this later in settings.
            </p>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {templates.map((tpl) => {
              const isSelected = selectedTemplate === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected ? 'border-[#19C3A3] bg-[#19C3A3]/5 shadow-md scale-[1.02]' : tpl.color
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-4 right-4 text-[#19C3A3]">
                      <CheckCircle2 className="w-6 h-6 fill-current text-white" />
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4">
                    {tpl.icon}
                  </div>
                  <h3 className="font-black text-slate-800 text-lg mb-2">{tpl.title}</h3>
                  <p className="text-xs text-slate-500 mb-4">{tpl.description}</p>
                  
                  <div className="mt-auto">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prepared Fields:</div>
                    <div className="text-xs font-medium text-slate-700 bg-white/50 p-2 rounded-lg border border-slate-100">
                      {tpl.fields}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleSave}
              disabled={isSaving || !selectedTemplate}
              className="bg-gradient-to-r from-[#071B3A] to-[#14284B] hover:from-[#19C3A3] hover:to-[#12B76A] text-white font-black px-10 py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Continue to Dashboard</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SetupBilling;
