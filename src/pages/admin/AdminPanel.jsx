import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import UserManager from './UserManager';
import WorkspaceAdmin from './WorkspaceAdmin';
import PaymentProofCenter from './PaymentProofCenter';
import GlobalSettings from './GlobalSettings';
import OwnerTestLab from './OwnerTestLab';
import PremiumControlCenter from './PremiumControlCenter';
import SubscriptionStudio from './SubscriptionStudio';
import FeatureSwitchCenter from './FeatureSwitchCenter';
import AppHealthCenter from './AppHealthCenter';
import SecurityCenter from './SecurityCenter';
import BackupCenter from './BackupCenter';
import ChangelogManager from './ChangelogManager';
import SupportCenter from './SupportCenter';
import AnnouncementManager from './AnnouncementManager';
import AnalyticsCenter from './AnalyticsCenter';
import AutomationCenter from './AutomationCenter';
import DatabaseCenter from './DatabaseCenter';
import { pageVariants } from '../../utils/animations';

const AdminPanel = ({ currentTab, setCurrentTab }) => {
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <AdminLayout setCurrentTab={setCurrentTab} activeAdminTab={activeAdminTab} setActiveAdminTab={setActiveAdminTab}>
        {activeAdminTab === 'dashboard' && <AdminDashboard />}
        {activeAdminTab === 'users' && <UserManager />}
        {activeAdminTab === 'workspaces' && <WorkspaceAdmin />}
        {activeAdminTab === 'premium' && <PremiumControlCenter />}
        {activeAdminTab === 'subscriptions' && <SubscriptionStudio />}
        {activeAdminTab === 'payments' && <PaymentProofCenter />}
        {activeAdminTab === 'settings' && <GlobalSettings />}
        {activeAdminTab === 'features' && <FeatureSwitchCenter />}
        {activeAdminTab === 'lab' && <OwnerTestLab />}
        {activeAdminTab === 'health' && <AppHealthCenter />}
        {activeAdminTab === 'security' && <SecurityCenter />}
        {activeAdminTab === 'backup' && <BackupCenter />}
        {activeAdminTab === 'changelog' && <ChangelogManager />}
        {activeAdminTab === 'support' && <SupportCenter />}
        {activeAdminTab === 'announcements' && <AnnouncementManager />}
        {activeAdminTab === 'database' && <DatabaseCenter />}
        {activeAdminTab === 'analytics' && <AnalyticsCenter />}
        {activeAdminTab === 'automation' && <AutomationCenter />}
      </AdminLayout>
    </motion.div>
  );
};

export default AdminPanel;
