/**
 * Chat Cache Service - Manages localStorage caching for chat data
 * Provides persistent storage and retrieval of chat groups and messages
 */

class ChatCacheService {
  static CACHE_KEYS = {
    CHAT_GROUPS: 'neibrly_chat_groups',
    CHAT_MESSAGES: 'neibrly_chat_messages',
    CACHE_METADATA: 'neibrly_chat_cache_meta',
    USER_DATA: 'neibrly_user_data'
  };

  static CACHE_VERSION = '1.0.0';
  static CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

  /**
   * Initialize cache metadata
   */
  static initializeCache() {
    const metadata = {
      version: this.CACHE_VERSION,
      lastUpdated: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000)).toISOString()
    };
    
    localStorage.setItem(this.CACHE_KEYS.CACHE_METADATA, JSON.stringify(metadata));
    console.log('📦 Chat cache initialized');
  }

  /**
   * Check if cache is valid and not expired
   */
  static isCacheValid() {
    try {
      const metadata = localStorage.getItem(this.CACHE_KEYS.CACHE_METADATA);
      if (!metadata) return false;

      const meta = JSON.parse(metadata);
      const now = new Date();
      const expiresAt = new Date(meta.expiresAt);

      return now < expiresAt && meta.version === this.CACHE_VERSION;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  }

  /**
   * Store chat groups in localStorage
   */
  static storeChatGroups(chatGroups) {
    try {
      const cacheData = {
        data: chatGroups,
        timestamp: new Date().toISOString(),
        count: chatGroups.length
      };

      localStorage.setItem(this.CACHE_KEYS.CHAT_GROUPS, JSON.stringify(cacheData));
      console.log(`💾 Stored ${chatGroups.length} chat groups in cache`);
      
      this.updateCacheMetadata();
      return true;
    } catch (error) {
      console.error('Error storing chat groups:', error);
      return false;
    }
  }

  /**
   * Retrieve chat groups from localStorage
   */
  static getChatGroups() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEYS.CHAT_GROUPS);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      console.log(`📖 Retrieved ${cacheData.count} chat groups from cache`);
      
      return cacheData.data;
    } catch (error) {
      console.error('Error retrieving chat groups:', error);
      return null;
    }
  }

  /**
   * Store messages for a specific chat
   */
  static storeChatMessages(chatId, messages) {
    try {
      const allMessages = this.getAllChatMessages() || {};
      
      allMessages[chatId] = {
        data: messages,
        timestamp: new Date().toISOString(),
        count: messages.length,
        chatId: chatId
      };

      localStorage.setItem(this.CACHE_KEYS.CHAT_MESSAGES, JSON.stringify(allMessages));
      console.log(`💾 Stored ${messages.length} messages for chat ${chatId}`);
      
      this.updateCacheMetadata();
      return true;
    } catch (error) {
      console.error('Error storing chat messages:', error);
      return false;
    }
  }

  /**
   * Retrieve messages for a specific chat
   */
  static getChatMessages(chatId) {
    try {
      const allMessages = this.getAllChatMessages();
      if (!allMessages || !allMessages[chatId]) return null;

      const chatMessages = allMessages[chatId];
      console.log(`📖 Retrieved ${chatMessages.count} messages for chat ${chatId}`);
      
      return chatMessages.data;
    } catch (error) {
      console.error('Error retrieving chat messages:', error);
      return null;
    }
  }

  /**
   * Get all cached messages (internal helper)
   */
  static getAllChatMessages() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEYS.CHAT_MESSAGES);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('Error retrieving all chat messages:', error);
      return {};
    }
  }

  /**
   * Add a new message to existing cache
   */
  static addMessageToCache(chatId, newMessage) {
    try {
      const existingMessages = this.getChatMessages(chatId) || [];
      
      // Check if message already exists (prevent duplicates)
      const messageExists = existingMessages.some(msg => msg.id === newMessage.id);
      if (messageExists) {
        console.log(`Message ${newMessage.id} already exists in cache`);
        return false;
      }

      // Add new message to the end
      const updatedMessages = [...existingMessages, newMessage];
      
      return this.storeChatMessages(chatId, updatedMessages);
    } catch (error) {
      console.error('Error adding message to cache:', error);
      return false;
    }
  }

  /**
   * Update cache metadata
   */
  static updateCacheMetadata() {
    const metadata = {
      version: this.CACHE_VERSION,
      lastUpdated: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000)).toISOString()
    };
    
    localStorage.setItem(this.CACHE_KEYS.CACHE_METADATA, JSON.stringify(metadata));
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    try {
      const metadata = localStorage.getItem(this.CACHE_KEYS.CACHE_METADATA);
      const chatGroups = localStorage.getItem(this.CACHE_KEYS.CHAT_GROUPS);
      const chatMessages = localStorage.getItem(this.CACHE_KEYS.CHAT_MESSAGES);

      const meta = metadata ? JSON.parse(metadata) : null;
      const groups = chatGroups ? JSON.parse(chatGroups) : null;
      const messages = chatMessages ? JSON.parse(chatMessages) : null;

      const totalMessages = messages ? 
        Object.values(messages).reduce((total, chat) => total + chat.count, 0) : 0;

      return {
        isValid: this.isCacheValid(),
        lastUpdated: meta?.lastUpdated,
        expiresAt: meta?.expiresAt,
        chatGroupsCount: groups?.count || 0,
        totalChatsWithMessages: messages ? Object.keys(messages).length : 0,
        totalMessagesCount: totalMessages,
        cacheSize: this.calculateCacheSize()
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * Calculate approximate cache size in KB
   */
  static calculateCacheSize() {
    try {
      let totalSize = 0;
      
      Object.values(this.CACHE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += new Blob([item]).size;
        }
      });

      return Math.round(totalSize / 1024); // Convert to KB
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  /**
   * Clear all chat cache
   */
  static clearCache() {
    try {
      Object.values(this.CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log('🗑️ Chat cache cleared');
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Preload all chat data for offline access
   */
  static async preloadAllChatData(apiService) {
    console.log('🚀 Starting chat data preload...');
    
    try {
      // Step 1: Load chat groups
      console.log('📥 Loading chat groups...');
      const chatGroups = await apiService.get('/api/chat/groups');
      
      if (!Array.isArray(chatGroups)) {
        throw new Error('Invalid chat groups data received');
      }

      this.storeChatGroups(chatGroups);

      // Step 2: Load messages for each chat group
      console.log(`📥 Loading messages for ${chatGroups.length} chat groups...`);
      const messagePromises = chatGroups.map(async (group) => {
        try {
          const messages = await apiService.get(`/api/chat/groups/${group.id}/messages`);
          const messagesArray = Array.isArray(messages) ? messages : [];
          
          this.storeChatMessages(group.id, messagesArray);
          return { chatId: group.id, count: messagesArray.length, success: true };
        } catch (error) {
          console.error(`Failed to load messages for chat ${group.id}:`, error);
          return { chatId: group.id, count: 0, success: false, error: error.message };
        }
      });

      const results = await Promise.allSettled(messagePromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      console.log(`✅ Chat data preload complete: ${successful} successful, ${failed} failed`);
      
      return {
        success: true,
        chatGroupsLoaded: chatGroups.length,
        messagesLoaded: successful,
        messagesFailed: failed,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
      };

    } catch (error) {
      console.error('❌ Chat data preload failed:', error);
      return {
        success: false,
        error: error.message,
        chatGroupsLoaded: 0,
        messagesLoaded: 0
      };
    }
  }

  /**
   * Get cached data summary for debugging
   */
  static getDebugInfo() {
    const stats = this.getCacheStats();
    const chatGroups = this.getChatGroups();
    const allMessages = this.getAllChatMessages();

    return {
      cacheStats: stats,
      chatGroups: chatGroups ? {
        count: chatGroups.length,
        groups: chatGroups.map(g => ({ id: g.id, name: g.name, messageCount: g.messageCount }))
      } : null,
      messagesCache: allMessages ? Object.keys(allMessages).map(chatId => ({
        chatId,
        messageCount: allMessages[chatId].count,
        lastUpdated: allMessages[chatId].timestamp
      })) : null
    };
  }
}

export default ChatCacheService;