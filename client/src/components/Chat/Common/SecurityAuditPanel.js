/**
 * Security Audit Panel Component
 * Displays security audit results and recommendations
 */

import React, { useState, useEffect } from 'react';
import { performSecurityAudit, generateSecurityReport, SECURITY_LEVELS } from '../../../utils/securityAudit';
import './SecurityAuditPanel.css';

const SecurityAuditPanel = ({ 
  context = {}, 
  onAuditComplete, 
  showDetails = false,
  autoRun = false 
}) => {
  const [auditResults, setAuditResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFullReport, setShowFullReport] = useState(false);

  useEffect(() => {
    if (autoRun) {
      runSecurityAudit();
    }
  }, [autoRun, context]);

  const runSecurityAudit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await performSecurityAudit(context);
      const report = generateSecurityReport(results);
      
      setAuditResults(report);
      
      if (onAuditComplete) {
        onAuditComplete(report);
      }
    } catch (err) {
      setError(`Security audit failed: ${err.message}`);
      console.error('Security audit error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'LOW': return '#4CAF50';
      case 'MEDIUM': return '#FF9800';
      case 'HIGH': return '#FF5722';
      case 'CRITICAL': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getSeverityColor = (level) => {
    switch (level) {
      case SECURITY_LEVELS.CRITICAL: return '#F44336';
      case SECURITY_LEVELS.HIGH: return '#FF5722';
      case SECURITY_LEVELS.MEDIUM: return '#FF9800';
      case SECURITY_LEVELS.LOW: return '#FFC107';
      case SECURITY_LEVELS.INFO: return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getSeverityIcon = (level) => {
    switch (level) {
      case SECURITY_LEVELS.CRITICAL: return '🚨';
      case SECURITY_LEVELS.HIGH: return '⚠️';
      case SECURITY_LEVELS.MEDIUM: return '⚡';
      case SECURITY_LEVELS.LOW: return 'ℹ️';
      case SECURITY_LEVELS.INFO: return '💡';
      default: return '❓';
    }
  };

  const renderSecurityScore = () => {
    if (!auditResults) return null;

    const { overallScore, riskLevel } = auditResults.summary;
    const scoreColor = getRiskLevelColor(riskLevel);

    return (
      <div className="security-score">
        <div className="score-circle" style={{ borderColor: scoreColor }}>
          <span className="score-value" style={{ color: scoreColor }}>
            {overallScore}
          </span>
          <span className="score-label">Security Score</span>
        </div>
        <div className="risk-level" style={{ color: scoreColor }}>
          Risk Level: {riskLevel}
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    if (!auditResults) return null;

    const { summary } = auditResults;

    return (
      <div className="audit-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-value">{summary.totalFindings}</span>
            <span className="stat-label">Total Issues</span>
          </div>
          <div className="stat-item critical">
            <span className="stat-value">{summary.criticalFindings}</span>
            <span className="stat-label">Critical</span>
          </div>
          <div className="stat-item high">
            <span className="stat-value">{summary.highFindings}</span>
            <span className="stat-label">High</span>
          </div>
        </div>
        <div className="audit-timestamp">
          Last audit: {new Date(summary.timestamp).toLocaleString()}
        </div>
      </div>
    );
  };

  const renderFindings = () => {
    if (!auditResults || !showFullReport) return null;

    const findingsByCategory = {};
    
    // Group findings by category
    Object.entries(auditResults.categories).forEach(([category, categoryData]) => {
      if (categoryData.findings && categoryData.findings.length > 0) {
        findingsByCategory[category] = categoryData.findings;
      }
    });

    return (
      <div className="audit-findings">
        <h4>Security Findings</h4>
        {Object.entries(findingsByCategory).map(([category, findings]) => (
          <div key={category} className="category-findings">
            <h5 className="category-title">
              {category.replace(/_/g, ' ').toUpperCase()}
            </h5>
            {findings.map((finding, index) => (
              <div 
                key={index} 
                className={`finding-item ${finding.level}`}
                style={{ borderLeftColor: getSeverityColor(finding.level) }}
              >
                <div className="finding-header">
                  <span className="finding-icon">
                    {getSeverityIcon(finding.level)}
                  </span>
                  <span className="finding-level" style={{ color: getSeverityColor(finding.level) }}>
                    {finding.level.toUpperCase()}
                  </span>
                </div>
                <div className="finding-message">{finding.message}</div>
                {finding.details && (
                  <div className="finding-details">{finding.details}</div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!auditResults || !auditResults.recommendations.length || !showFullReport) return null;

    return (
      <div className="audit-recommendations">
        <h4>Security Recommendations</h4>
        <ul className="recommendations-list">
          {auditResults.recommendations.map((recommendation, index) => (
            <li key={index} className="recommendation-item">
              <span className="recommendation-icon">💡</span>
              {recommendation}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderCategoryScores = () => {
    if (!auditResults || !showFullReport) return null;

    return (
      <div className="category-scores">
        <h4>Category Scores</h4>
        <div className="scores-grid">
          {Object.entries(auditResults.categories).map(([category, data]) => (
            <div key={category} className="category-score">
              <div className="category-name">
                {category.replace(/_/g, ' ').toUpperCase()}
              </div>
              <div className="category-score-value">
                {data.score || 0}/100
              </div>
              <div className="category-score-bar">
                <div 
                  className="score-fill"
                  style={{ 
                    width: `${data.score || 0}%`,
                    backgroundColor: data.score >= 80 ? '#4CAF50' : 
                                   data.score >= 60 ? '#FF9800' : '#F44336'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="security-audit-panel error">
        <div className="error-message">
          <span className="error-icon">❌</span>
          {error}
        </div>
        <button 
          className="retry-button"
          onClick={runSecurityAudit}
          disabled={isLoading}
        >
          Retry Audit
        </button>
      </div>
    );
  }

  return (
    <div className="security-audit-panel">
      <div className="audit-header">
        <h3>Security Audit</h3>
        <div className="audit-actions">
          {!autoRun && (
            <button 
              className="run-audit-button"
              onClick={runSecurityAudit}
              disabled={isLoading}
            >
              {isLoading ? 'Running...' : 'Run Audit'}
            </button>
          )}
          {auditResults && (
            <button 
              className="toggle-details-button"
              onClick={() => setShowFullReport(!showFullReport)}
            >
              {showFullReport ? 'Hide Details' : 'Show Details'}
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="audit-loading">
          <div className="loading-spinner" />
          <span>Running security audit...</span>
        </div>
      )}

      {auditResults && (
        <div className="audit-content">
          {renderSecurityScore()}
          {renderSummary()}
          {showDetails && renderCategoryScores()}
          {renderFindings()}
          {renderRecommendations()}
          
          {auditResults.nextAuditDate && (
            <div className="next-audit">
              Next recommended audit: {new Date(auditResults.nextAuditDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SecurityAuditPanel;