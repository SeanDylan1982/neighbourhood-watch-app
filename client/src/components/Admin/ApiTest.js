import React, { useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import useApi from '../../hooks/useApi';

const ApiTest = () => {
  const { getWithRetry, loading } = useApi();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testApi = async () => {
    try {
      setError(null);
      setResult(null);
      console.log('Testing admin API...');
      
      const response = await getWithRetry('/api/admin/content/test');
      console.log('Test response:', response);
      setResult(response);
    } catch (err) {
      console.error('Test error:', err);
      setError(err.message);
    }
  };

  const testFlaggedContent = async () => {
    try {
      setError(null);
      setResult(null);
      console.log('Testing flagged content API...');
      
      const response = await getWithRetry('/api/admin/content/flagged');
      console.log('Flagged content response:', response);
      setResult(response);
    } catch (err) {
      console.error('Flagged content error:', err);
      setError(err.message);
    }
  };

  const compareEndpoints = async () => {
    try {
      setError(null);
      setResult(null);
      console.log('Comparing both admin endpoints...');
      
      const [statsResponse, flaggedResponse] = await Promise.all([
        getWithRetry('/api/admin/stats'),
        getWithRetry('/api/admin/content/flagged')
      ]);
      
      const comparison = {
        stats: {
          flaggedContent: statsResponse?.flaggedContent || 0,
          totalUsers: statsResponse?.totalUsers || 0
        },
        flaggedContent: {
          total: flaggedResponse?.total || 0,
          contentLength: flaggedResponse?.content?.length || 0,
          debug: flaggedResponse?.debug || null
        },
        match: (statsResponse?.flaggedContent || 0) === (flaggedResponse?.total || 0)
      };
      
      console.log('Endpoint comparison:', comparison);
      setResult(comparison);
    } catch (err) {
      console.error('Comparison error:', err);
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>API Test Panel</Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button 
          variant="outlined" 
          onClick={testApi} 
          disabled={loading}
        >
          Test Admin API
        </Button>
        <Button 
          variant="outlined" 
          onClick={testFlaggedContent} 
          disabled={loading}
        >
          Test Flagged Content
        </Button>
        <Button 
          variant="contained" 
          onClick={compareEndpoints} 
          disabled={loading}
          color="secondary"
        >
          Compare Endpoints
        </Button>
      </Box>

      {loading && <Typography>Loading...</Typography>}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {error}
        </Alert>
      )}
      
      {result && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Success!</strong>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default ApiTest;