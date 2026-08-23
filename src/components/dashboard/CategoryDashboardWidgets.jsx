import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, Package, Calendar, Scissors, Wrench, 
  GraduationCap, Stethoscope, Clock, CheckCircle2, ChevronRight,
  TrendingUp, Users, ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/invoiceUtils';

/**
 * Category-Aware Dynamic Dashboard Widgets
 * Adapts intelligence cards based on active business preset:
 * - Retail/Grocery: Low Stock & Out-of-Stock Inventory Warning
 * - Doctor/Clinic: Patient Consultations & Active Prescriptions
 * - Tailor/Studio: Stitching, Measurements & Custom Orders Queue
 * - Service/Repair: Active Service Jobs & Device Status
 * - Education/Tuition: Student Fees & Batch summary
 */
const CategoryDashboardWidgets = ({ 
  businessType = 'retail',
  products = [], 
  invoices = [], 
  customers = [],
  currencySymbol = '₹',
  setCurrentTab,
  onQuickBillOpen
}) => {
  const wsType = (businessType || 'retail').toLowerCase();

  // 1. Retail / Grocery Stock Alerts
  const lowStockItems = products.filter(p => {
    const stock = parseFloat(p.stock || p.quantity) || 0;
    const minStock = parseFloat(p.minStock || p.lowStockThreshold) || 5;
    return stock > 0 && stock <= minStock && !p.isDeleted;
  });

  const outOfStockItems = products.filter(p => {
    const stock = parseFloat(p.stock || p.quantity) || 0;
    return stock <= 0 && !p.isDeleted;
  });

  // 2. Tailor / Orders Queue
  const customOrders = invoices.filter(inv => {
    const type = (inv.documentType || inv.billType || '').toLowerCase();
    const status = (inv.orderStatus || inv.status || '').toLowerCase();
    return type === 'order' || status === 'pending' || status === 'in_progress';
  });

  // 3. Due & Outstanding for Service/Education
  const pendingDueInvoices = invoices.filter(inv => {
    const s = (inv.paymentStatus || '').toLowerCase();
    return s === 'unpaid' || s === 'partial' || s === 'partially paid';
  });

  const totalOutstandingAmount = pendingDueInvoices.reduce((sum, inv) => {
    const total = parseFloat(inv.grandTotal || inv.total) || 0;
    const paid = parseFloat(inv.amountPaid ?? inv.paidAmount) || 0;
    return sum + Math.max(0, total - paid);
  }, 0);

  return (
    <div className="space-y-4 mb-6">
      {/* RETAIL / INVENTORY ALERTS */}
      {(wsType === 'retail' || wsType === 'grocery' || wsType === 'fmcg') && (lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-premium-sm"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-sm font-black text-theme-primary">Inventory Stock Alert</h4>
                {outOfStockItems.length > 0 && (
                  <span className="badge-premium badge-danger text-2xs">{outOfStockItems.length} Out of Stock</span>
                )}
                {lowStockItems.length > 0 && (
                  <span className="badge-premium badge-warning text-2xs">{lowStockItems.length} Low Stock</span>
                )}
              </div>
              <p className="text-xs text-theme-muted">
                {outOfStockItems.length > 0 
                  ? `${outOfStockItems.map(p => p.name).slice(0, 2).join(', ')}${outOfStockItems.length > 2 ? ' and more' : ''} require immediate restocking.`
                  : `${lowStockItems.map(p => p.name).slice(0, 2).join(', ')} reached low stock threshold.`}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentTab && setCurrentTab('products')}
            className="btn-premium text-xs min-h-[38px] px-4 shrink-0 flex items-center justify-center gap-1.5"
          >
            <Package className="w-4 h-4" /> Manage Stock <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* CLINIC / MEDICAL PRESET WIDGET */}
      {(wsType === 'doctor' || wsType === 'clinic' || wsType === 'medical') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card-premium p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xs font-bold text-theme-muted uppercase tracking-wider">Patient Care Center</p>
                <p className="text-sm font-black text-theme-primary">{customers.length} Registered Patients</p>
              </div>
            </div>
            <button 
              onClick={() => setCurrentTab && setCurrentTab('customers')}
              className="btn-premium-outline text-xs !min-h-[34px] px-3"
            >
              Patient List
            </button>
          </div>

          <div className="card-premium p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xs font-bold text-theme-muted uppercase tracking-wider">Clinical Prescriptions</p>
                <p className="text-sm font-black text-theme-primary">{invoices.length} Bills Issued</p>
              </div>
            </div>
            <button 
              onClick={() => setCurrentTab && setCurrentTab('create-invoice')}
              className="btn-premium text-xs !min-h-[34px] px-3"
            >
              New Prescription
            </button>
          </div>
        </div>
      )}

      {/* TAILOR / BOUTIQUE PRESET WIDGET */}
      {(wsType === 'tailor' || wsType === 'boutique' || wsType === 'fashion') && (
        <div className="card-premium p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-theme-primary">Stitching & Custom Orders</h4>
                <span className="badge-premium badge-info text-2xs">{customOrders.length} In Progress</span>
              </div>
              <p className="text-xs text-theme-muted">Track garment delivery dates, fabric measurements, and trial fittings.</p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentTab && setCurrentTab('create-invoice')}
            className="btn-premium text-xs min-h-[38px] px-4 shrink-0 flex items-center gap-1.5"
          >
            Create Stitching Order <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SERVICE & REPAIR PRESET WIDGET */}
      {(wsType === 'service' || wsType === 'garage' || wsType === 'repair') && (
        <div className="card-premium p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-theme-primary">Service Jobs & Repair Center</h4>
                <span className="badge-premium badge-info text-2xs">{pendingDueInvoices.length} Active Jobs</span>
              </div>
              <p className="text-xs text-theme-muted">Manage device intakes, spare parts billing, and customer job card delivery.</p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentTab && setCurrentTab('create-invoice')}
            className="btn-premium text-xs min-h-[38px] px-4 shrink-0 flex items-center gap-1.5"
          >
            Create Job Card <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* EDUCATION / TUITION PRESET WIDGET */}
      {(wsType === 'teacher' || wsType === 'education' || wsType === 'coaching') && (
        <div className="card-premium p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-theme-primary">Student Tuition & Fee Ledger</h4>
                <span className="badge-premium badge-warning text-2xs">{formatCurrency(totalOutstandingAmount, currencySymbol)} Pending</span>
              </div>
              <p className="text-xs text-theme-muted">Track student enrollments, batch monthly fees, and send WhatsApp payment links.</p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentTab && setCurrentTab('due-ledger')}
            className="btn-premium text-xs min-h-[38px] px-4 shrink-0 flex items-center gap-1.5"
          >
            Fee Collection Ledger <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryDashboardWidgets;
