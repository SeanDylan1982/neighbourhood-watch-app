/**
 * ProductionErrorBoundary - Enhanced error boundary for production deployment issues
 * Provides graceful error handling and user-friendly fallbacks
 */

import React from 'react';
import productionErrorHandler from '../../services/ProductionErrorHandler';

class ProductionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our production error handler
    const errorDetails = productionErrorHandler.handleError('unknown', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'ProductionErrorBoundary',
      props: this.props.errorContext || {}
    });

    this.setState({
      error,
      errorInfo,
      errorId: errorDetails.timestamp
    });

    // Log to console for debugging
    console.error('🚨 ProductionErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.message}>
              {this.props.userMessage || 
               'An unexpected error occurred. The app should continue to work normally after refreshing.'}
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details (Development)</summary>
                <pre style={styles.errorText}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div style={styles.actions}>
              <button 
                onClick={this.handleRetry}
                style={styles.button}
              >
                Try Again
              </button>
              <button 
                onClick={this.handleReload}
                style={styles.buttonSecondary}
              >
                Refresh Page
              </button>
            </div>
            
            {this.state.errorId && (
              <p style={styles.errorId}>
                Error ID: {this.state.errorId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Styles for the error boundary
const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    margin: '20px 0'
  },
  content: {
    textAlign: 'center',
    maxWidth: '500px'
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  title: {
    color: '#495057',
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '12px',
    margin: '0 0 12px 0'
  },
  message: {
    color: '#6c757d',
    fontSize: '16px',
    lineHeight: '1.5',
    marginBottom: '24px',
    margin: '0 0 24px 0'
  },
  details: {
    textAlign: 'left',
    marginBottom: '24px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    padding: '12px'
  },
  summary: {
    cursor: 'pointer',
    fontWeight: '600',
    marginBottom: '8px'
  },
  errorText: {
    fontSize: '12px',
    color: '#dc3545',
    backgroundColor: '#fff',
    padding: '8px',
    borderRadius: '4px',
    overflow: 'auto',
    maxHeight: '200px',
    margin: '0'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  errorId: {
    fontSize: '12px',
    color: '#adb5bd',
    fontFamily: 'monospace',
    margin: '0'
  }
};

export default ProductionErrorBoundary;