// src/utils/soundEngine.js
class SoundEngine {
  constructor() {
    this.context = null;
    this.isEnabled = localStorage.getItem('billqyro_sounds') !== 'false';
  }

  initContext() {
    if (!this.context) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
      } catch (e) {
        console.warn('AudioContext not supported');
      }
    }
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  toggleSound(enabled) {
    this.isEnabled = enabled;
    localStorage.setItem('billqyro_sounds', enabled);
  }

  playTone(freq, type, duration, vol = 0.1, delay = 0) {
    if (!this.isEnabled || !this.context) return;
    
    const osc = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.context.currentTime + delay);
    
    // Envelope for a smooth, premium sound
    gainNode.gain.setValueAtTime(0, this.context.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(vol, this.context.currentTime + delay + duration * 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + delay + duration);
    
    osc.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    osc.start(this.context.currentTime + delay);
    osc.stop(this.context.currentTime + delay + duration);
  }

  // A soft, pleasing pop for general success toasts
  playPop() {
    this.initContext();
    this.playTone(600, 'sine', 0.1, 0.1);
    this.playTone(800, 'sine', 0.15, 0.05, 0.05);
  }

  // A magical chord for Payment Success!
  playPaymentSuccess() {
    this.initContext();
    const now = this.context ? this.context.currentTime : 0;
    
    // C Major chord arpeggio
    this.playTone(523.25, 'sine', 0.3, 0.1, 0);       // C5
    this.playTone(659.25, 'sine', 0.4, 0.1, 0.1);     // E5
    this.playTone(783.99, 'sine', 0.5, 0.1, 0.2);     // G5
    this.playTone(1046.50, 'sine', 0.8, 0.15, 0.3);   // C6 (rings out)
    
    // Sparkle effect
    this.playTone(1567.98, 'triangle', 0.2, 0.05, 0.3); // G6
    this.playTone(2093.00, 'triangle', 0.3, 0.05, 0.4); // C7
  }

  // A low sweeping down sound for delete/trash
  playDelete() {
    this.initContext();
    if (!this.isEnabled || !this.context) return;

    const osc = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.05, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.3);
  }

  // Error buzz
  playError() {
    this.initContext();
    this.playTone(150, 'sawtooth', 0.2, 0.1, 0);
    this.playTone(150, 'sawtooth', 0.2, 0.1, 0.15);
  }
}

export const soundEngine = new SoundEngine();
