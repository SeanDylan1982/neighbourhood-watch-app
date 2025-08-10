import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import FloatingActionButton from '../Common/FloatingActionButton';
import OfflineOperationManager from '../Common/OfflineOperationManager';
import { useAuth } from '../../contexts/AuthContext';

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Default to expanded
  const { user } = useAuth();

  // Load user preference for sidebar state
  useEffect(() => {
    const loadSidebarPreference = async () => {
      try {
        if (user) {
          // Use the same base URL pattern as other components
          const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
          const response = await fetch(`${baseURL}/api/settings/interface`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.sidebarExpanded !== undefined) {
              setSidebarCollapsed(!data.sidebarExpanded);
            }
          } else {
            console.error('Failed to load sidebar preference:', response.status, response.statusText);
          }
        }
      } catch (error) {
        console.error('Error loading sidebar preference:', error);
      }
    };

    loadSidebarPreference();
  }, [user]);

  const handleSidebarCollapseToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar 
        isSidebarCollapsed={sidebarCollapsed}
        onSidebarCollapseToggle={handleSidebarCollapseToggle}
      />
      
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {!isMobile && (
          <Sidebar 
            open={true} 
            onClose={() => {}} 
            collapsed={sidebarCollapsed}
            onToggleCollapse={handleSidebarCollapseToggle}
          />
        )}
        
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            p: isMobile ? 1 : 3,
            pb: isMobile ? 8 : 3, // Extra padding for bottom nav on mobile
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {isMobile && <BottomNavigation />}
      <FloatingActionButton />
      <OfflineOperationManager onProcessQueue={() => {
        // This will be handled by individual components using useDataSync
        console.log('Processing offline queue from Layout');
        return Promise.resolve();
      }} />
    </Box>
  );
};

export default Layout;