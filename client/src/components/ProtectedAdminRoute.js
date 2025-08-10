import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Alert } from '@mui/material';

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Admin privileges required to access this page.
        </Alert>
      </Box>
    );
  }

  return children;
};

export default ProtectedAdminRoute;