/**
 * AudioManager Tests
 * Comprehensive test suite for audio handling with various failure scenarios
 */

import audioManager, { AudioErrorTypes, SoundTypes } from '../AudioManager';

// Mock Web Audio API
const mockAudioContext = {
  state: 'running',
  currentTime: 0,
  destination: {},
  resume: jest.fn(),
  createBufferSource: jest.fn(),
  createGain: jest.fn(),
  createOscillator: jest.fn(),
  decodeAudioData: jest.fn()
};

const mockBufferSource = {
  buffer: null,
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn()
};

const mockGainNode = {
  gain: {
    value: 0.7,
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn()
  },
  connect: jest.fn()
};

const mockOscillator = {
  frequency: { value: 440 },
  type: 'sine',
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn()
};

// Mock HTML5 Audio
const mockAudio = {
  preload: 'auto',
  volume: 0.7,
  currentTime: 0,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  load: jest.fn(),
  play: jest.fn(),
  error: null,
  src: ''
};

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock AudioContext
global.AudioContext = jest.fn(() => mockAudioContext);
global.webkitAudioContext = jest.fn(() => mockAudioContext);

// Mock Audio constructor
global.Audio = jest.fn(() => mockAudio);

// Mock MediaError
global.MediaError = {
  MEDIA_ERR_DECODE: 3,
  MEDIA_ERR_NETWORK: 2,
  MEDIA_ERR_SRC_NOT_SUPPORTED: 4
};

