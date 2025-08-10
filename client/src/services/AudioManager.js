/**
 * AudioManager - Robust audio handling system with comprehensive error handling
 * Replaces NotificationSoundService with better fallback mechanisms
 */

const AudioErrorTypes = {
  ENCODING_ERROR: 'audio_encoding_error',
  LOAD_FAILED: 'audio_load_failed',
  CONTEXT_FAILED: 'audio_context_failed',
  UNSUPPORTED: 'audio_unsupported',
  NETWORK_ERROR: 'audio_network_error'
};

const SoundTypes = {
  MESSAGE: 'message',
  FRIEND_REQUEST: 'friendRequest',
  LIKE: 'like',
  COMMENT: 'comment',
  SYSTEM: 'system',
  DEFAULT: 'default'
};

class AudioManager {
  constructor() {
    this.sounds = {
      [SoundTypes.MESSAGE]: ['/sounds/message.mp3', '/sounds/message.ogg', '/sounds/message.wav'],
      [SoundTypes.FRIEND_REQUEST]: ['/sounds/friend-request.mp3', '/sounds/friend-request.ogg'],
      [SoundTypes.LIKE]: ['/sounds/like.mp3', '/sounds/like.ogg'],
      [SoundTypes.COMMENT]: ['/sounds/comment.mp3', '/sounds/comment.ogg'],
      [SoundTypes.SYSTEM]: ['/sounds/system.mp3', '/sounds/system.ogg'],
      [SoundTypes.DEFAULT]: ['/sounds/notification.mp3', '/sounds/notification.ogg']
    };
    
    this.audioContext = null;
    this.audioBuffers = new Map();
    this.htmlAudioElements = new Map();
    this.fallbackSounds = new Map();
    
    this.enabled = true;
    this.volume = 0.7;
    this.useWebAudio = true;
    this.maxRetries = 2;
    
    this.isInitialized = false;
    this.initializationPromise = null;
    
    this.loadSettings();
  }

