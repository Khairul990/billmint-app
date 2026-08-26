import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Megaphone, X, Sparkles, AlertTriangle, ShieldAlert, Info, CheckCircle2 } from 'lucide-react';
import { announcementEngine } from '../services/announcementEngine';
import { authEngine } from '../services/authEngine';
import { settingsEngine } from '../services/settingsEngine';

const TYPE = {
  feature: { icon: Sparkles, tone: 'text-theme-accent', bg: 'bg-theme-accent/10' },
  update: { icon: CheckCircle2, tone: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  warning: { icon: AlertTriangle, tone: 'text-amber-500', bg: 'bg-amber-500/10' },
  maintenance: { icon: ShieldAlert, tone: 'text-rose-500', bg: 'bg-rose-500/10' },
  info: { icon: Info, tone: 'text-cyan-500', bg: 'bg-cyan-500/10' },
};

const readKey = (uid) => `billqyro_announcement_reads_${uid || 'guest'}`;

const AnnouncementSurface = () => {
  const [items, setItems] = useState([]);
  const [visible, setVisible] = useState(null);
  const [banner, setBanner] = useState(null);

  const uid = authEngine.getAuthSession()?.uid || authEngine.getAuthSession()?.userId || null;
  const settings = useMemo(() => settingsEngine.getSettings?.() || {}, []);

  const refresh = async () => {
    if (!uid) return;
    try {
      const currentSettings = await settingsEngine.getSettings() || settings || {};
      const workspaceId = currentSettings.activeWorkspaceId || currentSettings.businessWorkspaces?.find(w => w.active)?.id || null;
      const plan = currentSettings.planStatus || currentSettings.plan || 'free';
      const rows = await announcementEngine.getPublished({ workspaceId, plan });
      const reads = JSON.parse(localStorage.getItem(readKey(uid)) || '[]');
      const unread = rows.filter(a => !reads.includes(a.id));
      setItems(rows);
      const popup = unread.find(a => a.display?.includes('popup')) || null;
      const topBanner = unread.find(a => a.display?.includes('banner')) || null;
      setVisible(popup);
      setBanner(topBanner);
    } catch (error) {
      console.warn('Announcement surface unavailable:', error);
    }
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('billqyro_announcement_updated', handler);
    return () => window.removeEventListener('billqyro_announcement_updated', handler);
  }, [uid]);

  const markRead = (id) => {
    if (!uid || !id) return;
    const reads = JSON.parse(localStorage.getItem(readKey(uid)) || '[]');
    if (!reads.includes(id)) reads.push(id);
    localStorage.setItem(readKey(uid), JSON.stringify(reads.slice(-200)));
    setVisible(null);
    setBanner(null);
    window.dispatchEvent(new Event('billqyro_announcement_updated'));
  };

  const renderIcon = (item) => {
    const config = TYPE[item?.type] || TYPE.info;
    const Icon = config.icon;
    return <div className={`w-12 h-12 rounded-2xl ${config.bg} ${config.tone} flex items-center justify-center shrink-0`}><Icon className="w-6 h-6" /></div>;
  };

  return <>
    <AnimatePresence>
      {banner && <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }} className="fixed top-0 left-0 right-0 z-[99990] px-3 sm:px-6 py-2.5 bg-theme-card/95 backdrop-blur-xl border-b border-theme-border-soft shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center"><Megaphone className="w-4 h-4" /></div><div className="min-w-0 flex-1"><p className="text-xs font-black text-theme-primary truncate">{banner.title}</p><p className="text-[11px] text-theme-muted truncate">{banner.message}</p></div><button onClick={() => markRead(banner.id)} className="shrink-0 px-3 py-1.5 rounded-lg bg-theme-accent text-white text-[10px] font-black">Got it</button></div>
      </motion.div>}
    </AnimatePresence>
    <AnimatePresence>
      {visible && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/55 backdrop-blur-md" onClick={() => markRead(visible.id)}>
        <motion.div initial={{ opacity: 0, scale: .94, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .94, y: 18 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }} onClick={e => e.stopPropagation()} className="relative w-full max-w-lg overflow-hidden rounded-[28px] bg-theme-card border border-theme-border-soft shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-[image:var(--accent-gradient)]" />
          <button onClick={() => markRead(visible.id)} className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-theme-surface/80 flex items-center justify-center text-theme-muted hover:text-theme-primary"><X className="w-4 h-4" /></button>
          <div className="p-7 sm:p-9"><div className="flex items-start gap-4 mb-6">{renderIcon(visible)}<div className="pr-8"><p className="text-[10px] font-black uppercase tracking-[.2em] text-theme-muted mb-1">BillQyro Update</p><h2 className="text-2xl sm:text-3xl font-black tracking-tight text-theme-primary">{visible.title}</h2></div></div><p className="text-sm sm:text-base leading-7 font-semibold text-theme-secondary whitespace-pre-line">{visible.message}</p><button onClick={() => markRead(visible.id)} className="mt-8 w-full py-3.5 rounded-2xl bg-[image:var(--accent-gradient)] text-white font-black text-sm shadow-lg">Continue to BillQyro</button></div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  </>;
};

export default AnnouncementSurface;
