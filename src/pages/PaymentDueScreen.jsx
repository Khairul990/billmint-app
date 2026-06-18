import React, { useState, useEffect } from 'react';
import { ShieldAlert, Image as ImageIcon, Send, Clock, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { getAuthSession, getRealUserId, submitPlatformPaymentProof, getGlobalRevenueSettings } from '../services/dbEngine';
import { toast } from 'react-hot-toast';

const PaymentDueScreen = ({ pendingAmount, chargeableBills, onCancel, onLogout }) => {
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [utr, setUtr] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalSettings, setGlobalSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const gs = await getGlobalRevenueSettings();
      setGlobalSettings(gs);
    };
    fetchSettings();
  }, []);

  const handleScreenshotChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onload = (event) => setScreenshotBase64(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!utr.trim()) {
      toast.error('Please specify the Transaction Reference ID (UTR).');
      return;
    }

    setLoading(true);
    try {
      const session = getAuthSession();
      const userId = session?.uid || getRealUserId() || 'local-user';
      const userEmail = session?.userEmail || session?.email || 'local-user';

      await submitPlatformPaymentProof(
        userId,
        userEmail,
        pendingAmount,
        'UPI/Manual',
        utr,
        screenshotBase64,
        'Manual payment proof for platform dues'
      );

      setSubmitted(true);
      toast.success('Payment proof submitted successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit proof. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-theme-primary font-sans max-w-md mx-auto my-12">
        <div className="bg-theme-card p-8 rounded-3xl border border-theme-border-soft text-center shadow-premium w-full">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black mb-2">Proof Submitted</h2>
          <p className="text-theme-muted text-sm mb-6 font-semibold">
            Your payment proof has been successfully submitted and is under review. The admin team will verify it shortly to unlock your account.
          </p>
          <button 
            onClick={onCancel}
            className="w-full py-3.5 bg-theme-accent text-white font-bold rounded-2xl transition-colors hover:opacity-90"
          >
            Go Back to Today's Business
          </button>
        </div>
      </div>
    );
  }

  const upiId = globalSettings?.upiId || 'khairul2052007@okaxis';
  const payeeName = globalSettings?.payeeName || 'BillQyro Platform';

  return (
    <div className="flex flex-col items-center justify-center p-4 text-theme-primary font-sans max-w-md mx-auto my-6">
      <div className="w-full bg-theme-card p-6 md:p-8 rounded-3xl border border-theme-border-soft shadow-premium">
        
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={onCancel} 
            className="p-2 hover:bg-theme-surface rounded-xl transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-theme-primary" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight">Platform Dues Pending</h1>
            <p className="text-xs text-theme-muted font-bold">Clear dues to unlock new bills</p>
          </div>
        </div>

        <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <p className="text-theme-muted text-sm font-semibold mb-6">
          You have exceeded your free invoice limits. Please clear the pending platform charges to continue generating new invoices.
        </p>

        <div className="bg-theme-surface p-4 rounded-2xl border border-theme-border-soft/60 mb-6 font-mono text-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-theme-muted">Chargeable Bills:</span>
            <span className="font-bold text-theme-primary">{chargeableBills}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-theme-muted">Total Pending Due:</span>
            <span className="text-lg font-black text-rose-500">₹{pendingAmount}</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-xs text-theme-muted mb-2 uppercase tracking-wider font-bold">UPI Payment ID</p>
          <p className="font-mono text-sm bg-theme-surface border border-theme-border-soft py-2 px-4 rounded-xl text-theme-primary select-all break-all">
            {upiId}
          </p>
          <p className="text-[10px] text-theme-muted mt-1 font-semibold">Payee: {payeeName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-theme-muted mb-2 uppercase tracking-wider">
              Upload Payment Screenshot (Optional)
            </label>
            <div className="relative">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleScreenshotChange(e.target.files[0])}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
              />
              <div className="w-full py-3 bg-theme-surface border border-theme-border-soft rounded-xl flex items-center justify-center text-theme-muted text-sm font-semibold hover:border-theme-accent transition-colors">
                <ImageIcon className="w-4 h-4 mr-2 text-theme-accent" />
                {screenshot ? screenshot.name : 'Choose Screenshot Image'}
              </div>
            </div>
            {screenshotBase64 && (
              <div className="mt-2 flex items-center gap-2 bg-theme-surface p-2 rounded-xl border border-theme-border-soft">
                <img src={screenshotBase64} alt="Screenshot preview" className="w-10 h-10 object-cover rounded-lg" />
                <span className="text-xs text-theme-muted truncate max-w-[200px]">{screenshot.name}</span>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-xs font-bold text-theme-muted mb-2 uppercase tracking-wider">
              UTR / Transaction Reference ID
            </label>
            <input 
              type="text"
              placeholder="e.g. 123456789012"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              className="w-full bg-theme-surface border border-theme-border-soft text-theme-primary p-3.5 rounded-xl focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent text-sm font-semibold transition-all"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-theme-accent text-white font-bold rounded-2xl flex items-center justify-center transition-colors mt-2 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Submitting...' : 'Submit Payment Proof'}
          </button>
        </form>

        <div className="flex flex-col gap-2 mt-4">
          <button 
            onClick={onCancel}
            className="w-full py-2 bg-transparent text-theme-accent text-xs font-bold transition-colors hover:underline"
          >
            View Data & Pay Later
          </button>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="w-full py-2 bg-transparent text-theme-muted hover:text-theme-primary text-xs font-bold transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDueScreen;
