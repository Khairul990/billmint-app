/**
 * Haptic and Audio Feedback Utilities for premium experience
 */

export const triggerSuccessFeedback = () => {
  // Read settings
  let enableHaptics = true;
  let enableSounds = true;
  try {
    const settings = JSON.parse(localStorage.getItem('billqyro_settings') || '{}');
    if (settings.enableHaptics === false) enableHaptics = false;
    if (settings.enableSounds === false) enableSounds = false;
  } catch (e) {
    console.warn('Could not read settings for feedback:', e);
  }

  if (enableHaptics) {
    // Light haptic vibration (mobile only)
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 50, 30]); // light, short success pattern
      }
    } catch (err) {
      console.warn('Haptics not supported or blocked:', err);
    }
  }

  if (enableSounds) {
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
}
};

export const triggerPaymentSuccessFeedback = () => {
  let enableSounds = true;
  try {
    const settings = JSON.parse(localStorage.getItem('billqyro_settings') || '{}');
    if (settings.enableSounds === false) enableSounds = false;
  } catch (e) { console.warn(e); }

  if (enableSounds) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        
        const playTone = (freq, type, duration, startTime, vol = 0.1) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, startTime);
          
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + duration);
        };

        const now = ctx.currentTime;
        // Premium magical arpeggio for Payment Success
        playTone(523.25, 'sine', 0.4, now, 0.1);       // C5
        playTone(659.25, 'sine', 0.4, now + 0.1, 0.1); // E5
        playTone(783.99, 'sine', 0.5, now + 0.2, 0.1); // G5
        playTone(1046.50, 'sine', 0.8, now + 0.3, 0.15); // C6 (rings out)
        
        // Sparkle effect
        playTone(1567.98, 'triangle', 0.3, now + 0.35, 0.05); // G6
        playTone(2093.00, 'triangle', 0.4, now + 0.45, 0.05); // C7
      }
    } catch (err) { console.warn(err); }
  }
};

export const triggerDeleteFeedback = () => {
  let enableSounds = true;
  try {
    const settings = JSON.parse(localStorage.getItem('billqyro_settings') || '{}');
    if (settings.enableSounds === false) enableSounds = false;
  } catch (e) {}

  if (enableSounds) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
  }
};

export const triggerPopFeedback = () => {
  let enableSounds = true;
  try {
    const settings = JSON.parse(localStorage.getItem('billqyro_settings') || '{}');
    if (settings.enableSounds === false) enableSounds = false;
  } catch (e) {}

  if (enableSounds) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const playTone = (freq, type, duration, startTime, vol) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        const now = ctx.currentTime;
        playTone(600, 'sine', 0.1, now, 0.1);
        playTone(800, 'sine', 0.15, now + 0.05, 0.05);
      }
    } catch (e) {}
  }
};

export const triggerLightHaptic = () => {
  let enableHaptics = true;
  try {
    const settings = JSON.parse(localStorage.getItem('billqyro_settings') || '{}');
    if (settings.enableHaptics === false) enableHaptics = false;
  } catch (e) { console.warn('Ignored error in feedback.js:', e); }

  if (enableHaptics) {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10); // Very subtle tap
      }
    } catch (err) { console.warn('Ignored error in feedback.js:', err); }
  }
};