describe('AudioManager', () => {
  let manager;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockAudioContext.createBufferSource.mockReturnValue(mockBufferSource);
    mockAudioContext.createGain.mockReturnValue(mockGainNode);
    mockAudioContext.createOscillator.mockReturnValue(mockOscillator);
    mockAudioContext.decodeAudioData.mockResolvedValue({});
    mockAudioContext.resume.mockResolvedValue();
    
    mockAudio.play.mockResolvedValue();
    mockAudio.addEventListener.mockImplementation((event, callback) => {
      if (event === 'canplaythrough') {
        setTimeout(callback, 0);
      }
    });

    global.fetch.mockResolvedValue({
      ok: true,
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
    });

    localStorageMock.getItem.mockReturnValue(null);

    // Use the singleton instance
    manager = audioManager;

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize successfully with Web Audio API', async () => {
      const result = await manager.initialize();

      expect(result).toBe(true);
      expect(manager.isInitialized).toBe(true);
      expect(manager.useWebAudio).toBe(true);
      expect(AudioContext).toHaveBeenCalled();
    });

    test('should fall back to HTML5 Audio when Web Audio fails', async () => {
      // Mock Web Audio failure
      global.AudioContext = undefined;
      global.webkitAudioContext = undefined;

      manager = new AudioManager();
      const result = await manager.initialize();

      expect(result).toBe(true);
      expect(manager.isInitialized).toBe(true);
      expect(manager.useWebAudio).toBe(false);
    });

    test('should use synthetic sounds when all audio fails', async () => {
      // Mock all audio failures
      global.AudioContext = undefined;
      global.webkitAudioContext = undefined;
      mockAudio.addEventListener.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback({ target: { error: { code: MediaError.MEDIA_ERR_DECODE } } }), 0);
        }
      });

      manager = new AudioManager();
      const result = await manager.initialize();

      expect(result).toBe(true);
      expect(manager.isInitialized).toBe(true);
      expect(manager.fallbackSounds.size).toBeGreaterThan(0);
    });

    test('should handle suspended audio context', async () => {
      mockAudioContext.state = 'suspended';
      
      const result = await manager.initialize();

      expect(result).toBe(true);
      // Should set up resume listeners
      expect(document.addEventListener).toHaveBeenCalled();
    });

    test('should only initialize once', async () => {
      await manager.initialize();
      await manager.initialize();

      expect(AudioContext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sound Loading', () => {
    test('should load Web Audio buffer successfully', async () => {
      const mockBuffer = { duration: 1.0 };
      mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

      const buffer = await manager.loadAudioBuffer('/test.mp3');

      expect(buffer).toBe(mockBuffer);
      expect(global.fetch).toHaveBeenCalledWith('/test.mp3');
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
    });

    test('should handle encoding errors', async () => {
      mockAudioContext.decodeAudioData.mockRejectedValue(new DOMException('EncodingError', 'EncodingError'));

      await expect(manager.loadAudioBuffer('/test.mp3')).rejects.toThrow(AudioErrorTypes.ENCODING_ERROR);
    });

    test('should handle network errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(manager.loadAudioBuffer('/test.mp3')).rejects.toThrow(AudioErrorTypes.NETWORK_ERROR);
    });

    test('should load HTML5 Audio successfully', async () => {
      const audio = await manager.loadHtmlAudio('/test.mp3');

      expect(audio).toBe(mockAudio);
      expect(mockAudio.src).toBe('/test.mp3');
      expect(mockAudio.load).toHaveBeenCalled();
    });

    test('should handle HTML5 Audio decode errors', async () => {
      mockAudio.addEventListener.mockImplementation((event, callback) => {
        if (event === 'error') {
          mockAudio.error = { code: MediaError.MEDIA_ERR_DECODE };
          setTimeout(callback, 0);
        }
      });

      await expect(manager.loadHtmlAudio('/test.mp3')).rejects.toThrow(AudioErrorTypes.ENCODING_ERROR);
    });

    test('should handle HTML5 Audio network errors', async () => {
      mockAudio.addEventListener.mockImplementation((event, callback) => {
        if (event === 'error') {
          mockAudio.error = { code: MediaError.MEDIA_ERR_NETWORK };
          setTimeout(callback, 0);
        }
      });

      await expect(manager.loadHtmlAudio('/test.mp3')).rejects.toThrow(AudioErrorTypes.NETWORK_ERROR);
    });

    test('should try multiple formats and fall back to synthetic', async () => {
      // Mock all formats failing
      global.fetch.mockRejectedValue(new Error('Network error'));
      mockAudio.addEventListener.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(callback, 0);
        }
      });

      await manager.loadSound(SoundTypes.MESSAGE, ['/test.mp3', '/test.ogg']);

      expect(manager.fallbackSounds.has(SoundTypes.MESSAGE)).toBe(true);
    });
  });

  describe('Sound Playback', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    test('should play Web Audio sound successfully', async () => {
      const mockBuffer = { duration: 1.0 };
      manager.audioBuffers.set(SoundTypes.MESSAGE, mockBuffer);

      const result = await manager.playSound(SoundTypes.MESSAGE);

      expect(result).toBe(true);
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
      expect(mockBufferSource.start).toHaveBeenCalled();
    });

    test('should play HTML5 Audio sound successfully', async () => {
      manager.useWebAudio = false;
      manager.htmlAudioElements.set(SoundTypes.MESSAGE, mockAudio);

      const result = await manager.playSound(SoundTypes.MESSAGE);

      expect(result).toBe(true);
      expect(mockAudio.play).toHaveBeenCalled();
      expect(mockAudio.currentTime).toBe(0);
    });

    test('should play synthetic sound successfully', async () => {
      manager.fallbackSounds.set(SoundTypes.MESSAGE, {
        type: 'synthetic',
        frequency: 800,
        duration: 0.2
      });

      const result = await manager.playSound(SoundTypes.MESSAGE);

      expect(result).toBe(true);
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    test('should handle Web Audio playback failures', async () => {
      manager.audioBuffers.set(SoundTypes.MESSAGE, {});
      mockBufferSource.start.mockImplementation(() => {
        throw new Error('Playback failed');
      });

      const result = await manager.playSound(SoundTypes.MESSAGE);

      expect(result).toBe(false);
    });

    test('should handle HTML5 Audio playback failures', async () => {
      manager.useWebAudio = false;
      manager.htmlAudioElements.set(SoundTypes.MESSAGE, mockAudio);
      mockAudio.play.mockRejectedValue(new Error('Playback failed'));

      const result = await manager.playSound(SoundTypes.MESSAGE);

      expect(result).toBe(false);
    });

    test('should not play when disabled', async () => {
      manager.enabled = false;

      const result = await manager.playSound(SoundTypes.MESSAGE);

      expect(result).toBe(false);
      expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
    });

    test('should use default sound type when none specified', async () => {
      manager.fallbackSounds.set(SoundTypes.DEFAULT, {
        type: 'synthetic',
        frequency: 750,
        duration: 0.2
      });

      const result = await manager.playSound();

      expect(result).toBe(true);
      expect(mockOscillator.frequency.value).toBe(750);
    });
  });

  describe('Fallback Sound Generation', () => {
    test('should create synthetic sounds for all sound types', () => {
      manager.generateFallbackSounds();

      Object.values(SoundTypes).forEach(soundType => {
        expect(manager.fallbackSounds.has(soundType)).toBe(true);
        const fallback = manager.fallbackSounds.get(soundType);
        expect(fallback.type).toBe('synthetic');
        expect(typeof fallback.frequency).toBe('number');
        expect(typeof fallback.duration).toBe('number');
      });
    });

    test('should create different frequencies for different sound types', () => {
      const fallback1 = manager.createFallbackSound(SoundTypes.MESSAGE);
      const fallback2 = manager.createFallbackSound(SoundTypes.LIKE);

      expect(fallback1.frequency).not.toBe(fallback2.frequency);
    });
  });

  describe('Settings Management', () => {
    test('should save and load enabled setting', () => {
      manager.setEnabled(false);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('audioManagerEnabled', 'false');
      expect(manager.enabled).toBe(false);
    });

    test('should save and load volume setting', () => {
      manager.setVolume(0.5);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('audioManagerVolume', '0.5');
      expect(manager.volume).toBe(0.5);
    });

    test('should clamp volume to valid range', () => {
      manager.setVolume(1.5);
      expect(manager.volume).toBe(1);

      manager.setVolume(-0.5);
      expect(manager.volume).toBe(0);
    });

    test('should load settings from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'audioManagerEnabled') return 'false';
        if (key === 'audioManagerVolume') return '0.3';
        return null;
      });

      const newManager = new AudioManager();

      expect(newManager.enabled).toBe(false);
      expect(newManager.volume).toBe(0.3);
    });
  });

  describe('Status and Testing', () => {
    test('should return comprehensive status', async () => {
      await manager.initialize();
      manager.audioBuffers.set(SoundTypes.MESSAGE, {});
      manager.htmlAudioElements.set(SoundTypes.LIKE, mockAudio);
      manager.fallbackSounds.set(SoundTypes.COMMENT, {});

      const status = manager.getStatus();

      expect(status.isInitialized).toBe(true);
      expect(status.enabled).toBe(true);
      expect(status.volume).toBe(0.7);
      expect(status.useWebAudio).toBe(true);
      expect(status.audioContextState).toBe('running');
      expect(status.loadedSounds.webAudio).toContain(SoundTypes.MESSAGE);
      expect(status.loadedSounds.htmlAudio).toContain(SoundTypes.LIKE);
      expect(status.loadedSounds.fallback).toContain(SoundTypes.COMMENT);
    });

    test('should test sound functionality', async () => {
      await manager.initialize();
      manager.fallbackSounds.set(SoundTypes.MESSAGE, {
        type: 'synthetic',
        frequency: 800,
        duration: 0.2
      });

      const result = await manager.testSound(SoundTypes.MESSAGE);

      expect(result).toBe(true);
    });

    test('should provide user-friendly error messages', () => {
      const errorTypes = [
        AudioErrorTypes.ENCODING_ERROR,
        AudioErrorTypes.LOAD_FAILED,
        AudioErrorTypes.CONTEXT_FAILED,
        AudioErrorTypes.UNSUPPORTED,
        AudioErrorTypes.NETWORK_ERROR
      ];

      errorTypes.forEach(errorType => {
        const message = manager.getErrorMessage(errorType);
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing sound types gracefully', async () => {
      await manager.initialize();

      const result = await manager.playSound('nonexistent');

      expect(result).toBe(false);
    });

    test('should handle audio context creation failure', async () => {
      global.AudioContext = jest.fn(() => {
        throw new Error('AudioContext creation failed');
      });
      global.webkitAudioContext = undefined;

      manager = new AudioManager();
      
      // Should fall back to HTML5 Audio
      const result = await manager.initialize();
      expect(result).toBe(true);
      expect(manager.useWebAudio).toBe(false);
    });

    test('should handle fetch failures gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('Fetch failed'));

      await expect(manager.loadAudioBuffer('/test.mp3')).rejects.toThrow();
    });

    test('should handle malformed audio data', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0))
      });
      mockAudioContext.decodeAudioData.mockRejectedValue(new Error('Invalid audio data'));

      await expect(manager.loadAudioBuffer('/test.mp3')).rejects.toThrow(AudioErrorTypes.LOAD_FAILED);
    });

    test('should handle oscillator creation failure', async () => {
      await manager.initialize();
      mockAudioContext.createOscillator.mockImplementation(() => {
        throw new Error('Oscillator creation failed');
      });

      manager.fallbackSounds.set(SoundTypes.MESSAGE, {
        type: 'synthetic',
        frequency: 800,
        duration: 0.2
      });

      const result = await manager.playSound(SoundTypes.MESSAGE);

      expect(result).toBe(false);
    });

    test('should handle audio context without destination', async () => {
      mockAudioContext.destination = null;
      
      const result = await manager.initialize();
      
      // Should still initialize but may have limited functionality
      expect(result).toBe(true);
    });
  });
});