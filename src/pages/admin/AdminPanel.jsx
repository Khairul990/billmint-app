import React, { useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from './AdminLayout.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import AdminErrorBoundary from '../../components/AdminErrorBoundary.jsx';
import { KPISkeleton } from '../../components/PremiumSkeleton';
import { pageVariants } from '../../utils/animations.js';

/**
 * BillQyro Owner Console — root container.
 *
 * Resilience model (v2):
 *  - Every section renders inside its OWN AdminErrorBoundary, keyed by the
 *    active tab. A crash in one section shows a contained error card while
 *    the rest of the console (navigation, header, other sections) keeps
 *    working. Switching tabs remounts the boundary and clears the error.
 *  - Heavy sections are code-split with React.lazy so the console's first
 *    paint only ships the dashboard; each section streams in on demand.
 */

const sectionFallback = (
  <div className="space-y-4 p-1">
    <KPISkeleton count={4} />
  </div>
);

const UserManager = lazy(() => import('./UserManager.jsx'));
const WorkspaceAdmin = lazy(() => import('./WorkspaceAdmin.jsx'));
const PremiumControlCenter = lazy(() => import('./PremiumControlCenter.jsx'));
const PaymentProofCenter = lazy(() => import('./PaymentProofCenter.jsx'));
const RevenueCenter = lazy(() => import('./RevenueCenter.jsx'));
const GlobalSettings = lazy(() => import('./GlobalSettings.jsx'));
const AnnouncementManager = lazy(() => import('./AnnouncementManager.jsx'));
const FeatureSwitchCenter = lazy(() => import('./FeatureSwitchCenter.jsx'));
const MaintenanceCenter = lazy(() => import('./MaintenanceCenter.jsx'));
const AppHealthCenter = lazy(() => import('./AppHealthCenter.jsx'));
const BackupCenter = lazy(() => import('./BackupCenter.jsx'));
const StorageDiagnostics = lazy(() => import('./StorageDiagnostics.jsx'));
const SyncDiagnostics = lazy(() => import('./SyncDiagnostics.jsx'));
const SecurityCenter = lazy(() => import('./SecurityCenter.jsx'));
const AuditLogCenter = lazy(() => import('./AuditLogCenter.jsx'));
const OwnerControlCenter = lazy(() => import('./OwnerControlCenter.jsx'));
const SupportCenter = lazy(() => import('./SupportCenter.jsx'));
const AnalyticsCenter = lazy(() => import('./AnalyticsCenter.jsx'));
const ChangelogManager = lazy(() => import('./ChangelogManager.jsx'));
const OwnerTestLab = lazy(() => import('./OwnerTestLab.jsx'));

const SECTION_MAP = {
  dashboard: null, // rendered eagerly below (with its own boundary)
  users: UserManager,
  workspaces: WorkspaceAdmin,
  subscriptions: PremiumControlCenter,
  payments: PaymentProofCenter,
  revenue: RevenueCenter,
  billing: GlobalSettings,
  announcements: AnnouncementManager,
  modules: FeatureSwitchCenter,
  maintenance: MaintenanceCenter,
  health: AppHealthCenter,
  backup: BackupCenter,
  storage: StorageDiagnostics,
  sync: SyncDiagnostics,
  security: SecurityCenter,
  audit: AuditLogCenter,
  'owner-controls': OwnerControlCenter,
  support: SupportCenter,
  analytics: AnalyticsCenter,
  changelog: ChangelogManager,
  'test-lab': OwnerTestLab
};

const AdminPanel = ({ currentTab, setCurrentTab }) => {
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');

  const ActiveSection = SECTION_MAP[activeAdminTab];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <AdminLayout setCurrentTab={setCurrentTab} activeAdminTab={activeAdminTab} setActiveAdminTab={setActiveAdminTab}>
        <AdminErrorBoundary key={`sec-${activeAdminTab}`}>
          {activeAdminTab === 'dashboard' ? (
            <AdminDashboard onNavigate={setActiveAdminTab} />
          ) : ActiveSection ? (
            <Suspense fallback={sectionFallback}>
              <ActiveSection />
            </Suspense>
          ) : (
            <div className="p-10 text-center text-sm font-bold text-theme-muted">
              Unknown console section: “{activeAdminTab}”. Use the search above to jump elsewhere.
            </div>
          )}
        </AdminErrorBoundary>
      </AdminLayout>
    </motion.div>
  );
};

export default AdminPanel;
