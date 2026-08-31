import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Shield, 
  Key, 
  Smartphone, 
  Monitor, 
  Clock, 
  AlertTriangle, 
  LogOut, 
  CheckCircle2, 
  RotateCcw,
  Laptop,
  Check,
  X,
  Lock
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { deviceSessionEngine } from '../../services/deviceSessionEngine';

const SecurityStudio = ({ settings, onUpdate }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [isUpdatingApproval, setIsUpdatingApproval] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);

  const fetchSessions = async () => {
    try {
      const list = await deviceSessionEngine.listSessions();
      setSessions(list || []);
      const approvalSetting = await deviceSessionEngine.getNewDeviceApproval();
      setRequireApproval(approvalSetting);
    } catch (e) {
      console.warn('Failed to load sessions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleApproval = async () => {
    const nextVal = !requireApproval;
    setIsUpdatingApproval(true);
    try {
      await deviceSessionEngine.setNewDeviceApproval(nextVal);
      setRequireApproval(nextVal);
      toast.success(
        nextVal
          ? 'New device approval enabled. New logins will require your permission.'
          : 'New device approval disabled. New devices can log in directly.',
        { icon: nextVal ? '🛡️' : '🔓' }
      );
    } catch (err) {
      toast.error('Failed to update approval setting.');
    } finally {
      setIsUpdatingApproval(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    setActionInProgress(sessionId);
    try {
      await deviceSessionEngine.revokeSession(sessionId);
      toast.success('Device logged out successfully.', { icon: '👋' });
      await fetchSessions();
    } catch (err) {
      toast.error('Failed to revoke session.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleApproveSession = async (sessionId) => {
    setActionInProgress(sessionId);
    try {
      await deviceSessionEngine.approveSession(sessionId);
      toast.success('Device approved and authorized.', { icon: '✅' });
      await fetchSessions();
    } catch (err) {
      toast.error('Failed to approve device.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleLogoutAllOther = async () => {
    setActionInProgress('all_other');
    try {
      const count = await deviceSessionEngine.logoutOtherSessions();
      toast.success(`Logged out ${count} other device${count === 1 ? '' : 's'}.`, { icon: '🔒' });
      setShowLogoutAllConfirm(false);
      await fetchSessions();
    } catch (err) {
      toast.error('Failed to sign out other devices.');
    } finally {
      setActionInProgress(null);
    }
  };

  const currentSession = sessions.find(s => s.isCurrentDevice);
  const otherSessions = sessions.filter(s => !s.isCurrentDevice);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-theme-border-soft pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center shadow-inner">
            <Shield className="w-6 h-6 text-theme-accent drop-shadow-md" />
          </div>
          <div>
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-theme-primary to-theme-accent">
              Security Studio
            </h2>
            <p className="text-xs text-theme-secondary font-medium">
              Manage active device sessions, remote logouts, and new device authorization
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSessions}
          className="btn-secondary !p-2 text-xs flex items-center gap-1.5"
          title="Refresh active sessions"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: 2FA & New Device Policy */}
        <div className="lg:col-span-5 space-y-6">
          {/* New Device Approval Policy Card */}
          <div className="p-6 bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md relative overflow-hidden shadow-premium-sm">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-theme-accent" />
              <h3 className="text-sm font-black text-theme-primary">New Device Security</h3>
            </div>

            <p className="text-xs text-theme-secondary mb-5 leading-relaxed">
              When enabled, any unknown computer, phone, or browser logging into your account will be placed on hold until approved from this device.
            </p>

            <div className="flex items-center justify-between p-4 bg-theme-surface-elevated rounded-2xl border border-theme-border-soft">
              <div>
                <p className="text-xs font-bold text-theme-primary">Require Approval for New Devices</p>
                <p className="text-[10px] text-theme-secondary mt-0.5">
                  {requireApproval ? 'Active: Pending devices restricted' : 'Disabled: New devices log in immediately'}
                </p>
              </div>
              <button
                type="button"
                disabled={isUpdatingApproval}
                onClick={handleToggleApproval}
                className={`relative w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                  requireApproval ? 'bg-theme-accent justify-end' : 'bg-theme-surface border border-theme-border-strong justify-start'
                }`}
              >
                <span className={`w-5 h-5 rounded-full transition-all shadow-md ${requireApproval ? 'bg-white' : 'bg-theme-muted'}`} />
              </button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="p-6 bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md relative overflow-hidden group shadow-premium-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent/5 rounded-full blur-[50px] group-hover:bg-theme-accent/10 transition-colors pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-5 h-5 text-theme-accent" />
              <h3 className="text-sm font-black text-theme-primary">Two-Factor Auth (2FA)</h3>
            </div>
            
            <p className="text-xs text-theme-secondary mb-5 leading-relaxed">
              Add an extra layer of security to your account with a time-based authenticator app code.
            </p>

            <div className="flex items-center justify-between p-4 bg-theme-surface-elevated rounded-2xl border border-theme-border-soft mb-4">
              <div>
                <p className="text-xs font-bold text-theme-primary">Authenticator App</p>
                <p className="text-[10px] text-theme-secondary mt-0.5">Google Authenticator, Authy</p>
              </div>
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider bg-theme-surface px-2.5 py-1 rounded-full border border-theme-border-soft">
                Coming Soon
              </span>
            </div>
            
            <Button onClick={() => toast('Two-factor authentication will be available in the upcoming security update.', { icon: '🛡️' })} variant="secondary" className="w-full">
              Configure 2FA
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Where You're Logged In */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md shadow-premium-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-theme-accent" />
                <div>
                  <h3 className="text-sm font-black text-theme-primary">Where You're Logged In</h3>
                  <p className="text-2xs text-theme-secondary mt-0.5">All active and recent devices logged into your account</p>
                </div>
              </div>
              <span className="text-2xs font-bold text-theme-accent bg-theme-accent/10 px-2.5 py-1 rounded-full">
                {sessions.length} {sessions.length === 1 ? 'Device' : 'Devices'}
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-theme-muted animate-pulse">
                Loading active device sessions...
              </div>
            ) : (
              <div className="space-y-3">
                {/* 1. Current Device */}
                {currentSession && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                        {currentSession.deviceType === 'Mobile' ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-theme-primary">
                            {currentSession.browser} • {currentSession.operatingSystem}
                          </p>
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            This Device
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Active now
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Other Devices */}
                {otherSessions.map((session) => {
                  const isRevoked = session.status === 'REVOKED' || session.status === 'revoked';
                  const isPending = session.status === 'PENDING_APPROVAL' || session.status === 'pending';

                  return (
                    <div
                      key={session.id || session.sessionId}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        isRevoked
                          ? 'bg-theme-surface/30 border-theme-border-soft opacity-60'
                          : isPending
                          ? 'bg-amber-500/5 border-amber-500/30'
                          : 'bg-theme-surface-elevated border-theme-border-soft hover:border-theme-border-strong'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-theme-surface flex items-center justify-center text-theme-secondary border border-theme-border-soft">
                          {session.deviceType === 'Mobile' ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-theme-primary">
                              {session.browser || 'Browser'} • {session.operatingSystem || 'Device'}
                            </p>
                            {isPending && (
                              <span className="text-[9px] font-black text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Awaiting Approval
                              </span>
                            )}
                            {isRevoked && (
                              <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Logged Out
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-theme-secondary flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {deviceSessionEngine.formatLastSeen(session.lastSeenAt)}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {isPending && (
                          <button
                            type="button"
                            disabled={actionInProgress === session.id}
                            onClick={() => handleApproveSession(session.id || session.sessionId)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-2xs font-bold transition-all shadow-sm flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        )}
                        {!isRevoked && (
                          <button
                            type="button"
                            disabled={actionInProgress === session.id}
                            onClick={() => handleRevokeSession(session.id || session.sessionId)}
                            className="px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 text-2xs font-bold transition-all border border-rose-500/20 flex items-center gap-1"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Log Out</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {otherSessions.length === 0 && (
                  <div className="p-6 text-center rounded-2xl bg-theme-surface-elevated/40 border border-dashed border-theme-border-soft">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-bold text-theme-primary">No other devices logged in</p>
                    <p className="text-2xs text-theme-muted mt-0.5">Your account is currently active only on this device.</p>
                  </div>
                )}
              </div>
            )}

            {/* Logout all other devices button */}
            {otherSessions.some(s => s.status !== 'REVOKED' && s.status !== 'revoked') && (
              <div className="pt-2">
                <Button
                  onClick={() => setShowLogoutAllConfirm(true)}
                  variant="danger"
                  className="w-full !py-3 text-xs font-bold shadow-lg shadow-rose-500/10"
                  leftIcon={AlertTriangle}
                  disabled={actionInProgress === 'all_other'}
                >
                  Sign Out All Other Devices
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Log Out All Other Devices */}
      {showLogoutAllConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-premium max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-theme-primary">Log Out All Other Devices?</h3>
                <p className="text-2xs text-theme-secondary mt-0.5">This will sign out every browser and mobile session.</p>
              </div>
            </div>

            <p className="text-xs text-theme-muted leading-relaxed">
              Your current device will remain securely signed in. All other laptops, phones, and tablets will be immediately revoked.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutAllConfirm(false)}
                className="btn-secondary !py-2.5 !px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogoutAllOther}
                className="btn-premium !bg-rose-600 hover:!bg-rose-700 !text-white !py-2.5 !px-5 text-xs font-bold shadow-lg shadow-rose-600/20"
              >
                Yes, Sign Out Others
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityStudio;

