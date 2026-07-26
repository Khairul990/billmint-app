
const RefundPolicy = ({ setCurrentTab }) => {
  return (
    <div className="max-w-4xl mx-auto pb-12 relative font-sans animate-fade-in">
      <button 
        onClick={() => setCurrentTab('more')}
        className="flex items-center gap-2 text-theme-muted hover:text-theme-primary mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Back</span>
      </button>

      <div className="space-y-6">
        <div className="bg-theme-warning/10 border border-theme-warning/30 rounded-2xl p-4 text-theme-warning text-sm font-semibold">
          Disclaimer: BillQyro is not legal, tax, or accounting advice. This tool is provided for your convenience only.
        </div>

        <div className="bg-theme-card rounded-3xl p-6 md:p-10 border border-theme-border-soft shadow-premium">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-theme-border-soft">
          <div className="w-12 h-12 bg-theme-accent/10 rounded-xl flex items-center justify-center text-theme-accent">
            <RefreshCcw className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-theme-primary tracking-tight">Refund Policy</h1>
            <p className="text-sm text-theme-muted font-medium mt-1">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-theme-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-theme-primary mb-3">1. Subscription Refunds</h2>
            <p>If you are not entirely satisfied with your subscription, we're here to help. You have 7 calendar days to return a subscription from the date you purchased it. To be eligible for a return, your subscription must be unused and in the same condition that you received it.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-theme-primary mb-3">2. Processing</h2>
            <p>Once we receive your refund request, we will inspect your account activity and notify you that we have received your request. We will immediately notify you on the status of your refund after inspecting the account. If your return is approved, we will initiate a refund to your credit card (or original method of payment).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-theme-primary mb-3">3. Exceptions</h2>
            <p>Certain situations are exempt from refunds, including but not limited to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Accounts that have violated our Terms of Service.</li>
              <li>Accounts that have actively used premium features extensively within the 7-day window.</li>
              <li>Promotional or discounted plans marked as non-refundable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-theme-primary mb-3">4. Contact Us</h2>
            <p>If you have any questions on how to return your subscription to us, contact us via the support section.</p>
          </section>
        </div>
      </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
