import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { getLandingAd } from '../services/adEngine';

/**
 * Premium promotional banner — the very first block of the landing page.
 * Content is admin-controlled (Owner Console → Advertising); falls back to
 * the built-in BillQyro promo. Themed by the landing design system vars,
 * so it follows the landing's light/dark mode automatically.
 */
const AdBanner = () => {
  const [ad, setAd] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('bq_ad_dismissed') === '1'; } catch { return false; }
  });

  useEffect(() => {
    let cancelled = false;
    getLandingAd().then((a) => { if (!cancelled) setAd(a); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!ad || !ad.enabled || dismissed) return null;

  const handleCta = () => {
    const link = ad.link || '#login';
    if (link.startsWith('#')) {
      const el = document.querySelector(link);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem('bq_ad_dismissed', '1'); } catch { /* ignore */ }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-6xl mx-auto px-4 pt-24 sm:pt-28 relative z-10"
      >
        <div className="bq26-glass-strong bq26-edge-light rounded-3xl overflow-hidden relative shadow-2xl group">
          <div className="flex flex-col sm:flex-row">
            {/* Copy */}
            <div className="flex-1 min-w-0 p-5 sm:p-6 lg:p-7 flex flex-col justify-center gap-2.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.18em] bg-[rgba(52,211,153,0.12)] text-[var(--bq26-emerald-bright)] border border-[var(--bq26-line)]">
                  {ad.badge}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--bq26-muted)]">Ad</span>
              </div>
              <h3 className="bq26-display text-lg sm:text-xl lg:text-2xl font-extrabold text-[var(--bq26-text)] leading-tight">
                {ad.title}
              </h3>
              <p className="text-[12px] sm:text-[13px] leading-relaxed text-[var(--bq26-text-soft)] max-w-xl">
                {ad.subtitle}
              </p>
              <div className="pt-1.5">
                <button
                  onClick={handleCta}
                  className="bq26-beam"
                  aria-label={ad.cta}
                >
                  <span className="bg-[var(--bq26-btn)] hover:bg-[var(--bq26-btn-hover)] text-[var(--bq26-btn-text)] px-5 py-2 text-xs font-black tracking-tight flex items-center gap-1.5 transition-colors cursor-pointer">
                    {ad.cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>
            </div>

            {/* Visual */}
            <div className="sm:w-[42%] lg:w-[38%] relative min-h-[150px] sm:min-h-0 overflow-hidden">
              <img
                src={ad.image}
                alt={ad.title}
                loading="eager"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[var(--bq26-bg)] via-[transparent] to-transparent sm:from-[var(--bq26-bg)] sm:via-[rgba(0,0,0,0.08)] pointer-events-none" />
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            aria-label="Dismiss ad"
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-[var(--bq26-muted)] hover:text-[var(--bq26-text)] bg-[rgba(0,0,0,0.18)] hover:bg-[rgba(0,0,0,0.3)] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdBanner;
