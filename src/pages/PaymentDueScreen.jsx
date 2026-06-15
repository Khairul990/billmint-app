import React, { useState } from 'react';
import { ShieldAlert, Image as ImageIcon, Send, Clock, CheckCircle } from 'lucide-react';

const PaymentDueScreen = ({ pendingAmount, chargeableBills, onLogout }) => {
  const [screenshot, setScreenshot] = useState(null);
  const [utr, setUtr] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!screenshot || !utr) return;
    
    // Simulate submission to AI / Admin Queue
    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md bg-[#1e293b] p-8 rounded-3xl border border-emerald-500/30 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Proof Submitted</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your payment proof is being verified by our AI system and admin team. Your account will be unlocked shortly upon successful verification.
          </p>
          <button 
            onClick={onLogout}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full bg-[#1e293b] p-8 rounded-3xl border border-rose-500/30 shadow-2xl shadow-rose-500/10">
        <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-center mb-2">Platform Dues Pending</h1>
        <p className="text-slate-400 text-sm text-center font-semibold mb-6">
          You have reached the free bill limit and accrued pending dues based on the Pay Per Bill system.
        </p>

        <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-700 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm">Chargeable Bills:</span>
            <span className="font-bold">{chargeableBills || 24}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Total Pending Due:</span>
            <span className="text-xl font-black text-rose-500">₹{pendingAmount || 120}</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-bold">Pay via UPI</p>
          <div className="bg-white p-4 rounded-xl inline-block mb-2">
            {/* Placeholder for QR Code */}
            <div className="w-32 h-32 bg-slate-200 border-4 border-white flex items-center justify-center text-slate-400">
              QR Code
            </div>
          </div>
          <p className="font-mono text-sm bg-slate-800 py-2 rounded-lg text-slate-300">
            billqyro@upi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Upload Payment Screenshot
            </label>
            <div className="relative">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setScreenshot(e.target.files[0])}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                required
              />
              <div className="w-full py-3 bg-[#0f172a] border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 text-sm font-semibold">
                <ImageIcon className="w-4 h-4 mr-2" />
                {screenshot ? screenshot.name : 'Choose Image'}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              UTR / Transaction ID
            </label>
            <input 
              type="text"
              placeholder="e.g. 123456789012"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 text-white p-3 rounded-xl focus:outline-none focus:border-rose-500 text-sm font-semibold"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors mt-2"
          >
            <Send className="w-4 h-4 mr-2" /> Submit Proof
          </button>
        </form>

        <button 
          onClick={onLogout}
          className="w-full mt-4 text-slate-500 hover:text-slate-300 text-xs font-bold transition-colors"
        >
          Logout & Pay Later
        </button>
      </div>
    </div>
  );
};

export default PaymentDueScreen;
