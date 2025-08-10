import { EncryptionManager } from '../encryption';

// Mock Web Crypto API for testing
const mockCrypto = {
  subtle: {
    generateKey: jest.fn(),
    exportKey: jest.fn(),
    importKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
  getRandomValues: jest.fn(),
};

// Mock global crypto
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

// Mock TextEncoder/TextDecoder
global.TextEncoder = class TextEncoder {
  encode(str) {
    return new Uint8Array(str.split('').map(c => c.charCodeAt(0)));
  }
};

global.TextDecoder = class TextDecoder {
  decode(buffer) {
    return String.fromCharCode(...new Uint8Array(buffer));
  }
};

// Mock btoa/atob
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');

describe('EncryptionManager', () => {
  let encryptionManager;

  beforeEach(() => {
    encryptionManager = new EncryptionManager();
    jest.clearAllMocks();
  });

  describe('isEncryptionSupported', () => {
    it('should return true when crypto.subtle is available', () => {
      expect(encryptionManager.isEncryptionSupported()).toBe(true);
    });

    it('should return false when crypto.subtle is not available', () => {
      const originalCrypto = global.crypto;
      global.crypto = {};
      
      expect(encryptionManager.isEncryptionSupported()).toBe(false);
      
      global.crypto = originalCrypto;
    });
  });

  describe('generateKeyPair', () => {
    it('should generate RSA-OAEP key pair', async () => {
      const mockKeyPair = {
        publicKey: 'mock-public-key',
        privateKey: 'mock-private-key',
      };

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKeyPair);

      const result = await encryptionManager.generateKeyPair();

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );

      expect(result).toBe(mockKeyPair);
    });

    it('should throw error when key generation fails', async () => {
      mockCrypto.subtle.generateKey.mockRejectedValue(new Error('Generation failed'));

      await expect(encryptionManager.generateKeyPair()).rejects.toThrow('Key generation failed');
    });
  });

  describe('exportPublicKey', () => {
    it('should export public key as base64 string', async () => {
      const mockPublicKey = 'mock-public-key';
      const mockExported = new ArrayBuffer(8);
      
      mockCrypto.subtle.exportKey.mockResolvedValue(mockExported);

      const result = await encryptionManager.exportPublicKey(mockPublicKey);

      expect(mockCrypto.subtle.exportKey).toHaveBeenCalledWith('spki', mockPublicKey);
      expect(typeof result).toBe('string');
    });

    it('should throw error when export fails', async () => {
      mockCrypto.subtle.exportKey.mockRejectedValue(new Error('Export failed'));

      await expect(encryptionManager.exportPublicKey('key')).rejects.toThrow('Public key export failed');
    });
  });

  describe('importPublicKey', () => {
    it('should import public key from base64 string', async () => {
      const mockImportedKey = 'mock-imported-key';
      const publicKeyString = btoa('mock-key-data');
      
      mockCrypto.subtle.importKey.mockResolvedValue(mockImportedKey);

      const result = await encryptionManager.importPublicKey(publicKeyString);

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'spki',
        expect.any(Uint8Array),
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['encrypt']
      );

      expect(result).toBe(mockImportedKey);
    });

    it('should throw error when import fails', async () => {
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Import failed'));

      await expect(encryptionManager.importPublicKey('invalid-key')).rejects.toThrow('Public key import failed');
    });
  });

  describe('generateAESKey', () => {
    it('should generate AES-GCM key', async () => {
      const mockAESKey = 'mock-aes-key';
      
      mockCrypto.subtle.generateKey.mockResolvedValue(mockAESKey);

      const result = await encryptionManager.generateAESKey();

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );

      expect(result).toBe(mockAESKey);
    });
  });

  describe('encryptMessage', () => {
    it('should encrypt message with AES-GCM', async () => {
      const message = 'Hello, World!';
      const mockAESKey = 'mock-aes-key';
      const mockEncrypted = new ArrayBuffer(16);
      const mockIV = new Uint8Array(12);

      mockCrypto.getRandomValues.mockReturnValue(mockIV);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);

      const result = await encryptionManager.encryptMessage(message, mockAESKey);

      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          iv: mockIV,
        },
        mockAESKey,
        expect.any(Uint8Array)
      );

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(typeof result.encrypted).toBe('string');
      expect(typeof result.iv).toBe('string');
    });
  });

  describe('decryptMessage', () => {
    it('should decrypt message with AES-GCM', async () => {
      const encryptedData = btoa('encrypted-data');
      const iv = btoa('initialization-vector');
      const mockAESKey = 'mock-aes-key';
      const mockDecrypted = new TextEncoder().encode('Hello, World!');

      mockCrypto.subtle.decrypt.mockResolvedValue(mockDecrypted);

      const result = await encryptionManager.decryptMessage(encryptedData, mockAESKey, iv);

      expect(mockCrypto.subtle.decrypt).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          iv: expect.any(Uint8Array),
        },
        mockAESKey,
        expect.any(Uint8Array)
      );

      expect(result).toBe('Hello, World!');
    });
  });

  describe('initializeChatEncryption', () => {
    it('should initialize encryption for a chat', async () => {
      const chatId = 'chat-123';
      const participantPublicKeys = [
        { userId: 'user-1', publicKey: btoa('public-key-1') },
        { userId: 'user-2', publicKey: btoa('public-key-2') },
      ];

      const mockKeyPair = {
        publicKey: 'mock-public-key',
        privateKey: 'mock-private-key',
      };

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKeyPair);
      mockCrypto.subtle.importKey.mockResolvedValue('imported-key');

      const result = await encryptionManager.initializeChatEncryption(chatId, participantPublicKeys);

      expect(result).toBe(true);
      expect(encryptionManager.keyPairs.has(chatId)).toBe(true);
      expect(encryptionManager.publicKeys.has(`${chatId}-user-1`)).toBe(true);
      expect(encryptionManager.publicKeys.has(`${chatId}-user-2`)).toBe(true);
    });

    it('should return false when initialization fails', async () => {
      const chatId = 'chat-123';
      
      mockCrypto.subtle.generateKey.mockRejectedValue(new Error('Failed'));

      const result = await encryptionManager.initializeChatEncryption(chatId);

      expect(result).toBe(false);
    });
  });

  describe('clearChatEncryption', () => {
    it('should clear encryption data for a chat', async () => {
      const chatId = 'chat-123';
      
      // Set up some data
      encryptionManager.keyPairs.set(chatId, 'key-pair');
      encryptionManager.publicKeys.set(`${chatId}-user-1`, 'public-key-1');
      encryptionManager.publicKeys.set(`${chatId}-user-2`, 'public-key-2');
      encryptionManager.publicKeys.set('other-chat-user-1', 'other-key');

      encryptionManager.clearChatEncryption(chatId);

      expect(encryptionManager.keyPairs.has(chatId)).toBe(false);
      expect(encryptionManager.publicKeys.has(`${chatId}-user-1`)).toBe(false);
      expect(encryptionManager.publicKeys.has(`${chatId}-user-2`)).toBe(false);
      expect(encryptionManager.publicKeys.has('other-chat-user-1')).toBe(true);
    });
  });

  describe('encryptMessageForSending', () => {
    it('should encrypt message for multiple recipients', async () => {
      const chatId = 'chat-123';
      const message = 'Hello, World!';
      const recipientUserIds = ['user-1', 'user-2'];

      // Set up mock keys
      encryptionManager.publicKeys.set(`${chatId}-user-1`, 'public-key-1');
      encryptionManager.publicKeys.set(`${chatId}-user-2`, 'public-key-2');

      const mockAESKey = 'mock-aes-key';
      const mockEncrypted = new ArrayBuffer(16);
      const mockIV = new Uint8Array(12);

      mockCrypto.subtle.generateKey.mockResolvedValue(mockAESKey);
      mockCrypto.getRandomValues.mockReturnValue(mockIV);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);
      mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(32));

      const result = await encryptionManager.encryptMessageForSending(chatId, message, recipientUserIds);

      expect(result).toHaveProperty('encryptedContent');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('encryptedKeys');
      expect(result).toHaveProperty('isEncrypted', true);
      expect(result.encryptedKeys).toHaveProperty('user-1');
      expect(result.encryptedKeys).toHaveProperty('user-2');
    });
  });
});