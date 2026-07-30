import { 
  LayoutTemplate, Palette, Globe, Monitor, Smartphone, Tablet, 
  Building2, Briefcase, Stethoscope, Wrench, ShoppingBag
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
  { id: 'embroidery', name: 'Embroidery Pro', type: 'PRO', icon: Briefcase, desc: 'Embroidery design order view.', tags: ['A4', 'Design'], layoutFamily: 'classic' }
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

// Reusable mock icon since we used Crown inside UNIVERSAL_TEMPLATES but lucide might not have it loaded if we don't import
import { Crown } from 'lucide-react';
