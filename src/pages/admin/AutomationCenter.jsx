import { useState, memo } from 'react';
import { Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AutomationCenter = () => {
  const [automations, setAutomations] = useState({
    autoSuspend: false,
    weeklyReports: true,
    autoBackup: true,
    welcomeEmails: true,
    subscriptionReminders: true
  });

  const handleToggle = (key) => {
    const nextState = !automations[key];
    setAutomations({ ...automations, [key]: nextState });
    toast.success(`Automation ${nextState ? 'Enabled' : 'Disabled'}`);
  };

  const handleRunNow = (task) => {
    toast.success(`Triggered manual run for: ${task}`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center">
            <Bot className="w-8 h-8 mr-3 text-theme-accent" /> Automation Center
          </h2>
          <p className="text-sm text-theme-secondary mt-1">Configure and monitor background tasks and scheduled events.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-theme-danger/10 flex items-center justify-center text-theme-danger mb-4">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <Switch checked={automations.autoSuspend} onChange={() => handleToggle('autoSuspend')} />
            </div>
            <CardTitle>Auto-Suspend Overdue</CardTitle>
            <p className="text-xs text-theme-secondary mt-1">Automatically suspend enterprise workspaces 3 days after subscription expiry.</p>
          </CardHeader>
          <CardContent className="mt-auto pt-4 border-t border-theme-border-soft">
            <Button variant="outline" size="sm" onClick={() => handleRunNow('Auto Suspend Check')} leftIcon={Zap} className="w-full">
              Run Check Now
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-theme-success/10 flex items-center justify-center text-theme-success mb-4">
                <Database className="w-5 h-5" />
              </div>
              <Switch checked={automations.autoBackup} onChange={() => handleToggle('autoBackup')} />
            </div>
            <CardTitle>Daily Auto-Backup</CardTitle>
            <p className="text-xs text-theme-secondary mt-1">Trigger a full Firestore database backup to secure storage every night at 2:00 AM.</p>
          </CardHeader>
          <CardContent className="mt-auto pt-4 border-t border-theme-border-soft">
            <Button variant="outline" size="sm" onClick={() => handleRunNow('Force Backup')} leftIcon={Zap} className="w-full">
              Force Backup Now
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-theme-accent/10 flex items-center justify-center text-theme-accent mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <Switch checked={automations.weeklyReports} onChange={() => handleToggle('weeklyReports')} />
            </div>
            <CardTitle>Weekly Admin Reports</CardTitle>
            <p className="text-xs text-theme-secondary mt-1">Compile and email the weekly platform growth and revenue summary to platform owners.</p>
          </CardHeader>
          <CardContent className="mt-auto pt-4 border-t border-theme-border-soft">
            <Button variant="outline" size="sm" onClick={() => handleRunNow('Generate Report')} leftIcon={Zap} className="w-full">
              Generate & Send Now
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-theme-primary/10 flex items-center justify-center text-theme-primary mb-4">
                <Mail className="w-5 h-5" />
              </div>
              <Switch checked={automations.welcomeEmails} onChange={() => handleToggle('welcomeEmails')} />
            </div>
            <CardTitle>Welcome Email Sequence</CardTitle>
            <p className="text-xs text-theme-secondary mt-1">Send a 3-day onboarding email sequence to newly registered businesses.</p>
          </CardHeader>
          <CardContent className="mt-auto pt-4 border-t border-theme-border-soft">
             <Button variant="ghost" size="sm" disabled className="w-full">Background Job</Button>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-theme-warning/10 flex items-center justify-center text-theme-warning mb-4">
                <Mail className="w-5 h-5" />
              </div>
              <Switch checked={automations.subscriptionReminders} onChange={() => handleToggle('subscriptionReminders')} />
            </div>
            <CardTitle>Subscription Reminders</CardTitle>
            <p className="text-xs text-theme-secondary mt-1">Send warning emails 3 days before and on the day of subscription expiration.</p>
          </CardHeader>
          <CardContent className="mt-auto pt-4 border-t border-theme-border-soft">
            <Button variant="ghost" size="sm" disabled className="w-full">Background Job</Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default memo(AutomationCenter);
