import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Megaphone, Save, RotateCcw, Eye, EyeOff, ExternalLink,
  Image as ImageIcon, Type, Link2, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getLandingAd, saveLandingAd, DEFAULT_LANDING_AD } from '../../services/adEngine';

/**
 * Owner Console → Advertising
 * Controls the promotional banner slot at the top of the public landing
 * page. Saved to Firestore (adminSettings/global.landingAd) with a
 * localStorage cache so visitors see the ad instantly.
 */
const FIELD = 'w-full rounded-xl bg-theme-surface border border-theme-border-soft focus:border-theme-accent/50 focus:ring-2 focus:ring-theme-accent/15 outline-none px-3.5 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted transition-all';

const AdManager = () => {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getLandingAd().then((ad) => { if (!cancelled) setForm({ ...ad }); }).catch(() => {
      if (!cancelled) setForm({ ...DEFAULT_LANDING_AD });
    });
    return () => { cancelled = true; };
  }, []);

  if (!form) {
    return (
      <div className="p-10 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isValid = form.title?.trim() && form.cta?.trim();

  const handleSave = async () => {
    if (!isValid) { toast.error('Title and CTA text are required'); return; }
    setSaving(true);
    try {
      const ok = await saveLandingAd(form);
      if (ok) toast.success('Landing ad published — visitors will see it within 30 minutes (or instantly after refresh)');
      else toast.error('Could not save — check your connection and admin access');
    } finally { setSaving(false); }
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_LANDING_AD });
    toast('Reset to the built-in BillQyro promo (remember to Save)', { icon: '↺' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-theme-primary flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center">
              <Megaphone className="w-4.5 h-4.5 w-5 h-5 text-theme-accent" />
            </span>
            Advertising
          </h1>
          <p className="text-xs text-theme-muted mt-1.5 font-medium">
            Controls the sponsored banner slot at the very top of the public landing page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-theme-surface border border-theme-border-soft text-theme-muted hover:text-theme-primary transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isValid}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-theme-accent-gradient text-white shadow-theme-glow hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Publishing…' : 'Publish Ad'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-3 space-y-4">
          {/* Enabled toggle */}
          <button
            onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${form.enabled ? 'bg-theme-accent/5 border-theme-accent/25' : 'bg-theme-card border-theme-border-soft'}`}
          >
            <span className="flex items-center gap-3 text-left">
              {form.enabled ? <Eye className="w-4 h-4 text-theme-accent" /> : <EyeOff className="w-4 h-4 text-theme-muted" />}
              <span>
                <span className="block text-xs font-black text-theme-primary">{form.enabled ? 'Ad slot is LIVE' : 'Ad slot is HIDDEN'}</span>
                <span className="block text-[11px] text-theme-muted font-medium mt-0.5">When hidden, the landing page skips the banner entirely.</span>
              </span>
            </span>
            <span className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${form.enabled ? 'bg-theme-accent' : 'bg-theme-border-strong'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.enabled ? 'left-[22px]' : 'left-0.5'}`} />
            </span>
          </button>

          <div className="p-5 rounded-2xl bg-theme-card border border-theme-border-soft space-y-4">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted flex items-center gap-1.5 mb-1.5"><Sparkles className="w-3 h-3" /> Badge</span>
              <input value={form.badge || ''} onChange={set('badge')} className={FIELD} placeholder="BillQyro Pro" maxLength={40} />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted flex items-center gap-1.5 mb-1.5"><Type className="w-3 h-3" /> Title *</span>
              <input value={form.title || ''} onChange={set('title')} className={FIELD} placeholder="Premium invoicing that feels effortless" maxLength={120} />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted mb-1.5">Subtitle</span>
              <textarea value={form.subtitle || ''} onChange={set('subtitle')} rows={2} className={`${FIELD} resize-none`} placeholder="One line about the offer…" maxLength={220} />
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted mb-1.5">CTA text *</span>
                <input value={form.cta || ''} onChange={set('cta')} className={FIELD} placeholder="Start Free" maxLength={40} />
              </label>
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted flex items-center gap-1.5 mb-1.5"><Link2 className="w-3 h-3" /> Link</span>
                <input value={form.link || ''} onChange={set('link')} className={FIELD} placeholder="#login or https://…" />
              </label>
            </div>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted flex items-center gap-1.5 mb-1.5"><ImageIcon className="w-3 h-3" /> Image URL</span>
              <input value={form.image || ''} onChange={set('image')} className={FIELD} placeholder="/ads/billqyro-promo.jpg" />
              <span className="block text-[10px] text-theme-muted mt-1.5 font-medium leading-relaxed">
                Internal paths (starting with /) or full https:// URLs. Recommended: wide banner ~1200×400, under 150KB.
              </span>
            </label>
            <p className="text-[10px] text-theme-muted flex items-center gap-1.5 pt-1">
              <ExternalLink className="w-3 h-3 shrink-0" />
              Links starting with # scroll the visitor to that landing section; https:// links open in a new tab.
            </p>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted">Live preview</span>
            <div className="rounded-2xl border border-theme-border-soft bg-theme-surface overflow-hidden shadow-premium-sm">
              <div className="flex flex-col">
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.16em] bg-theme-accent/10 text-theme-accent border border-theme-accent/20">{form.badge || 'Badge'}</span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-theme-muted">Ad</span>
                  </div>
                  <p className="text-sm font-extrabold text-theme-primary leading-snug">{form.title || 'Ad title appears here'}</p>
                  <p className="text-[11px] text-theme-muted leading-relaxed line-clamp-3">{form.subtitle || 'Subtitle appears here'}</p>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-theme-accent-gradient text-white text-[10px] font-black">
                    {form.cta || 'CTA'} →
                  </span>
                </div>
                <div className="h-28 bg-theme-card border-t border-theme-border-soft relative overflow-hidden">
                  {form.image
                    ? <img src={form.image} alt="ad preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.opacity = 0.15; }} />
                    : <div className="w-full h-full flex items-center justify-center text-theme-muted"><ImageIcon className="w-6 h-6" /></div>}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-theme-muted font-medium leading-relaxed">
              Preview uses console theme colors; on the landing page the ad automatically follows the visitor's light/dark landing mode.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdManager;
