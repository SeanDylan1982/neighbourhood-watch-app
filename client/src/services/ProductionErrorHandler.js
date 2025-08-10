/**
 * ProductionErrorHandler - Centralized error handling for production deployment issues
 * Provides user-friendly error messages and graceful degradation
 */

import { ErrorTypes as ServiceWorkerErrorTypes } from './ServiceWorkerManager';
import { AudioErrorTypes } from './AudioManager';
import { ManifestErrorTypes } from './ManifestValidator';

const ProductionErrorTypes = {
  SERVICE_WORKER: 'production_service_worker_error',
  AUDIO: 'production_audio_error',
  MANIFEST: 'production_manifest_error',
  NETWORK: 'production_network_error',
  UNKNOWN: 'production_unknown_error'
};

const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

class ProductionErrorHandler {
  constructor() {
    this.errors = new Map();
    this.errorListeners = new Set();
    this.userNotifications = new Set();
    this.isProduction = process.env.NODE_ENV === 'production';
    this.maxErrors = 100; // Prevent memory leaks
    
    this.setupGlobalErrorHandlers();
  }

  /**
   * Set up global error handlers
   */
  setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 Unhandled promise rejection:', event.reason);
      this.handleError(ProductionErrorTypes.UNKNOWN, event.reason, {
        type: 'unhandledrejection',
        promise: event.promise
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('🚨 JavaScript error:', event.error);
      this.handleError(ProductionErrorTypes.UNKNOWN, event.error, {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        console.error('🚨 Resource loading error:', event.target);
        this.handleError(ProductionErrorTypes.NETWORK, 'Resource loading failed', {
          type: 'resource',
          element: event.target.tagName,
          source: event.target.src || event.target.href
        });
      }
    }, true);
  }

  /**
   * Handle service worker errors
   */
  handleServiceWorkerError(error, context = {}) {
    const errorInfo = {
      type: ProductionErrorTypes.SERVICE_WORKER,
      originalError: error,
      context,
      severity: this.getServiceWorkerErrorSeverity(error),
      userMessage: this.getServiceWorkerUserMessage(error),
      timestamp: new Date().toISOString()
    };

    this.logError(errorInfo);
    this.notifyError(errorInfo);

    return errorInfo;
  }

  /**
   * Handle audio errors
   */
  handleAudioError(error, context = {}) {
    const errorInfo = {
      type: ProductionErrorTypes.AUDIO,
      originalError: error,
      context,
      severity: this.getAudioErrorSeverity(error),
      userMessage: this.getAudioUserMessage(error),
      timestamp: new Date().toISOString()
    };

    this.logError(errorInfo);
    this.notifyError(errorInfo);

    return errorInfo;
  }

  /**
   * Handle manifest errors
   */
  handleManifestError(error, context = {}) {
    const errorInfo = {
      type: ProductionErrorTypes.MANIFEST,
      originalError: error,
      context,
      severity: this.getManifestErrorSeverity(error),
      userMessage: this.getManifestUserMessage(error),
      timestamp: new Date().toISOString()
    };

    this.logError(errorInfo);
    this.notifyError(errorInfo);

    return errorInfo;
  }

  /**
   * Handle generic errors
   */
  handleError(type, error, context = {}) {
    const errorInfo = {
      type,
      originalError: error,
      context,
      severity: this.getGenericErrorSeverity(error),
      userMessage: this.getGenericUserMessage(type, error),
      timestamp: new Date().toISOString()
    };

    this.logError(errorInfo);
    this.notifyError(errorInfo);

    return errorInfo;
  }

  /**
   * Log error information
   */
  logError(errorInfo) {
    // Add to error collection
    const errorId = this.generateErrorId();
    this.errors.set(errorId, errorInfo);

    // Prevent memory leaks
    if (this.errors.size > this.maxErrors) {
      const firstKey = this.errors.keys().next().value;
      this.errors.delete(firstKey);
    }

    // Log to console with appropriate level
    const logLevel = this.getLogLevel(errorInfo.severity);
    console[logLevel](`🚨 ProductionErrorHandler [${errorInfo.type}]:`, {
      error: errorInfo.originalError,
      context: errorInfo.context,
      severity: errorInfo.severity,
      userMessage: errorInfo.userMessage,
      timestamp: errorInfo.timestamp
    });

    // Report to external service in production
    if (this.isProduction) {
      this.reportError(errorInfo);
    }
  }

