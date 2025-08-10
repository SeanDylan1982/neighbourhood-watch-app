import React, { useState, useEffect, useRef } from 'react';
import './TermsModal.css';

const TermsModal = ({ 
  isOpen, 
  open,
  onClose, 
  onAccept, 
  onDecline, 
  type = 'noticeBoard',
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
      console.error('Error accepting terms:', error);
      // Handle error - could show a toast notification
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    onDecline();
  };

  const getTermsContent = () => {
    if (type === 'terms' || type === 'termsAndConditions') {
      return {
        title: 'Terms and Conditions',
        content: `
          <h3>neibrly Community Platform Terms and Conditions</h3>
          
          <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
          
          <h4>1. Acceptance of Terms</h4>
          <p>By accessing and using the neibrly Community Platform ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
          
          <h4>2. Description of Service</h4>
          <p>The Platform provides a digital community space for neighbourhood residents to:</p>
          <ul>
            <li>Share community notices and announcements</li>
            <li>Report safety and security concerns</li>
            <li>Communicate with neighbours through messaging</li>
            <li>Access neighbourhood-specific information and resources</li>
          </ul>
          
          <h4>3. User Registration and Accounts</h4>
          <ul>
            <li><strong>Eligibility:</strong> You must be 18 years or older and a resident of the registered neighbourhood</li>
            <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials</li>
            <li><strong>Accurate Information:</strong> You agree to provide accurate, current, and complete information during registration</li>
            <li><strong>Single Account:</strong> Each user may maintain only one active account</li>
          </ul>
          
          <h4>4. User Conduct and Content</h4>
          <p>Users agree to:</p>
          <ul>
            <li>Use the Platform in a respectful and lawful manner</li>
            <li>Not post content that is offensive, discriminatory, or harmful</li>
            <li>Respect the privacy and rights of other community members</li>
            <li>Not use the Platform for commercial solicitation without permission</li>
            <li>Report genuine safety concerns and community issues</li>
            <li>Maintain the confidentiality of sensitive community information</li>
          </ul>
          
          <h4>5. Content Ownership and License</h4>
          <ul>
            <li><strong>User Content:</strong> You retain ownership of content you post but grant the Platform a license to display and distribute it within the community</li>
            <li><strong>Platform Content:</strong> The Platform's design, features, and functionality are owned by the service provider</li>
            <li><strong>Content Removal:</strong> We reserve the right to remove content that violates these terms</li>
          </ul>
          
          <h4>6. Privacy and Data Protection</h4>
          <ul>
            <li>Your privacy is important to us. Please review our Privacy Policy for details on data collection and use</li>
            <li>We implement appropriate security measures to protect your personal information</li>
            <li>Community-specific information may be shared with local authorities when required by law</li>
          </ul>
          
          <h4>7. Community Moderation</h4>
          <ul>
            <li>Community moderators and administrators help maintain platform standards</li>
            <li>Violations may result in content removal, account suspension, or termination</li>
            <li>Appeals process is available for moderation decisions</li>
          </ul>
          
          <h4>8. Limitation of Liability</h4>
          <ul>
            <li>The Platform is provided "as is" without warranties of any kind</li>
            <li>We are not liable for user-generated content or interactions between users</li>
            <li>Users participate at their own risk and responsibility</li>
          </ul>
          
          <h4>9. Emergency Situations</h4>
          <ul>
            <li>For immediate emergencies, contact appropriate emergency services (911, police, fire, medical)</li>
            <li>The Platform is not a substitute for emergency services</li>
            <li>Community reports may be forwarded to authorities when appropriate</li>
          </ul>
          
          <h4>10. Termination</h4>
          <ul>
            <li>You may terminate your account at any time</li>
            <li>We may suspend or terminate accounts for violations of these terms</li>
            <li>Upon termination, your access to the Platform will cease</li>
          </ul>
          
          <h4>11. Changes to Terms</h4>
          <p>We reserve the right to modify these terms at any time. Users will be notified of significant changes and continued use constitutes acceptance of modified terms.</p>
          
          <h4>12. Contact Information</h4>
          <p>For questions about these terms, please contact our support team through the Platform's help section.</p>
          
          <p><strong>By clicking "Accept", you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</strong></p>
        `
      };
    } else if (type === 'privacy' || type === 'privacyPolicy') {
      return {
        title: 'Privacy Policy',
        content: `
          <h3>neibrly Community Platform Privacy Policy</h3>
          
          <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
          
          <h4>1. Information We Collect</h4>
          
          <h5>Personal Information:</h5>
          <ul>
            <li><strong>Registration Data:</strong> Name, email address, phone number, home address (for neighbourhood verification)</li>
            <li><strong>Profile Information:</strong> Optional profile photo, bio, and contact preferences</li>
            <li><strong>Verification Data:</strong> Documents or information used to verify neighbourhood residency</li>
          </ul>
          
          <h5>Content and Communications:</h5>
          <ul>
            <li><strong>Posts and Messages:</strong> Content you share on notice boards, reports, and private messages</li>
            <li><strong>Media Files:</strong> Photos, videos, and documents you upload</li>
            <li><strong>Community Interactions:</strong> Comments, likes, and other engagement activities</li>
          </ul>
          
          <h5>Technical Information:</h5>
          <ul>
            <li><strong>Device Data:</strong> IP address, browser type, device identifiers</li>
            <li><strong>Usage Analytics:</strong> How you interact with the Platform, features used, time spent</li>
            <li><strong>Location Data:</strong> General location for neighbourhood-specific content (with your consent)</li>
          </ul>
          
          <h4>2. How We Use Your Information</h4>
          
          <h5>Platform Functionality:</h5>
          <ul>
            <li>Verify neighbourhood residency and maintain community integrity</li>
            <li>Enable communication between verified neighbours</li>
            <li>Display relevant neighbourhood-specific content and notices</li>
            <li>Process and respond to safety reports and community concerns</li>
          </ul>
          
          <h5>Safety and Security:</h5>
          <ul>
            <li>Monitor for inappropriate content and behaviour</li>
            <li>Investigate reported violations and safety concerns</li>
            <li>Cooperate with law enforcement when legally required</li>
            <li>Maintain platform security and prevent abuse</li>
          </ul>
          
          <h5>Communication:</h5>
          <ul>
            <li>Send important platform updates and security notifications</li>
            <li>Provide customer support and respond to inquiries</li>
            <li>Share community announcements and emergency alerts</li>
          </ul>
          
          <h4>3. Information Sharing and Disclosure</h4>
          
          <h5>Within Your Neighbourhood:</h5>
          <ul>
            <li>Your profile information is visible to verified neighbours in your community</li>
            <li>Posts and reports are shared with your neighbourhood community</li>
            <li>Community moderators can access content for moderation purposes</li>
          </ul>
          
          <h5>With Authorities:</h5>
          <ul>
            <li>Safety reports may be forwarded to local police or emergency services</li>
            <li>We comply with legal requests and court orders</li>
            <li>Emergency situations may require immediate information sharing</li>
          </ul>
          
          <h5>Service Providers:</h5>
          <ul>
            <li>Trusted third-party services that help operate the Platform</li>
            <li>Cloud storage and hosting providers (with appropriate security measures)</li>
            <li>Analytics services to improve Platform functionality</li>
          </ul>
          
          <h4>4. Data Security</h4>
          <ul>
            <li><strong>Encryption:</strong> Data is encrypted in transit and at rest</li>
            <li><strong>Access Controls:</strong> Strict access controls limit who can view your information</li>
            <li><strong>Regular Audits:</strong> Security practices are regularly reviewed and updated</li>
            <li><strong>Incident Response:</strong> Procedures in place to respond to security breaches</li>
          </ul>
          
          <h4>5. Your Privacy Rights</h4>
          
          <h5>Access and Control:</h5>
          <ul>
            <li><strong>View Your Data:</strong> Request a copy of personal information we hold</li>
            <li><strong>Update Information:</strong> Correct or update your profile and preferences</li>
            <li><strong>Delete Content:</strong> Remove posts, messages, and uploaded media</li>
            <li><strong>Account Deletion:</strong> Permanently delete your account and associated data</li>
          </ul>
          
          <h5>Communication Preferences:</h5>
          <ul>
            <li>Control what notifications you receive and how</li>
            <li>Opt out of non-essential communications</li>
            <li>Manage privacy settings for profile visibility</li>
          </ul>
          
          <h4>6. Data Retention</h4>
          <ul>
            <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
            <li><strong>Deleted Accounts:</strong> Most data deleted within 30 days of account closure</li>
            <li><strong>Safety Records:</strong> Some safety-related information may be retained longer for community protection</li>
            <li><strong>Legal Requirements:</strong> Data may be retained longer when required by law</li>
          </ul>
          
          <h4>7. Children's Privacy</h4>
          <ul>
            <li>The Platform is not intended for users under 18 years of age</li>
            <li>We do not knowingly collect information from children</li>
            <li>Parents should monitor their children's online activities</li>
          </ul>
          
          <h4>8. International Data Transfers</h4>
          <ul>
            <li>Data may be processed in countries other than your residence</li>
            <li>Appropriate safeguards are in place to protect your information</li>
            <li>Data protection standards are maintained regardless of location</li>
          </ul>
          
          <h4>9. Changes to This Policy</h4>
          <ul>
            <li>We may update this Privacy Policy periodically</li>
            <li>Significant changes will be communicated to users</li>
            <li>Continued use after changes constitutes acceptance</li>
          </ul>
          
          <h4>10. Contact Us</h4>
          <p>For privacy-related questions or to exercise your rights:</p>
          <ul>
            <li>Use the Platform's privacy settings and help section</li>
            <li>Contact our support team through the Platform</li>
            <li>Email our privacy team (contact information available in Platform settings)</li>
          </ul>
          
          <p><strong>By clicking "Accept", you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and sharing of your information as described.</strong></p>
        `
      };
    } else if (type === 'noticeBoard') {
      return {
        title: 'Notice Board Terms and Conditions',
        content: `
          <h3>Community Notice Board Guidelines</h3>
          
          <p>By posting on the community notice board, you agree to the following terms and conditions:</p>
          
          <h4>1. Prohibited Content</h4>
          <ul>
            <li><strong>No Solicitation:</strong> Commercial advertising, business promotion, or selling of goods and services is strictly prohibited.</li>
            <li><strong>No Spam:</strong> Repetitive, irrelevant, or unsolicited content is not allowed.</li>
            <li><strong>No Inappropriate Content:</strong> Content that is offensive, discriminatory, threatening, or inappropriate for a community setting is prohibited.</li>
            <li><strong>No Misinformation:</strong> False, misleading, or unverified information that could harm the community is not allowed.</li>
          </ul>
          
          <h4>2. Acceptable Use</h4>
          <ul>
            <li><strong>Community Events:</strong> Information about local community events, meetings, and gatherings.</li>
            <li><strong>Lost and Found:</strong> Posts about lost or found items within the neighbourhood.</li>
            <li><strong>Community Announcements:</strong> Important information relevant to neighbourhood residents.</li>
            <li><strong>Neighbourhood Updates:</strong> Information about local developments, road closures, or community improvements.</li>
          </ul>
          
          <h4>3. Content Standards</h4>
          <ul>
            <li>Keep posts relevant to the local community</li>
            <li>Use clear, respectful language</li>
            <li>Include accurate contact information when appropriate</li>
            <li>Respect privacy and confidentiality</li>
          </ul>
          
          <h4>4. Moderation</h4>
          <p>Community moderators and administrators reserve the right to:</p>
          <ul>
            <li>Remove posts that violate these guidelines</li>
            <li>Edit posts for clarity or compliance</li>
            <li>Suspend or ban users who repeatedly violate terms</li>
            <li>Take appropriate action to maintain community standards</li>
          </ul>
          
          <h4>5. Liability</h4>
          <p>Users are responsible for the accuracy and legality of their posts. The platform is not liable for user-generated content or any consequences arising from posted information.</p>
          
          <h4>6. Privacy</h4>
          <p>Do not share personal information of others without consent. Be mindful of your own privacy when posting contact details or personal information.</p>
          
          <p><strong>By clicking "Accept", you acknowledge that you have read, understood, and agree to comply with these terms and conditions.</strong></p>
        `
      };
    } else if (type === 'report' || type === 'reports') {
      return {
        title: 'Community Reports Terms and Conditions',
        content: `
          <h3>Community Safety Reports Guidelines</h3>
          
          <p>By submitting a community safety report, you agree to the following terms and conditions:</p>
          
          <h4>1. Report Requirements</h4>
          <ul>
            <li><strong>Factual Information:</strong> All reports must contain accurate, factual information to the best of your knowledge.</li>
            <li><strong>Relevant Sources:</strong> When possible, include sources, evidence, or references to support your report.</li>
            <li><strong>Clear Description:</strong> Provide clear, detailed descriptions of incidents or concerns.</li>
            <li><strong>Appropriate Evidence:</strong> Include photos, videos, or documents only if legally obtained and relevant.</li>
          </ul>
          
          <h4>2. Prohibited Reports</h4>
          <ul>
            <li><strong>False Reports:</strong> Knowingly submitting false, misleading, or fabricated information is strictly prohibited.</li>
            <li><strong>Defamatory Content:</strong> Reports that unfairly damage someone's reputation without factual basis are not allowed.</li>
            <li><strong>Personal Disputes:</strong> Use appropriate channels for personal conflicts rather than community reports.</li>
            <li><strong>Non-Safety Issues:</strong> Reports should focus on genuine safety, security, or community welfare concerns.</li>
          </ul>
          
          <h4>3. Appropriate Report Types</h4>
          <ul>
            <li><strong>Safety Hazards:</strong> Dangerous conditions, broken infrastructure, or environmental hazards</li>
            <li><strong>Security Concerns:</strong> Suspicious activities, security breaches, or safety threats</li>
            <li><strong>Community Issues:</strong> Problems affecting neighbourhood welfare or quality of life</li>
            <li><strong>Emergency Situations:</strong> Urgent matters requiring immediate community attention</li>
          </ul>
          
          <h4>4. Evidence and Documentation</h4>
          <ul>
            <li>Include timestamps and locations when relevant</li>
            <li>Provide witness information if available and consented</li>
            <li>Attach supporting documentation when appropriate</li>
            <li>Respect privacy laws when including photos or videos</li>
          </ul>
          
          <h4>5. Legal Considerations</h4>
          <ul>
            <li><strong>Emergency Services:</strong> For immediate emergencies, contact appropriate emergency services first</li>
            <li><strong>Legal Compliance:</strong> Ensure all reports comply with local laws and regulations</li>
            <li><strong>Confidentiality:</strong> Respect confidential information and privacy rights</li>
            <li><strong>Cooperation:</strong> Be prepared to cooperate with authorities if required</li>
          </ul>
          
          <h4>6. Review and Action</h4>
          <p>Community moderators and administrators will:</p>
          <ul>
            <li>Review all reports for accuracy and appropriateness</li>
            <li>Take appropriate action based on report severity</li>
            <li>Forward reports to relevant authorities when necessary</li>
            <li>Maintain confidentiality as appropriate</li>
          </ul>
          
          <h4>7. Liability and Responsibility</h4>
          <p>Report submitters are responsible for:</p>
          <ul>
            <li>The accuracy and truthfulness of their reports</li>
            <li>Compliance with all applicable laws</li>
            <li>Respecting others' privacy and rights</li>
            <li>Using the reporting system responsibly</li>
          </ul>
          
          <p><strong>By clicking "Accept", you acknowledge that you have read, understood, and agree to comply with these reporting guidelines and accept responsibility for the accuracy of your submissions.</strong></p>
        `
      };
    }
    
    return {
      title: 'Terms and Conditions',
      content: '<p>Please contact support for terms and conditions.</p>'
    };
  };

  // Don't show modal if already accepted or not open
  if (alreadyAccepted || !modalIsOpen) {
    return null;
  }

  const { title, content } = getTermsContent();

  return (
    <div className="terms-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="terms-modal">
        <div className="terms-modal-header">
          <h2>{title}</h2>
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
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
        
        <div className="terms-modal-footer">
          <div className="terms-scroll-indicator">
            {!hasScrolledToBottom && (
              <div>
                <p className="scroll-reminder">
                  📜 Please scroll to the bottom to read all terms and enable the Accept button
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
          
          <div className="terms-modal-actions">
            <button 
              className="btn btn-secondary"
              onClick={handleDecline}
              disabled={isAccepting}
            >
              Decline
            </button>
            <button 
              className={`btn btn-primary ${!hasScrolledToBottom ? 'disabled' : ''}`}
              onClick={handleAccept}
              disabled={!hasScrolledToBottom || isAccepting}
              title={!hasScrolledToBottom ? 'Please scroll to the bottom to enable this button' : ''}
            >
              {isAccepting ? 'Accepting...' : !hasScrolledToBottom ? 'Scroll to Accept' : 'Accept & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;