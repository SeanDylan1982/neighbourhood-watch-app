import React, { useState } from 'react';
import LegalDocumentViewer from '../Legal/LegalDocumentViewer';
import './LegalDocumentsSection.css';

/**
 * LegalDocumentsSection Component
 * Provides access to legal documents from the settings page
 */
const LegalDocumentsSection = () => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const legalDocuments = [
    {
      type: 'termsOfService',
      title: 'Terms of Service',
      description: 'Terms and conditions for using neibrly',
      icon: '📋'
    },
    {
      type: 'privacyPolicy',
      title: 'Privacy Policy',
      description: 'How we collect, use, and protect your personal information (POPIA compliant)',
      icon: '🔒'
    },
    {
      type: 'noticeBoardTerms',
      title: 'Notice Board Terms',
      description: 'Guidelines for posting on the community notice board',
      icon: '📢'
    },
    {
      type: 'reportTerms',
      title: 'Community Reports Terms',
      description: 'Guidelines for submitting community safety reports',
      icon: '📊'
    }
  ];

  /**
   * Handle document selection
   */
  const handleDocumentSelect = (documentType) => {
    setSelectedDocument(documentType);
    setShowModal(true);
  };

  /**
   * Handle modal close
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDocument(null);
  };

  /**
   * Handle document acceptance
   */
  const handleDocumentAccept = (acceptanceData) => {
    console.log('Document accepted:', acceptanceData);
    // Could show a success message or update UI
  };

  return (
    <div className="legal-documents-section">
      <div className="section-header">
        <h3>Legal Documents</h3>
        <p>Access important legal documents and policies</p>
      </div>

      <div className="documents-grid">
        {legalDocuments.map((doc) => (
          <div 
            key={doc.type}
            className="document-card"
            onClick={() => handleDocumentSelect(doc.type)}
          >
            <div className="document-icon">
              {doc.icon}
            </div>
            <div className="document-info">
              <h4>{doc.title}</h4>
              <p>{doc.description}</p>
            </div>
            <div className="document-arrow">
              →
            </div>
          </div>
        ))}
      </div>

      <div className="legal-notice">
        <div className="notice-icon">ℹ️</div>
        <div className="notice-content">
          <h4>Important Notice</h4>
          <p>
            These documents govern your use of neibrly. 
            By using our services, you agree to comply with these terms and policies. 
            We recommend reviewing these documents periodically as they may be updated.
          </p>
          <p>
            <strong>POPIA Compliance:</strong> Our Privacy Policy complies with South Africa's 
            Protection of Personal Information Act (POPIA). If you have questions about 
            your data rights, please contact us or the Information Regulator.
          </p>
        </div>
      </div>

      {/* Modal for document viewer */}
      {showModal && selectedDocument && (
        <div className="legal-modal-overlay" onClick={handleCloseModal}>
          <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Legal Document</h2>
              <button 
                className="modal-close"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <LegalDocumentViewer
                documentType={selectedDocument}
                showAcceptButton={true}
                onAccept={handleDocumentAccept}
                className="modal-document-viewer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalDocumentsSection;