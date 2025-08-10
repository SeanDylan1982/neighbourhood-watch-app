import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing offline message queue
 * Handles message queuing, retry logic, and offline/online state management
 */
export const useOfflineQueue = ({
  onSendMessage,
  maxRetries = 3,
  retryDelay = 1000,
  maxQueueSize = 100
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState([]);
  const [processing, setProcessing] = useState(false);
  const retryTimeouts = useRef(new Map());
  const queueRef = useRef([]);

  // Keep queue ref in sync
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('messageQueue');
    if (savedQueue) {
      try {
        const parsedQueue = JSON.parse(savedQueue);
        setQueue(parsedQueue);
      } catch (error) {
        console.error('Failed to load message queue:', error);
        localStorage.removeItem('messageQueue');
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    if (queue.length > 0) {
      localStorage.setItem('messageQueue', JSON.stringify(queue));
    } else {
      localStorage.removeItem('messageQueue');
    }
  }, [queue]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Generate unique ID for queued messages
  const generateTempId = useCallback(() => {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add message to queue
  const queueMessage = useCallback((messageData) => {
    if (queue.length >= maxQueueSize) {
      throw new Error('Message queue is full');
    }

    const queuedMessage = {
      id: generateTempId(),
      ...messageData,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
      status: 'queued'
    };

    setQueue(prev => [...prev, queuedMessage]);
    return queuedMessage;
  }, [queue.length, maxQueueSize, generateTempId]);

  // Remove message from queue
  const removeFromQueue = useCallback((messageId) => {
    setQueue(prev => prev.filter(msg => msg.id !== messageId));
    
    // Clear any pending retry timeout
    if (retryTimeouts.current.has(messageId)) {
      clearTimeout(retryTimeouts.current.get(messageId));
      retryTimeouts.current.delete(messageId);
    }
  }, []);

  // Update message status in queue
  const updateQueuedMessage = useCallback((messageId, updates) => {
    setQueue(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ));
  }, []);

  // Process a single message from queue
  const processMessage = useCallback(async (message) => {
    if (!onSendMessage) return false;

    try {
      updateQueuedMessage(message.id, { status: 'sending' });
      
      const result = await onSendMessage({
        chatId: message.chatId,
        content: message.content,
        type: message.type,
        attachments: message.attachments,
        replyTo: message.replyTo,
        tempId: message.id
      });

      // Message sent successfully
      removeFromQueue(message.id);
      return true;

    } catch (error) {
      console.error('Failed to send queued message:', error);
      
      const newRetryCount = message.retryCount + 1;
      
      if (newRetryCount >= maxRetries) {
        // Max retries reached, mark as failed
        updateQueuedMessage(message.id, {
          status: 'failed',
          error: error.message,
          failedAt: new Date().toISOString()
        });
        return false;
      }

      // Schedule retry
      updateQueuedMessage(message.id, {
        status: 'retry_pending',
        retryCount: newRetryCount,
        nextRetryAt: new Date(Date.now() + retryDelay * Math.pow(2, newRetryCount)).toISOString()
      });

      const timeoutId = setTimeout(() => {
        retryTimeouts.current.delete(message.id);
        processMessage(message);
      }, retryDelay * Math.pow(2, newRetryCount));

      retryTimeouts.current.set(message.id, timeoutId);
      return false;
    }
  }, [onSendMessage, maxRetries, retryDelay, updateQueuedMessage, removeFromQueue]);

  // Process entire queue
  const processQueue = useCallback(async () => {
    if (processing || !isOnline || queueRef.current.length === 0) {
      return;
    }

    setProcessing(true);

    try {
      // Process messages in order
      for (const message of queueRef.current) {
        if (message.status === 'queued' || message.status === 'retry_pending') {
          await processMessage(message);
          
          // Small delay between messages to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } finally {
      setProcessing(false);
    }
  }, [processing, isOnline, processMessage]);

  // Send message (queue if offline, send immediately if online)
  const sendMessage = useCallback(async (messageData) => {
    if (isOnline) {
      try {
        return await onSendMessage(messageData);
      } catch (error) {
        // If sending fails while online, queue the message
        const queuedMessage = queueMessage(messageData);
        throw new Error(`Message queued due to send failure: ${error.message}`);
      }
    } else {
      // Queue message for later sending
      const queuedMessage = queueMessage(messageData);
      return {
        ...queuedMessage,
        isQueued: true
      };
    }
  }, [isOnline, onSendMessage, queueMessage]);

  // Retry failed message
  const retryMessage = useCallback((messageId) => {
    const message = queue.find(msg => msg.id === messageId);
    if (message && message.status === 'failed') {
      updateQueuedMessage(messageId, {
        status: 'queued',
        retryCount: 0,
        error: null,
        failedAt: null
      });
      
      if (isOnline) {
        processQueue();
      }
    }
  }, [queue, updateQueuedMessage, isOnline, processQueue]);

  // Clear failed messages
  const clearFailedMessages = useCallback(() => {
    setQueue(prev => prev.filter(msg => msg.status !== 'failed'));
  }, []);

  // Get queue statistics
  const getQueueStats = useCallback(() => {
    const stats = queue.reduce((acc, msg) => {
      acc[msg.status] = (acc[msg.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total: queue.length,
      queued: stats.queued || 0,
      sending: stats.sending || 0,
      retryPending: stats.retry_pending || 0,
      failed: stats.failed || 0
    };
  }, [queue]);

  // Process queue when coming online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  return {
    isOnline,
    queue,
    processing,
    sendMessage,
    retryMessage,
    removeFromQueue,
    clearFailedMessages,
    getQueueStats,
    processQueue
  };
};

export default useOfflineQueue;