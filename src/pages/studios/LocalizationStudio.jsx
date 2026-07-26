
const LocalizationStudio = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6 border-b border-theme-border-soft pb-6">
        <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center shadow-inner">
          <Globe2 className="w-6 h-6 text-theme-accent drop-shadow-md" />
        </div>
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-theme-primary to-theme-accent">Localization Studio</h2>
          <p className="text-xs text-theme-secondary font-medium">Configure regional formats, currency, and tax terminologies</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Currency & Numbers */}
        <div className="p-6 bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md shadow-premium-sm">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-5 h-5 text-theme-accent" />
            <h3 className="text-sm font-black text-theme-primary">Currency & Numbers</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Primary Currency</Label>
              <Select 
                value={settings?.currency || 'USD'} 
                onChange={(e) => onUpdate({ currency: e.target.value })}
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
              </Select>
            </div>
            
            <div>
              <Label>Number Format</Label>
              <Select 
                value={settings?.numberFormat || 'en-US'} 
                onChange={(e) => onUpdate({ numberFormat: e.target.value })}
              >
                <option value="en-US">1,234,567.89 (US)</option>
                <option value="de-DE">1.234.567,89 (EU)</option>
                <option value="en-IN">12,34,567.89 (India)</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="p-6 bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md shadow-premium-sm">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-theme-accent" />
            <h3 className="text-sm font-black text-theme-primary">Date & Time</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Timezone</Label>
              <Select 
                value={settings?.timezone || 'UTC'} 
                onChange={(e) => onUpdate({ timezone: e.target.value })}
              >
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="America/New_York">EST (New York)</option>
                <option value="Europe/London">GMT (London)</option>
                <option value="Asia/Dhaka">BST (Dhaka)</option>
                <option value="Asia/Kolkata">IST (New Delhi)</option>
              </Select>
            </div>
            
            <div>
              <Label>Date Format</Label>
              <Select 
                value={settings?.dateFormat || 'MM/DD/YYYY'} 
                onChange={(e) => onUpdate({ dateFormat: e.target.value })}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                <option value="DD MMM YYYY">DD MMM YYYY (31 Dec 2026)</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Terminology / Tax */}
        <div className="md:col-span-2 p-6 bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md shadow-premium-sm">
          <div className="flex items-center gap-3 mb-6">
            <Percent className="w-5 h-5 text-theme-accent" />
            <h3 className="text-sm font-black text-theme-primary">Tax & Terminology</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tax Label (e.g. GST, VAT, Tax)</Label>
              <Input 
                type="text" 
                value={settings?.taxLabel || 'Tax'} 
                onChange={(e) => onUpdate({ taxLabel: e.target.value })}
                placeholder="Tax"
              />
            </div>
            <div>
              <Label>Default Tax Rate (%)</Label>
              <Input 
                type="number" 
                value={settings?.defaultTaxRate || 0} 
                onChange={(e) => onUpdate({ defaultTaxRate: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalizationStudio;
