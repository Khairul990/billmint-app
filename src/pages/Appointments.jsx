import { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle, AlertCircle, XCircle, Loader2
} from 'lucide-react';
import { pageVariants, staggerContainer, staggerItem, modalOverlayVariants, modalContentVariants } from '../utils/animations';
import { toast } from 'react-hot-toast';

const STATUS_CONFIG = {
  Scheduled: { icon: Calendar, class: 'badge-info', label: 'Scheduled' },
  Confirmed: { icon: CheckCircle, class: 'badge-primary', label: 'Confirmed' },
  'In Progress': { icon: Loader2, class: 'badge-warning', label: 'In Progress' },
  Completed: { icon: CheckCircle, class: 'badge-success', label: 'Completed' },
  Cancelled: { icon: XCircle, class: 'badge-danger', label: 'Cancelled' },
  'No Show': { icon: AlertCircle, class: 'badge-dark', label: 'No Show' }
};

const STORAGE_KEY = 'billqyro_appointments';

const getDateGroup = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.floor((target - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff >= 2 && diff <= 6) return 'This Week';
  if (diff < 0) return 'Past';
  return 'Later';
};

const getNextId = () => 'apt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
};

const todayStr = () => new Date().toISOString().split('T')[0];

const Appointments = ({ invoices, customers = [], businessSettings, setCurrentTab }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    date: todayStr(),
    time: '10:00',
    serviceType: 'Consultation',
    status: 'Scheduled',
    notes: ''
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        let stored = [];
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) stored = JSON.parse(raw);
        } catch (e) { /* ignore */ }

        try {
          const { appointmentEngine } = await import('../services/appointmentEngine');
          await appointmentEngine.syncFromCloud();
        } catch (e) { /* engine not available */ }

        if (!cancelled) {
          setAppointments(Array.isArray(stored) ? stored : []);
        }
      } catch (e) {
        if (!cancelled) setAppointments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const persistAppointments = (updated) => {
    setAppointments(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) { /* storage full */ }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Scheduled;
    const Icon = config.icon;
    return (
      <span className={`badge-premium inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.class}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const grouped = { Today: [], Tomorrow: [], 'This Week': [], Past: [], Later: [] };
  appointments.forEach(apt => {
    const group = getDateGroup(apt.date);
    if (grouped[group]) grouped[group].push(apt);
  });
  Object.keys(grouped).forEach(k => {
    grouped[k].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time || '').localeCompare(b.time || '');
    });
  });

  const todayCount = grouped.Today.length;
  const upcomingCount = grouped.Today.length + grouped.Tomorrow.length + grouped['This Week'].length;
  const completedThisWeek = appointments.filter(a => a.status === 'Completed' && getDateGroup(a.date) !== 'Past').length;
  const cancelledCount = appointments.filter(a => a.status === 'Cancelled').length;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.customerName) {
      toast.error('Please select or enter a customer name');
      return;
    }
    const newApt = { ...formData, id: getNextId(), createdAt: new Date().toISOString() };
    const updated = [newApt, ...appointments];
    persistAppointments(updated);
    setShowModal(false);
    resetForm();
    toast.success('Appointment created successfully');
  };

  const updateStatus = (id, newStatus) => {
    const updated = appointments.map(a => a.id === id ? { ...a, status: newStatus } : a);
    persistAppointments(updated);
    toast.success(`Appointment marked as ${newStatus}`);
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      customerPhone: '',
      date: todayStr(),
      time: '10:00',
      serviceType: 'Consultation',
      status: 'Scheduled',
      notes: ''
    });
  };

  const handleCustomerSelect = (e) => {
    const id = e.target.value;
    if (!id) {
      setFormData(f => ({ ...f, customerId: '', customerName: '', customerPhone: '' }));
      return;
    }
    const c = customers.find(cust => cust.id === id);
    if (c) {
      setFormData(f => ({ ...f, customerId: id, customerName: c.name || '', customerPhone: c.phone || '' }));
    }
  };

  const openCreateModal = () => {
    resetForm();
    setFormData(f => ({ ...f, date: todayStr() }));
    setShowModal(true);
  };

  const renderStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <motion.div variants={staggerItem} className="stat-premium">
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-lg font-black text-theme-primary">{todayCount}</span>
        </div>
        <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Today's Appointments</p>
      </motion.div>
      <motion.div variants={staggerItem} className="stat-premium">
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CalendarRange className="w-4 h-4" />
          </div>
          <span className="text-lg font-black text-theme-primary">{upcomingCount}</span>
        </div>
        <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Upcoming</p>
      </motion.div>
      <motion.div variants={staggerItem} className="stat-premium">
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
            <CheckCircle className="w-4 h-4" />
          </div>
          <span className="text-lg font-black text-theme-primary">{completedThisWeek}</span>
        </div>
        <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Completed This Week</p>
      </motion.div>
      <motion.div variants={staggerItem} className="stat-premium">
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
            <CalendarX className="w-4 h-4" />
          </div>
          <span className="text-lg font-black text-theme-primary">{cancelledCount}</span>
        </div>
        <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Cancellations</p>
      </motion.div>
    </div>
  );

  const renderAppointmentCard = (apt) => {
    const canConfirm = apt.status === 'Scheduled';
    const canComplete = apt.status === 'Confirmed' || apt.status === 'In Progress';
    const canCancel = apt.status !== 'Completed' && apt.status !== 'Cancelled' && apt.status !== 'No Show';

    return (
      <motion.div key={apt.id} variants={staggerItem} className="card-premium p-4 group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-sm font-bold text-theme-primary truncate">{apt.customerName}</span>
              {getStatusBadge(apt.status)}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-theme-muted">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(apt.date)}
              </span>
              {apt.time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(apt.time)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Stethoscope className="w-3 h-3" />
                {apt.serviceType}
              </span>
            </div>
            {apt.notes && (
              <p className="text-[11px] text-theme-muted/70 mt-2 flex items-start gap-1.5 line-clamp-2">
                <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                {apt.notes}
              </p>
            )}
            {apt.customerPhone && (
              <p className="text-[11px] text-theme-muted/50 mt-1 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {apt.customerPhone}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-theme-border-soft/50 flex-wrap">
          {canConfirm && (
            <button onClick={() => updateStatus(apt.id, 'Confirmed')} className="btn-premium-ghost text-[10px] !min-h-[28px] !py-1 !px-2.5">
              <CheckCircle className="w-3 h-3" />
              Confirm
            </button>
          )}
          {canComplete && (
            <button onClick={() => updateStatus(apt.id, 'Completed')} className="btn-premium-ghost text-[10px] !min-h-[28px] !py-1 !px-2.5">
              <CheckCircle className="w-3 h-3" />
              Complete
            </button>
          )}
          {canCancel && (
            <button onClick={() => updateStatus(apt.id, 'Cancelled')} className="btn-premium-ghost text-[10px] !min-h-[28px] !py-1 !px-2.5 !text-theme-danger">
              <XCircle className="w-3 h-3" />
              Cancel
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  const renderGroup = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <motion.div variants={staggerItem} className="mb-6">
        <div className="section-header mb-3">
          <div>
            <h3 className="section-header-title text-sm">{title}</h3>
            <p className="section-header-subtitle">{items.length} appointment{items.length !== 1 ? 's' : ''}</p>
          </div>
          <span className="badge-premium text-[10px] font-extrabold">{items.length}</span>
        </div>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
          {items.map(renderAppointmentCard)}
        </motion.div>
      </motion.div>
    );
  };

  const renderEmpty = () => (
    <div className="card-premium p-8">
      <div className="empty-state py-8">
        <div className="empty-state-icon">
          <Calendar className="w-8 h-8" />
        </div>
        <p className="empty-state-title">No appointments scheduled</p>
        <p className="empty-state-text">Create your first appointment to start managing your schedule.</p>
        <button onClick={openCreateModal} className="btn-premium mt-4 px-5 py-3 bg-theme-accent text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" />
          Create Appointment
        </button>
      </div>
    </div>
  );

  const renderSkeletons = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <CardSkeleton key={i} lines={2} />)}
      </div>
      {[1, 2, 3].map(i => <CardSkeleton key={`list-${i}`} lines={3} />)}
    </div>
  );

  const renderModal = () => (
    <AnimatePresence>
      {showModal && (
        <motion.div variants={modalOverlayVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div variants={modalContentVariants} initial="hidden" animate="visible" exit="exit" className="card-premium w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-black text-theme-primary">New Appointment</h3>
                <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mt-0.5">SCHEDULE A VISIT</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl bg-theme-surface dark:bg-theme-card flex items-center justify-center text-theme-muted hover:text-theme-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-theme-primary mb-1.5 uppercase tracking-wider">Customer</label>
                {customers.length > 0 ? (
                  <select value={formData.customerId} onChange={handleCustomerSelect} className="input-premium w-full">
                    <option value="">Select a customer or type below</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ''}</option>
                    ))}
                  </select>
                ) : null}
                <input type="text" placeholder="Customer name" value={formData.customerName} onChange={e => setFormData(f => ({ ...f, customerName: e.target.value }))} className="input-premium w-full mt-2" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-theme-primary mb-1.5 uppercase tracking-wider">Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} className="input-premium w-full" required />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-theme-primary mb-1.5 uppercase tracking-wider">Time</label>
                  <input type="time" value={formData.time} onChange={e => setFormData(f => ({ ...f, time: e.target.value }))} className="input-premium w-full" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-theme-primary mb-1.5 uppercase tracking-wider">Service Type</label>
                <input type="text" placeholder="e.g. Consultation, Follow-up, Repair" value={formData.serviceType} onChange={e => setFormData(f => ({ ...f, serviceType: e.target.value }))} className="input-premium w-full" required />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-theme-primary mb-1.5 uppercase tracking-wider">Phone (optional)</label>
                <input type="tel" placeholder="Customer phone number" value={formData.customerPhone} onChange={e => setFormData(f => ({ ...f, customerPhone: e.target.value }))} className="input-premium w-full" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-theme-primary mb-1.5 uppercase tracking-wider">Notes (optional)</label>
                <textarea rows={3} placeholder="Any notes or details about this appointment..." value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} className="input-premium w-full resize-none" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-premium-ghost flex-1 py-3 text-xs font-extrabold uppercase tracking-wider">
                  Cancel
                </button>
                <button type="submit" className="btn-premium flex-1 py-3 bg-theme-accent text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                  <Plus className="w-4 h-4" />
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const visibleGroups = ['Today', 'Tomorrow', 'This Week'];
  const hasAppointments = visibleGroups.some(g => grouped[g]?.length > 0) || grouped.Past.length > 0 || grouped.Later.length > 0;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-theme-primary tracking-tight">Appointments</h2>
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-0.5">SCHEDULE & MANAGE VISITS</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center justify-center gap-2 bg-gradient-to-tr from-theme-accent to-theme-accent-dark text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="w-4 h-4" />
          <span>New Appointment</span>
        </button>
      </div>

      {loading ? renderSkeletons() : (
        <>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="stats-grid">
            {renderStats()}
          </motion.div>

          {hasAppointments ? (
            <div>
              {visibleGroups.map(g => renderGroup(g, grouped[g]))}
              {renderGroup('Past Appointments', grouped.Past)}
              {renderGroup('Upcoming', grouped.Later)}
            </div>
          ) : renderEmpty()}
        </>
      )}

      {renderModal()}
    </motion.div>
  );
};

export default Appointments;
