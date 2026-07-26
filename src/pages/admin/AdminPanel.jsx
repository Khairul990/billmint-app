import { useState } from 'react';
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
