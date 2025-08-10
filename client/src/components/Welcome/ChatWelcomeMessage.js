import React from 'react';
import { Typography, Box } from '@mui/material';
import {
  Group as GroupIcon,
  Person as PersonIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import WelcomeMessage from '../Common/WelcomeMessage';

const ChatWelcomeMessage = ({ hasGroupChats = false, hasPrivateChats = false }) => {
  const navigate = useNavigate();

  // Don't show if user already has chats
  if (hasGroupChats && hasPrivateChats) {
    return null;
  }

  const getActions = () => {
    const actions = [];

    if (!hasGroupChats) {
      actions.push({
        label: 'Join a Group Chat',
        icon: <GroupIcon />,
        onClick: () => {
          // Scroll to group list or show available groups
          const groupList = document.querySelector('[data-testid="group-list"]');
          if (groupList) {
            groupList.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    }

    if (!hasPrivateChats) {
      actions.push({
        label: 'Start Private Chat',
        icon: <PersonIcon />,
        onClick: () => navigate('/contacts?tab=friends'),
        variant: 'contained'
      });
    }

    return actions;
  };

  const getContent = () => {
    if (!hasGroupChats && !hasPrivateChats) {
      return (
        <Box>
          <Typography variant="body2" paragraph>
            Welcome to the community chat! Here you can connect with your neighbors in two ways:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>
              <Typography variant="body2">
                <strong>Group Chats:</strong> Join community discussions about neighborhood topics, events, and announcements.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Private Messages:</strong> Have one-on-one conversations with your friends and neighbors.
              </Typography>
            </li>
          </Box>
          <Typography variant="body2">
            Get started by joining a group chat or sending a private message to a friend!
          </Typography>
        </Box>
      );
    } else if (!hasGroupChats) {
      return (
        <Box>
          <Typography variant="body2" paragraph>
            Join group chats to participate in community discussions about neighborhood topics, events, and announcements.
          </Typography>
          <Typography variant="body2">
            Browse the available groups below and click on one to join the conversation!
          </Typography>
        </Box>
      );
    } else {
      return (
        <Box>
          <Typography variant="body2" paragraph>
            Start private conversations with your friends and neighbors for more personal discussions.
          </Typography>
          <Typography variant="body2">
            Visit your contacts to find friends you can message privately.
          </Typography>
        </Box>
      );
    }
  };

  return (
    <WelcomeMessage
      type="chat"
      title="Welcome to Community Chat!"
      severity="info"
      actions={getActions()}
    >
      {getContent()}
    </WelcomeMessage>
  );
};

export default ChatWelcomeMessage;