  /**
   * Notify error listeners
   */
  notifyError(errorInfo) {
    // Notify registered listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (error) {
        console.error('🚨 Error in error listener:', error);
      }
    });

    // Show user notification if appropriate
    if (this.shouldShowUserNotification(errorInfo)) {
      this.showUserNotification(errorInfo);
    }
  }

  /**
   * Show user-friendly notification
   */
  showUserNotification(errorInfo) {
    // Prevent duplicate notifications
    const notificationKey = `${errorInfo.type}_${errorInfo.severity}`;
    if (this.userNotifications.has(notificationKey)) {
      return;
    }

    this.userNotifications.add(notificationKey);

    // Dispatch custom event for UI components to handle
    window.dispatchEvent(new CustomEvent('production-error', {
      detail: {
        type: errorInfo.type,
        severity: errorInfo.severity,
        message: errorInfo.userMessage,
        timestamp: errorInfo.timestamp
      }
    }));

    // Auto-clear notification key after some time
    setTimeout(() => {
      this.userNotifications.delete(notificationKey);
    }, 300000); // 5 minutes
  }

  /**
   * Error severity assessment
   */
  getServiceWorkerErrorSeverity(error) {
    if (error === ServiceWorkerErrorTypes.UNSUPPORTED) {
      return ErrorSeverity.LOW;
    }
    if (error === ServiceWorkerErrorTypes.MIME_TYPE_ERROR) {
      return ErrorSeverity.MEDIUM;
    }
    return ErrorSeverity.LOW;
  }

  getAudioErrorSeverity(error) {
    if (error === AudioErrorTypes.UNSUPPORTED) {
      return ErrorSeverity.LOW;
    }
    if (error === AudioErrorTypes.ENCODING_ERROR) {
      return ErrorSeverity.MEDIUM;
    }
    return ErrorSeverity.LOW;
  }

  getManifestErrorSeverity(error) {
    if (error === ManifestErrorTypes.SYNTAX_ERROR) {
      return ErrorSeverity.MEDIUM;
    }
    return ErrorSeverity.LOW;
  }

  getGenericErrorSeverity(error) {
    if (error && error.name === 'ChunkLoadError') {
      return ErrorSeverity.HIGH;
    }
    return ErrorSeverity.MEDIUM;
  }

  /**
   * User-friendly error messages
   */
  getServiceWorkerUserMessage(error) {
    const messages = {
      [ServiceWorkerErrorTypes.MIME_TYPE_ERROR]: 'Some offline features may not work properly due to server configuration.',
      [ServiceWorkerErrorTypes.REGISTRATION_FAILED]: 'Offline features are currently unavailable.',
      [ServiceWorkerErrorTypes.UNSUPPORTED]: 'Your browser doesn\'t support offline features.',
      [ServiceWorkerErrorTypes.NETWORK_ERROR]: 'Network issues are affecting offline functionality.'
    };

    return messages[error] || 'Some features may not work as expected.';
  }

  getAudioUserMessage(error) {
    const messages = {
      [AudioErrorTypes.ENCODING_ERROR]: 'Notification sounds are currently unavailable.',
      [AudioErrorTypes.LOAD_FAILED]: 'Notification sounds are currently unavailable.',
      [AudioErrorTypes.CONTEXT_FAILED]: 'Audio features are currently unavailable.',
      [AudioErrorTypes.UNSUPPORTED]: 'Your browser doesn\'t support audio notifications.',
      [AudioErrorTypes.NETWORK_ERROR]: 'Network issues are affecting audio features.'
    };

    return messages[error] || 'Audio features may not work properly.';
  }

  getManifestUserMessage(error) {
    const messages = {
      [ManifestErrorTypes.SYNTAX_ERROR]: 'App installation features may not work properly.',
      [ManifestErrorTypes.MISSING_FIELDS]: 'Some app features may not work as expected.',
      [ManifestErrorTypes.INVALID_ICONS]: 'App icons may not display correctly.',
      [ManifestErrorTypes.NETWORK_ERROR]: 'App installation features are currently unavailable.'
    };

    return messages[error] || 'Some app features may not work properly.';
  }

  getGenericUserMessage(type, error) {
    if (error && error.name === 'ChunkLoadError') {
      return 'Please refresh the page to load the latest version of the app.';
    }

    const messages = {
      [ProductionErrorTypes.NETWORK]: 'Network connectivity issues detected. Some features may be limited.',
      [ProductionErrorTypes.UNKNOWN]: 'An unexpected error occurred. The app should continue to work normally.'
    };

    return messages[type] || 'An error occurred, but the app should continue to work.';
  }

  /**
   * Utility functions
   */
  shouldShowUserNotification(errorInfo) {
    // Only show notifications for medium+ severity errors
    return errorInfo.severity === ErrorSeverity.MEDIUM || 
           errorInfo.severity === ErrorSeverity.HIGH || 
           errorInfo.severity === ErrorSeverity.CRITICAL;
  }

  getLogLevel(severity) {
    const levels = {
      [ErrorSeverity.LOW]: 'warn',
      [ErrorSeverity.MEDIUM]: 'warn',
      [ErrorSeverity.HIGH]: 'error',
      [ErrorSeverity.CRITICAL]: 'error'
    };

    return levels[severity] || 'warn';
  }

  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * External error reporting (placeholder for analytics service)
   */
  reportError(errorInfo) {
    // In a real application, this would send to an analytics service
    // like Sentry, LogRocket, or custom analytics
    console.log('📊 Reporting error to analytics:', {
      type: errorInfo.type,
      severity: errorInfo.severity,
      timestamp: errorInfo.timestamp,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }

  /**
   * Public API
   */
  addErrorListener(listener) {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  getErrorSummary() {
    const summary = {
      totalErrors: this.errors.size,
      errorsByType: {},
      errorsBySeverity: {},
      recentErrors: []
    };

    // Analyze errors
    for (const [id, error] of this.errors) {
      // Count by type
      summary.errorsByType[error.type] = (summary.errorsByType[error.type] || 0) + 1;
      
      // Count by severity
      summary.errorsBySeverity[error.severity] = (summary.errorsBySeverity[error.severity] || 0) + 1;
      
      // Add to recent errors (last 10)
      if (summary.recentErrors.length < 10) {
        summary.recentErrors.push({
          id,
          type: error.type,
          severity: error.severity,
          timestamp: error.timestamp,
          userMessage: error.userMessage
        });
      }
    }

    // Sort recent errors by timestamp
    summary.recentErrors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return summary;
  }

  clearErrors() {
    this.errors.clear();
    this.userNotifications.clear();
  }
}

// Create singleton instance
const productionErrorHandler = new ProductionErrorHandler();

export default productionErrorHandler;
export { ProductionErrorTypes, ErrorSeverity };