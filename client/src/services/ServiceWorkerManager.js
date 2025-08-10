/**
 * ServiceWorkerManager - Handles service worker registration with robust error handling
 * Addresses MIME type issues and provides graceful fallbacks for production deployment
 */

const ErrorTypes = {
  MIME_TYPE_ERROR: 'sw_mime_type_error',
  REGISTRATION_FAILED: 'sw_registration_failed',
  UNSUPPORTED: 'sw_unsupported',
  NETWORK_ERROR: 'sw_network_error'
};

class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isSupported = this.checkSupport();
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // Start with 1 second
  }

  /**
   * Check if service workers are supported in the current environment
   */
  checkSupport() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Register the service worker with comprehensive error handling
   */
  async register(swPath = '/sw.js') {
    if (!this.isSupported) {
      console.warn('Service workers are not supported in this browser');
      return { success: false, error: ErrorTypes.UNSUPPORTED };
    }

    try {
      console.log('🔄 Attempting to register service worker...');
      
      // First, validate the service worker file
      const validation = await this.validateServiceWorkerFile(swPath);
      if (!validation.isValid) {
        console.error('Service worker validation failed:', validation.error);
        return { success: false, error: validation.error };
      }

      // Attempt registration
      this.registration = await navigator.serviceWorker.register(swPath, {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      console.log('✅ Service worker registered successfully:', this.registration);

      // Set up event listeners
      this.setupEventListeners();

      return { 
        success: true, 
        registration: this.registration,
        scope: this.registration.scope
      };

    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
      return this.handleRegistrationError(error, swPath);
    }
  }

  /**
   * Validate service worker file before registration
   */
  async validateServiceWorkerFile(swPath) {
    try {
      const response = await fetch(swPath, { 
        method: 'HEAD',
        cache: 'no-cache'
      });

      if (!response.ok) {
        return {
          isValid: false,
          error: ErrorTypes.NETWORK_ERROR,
          details: `Service worker file not found: ${response.status}`
        };
      }

      const contentType = response.headers.get('content-type');
      console.log('🔍 Service worker content type:', contentType);

      // Check for MIME type issues
      if (contentType && !this.isValidJavaScriptMimeType(contentType)) {
        console.warn('⚠️ Invalid MIME type detected:', contentType);
        
        // Try to fetch the actual content to see if it's HTML (common error)
        const fullResponse = await fetch(swPath, { cache: 'no-cache' });
        const content = await fullResponse.text();
        
        if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
          return {
            isValid: false,
            error: ErrorTypes.MIME_TYPE_ERROR,
            details: 'Service worker is being served as HTML instead of JavaScript'
          };
        }
      }

      return { isValid: true };

    } catch (error) {
      return {
        isValid: false,
        error: ErrorTypes.NETWORK_ERROR,
        details: error.message
      };
    }
  }

  /**
   * Check if the MIME type is valid for JavaScript
   */
  isValidJavaScriptMimeType(contentType) {
    const validTypes = [
      'application/javascript',
      'application/x-javascript',
      'text/javascript',
      'text/x-javascript'
    ];
    
    return validTypes.some(type => contentType.toLowerCase().includes(type));
  }

  /**
   * Handle registration errors with retry logic
   */
  async handleRegistrationError(error, swPath) {
    const errorMessage = error.message.toLowerCase();
    let errorType = ErrorTypes.REGISTRATION_FAILED;

    // Categorize the error
    if (errorMessage.includes('mime') || errorMessage.includes('text/html')) {
      errorType = ErrorTypes.MIME_TYPE_ERROR;
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      errorType = ErrorTypes.NETWORK_ERROR;
    }

    // Implement retry logic for certain errors
    if (this.shouldRetry(errorType) && this.retryAttempts < this.maxRetries) {
      this.retryAttempts++;
      const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1); // Exponential backoff
      
      console.log(`🔄 Retrying service worker registration in ${delay}ms (attempt ${this.retryAttempts}/${this.maxRetries})`);
      
      await this.delay(delay);
      return this.register(swPath);
    }

    // Reset retry counter
    this.retryAttempts = 0;

    return {
      success: false,
      error: errorType,
      details: error.message,
      canRetry: this.shouldRetry(errorType)
    };
  }

  /**
   * Determine if an error type should trigger a retry
   */
  shouldRetry(errorType) {
    return errorType === ErrorTypes.NETWORK_ERROR;
  }

  /**
   * Set up event listeners for service worker lifecycle
   */
  setupEventListeners() {
    if (!this.registration) return;

    // Handle service worker updates
    this.registration.addEventListener('updatefound', () => {
      console.log('🔄 Service worker update found');
      const newWorker = this.registration.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✅ New service worker installed, refresh recommended');
            this.notifyUpdate();
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('📨 Message from service worker:', event.data);
    });

    // Handle controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service worker controller changed');
      window.location.reload();
    });
  }

  /**
   * Notify user about service worker updates
   */
  notifyUpdate() {
    // This could be integrated with a toast notification system
    console.log('🔔 Service worker update available');
    
    // Dispatch custom event for UI components to handle
    window.dispatchEvent(new CustomEvent('sw-update-available', {
      detail: { registration: this.registration }
    }));
  }

  /**
   * Unregister the service worker
   */
  async unregister() {
    if (!this.isSupported || !this.registration) {
      return { success: false, error: 'No service worker to unregister' };
    }

    try {
      const result = await this.registration.unregister();
      console.log('🗑️ Service worker unregistered:', result);
      this.registration = null;
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to unregister service worker:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current registration status
   */
  getStatus() {
    return {
      isSupported: this.isSupported,
      isRegistered: !!this.registration,
      registration: this.registration,
      scope: this.registration?.scope,
      state: this.registration?.active?.state
    };
  }

  /**
   * Skip waiting for service worker activation
   */
  async skipWaiting() {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    }
    return false;
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(errorType) {
    const messages = {
      [ErrorTypes.MIME_TYPE_ERROR]: 'Service worker could not be loaded due to server configuration issues. Offline features may not be available.',
      [ErrorTypes.REGISTRATION_FAILED]: 'Service worker registration failed. Some features may not work offline.',
      [ErrorTypes.UNSUPPORTED]: 'Your browser does not support service workers. Some features may not be available.',
      [ErrorTypes.NETWORK_ERROR]: 'Network error while loading service worker. Please check your connection.'
    };

    return messages[errorType] || 'An unknown error occurred with the service worker.';
  }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

export default serviceWorkerManager;
export { ErrorTypes };