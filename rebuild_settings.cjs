const fs = require('fs');

try {
  let code = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

  // Update SETTINGS_GROUPS
  const newSettingsGroups = `const SETTINGS_GROUPS = [
    {
      group: 'Configuration',
      items: [
        { id: 'general', label: 'General', icon: Settings2, description: 'Basic settings' },
        { id: 'business', label: 'Business Profile', icon: Building2, description: 'Company details' },
        { id: 'workspace', label: 'Workspace', icon: Globe, description: 'Regional settings' }
      ]
    },
    {
      group: 'Studios',
      items: [
        { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Themes and colors' },
        { id: 'pdf-studio', label: 'PDF Studio', icon: LayoutTemplate, description: 'Invoice PDF layouts' },
        { id: 'livelink-studio', label: 'Live Link Studio', icon: Link, description: 'Customer portal' },
        { id: 'template-studio', label: 'Template Studio', icon: ImageIcon, description: 'Template marketplace' }
      ]
    },
    {
      group: 'Billing & Alerts',
      items: [
        { id: 'payment', label: 'Payments', icon: QrCode, description: 'Payment methods' },
        { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Reminders and alerts' },
        { id: 'subscription', label: 'Subscription', icon: CreditCard, description: 'Plan and billing' }
      ]
    },
    {
      group: 'System',
      items: [
        { id: 'security', label: 'Security', icon: Shield, description: 'Access control' },
        { id: 'backup', label: 'Backup & Restore', icon: Database, description: 'Data management' },
        { id: 'advanced', label: 'Advanced', icon: Settings2, description: 'Danger zone' }
      ]
    }
  ];`;

  // We need to inject LayoutTemplate, Link, ImageIcon, Bell, Shield, etc., into imports if missing
  const lucideImports = ['LayoutTemplate', 'Link', 'ImageIcon', 'Bell', 'Shield', 'Settings2', 'Palette', 'QrCode', 'CreditCard', 'Database', 'Globe', 'Building2'];
  
  lucideImports.forEach(imp => {
    if (!code.includes(imp)) {
      code = code.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, group1) => {
        return `import { ${group1}, ${imp} } from 'lucide-react';`;
      });
    }
  });

  code = code.replace(/const SETTINGS_GROUPS = \[\s*[\s\S]*?\s*\];\s*const ALL_CATEGORY_IDS/, newSettingsGroups + '\n\nconst ALL_CATEGORY_IDS');

  if (!code.includes('TemplateMarketplace')) {
    code = code.replace("import BackupRestore from './BackupRestore';", "import BackupRestore from './BackupRestore';\nimport TemplateMarketplace from './TemplateMarketplace';");
  }

  const navStart = code.indexOf('{/* Horizontal Pill Navigation */}');
  const contentAreaEnd = code.indexOf('{/* Reset All Data Modal */}');

  if (navStart > -1 && contentAreaEnd > -1) {
    let innerContent = code.substring(navStart, contentAreaEnd);
    
    const newLayout = `
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Navigation Sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="glass rounded-3xl p-4 border border-theme-border-soft shadow-sm sticky top-24 space-y-6">
              {filteredGroups.map((group, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-theme-muted px-3 mb-2">{group.group}</h4>
                  {group.items.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = effectiveActiveCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 \${
                          isSelected
                            ? 'bg-[image:var(--accent-gradient)] text-white shadow-md'
                            : 'text-theme-muted hover:text-theme-primary hover:bg-theme-surface border border-transparent hover:border-theme-border-soft'
                        }\`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0 space-y-6 overflow-hidden">
            {/* ============ GENERAL ============ */}
            {effectiveActiveCategory === 'general' && (
              <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
                <div className="section-header border-b border-theme-border-soft pb-4">
                  <h2 className="section-header-title">General Settings</h2>
                  <p className="section-header-subtitle">Basic configuration for your BillQyro experience.</p>
                </div>
                <div className="bg-theme-app border border-theme-border-soft rounded-2xl p-6">
                  <p className="text-sm text-theme-muted">Welcome to your Control Center. Use the sidebar to navigate all settings without leaving this page.</p>
                </div>
              </div>
            )}
  `;

    const contentAreaStart = innerContent.indexOf('{/* Content Area */}');
    let onlyContent = innerContent.substring(contentAreaStart);
    onlyContent = onlyContent.replace('{/* Content Area */}\n      <div className="w-full space-y-6">', '');

    const appearanceStr = `
            {effectiveActiveCategory === 'appearance' && (
              <div className="animate-fadeIn"><DesignStudio /></div>
            )}
            {effectiveActiveCategory === 'pdf-studio' && (
              <div className="animate-fadeIn"><PdfTemplateStudio /></div>
            )}
            {effectiveActiveCategory === 'livelink-studio' && (
              <div className="animate-fadeIn"><LiveLinkTemplateStudio /></div>
            )}
            {effectiveActiveCategory === 'template-studio' && (
              <div className="animate-fadeIn"><TemplateMarketplace /></div>
            )}
    `;

    onlyContent = appearanceStr + onlyContent;

    const securityStr = `
            {effectiveActiveCategory === 'security' && (
              <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
                 <div className="section-header border-b border-theme-border-soft pb-4">
                    <h2 className="section-header-title">Security</h2>
                    <p className="section-header-subtitle">Manage your account security and authentication.</p>
                 </div>
                 <div className="bg-theme-app border border-theme-border-soft rounded-2xl p-6">
                   <p className="text-xs text-theme-muted">Your account is secured by Google Firebase Auth. Password management is handled by your Google account.</p>
                 </div>
              </div>
            )}
    `;

    const notificationsStr = `
            {effectiveActiveCategory === 'notifications' && (
              <div className="card-premium p-6 md:p-8 space-y-6 animate-fadeIn">
                 <div className="section-header border-b border-theme-border-soft pb-4">
                    <h2 className="section-header-title">Notifications</h2>
                    <p className="section-header-subtitle">Manage how you receive alerts and reminders.</p>
                 </div>
                 <div className="space-y-4">
                    <p className="text-xs text-theme-muted">Notification settings are synced with your preferences automatically.</p>
                 </div>
              </div>
            )}
    `;

    onlyContent = securityStr + notificationsStr + onlyContent;
    const fullReplacement = newLayout + onlyContent + "\n        </div>\n      </div>\n";
    code = code.substring(0, navStart) + fullReplacement + code.substring(contentAreaEnd);
    
    // Check if there are states missing like emailNotifications, whatsappNotifications.
    // If not, we just show a placeholder text for now in those new sections to avoid undefined errors.

    fs.writeFileSync('src/pages/Settings.jsx', code);
    console.log('Success');
  } else {
    console.log('Could not find anchor points', navStart, contentAreaEnd);
  }
} catch(e) {
  console.error(e);
}
