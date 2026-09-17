import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share, PlusSquare, Smartphone } from 'lucide-react';
import { isAppMode } from '../utils/appMode';

/**
 * PWA install nudge (Phase 25).
 * - Android/Chrome (beforeinstallprompt): bottom card with a real Install
 *   button that opens the native install sheet.
 * - iOS Safari (no event): 3-step "Add to Home Screen" guide card.
 * - Already installed (display-mode standalone): never shown.
 * - Dismissed: hidden for the rest of the session + a 7-day cool-off.
 */
const DISMISS_KEY = 'billqyro_install_nudge_dismissed_at';

const isStandalone = () => {
  try {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      new URLSearchParams(location.search).get('source') === 'pwa';
  } catch { return false; }
};

const isIos = () => {
  try {
    return /ipad|iphone|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  } catch { return false; }
};

const recentlyDismissed = () => {
  try {
    const at = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
    return Date.now() - at < 7 * 86400000;
  } catch { return false; }
};

const PwaInstallPrompt = () => {
  const bipRef = useRef(null);            // latest BeforeInstallPromptEvent
  const [eligible, setEligible] = useState(false); // event captured (Android)
  const [ios, setIos] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Never inside the APK / installed app shell — there's nothing to install.
    if (isAppMode() || isStandalone() || recentlyDismissed()) return undefined;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      bipRef.current = e;
      setEligible(true);
      setIos(false);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    const onInstalled = () => setVisible(false);
    window.addEventListener('appinstalled', onInstalled);

    // Show the card 9s in — after the visitor has seen the hero.
    const showTimer = setTimeout(() => {
      if (isStandalone() || recentlyDismissed()) return;
      if (bipRef.current) {
        setEligible(true);
        setVisible(true);
      } else if (isIos()) {
        setIos(true);
        setVisible(true);
      }
    }, 9000);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      clearTimeout(showTimer);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
  };

  const install = async () => {
    const ev = bipRef.current;
    if (!ev) return;
    setInstalling(true);
    try {
      await ev.prompt();
      await ev.userChoice; // {outcome: 'accepted'|'dismissed'}
    } catch { /* ignore */ }
    setInstalling(false);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (eligible || ios) && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="fixed bottom-24 left-4 right-4 z-40 sm:left-6 sm:right-auto sm:max-w-sm"
          role="dialog"
          aria-label="Install app"
        >
          <div className="bq26-glass-strong rounded-3xl p-4 sm:p-5 shadow-2xl relative">
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-[var(--bq26-muted)] hover:text-[var(--bq26-text)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[rgba(52,211,153,0.12)] border border-[var(--bq26-line)] flex items-center justify-center text-[var(--bq26-emerald-bright)] shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0 pr-6">
                <p className="text-sm font-black text-[var(--bq26-text)] leading-tight">
                  ফোনে অ্যাপের মতো বসিয়ে রাখুন
                </p>
                <p className="text-[11px] font-semibold text-[var(--bq26-text-soft)] leading-relaxed mt-1">
                  {ios
                    ? 'আইকন সহ ফুল-স্ক্রিন অ্যাপ — ইনস্টল করলেই অফলাইনেও চলবে।'
                    : 'মেগাবাইট নষ্ট না করে ইনস্টল হবে — অফলাইনেও চলবে।'}
                </p>
              </div>
            </div>

            {!ios ? (
              <button
                onClick={install}
                disabled={installing}
                className="mt-3 w-full py-3 rounded-2xl bg-[var(--bq26-btn)] hover:bg-[var(--bq26-btn-hover)] text-[var(--bq26-btn-text)] text-xs font-black flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                {installing ? 'ইনস্টল হচ্ছে…' : 'এখনই ইনস্টল করুন'}
              </button>
            ) : (
              <div className="mt-3 space-y-1.5">
                {[
                  { icon: Share, text: 'Safari-র নিচের Share বাটনে ট্যাপ করুন' },
                  { icon: PlusSquare, text: 'লিস্টে "Add to Home Screen" বেছে নিন' },
                  { icon: Smartphone, text: '"Add" চাপুন — হোম-স্ক্রিনে BillQyro এসে যাবে' }
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--bq26-sunken)] border border-[var(--bq26-line-soft)]">
                    <span className="w-5 h-5 rounded-full bg-[rgba(52,211,153,0.14)] text-[var(--bq26-emerald-bright)] flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</span>
                    <Icon className="w-3.5 h-3.5 text-[var(--bq26-emerald-bright)] shrink-0" />
                    <span className="text-[11px] font-bold text-[var(--bq26-text-soft)]">{text}</span>
                  </div>
                ))}
              </div>
            )}

            {!ios && (
              <p className="text-[9px] text-center text-[var(--bq26-muted)] mt-2 font-bold">
                অ্যান্ড্রয়েড APK-ও পাওয়া যায় হিরো-সেকশনে
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PwaInstallPrompt;
