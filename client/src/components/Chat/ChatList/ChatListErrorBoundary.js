import React from 'react';
import { Box, Alert, Button, Typography } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

class ChatListErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('ChatList Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to monitoring service if available
    if (window.reportError) {
      window.reportError(error, {
        component: 'ChatList',
        errorInfo: errorInfo,
        retryCount: this.state.retryCount
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.name === 'ChunkLoadError' || 
                          this.state.error?.message?.includes('Loading chunk') ||
                          this.state.error?.message?.includes('chunk');

      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              textAlign: 'left',
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Typography variant="h6" gutterBottom>
              {isChunkError ? 'Loading Error' : 'Something went wrong'}
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              {isChunkError 
                ? 'There was a problem loading the chat list. This usually happens when the app is updated while you\'re using it.'
                : 'The chat list encountered an unexpected error.'
              }
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <details style={{ marginTop: '8px' }}>
                      <summary>Component Stack</summary>
                      {this.state.errorInfo.componentStack}
                    </details>
                  )}
                </Typography>
              </Box>
            )}
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleRetry}
              disabled={this.state.retryCount >= 3}
            >
              {this.state.retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
            </Button>

            {(isChunkError || this.state.retryCount >= 2) && (
              <Button
                variant="outlined"
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
            )}
          </Box>

          {this.state.retryCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Retry attempt: {this.state.retryCount}/3
            </Typography>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ChatListErrorBoundary;