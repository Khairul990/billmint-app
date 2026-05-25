/**
 * Haptic and Audio Feedback Utilities for premium experience
 */

export const triggerSuccessFeedback = () => {
  // Light haptic vibration (mobile only)
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 50, 30]); // light, short success pattern
    }
  } catch (err) {
    console.warn('Haptics not supported or blocked:', err);
  }

  // Soft success sound
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      
      const playTone = (freq, type, duration, startTime) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        
        // Envelope
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // Soft, airy success chord
      playTone(523.25, 'sine', 0.3, now); // C5
      playTone(659.25, 'sine', 0.3, now + 0.1); // E5
      playTone(783.99, 'sine', 0.4, now + 0.2); // G5
    }
  } catch (err) {
    console.warn('Web Audio API not supported or blocked:', err);
  }
};
