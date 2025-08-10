import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import DatabaseErrorIndicator from './DatabaseErrorIndicator';
import DatabaseOfflineIndicator from './DatabaseOfflineIndicator';
import useDatabaseErrorHandler from '../../hooks/useDatabaseErrorHandler';

/**
 * Demo component to showcase the enhanced database error handling capabilities.
 * This component allows testing different error scenarios and recovery mechanisms.
 */
const DatabaseErrorDemo = () => {
  const [errorType, setErrorType] = useState('connection');
  const [errorSeverity, setErrorSeverity] = useState('medium');
  const [customMessage, setCustomMessage] = useState('');
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);
  
  const {
    dbError,
    isRetrying,
    isDbOffline,
    offlineSince,
    retryConnection,
    handleDatabaseError
  } = useDatabaseErrorHandler({
    onOfflineStatusChange: (isOffline) => {
      setShowOfflineIndicator(isOffline);
    }
  });

  // Create a simulated database error
  const simulateError = () => {
    const error = new Error(customMessage || `Simulated ${errorType} error`);
    
    // Add classification information
    error.classification = {
      category: errorType,
      severity: errorSeverity,
      type: errorSeverity === 'critical' ? 'fatal' : 
            errorSeverity === 'high' ? 'persistent' : 'transient',
      retryable: ['low', 'medium'].includes(errorSeverity),
      userFriendlyMessage: customMessage || `A database ${errorType} error occurred.`,
      timestamp: new Date().toISOString()
    };
    
    // Handle the error
    handleDatabaseError(error, 'Demo error simulation');
    
    // Set offline indicator for connection errors
    if (errorType === 'connection') {
      setShowOfflineIndicator(true);
    }
  };

  // Clear all errors
  const clearAllErrors = () => {
    setShowOfflineIndicator(false);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Database Error Handling Demo
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        This demo showcases the enhanced database error handling capabilities.
        You can simulate different types of database errors and see how they are presented to users.
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Error Type</InputLabel>
            <Select
              value={errorType}
              label="Error Type"
              onChange={(e) => setErrorType(e.target.value)}
            >
              <MenuItem value="connection">Connection Error</MenuItem>
              <MenuItem value="query">Query Error</MenuItem>
              <MenuItem value="transaction">Transaction Error</MenuItem>
              <MenuItem value="validation">Validation Error</MenuItem>
              <MenuItem value="authentication">Authentication Error</MenuItem>
              <MenuItem value="authorization">Authorization Error</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Error Severity</InputLabel>
            <Select
              value={errorSeverity}
              label="Error Severity"
              onChange={(e) => setErrorSeverity(e.target.value)}
            >
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            label="Custom Message (optional)"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={simulateError}
        >
          Simulate Error
        </Button>
        
        <Button 
          variant="outlined"
          onClick={clearAllErrors}
        >
          Clear All
        </Button>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        Error Display:
      </Typography>
      
      {dbError ? (
        <DatabaseErrorIndicator
          error={dbError}
          onRetry={retryConnection}
          onDismiss={clearAllErrors}
          showDetails={true}
          isRetrying={isRetrying}
        />
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No database errors to display. Click "Simulate Error" to test.
        </Typography>
      )}
      
      {showOfflineIndicator && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Offline Indicator:
          </Typography>
          
          <Box sx={{ position: 'relative', height: 200, border: '1px dashed #ccc', borderRadius: 1, p: 2 }}>
            <Typography variant="caption" sx={{ position: 'absolute', top: 8, left: 8 }}>
              Preview (normally fixed position):
            </Typography>
            
            <DatabaseOfflineIndicator
              onRetry={retryConnection}
              offlineSince={offlineSince}
              retryInProgress={isRetrying}
              offlineCapabilities={[
                'View cached data',
                'Create draft messages',
                'Prepare reports (will be sent when online)'
              ]}
              minimizable={false}
            />
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default DatabaseErrorDemo;
</content>