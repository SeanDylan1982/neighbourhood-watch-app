import icons from './Icons'
import React, { useState } from 'react';
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  useTheme,
  useMediaQuery,
  Backdrop
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const FloatingActionButton = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Standard actions available from all pages
  const allActions = [
    {
      icon: <icons.NoticeBoard size={24} />,
      name: 'New Notice',
      action: () => {
        navigate('/notices');
        setOpen(false);
      }
    },
    {
      icon: <icons.Reports size={24} />,
      name: 'New Report',
      action: () => {
        navigate('/reports');
        setOpen(false);
      }
    },
    {
      icon: <icons.Chat size={24} />,
      name: 'New Chat',
      action: () => {
        navigate('/chat');
        setOpen(false);
      }
    }
  ];

  // Don't show FAB on login/register pages only
  const hiddenPaths = ['/login', '/register'];
  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }

  // Always show SpeedDial with all actions for consistency
  return (
    <>
      <Backdrop
        open={open}
        sx={{ zIndex: 999 }}
        onClick={() => setOpen(false)}
      />
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{
          position: 'fixed',
          bottom: isMobile ? 80 : 16, // Account for bottom navigation on mobile
          right: 16,
          zIndex: 1000
        }}
        icon={<SpeedDialIcon icon={<icons.Add size={24} />} openIcon={<icons.Close size={24} />} />}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        direction="up"
      >
        {allActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
            sx={{
              '& .MuiSpeedDialAction-fab': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                }
              }
            }}
          />
        ))}
      </SpeedDial>
    </>
  );
};

export default FloatingActionButton;