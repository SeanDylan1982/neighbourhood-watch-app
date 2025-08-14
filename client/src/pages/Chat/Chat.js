import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  TextField,
  IconButton,
  Divider,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  ListItemIcon,
} from "@mui/material";
import {
  Send as SendIcon,
  Group as GroupIcon,
  Refresh as RefreshIcon,
  MoreHoriz as TypingIcon,
  Add as AddIcon,
  AttachFile as AttachIcon,
} from "@mui/icons-material";
import useApi from "../../hooks/useApi";
import useChatErrorHandler from "../../hooks/useChatErrorHandler";
import useChatCache from "../../hooks/useChatCache";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import ErrorDisplay from "../../components/Common/ErrorDisplay";
import ChatErrorBoundary from "../../components/Chat/ChatErrorBoundary";
import { ChatSkeleton } from "../../components/Common/LoadingSkeleton";
import ChatWelcomeMessage from "../../components/Welcome/ChatWelcomeMessage";
import EmptyState from "../../components/Common/EmptyState";
import EmojiPicker from "../../components/Common/EmojiPicker";
// import EmojiRenderer from '../../components/Common/EmojiRenderer'; // TODO: Use when implementing emoji rendering
import GroupMessageThread from "../../components/GroupChat/GroupMessageThread";

const Chat = () => {
  const { user } = useAuth();
  const { loading, error, clearError, get, post } = useApi();
  const { handleChatLoad, handleChatError } = useChatErrorHandler();
  const { 
    isPreloading, 
    preloadChatData, 
    getCachedChatGroups, 
    getCachedMessages, 
    addMessageToCache,
    updateCachedMessages,
    hasCachedMessages,
    cacheStats,
    getDebugInfo,
    clearCache
  } = useChatCache();

  // Expose debugging functions to window for browser console testing
  useEffect(() => {
    window.chatDebug = {
      preloadChatData,
      getCachedChatGroups,
      getCachedMessages,
      clearCache,
      cacheStats,
      getDebugInfo,
      hasCachedMessages,
      // Additional debug info
      currentChatGroups: chatGroups,
      currentMessages: messages,
      selectedChat,
      isPreloading
    };
    
    console.log('🔧 Chat debugging functions available at window.chatDebug');
    console.log('Available functions:', Object.keys(window.chatDebug));
    
    return () => {
      delete window.chatDebug;
    };
  }, [preloadChatData, getCachedChatGroups, getCachedMessages, clearCache, cacheStats, getDebugInfo, hasCachedMessages, chatGroups, messages, selectedChat, isPreloading]);
  const { socket, joinGroup } = useSocket();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [chatGroups, setChatGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [failedMessages, setFailedMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [newGroupDialog, setNewGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberCache, setMemberCache] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const messagesEndRef = useRef(null);
  // const messageContainerRef = useRef(null); // TODO: Use when implementing message container scrolling
  const typingTimeoutsRef = useRef({});

  // Helper function to format time - must be declared before other functions that use it
  const formatTime = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  const fetchChatGroups = useCallback(async (useCache = true) => {
    try {
      let groups = [];
      
      // Try to get from cache first
      if (useCache) {
        const cachedGroups = getCachedChatGroups();
        if (cachedGroups && cachedGroups.length > 0) {
          console.log('📖 Using cached chat groups');
          groups = cachedGroups;
        }
      }
      
      // If no cached data or cache disabled, fetch from API
      if (groups.length === 0) {
        console.log('📥 Fetching chat groups from API');
        const data = await handleChatLoad(
          () => get("/api/chat/groups"),
          "loading chat groups"
        );
        groups = Array.isArray(data) ? data : [];
      }
      
      const formattedGroups = groups.map((group) => ({
        id: group.id || group._id,
        name: group.name,
        lastMessage: group.lastMessage?.content || "No messages yet",
        lastMessageTime: group.lastMessage?.timestamp
          ? formatTime(group.lastMessage.timestamp)
          : "",
        unreadCount: 0, // Will be calculated based on user's read status
        members: group.memberCount || group.members?.length || 0,
      }));
      
      setChatGroups(formattedGroups);
      setDataLoaded(true);
    } catch (error) {
      // Error already handled by handleChatLoad
      setChatGroups([]);
      setDataLoaded(true); // Still mark as loaded to prevent infinite loading
    }
  }, [get, handleChatLoad, formatTime, getCachedChatGroups]);

  const fetchAvailableUsers = useCallback(async () => {
    try {
      const data = await handleChatLoad(
        () => get("/api/users/neighbours"),
        "loading available users"
      );
      setAvailableUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      // Error already handled by handleChatLoad
      setAvailableUsers([]);
    }
  }, [get, handleChatLoad]);

  // Enhanced group members fetching with better error handling and validation
  const fetchGroupMembers = useCallback(
    async (groupId) => {
      if (!groupId) {
        console.log("fetchGroupMembers: No groupId provided");
        setGroupMembers([]);
        return;
      }

      // Check cache first
      if (
        memberCache[groupId] &&
        memberCache[groupId].timestamp > Date.now() - 300000
      ) {
        // 5 minutes cache
        console.log(
          "Using cached member data for groupId:",
          groupId,
          memberCache[groupId].members
        );
        setGroupMembers(memberCache[groupId].members);
        return;
      }

      setLoadingMembers(true);
      console.log("fetchGroupMembers: Starting fetch for groupId:", groupId);

      // Add a timeout to prevent stuck loading state
      const loadingTimeout = setTimeout(() => {
        console.warn(
          "fetchGroupMembers: Loading timeout for groupId:",
          groupId
        );
        setLoadingMembers(false);
      }, 10000); // Increased timeout to 10 seconds

      try {
        // Fetch actual member data from the server
        const data = await get(`/api/chat/groups/${groupId}/members`);
        
        // Validate response
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format - expected array');
        }

        // Validate and enhance member data
        const validMembers = data.filter(member => {
          const isValid = member && 
                         member._id && 
                         (member.firstName || member.lastName);
          
          if (!isValid) {
            console.warn('Invalid member data:', member);
          }
          
          return isValid;
        });

        // Enhance member data for frontend use
        const enhancedMembers = validMembers.map(member => ({
          ...member,
          id: member._id, // Ensure both _id and id are available
          fullName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown User',
          displayName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown User',
          initials: getInitials(member.firstName, member.lastName),
          hasProfileImage: !!member.profileImageUrl
        }));

        console.log("API returned valid members:", enhancedMembers.length);

        // Cache the result
        setMemberCache((prev) => ({
          ...prev,
          [groupId]: {
            members: enhancedMembers,
            timestamp: Date.now(),
          },
        }));

        setGroupMembers(enhancedMembers);
        console.log("Set members from API:", enhancedMembers);
        
      } catch (error) {
        console.error("Error fetching group members:", error);
        
        // Check if we have cached data to fall back to
        const cachedData = memberCache[groupId];
        if (cachedData && cachedData.members.length > 0) {
          console.log("Using stale cached data due to API error");
          setGroupMembers(cachedData.members);
        } else {
          // Only use mock data if no cached data is available
          console.log("No cached data available, using mock data for development");
          
          const mockMembers = [];

          // Add current user first
          if (user) {
            mockMembers.push({
              _id: user._id || user.id,
              id: user._id || user.id,
              firstName: user.firstName || "You",
              lastName: user.lastName || "",
              fullName: `${user.firstName || "You"} ${user.lastName || ""}`.trim(),
              displayName: "You",
              role: "member",
              profileImageUrl: user.profileImageUrl || null,
              initials: getInitials(user.firstName, user.lastName),
              hasProfileImage: !!user.profileImageUrl
            });
          }

          // Generate a few mock members for development
          const mockMemberData = [
            { firstName: "Alice", lastName: "Johnson", role: "admin" },
            { firstName: "Bob", lastName: "Smith", role: "member" }
          ];

          mockMemberData.forEach((memberData, index) => {
            mockMembers.push({
              _id: `mock-${groupId}-${index}`,
              id: `mock-${groupId}-${index}`,
              ...memberData,
              fullName: `${memberData.firstName} ${memberData.lastName}`,
              displayName: `${memberData.firstName} ${memberData.lastName}`,
              profileImageUrl: null,
              initials: getInitials(memberData.firstName, memberData.lastName),
              hasProfileImage: false,
              joinedAt: new Date().toISOString()
            });
          });

          setGroupMembers(mockMembers);
          console.log("Set mock members:", mockMembers);
        }
      } finally {
        clearTimeout(loadingTimeout);
        setLoadingMembers(false);
        console.log("fetchGroupMembers: Finished for groupId:", groupId);
      }
    },
    [get, memberCache, user]
  );

  // Helper function to get user initials
  const getInitials = (firstName, lastName) => {
    const first = (firstName || '').trim();
    const last = (lastName || '').trim();
    
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    } else if (first) {
      return first.charAt(0).toUpperCase();
    } else if (last) {
      return last.charAt(0).toUpperCase();
    }
    
    return '?';
  };

  // Initialize chat data when component mounts
  useEffect(() => {
    const initializeChatData = async () => {
      console.log('🚀 Initializing chat data...');
      
      // First, try to load from cache
      const cachedGroups = getCachedChatGroups();
      if (cachedGroups && cachedGroups.length > 0) {
        console.log('📖 Loading chat groups from cache');
        const formattedGroups = cachedGroups.map((group) => ({
          id: group.id || group._id,
          name: group.name,
          lastMessage: group.lastMessage?.content || "No messages yet",
          lastMessageTime: group.lastMessage?.timestamp
            ? formatTime(group.lastMessage.timestamp)
            : "",
          unreadCount: 0,
          members: group.memberCount || group.members?.length || 0,
        }));
        setChatGroups(formattedGroups);
        setDataLoaded(true);
      }
      
      // Then preload all data in background
      console.log('🔄 Starting background data preload...');
      const preloadResult = await preloadChatData({ 
        showProgress: false, 
        showToasts: false 
      });
      
      if (preloadResult.success) {
        console.log('✅ Background preload successful');
        // Refresh chat groups with latest data
        fetchChatGroups(true); // Use cache since we just updated it
      } else {
        console.log('⚠️ Background preload failed, using API fallback');
        fetchChatGroups(false); // Don't use cache, fetch from API
      }
    };

    initializeChatData();
  }, [fetchChatGroups, formatTime, getCachedChatGroups, preloadChatData]); // Only run once on mount

  // Set up socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    const handleNewMessage = (messageData) => {
      if (messageData.chatId === selectedChat) {
        const formattedMessage = {
          id: messageData._id,
          sender: messageData.senderName,
          message: messageData.content,
          time: formatTime(messageData.createdAt),
          isOwn: false,
          status: messageData.status,
        };

        setMessages((prev) => [...prev, formattedMessage]);
      }
    };

    // Listen for message status updates
    const handleMessageStatusUpdate = (data) => {
      if (data.chatId === selectedChat) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId ? { ...msg, status: data.status } : msg
          )
        );
      }
    };

    // Listen for typing indicators
    const handleUserTyping = (data) => {
      if (data.groupId === selectedChat) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: {
            name: data.userName,
            timestamp: Date.now(),
          },
        }));

        // Clear typing indicator after 3 seconds of inactivity
        if (typingTimeoutsRef.current[data.userId]) {
          clearTimeout(typingTimeoutsRef.current[data.userId]);
        }

        typingTimeoutsRef.current[data.userId] = setTimeout(() => {
          setTypingUsers((prev) => {
            const updated = { ...prev };
            delete updated[data.userId];
            return updated;
          });
        }, 3000);
      }
    };

    // Listen for typing stopped
    const handleUserStoppedTyping = (data) => {
      if (data.groupId === selectedChat) {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[data.userId];
          return updated;
        });

        if (typingTimeoutsRef.current[data.userId]) {
          clearTimeout(typingTimeoutsRef.current[data.userId]);
        }
      }
    };

    // Listen for message sent confirmation
    const handleMessageSent = (messageData) => {
      if (messageData.chatId === selectedChat) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === `temp-${messageData._id}` ||
            msg.id === `temp-${Date.now()}`
              ? {
                  id: messageData._id,
                  sender: "You",
                  message: messageData.content,
                  time: formatTime(messageData.createdAt),
                  isOwn: true,
                  status: messageData.status || "sent",
                }
              : msg
          )
        );
      }
    };

    // Listen for reaction updates
    const handleReactionUpdate = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, reactions: data.reactions }
            : msg
        )
      );
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_status_updated", handleMessageStatusUpdate);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);
    socket.on("message_sent", handleMessageSent);
    socket.on("message_reaction_updated", handleReactionUpdate);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_status_updated", handleMessageStatusUpdate);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
      socket.off("message_sent", handleMessageSent);
      socket.off("message_reaction_updated", handleReactionUpdate);

      // Clear all typing timeouts
      const currentTypingTimeouts = typingTimeoutsRef.current;
      Object.values(currentTypingTimeouts).forEach((timeout) => {
        clearTimeout(timeout);
      });

      // Clear typing timeout
      const currentTypingTimeout = typingTimeoutRef.current;
      if (currentTypingTimeout) {
        clearTimeout(currentTypingTimeout);
      }
    };
  }, [socket, selectedChat, formatTime]);

  const fetchMessages = useCallback(
    async (chatId, useCache = true) => {
      if (!chatId) return;
      
      try {
        console.log("Fetching messages for chatId:", chatId);
        setMessagesLoading(true);
        
        let messages = [];
        
        // Try cache first if enabled
        if (useCache && hasCachedMessages(chatId)) {
          console.log("📖 Using cached messages for chat:", chatId);
          const cachedMessages = getCachedMessages(chatId);
          if (cachedMessages && cachedMessages.length > 0) {
            messages = cachedMessages;
          }
        }
        
        // If no cached messages or cache disabled, fetch from API
        if (messages.length === 0) {
          console.log("📥 Fetching messages from API for chat:", chatId);
          const data = await handleChatLoad(
            () => get(`/api/chat/groups/${chatId}/messages`),
            `loading messages for chat ${chatId}`
          );

          messages = Array.isArray(data) ? data : [];
          
          // Store in cache for future use
          if (messages.length > 0) {
            updateCachedMessages(chatId, messages);
          }
        }

        console.log("Processing messages:", messages.length);

        // If no messages, show empty state
        if (messages.length === 0) {
          console.log("No messages found for chat:", chatId);
          setMessages([]);
          setMessagesLoading(false);
          return;
        }

        const formattedMessages = messages.map((msg) => {
          const isOwn =
            msg.senderId &&
            user &&
            (msg.senderId === user._id || msg.senderId === user.id);

          let senderName = "Unknown User";
          if (isOwn) {
            senderName = "You";
          } else if (msg.senderName) {
            senderName = msg.senderName;
          } else if (msg.senderId && typeof msg.senderId === "object") {
            senderName = `${msg.senderId.firstName || ""} ${
              msg.senderId.lastName || ""
            }`.trim();
          }

          return {
            id: msg.id || msg._id,
            sender: senderName,
            message: msg.content,
            content: msg.content,
            time: formatTime(msg.createdAt),
            createdAt: msg.createdAt,
            isOwn: isOwn,
            senderId: msg.senderId,
            senderName: senderName,
          };
        });

        console.log("Formatted messages:", formattedMessages);
        setMessages(formattedMessages);
        setMessagesLoading(false);
      } catch (error) {
        // Error already handled by handleChatLoad
        console.log("Failed to load messages, showing empty state");
        setMessages([]);
        setMessagesLoading(false);
      }
    },
    [formatTime, get, user, handleChatLoad, hasCachedMessages, getCachedMessages, updateCachedMessages]
  );

  // Fetch messages for selected chat
  useEffect(() => {
    if (selectedChat) {
      console.log("Selected chat changed to:", selectedChat);

      // Clear current data when switching groups to prevent showing old data
      setMessages([]); // Clear messages immediately
      setGroupMembers([]);
      setLoadingMembers(true);
      
      // Clear any typing indicators
      setTypingUsers({});
      
      // Clear any reply state
      setReplyingTo(null);

      // Fetch new data
      fetchMessages(selectedChat);

      // Fetch group members immediately
      console.log("About to call fetchGroupMembers for:", selectedChat);
      fetchGroupMembers(selectedChat);

      joinGroup(selectedChat);
    } else {
      // If no chat is selected, clear all data
      setMessages([]);
      setGroupMembers([]);
      setTypingUsers({});
      setReplyingTo(null);
    }
  }, [selectedChat, fetchMessages, fetchGroupMembers, joinGroup]);

  // Handle member list updates via socket
  useEffect(() => {
    if (!socket || !selectedChat) return;

    const handleMemberListUpdateForSelected = (data) => {
      if (data.groupId === selectedChat) {
        console.log("Member list updated for selected group:", data.groupId);

        // Clear cache for this group to force refresh
        setMemberCache((prev) => {
          const updated = { ...prev };
          delete updated[data.groupId];
          return updated;
        });

        // Refresh member list
        fetchGroupMembers(data.groupId);

        // Update chat groups list if member count changed
        if (data.memberCount !== undefined) {
          setChatGroups((prev) =>
            prev.map((group) =>
              group.id === data.groupId
                ? { ...group, members: data.memberCount }
                : group
            )
          );
        }
      }
    };

    socket.on("member_list_updated", handleMemberListUpdateForSelected);

    return () => {
      socket.off("member_list_updated", handleMemberListUpdateForSelected);
    };
  }, [socket, selectedChat, fetchGroupMembers]);

  // Scroll to bottom when messages change - must be declared before useEffect that uses it
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    if (message.trim() && selectedChat && !sendingMessage) {
      setSendingMessage(true);
      const messageContent = message.trim();
      const tempId = `temp-${Date.now()}`;

      // Optimistic UI update
      const optimisticMessage = {
        id: tempId,
        sender: "You",
        message: messageContent,
        content: messageContent,
        time: formatTime(new Date().toISOString()),
        createdAt: new Date().toISOString(),
        isOwn: true,
        status: "sending",
        replyTo: replyingTo
          ? {
              id: replyingTo.id,
              content: replyingTo.content,
              senderName: replyingTo.senderName,
            }
          : null,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setMessage("");

      // Clear reply state
      const replyToId = replyingTo?.id;
      setReplyingTo(null);

      // Emit typing stopped event
      if (socket) {
        socket.emit("typing_stop", selectedChat);
      }

      try {
        const requestBody = {
          content: messageContent,
        };

        if (replyToId) {
          requestBody.replyToId = replyToId;
        }

        const newMessage = await post(
          `/api/chat/groups/${selectedChat}/messages`,
          requestBody
        );

        const formattedMessage = {
          id: newMessage._id,
          sender: "You",
          message: newMessage.content,
          content: newMessage.content,
          time: formatTime(newMessage.createdAt),
          createdAt: newMessage.createdAt,
          isOwn: true,
          status: "sent",
          replyTo: newMessage.replyTo || null,
        };

        // Replace optimistic message with real message
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? formattedMessage : msg))
        );

        // Emit message via socket for real-time updates
        if (socket) {
          socket.emit("send_message", {
            groupId: selectedChat,
            content: messageContent,
            messageType: "text",
            replyToId: replyToId,
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);

        // Update optimistic message to show error state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: "failed" } : msg
          )
        );

        // Add to failed messages for retry
        setFailedMessages((prev) => [
          ...prev,
          {
            id: tempId,
            content: messageContent,
            chatId: selectedChat,
            replyToId: replyToId,
          },
        ]);
      } finally {
        setSendingMessage(false);
      }
    }
  };

  // Handle retry for failed messages
  // eslint-disable-next-line no-unused-vars
  const handleRetryMessage = async (failedMessageId) => {
    const failedMessage = failedMessages.find(
      (msg) => msg.id === failedMessageId
    );

    if (!failedMessage) return;

    // Update message status to sending
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === failedMessageId ? { ...msg, status: "sending" } : msg
      )
    );

    try {
      const newMessage = await post(
        `/api/chat/groups/${failedMessage.chatId}/messages`,
        {
          content: failedMessage.content,
        }
      );

      const formattedMessage = {
        id: newMessage._id,
        sender: "You",
        message: newMessage.content,
        time: formatTime(newMessage.createdAt),
        isOwn: true,
        status: "sent",
      };

      // Replace failed message with successful message
      setMessages((prev) =>
        prev.map((msg) => (msg.id === failedMessageId ? formattedMessage : msg))
      );

      // Remove from failed messages
      setFailedMessages((prev) =>
        prev.filter((msg) => msg.id !== failedMessageId)
      );

      // Emit message via socket for real-time updates
      if (socket) {
        socket.emit("send_message", {
          groupId: failedMessage.chatId,
          content: failedMessage.content,
          messageType: "text",
        });
      }
    } catch (error) {
      console.error("Error retrying message:", error);

      // Update message to show error state again
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === failedMessageId ? { ...msg, status: "failed" } : msg
        )
      );
    }
  };

  // Handle typing indicator with debouncing
  const typingTimeoutRef = useRef(null);

  const handleTyping = useCallback(() => {
    if (socket && selectedChat) {
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Emit typing start
      socket.emit("typing_start", selectedChat);

      // Set timeout to emit typing stop after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing_stop", selectedChat);
      }, 2000);
    }
  }, [socket, selectedChat]);

  // Handle user selection for new group
  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle creating new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedUsers.length === 0) return;

    try {
      const newGroup = await post("/api/chat/groups", {
        name: newGroupName.trim(),
        description: `Group chat with ${selectedUsers.length} members`,
        type: "public",
      });

      // Add selected users to the group
      for (const userId of selectedUsers) {
        try {
          await post(`/api/chat/groups/${newGroup.id}/join`, { userId });
        } catch (error) {
          console.error("Error adding user to group:", error);
        }
      }

      // Add to chat groups list
      const formattedGroup = {
        id: newGroup.id,
        name: newGroup.name,
        lastMessage: "Group created",
        lastMessageTime: formatTime(newGroup.createdAt),
        unreadCount: 0,
        members: selectedUsers.length + 1, // +1 for creator
      };

      setChatGroups((prev) => [formattedGroup, ...prev]);

      // Reset dialog state
      setNewGroupDialog(false);
      setNewGroupName("");
      setSelectedUsers([]);

      // Select the new group
      setSelectedChat(newGroup.id);
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  // Handle reply to message
  const handleReplyToMessage = (messageId) => {
    const messageToReplyTo = messages.find((msg) => msg.id === messageId);
    if (messageToReplyTo) {
      setReplyingTo({
        id: messageId,
        content: messageToReplyTo.content || messageToReplyTo.message,
        senderName: messageToReplyTo.senderName || messageToReplyTo.sender,
      });
    }
  };

  // Handle cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Handle react to message
  const handleReactToMessage = async (messageId, reactionType) => {
    try {
      // Optimistic update
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            const updatedReactions = [...(msg.reactions || [])];
            const existingReactionIndex = updatedReactions.findIndex(
              (r) => r.type === reactionType
            );

            if (existingReactionIndex > -1) {
              const reaction = updatedReactions[existingReactionIndex];
              const userIndex = reaction.users.indexOf(user._id || user.id);

              if (userIndex > -1) {
                // Remove user's reaction
                reaction.users.splice(userIndex, 1);
                reaction.count = Math.max(0, reaction.count - 1);

                // Remove reaction if no users left
                if (reaction.count === 0) {
                  updatedReactions.splice(existingReactionIndex, 1);
                }
              } else {
                // Add user's reaction
                reaction.users.push(user._id || user.id);
                reaction.count += 1;
              }
            } else {
              // Create new reaction
              updatedReactions.push({
                type: reactionType,
                count: 1,
                users: [user._id || user.id],
              });
            }

            return { ...msg, reactions: updatedReactions };
          }
          return msg;
        })
      );

      // Make API call
      await post(`/api/chat/messages/${messageId}/react`, {
        reactionType,
      });

      // Emit socket event for real-time updates
      if (socket) {
        socket.emit("react_to_message", {
          messageId,
          reactionType,
        });
      }
    } catch (error) {
      console.error("Error reacting to message:", error);

      // Revert optimistic update on error
      fetchMessages(selectedChat);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">Community Chat</Typography>
        <Tooltip title="Start New Group Chat">
          <IconButton
            color="primary"
            size="large"
            onClick={() => {
              setNewGroupDialog(true);
              fetchAvailableUsers();
            }}
            sx={{
              bgcolor: "primary.main",
              color: "white",
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <ChatErrorBoundary
          error={error}
          onRetry={fetchChatGroups}
          onDismiss={clearError}
          context="chat groups"
        />
      )}

      {loading && !dataLoaded ? (
        <ChatSkeleton />
      ) : (
        <Grid container spacing={2} sx={{ height: "calc(100vh - 200px)" }}>
          {/* Chat Groups List */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Chat Groups
                </Typography>

                {/* Welcome message for new users */}
                <ChatWelcomeMessage
                  hasGroupChats={chatGroups.length > 0}
                  hasPrivateChats={false} // This would need to be passed from parent or fetched
                />

                {chatGroups.length === 0 ? (
                  <EmptyState
                    type="groupChat"
                    onAction={() => {
                      setNewGroupDialog(true);
                      fetchAvailableUsers();
                    }}
                    showCard={false}
                  />
                ) : (
                  <List>
                    {(chatGroups || []).map((group) => (
                      <ListItem
                        key={group.id}
                        button
                        selected={selectedChat === group.id}
                        onClick={() => setSelectedChat(group.id)}
                        sx={{
                          borderRadius: 1,
                          mb: 1,
                          "&.Mui-selected": {
                            backgroundColor: "primary.light",
                            color: "primary.contrastText",
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Badge badgeContent={group.unreadCount} color="error">
                            <Avatar>
                              <GroupIcon />
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={group.name}
                          secondary={
                            <Box>
                              <Typography variant="body2" noWrap>
                                {group.lastMessage}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {group.members} members •{" "}
                                {group.lastMessageTime}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Chat Messages */}
          <Grid item xs={12} md={8}>
            <Card
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              {selectedChat ? (
                <>
                  <CardContent sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="h6">
                        {chatGroups.find((g) => g.id === selectedChat)?.name}
                      </Typography>
                      <Tooltip title="Refresh member list">
                        <IconButton
                          size="small"
                          onClick={() => {
                            // Clear cache and refresh
                            setMemberCache((prev) => {
                              const updated = { ...prev };
                              delete updated[selectedChat];
                              return updated;
                            });
                            fetchGroupMembers(selectedChat);
                          }}
                          disabled={loadingMembers}
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <Tooltip
                          title={
                            <Box sx={{ p: 1 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{ mb: 1, fontWeight: "bold" }}
                              >
                                Group Members ({groupMembers.length}):
                              </Typography>
                              {(() => {
                                console.log(
                                  "Tooltip render - selectedChat:",
                                  selectedChat,
                                  "loadingMembers:",
                                  loadingMembers,
                                  "groupMembers:",
                                  groupMembers.length,
                                  groupMembers
                                );
                                if (loadingMembers) {
                                  return (
                                    <Typography
                                      variant="body2"
                                      sx={{ fontStyle: "italic" }}
                                    >
                                      Loading member names...
                                    </Typography>
                                  );
                                } else if (groupMembers.length > 0) {
                                  return (
                                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                                      {groupMembers.map((member, index) => (
                                        <Box
                                          key={member._id || member.id}
                                          sx={{
                                            mb: index < groupMembers.length - 1 ? 0.5 : 0,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1
                                          }}
                                        >
                                          <Box
                                            sx={{
                                              width: 6,
                                              height: 6,
                                              borderRadius: '50%',
                                              bgcolor: member.role === 'admin' ? 'error.main' : 
                                                      member.role === 'moderator' ? 'warning.main' : 
                                                      'primary.main',
                                              flexShrink: 0
                                            }}
                                          />
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              fontWeight: member.role === 'admin' ? 'bold' : 'normal'
                                            }}
                                          >
                                            {member.displayName || member.fullName || 
                                             `${member.firstName || ""} ${member.lastName || ""}`.trim() || 
                                             "Unknown User"}
                                            {member.role && member.role !== 'member' && (
                                              <Typography
                                                component="span"
                                                variant="caption"
                                                sx={{
                                                  ml: 0.5,
                                                  color: member.role === 'admin' ? 'error.main' : 'warning.main',
                                                  fontWeight: 'bold'
                                                }}
                                              >
                                                ({member.role})
                                              </Typography>
                                            )}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Box>
                                  );
                                } else {
                                  return (
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontStyle: "italic",
                                        color: "text.secondary",
                                      }}
                                    >
                                      No members found
                                    </Typography>
                                  );
                                }
                              })()}
                            </Box>
                          }
                          arrow
                          placement="bottom-start"
                          componentsProps={{
                            tooltip: {
                              sx: {
                                bgcolor: "background.paper",
                                color: "text.primary",
                                border: "1px solid",
                                borderColor: "divider",
                                boxShadow: 3,
                                maxWidth: 300,
                              },
                            },
                          }}
                        >
                          <Chip
                            label={`${
                              chatGroups.find((g) => g.id === selectedChat)
                                ?.members || 0
                            } members`}
                            size="small"
                            variant="filled"
                            color="primary"
                            sx={{
                              cursor: "pointer",
                              fontWeight: "medium",
                              "&:hover": {
                                bgcolor: "primary.dark",
                                transform: "scale(1.05)",
                                transition: "all 0.2s ease-in-out",
                              },
                            }}
                          />
                        </Tooltip>
                      </Typography>
                    </Box>
                  </CardContent>

                  <GroupMessageThread
                    messages={messages}
                    loading={loading}
                    error={error}
                    groupMembers={groupMembers}
                    onReplyToMessage={handleReplyToMessage}
                    onReactToMessage={handleReactToMessage}
                  />

                  {/* Typing indicators */}
                  {Object.keys(typingUsers).length > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        p: 2,
                        borderTop: 1,
                        borderColor: "divider",
                      }}
                    >
                      <TypingIcon
                        sx={{ mr: 1, animation: "pulse 1.5s infinite" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {Object.keys(typingUsers).length === 1
                          ? `${
                              typingUsers[Object.keys(typingUsers)[0]].name
                            } is typing...`
                          : `${
                              Object.keys(typingUsers).length
                            } people are typing...`}
                      </Typography>
                    </Box>
                  )}

                  <Divider />

                  <Box
                    sx={{
                      p: 2,
                      display: "flex",
                      gap: 1,
                      alignItems: "flex-end",
                    }}
                  >
                    <EmojiPicker
                      onEmojiSelect={(emoji) => {
                        const emojiCode = `{{EMOJI:${emoji.code}}}`;
                        setMessage((prev) => prev + emojiCode);
                      }}
                      size={24}
                    />

                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (e.target.value.trim()) {
                          handleTyping();
                        }
                      }}
                      onKeyPress={(e) =>
                        e.key === "Enter" && !e.shiftKey && handleSendMessage()
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 4,
                        },
                      }}
                    />

                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="Attach file">
                        <IconButton
                          color="primary"
                          disabled={sendingMessage}
                          onClick={() => {
                            // TODO: Implement file attachment
                            console.log("Attach file clicked");
                          }}
                        >
                          <AttachIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Send message">
                        <IconButton
                          color="primary"
                          onClick={handleSendMessage}
                          disabled={!message.trim() || sendingMessage}
                        >
                          <SendIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </>
              ) : (
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    Select a chat group to start messaging
                  </Typography>
                </CardContent>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* New Group Chat Dialog */}
      <Dialog
        open={newGroupDialog}
        onClose={() => setNewGroupDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Group Chat</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            margin="normal"
            required
            placeholder="Enter group name..."
          />

          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Select Participants
          </Typography>

          <List sx={{ maxHeight: 300, overflow: "auto" }}>
            {(availableUsers || []).map((user) => (
              <ListItem
                key={user.id}
                button
                onClick={() => handleUserToggle(user.id)}
              >
                <ListItemIcon>
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleUserToggle(user.id)}
                  />
                </ListItemIcon>
                <ListItemAvatar>
                  <Avatar>
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${user.firstName} ${user.lastName}`}
                  secondary={user.email}
                />
              </ListItem>
            ))}
          </List>

          {selectedUsers.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {selectedUsers.length} participant
              {selectedUsers.length > 1 ? "s" : ""} selected
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewGroupDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            disabled={!newGroupName.trim() || selectedUsers.length === 0}
          >
            Create Group
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chat;
