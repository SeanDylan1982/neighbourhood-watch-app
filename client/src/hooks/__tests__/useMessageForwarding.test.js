import { renderHook, act, waitFor } from '@testing-library/react';
import useMessageForwarding from '../useMessageForwarding';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../constants/chat';

// Mock the API hook
const mockPost = jest.fn();
jest.mock('../useApi', () => ({
  __esModule: true,
  default: () => ({
    post: mockPost
  })
}));

// Mock contexts
const mockUser = {
  id: 'user1',
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User'
};

const mockSocket = {
  emit: jest.fn()
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser })
}));

jest.mock('../../contexts/SocketContext', () => ({
  useSocket: () => ({ socket: mockSocket })
}));

describe('useMessageForwarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderUseMessageForwarding = () => {
    return renderHook(() => useMessageForwarding());
  };

  describe('Initial State', () => {
    it('returns initial state correctly', () => {
      const { result } = renderUseMessageForwarding();
      
      expect(result.current.isForwarding).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.forwardMessage).toBe('function');
      expect(typeof result.current.forwardMultipleMessages).toBe('function');
      expect(typeof result.current.canForwardMessage).toBe('function');
      expect(typeof result.current.getForwardingMetadata).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('forwardMessage', () => {
    const mockMessage = {
      id: 'msg1',
      content: 'Test message',
      type: 'text',
      senderId: 'user2',
      senderName: 'Other User',
      chatId: 'chat1',
      chatName: 'Original Chat'
    };

    const mockTargetChats = [
      {
        id: 'chat2',
        type: 'group',
        name: 'Target Group'
      },
      {
        id: 'chat3',
        type: 'private',
        name: 'Target Private'
      }
    ];

    it('forwards message successfully to multiple chats', async () => {
      mockPost.mockResolvedValue({ id: 'new-msg-id' });
      
      const { result } = renderUseMessageForwarding();
      
      let forwardResult;
      await act(async () => {
        forwardResult = await result.current.forwardMessage(mockMessage, mockTargetChats);
      });
      
      expect(mockPost).toHaveBeenCalledTimes(2);
      expect(mockPost).toHaveBeenCalledWith('/api/chat/groups/chat2/messages', expect.objectContaining({
        content: 'Test message',
        type: 'text',
        isForwarded: true,
        forwardedFrom: expect.objectContaining({
          messageId: 'msg1',
          originalSenderId: 'user2',
          originalSenderName: 'Other User',
          originalChatId: 'chat1',
          originalChatName: 'Original Chat',
          forwardedBy: 'user1',
          forwardedByName: 'Test User'
        })
      }));
      
      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
      expect(forwardResult.success).toBe(true);
      expect(forwardResult.results).toHaveLength(2);
    });

    it('sets loading state during forwarding', async () => {
      let resolvePost;
      mockPost.mockImplementation(() => new Promise(resolve => {
        resolvePost = resolve;
      }));
      
      const { result } = renderUseMessageForwarding();
      
      act(() => {
        result.current.forwardMessage(mockMessage, [mockTargetChats[0]]);
      });
      
      expect(result.current.isForwarding).toBe(true);
      
      await act(async () => {
        resolvePost({ id: 'new-msg-id' });
      });
      
      await waitFor(() => {
        expect(result.current.isForwarding).toBe(false);
      });
    });

    it('handles forwarding errors', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderUseMessageForwarding();
      
      await act(async () => {
        try {
          await result.current.forwardMessage(mockMessage, [mockTargetChats[0]]);
        } catch (error) {
          expect(error.message).toBe('Network error');
        }
      });
      
      expect(result.current.error).toBe('Network error');
      expect(result.current.isForwarding).toBe(false);
    });

    it('handles partial failures', async () => {
      mockPost
        .mockResolvedValueOnce({ id: 'success-msg' })
        .mockRejectedValueOnce(new Error('Failed for second chat'));
      
      const { result } = renderUseMessageForwarding();
      
      await act(async () => {
        try {
          await result.current.forwardMessage(mockMessage, mockTargetChats);
        } catch (error) {
          expect(error.message).toContain('Message forwarded to 1 chat');
          expect(error.message).toContain('but failed for 1 chat');
        }
      });
    });

    it('validates required parameters', async () => {
      const { result } = renderUseMessageForwarding();
      
      await act(async () => {
        try {
          await result.current.forwardMessage(null, mockTargetChats);
        } catch (error) {
          expect(error.message).toBe('Message and target chats are required');
        }
      });
      
      await act(async () => {
        try {
          await result.current.forwardMessage(mockMessage, []);
        } catch (error) {
          expect(error.message).toBe('Message and target chats are required');
        }
      });
    });

    it('uses correct API endpoints for different chat types', async () => {
      mockPost.mockResolvedValue({ id: 'new-msg-id' });
      
      const { result } = renderUseMessageForwarding();
      
      await act(async () => {
        await result.current.forwardMessage(mockMessage, mockTargetChats);
      });
      
      expect(mockPost).toHaveBeenCalledWith('/api/chat/groups/chat2/messages', expect.any(Object));
      expect(mockPost).toHaveBeenCalledWith('/api/chat/private/chat3/messages', expect.any(Object));
    });
  });

  describe('forwardMultipleMessages', () => {
    const mockMessages = [
      {
        id: 'msg1',
        content: 'First message',
        type: 'text',
        senderId: 'user2',
        senderName: 'Other User'
      },
      {
        id: 'msg2',
        content: 'Second message',
        type: 'text',
        senderId: 'user2',
        senderName: 'Other User'
      }
    ];

    const mockTargetChat = {
      id: 'chat2',
      type: 'group',
      name: 'Target Group'
    };

    it('forwards multiple messages successfully', async () => {
      mockPost.mockResolvedValue({ id: 'new-msg-id' });
      
      const { result } = renderUseMessageForwarding();
      
      let forwardResult;
      await act(async () => {
        forwardResult = await result.current.forwardMultipleMessages(mockMessages, mockTargetChat);
      });
      
      expect(mockPost).toHaveBeenCalledTimes(2);
      expect(forwardResult.success).toBe(true);
      expect(forwardResult.message).toBe('2 messages forwarded successfully');
    });

    it('validates required parameters', async () => {
      const { result } = renderUseMessageForwarding();
      
      await act(async () => {
        try {
          await result.current.forwardMultipleMessages([], mockTargetChat);
        } catch (error) {
          expect(error.message).toBe('Messages and target chat are required');
        }
      });
    });
  });

  describe('canForwardMessage', () => {
    it('returns true for forwardable message types', () => {
      const { result } = renderUseMessageForwarding();
      
      const forwardableTypes = ['text', 'image', 'audio', 'document', 'location', 'contact'];
      
      forwardableTypes.forEach(type => {
        const message = { id: 'msg1', type, content: 'test' };
        expect(result.current.canForwardMessage(message)).toBe(true);
      });
    });

    it('returns false for non-forwardable message types', () => {
      const { result } = renderUseMessageForwarding();
      
      const message = { id: 'msg1', type: 'system', content: 'test' };
      expect(result.current.canForwardMessage(message)).toBe(false);
    });

    it('returns false for deleted messages', () => {
      const { result } = renderUseMessageForwarding();
      
      const message = { id: 'msg1', type: 'text', content: 'test', isDeleted: true };
      expect(result.current.canForwardMessage(message)).toBe(false);
    });

    it('returns false for null/undefined messages', () => {
      const { result } = renderUseMessageForwarding();
      
      expect(result.current.canForwardMessage(null)).toBe(false);
      expect(result.current.canForwardMessage(undefined)).toBe(false);
    });
  });

  describe('getForwardingMetadata', () => {
    it('returns metadata for forwarded messages', () => {
      const { result } = renderUseMessageForwarding();
      
      const forwardedMessage = {
        id: 'msg1',
        isForwarded: true,
        forwardedFrom: {
          originalSenderName: 'John Doe',
          originalChatName: 'Original Chat',
          forwardedByName: 'Jane Smith',
          forwardedAt: '2024-01-01T10:00:00Z',
          messageId: 'original-msg-id'
        }
      };
      
      const metadata = result.current.getForwardingMetadata(forwardedMessage);
      
      expect(metadata).toEqual({
        isForwarded: true,
        originalSender: 'John Doe',
        originalChatName: 'Original Chat',
        forwardedBy: 'Jane Smith',
        forwardedAt: '2024-01-01T10:00:00Z',
        originalMessageId: 'original-msg-id'
      });
    });

    it('returns null for non-forwarded messages', () => {
      const { result } = renderUseMessageForwarding();
      
      const regularMessage = { id: 'msg1', content: 'test' };
      expect(result.current.getForwardingMetadata(regularMessage)).toBe(null);
    });

    it('returns null for messages without forwarding data', () => {
      const { result } = renderUseMessageForwarding();
      
      const messageWithoutData = { id: 'msg1', isForwarded: true };
      expect(result.current.getForwardingMetadata(messageWithoutData)).toBe(null);
    });
  });

  describe('clearError', () => {
    it('clears error state', async () => {
      mockPost.mockRejectedValue(new Error('Test error'));
      
      const { result } = renderUseMessageForwarding();
      
      // Create an error
      await act(async () => {
        try {
          await result.current.forwardMessage({ id: 'msg1' }, [{ id: 'chat1', type: 'group' }]);
        } catch (error) {
          // Expected to fail
        }
      });
      
      expect(result.current.error).toBe('Test error');
      
      // Clear error
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBe(null);
    });
  });

  describe('Socket Integration', () => {
    it('emits socket events for forwarded messages', async () => {
      mockPost.mockResolvedValue({ id: 'new-msg-id' });
      
      const { result } = renderUseMessageForwarding();
      
      const mockMessage = { id: 'msg1', content: 'test', type: 'text' };
      const mockChat = { id: 'chat1', type: 'group', name: 'Test Chat' };
      
      await act(async () => {
        await result.current.forwardMessage(mockMessage, [mockChat]);
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('send_message', {
        chatId: 'chat1',
        chatType: 'group',
        message: { id: 'new-msg-id' }
      });
    });
  });
});