import { renderHook, act } from '@testing-library/react';
import useMessageStatus from '../useMessageStatus';

// Mock the socket context
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
};

jest.mock('../../contexts/SocketContext', () => ({
  useSocket: () => ({ socket: mockSocket })
}));

describe('useMessageStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should initialize with empty message statuses', () => {
      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      expect(result.current.messageStatuses).toEqual({});
    });

    it('should update message status', () => {
      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      act(() => {
        result.current.updateMessageStatus('msg1', 'delivered', []);
      });

      expect(result.current.messageStatuses['msg1']).toEqual({
        status: 'delivered',
        readBy: [],
        updatedAt: expect.any(Date)
      });
    });

    it('should get message status', () => {
      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      // Should return default status for non-existent message
      const defaultStatus = result.current.getMessageStatus('nonexistent');
      expect(defaultStatus).toEqual({ status: 'sent', readBy: [] });

      // Should return actual status for existing message
      act(() => {
        result.current.updateMessageStatus('msg1', 'read', ['user1']);
      });

      const actualStatus = result.current.getMessageStatus('msg1');
      expect(actualStatus.status).toBe('read');
      expect(actualStatus.readBy).toEqual(['user1']);
    });
  });

  describe('Mark Messages as Read', () => {
    it('should mark single message as read', () => {
      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      act(() => {
        result.current.markMessageAsRead('msg1');
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('update_message_status', {
        messageId: 'msg1',
        status: 'read'
      });

      expect(result.current.messageStatuses['msg1']).toEqual({
        status: 'read',
        readBy: [],
        updatedAt: expect.any(Date)
      });
    });

    it('should mark multiple messages as read for group chat', () => {
      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      const messageIds = ['msg1', 'msg2', 'msg3'];

      act(() => {
        result.current.markMessagesAsRead(messageIds);
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('mark_messages_read', {
        chatId: 'chat123',
        messageIds
      });

      messageIds.forEach(messageId => {
        expect(result.current.messageStatuses[messageId]).toEqual({
          status: 'read',
          readBy: [],
          updatedAt: expect.any(Date)
        });
      });
    });

    it('should mark multiple messages as read for private chat', () => {
      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'private')
      );

      const messageIds = ['msg1', 'msg2'];

      act(() => {
        result.current.markMessagesAsRead(messageIds);
      });

      // Should emit individual status updates for private chat
      messageIds.forEach(messageId => {
        expect(mockSocket.emit).toHaveBeenCalledWith('update_message_status', {
          messageId,
          status: 'read'
        });
      });
    });

    it('should not emit when socket or chatId is missing', () => {
      const { result } = renderHook(() => 
        useMessageStatus(null, 'group')
      );

      act(() => {
        result.current.markMessageAsRead('msg1');
      });

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('Socket Event Listeners', () => {
    it('should listen for group chat events', () => {
      renderHook(() => useMessageStatus('chat123', 'group'));

      expect(mockSocket.on).toHaveBeenCalledWith('message_status_updated', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('message_read', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('message_delivered', expect.any(Function));
    });

    it('should listen for private chat events', () => {
      renderHook(() => useMessageStatus('chat123', 'private'));

      expect(mockSocket.on).toHaveBeenCalledWith('message_status_updated', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('private_message_read', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('private_message_delivered', expect.any(Function));
    });

    it('should handle message status update events', () => {
      let statusUpdateHandler;
      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'message_status_updated') {
          statusUpdateHandler = handler;
        }
      });

      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      // Simulate receiving status update event
      act(() => {
        statusUpdateHandler({
          messageId: 'msg1',
          status: 'delivered',
          readBy: [],
          chatId: 'chat123'
        });
      });

      expect(result.current.messageStatuses['msg1']).toEqual({
        status: 'delivered',
        readBy: [],
        updatedAt: expect.any(Date)
      });
    });

    it('should ignore events from other chats', () => {
      let statusUpdateHandler;
      mockSocket.on.mockImplementation((event, handler) => {
        if (event === 'message_status_updated') {
          statusUpdateHandler = handler;
        }
      });

      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      // Simulate receiving status update event from different chat
      act(() => {
        statusUpdateHandler({
          messageId: 'msg1',
          status: 'delivered',
          readBy: [],
          chatId: 'different-chat'
        });
      });

      // Should not update status for different chat
      expect(result.current.messageStatuses['msg1']).toBeUndefined();
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith('message_status_updated', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('message_read', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('message_delivered', expect.any(Function));
    });
  });

  describe('Bulk Operations', () => {
    it('should update multiple message statuses at once', () => {
      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      const statuses = {
        'msg1': { status: 'delivered', readBy: [], updatedAt: new Date() },
        'msg2': { status: 'read', readBy: ['user1'], updatedAt: new Date() }
      };

      act(() => {
        result.current.updateMessageStatuses(statuses);
      });

      expect(result.current.messageStatuses).toEqual(statuses);
    });

    it('should clear all message statuses', () => {
      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      // Add some statuses first
      act(() => {
        result.current.updateMessageStatus('msg1', 'delivered');
        result.current.updateMessageStatus('msg2', 'read');
      });

      expect(Object.keys(result.current.messageStatuses)).toHaveLength(2);

      // Clear all statuses
      act(() => {
        result.current.clearMessageStatuses();
      });

      expect(result.current.messageStatuses).toEqual({});
    });
  });

  describe('Read Status Summary', () => {
    it('should get read status summary', () => {
      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      // Add a read message
      act(() => {
        result.current.updateMessageStatus('msg1', 'read', ['user1', 'user2']);
      });

      const summary = result.current.getReadStatusSummary('msg1');
      expect(summary).toEqual({
        isRead: true,
        readCount: 2,
        readBy: ['user1', 'user2'],
        status: 'read'
      });
    });

    it('should get read status summary for non-existent message', () => {
      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      const summary = result.current.getReadStatusSummary('nonexistent');
      expect(summary).toEqual({
        isRead: false,
        readCount: 0,
        readBy: [],
        status: 'sent'
      });
    });
  });

  describe('Visibility-based Read Marking', () => {
    it('should mark message as read when visible', () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      let cleanup;
      act(() => {
        cleanup = result.current.markAsReadWhenVisible('msg1', true);
      });

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('update_message_status', {
        messageId: 'msg1',
        status: 'read'
      });

      // Cleanup
      if (cleanup) cleanup();
      jest.useRealTimers();
    });

    it('should not mark message as read when not visible', () => {
      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      act(() => {
        result.current.markAsReadWhenVisible('msg1', false);
      });

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing socket gracefully', () => {
      // Mock useSocket to return null socket
      const originalMock = require('../../contexts/SocketContext');
      originalMock.useSocket = jest.fn(() => ({ socket: null }));

      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      // Should not throw errors
      expect(() => {
        act(() => {
          result.current.markMessageAsRead('msg1');
          result.current.markMessagesAsRead(['msg1', 'msg2']);
        });
      }).not.toThrow();

      expect(result.current.messageStatuses).toEqual({});
    });

    it('should handle empty message IDs array', () => {
      const { result } = renderHook(() => 
        useMessageStatus('chat123', 'group')
      );

      act(() => {
        result.current.markMessagesAsRead([]);
      });

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });
});