import React from 'react';
import { Typography, Box } from '@mui/material';
import {
  Campaign as NoticeIcon,
  Add as AddIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import WelcomeMessage from '../Common/WelcomeMessage';

const NoticeBoardWelcomeMessage = ({ onCreateNotice }) => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Create Your First Notice',
      icon: <AddIcon />,
      onClick: onCreateNotice || (() => {
        // Trigger FAB or create notice dialog
        const fab = document.querySelector('[data-testid="create-notice-fab"]');
        if (fab) {
          fab.click();
        }
      }),
      variant: 'contained'
    },
    {
      label: 'View Guidelines',
      icon: <InfoIcon />,
      onClick: () => {
        // Show terms and conditions or guidelines
        console.log('Show notice board guidelines');
      }
    }
  ];

  return (
    <WelcomeMessage
      type="noticeBoard"
      title="Welcome to the Notice Board!"
      severity="info"
      icon={NoticeIcon}
      actions={actions}
    >
      <Box>
        <Typography variant="body2" paragraph>
          The Notice Board is your community's central hub for sharing important information, announcements, and updates with your neighbors.
        </Typography>
        
        <Typography variant="body2" paragraph>
          <strong>What you can share:</strong>
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <li>
            <Typography variant="body2">
              Community events and gatherings
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Lost and found items
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Neighborhood announcements
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Local recommendations and tips
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Items for sale or trade
            </Typography>
          </li>
        </Box>

        <Typography variant="body2" paragraph>
          <strong>Community Guidelines:</strong>
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <li>
            <Typography variant="body2">
              Keep posts relevant to the neighborhood
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Be respectful and considerate
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              No spam, advertising, or solicitation
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Include photos when helpful
            </Typography>
          </li>
        </Box>

        <Typography variant="body2">
          Ready to get started? Create your first notice to share something with the community!
        </Typography>
      </Box>
    </WelcomeMessage>
  );
};

export default NoticeBoardWelcomeMessage;