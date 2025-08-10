import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Avatar,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  Badge,
  Collapse,
  Paper,
  Button,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Phone as PhoneIcon,
  VideoCall as VideoIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Archive as ArchiveIcon,
  Block as BlockIcon,
  Report as ReportIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Star as StarIcon,
  Image as ImageIcon,
  AttachFile as FileIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { useDesktopFeatures } from '../../../hooks/useResponsive';
import { CHAT_TYPES } from '../../../constants/chat';
import { formatRelativeTime, getChatDisplayName } from '../../../utils/chatUtils';
import ChatAvatar from '../ChatList/ChatAvatar';

/**
 * Desktop sidebar for chat information and actions
 * Shows contact/group details, shared media, and chat settings
 */
const ChatSidebar = ({
  chat,
  open = false,
  onClose,
  onAction,
  width = 320,
  className = ''
}) => {
  const { features } = useDesktopFeatures();
  const [expandedSections, setExpandedSections] = useState({
    media: false,
    files: false,
    links: false,
    members: chat?.type === CHAT_TYPES.GROUP
  });
  
  // Don't render on mobile
  if (!features.sidebar) {
    return null;
  }
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const handleAction = (action, data) => {
    if (onAction) {
      onAction(action, data);
    }
  };
  
  // Get contact info for private chats
  const getContactInfo = () => {
    if (chat?.type !== CHAT_TYPES.PRIVATE) return null;
    
    return {
      name: getChatDisplayName(chat),
      phone: chat.participantPhone || 'Not available',
      email: chat.participantEmail || 'Not available',
      lastSeen: chat.lastSeen ? formatRelativeTime(chat.lastSeen) : 'Unknown',
      isOnline: chat.isOnline || false
    };
  };
  
  // Get group info
  const getGroupInfo = () => {
    if (chat?.type !== CHAT_TYPES.GROUP) return null;
    
    return {
      name: getChatDisplayName(chat),
      description: chat.description || 'No description',
      memberCount: chat.memberCount || 0,
      members: chat.members || [],
      createdAt: chat.createdAt,
      isPublic: chat.isPublic || false
    };
  };
  
  const contactInfo = getContactInfo();
  const groupInfo = getGroupInfo();
  
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      className={className}
      sx={{
        width: open ? width : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          position: 'relative',
          height: '100%',
          borderLeft: theme => `1px solid ${theme.palette.divider}`,
          backgroundColor: 'background.paper'
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: theme => `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="medium">
              {chat?.type === CHAT_TYPES.PRIVATE ? 'Contact Info' : 'Group Info'}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        
        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {/* Profile Section */}
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                contactInfo?.isOnline ? (
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: 'success.main',
                      border: '2px solid white'
                    }}
                  />
                ) : null
              }
            >
              <ChatAvatar 
                chat={chat} 
                size={80}
                showOnlineStatus={false}
              />
            </Badge>
            
            <Typography variant="h6" sx={{ mt: 2, fontWeight: 'medium' }}>
              {contactInfo?.name || groupInfo?.name}
            </Typography>
            
            {contactInfo && (
              <Typography variant="body2" color="text.secondary">
                {contactInfo.isOnline ? 'Online' : `Last seen ${contactInfo.lastSeen}`}
              </Typography>
            )}
            
            {groupInfo && (
              <Typography variant="body2" color="text.secondary">
                {groupInfo.memberCount} member{groupInfo.memberCount !== 1 ? 's' : ''}
                {groupInfo.isPublic && ' • Public Group'}
              </Typography>
            )}
          </Box>
          
          {/* Action Buttons */}
          <Box sx={{ px: 3, pb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              {contactInfo && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<PhoneIcon />}
                    onClick={() => handleAction('call')}
                    sx={{ flex: 1 }}
                  >
                    Call
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<VideoIcon />}
                    onClick={() => handleAction('video_call')}
                    sx={{ flex: 1 }}
                  >
                    Video
                  </Button>
                </>
              )}
              
              {groupInfo && (
                <Button
                  variant="outlined"
                  startIcon={<GroupIcon />}
                  onClick={() => handleAction('view_members')}
                  sx={{ flex: 1 }}
                >
                  Members
                </Button>
              )}
            </Box>
          </Box>
          
          <Divider />
          
          {/* Contact Details (Private Chat) */}
          {contactInfo && (
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Phone"
                  secondary={contactInfo.phone}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Email"
                  secondary={contactInfo.email}
                />
              </ListItem>
            </List>
          )}
          
          {/* Group Details */}
          {groupInfo && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {groupInfo.description}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Created
              </Typography>
              <Typography variant="body2">
                {groupInfo.createdAt ? formatRelativeTime(groupInfo.createdAt) : 'Unknown'}
              </Typography>
            </Box>
          )}
          
          <Divider />
          
          {/* Group Members */}
          {groupInfo && (
            <>
              <ListItemButton onClick={() => toggleSection('members')}>
                <ListItemIcon>
                  <GroupIcon />
                </ListItemIcon>
                <ListItemText primary={`Members (${groupInfo.memberCount})`} />
                {expandedSections.members ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItemButton>
              
              <Collapse in={expandedSections.members}>
                <List dense sx={{ pl: 2 }}>
                  {groupInfo.members.map((member) => (
                    <ListItem key={member.id}>
                      <ListItemIcon>
                        <Avatar src={member.avatar} sx={{ width: 32, height: 32 }}>
                          {member.name?.[0]}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={member.name}
                        secondary={member.isAdmin ? 'Admin' : 'Member'}
                      />
                      {member.isOnline && (
                        <Chip size="small" label="Online" color="success" />
                      )}
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </>
          )}
          
          {/* Shared Media */}
          <ListItemButton onClick={() => toggleSection('media')}>
            <ListItemIcon>
              <ImageIcon />
            </ListItemIcon>
            <ListItemText primary="Shared Photos & Videos" />
            {expandedSections.media ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
          
          <Collapse in={expandedSections.media}>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No shared media yet
              </Typography>
            </Box>
          </Collapse>
          
          {/* Shared Files */}
          <ListItemButton onClick={() => toggleSection('files')}>
            <ListItemIcon>
              <FileIcon />
            </ListItemIcon>
            <ListItemText primary="Shared Files" />
            {expandedSections.files ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
          
          <Collapse in={expandedSections.files}>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No shared files yet
              </Typography>
            </Box>
          </Collapse>
          
          {/* Shared Links */}
          <ListItemButton onClick={() => toggleSection('links')}>
            <ListItemIcon>
              <LinkIcon />
            </ListItemIcon>
            <ListItemText primary="Shared Links" />
            {expandedSections.links ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
          
          <Collapse in={expandedSections.links}>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No shared links yet
              </Typography>
            </Box>
          </Collapse>
          
          <Divider />
          
          {/* Chat Settings */}
          <List>
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText primary="Notifications" />
              <Switch
                checked={!chat?.isMuted}
                onChange={(e) => handleAction('toggle_mute', !e.target.checked)}
              />
            </ListItem>
            
            <ListItemButton onClick={() => handleAction('star_chat')}>
              <ListItemIcon>
                <StarIcon />
              </ListItemIcon>
              <ListItemText primary="Starred Messages" />
            </ListItemButton>
            
            <ListItemButton onClick={() => handleAction('archive_chat')}>
              <ListItemIcon>
                <ArchiveIcon />
              </ListItemIcon>
              <ListItemText primary={chat?.isArchived ? 'Unarchive Chat' : 'Archive Chat'} />
            </ListItemButton>
          </List>
          
          <Divider />
          
          {/* Danger Zone */}
          <List>
            {contactInfo && (
              <ListItemButton 
                onClick={() => handleAction('block_contact')}
                sx={{ color: 'warning.main' }}
              >
                <ListItemIcon>
                  <BlockIcon sx={{ color: 'warning.main' }} />
                </ListItemIcon>
                <ListItemText primary="Block Contact" />
              </ListItemButton>
            )}
            
            <ListItemButton 
              onClick={() => handleAction('report_chat')}
              sx={{ color: 'warning.main' }}
            >
              <ListItemIcon>
                <ReportIcon sx={{ color: 'warning.main' }} />
              </ListItemIcon>
              <ListItemText primary={`Report ${chat?.type === CHAT_TYPES.PRIVATE ? 'Contact' : 'Group'}`} />
            </ListItemButton>
            
            <ListItemButton 
              onClick={() => handleAction('delete_chat')}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteIcon sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText primary="Delete Chat" />
            </ListItemButton>
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ChatSidebar;