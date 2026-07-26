
export default function CashManagement() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8 max-w-7xl mx-auto pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-theme-primary tracking-tight mb-2">Cash Management</h1>
        <p className="text-theme-muted font-medium">Track daily cash flow, cash in, and expenses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-theme-card border border-theme-border-soft p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2 text-theme-muted text-sm font-bold uppercase">
            <Briefcase className="w-4 h-4" /> Net Balance
          </div>
          <h2 className="text-3xl font-black text-theme-primary">₹ 0</h2>
        </div>
        <div className="bg-theme-card border border-theme-border-soft p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2 text-emerald-500 text-sm font-bold uppercase">
            <ArrowUpRight className="w-4 h-4" /> Total In
          </div>
          <h2 className="text-3xl font-black text-emerald-500">₹ 0</h2>
        </div>
        <div className="bg-theme-card border border-theme-border-soft p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2 text-rose-500 text-sm font-bold uppercase">
            <ArrowDownRight className="w-4 h-4" /> Total Out
          </div>
          <h2 className="text-3xl font-black text-rose-500">₹ 0</h2>
        </div>
      </div>
    </motion.div>
  );
}
