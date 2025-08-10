import icons from './Icons'
import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Container,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous',
      retryCount: this.state.retryCount
    };

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service like Sentry
      // Sentry.captureException(error, { extra: errorReport });
    }

    // Store locally for debugging
    const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]');
    errorLog.push(errorReport);
    // Keep only last 10 errors
    if (errorLog.length > 10) {
      errorLog.shift();
    }
    localStorage.setItem('errorLog', JSON.stringify(errorLog));
  };

  handleReload = () => {
    this.setState(prevState => ({ retryCount: prevState.retryCount + 1 }));
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: this.state.retryCount + 1
    });
  };

  toggleDetails = () => {
    this.setState(prevState => ({ showDetails: !prevState.showDetails }));
  };

  handleReportBug = () => {
    const errorDetails = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const subject = encodeURIComponent(`Bug Report: ${this.state.error?.message || 'Application Error'}`);
    const body = encodeURIComponent(`Error Details:\n\n${JSON.stringify(errorDetails, null, 2)}`);
    
    // Open email client or redirect to bug report form
    window.open(`mailto:support@neighbourhoodwatch.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <icons.Error 
                sx={{ 
                  fontSize: 64, 
                  color: 'error.main', 
                  mb: 2 
                }} 
              />
              
              <Typography variant="h4" gutterBottom>
                Oops! Something went wrong
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                We're sorry, but something unexpected happened. 
                Our team has been notified and is working on a fix.
              </Typography>

              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="body2">
                  <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                >
                  Try Again
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<icons.Home />}
                  onClick={this.handleGoHome}
                >
                  Go to Dashboard
                </Button>

                <Button
                  variant="text"
                  startIcon={<BugReportIcon />}
                  onClick={this.handleReportBug}
                  size="small"
                >
                  Report Bug
                </Button>
              </Box>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="text"
                  onClick={this.toggleDetails}
                  startIcon={this.state.showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  size="small"
                >
                  {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
                </Button>
              </Box>

              <Collapse in={this.state.showDetails}>
                <Box sx={{ mt: 3, textAlign: 'left' }}>
                  <Typography variant="h6" gutterBottom>
                    Technical Details:
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      backgroundColor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: '0.75rem',
                      maxHeight: 300,
                      border: '1px solid',
                      borderColor: 'grey.300'
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">Error Message:</Typography>
                    {this.state.error?.message}
                    
                    {this.state.error?.stack && (
                      <>
                        <Typography variant="body2" fontWeight="bold" sx={{ mt: 2 }}>Stack Trace:</Typography>
                        {this.state.error.stack}
                      </>
                    )}
                    
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <Typography variant="body2" fontWeight="bold" sx={{ mt: 2 }}>Component Stack:</Typography>
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                    
                    <Typography variant="body2" fontWeight="bold" sx={{ mt: 2 }}>Additional Info:</Typography>
                    URL: {window.location.href}
                    Timestamp: {new Date().toISOString()}
                    Retry Count: {this.state.retryCount}
                  </Box>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;