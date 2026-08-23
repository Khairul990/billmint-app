import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Scan, Search, AlertCircle, CheckCircle2, Package } from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';

/**
 * Barcode & QR Scanner Modal
 * Uses camera stream with fallback manual barcode typing
 */
const BarcodeScannerModal = ({ isOpen, onClose, onProductScanned, products = [], currencySymbol = '₹' }) => {
  const [manualCode, setManualCode] = useState('');
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setManualCode('');
      return;
    }

    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
        setHasCameraPermission(true);
      } else {
        setHasCameraPermission(false);
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setHasCameraPermission(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleLookup = (code) => {
    const trimmed = (code || manualCode).trim();
    if (!trimmed) return;

    const matched = products.find(p => 
      (p.barcode && p.barcode.toLowerCase() === trimmed.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase() === trimmed.toLowerCase()) ||
      (p.name && p.name.toLowerCase() === trimmed.toLowerCase())
    );

    if (matched) {
      setScannedResult(matched);
      if (onProductScanned) {
        onProductScanned(matched);
      }
    } else {
      setScannedResult({ notFound: true, query: trimmed });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-theme-card max-w-md w-full rounded-2xl shadow-2xl border border-theme-border-soft overflow-hidden flex flex-col"
      >
        <div className="p-4 bg-theme-surface border-b border-theme-border-soft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-theme-accent" />
            <h3 className="text-sm font-black text-theme-primary">Barcode & QR Scanner</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-theme-muted hover:text-theme-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Camera Viewport */}
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-white/10">
            {hasCameraPermission === false ? (
              <div className="text-center p-4">
                <Camera className="w-8 h-8 text-theme-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs text-white/80 font-bold">Camera Unavailable or Denied</p>
                <p className="text-2xs text-white/50 mt-1">Use the manual barcode search below.</p>
              </div>
            ) : (
              <>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                {/* Laser scan line overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-3/4 h-3/4 border-2 border-theme-accent/60 rounded-xl relative">
                    <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-theme-accent animate-pulse shadow-[0_0_8px_var(--accent)]" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Manual Input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="flex gap-2"
          >
            <input 
              type="text"
              placeholder="Enter SKU, Barcode, or Name..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="input-premium flex-1 text-xs"
              autoFocus
            />
            <button type="submit" className="btn-premium px-4 text-xs font-bold flex items-center gap-1">
              <Search className="w-3.5 h-3.5" /> Find
            </button>
          </form>

          {/* Scanned Result Banner */}
          {scannedResult && (
            <div className="pt-2">
              {scannedResult.notFound ? (
                <div className="p-3 rounded-xl bg-theme-danger/10 border border-theme-danger/20 flex items-center gap-2 text-theme-danger text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No product matching "{scannedResult.query}"</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-theme-success/10 border border-theme-success/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-theme-success/20 text-theme-success flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-theme-primary">{scannedResult.name}</p>
                      <p className="text-2xs text-theme-muted font-mono">
                        {formatCurrency(scannedResult.price || scannedResult.rate, currencySymbol)} • Stock: {scannedResult.stockQty || scannedResult.stock || 0}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (onProductScanned) onProductScanned(scannedResult);
                      onClose();
                    }}
                    className="btn-premium text-2xs py-1.5 px-3"
                  >
                    Select
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-3 bg-theme-surface/50 border-t border-theme-border-soft flex justify-end">
          <button onClick={onClose} className="btn-premium-outline text-xs py-1.5 px-4">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BarcodeScannerModal;
