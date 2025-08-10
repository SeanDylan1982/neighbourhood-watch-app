import React from 'react';
import PropTypes from 'prop-types';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
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
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Log error to monitoring service
    this.logError(error, errorInfo);
  }

  logError = (error, errorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.props.userId,
      chatId: this.props.chatId
    };

    // Send to error logging service
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      }).catch(err => {
        console.error('Failed to log error:', err);
      });
    } else {
      console.error('Error caught by boundary:', errorData);
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));

    // Call optional retry callback
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, showDetails = false } = this.props;
      const { error, errorInfo, retryCount } = this.state;

      // Use custom fallback if provided
      if (Fallback) {
        return (
          <Fallback
            error={error}
            errorInfo={errorInfo}
            onRetry={this.handleRetry}
            onReload={this.handleReload}
            retryCount={retryCount}
          />
        );
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary__container">
            <div className="error-boundary__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  fill="currentColor"
                />
              </svg>
            </div>
            
            <h2 className="error-boundary__title">
              Something went wrong
            </h2>
            
            <p className="error-boundary__message">
              We're sorry, but something unexpected happened. Please try again.
            </p>

            <div className="error-boundary__actions">
              <button
                className="error-boundary__button error-boundary__button--primary"
                onClick={this.handleRetry}
                disabled={retryCount >= 3}
              >
                {retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
              </button>
              
              <button
                className="error-boundary__button error-boundary__button--secondary"
                onClick={this.handleReload}
              >
                Reload Page
              </button>
            </div>

            {showDetails && error && (
              <details className="error-boundary__details">
                <summary>Error Details</summary>
                <pre className="error-boundary__stack">
                  {error.message}
                  {error.stack}
                </pre>
              </details>
            )}

            {retryCount > 0 && (
              <p className="error-boundary__retry-info">
                Retry attempts: {retryCount}/3
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.elementType,
  onRetry: PropTypes.func,
  showDetails: PropTypes.bool,
  userId: PropTypes.string,
  chatId: PropTypes.string
};

export default ErrorBoundary;