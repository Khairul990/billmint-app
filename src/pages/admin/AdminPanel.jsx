import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from './AdminLayout.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import UserManager from './UserManager.jsx';
import WorkspaceAdmin from './WorkspaceAdmin.jsx';
import SubscriptionStudio from './SubscriptionStudio.jsx';
import PaymentProofCenter from './PaymentProofCenter.jsx';
import RevenueCenter from './RevenueCenter.jsx';
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
        {activeAdminTab === 'dashboard' && <AdminDashboard />}
        {activeAdminTab === 'users' && <UserManager />}
        {activeAdminTab === 'workspaces' && <WorkspaceAdmin />}
        {activeAdminTab === 'subscriptions' && <SubscriptionStudio />}
        {activeAdminTab === 'payments' && <PaymentProofCenter />}
        {activeAdminTab === 'revenue' && <RevenueCenter />}
        {activeAdminTab === 'billing' && <RevenueCenter />}
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
      </AdminLayout>
    </motion.div>
  );
};

export default AdminPanel;
