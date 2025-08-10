import { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'cookieConsent';
const COOKIE_CONSENT_VERSION = '1.0';

const useCookieConsent = () => {
  const [cookieConsent, setCookieConsent] = useState(null);
  const [showCookieModal, setShowCookieModal] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    
    if (savedConsent) {
      try {
        const consentData = JSON.parse(savedConsent);
        
        // Check if consent is still valid (same version)
        if (consentData.version === COOKIE_CONSENT_VERSION) {
          setCookieConsent(consentData.consent);
        } else {
          // Version changed, ask for consent again
          localStorage.removeItem(COOKIE_CONSENT_KEY);
          setShowCookieModal(true);
        }
      } catch (error) {
        console.error('Error parsing cookie consent:', error);
        localStorage.removeItem(COOKIE_CONSENT_KEY);
        setShowCookieModal(true);
      }
    } else {
      // No consent found, show modal after a short delay
      setTimeout(() => {
        setShowCookieModal(true);
      }, 2000); // Show after 2 seconds to let the page load
    }
  }, []);

  const acceptAllCookies = () => {
    const consentData = {
      consent: 'all',
      timestamp: new Date().toISOString(),
      version: COOKIE_CONSENT_VERSION
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setCookieConsent('all');
    setShowCookieModal(false);
    
    // Enable analytics and other optional cookies
    enableOptionalCookies();
  };

  const acceptEssentialOnly = () => {
    const consentData = {
      consent: 'essential',
      timestamp: new Date().toISOString(),
      version: COOKIE_CONSENT_VERSION
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setCookieConsent('essential');
    setShowCookieModal(false);
    
    // Disable optional cookies
    disableOptionalCookies();
  };

  const dismissModal = () => {
    // Don't save consent, just hide modal for this session
    setShowCookieModal(false);
    
    // Show again in 24 hours
    const dismissData = {
      dismissed: true,
      timestamp: new Date().toISOString(),
      showAgainAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    sessionStorage.setItem('cookieModalDismissed', JSON.stringify(dismissData));
  };

  const enableOptionalCookies = () => {
    // Enable analytics, functional cookies, etc.
    // This would integrate with your analytics service
    console.log('Optional cookies enabled');
    
    // Example: Enable Google Analytics, user preferences, etc.
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        functionality_storage: 'granted'
      });
    }
  };

  const disableOptionalCookies = () => {
    // Disable analytics, functional cookies, etc.
    console.log('Optional cookies disabled');
    
    // Example: Disable Google Analytics
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        functionality_storage: 'denied'
      });
    }
    
    // Clear existing optional cookies
    clearOptionalCookies();
  };

  const clearOptionalCookies = () => {
    // Clear analytics and functional cookies
    const cookies = document.cookie.split(';');
    
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // List of optional cookie names to clear
      const optionalCookies = ['_ga', '_gid', '_gat', 'analytics', 'preferences'];
      
      if (optionalCookies.some(optionalCookie => name.startsWith(optionalCookie))) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
  };

  const resetConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    sessionStorage.removeItem('cookieModalDismissed');
    setCookieConsent(null);
    setShowCookieModal(true);
  };

  const hasConsent = (type = 'essential') => {
    if (type === 'essential') {
      return true; // Essential cookies are always allowed
    }
    
    return cookieConsent === 'all';
  };

  return {
    cookieConsent,
    showCookieModal,
    acceptAllCookies,
    acceptEssentialOnly,
    dismissModal,
    resetConsent,
    hasConsent,
    closeCookieModal: () => setShowCookieModal(false)
  };
};

export default useCookieConsent;