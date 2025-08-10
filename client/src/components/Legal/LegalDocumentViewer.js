import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './LegalDocumentViewer.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

/**
 * LegalDocumentViewer Component
 * Displays legal documents with acceptance tracking
 */
const LegalDocumentViewer = ({ 
  documentType, 
  showAcceptButton = false,
  onAccept,
  onDecline,
  className = ''
}) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptanceStatus, setAcceptanceStatus] = useState(null);

  /**
   * Get authorization headers for API requests
   */
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  /**
   * Fetch the legal document
   */
  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/legal/${documentType}`);
      
      if (response.data.success) {
        setDocument(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch document');
      }
    } catch (error) {
      console.error('Error fetching legal document:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [documentType]);

  /**
   * Check user's acceptance status
   */
  const checkAcceptanceStatus = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/legal/acceptance/${documentType}`,
        getAuthHeaders()
      );
      
      if (response.data.success) {
        setAcceptanceStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error checking acceptance status:', error);
      // Don't show error for acceptance status check
    }
  }, [documentType]);

  /**
   * Handle document acceptance
   */
  const handleAccept = async () => {
    try {
      setAccepting(true);
      setError(null);

      const response = await axios.post(
        `${API_BASE_URL}/api/legal/accept`,
        { documentType },
        getAuthHeaders()
      );

      if (response.data.success) {
        setAcceptanceStatus({
          accepted: true,
          version: response.data.data.version,
          timestamp: response.data.data.timestamp
        });

        if (onAccept) {
          onAccept(response.data.data);
        }
      } else {
        throw new Error(response.data.message || 'Failed to record acceptance');
      }
    } catch (error) {
      console.error('Error accepting document:', error);
      setError(error.response?.data?.message || error.message || 'Failed to accept document');
    } finally {
      setAccepting(false);
    }
  };

  /**
   * Handle document decline
   */
  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    }
  };

  /**
   * Format document type for display
   */
  const getDocumentTitle = () => {
    const titles = {
      termsOfService: 'Terms of Service',
      privacyPolicy: 'Privacy Policy',
      noticeBoardTerms: 'Notice Board Terms',
      reportTerms: 'Community Reports Terms'
    };
    return titles[documentType] || 'Legal Document';
  };

  /**
   * Get document icon
   */
  const getDocumentIcon = () => {
    const icons = {
      termsOfService: '📋',
      privacyPolicy: '🔒',
      noticeBoardTerms: '📢',
      reportTerms: '📊'
    };
    return icons[documentType] || '📄';
  };

  // Load document and acceptance status on mount
  useEffect(() => {
    fetchDocument();
    
    // Check acceptance status if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      checkAcceptanceStatus();
    }
  }, [checkAcceptanceStatus, documentType, fetchDocument]);

  if (loading) {
    return (
      <div className={`legal-document-viewer loading ${className}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`legal-document-viewer error ${className}`}>
        <div className="error-message">
          <h3>⚠️ Error Loading Document</h3>
          <p>{error}</p>
          <button onClick={fetchDocument} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className={`legal-document-viewer empty ${className}`}>
        <div className="empty-message">
          <h3>📄 Document Not Available</h3>
          <p>The requested legal document is not currently available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`legal-document-viewer ${className}`}>
      <div className="document-header">
        <div className="document-title">
          <span className="document-icon">{getDocumentIcon()}</span>
          <h1>{document.title || getDocumentTitle()}</h1>
        </div>
        
        <div className="document-meta">
          <span className="version">Version {document.version}</span>
          {document.effectiveDate && (
            <span className="effective-date">
              Effective: {new Date(document.effectiveDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {document.summary && (
        <div className="document-summary">
          <p>{document.summary}</p>
        </div>
      )}

      {acceptanceStatus && (
        <div className={`acceptance-status ${acceptanceStatus.accepted ? 'accepted' : 'not-accepted'}`}>
          {acceptanceStatus.accepted ? (
            <div className="status-accepted">
              <span className="status-icon">✅</span>
              <span className="status-text">
                You accepted this document on {new Date(acceptanceStatus.timestamp).toLocaleDateString()}
              </span>
              {acceptanceStatus.needsReAcceptance && (
                <span className="reaccept-notice">
                  ⚠️ A new version is available. Please review and accept the updated terms.
                </span>
              )}
            </div>
          ) : (
            <div className="status-not-accepted">
              <span className="status-icon">⏳</span>
              <span className="status-text">You have not accepted this document</span>
            </div>
          )}
        </div>
      )}

      <div className="document-content">
        <div 
          className="content-html"
          dangerouslySetInnerHTML={{ __html: document.content }}
        />
      </div>

      {document.sections && document.sections.length > 0 && (
        <div className="document-sections">
          <h2>Document Sections</h2>
          {document.sections.map((section, index) => (
            <div key={index} className="document-section">
              <h3>{section.title}</h3>
              <div 
                className="section-content"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </div>
          ))}
        </div>
      )}

      {document.metadata && (
        <div className="document-metadata">
          <h3>Document Information</h3>
          <div className="metadata-grid">
            {document.metadata.language && (
              <div className="metadata-item">
                <strong>Language:</strong> {document.metadata.language.toUpperCase()}
              </div>
            )}
            {document.metadata.jurisdiction && (
              <div className="metadata-item">
                <strong>Jurisdiction:</strong> {document.metadata.jurisdiction}
              </div>
            )}
            {document.metadata.complianceStandards && document.metadata.complianceStandards.length > 0 && (
              <div className="metadata-item">
                <strong>Compliance:</strong> {document.metadata.complianceStandards.join(', ')}
              </div>
            )}
            {document.metadata.lastReviewDate && (
              <div className="metadata-item">
                <strong>Last Review:</strong> {new Date(document.metadata.lastReviewDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}

      {showAcceptButton && (
        <div className="document-actions">
          {error && (
            <div className="action-error">
              <p>{error}</p>
            </div>
          )}
          
          <div className="action-buttons">
            {onDecline && (
              <button 
                className="btn btn-secondary"
                onClick={handleDecline}
                disabled={accepting}
              >
                Decline
              </button>
            )}
            
            <button 
              className={`btn btn-primary ${acceptanceStatus?.accepted && !acceptanceStatus?.needsReAcceptance ? 'accepted' : ''}`}
              onClick={handleAccept}
              disabled={accepting || (acceptanceStatus?.accepted && !acceptanceStatus?.needsReAcceptance)}
            >
              {accepting ? (
                <>
                  <span className="spinner-small"></span>
                  Accepting...
                </>
              ) : acceptanceStatus?.accepted && !acceptanceStatus?.needsReAcceptance ? (
                'Already Accepted'
              ) : acceptanceStatus?.needsReAcceptance ? (
                'Accept Updated Terms'
              ) : (
                'Accept Terms'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalDocumentViewer;