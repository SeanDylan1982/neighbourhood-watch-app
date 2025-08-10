import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import {
  Chat as ChatIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Campaign as NoticeIcon,
  Report as ReportIcon
} from '@mui/icons-material';

const EmptyState = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
  icon: CustomIcon,
  showCard = true
}) => {
  const getDefaultIcon = () => {
    switch (type) {
      case 'groupChat':
        return <GroupIcon sx={{ fontSize: 64, color: 'text.secondary' }} />;
      case 'privateChat':
        return <PersonIcon sx={{ fontSize: 64, color: 'text.secondary' }} />;
      case 'messages':
        return <ChatIcon sx={{ fontSize: 64, color: 'text.secondary' }} />;
      case 'notices':
        return <NoticeIcon sx={{ fontSize: 64, color: 'text.secondary' }} />;
      case 'reports':
        return <ReportIcon sx={{ fontSize: 64, color: 'text.secondary' }} />;
      default:
        return <ChatIcon sx={{ fontSize: 64, color: 'text.secondary' }} />;
    }
  };

  const getDefaultContent = () => {
    switch (type) {
      case 'groupChat':
        return {
          title: 'No Group Chats Yet',
          description: 'Join or create a group chat to start connecting with your neighbors about community topics and events.',
          actionLabel: 'Join a Group Chat'
        };
      case 'privateChat':
        return {
          title: 'No Private Messages',
          description: 'Start a private conversation with your friends and neighbors for more personal discussions.',
          actionLabel: 'Start Private Chat'
        };
      case 'messages':
        return {
          title: 'No Messages Yet',
          description: 'This is where your conversations will appear. Start chatting to see messages here!',
          actionLabel: 'Start Chatting'
        };
      case 'notices':
        return {
          title: 'No Notices Posted',
          description: 'Be the first to share community news, events, or announcements with your neighbors.',
          actionLabel: 'Create Notice'
        };
      case 'reports':
        return {
          title: 'No Reports Filed',
          description: 'Help keep the community safe by reporting any incidents or safety concerns.',
          actionLabel: 'Create Report'
        };
      default:
        return {
          title: 'Nothing Here Yet',
          description: 'Get started by taking an action.',
          actionLabel: 'Get Started'
        };
    }
  };

  const defaultContent = getDefaultContent();
  const finalTitle = title || defaultContent.title;
  const finalDescription = description || defaultContent.description;
  const finalActionLabel = actionLabel || defaultContent.actionLabel;
  const icon = CustomIcon || getDefaultIcon();

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 6,
        px: 3
      }}
    >
      <Avatar
        sx={{
          width: 80,
          height: 80,
          bgcolor: 'background.paper',
          mb: 3,
          border: '2px solid',
          borderColor: 'divider'
        }}
      >
        {icon}
      </Avatar>

      <Typography
        variant="h6"
        color="text.secondary"
        gutterBottom
        sx={{ fontWeight: 500 }}
      >
        {finalTitle}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 400, lineHeight: 1.6 }}
      >
        {finalDescription}
      </Typography>

      {onAction && (
        <Button
          variant="contained"
          color="primary"
          onClick={onAction}
          startIcon={<AddIcon />}
          size="large"
          sx={{ borderRadius: 2 }}
        >
          {finalActionLabel}
        </Button>
      )}
    </Box>
  );

  if (showCard) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
        <CardContent sx={{ width: '100%' }}>
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
};

export default EmptyState;