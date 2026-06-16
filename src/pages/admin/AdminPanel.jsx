import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import UserManager from './UserManager';
import PaymentProofCenter from './PaymentProofCenter';
import GlobalSettings from './GlobalSettings';
import OwnerTestLab from './OwnerTestLab';
import PremiumControlCenter from './PremiumControlCenter';
import FeatureSwitchCenter from './FeatureSwitchCenter';
import AppHealthCenter from './AppHealthCenter';
import SecurityCenter from './SecurityCenter';
import BackupCenter from './BackupCenter';
import ChangelogManager from './ChangelogManager';
import SupportCenter from './SupportCenter';

const AdminPanel = ({ currentTab, setCurrentTab }) => {
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');

  return (
    <AdminLayout setCurrentTab={setCurrentTab} activeAdminTab={activeAdminTab} setActiveAdminTab={setActiveAdminTab}>
      {activeAdminTab === 'dashboard' && <AdminDashboard />}
      {activeAdminTab === 'users' && <UserManager />}
      {activeAdminTab === 'premium' && <PremiumControlCenter />}
      {activeAdminTab === 'payments' && <PaymentProofCenter />}
      {activeAdminTab === 'settings' && <GlobalSettings />}
      {activeAdminTab === 'features' && <FeatureSwitchCenter />}
      {activeAdminTab === 'lab' && <OwnerTestLab />}
      {activeAdminTab === 'health' && <AppHealthCenter />}
      {activeAdminTab === 'security' && <SecurityCenter />}
      {activeAdminTab === 'backup' && <BackupCenter />}
      {activeAdminTab === 'changelog' && <ChangelogManager />}
      {activeAdminTab === 'support' && <SupportCenter />}
    </AdminLayout>
  );
};

export default AdminPanel;
