import {
  LayoutDashboard, Users, BarChart3, CreditCard, ShoppingBag, Calendar,
  FileText, Palette, Sliders, Award
} from 'lucide-react';
import { fadeInUp } from '../utils/animations';

const PRESETS = {
  DASHBOARD: {
    icon: LayoutDashboard,
    gradient: 'from-violet-500/20 to-fuchsia-500/10 dark:from-violet-500/15 dark:to-fuchsia-500/5',
    iconGradient: 'from-violet-500/30 to-fuchsia-500/15 dark:from-violet-500/25 dark:to-fuchsia-500/10',
    iconColor: 'text-violet-500',
    sparkle: true,
    title: 'Welcome to Your Dashboard',
    description: 'Your business metrics and insights will appear here once you start creating invoices.',
    actionLabel: 'Get Started',
  },
  CUSTOMERS: {
    icon: Users,
    gradient: 'from-blue-500/20 to-cyan-500/10 dark:from-blue-500/15 dark:to-cyan-500/5',
    iconGradient: 'from-blue-500/30 to-cyan-500/15 dark:from-blue-500/25 dark:to-cyan-500/10',
    iconColor: 'text-blue-500',
    title: 'No Customers Yet',
    description: 'Add your first customer to start building your client database.',
    actionLabel: 'Add Customer',
  },
  REPORTS: {
    icon: BarChart3,
    gradient: 'from-emerald-500/20 to-teal-500/10 dark:from-emerald-500/15 dark:to-teal-500/5',
    iconGradient: 'from-emerald-500/30 to-teal-500/15 dark:from-emerald-500/25 dark:to-teal-500/10',
    iconColor: 'text-emerald-500',
    title: 'No Reports Available',
    description: 'Generate invoices to see detailed reports and analytics.',
    actionLabel: 'View Invoices',
  },
  DUE_LEDGER: {
    icon: CreditCard,
    gradient: 'from-amber-500/20 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/5',
    iconGradient: 'from-amber-500/30 to-orange-500/15 dark:from-amber-500/25 dark:to-orange-500/10',
    iconColor: 'text-amber-500',
    title: 'No Dues Recorded',
    description: 'All your payments are up to date! Outstanding dues will appear here.',
    actionLabel: 'Create Invoice',
  },
  ORDERS: {
    icon: ShoppingBag,
    gradient: 'from-rose-500/20 to-pink-500/10 dark:from-rose-500/15 dark:to-pink-500/5',
    iconGradient: 'from-rose-500/30 to-pink-500/15 dark:from-rose-500/25 dark:to-pink-500/10',
    iconColor: 'text-rose-500',
    title: 'No Orders Yet',
    description: 'Create your first order to start tracking sales.',
    actionLabel: 'New Order',
  },
  APPOINTMENTS: {
    icon: Calendar,
    gradient: 'from-sky-500/20 to-indigo-500/10 dark:from-sky-500/15 dark:to-indigo-500/5',
    iconGradient: 'from-sky-500/30 to-indigo-500/15 dark:from-sky-500/25 dark:to-indigo-500/10',
    iconColor: 'text-sky-500',
    title: 'No Appointments',
    description: 'Schedule your first appointment to manage your calendar.',
    actionLabel: 'Schedule',
  },
  TEMPLATES: {
    icon: FileText,
    gradient: 'from-purple-500/20 to-violet-500/10 dark:from-purple-500/15 dark:to-violet-500/5',
    iconGradient: 'from-purple-500/30 to-violet-500/15 dark:from-purple-500/25 dark:to-violet-500/10',
    iconColor: 'text-purple-500',
    title: 'No Templates',
    description: 'Design your first template to customize your invoices.',
    actionLabel: 'Create Template',
  },
  DESIGN_STUDIO: {
    icon: Palette,
    gradient: 'from-pink-500/20 to-rose-500/10 dark:from-pink-500/15 dark:to-rose-500/5',
    iconGradient: 'from-pink-500/30 to-rose-500/15 dark:from-pink-500/25 dark:to-rose-500/10',
    iconColor: 'text-pink-500',
    title: 'Design Studio Ready',
    description: 'Start customizing your billing experience with themes and templates.',
    actionLabel: 'Open Studio',
  },
  SETTINGS: {
    icon: Sliders,
    gradient: 'from-slate-500/20 to-gray-500/10 dark:from-slate-500/15 dark:to-gray-500/5',
    iconGradient: 'from-slate-500/30 to-gray-500/15 dark:from-slate-500/25 dark:to-gray-500/10',
    iconColor: 'text-slate-500',
    title: 'Settings Configured',
    description: 'Your workspace settings are ready to go.',
    actionLabel: 'Manage',
  },
  SUBSCRIPTION: {
    icon: Award,
    gradient: 'from-yellow-500/20 to-amber-500/10 dark:from-yellow-500/15 dark:to-amber-500/5',
    iconGradient: 'from-yellow-500/30 to-amber-500/15 dark:from-yellow-500/25 dark:to-amber-500/10',
    iconColor: 'text-yellow-500',
    title: 'Choose Your Plan',
    description: 'Select a plan that fits your business needs.',
    actionLabel: 'View Plans',
  },
};

const SIZES = {
  sm: 'p-6 min-h-[200px]',
  md: 'p-8 md:p-12 min-h-[320px]',
  lg: 'p-10 md:p-16 min-h-[440px]',
};

const PremiumEmptyState = ({
  type,
  icon: CustomIcon,
  title,
  description,
  actionLabel,
  onAction,
  gradient,
  size = 'md',
  className = '',
}) => {
  const preset = PRESETS[type];
  const Icon = CustomIcon || preset?.icon;
  const resolvedTitle = title || preset?.title;
  const resolvedDescription = description || preset?.description;
  const resolvedActionLabel = actionLabel || preset?.actionLabel;
  const iconContainerGradient = gradient || preset?.gradient || 'from-accent/20 to-accent/10 dark:from-accent/15 dark:to-accent/5';
  const iconInnerGradient = preset?.iconGradient || 'from-accent/30 to-accent/15 dark:from-accent/25 dark:to-accent/10';
  const iconColor = preset?.iconColor || 'text-accent';

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={`card-premium glass ${SIZES[size]} flex flex-col items-center text-center justify-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative mb-6"
      >
        {preset?.sparkle && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute -top-2 -right-2 z-10"
          >
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </motion.div>
        )}
        <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${iconContainerGradient} flex items-center justify-center`}>
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${iconInnerGradient} flex items-center justify-center`}>
            {Icon && <Icon className={`w-8 h-8 ${iconColor}`} />}
          </div>
        </div>
      </motion.div>

      <motion.h3
        variants={fadeInUp}
        className="text-lg md:text-xl font-black text-gradient-premium mb-2"
      >
        {resolvedTitle}
      </motion.h3>

      <motion.p
        variants={fadeInUp}
        className="text-sm text-theme-muted max-w-sm leading-relaxed mb-6"
        style={{ color: 'var(--text-muted)' }}
      >
        {resolvedDescription}
      </motion.p>

      <motion.div
        variants={fadeInUp}
        className="flex flex-col sm:flex-row items-center gap-3"
      >
        {resolvedActionLabel && onAction && (
          <button onClick={onAction} className="btn-premium w-full sm:w-auto inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {resolvedActionLabel}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

PremiumEmptyState.PRESETS = PRESETS;

export default PremiumEmptyState;
