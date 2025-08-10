import { renderHook, act } from '@testing-library/react';
import { useEncryption } from '../useEncryption';
import encryptionManager from '../../utils/encryption';

// Mock the encryption manager
jest.mock('../../utils/encryption', () => ({
  isEncryptionSupported: jest.fn(),
  initializeChatEncryption: jest.fn(),
  getPublicKeyForSharing: jest.fn(),
  encryptMessageForSending: jest.fn(),
  decryptReceivedMessage: jest.fn(),
  clearChatEncryption: jest.fn(),
}));

describe('useEncryption', () => {
  const mockChatId = 'chat-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    encryptionManager.isEncryptionSupported.mockReturnValue(true);

    const { result } = renderHook(() => useEncryption(mockChatId, mockUserId));

    expect(result.current.isEncryptionSupported).toBe(true);
    expect(result.current.isEncryptionEnabled).toBe(false);
    expect(result.current.encryptionStatus).toBe('checking');
    expect(result.current.publicKey).toBe(null);
  });

  it('should detect when encryption is not supported', () => {
    encryptionManager.isEncryptionSupported.mockReturnValue(false);

    const { result } = renderHook(() => useEncryption(mockChatId, mockUserId));

    expect(result.current.isEncryptionSupported).toBe(false);
    expect(result.current.encryptionStatus).toBe('disabled');
  });

  it('should initialize encryption successfully', async () => {
    encryptionManager.isEncryptionSupported.mockReturnValue(true);
    encryptionManager.initializeChatEncryption.mockResolvedValue(true);
    encryptionManager.getPublicKeyForSharing.mockResolvedValue('mock-public-key');

    const { result } = renderHook(() => useEncryption(mockChatId, mockUserId));

    await act(async () => {
      const success = await result.current.initializeEncryption([]);
      expect(success).toBe(true);
    });

    expect(result.current.isEncryptionEnabled).toBe(true);
    expect(result.current.encryptionStatus).toBe('enabled');
    expect(result.current.publicKey).toBe('mock-public-key');
  });

  it('should handle encryption initialization failure', async () => {
    encryptionManager.isEncryptionSupported.mockReturnValue(true);
    encryptionManager.initializeChatEncryption.mockResolvedValue(false);

    const { result } = renderHook(() => useEncryption(mockChatId, mockUserId));

    await act(async () => {
      const success = await result.current.initializeEncryption([]);
      expect(success).toBe(false);
    });

    expect(result.current.isEncryptionEnabled).toBe(false);
    expect(result.current.encryptionStatus).toBe('error');
  });

  it('should encrypt message when encryption is enabled', async () => {
    encryptionManager.isEncryptionSupported.mockReturnValue(true);
    encryptionManager.initializeChatEncryption.mockResolvedValue(true);
    encryptionManager.getPublicKeyForSharing.mockResolvedValue('mock-public-key');
    encryptionManager.encryptMessageForSending.mockResolvedValue({
      encryptedContent: 'encrypted-content',
      iv: 'mock-iv',
      encryptedKeys: { 'user-1': 'encrypted-key' },
      isEncrypted: true,
    });

    const { result } = renderHook(() => useEncryption(mockChatId, mockUserId));

    // Enable encryption first
    await act(async () => {
      await result.current.toggleEncryption(true);
    });

    let encrypted;
    await act(async () => {
      encrypted = await result.current.encryptMessage('Hello', ['user-1']);
    });
      
    expect(encrypted.isEncrypted).toBe(true);
    expect(encrypted.content).toBe('encrypted-content');
    expect(encrypted.encryptionData).toEqual({
      iv: 'mock-iv',
      encryptedKeys: { 'user-1': 'encrypted-key' },
      isEncrypted: true,
    });
  });

  it('should return unencrypted message when encryption is disabled', async () => {
    encryptionManager.isEncryptionSupported.mockReturnValue(true);

    const { result } = renderHook(() => useEncryption(mockChatId, mockUserId));

    await act(async () => {
      const encrypted = await result.current.encryptMessage('Hello', ['user-1']);
      
      expect(encrypted.isEncrypted).toBe(false);
      expect(encrypted.content).toBe('Hello');
    });
  });

  it('should decrypt message when encryption is enabled', async () => {
    encryptionManager.isEncryptionSupported.mockReturnValue(true);
    encryptionManager.initializeChatEncryption.mockResolvedValue(true);
    encryptionManager.getPublicKeyForSharing.mockResolvedValue('mock-public-key');
    encryptionManager.decryptReceivedMessage.mockResolvedValue('Decrypted message');

    const { result } = renderHook(() => useEncryption(mockChatId, mockUserId));

    // Enable encryption first
    await act(async () => {
      await result.current.toggleEncryption(true);
    });

    const encryptedData = {
      content: 'encrypted-content',
      encryptionData: {
        iv: 'mock-iv',
        encryptedKeys: { [mockUserId]: 'encrypted-key' },
      },
      isEncrypted: true,
    };

    let decrypted;
    await act(async () => {
      decrypted = await result.current.decryptMessage(encryptedData);
    });
    
    expect(decrypted).toBe('Decrypted message');
  });

  it('should return original content for unencrypted messages', async () => {
    encryptionManager.isEncryptionSupported.mockReturnValue(true);

    const { result } = renderHook(() => useEncryption(mockChatId, mockUserId));

    const unencryptedData = {
      content: 'Plain message',
      isEncrypted: false,
    };

    await act(async () => {
      const decrypted = await result.current.decryptMessage(unencryptedData);
      expect(decrypted).toBe('Plain message');
    });
  });

  it('should handle decryption failure gracefully', async () => {
    encryptionManager.isEncryptionSupported.mockReturnValue(true);
    encryptionManager.decryptReceivedMessage.mockRejectedValue(new Error('Decryption failed'));

    const { result } = renderHook(() => useEncryption(mockChatId, mockUserId));

    // Set encryption as enabled
    act(() => {
      result.current.isEncryptionEnabled = true;
    });

    const encryptedData = {
      content: 'encrypted-content',
      encryptionData: { iv: 'mock-iv', encryptedKeys: {} },
      isEncrypted: true,
    };

    await act(async () => {
      const decrypted = await result.current.decryptMessage(encryptedData);
      expect(decrypted).toBe('[Encrypted message - decryption failed]');
    });
  });

  it('should toggle encryption on', async () => {
    encryptionManager.isEncryptionSupported.mockReturnValue(true);
    encryptionManager.initializeChatEncryption.mockResolvedValue(true);
    encryptionManager.getPublicKeyForSharing.mockResolvedValue('mock-public-key');

    const { result } = renderHook(() => useEncryption(mockChatId, mockUserId));

    let success;
    await act(async () => {
      success = await result.current.toggleEncryption(true);
    });

    expect(success).toBe(true);
    expect(result.current.isEncryptionEnabled).toBe(true);
    expect(result.current.encryptionStatus).toBe('enabled');
  });

  it('should toggle encryption off', async () => {
    encryptionManager.isEncryptionSupported.mockReturnValue(true);
    encryptionManager.initializeChatEncryption.mockResolvedValue(true);
    encryptionManager.getPublicKeyForSharing.mockResolvedValue('mock-public-key');

    const { result } = renderHook(() => useEncryption(mockChatId, mockUserId));

    // Enable encryption first
    await act(async () => {
      await result.current.toggleEncryption(true);
    });

    // Then disable it
    let success;
    await act(async () => {
      success = await result.current.toggleEncryption(false);
    });

    expect(success).toBe(true);
    expect(result.current.isEncryptionEnabled).toBe(false);
    expect(result.current.encryptionStatus).toBe('disabled');
    expect(encryptionManager.clearChatEncryption).toHaveBeenCalledWith(mockChatId);
  });

  it('should provide encryption info', () => {
    encryptionManager.isEncryptionSupported.mockReturnValue(true);

    const { result } = renderHook(() => useEncryption(mockChatId, mockUserId));

    const info = result.current.getEncryptionInfo();

    expect(info).toEqual({
      isSupported: true,
      isEnabled: false,
      status: 'checking',
      publicKey: null,
      statusText: 'Setting up encryption...',
    });
  });

  it('should clean up on unmount', async () => {
    encryptionManager.isEncryptionSupported.mockReturnValue(true);
    encryptionManager.initializeChatEncryption.mockResolvedValue(true);
    encryptionManager.getPublicKeyForSharing.mockResolvedValue('mock-public-key');

    const { result, unmount } = renderHook(() => useEncryption(mockChatId, mockUserId));

    // Enable encryption first
    await act(async () => {
      await result.current.toggleEncryption(true);
    });

    unmount();

    expect(encryptionManager.clearChatEncryption).toHaveBeenCalledWith(mockChatId);
  });
});