import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, RotateCcw, Check, X, Palette, Eraser } from 'lucide-react';

const PEN_COLORS = [
  { id: 'black', label: 'Black', value: '#0f172a' },
  { id: 'navy', label: 'Navy Blue', value: '#1e3a8a' },
  { id: 'emerald', label: 'Dark Green', value: '#065f46' },
];

const PEN_SIZES = [
  { id: 'thin', label: 'Fine', value: 2 },
  { id: 'medium', label: 'Regular', value: 3.5 },
  { id: 'thick', label: 'Bold', value: 5 },
];

export const SignaturePadModal = ({ isOpen, onClose, onSave, initialImage = '' }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [color, setColor] = useState(PEN_COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(PEN_SIZES[1].value);

  // Initialize canvas
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      // Set display & backing store resolution for crisp retina lines
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;

      // If initial signature image exists, draw it
      if (initialImage) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, (rect.width - img.width * 0.5) / 2, (rect.height - img.height * 0.5) / 2, img.width * 0.5, img.height * 0.5);
          setHasDrawn(true);
        };
        img.src = initialImage;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen, initialImage]);

  // Update stroke styling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
    }
  }, [color, strokeWidth]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e?.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export transparent PNG
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-theme-card border border-theme-border-soft rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-theme-primary flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border-soft">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black">Digital Signature & Stamp</h3>
                <p className="text-[11px] text-theme-muted">Draw your signature with finger or mouse</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-theme-surface text-theme-muted hover:text-theme-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas Area */}
          <div className="p-6 space-y-4">
            <div className="relative rounded-2xl border-2 border-dashed border-theme-border-soft bg-white overflow-hidden shadow-inner cursor-crosshair">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-52 block touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-400 text-xs font-semibold select-none">
                  ✍️ Sign inside this box
                </div>
              )}
              {/* Baseline hint */}
              <div className="absolute bottom-10 left-8 right-8 border-b border-gray-200 pointer-events-none opacity-60" />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Color pickers */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-theme-muted mr-1">Ink:</span>
                {PEN_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.value)}
                    style={{ backgroundColor: c.value }}
                    className={`w-6 h-6 rounded-full transition-transform ${color === c.value ? 'ring-2 ring-offset-2 ring-theme-accent scale-110' : 'opacity-80 hover:opacity-100'}`}
                    title={c.label}
                  />
                ))}
              </div>

              {/* Stroke Size */}
              <div className="flex items-center gap-1 bg-theme-surface p-1 rounded-xl border border-theme-border-soft">
                {PEN_SIZES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStrokeWidth(s.value)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${strokeWidth === s.value ? 'bg-theme-card text-theme-primary shadow-xs' : 'text-theme-muted hover:text-theme-primary'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Clear button */}
              <button
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-theme-border-soft bg-theme-surface hover:bg-theme-danger/10 text-theme-muted hover:text-theme-danger font-bold text-xs transition-colors"
              >
                <Eraser className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-theme-border-soft bg-theme-surface/40">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-theme-muted hover:text-theme-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasDrawn}
              className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[var(--bq26-emerald)] hover:bg-[var(--bq26-emerald-bright)] text-white shadow-md shadow-[rgba(11,143,120,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Check className="w-3.5 h-3.5" /> Apply Signature
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SignaturePadModal;
