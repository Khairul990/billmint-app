
export default function DataDeletion({ onBack }) {
  return (
    <div className="min-h-screen bg-theme-app text-theme-primary font-sans">
      <div className="bg-theme-card border-b border-theme-border-soft sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-theme-app transition-colors text-theme-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-theme-accent" /> Data Management
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-theme-warning/10 border border-theme-warning/30 rounded-2xl p-4 text-theme-warning text-sm font-semibold">
          Disclaimer: BillQyro is not legal, tax, or accounting advice. This tool is provided for your convenience only.
        </div>

        <section className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium">
          <h2 className="text-xl font-black mb-4">Export Your Data</h2>
          <p className="text-theme-muted mb-6 text-sm leading-relaxed">
            You have the right to request a copy of your data in a machine-readable format. This includes your invoices, customer list, and business settings.
          </p>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-theme-app border border-theme-border-soft rounded-xl text-theme-primary font-bold hover:bg-theme-surface transition-colors cursor-not-allowed opacity-75">
            <Download className="w-4 h-4" /> Request Data Export (Coming Soon)
          </button>
        </section>

        <section className="bg-theme-card rounded-3xl p-6 border border-theme-border-soft shadow-premium">
          <h2 className="text-xl font-black mb-4 text-theme-danger">Delete Your Account & Data</h2>
          <p className="text-theme-muted mb-6 text-sm leading-relaxed">
            You can request the permanent deletion of your account and all associated data. This action is irreversible. Once deleted, you will not be able to recover your invoices, customer data, or settings.
          </p>
          <div className="bg-theme-danger/5 border border-theme-danger/20 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-theme-danger mb-2">What happens when you delete your account?</h3>
            <ul className="list-disc pl-5 text-sm text-theme-danger/80 space-y-1">
              <li>All invoices and estimates will be permanently deleted.</li>
              <li>Customer data will be permanently deleted.</li>
              <li>Your business profile and settings will be removed.</li>
              <li>Public invoice links will stop working immediately.</li>
            </ul>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-theme-danger text-white rounded-xl font-bold hover:bg-theme-danger/90 transition-colors shadow-md cursor-not-allowed opacity-75">
            <Trash2 className="w-4 h-4" /> Request Account Deletion (Coming Soon)
          </button>
        </section>

        <div className="text-center pb-10">
          <p className="text-xs text-theme-muted font-semibold">
            To manually request data deletion now, please contact our support team at privacy@billqyro.com.
          </p>
        </div>
      </div>
    </div>
  );
}
