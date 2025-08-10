/**
 * Production Error Monitoring Configuration
 * Configures error tracking and monitoring for production deployment
 */

// Error monitoring configuration
export const ERROR_MONITORING_CONFIG = {
  // Enable error monitoring in production
  enabled: process.env.NODE_ENV === 'production',
  
  // Error reporting endpoints
  endpoints: {
    clientErrors: process.env.REACT_APP_ERROR_ENDPOINT || '/api/errors/client',
    serviceWorkerErrors: process.env.REACT_APP_SW_ERROR_ENDPOINT || '/api/errors/sw',
    audioErrors: process.env.REACT_APP_AUDIO_ERROR_ENDPOINT || '/api/errors/audio',
    manifestErrors: process.env.REACT_APP_MANIFEST_ERROR_ENDPOINT || '/api/errors/manifest'
  },
  
  // Error sampling rate (0.0 to 1.0)
  sampleRate: parseFloat(process.env.REACT_APP_ERROR_SAMPLE_RATE) || 1.0,
  
  // Maximum errors to report per session
  maxErrorsPerSession: parseInt(process.env.REACT_APP_MAX_ERRORS_PER_SESSION) || 50,
  
  // Error categories to track
  categories: {
    SERVICE_WORKER: 'service_worker',
    AUDIO: 'audio',
    MANIFEST: 'manifest',
    NETWORK: 'network',
    JAVASCRIPT: 'javascript',
    UNHANDLED_REJECTION: 'unhandled_rejection'
  },
  
  // Sensitive data patterns to exclude from error reports
  sensitiveDataPatterns: [
    /password/i,
    /token/i,
    /key/i,
    /secret/i,
    /auth/i,
    /session/i,
    /cookie/i
  ]
};

// Error monitoring class
class ErrorMonitor {
  constructor() {
    this.errorCount = 0;
    this.sessionId = this.generateSessionId();
    this.isInitialized = false;
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  init() {
    if (!ERROR_MONITORING_CONFIG.enabled || this.isInitialized) {
      return;
    }

    this.setupGlobalErrorHandlers();
    this.setupUnhandledRejectionHandler();
    this.setupServiceWorkerErrorHandler();
    this.isInitialized = true;
    
    console.log('🔍 Error monitoring initialized for production');
  }

  setupGlobalErrorHandlers() {
    // Global JavaScript error handler
    window.addEventListener('error', (event) => {
      this.reportError({
        category: ERROR_MONITORING_CONFIG.categories.JAVASCRIPT,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        category: ERROR_MONITORING_CONFIG.categories.UNHANDLED_REJECTION,
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });
  }

  setupUnhandledRejectionHandler() {
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        category: ERROR_MONITORING_CONFIG.categories.UNHANDLED_REJECTION,
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });
  }

  setupServiceWorkerErrorHandler() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('error', (event) => {
        this.reportError({
          category: ERROR_MONITORING_CONFIG.categories.SERVICE_WORKER,
          message: 'Service worker error',
          error: event.error?.message || 'Unknown service worker error',
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  sanitizeErrorData(data) {
    const sanitized = { ...data };
    
    // Remove sensitive data
    ERROR_MONITORING_CONFIG.sensitiveDataPatterns.forEach(pattern => {
      Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string' && pattern.test(sanitized[key])) {
          sanitized[key] = '[REDACTED]';
        }
      });
    });

    return sanitized;
  }

  shouldReportError() {
    // Check error count limit
    if (this.errorCount >= ERROR_MONITORING_CONFIG.maxErrorsPerSession) {
      return false;
    }

    // Check sample rate
    if (Math.random() > ERROR_MONITORING_CONFIG.sampleRate) {
      return false;
    }

    return true;
  }

  async reportError(errorData) {
    if (!this.shouldReportError()) {
      return;
    }

    this.errorCount++;

    const sanitizedData = this.sanitizeErrorData({
      ...errorData,
      sessionId: this.sessionId,
      errorCount: this.errorCount,
      timestamp: errorData.timestamp || new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });

    try {
      // Determine endpoint based on error category
      let endpoint = ERROR_MONITORING_CONFIG.endpoints.clientErrors;
      
      switch (errorData.category) {
        case ERROR_MONITORING_CONFIG.categories.SERVICE_WORKER:
          endpoint = ERROR_MONITORING_CONFIG.endpoints.serviceWorkerErrors;
          break;
        case ERROR_MONITORING_CONFIG.categories.AUDIO:
          endpoint = ERROR_MONITORING_CONFIG.endpoints.audioErrors;
          break;
        case ERROR_MONITORING_CONFIG.categories.MANIFEST:
          endpoint = ERROR_MONITORING_CONFIG.endpoints.manifestErrors;
          break;
      }

      // Send error report
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sanitizedData)
      });

      console.log('📊 Error reported:', errorData.category);
    } catch (reportingError) {
      console.warn('Failed to report error:', reportingError);
      
      // Store error locally for later reporting
      this.storeErrorLocally(sanitizedData);
    }
  }

  storeErrorLocally(errorData) {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('neibrly_errors') || '[]');
      storedErrors.push(errorData);
      
      // Keep only last 10 errors
      if (storedErrors.length > 10) {
        storedErrors.splice(0, storedErrors.length - 10);
      }
      
      localStorage.setItem('neibrly_errors', JSON.stringify(storedErrors));
    } catch (storageError) {
      console.warn('Failed to store error locally:', storageError);
    }
  }

  async reportStoredErrors() {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('neibrly_errors') || '[]');
      
      if (storedErrors.length === 0) {
        return;
      }

      // Send stored errors
      await fetch(ERROR_MONITORING_CONFIG.endpoints.clientErrors, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'batch_errors',
          errors: storedErrors,
          sessionId: this.sessionId
        })
      });

      // Clear stored errors after successful reporting
      localStorage.removeItem('neibrly_errors');
      console.log('📊 Stored errors reported and cleared');
    } catch (error) {
      console.warn('Failed to report stored errors:', error);
    }
  }

  // Public methods for manual error reporting
  reportServiceWorkerError(error) {
    this.reportError({
      category: ERROR_MONITORING_CONFIG.categories.SERVICE_WORKER,
      message: error.message || 'Service worker error',
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  reportAudioError(error, audioFile) {
    this.reportError({
      category: ERROR_MONITORING_CONFIG.categories.AUDIO,
      message: error.message || 'Audio error',
      audioFile: audioFile,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  reportManifestError(error) {
    this.reportError({
      category: ERROR_MONITORING_CONFIG.categories.MANIFEST,
      message: error.message || 'Manifest error',
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  reportNetworkError(error, url) {
    this.reportError({
      category: ERROR_MONITORING_CONFIG.categories.NETWORK,
      message: error.message || 'Network error',
      url: url,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

// Create singleton instance
export const errorMonitor = new ErrorMonitor();

// Auto-initialize in production
if (ERROR_MONITORING_CONFIG.enabled) {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      errorMonitor.init();
      errorMonitor.reportStoredErrors();
    });
  } else {
    errorMonitor.init();
    errorMonitor.reportStoredErrors();
  }
}

export default errorMonitor;