  /**
   * Initialize the audio system
   */
  async initialize() {
    if (this.isInitialized) return true;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  async _performInitialization() {
    console.log('🔊 AudioManager: Initializing...');

    try {
      // Try to initialize Web Audio API
      await this.initializeAudioContext();
      
      // Load all sound files
      await this.loadAllSounds();
      
      this.isInitialized = true;
      console.log('✅ AudioManager: Initialization complete');
      return true;
      
    } catch (error) {
      console.error('❌ AudioManager: Initialization failed:', error);
      
      // Fall back to HTML5 Audio
      console.log('🔄 AudioManager: Falling back to HTML5 Audio...');
      this.useWebAudio = false;
      
      try {
        await this.initializeHtmlAudio();
        this.isInitialized = true;
        console.log('✅ AudioManager: HTML5 Audio fallback successful');
        return true;
      } catch (fallbackError) {
        console.error('❌ AudioManager: HTML5 Audio fallback failed:', fallbackError);
        
        // Generate synthetic sounds as last resort
        this.generateFallbackSounds();
        this.isInitialized = true;
        console.log('⚠️ AudioManager: Using synthetic sounds');
        return true;
      }
    }
  }

  /**
   * Initialize Web Audio API context
   */
  async initializeAudioContext() {
    if (this.audioContext) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        throw new Error('Web Audio API not supported');
      }

      this.audioContext = new AudioContext();
      
      // Handle audio context state
      if (this.audioContext.state === 'suspended') {
        // Set up user interaction listeners to resume context
        this.setupAudioContextResume();
      }
      
      console.log('🎵 AudioManager: Web Audio Context initialized');
      
    } catch (error) {
      console.error('❌ AudioManager: Web Audio Context initialization failed:', error);
      throw new Error(AudioErrorTypes.CONTEXT_FAILED);
    }
  }

  /**
   * Set up audio context resume on user interaction
   */
  setupAudioContextResume() {
    const resumeAudio = async () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
          console.log('🎵 AudioManager: Audio context resumed');
        } catch (error) {
          console.warn('⚠️ AudioManager: Failed to resume audio context:', error);
        }
      }
    };

    // Listen for user interactions
    const events = ['click', 'keydown', 'touchstart'];
    const cleanup = () => {
      events.forEach(event => {
        document.removeEventListener(event, resumeAudio);
      });
    };

    events.forEach(event => {
      document.addEventListener(event, () => {
        resumeAudio();
        cleanup();
      }, { once: true });
    });
  }

  /**
   * Load all sound files
   */
  async loadAllSounds() {
    const loadPromises = Object.entries(this.sounds).map(([type, urls]) => 
      this.loadSound(type, urls)
    );

    const results = await Promise.allSettled(loadPromises);
    
    // Log results
    results.forEach((result, index) => {
      const soundType = Object.keys(this.sounds)[index];
      if (result.status === 'fulfilled') {
        console.log(`✅ AudioManager: Loaded sound ${soundType}`);
      } else {
        console.warn(`⚠️ AudioManager: Failed to load sound ${soundType}:`, result.reason);
      }
    });
  }

  /**
   * Load a specific sound with multiple format fallbacks
   */
  async loadSound(soundType, urls) {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      
      try {
        if (this.useWebAudio && this.audioContext) {
          const buffer = await this.loadAudioBuffer(url);
          this.audioBuffers.set(soundType, buffer);
          return buffer;
        } else {
          const audio = await this.loadHtmlAudio(url);
          this.htmlAudioElements.set(soundType, audio);
          return audio;
        }
      } catch (error) {
        console.warn(`⚠️ AudioManager: Failed to load ${url}:`, error);
        
        // Try next format
        if (i < urls.length - 1) {
          continue;
        }
        
        // All formats failed, create fallback
        console.log(`🔄 AudioManager: Creating fallback sound for ${soundType}`);
        const fallback = this.createFallbackSound(soundType);
        this.fallbackSounds.set(soundType, fallback);
        return fallback;
      }
    }
  }

  /**
   * Load audio buffer for Web Audio API
   */
  async loadAudioBuffer(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
      
    } catch (error) {
      if (error.name === 'EncodingError') {
        throw new Error(AudioErrorTypes.ENCODING_ERROR);
      } else if (error.message.includes('HTTP')) {
        throw new Error(AudioErrorTypes.NETWORK_ERROR);
      } else {
        throw new Error(AudioErrorTypes.LOAD_FAILED);
      }
    }
  }

  /**
   * Load HTML5 Audio element
   */
  async loadHtmlAudio(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = this.volume;

      audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
      audio.addEventListener('error', (e) => {
        const error = audio.error;
        if (error) {
          if (error.code === MediaError.MEDIA_ERR_DECODE) {
            reject(new Error(AudioErrorTypes.ENCODING_ERROR));
          } else if (error.code === MediaError.MEDIA_ERR_NETWORK) {
            reject(new Error(AudioErrorTypes.NETWORK_ERROR));
          } else {
            reject(new Error(AudioErrorTypes.LOAD_FAILED));
          }
        } else {
          reject(new Error(AudioErrorTypes.LOAD_FAILED));
        }
      }, { once: true });

      audio.src = url;
      audio.load();
    });
  }

  /**
   * Initialize HTML5 Audio as fallback
   */
  async initializeHtmlAudio() {
    console.log('🔄 AudioManager: Initializing HTML5 Audio fallback...');
    
    const loadPromises = Object.entries(this.sounds).map(([type, urls]) => 
      this.loadSound(type, urls)
    );

    await Promise.allSettled(loadPromises);
  }

  /**
   * Create synthetic fallback sounds
   */
  generateFallbackSounds() {
    console.log('🎛️ AudioManager: Generating synthetic fallback sounds...');
    
    Object.keys(this.sounds).forEach(soundType => {
      const fallback = this.createFallbackSound(soundType);
      this.fallbackSounds.set(soundType, fallback);
    });
  }

  /**
   * Create a synthetic sound for a specific type
   */
  createFallbackSound(soundType) {
    // Different frequencies for different sound types
    const frequencies = {
      [SoundTypes.MESSAGE]: 800,
      [SoundTypes.FRIEND_REQUEST]: 600,
      [SoundTypes.LIKE]: 1000,
      [SoundTypes.COMMENT]: 700,
      [SoundTypes.SYSTEM]: 500,
      [SoundTypes.DEFAULT]: 750
    };

    const frequency = frequencies[soundType] || 750;
    
    return {
      type: 'synthetic',
      frequency,
      duration: 0.2,
      soundType
    };
  }

  /**
   * Play a sound
   */
  async playSound(soundType = SoundTypes.DEFAULT) {
    if (!this.enabled) return false;

    try {
      // Ensure initialization
      await this.initialize();

      // Try Web Audio API first
      if (this.useWebAudio && this.audioBuffers.has(soundType)) {
        return this.playWebAudioSound(soundType);
      }
      
      // Try HTML5 Audio
      if (this.htmlAudioElements.has(soundType)) {
        return this.playHtmlAudioSound(soundType);
      }
      
      // Use fallback synthetic sound
      if (this.fallbackSounds.has(soundType)) {
        return this.playSyntheticSound(soundType);
      }

      console.warn(`⚠️ AudioManager: No sound available for type ${soundType}`);
      return false;

    } catch (error) {
      console.error(`❌ AudioManager: Failed to play sound ${soundType}:`, error);
      return false;
    }
  }

  /**
   * Play sound using Web Audio API
   */
  playWebAudioSound(soundType) {
    try {
      const buffer = this.audioBuffers.get(soundType);
      if (!buffer || !this.audioContext) return false;

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = this.volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
      return true;
      
    } catch (error) {
      console.error('❌ AudioManager: Web Audio playback failed:', error);
      return false;
    }
  }

  /**
   * Play sound using HTML5 Audio
   */
  async playHtmlAudioSound(soundType) {
    try {
      const audio = this.htmlAudioElements.get(soundType);
      if (!audio) return false;

      audio.currentTime = 0;
      audio.volume = this.volume;
      
      await audio.play();
      return true;
      
    } catch (error) {
      console.error('❌ AudioManager: HTML5 Audio playback failed:', error);
      return false;
    }
  }

  /**
   * Play synthetic sound
   */
  playSyntheticSound(soundType) {
    try {
      const fallback = this.fallbackSounds.get(soundType);
      if (!fallback) return false;

      // Create a simple beep using Web Audio API or oscillator
      if (this.audioContext) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.frequency.value = fallback.frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + fallback.duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + fallback.duration);
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ AudioManager: Synthetic sound playback failed:', error);
      return false;
    }
  }

  /**
   * Test sound functionality
   */
  async testSound(soundType = SoundTypes.DEFAULT) {
    console.log(`🧪 AudioManager: Testing sound ${soundType}...`);
    const result = await this.playSound(soundType);
    console.log(`🧪 AudioManager: Test result for ${soundType}:`, result);
    return result;
  }

  /**
   * Settings management
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('audioManagerEnabled', enabled.toString());
  }

  isEnabled() {
    const stored = localStorage.getItem('audioManagerEnabled');
    return stored !== null ? stored === 'true' : this.enabled;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('audioManagerVolume', this.volume.toString());
    
    // Update HTML audio elements
    this.htmlAudioElements.forEach(audio => {
      audio.volume = this.volume;
    });
  }

  getVolume() {
    const stored = localStorage.getItem('audioManagerVolume');
    return stored !== null ? parseFloat(stored) : this.volume;
  }

  loadSettings() {
    this.enabled = this.isEnabled();
    this.volume = this.getVolume();
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      enabled: this.enabled,
      volume: this.volume,
      useWebAudio: this.useWebAudio,
      audioContextState: this.audioContext?.state,
      loadedSounds: {
        webAudio: Array.from(this.audioBuffers.keys()),
        htmlAudio: Array.from(this.htmlAudioElements.keys()),
        fallback: Array.from(this.fallbackSounds.keys())
      }
    };
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(errorType) {
    const messages = {
      [AudioErrorTypes.ENCODING_ERROR]: 'Audio files could not be decoded. Using fallback sounds.',
      [AudioErrorTypes.LOAD_FAILED]: 'Failed to load audio files. Using fallback sounds.',
      [AudioErrorTypes.CONTEXT_FAILED]: 'Audio system initialization failed. Using basic audio.',
      [AudioErrorTypes.UNSUPPORTED]: 'Audio not supported in this browser.',
      [AudioErrorTypes.NETWORK_ERROR]: 'Network error loading audio files. Using fallback sounds.'
    };

    return messages[errorType] || 'An unknown audio error occurred.';
  }
}

// Create singleton instance
const audioManager = new AudioManager();

export default audioManager;
export { AudioErrorTypes, SoundTypes };