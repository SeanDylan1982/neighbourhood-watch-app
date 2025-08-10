import audioManager from './AudioManager.js';

class NotificationSoundService {
  constructor() {
    // Legacy compatibility - delegate to AudioManager
    this.audioManager = audioManager;
    this.enabled = true;
    this.volume = 0.7;
    
    // Load settings
    this.loadSettings();
    
    // Initialize audio manager
    this.audioManager.initialize().catch(error => {
      console.warn('⚠️ NotificationSoundService: AudioManager initialization failed:', error);
    });
  }

  async playSound(type = 'default') {
    // Map legacy sound types to new SoundTypes
    const soundTypeMap = {
      'message': 'message',
      'friendRequest': 'friendRequest', 
      'like': 'like',
      'comment': 'comment',
      'system': 'system',
      'default': 'default'
    };

    const soundType = soundTypeMap[type] || 'default';
    return await this.audioManager.playSound(soundType);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.audioManager.setEnabled(enabled);
    localStorage.setItem('notificationSoundsEnabled', enabled.toString());
  }

  isEnabled() {
    const stored = localStorage.getItem('notificationSoundsEnabled');
    return stored !== null ? stored === 'true' : this.enabled;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.audioManager.setVolume(volume);
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
    
    // Sync with AudioManager
    this.audioManager.setEnabled(this.enabled);
    this.audioManager.setVolume(this.volume);
  }

  // Test sound functionality
  async testSound(type = 'default') {
    const soundTypeMap = {
      'message': 'message',
      'friendRequest': 'friendRequest', 
      'like': 'like',
      'comment': 'comment',
      'system': 'system',
      'default': 'default'
    };

    const soundType = soundTypeMap[type] || 'default';
    return await this.audioManager.testSound(soundType);
  }
}

// Create singleton instance
const notificationSoundService = new NotificationSoundService();

// Load settings on initialization
notificationSoundService.loadSettings();

export default notificationSoundService;