import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from './AdminLayout.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import UserManager from './UserManager.jsx';
import WorkspaceAdmin from './WorkspaceAdmin.jsx';
import PremiumControlCenter from './PremiumControlCenter.jsx';
import PaymentProofCenter from './PaymentProofCenter.jsx';
import RevenueCenter from './RevenueCenter.jsx';
import GlobalSettings from './GlobalSettings.jsx';
import AnnouncementManager from './AnnouncementManager.jsx';
import FeatureSwitchCenter from './FeatureSwitchCenter.jsx';
import MaintenanceCenter from './MaintenanceCenter.jsx';
import AppHealthCenter from './AppHealthCenter.jsx';
import BackupCenter from './BackupCenter.jsx';
import StorageDiagnostics from './StorageDiagnostics.jsx';
import SyncDiagnostics from './SyncDiagnostics.jsx';
import SecurityCenter from './SecurityCenter.jsx';
import AuditLogCenter from './AuditLogCenter.jsx';
import OwnerControlCenter from './OwnerControlCenter.jsx';
import SupportCenter from './SupportCenter.jsx';
import AnalyticsCenter from './AnalyticsCenter.jsx';
import ChangelogManager from './ChangelogManager.jsx';
import OwnerTestLab from './OwnerTestLab.jsx';
import { pageVariants } from '../../utils/animations.js';

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
        {activeAdminTab === 'dashboard' && <AdminDashboard onNavigate={setActiveAdminTab} />}
        {activeAdminTab === 'users' && <UserManager />}
        {activeAdminTab === 'workspaces' && <WorkspaceAdmin />}
        {activeAdminTab === 'subscriptions' && <PremiumControlCenter />}
        {activeAdminTab === 'payments' && <PaymentProofCenter />}
        {activeAdminTab === 'revenue' && <RevenueCenter />}
        {activeAdminTab === 'billing' && <GlobalSettings />}
        {activeAdminTab === 'announcements' && <AnnouncementManager />}
        {activeAdminTab === 'modules' && <FeatureSwitchCenter />}
        {activeAdminTab === 'maintenance' && <MaintenanceCenter />}
        {activeAdminTab === 'health' && <AppHealthCenter />}
        {activeAdminTab === 'backup' && <BackupCenter />}
        {activeAdminTab === 'storage' && <StorageDiagnostics />}
        {activeAdminTab === 'sync' && <SyncDiagnostics />}
        {activeAdminTab === 'security' && <SecurityCenter />}
        {activeAdminTab === 'audit' && <AuditLogCenter />}
        {activeAdminTab === 'owner-controls' && <OwnerControlCenter />}
        {activeAdminTab === 'support' && <SupportCenter />}
        {activeAdminTab === 'analytics' && <AnalyticsCenter />}
        {activeAdminTab === 'changelog' && <ChangelogManager />}
        {activeAdminTab === 'test-lab' && <OwnerTestLab />}
      </AdminLayout>
    </motion.div>
  );
};

export default AdminPanel;
