import { useState } from 'react';

const DEFAULT_PORTALS = [
  { id: 'uidai', name: 'Aadhaar (UIDAI)', url: 'https://uidai.gov.in', category: 'Govt' },
  { id: 'pan', name: 'PAN Card (NSDL)', url: 'https://www.onlineservices.nsdl.com', category: 'Govt' },
  { id: 'passport', name: 'Passport Seva', url: 'https://www.passportindia.gov.in', category: 'Govt' },
  { id: 'gst', name: 'GST Portal', url: 'https://www.gst.gov.in', category: 'Business' },
  { id: 'irctc', name: 'IRCTC Train', url: 'https://www.irctc.co.in', category: 'Travel' },
  { id: 'csc', name: 'CSC Digital Seva', url: 'https://digitalseva.csc.gov.in', category: 'Services' },
];

export default function PortalHub() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = DEFAULT_PORTALS.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8 max-w-7xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-theme-primary tracking-tight mb-2">Portal Hub</h1>
          <p className="text-theme-muted font-medium">Quick access to official government and business portals.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
          <input
            type="text"
            placeholder="Search portals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-theme-surface border border-theme-border-soft rounded-xl py-2 pl-9 pr-4 text-sm font-bold focus:border-theme-accent transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(portal => (
          <a
            key={portal.id}
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-theme-card border border-theme-border-soft p-5 rounded-2xl hover:border-theme-accent hover:shadow-lg transition-all group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-theme-accent/10 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-theme-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-theme-primary mb-1 truncate group-hover:text-theme-accent transition-colors">{portal.name}</h3>
              <p className="text-xs text-theme-muted truncate">{portal.url.replace('https://', '')}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-theme-muted group-hover:text-theme-accent opacity-0 group-hover:opacity-100 transition-all shrink-0" />
          </a>
        ))}
      </div>
    </motion.div>
  );
}
