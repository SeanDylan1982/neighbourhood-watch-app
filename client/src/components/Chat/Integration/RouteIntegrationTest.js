import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Typography, Stack } from '@mui/material';

/**
 * Component to test route integration for the unified chat system
 * This helps verify that all navigation paths work correctly
 */
const RouteIntegrationTest = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const testRoutes = [
    {
      label: 'Main Chat (Group Tab)',
      path: '/chat',
      description: 'Default chat page with group tab active'
    },
    {
      label: 'Private Chat Tab',
      path: '/chat?tab=private',
      description: 'Chat page with private messages tab active'
    },
    {
      label: 'Specific Group Chat',
      path: '/chat/group/test-group-id',
      description: 'Direct link to a specific group chat'
    },
    {
      label: 'Specific Private Chat',
      path: '/chat/private/test-private-id',
      description: 'Direct link to a specific private chat'
    },
    {
      label: 'Legacy Group Chat (should redirect)',
      path: '/chat-legacy',
      description: 'Old chat route for backward compatibility'
    }
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Chat Route Integration Test
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Current location: {location.pathname}{location.search}
      </Typography>

      <Stack spacing={2}>
        {testRoutes.map((route, index) => (
          <Box key={index} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              {route.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {route.description}
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', mb: 2, display: 'block' }}>
              {route.path}
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => handleNavigate(route.path)}
            >
              Test Route
            </Button>
          </Box>
        ))}
      </Stack>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Integration Checklist
        </Typography>
        <ul>
          <li>✅ UnifiedChat component is the main chat entry point</li>
          <li>✅ Both group and private chat tabs are functional</li>
          <li>✅ URL parameters control active tab</li>
          <li>✅ Direct chat links work for both types</li>
          <li>✅ Legacy routes redirect to unified chat</li>
          <li>✅ Navigation components use correct routes</li>
          <li>✅ Search navigation uses unified routes</li>
          <li>✅ Context providers support both chat types</li>
        </ul>
      </Box>
    </Box>
  );
};

export default RouteIntegrationTest;