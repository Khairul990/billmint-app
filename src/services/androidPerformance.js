import { Capacitor } from '@capacitor/core';

/**
 * Android-only rendering hints.
 * Keeps the existing BillQyro UI/design intact while avoiding expensive
 * browser effects on the native WebView, especially on lower-end phones.
 */
export const initAndroidPerformance = () => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const isAndroidNative = Capacitor.getPlatform() === 'android';

  if (!isAndroidNative) return;

  root.dataset.billqyroPlatform = 'android';

  const deviceMemory = Number(navigator.deviceMemory || 0);
  const hardwareConcurrency = Number(navigator.hardwareConcurrency || 0);
  const isLowEnd = (deviceMemory > 0 && deviceMemory <= 4) ||
    (hardwareConcurrency > 0 && hardwareConcurrency <= 4);

  if (isLowEnd) {
    root.dataset.billqyroLowEnd = 'true';
  }
};
