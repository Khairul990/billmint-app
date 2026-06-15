import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import UserManager from './UserManager';
import PaymentProofCenter from './PaymentProofCenter';
import GlobalSettings from './GlobalSettings';
import OwnerTestLab from './OwnerTestLab';

const AdminPanel = ({ currentTab, setCurrentTab }) => {
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');

  return (
    <AdminLayout setCurrentTab={setCurrentTab} activeAdminTab={activeAdminTab} setActiveAdminTab={setActiveAdminTab}>
      {activeAdminTab === 'dashboard' && <AdminDashboard />}
      {activeAdminTab === 'users' && <UserManager />}
      {activeAdminTab === 'payments' && <PaymentProofCenter />}
      {activeAdminTab === 'settings' && <GlobalSettings />}
      {activeAdminTab === 'lab' && <OwnerTestLab />}
    </AdminLayout>
  );
};

export default AdminPanel;
