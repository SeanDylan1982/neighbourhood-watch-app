import React, { useState } from 'react';
import useReporting from '../../../hooks/useReporting';
import './ReportingInterface.css';

/**
 * Component for reporting messages and users
 */
const ReportingInterface = ({ 
  type, // 'message' or 'user'
  targetId, // messageId or userId
  chatId,
  currentUserId,
  onClose,
  onReportSubmitted 
}) => {
  const { reportMessage, reportUser, isLoading, error } = useReporting(currentUserId);
  
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = {
    message: [
      { value: 'spam', label: 'Spam or unwanted messages' },
      { value: 'harassment', label: 'Harassment or bullying' },
      { value: 'hate_speech', label: 'Hate speech or discrimination' },
      { value: 'inappropriate_content', label: 'Inappropriate or offensive content' },
      { value: 'threats', label: 'Threats or violence' },
      { value: 'scam', label: 'Scam or fraud' },
      { value: 'other', label: 'Other' },
    ],
    user: [
      { value: 'harassment', label: 'Harassment or bullying' },
      { value: 'spam', label: 'Sending spam messages' },
      { value: 'impersonation', label: 'Impersonation or fake account' },
      { value: 'inappropriate_behavior', label: 'Inappropriate behavior' },
      { value: 'hate_speech', label: 'Hate speech or discrimination' },
      { value: 'threats', label: 'Threats or violence' },
      { value: 'other', label: 'Other' },
    ],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason) {
      alert('Please select a reason for reporting.');
      return;
    }

    setIsSubmitting(true);

    try {
      let success = false;
      
      if (type === 'message') {
        success = await reportMessage(targetId, chatId, selectedReason, description);
      } else if (type === 'user') {
        success = await reportUser(targetId, selectedReason, description);
      }

      if (success) {
        onReportSubmitted?.();
        onClose();
      }
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    return type === 'message' ? 'Report Message' : 'Report User';
  };

  const getDescription = () => {
    if (type === 'message') {
      return 'Help us understand what\'s wrong with this message. Your report will be reviewed by our moderation team.';
    }
    return 'Help us understand what\'s wrong with this user\'s behavior. Your report will be reviewed by our moderation team.';
  };

  return (
    <div className="reporting-interface">
      <div className="reporting-interface__header">
        <h3>{getTitle()}</h3>
        <button 
          className="reporting-interface__close"
          onClick={onClose}
          aria-label="Close reporting interface"
        >
          ✕
        </button>
      </div>

      <div className="reporting-interface__content">
        <div className="reporting-interface__description">
          <p>{getDescription()}</p>
        </div>

        {error && (
          <div className="reporting-interface__error">
            <span className="reporting-interface__error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="reporting-interface__form">
          <div className="reporting-interface__field">
            <label className="reporting-interface__label">
              Reason for reporting *
            </label>
            <div className="reporting-interface__reasons">
              {reportReasons[type]?.map(reason => (
                <label key={reason.value} className="reporting-interface__reason">
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="reporting-interface__reason-input"
                  />
                  <span className="reporting-interface__reason-label">
                    {reason.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="reporting-interface__field">
            <label htmlFor="description" className="reporting-interface__label">
              Additional details (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional context that might help us understand the issue..."
              className="reporting-interface__textarea"
              rows={4}
              maxLength={500}
            />
            <div className="reporting-interface__char-count">
              {description.length}/500
            </div>
          </div>

          <div className="reporting-interface__actions">
            <button
              type="button"
              onClick={onClose}
              className="reporting-interface__cancel"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="reporting-interface__submit"
              disabled={!selectedReason || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>

        <div className="reporting-interface__info">
          <h4>What happens next?</h4>
          <ul>
            <li>Your report will be reviewed by our moderation team</li>
            <li>We'll take appropriate action if we find a violation</li>
            <li>Your identity will remain anonymous to the reported user</li>
            <li>You may be contacted if we need additional information</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportingInterface;