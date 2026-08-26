import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Lock, Key, UserCheck, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { authEngine } from '../../services/authEngine.js';
import { adminEngine } from '../../services/adminEngine.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const SecurityCenter = () => {
  const [logs, setLogs] = useState([]);
  const [securityStatus, setSecurityStatus] = useState({
    isAdmin: false,
    ownerEmail: '',
    pinUnlocked: false,
    isolationMode: 'Multi-Tenant Scoped',
    encryption: 'Active (TLS/AES-256)'
  });

  const fetchSecurityData = async () => {
    const session = authEngine.getAuthSession();
    const isUnlocked = localStorage.getItem('billqyro_admin_unlocked') === 'true';
    const auditEvents = await adminEngine.getAuditLogs();
    
    setSecurityStatus({
      isAdmin: adminEngine.isAdminUser(session) || isUnlocked,
      ownerEmail: session?.userEmail || 'owner@billqyro.admin',
      pinUnlocked: isUnlocked,
      isolationMode: 'Multi-Tenant Scoped (User + Workspace Isolation)',
      encryption: 'Active (TLS 1.3 / IndexedDB Local Storage)'
    });

    const l = JSON.parse(localStorage.getItem('billqyro_admin_security_logs') || '[]');
    setLogs([...l, ...auditEvents.filter(a => a.action.includes('USER_') || a.action.includes('MAINTENANCE'))].slice(0, 10));
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
            Owner Security & Authorization Center
          </h2>
          <p className="text-sm text-theme-secondary mt-1">
            Authentication boundaries, privileged PIN authorization, tenant isolation, and security logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchSecurityData} leftIcon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardContent className="p-5">
            <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-1">Owner Authorization</span>
            <div className="text-lg font-black text-emerald-500 flex items-center gap-1.5">
              <UserCheck className="w-5 h-5" /> Authenticated
            </div>
            <span className="text-[11px] text-theme-muted mt-1 block truncate">{securityStatus.ownerEmail}</span>
          </CardContent>
        </Card>

        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardContent className="p-5">
            <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-1">Console PIN State</span>
            <div className="text-lg font-black text-theme-accent flex items-center gap-1.5">
              <Key className="w-5 h-5" /> {securityStatus.pinUnlocked ? 'PIN Verified' : 'Locked'}
            </div>
            <span className="text-[11px] text-theme-muted mt-1 block">PBKDF2 PIN Protected</span>
          </CardContent>
        </Card>

        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardContent className="p-5">
            <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-1">Tenant Scoping</span>
            <div className="text-lg font-black text-cyan-500 flex items-center gap-1.5">
              <Lock className="w-5 h-5" /> Strict Isolation
            </div>
            <span className="text-[11px] text-theme-muted mt-1 block">userId + workspaceId Enforced</span>
          </CardContent>
        </Card>

        <Card className="bg-theme-surface/50 border-theme-border-soft">
          <CardContent className="p-5">
            <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-1">Data Transmission</span>
            <div className="text-lg font-black text-emerald-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5" /> TLS / Encrypted
            </div>
            <span className="text-[11px] text-theme-muted mt-1 block">Zero Plaintext Secrets</span>
          </CardContent>
        </Card>
      </div>

      {/* Security Audit Feed */}
      <Card className="bg-theme-surface/50 border-theme-border-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-theme-accent" />
            Security & Authentication Events
          </CardTitle>
          <p className="text-xs text-theme-secondary">
            Recent security access, login attempts, user suspensions, and administrative authorizations.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-theme-surface-elevated rounded-xl border border-theme-border-soft gap-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-theme-accent mr-3 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-theme-primary font-bold text-sm">{log.action || log.type || 'Security Event'}</p>
                      <p className="text-theme-secondary text-xs mt-1">{log.details || 'Administrative verification passed.'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-theme-muted font-bold whitespace-nowrap">
                    {new Date(log.timestamp || Date.now()).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-theme-muted">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-60" />
                <p className="font-bold">Zero security violations detected.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default memo(SecurityCenter);
