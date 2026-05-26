import { useCallback } from 'react';

/**
 * usePremiumUX - Custom hook for providing Haptic Feedback and Audio sounds.
 * Helps create a native app-like experience on supported mobile devices.
 */
export const usePremiumUX = () => {

  // Play a soft "success" cash-register / ding sound
  const playSuccessSound = useCallback(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('billqyro_settings') || '{}');
      if (settings.enableSounds === false) return;

      // Create a short satisfying beep using Web Audio API so we don't need external mp3s
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime); // High pitch
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  }, []);

  const vibrateSuccess = useCallback(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('billqyro_settings') || '{}');
      if (settings.enableHaptics === false) return;

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        // Two quick, sharp vibrations
        navigator.vibrate([50, 50, 50]);
      }
    } catch (e) { /* ignore */ }
  }, []);

  const vibrateError = useCallback(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('billqyro_settings') || '{}');
      if (settings.enableHaptics === false) return;

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        // One long, heavy vibration
        navigator.vibrate(200);
      }
    } catch (e) { /* ignore */ }
  }, []);

  const triggerSuccess = useCallback(() => {
    playSuccessSound();
    vibrateSuccess();
  }, [playSuccessSound, vibrateSuccess]);

  return {
    triggerSuccess,
    vibrateSuccess,
    vibrateError,
    playSuccessSound
  };
};
