class PushNotificationService {
  constructor() {
    this.registration = null;
    this.permission = 'default';
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY || '';
    
    this.init();
  }

  async init() {
    if (!this.isSupported) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);

      // Check current permission
      this.permission = Notification.permission;
      
      // Load settings
      this.loadSettings();
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        await this.subscribe();
        return true;
      } else {
        console.warn('Push notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async subscribe() {
    if (!this.registration || !this.vapidPublicKey) {
      console.warn('Service worker not registered or VAPID key missing');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      localStorage.setItem('pushNotificationSubscribed', 'true');
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribe() {
    if (!this.registration) return;

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(subscription);
        localStorage.setItem('pushNotificationSubscribed', 'false');
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  }

  async sendSubscriptionToServer(subscription) {
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${baseURL}/api/notifications/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  async removeSubscriptionFromServer(subscription) {
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${baseURL}/api/notifications/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      return;
    }

    const defaultOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false,
      ...options
    };

    try {
      if (this.registration) {
        await this.registration.showNotification(title, defaultOptions);
      } else {
        new Notification(title, defaultOptions);
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  // Settings management
  isEnabled() {
    const stored = localStorage.getItem('pushNotificationsEnabled');
    return stored !== null ? stored === 'true' : true;
  }

  setEnabled(enabled) {
    localStorage.setItem('pushNotificationsEnabled', enabled.toString());
    
    if (enabled && this.permission !== 'granted') {
      this.requestPermission();
    } else if (!enabled) {
      this.unsubscribe();
    }
  }

  isSubscribed() {
    const stored = localStorage.getItem('pushNotificationSubscribed');
    return stored === 'true';
  }

  loadSettings() {
    // Auto-subscribe if enabled and permission granted
    if (this.isEnabled() && this.permission === 'granted' && !this.isSubscribed()) {
      this.subscribe();
    }
  }

  // Device-specific methods
  async requestIOSPermission() {
    // iOS Safari specific handling
    if ('safari' in window && 'pushNotification' in window.safari) {
      try {
        const permission = await window.safari.pushNotification.requestPermission(
          'https://your-domain.com', // Replace with your domain
          'web.com.yourapp.pushnotifications', // Replace with your bundle ID
          {}, // User info
          (permission) => {
            if (permission.permission === 'granted') {
              this.permission = 'granted';
              return true;
            }
            return false;
          }
        );
        return permission.permission === 'granted';
      } catch (error) {
        console.error('iOS push notification permission error:', error);
        return false;
      }
    }
    
    // Fallback to standard permission request
    return this.requestPermission();
  }

  // Android-specific optimizations
  setupAndroidNotifications() {
    // Android Chrome specific settings
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Enable background sync for offline notifications
      if ('sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
          return registration.sync.register('background-notification-sync');
        });
      }
    }
  }

  // Huawei-specific handling
  async setupHuaweiNotifications() {
    // Huawei Mobile Services (HMS) push notifications
    if (window.HMSPush) {
      try {
        const token = await window.HMSPush.getToken();
        await this.sendHuaweiTokenToServer(token);
        return true;
      } catch (error) {
        console.error('Huawei push notification setup failed:', error);
        return false;
      }
    }
    return false;
  }

  async sendHuaweiTokenToServer(token) {
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${baseURL}/api/notifications/push/huawei-subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          token,
          userAgent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send Huawei token to server');
      }
    } catch (error) {
      console.error('Error sending Huawei token to server:', error);
    }
  }

  // Test notification
  async testNotification() {
    await this.showNotification('Test Notification', {
      body: 'This is a test notification from your neighborhood app!',
      icon: '/icons/icon-192x192.png',
      tag: 'test-notification'
    });
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;