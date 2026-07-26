import { useState, useEffect, memo } from 'react';
import { Search, Loader2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminEngine } from '../../services/adminEngine';
import { getGlobalRevenueSettings, saveGlobalRevenueSettings } from '../../services/platformRevenueService';

const PremiumControlCenter = () => {
  const [targetUserId, setTargetUserId] = useState('');
  const [targetUserEmail, setTargetUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [globalSettings, setGlobalSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setSettingsLoading(true);
      try {
        const settings = await getGlobalRevenueSettings();
        setGlobalSettings(settings);
      } catch (err) {
        toast.error('Failed to load global revenue settings');
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleLookupUser = async () => {
    if (!targetUserId.trim()) return;
    setLoading(true);
    try {
      const userDoc = await adminEngine.lookupUser(targetUserId);
      if (userDoc) {
        setTargetUserEmail(userDoc.email || 'Found user');
        toast.success('User found!');
      } else {
        setTargetUserEmail('User not found');
        toast.error('No user found with this ID.');
      }
    } catch (e) {
      toast.error('Failed to lookup user.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (newPlan) => {
      if (!targetUserId.trim()) {
        toast.error('Enter a user ID first.');
        return;
      }
      setActionLoading(newPlan);
      try {
        await adminEngine.overrideUserPlan(targetUserId, newPlan);
        toast.success(`User set to ${newPlan} successfully!`);
      } catch (e) {
        console.error('Override failed:', e);
        toast.error('Failed to update user plan.');
      } finally {
        setActionLoading(null);
      }
    };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const success = await saveGlobalRevenueSettings(globalSettings);
      if (success) {
        toast.success('Global pricing & payment settings updated!');
      } else {
        toast.error('Failed to update global settings.');
      }
    } catch (e) {
      toast.error('Error saving global settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSettingChange = (field, value) => {
    setGlobalSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center">
            <Crown className="w-8 h-8 mr-3 text-theme-accent" /> Subscription Center
          </h2>
          <p className="text-sm text-theme-secondary mt-1">Manage user subscriptions, global pricing, and payment settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Lookup</CardTitle>
            <p className="text-xs text-theme-secondary mt-1">Enter a Firebase User ID to apply plan overrides.</p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Enter User ID (uid)"
                className="flex-1"
              />
              <Button
                onClick={handleLookupUser}
                disabled={loading}
                variant="primary"
                leftIcon={loading ? Loader2 : Search}
              >
                Lookup
              </Button>
            </div>
            {targetUserEmail && (
              <p className="text-theme-success text-xs font-bold mt-4">Found User: {targetUserEmail}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Override Controls</CardTitle>
            <p className="text-xs text-theme-secondary mt-1">Force apply a subscription plan to the looked-up user.</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => handleOverride('free')}
                disabled={actionLoading !== null}
                leftIcon={actionLoading === 'free' ? Loader2 : null}
              >
                Make Free
              </Button>
              <Button
                variant="outline"
                className="border-theme-accent text-theme-accent hover:bg-theme-accent/10"
                onClick={() => handleOverride('premium')}
                disabled={actionLoading !== null}
                leftIcon={actionLoading === 'premium' ? Loader2 : null}
              >
                Make Premium
              </Button>
              <Button
                variant="outline"
                className="border-theme-primary text-theme-primary hover:bg-theme-surface-hover"
                onClick={() => handleOverride('lifetime')}
                disabled={actionLoading !== null}
                leftIcon={actionLoading === 'lifetime' ? Loader2 : null}
              >
                Make Lifetime
              </Button>
              <Button
                variant="outline"
                className="border-theme-success text-theme-success hover:bg-theme-success/10"
                onClick={() => handleOverride('trial')}
                disabled={actionLoading !== null}
                leftIcon={actionLoading === 'trial' ? Loader2 : null}
              >
                Give Trial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {!settingsLoading && globalSettings && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Plan Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="Monthly Price"
                  type="number"
                  value={globalSettings.priceMonthly || ''}
                  onChange={(e) => handleSettingChange('priceMonthly', parseFloat(e.target.value))}
                />
                <Input
                  label="Quarterly Price"
                  type="number"
                  value={globalSettings.priceQuarterly || ''}
                  onChange={(e) => handleSettingChange('priceQuarterly', parseFloat(e.target.value))}
                />
                <Input
                  label="Yearly Price"
                  type="number"
                  value={globalSettings.priceYearly || ''}
                  onChange={(e) => handleSettingChange('priceYearly', parseFloat(e.target.value))}
                />
                <Input
                  label="Lifetime Price"
                  type="number"
                  value={globalSettings.priceLifetime || ''}
                  onChange={(e) => handleSettingChange('priceLifetime', parseFloat(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Global Payment Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Bank Account Name"
                  type="text"
                  value={globalSettings.bankAccountName || ''}
                  onChange={(e) => handleSettingChange('bankAccountName', e.target.value)}
                />
                <Input
                  label="Bank Account Number"
                  type="text"
                  value={globalSettings.bankAccountNumber || ''}
                  onChange={(e) => handleSettingChange('bankAccountNumber', e.target.value)}
                />
                <Input
                  label="Bank Name"
                  type="text"
                  value={globalSettings.bankName || ''}
                  onChange={(e) => handleSettingChange('bankName', e.target.value)}
                />
                <Input
                  label="Bank IFSC Code"
                  type="text"
                  value={globalSettings.bankIfsc || ''}
                  onChange={(e) => handleSettingChange('bankIfsc', e.target.value)}
                />
                <Input
                  label="UPI ID"
                  type="text"
                  value={globalSettings.upiId || ''}
                  onChange={(e) => handleSettingChange('upiId', e.target.value)}
                />
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  variant="primary"
                  className="bg-theme-success border-theme-success shadow-glass"
                  leftIcon={savingSettings ? Loader2 : Save}
                >
                  Save Global Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
};

export default memo(PremiumControlCenter);
