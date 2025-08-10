import { useContext } from 'react';
import { useChat as useChatContext } from '../contexts/ChatContext';
import { useMessage } from '../contexts/MessageContext';

/**
 * Unified chat hook that combines ChatContext and MessageContext
 * Provides a single interface for all chat-related operations
 */
export const useChat = () => {
  const chatContext = useChatContext();
  const messageContext = useMessage();

  // Enhanced selectChat function that syncs both contexts
  const selectChat = (chatId) => {
    const chat = chatContext.chats.find(c => c.id === chatId);
    chatContext.selectChat(chatId);
    messageContext.updateSelectedChat(chatId, chat);
  };

  // Combine both contexts into a single interface
  return {
    // Chat state and actions from ChatContext
    chats: chatContext.chats,
    selectedChatId: chatContext.selectedChatId,
    selectedChat: chatContext.selectedChat,
    isLoadingChats: chatContext.isLoadingChats,
    typingIndicators: chatContext.typingIndicators,
    onlineUsers: chatContext.onlineUsers,
    searchQuery: chatContext.searchQuery,
    filteredChats: chatContext.filteredChats,
    
    // Chat actions
    loadChats: chatContext.loadChats,
    selectChat, // Use the enhanced selectChat function
    createGroupChat: chatContext.createGroupChat,
    createPrivateChat: chatContext.createPrivateChat,
    updateChatSettings: chatContext.updateChatSettings,
    deleteChat: chatContext.deleteChat,
    searchChats: chatContext.searchChats,
    clearSearch: chatContext.clearSearch,
    joinChat: chatContext.joinChat,
    leaveChat: chatContext.leaveChat,
    
    // Message state and actions from MessageContext
    messages: messageContext.messages,
    currentMessage: messageContext.currentMessage,
    replyingTo: messageContext.replyingTo,
    attachments: messageContext.attachments,
    selectedMessages: messageContext.selectedMessages,
    showEmojiPicker: messageContext.showEmojiPicker,
    isSendingMessage: messageContext.isSendingMessage,
    isLoadingMessages: messageContext.isLoadingMessages,
    failedMessages: messageContext.failedMessages,
    
    // Message actions
    loadMessages: messageContext.loadMessages,
    sendMessage: messageContext.sendMessage,
    editMessage: messageContext.editMessage,
    deleteMessage: messageContext.deleteMessage,
    reactToMessage: messageContext.reactToMessage,
    replyToMessage: messageContext.replyToMessage,
    cancelReply: messageContext.cancelReply,
    forwardMessage: messageContext.forwardMessage,
    updateCurrentMessage: messageContext.updateCurrentMessage,
    addAttachment: messageContext.addAttachment,
    removeAttachment: messageContext.removeAttachment,
    clearAttachments: messageContext.clearAttachments,
    selectMessage: messageContext.selectMessage,
    deselectMessage: messageContext.deselectMessage,
    clearSelection: messageContext.clearSelection,
    startTyping: messageContext.startTyping,
    stopTyping: messageContext.stopTyping,
    markMessagesAsRead: messageContext.markMessagesAsRead,
    retryFailedMessage: messageContext.retryFailedMessage,
    setShowEmojiPicker: messageContext.setShowEmojiPicker,
    
    // Combined loading state
    isLoading: chatContext.isLoading || messageContext.isLoadingMessages,
    
    // Combined error state (prioritize message errors as they're more immediate)
    error: messageContext.error || chatContext.error,
    
    // Combined error clearing
    clearError: () => {
      chatContext.clearError();
      messageContext.clearError();
    },
    
    // Utility functions
    getChatById: (chatId) => {
      return chatContext.chats.find(chat => chat.id === chatId);
    },
    
    getMessageById: (messageId) => {
      return messageContext.messages.find(msg => msg.id === messageId);
    },
    
    getUnreadCount: (chatId) => {
      const chat = chatContext.chats.find(c => c.id === chatId);
      return chat?.unreadCount || 0;
    },
    
    getTypingUsers: (chatId) => {
      return chatContext.typingIndicators[chatId] || [];
    },
    
    isUserOnline: (userId) => {
      return chatContext.onlineUsers.includes(userId);
    },
    
    // Message utilities
    isMessageFromCurrentUser: (message) => {
      // This would need access to current user from AuthContext
      // For now, we'll check if senderName is 'You' or use a more robust check
      return message.senderName === 'You';
    },
    
    getMessageReactionCount: (messageId, reactionType) => {
      const message = messageContext.messages.find(msg => msg.id === messageId);
      const reaction = message?.reactions.find(r => r.type === reactionType);
      return reaction?.count || 0;
    },
    
    hasUserReacted: (messageId, reactionType, userId) => {
      const message = messageContext.messages.find(msg => msg.id === messageId);
      const reaction = message?.reactions.find(r => r.type === reactionType);
      return reaction?.users.includes(userId) || false;
    },
    
    // Chat type helpers
    isGroupChat: (chatId) => {
      const chat = chatContext.chats.find(c => c.id === chatId);
      return chat?.type === 'group';
    },
    
    isPrivateChat: (chatId) => {
      const chat = chatContext.chats.find(c => c.id === chatId);
      return chat?.type === 'private';
    },
    
    // Message status helpers
    getMessageStatus: (messageId) => {
      const message = messageContext.messages.find(msg => msg.id === messageId);
      return message?.status || 'unknown';
    },
    
    isMessageFailed: (messageId) => {
      return messageContext.failedMessages.some(msg => msg.id === messageId);
    },
    
    // Attachment helpers
    hasAttachments: () => {
      return messageContext.attachments.length > 0;
    },
    
    getAttachmentCount: () => {
      return messageContext.attachments.length;
    },
    
    // Selection helpers
    hasSelectedMessages: () => {
      return messageContext.selectedMessages.length > 0;
    },
    
    getSelectedMessageCount: () => {
      return messageContext.selectedMessages.length;
    },
    
    isMessageSelected: (messageId) => {
      return messageContext.selectedMessages.includes(messageId);
    }
  };
};

export default useChat;