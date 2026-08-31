import React, { useCallback, useEffect, useState } from 'react';
import { Monitor, Smartphone, ShieldCheck, ShieldAlert, LogOut, RefreshCw, CheckCircle2, Clock3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deviceSessionEngine } from '../../services/deviceSessionEngine.js';

const formatTime = (value) => {
  const ms = value?.toMillis?.() || (typeof value === 'string' ? Date.parse(value) : 0);
  if (!ms) return 'Unknown';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms));
};

const DeviceIcon = ({ type }) => type === 'Mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />;

export default function DeviceSecurityPanel() {
  const [sessions, setSessions] = useState([]);
  const [requireApproval, setRequireApproval] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [items, approval] = await Promise.all([
        deviceSessionEngine.listSessions(),
        deviceSessionEngine.getNewDeviceApproval()
      ]);
      setSessions(items);
      setRequireApproval(approval);
    } catch (error) {
      toast.error(error?.message || 'Unable to load device sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleApproval = async () => {
    setBusy(true);
    try {
      const next = !requireApproval;
      await deviceSessionEngine.setNewDeviceApproval(next);
      setRequireApproval(next);
      toast.success(next ? 'New-device approval enabled' : 'New-device approval disabled');
    } catch (error) {
      toast.error(error?.message || 'Unable to change device security');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (session) => {
    if (session.isCurrentDevice) return;
    if (!window.confirm(`Log out ${session.browser || 'this device'}?`)) return;
    setBusy(true);
    try {
      await deviceSessionEngine.revokeSession(session.id);
      toast.success('Device session revoked');
      await refresh();
    } catch (error) {
      toast.error(error?.message || 'Unable to revoke device');
    } finally {
      setBusy(false);
    }
  };

  const approve = async (session) => {
    if (session.isCurrentDevice) return;
    setBusy(true);
    try {
      await deviceSessionEngine.approveSession(session.id);
      toast.success('Device approved');
      await refresh();
    } catch (error) {
      toast.error(error?.message || 'Unable to approve device');
    } finally {
      setBusy(false);
    }
  };

  const logoutOthers = async () => {
    if (!window.confirm('Log out all other devices? Your current device will stay signed in.')) return;
    setBusy(true);
    try {
      const count = await deviceSessionEngine.logoutOtherSessions();
      toast.success(`${count} other device${count === 1 ? '' : 's'} signed out`);
      await refresh();
    } catch (error) {
      toast.error(error?.message || 'Unable to log out other devices');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4" aria-label="Where you're logged in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider">Where You're Logged In</h3>
          <p className="text-[11px] text-theme-muted mt-1">Review trusted devices and remotely revoke access.</p>
        </div>
        <button type="button" onClick={refresh} disabled={loading || busy} className="p-2 rounded-xl bg-theme-surface border border-theme-border-soft text-theme-muted hover:text-theme-primary" title="Refresh sessions">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-theme-surface/50 border border-theme-border-soft flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-theme-accent mt-0.5" />
          <div>
            <p className="text-xs font-bold text-theme-primary">Require approval for new devices</p>
            <p className="text-[10px] text-theme-muted mt-0.5">New laptops and phones stay pending until a trusted device approves them.</p>
          </div>
        </div>
        <button type="button" onClick={toggleApproval} disabled={busy} className={`relative w-11 h-6 rounded-full p-0.5 transition-colors ${requireApproval ? 'bg-theme-accent' : 'bg-slate-300 dark:bg-slate-700'}`} aria-label="Toggle new device approval">
          <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${requireApproval ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      {sessions.length > 1 && (
        <button type="button" onClick={logoutOthers} disabled={busy} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/25 bg-rose-500/5 text-rose-500 text-xs font-bold hover:bg-rose-500/10">
          <LogOut className="w-3.5 h-3.5" /> Log Out All Other Devices
        </button>
      )}

      <div className="space-y-2">
        {sessions.map((session) => (
          <div key={session.id} className="p-4 rounded-2xl bg-theme-card border border-theme-border-soft flex flex-col sm:flex-row sm:items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${session.isCurrentDevice ? 'bg-theme-accent/10 text-theme-accent' : 'bg-theme-surface text-theme-muted'}`}>
              <DeviceIcon type={session.deviceType} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-bold text-theme-primary">{session.browser || 'Browser'} • {session.operatingSystem || 'Unknown'}</p>
                {session.isCurrentDevice && <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-theme-accent/10 text-theme-accent">This device</span>}
                {session.status === 'pending' && <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">Approval required</span>}
                {session.status === 'revoked' && <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">Revoked</span>}
              </div>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-theme-muted">
                <span className="inline-flex items-center gap-1"><Clock3 className="w-3 h-3" /> {formatTime(session.lastSeenAt)}</span>
                <span className={session.presence === 'active' ? 'text-emerald-500 font-bold' : ''}>{session.presence === 'active' ? 'Active recently' : 'Stale'}</span>
              </div>
            </div>
            {!session.isCurrentDevice && session.status === 'pending' && (
              <button type="button" onClick={() => approve(session)} disabled={busy} className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-bold inline-flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </button>
            )}
            {!session.isCurrentDevice && !['revoked', 'blocked'].includes(session.status) && (
              <button type="button" onClick={() => revoke(session)} disabled={busy} className="px-3 py-2 rounded-xl border border-rose-500/20 text-rose-500 text-[10px] font-bold inline-flex items-center justify-center gap-1.5">
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
            )}
            {session.status === 'pending' && session.isCurrentDevice && <ShieldAlert className="w-4 h-4 text-amber-500" title="Waiting for approval" />}
          </div>
        ))}
        {!loading && sessions.length === 0 && <div className="p-6 text-center rounded-2xl border border-dashed border-theme-border-soft text-xs text-theme-muted">No registered device sessions yet.</div>}
      </div>
    </section>
  );
}
