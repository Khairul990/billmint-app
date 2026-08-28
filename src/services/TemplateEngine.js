import { 
  LayoutTemplate, Palette, Globe, Monitor, Smartphone, Tablet, 
  Building2, Briefcase, Stethoscope, Wrench, ShoppingBag, Crown
} from 'lucide-react';

export const UNIVERSAL_TEMPLATES = [
  { id: 'classic', name: 'Clean Classic', type: 'FREE', icon: LayoutTemplate, desc: 'Simple, timeless layout.', tags: ['A4', 'A5', 'Print'], layoutFamily: 'classic' },
  { id: 'cartoon', name: 'Cartoon Premium', type: 'FREE', icon: Palette, desc: 'Premium modern layout with custom branding.', tags: ['A4', 'Brand'], layoutFamily: 'modern' },
  { id: 'modern', name: 'Modern Card', type: 'FREE', icon: LayoutTemplate, desc: 'Card-based modern layout.', tags: ['A4', 'Digital'], layoutFamily: 'modern' },
  { id: 'minimal', name: 'Minimalist', type: 'FREE', icon: LayoutTemplate, desc: 'Clean, distraction-free typography focused.', tags: ['A4', 'Clean'], layoutFamily: 'minimal' },
  { id: 'retail', name: 'Retail Checkout', type: 'FREE', icon: ShoppingBag, desc: 'POS checkout receipt style.', tags: ['Thermal', 'Mobile'], layoutFamily: 'retail' },
  
  { id: 'premium-gold', name: 'Premium Gold', type: 'PRO', icon: Crown, desc: 'Dark theme with gold accents for luxury brands.', tags: ['A4', 'Luxury'], layoutFamily: 'gold' },
  { id: 'classic-elegant', name: 'Classic Elegant', type: 'PRO', icon: Briefcase, desc: 'Traditional emerald elegance.', tags: ['A4', 'Corporate'], layoutFamily: 'corporate' },
  
  { id: 'corporate', name: 'Premium Corporate', type: 'PRO', icon: Building2, desc: 'Professional enterprise look.', tags: ['A4', 'Digital'], layoutFamily: 'corporate' },
  { id: 'boutique', name: 'Boutique / Tailor', type: 'PRO', icon: Briefcase, desc: 'Elegant fashion/order style.', tags: ['A4', 'Fashion'], layoutFamily: 'minimal' },
  { id: 'clinic', name: 'Clinic / Medical', type: 'PRO', icon: Stethoscope, desc: 'Clean medical design.', tags: ['A4', 'Healthcare'], layoutFamily: 'classic' },
  { id: 'repair', name: 'Service & Repair', type: 'PRO', icon: Wrench, desc: 'Job/Service status focused.', tags: ['A4', 'Service'], layoutFamily: 'repair' },
  { id: 'executive', name: 'Executive Portal', type: 'PRO', icon: Building2, desc: 'High-end executive client portal.', tags: ['A4', 'Luxury'], layoutFamily: 'gold' },
  { id: 'saas', name: 'SaaS Dashboard', type: 'PRO', icon: Monitor, desc: 'Modern SaaS subscription billing view.', tags: ['A4', 'Tech'], layoutFamily: 'modern' },
  { id: 'teacher', name: 'Teacher Portal', type: 'PRO', icon: Globe, desc: 'School fee collection portal.', tags: ['A4', 'Education'], layoutFamily: 'teacher' },
  { id: 'medical', name: 'Medical Portal', type: 'PRO', icon: Stethoscope, desc: 'Hospital bill payment portal.', tags: ['A4', 'Healthcare'], layoutFamily: 'doctor' },
  { id: 'tailor', name: 'Tailor Studio', type: 'PRO', icon: Briefcase, desc: 'Custom fashion and tailoring order portal.', tags: ['A4', 'Fashion'], layoutFamily: 'minimal' },
  { id: 'embroidery', name: 'Embroidery Pro', type: 'PRO', icon: Briefcase, desc: 'Embroidery design order view.', tags: ['A4', 'Design'], layoutFamily: 'classic' },

  // New integrated templates
  { id: 'minimal-classic', name: 'Minimal Classic', type: 'PRO', icon: LayoutTemplate, desc: 'A clean, timeless design suitable for any business.', tags: ['A4', 'Classic', 'Modern', 'New'], layoutFamily: 'modern', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMTAwIDE0MCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2RkZCIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZWVlIi8+PHJlY3QgeD0iMTAiIHk9IjQwIiB3aWR0aD0iODAiIGhlaWdodD0iMjAiIGZpbGw9IiNmMmYyZjIiLz48cmVjdCB4PSIxMCIgeT0iNzAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2Y5ZjlmOSIvPjwvc3ZnPg==' },
  { id: 'modern-corporate', name: 'Modern Corporate', type: 'PRO', icon: LayoutTemplate, desc: 'Professional layout with a strong colored header.', tags: ['A4', 'Business', 'Modern', 'New'], layoutFamily: 'modern', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMTAwIDE0MCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2RkZCIvPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMjAiIGZpbGw9IiMzYjgyZjYiLz48cmVjdCB4PSIxMCIgeT0iMzAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2YxZjVmOSIvPjxyZWN0IHg9IjEwIiB5PSI4MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZWVmMiZmIi8+PC9zdmc+' },
  { id: 'teal-bold-header', name: 'Teal Bold Header', type: 'PRO', icon: LayoutTemplate, desc: 'Striking two-tone layout for creative agencies.', tags: ['A4', 'Business', 'Modern', 'New'], layoutFamily: 'modern', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMTAwIDE0MCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2RkZCIvPjxyZWN0IHdpZHRoPSI1MCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiMwZDk0ODgiLz48cmVjdCB4PSI2MCIgeT0iMjAiIHdpZHRoPSIzMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2VlZSIvPjxyZWN0IHg9IjYwIiB5PSI1MCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZjhmOWZhIi8+PC9zdmc+' },
  { id: 'sage-green-curved', name: 'Sage Green Curved', type: 'PRO', icon: LayoutTemplate, desc: 'Elegant and organic design with soft curves.', tags: ['A4', 'Professional', 'Modern', 'New'], layoutFamily: 'modern', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMTAwIDE0MCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2RkZCIvPjxwYXRoIGQ9Ik0wLDUwIEM1MCw4MCAxMDAsNTAgMTAwLDAgTDAsMCBaIiBmaWxsPSIjZDZlNWQ4Ii8+PHJlY3QgeD0iMTAiIHk9IjYwIiB3aWR0aD0iODAiIGhlaWdodD0iMTAiIGZpbGw9IiNlZWVlZWUiLz48L3N2Zz4=' },
  { id: 'creative-agency', name: 'Creative Agency', type: 'PRO', icon: LayoutTemplate, desc: 'Dark mode styling with vibrant accent colors.', tags: ['A4', 'Business', 'Modern', 'New'], layoutFamily: 'modern', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMTAwIDE0MCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiMyMjIiLz48cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSI1MCIgaGVpZ2h0PSI5MCIgZmlsbD0iI2ZmNGE2ZSIvPjxjaXJjbGUgY3g9IjI1IiBjeT0iMTAwIiByPSIxNSIgZmlsbD0iIzU1NSIvPjwvc3ZnPg==' },
  { id: 'purple-corporate', name: 'Purple Corporate', type: 'PRO', icon: LayoutTemplate, desc: 'Professional layout with a sophisticated purple accent.', tags: ['A4', 'Professional', 'Modern', 'New'], layoutFamily: 'modern', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMTAwIDE0MCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2RkZCIvPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMzAiIGZpbGw9IiM0YjAwODIiLz48cmVjdCB4PSIxMCIgeT0iNDAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==' },
  { id: 'orange-gradient-modern', name: 'Orange Gradient Modern', type: 'PRO', icon: LayoutTemplate, desc: 'Modern and vibrant layout using orange gradients.', tags: ['A4', 'Business', 'Modern', 'New'], layoutFamily: 'modern', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMTAwIDE0MCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2RkZCIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZDEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZjRkNGQ7c3RvcC1vcGFjaXR5OjEifSAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZmYTUwMDtzdG9wLW9wYWNpdHk6MSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE0MCIgZmlsbD0idXJsKCNncmFkMSkiIG9wYWNpdHk9IjAuMSIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjMwaSIgZmlsbD0idXJsKCNncmFkMSkiLz48L3N2Zz4=' },
  { id: 'orange-geometric', name: 'Orange Geometric Corner', type: 'PRO', icon: LayoutTemplate, desc: 'Clean design with geometric orange accents in corners.', tags: ['A4', 'Business', 'Modern', 'New'], layoutFamily: 'modern', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMTAwIDE0MCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2RkZCIvPjxwb2x5Z29uIHBvaW50cz0iMCwwIDUwLDAgMCw1MCIgZmlsbD0iI2Y5NzMxNiIvPjxwb2x5Z29uIHBvaW50cz0iMTAwLDE0MCAxMDAsOTAgNTAsMTQwIiBmaWxsPSIjZjk3MzE2Ii8+PC9zdmc+' },
  { id: 'black-orange-bold', name: 'Black & Orange Bold', type: 'PRO', icon: LayoutTemplate, desc: 'Bold dark layout with stark orange highlights.', tags: ['A4', 'Business', 'Modern', 'New'], layoutFamily: 'modern', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMTAwIDE0MCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiMxYTFhMWEiLz48cmVjdCB4PSIyMCIgeT0iMjAiIHdpZHRoPSI2MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMyMjIiIHN0cm9rZT0iI2Y5NzMxNiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+' },
  { id: 'luxury-gold-black', name: 'Luxury Gold & Black', type: 'PRO', icon: LayoutTemplate, desc: 'Premium aesthetic with gold details on a black background.', tags: ['A4', 'Luxury', 'Modern', 'New'], layoutFamily: 'modern', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMTAwIDE0MCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiMxMTEiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjMwIiByPSIxNSIgZmlsbD0iI2Q0YWYzNyIvPjxyZWN0IHg9IjEwIiB5PSI2MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZDRhZjM3Ii8+PC9zdmc+' },
  { id: 'black-header-professional', name: 'Black Header Professional', type: 'PRO', icon: LayoutTemplate, desc: 'Crisp, highly professional style featuring a dark header.', tags: ['A4', 'Professional', 'Modern', 'New'], layoutFamily: 'modern', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMTAwIDE0MCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2RkZCIvPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNDAiIGZpbGw9IiMxYTFhMWEiLz48cmVjdCB4PSIxMCIgeT0iNTAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y1ZjVmNSIvPjwvc3ZnPg==' },
  { id: 'blue-rounded-modern', name: 'Blue Rounded Modern', type: 'PRO', icon: LayoutTemplate, desc: 'Modern blue template with rounded inner cards.', tags: ['A4', 'Business', 'Modern', 'New'], layoutFamily: 'modern', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMTAwIDE0MCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiMxZTkwZmYiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIxMjAiIHJ4PSIxMCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==' },
  { id: 'red-corporate-clean', name: 'Red Corporate Clean', type: 'PRO', icon: LayoutTemplate, desc: 'Impactful red corporate theme for strong branding.', tags: ['A4', 'Professional', 'Modern', 'New'], layoutFamily: 'modern', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMTAwIDE0MCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2RkZCIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZGMxNDNjIi8+PHJlY3QgeD0iMTAiIHk9IjQwIiB3aWR0aD0iODAiIGhlaWdodD0iMjAiIGZpbGw9IiNmZjE3NDQiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==' },
  { id: 'clean-two-column', name: 'Clean Two-Column Modern', type: 'PRO', icon: LayoutTemplate, desc: 'Balanced two-column layout with a split background.', tags: ['A4', 'Business', 'Modern', 'New'], layoutFamily: 'modern', thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMTAwIDE0MCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2RkZCIvPjxyZWN0IHdpZHRoPSI1MCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNmOWY5ZjkiLz48cmVjdCB4PSI2MCIgeT0iMTAiIHdpZHRoPSIzMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==' }
];

export const getTemplateLayoutFamily = (templateId) => {
  const template = UNIVERSAL_TEMPLATES.find(t => t.id === templateId);
  return template ? template.layoutFamily : 'classic';
};

export const getTemplateFeatures = (templateId) => {
  const template = UNIVERSAL_TEMPLATES.find(t => t.id === templateId);
  if (!template) return [];
  if (template.layoutFamily === 'modern') return ['QR Code', 'Payment Links', 'Branded'];
  if (template.layoutFamily === 'gold') return ['QR Code', 'Branded', 'Analytics', 'Watermark'];
  if (template.layoutFamily === 'corporate') return ['QR Code', 'Payment Links', 'Branded', 'Analytics'];
  if (template.layoutFamily === 'retail') return ['QR Code', 'Checkout', 'Mobile Optimized'];
  return ['QR Code', 'Payment Links'];
};

export const getTemplateGradient = (templateId) => {
  const family = getTemplateLayoutFamily(templateId);
  switch (family) {
    case 'gold': return 'from-slate-800 to-black';
    case 'modern': return 'from-indigo-900 to-slate-900';
    case 'corporate': return 'from-emerald-900 to-slate-800';
    case 'minimal': return 'from-slate-100 to-white';
    case 'retail': return 'from-amber-50 to-orange-50';
    default: return 'from-gray-100 to-gray-200';
  }
};

