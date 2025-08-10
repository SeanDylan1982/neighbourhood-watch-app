import React, { useState, useEffect, useRef } from 'react';
import './TermsModal.css'; // Reuse the same styles

const CookiesModal = ({ 
  isOpen, 
  open,
  onClose, 
  onAccept, 
  onDecline,
  onDismiss,
  alreadyAccepted = false 
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const contentRef = useRef(null);

  // Support both isOpen and open prop names for compatibility
  const modalIsOpen = isOpen || open;

  // Check if content needs scrolling on mount and when modal opens
  useEffect(() => {
    if (modalIsOpen && contentRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        const { scrollHeight, clientHeight } = contentRef.current;
        const needsScrolling = scrollHeight > clientHeight + 10; // 10px tolerance
        
        if (!needsScrolling) {
          // If content doesn't need scrolling, allow immediate acceptance
          setHasScrolledToBottom(true);
        } else {
          // Reset scroll state for scrollable content
          setHasScrolledToBottom(false);
        }
      }, 100);
    }
  }, [modalIsOpen]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20; // 20px tolerance for easier detection
    setHasScrolledToBottom(isAtBottom);
  };

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      await onAccept();
    } catch (error) {
      console.error('Error accepting cookies:', error);
      // Handle error - could show a toast notification
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    onDecline();
  };

  const handleDismiss = () => {
    onDismiss();
  };

  // Don't show modal if already accepted or not open
  if (alreadyAccepted || !modalIsOpen) {
    return null;
  }

  const cookiesContent = {
    title: 'Cookie Policy & Data Usage',
    content: `
      <h3>How We Use Cookies and Store Data</h3>
      
      <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
      
      <h4>What Are Cookies?</h4>
      <p>Cookies are small text files stored on your device when you visit our Platform. They help us provide you with a better, more personalized experience and ensure the Platform works properly.</p>
      
      <h4>Types of Data We Store</h4>
      
      <h5>🔐 Essential Cookies (Always Active)</h5>
      <p>These cookies are necessary for the Platform to function and cannot be disabled:</p>
      <ul>
        <li><strong>Authentication Tokens:</strong> Keep you logged in securely</li>
        <li><strong>Session Data:</strong> Maintain your session while using the Platform</li>
        <li><strong>Security Cookies:</strong> Protect against unauthorized access and attacks</li>
        <li><strong>Form Data:</strong> Remember information you've entered in forms</li>
      </ul>
      
      <h5>⚙️ Functional Cookies</h5>
      <p>These cookies enhance your experience and remember your preferences:</p>
      <ul>
        <li><strong>User Preferences:</strong> Theme settings, language preferences, notification settings</li>
        <li><strong>Display Settings:</strong> Layout preferences, font size, accessibility options</li>
        <li><strong>Search History:</strong> Recent searches to help you find content faster</li>
        <li><strong>Draft Content:</strong> Temporarily save drafts of posts and messages</li>
      </ul>
      
      <h5>📊 Analytics Cookies</h5>
      <p>These cookies help us understand how the Platform is used and improve it:</p>
      <ul>
        <li><strong>Usage Statistics:</strong> Which features are used most, page views, time spent</li>
        <li><strong>Performance Data:</strong> Loading times, error rates, system performance</li>
        <li><strong>User Journey:</strong> How users navigate through the Platform</li>
        <li><strong>Feature Adoption:</strong> Which new features are being used</li>
      </ul>
      
      <h4>Local Storage</h4>
      <p>We also use your browser's local storage to:</p>
      <ul>
        <li><strong>Cache Content:</strong> Store frequently accessed data for faster loading</li>
        <li><strong>Offline Support:</strong> Allow limited functionality when internet is unavailable</li>
        <li><strong>User Settings:</strong> Remember your preferences between sessions</li>
        <li><strong>Temporary Data:</strong> Store form inputs and drafts temporarily</li>
      </ul>
      
      <h4>Why We Need This Data</h4>
      
      <h5>🛡️ Security and Safety</h5>
      <ul>
        <li>Protect your account from unauthorized access</li>
        <li>Detect and prevent suspicious activities</li>
        <li>Maintain the integrity of community safety features</li>
        <li>Ensure only verified neighbours can access community content</li>
      </ul>
      
      <h5>🎯 Personalization</h5>
      <ul>
        <li>Show you relevant neighbourhood content and notices</li>
        <li>Remember your communication preferences</li>
        <li>Customize the interface to your preferences</li>
        <li>Provide location-specific safety alerts and updates</li>
      </ul>
      
      <h5>📈 Platform Improvement</h5>
      <ul>
        <li>Understand which features are most valuable to the community</li>
        <li>Identify and fix technical issues</li>
        <li>Optimize performance and loading times</li>
        <li>Develop new features based on usage patterns</li>
      </ul>
      
      <h4>Your Control Over Cookies</h4>
      
      <h5>Browser Settings</h5>
      <ul>
        <li><strong>Block Cookies:</strong> Configure your browser to block all or specific cookies</li>
        <li><strong>Delete Cookies:</strong> Clear existing cookies from your browser</li>
        <li><strong>Notification:</strong> Get notified when cookies are being set</li>
      </ul>
      
      <h5>Platform Settings</h5>
      <ul>
        <li><strong>Analytics Opt-out:</strong> Disable analytics cookies in your account settings</li>
        <li><strong>Preference Management:</strong> Control which functional cookies are used</li>
        <li><strong>Data Export:</strong> Download a copy of your stored data</li>
        <li><strong>Data Deletion:</strong> Request deletion of your stored data</li>
      </ul>
      
      <h4>Third-Party Services</h4>
      <p>We use trusted third-party services that may also set cookies:</p>
      <ul>
        <li><strong>Cloud Storage:</strong> For secure data backup and synchronization</li>
        <li><strong>Analytics:</strong> To understand Platform usage (anonymized data only)</li>
        <li><strong>Security Services:</strong> For protection against threats and attacks</li>
        <li><strong>Communication:</strong> For email notifications and messaging features</li>
      </ul>
      
      <h4>Data Retention</h4>
      <ul>
        <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
        <li><strong>Persistent Cookies:</strong> Stored for up to 1 year or until you delete them</li>
        <li><strong>Local Storage:</strong> Remains until you clear it or delete your account</li>
        <li><strong>Analytics Data:</strong> Anonymized and retained for up to 2 years</li>
      </ul>
      
      <h4>Your Choices</h4>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h5>🟢 Accept All Cookies</h5>
        <p>Enable all cookies for the best experience. You can change your mind later in settings.</p>
        
        <h5>🟡 Essential Cookies Only</h5>
        <p>Use only necessary cookies. Some features may not work optimally.</p>
        
        <h5>⚪ Dismiss for Now</h5>
        <p>Continue with current settings. We'll ask again later.</p>
      </div>
      
      <h4>Contact Us</h4>
      <p>Questions about our cookie policy? Contact us through:</p>
      <ul>
        <li>Platform settings → Privacy & Data</li>
        <li>Help section → Data & Privacy</li>
        <li>Support team through the Platform</li>
      </ul>
      
      <p><strong>Your privacy matters to us. Choose the option that you're most comfortable with.</strong></p>
    `
  };

  return (
    <div className="terms-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="terms-modal">
        <div className="terms-modal-header">
          <h2>{cookiesContent.title}</h2>
          <button 
            className="terms-modal-close" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div 
          className="terms-modal-content"
          onScroll={handleScroll}
          ref={contentRef}
        >
          <div 
            className="terms-content"
            dangerouslySetInnerHTML={{ __html: cookiesContent.content }}
          />
        </div>
        
        <div className="terms-modal-footer">
          <div className="terms-scroll-indicator">
            {!hasScrolledToBottom && (
              <div>
                <p className="scroll-reminder">
                  📜 Please scroll to the bottom to read all information and enable action buttons
                </p>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    if (contentRef.current) {
                      contentRef.current.scrollTop = contentRef.current.scrollHeight;
                    }
                  }}
                  style={{ marginTop: '8px', fontSize: '0.85rem', padding: '6px 12px' }}
                >
                  Skip to Bottom ⬇️
                </button>
              </div>
            )}
          </div>
          
          <div className="terms-modal-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary"
              onClick={handleDecline}
              disabled={!hasScrolledToBottom || isAccepting}
              title={!hasScrolledToBottom ? 'Please scroll to the bottom to enable this button' : 'Use only essential cookies'}
            >
              Essential Only
            </button>
            
            <button 
              className="btn btn-outline"
              onClick={handleDismiss}
              disabled={!hasScrolledToBottom}
              title={!hasScrolledToBottom ? 'Please scroll to the bottom to enable this button' : 'Dismiss for now'}
            >
              Dismiss
            </button>
            
            <button 
              className={`btn btn-primary ${!hasScrolledToBottom ? 'disabled' : ''}`}
              onClick={handleAccept}
              disabled={!hasScrolledToBottom || isAccepting}
              title={!hasScrolledToBottom ? 'Please scroll to the bottom to enable this button' : 'Accept all cookies'}
            >
              {isAccepting ? 'Accepting...' : !hasScrolledToBottom ? 'Scroll to Accept' : 'Accept All Cookies'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiesModal;