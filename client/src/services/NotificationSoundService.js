class NotificationSoundService {
  constructor() {
    this.sounds = {
      message: '/sounds/message.mp3',
      friendRequest: '/sounds/friend-request.mp3',
      like: '/sounds/like.mp3',
      comment: '/sounds/comment.mp3',
      system: '/sounds/system.mp3',
      default: '/sounds/notification.mp3'
    };
    
    this.audioContext = null;
    this.audioBuffers = {};
    this.enabled = true;
    this.volume = 0.7;
    
    this.initializeAudioContext();
    this.loadSounds();
  }

  initializeAudioContext() {
    try {
      // Create audio context with user gesture handling
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Handle audio context state
      if (this.audioContext.state === 'suspended') {
        // Will be resumed on first user interaction
        document.addEventListener('click', this.resumeAudioContext.bind(this), { once: true });
        document.addEventListener('keydown', this.resumeAudioContext.bind(this), { once: true });
      }
    } catch (error) {
      console.warn('Audio context not supported:', error);
      this.audioContext = null;
    }
  }

  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('Audio context resumed');
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
      }
    }
  }

  async loadSounds() {
    if (!this.audioContext) return;

    for (const [type, url] of Object.entries(this.sounds)) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.audioBuffers[type] = audioBuffer;
        }
      } catch (error) {
        console.warn(`Failed to load sound ${type}:`, error);
        // Create a simple beep sound as fallback
        this.audioBuffers[type] = this.createBeepSound();
      }
    }
  }

  createBeepSound() {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.2; // 200ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate a simple beep tone
    for (let i = 0; i < buffer.length; i++) {
      data[i] = Math.sin(2 * Math.PI * 800 * i / sampleRate) * 0.3;
    }

    return buffer;
  }

  async playSound(type = 'default') {
    if (!this.enabled || !this.audioContext || this.audioContext.state !== 'running') {
      return;
    }

    const buffer = this.audioBuffers[type] || this.audioBuffers.default;
    if (!buffer) return;

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = this.volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('notificationSoundsEnabled', enabled.toString());
  }

  isEnabled() {
    const stored = localStorage.getItem('notificationSoundsEnabled');
    return stored !== null ? stored === 'true' : this.enabled;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('notificationSoundVolume', this.volume.toString());
  }

  getVolume() {
    const stored = localStorage.getItem('notificationSoundVolume');
    return stored !== null ? parseFloat(stored) : this.volume;
  }

  // Initialize settings from localStorage
  loadSettings() {
    this.enabled = this.isEnabled();
    this.volume = this.getVolume();
  }

  // Test sound functionality
  async testSound(type = 'default') {
    await this.resumeAudioContext();
    await this.playSound(type);
  }
}

// Create singleton instance
const notificationSoundService = new NotificationSoundService();

// Load settings on initialization
notificationSoundService.loadSettings();

export default notificationSoundService;