import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Check, Loader2, Landmark, Wallet, DollarSign } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../services/firebaseConfig';
import { toast } from 'react-hot-toast';

const PaymentModal = ({ invoice, onClose }) => {
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [screenshot, setScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const paymentPrefs = invoice.paymentSettingsSnapshot || {};
  const currencySymbol = invoice.regionalSettingsSnapshot?.currency || '₹';
  const dueAmount = invoice.balanceDue !== undefined ? invoice.balanceDue : invoice.grandTotal;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit.');
        return;
      }
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  
  const handleSubmit = async () => {
    if (!screenshot) {
      toast.error('Please upload a payment screenshot proof');
      return;
    }
    
    setUploading(true);
    
    try {
      // 1. Upload screenshot to Firebase Storage
      let screenshotURL = '';
      if (storage) {
        const storageRef = ref(storage, `payment_proofs/${invoice.id}_${Date.now()}.jpg`);
        await uploadBytes(storageRef, screenshot);
        screenshotURL = await getDownloadURL(storageRef);
      } else {
        // Fallback for offline mode, although this modal is strictly for public online invoices.
        screenshotURL = previewUrl; 
      }
      
      // 2. Create payment proof record in Firestore
      if (db) {
        await addDoc(collection(db, 'payment_proofs'), {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          ownerId: invoice.ownerId || invoice.userId,
          customerName: invoice.customerName,
          amount: dueAmount,
          paymentMethod: paymentMethod,
          screenshot: screenshotURL,
          status: 'pending', // pending, approved, rejected
          submittedAt: serverTimestamp(),
        });
      }
      
      setSubmitted(true);
      toast.success('Payment proof submitted successfully!');
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose(screenshotURL, paymentMethod, dueAmount);
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting payment proof:', error);
      toast.error('Failed to submit payment proof. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={() => { if(!uploading && !submitted) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-theme-card border border-theme-border-soft rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 md:p-8"
        >
          
          {submitted ? (
            // Success State
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-black text-theme-primary mb-2">Payment Submitted!</h3>
              <p className="text-theme-muted font-medium text-sm leading-relaxed">
                Your payment proof has been successfully sent to the shop owner.
                You will be notified once it's verified.
              </p>
            </div>
          ) : (
            // Payment Form
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-theme-primary">Submit Payment</h2>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-theme-muted mt-1">Provide transfer proof</p>
                </div>
                <button
                  onClick={() => onClose()}
                  className="p-2 hover:bg-theme-surface rounded-xl transition-colors text-theme-muted hover:text-theme-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Amount */}
              <div className="mb-6 p-5 bg-[image:var(--accent-gradient)] bg-theme-accent text-white rounded-2xl shadow-md border border-white/10">
                <p className="text-xs font-bold uppercase tracking-widest mb-1 text-white/80">Amount to Pay</p>
                <p className="text-3xl font-black">{currencySymbol}{(dueAmount || 0).toLocaleString('en-US')}</p>
              </div>
              
              {/* Payment Method Selection */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-theme-muted mb-3">Select Settlement Method:</p>
                
                <div className="space-y-3">
                  {paymentPrefs.upiId && (
                    <button
                      onClick={() => setPaymentMethod('upi')}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                        paymentMethod === 'upi'
                          ? 'border-theme-accent bg-theme-accent-light'
                          : 'border-theme-border-soft hover:border-theme-accent/50 bg-theme-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-bold ${paymentMethod === 'upi' ? 'text-theme-accent' : 'text-theme-primary'}`}>🇮🇳 UPI Transfer</p>
                          <p className="text-xs font-mono mt-1 text-theme-muted">
                            {paymentPrefs.upiId}
                          </p>
                        </div>
                        {paymentMethod === 'upi' && <Check className="w-5 h-5 text-theme-accent" />}
                      </div>
                    </button>
                  )}
                  
                  {paymentPrefs.bkashNumber && (
                    <button
                      onClick={() => setPaymentMethod('bkash')}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                        paymentMethod === 'bkash'
                          ? 'border-pink-500 bg-pink-500/10'
                          : 'border-theme-border-soft hover:border-pink-500/50 bg-theme-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-bold ${paymentMethod === 'bkash' ? 'text-pink-600 dark:text-pink-400' : 'text-theme-primary'}`}>🇧🇩 bKash Transfer</p>
                          <p className="text-xs font-mono mt-1 text-theme-muted">
                            {paymentPrefs.bkashNumber}
                          </p>
                        </div>
                        {paymentMethod === 'bkash' && <Check className="w-5 h-5 text-pink-500" />}
                      </div>
                    </button>
                  )}
                  
                  {paymentPrefs.nagadNumber && (
                    <button
                      onClick={() => setPaymentMethod('nagad')}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                        paymentMethod === 'nagad'
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-theme-border-soft hover:border-orange-500/50 bg-theme-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-bold ${paymentMethod === 'nagad' ? 'text-orange-600 dark:text-orange-400' : 'text-theme-primary'}`}>🇧🇩 Nagad Transfer</p>
                          <p className="text-xs font-mono mt-1 text-theme-muted">
                            {paymentPrefs.nagadNumber}
                          </p>
                        </div>
                        {paymentMethod === 'nagad' && <Check className="w-5 h-5 text-orange-500" />}
                      </div>
                    </button>
                  )}
                  
                   {!paymentPrefs.upiId && !paymentPrefs.bkashNumber && !paymentPrefs.nagadNumber && (
                     <button
                        onClick={() => setPaymentMethod('bank')}
                        className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                          paymentMethod === 'bank'
                            ? 'border-theme-accent bg-theme-accent-light'
                            : 'border-theme-border-soft hover:border-theme-accent/50 bg-theme-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-bold ${paymentMethod === 'bank' ? 'text-theme-accent' : 'text-theme-primary'}`}>Bank Transfer / Other</p>
                            <p className="text-xs mt-1 text-theme-muted line-clamp-1">
                              {paymentPrefs.customPaymentLink || 'Manual settlement'}
                            </p>
                          </div>
                          {paymentMethod === 'bank' && <Check className="w-5 h-5 text-theme-accent" />}
                        </div>
                      </button>
                   )}
                </div>
              </div>
              
              {/* Instructions */}
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-2">Instructions:</p>
                <ol className="text-xs font-medium text-amber-700 dark:text-amber-300 space-y-1.5 list-decimal list-inside">
                  <li>Transfer the exact amount to the selected account.</li>
                  <li>Take a screenshot of the successful transaction.</li>
                  <li>Upload the screenshot below.</li>
                </ol>
              </div>
              
              {/* Screenshot Upload */}
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-widest text-theme-muted mb-3">Upload Payment Screenshot *</p>
                
                {previewUrl ? (
                  <div className="relative group">
                    <img
                      src={previewUrl}
                      alt="Payment screenshot preview"
                      className="w-full h-48 object-cover rounded-xl border-2 border-theme-border-soft group-hover:border-theme-accent transition-colors"
                    />
                    <button
                      onClick={() => {
                        setScreenshot(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="block w-full p-8 border-2 border-dashed border-theme-border-strong hover:border-theme-accent bg-theme-surface rounded-xl cursor-pointer transition-colors group">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-theme-card flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5 text-theme-muted group-hover:text-theme-accent transition-colors" />
                      </div>
                      <p className="text-theme-primary font-bold text-sm mb-1">Click to upload screenshot</p>
                      <p className="text-xs font-medium text-theme-muted">PNG or JPG up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!screenshot || uploading}
                className="w-full py-4 bg-theme-accent text-white font-black rounded-xl shadow-lg hover:bg-theme-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Securely Submitting...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Submit Payment Proof
                  </>
                )}
              </button>
            </>
          )}
          
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;
