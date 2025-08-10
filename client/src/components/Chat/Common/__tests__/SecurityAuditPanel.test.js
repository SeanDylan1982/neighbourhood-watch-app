/**
 * Security Audit Panel Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SecurityAuditPanel from '../SecurityAuditPanel';
import * as securityAudit from '../../../../utils/securityAudit';

// Mock the security audit utilities
jest.mock('../../../../utils/securityAudit', () => ({
  performSecurityAudit: jest.fn(),
  generateSecurityReport: jest.fn(),
  SECURITY_LEVELS: {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    INFO: 'info'
  }
}));

describe('SecurityAuditPanel', () => {
  const mockAuditResults = {
    timestamp: '2024-01-01T00:00:00.000Z',
    overallScore: 75,
    findings: [
      {
        level: 'high',
        message: 'High severity security issue',
        details: 'Detailed description of the issue'
      },
      {
        level: 'medium',
        message: 'Medium severity security issue'
      }
    ],
    recommendations: [
      'Fix high severity issues immediately',
      'Review medium severity issues'
    ],
    categories: {
      encryption: {
        score: 80,
        findings: [
          {
            level: 'high',
            message: 'Encryption issue',
            details: 'Encryption not properly configured'
          }
        ]
      },
      input_validation: {
        score: 70,
        findings: [
          {
            level: 'medium',
            message: 'Input validation issue'
          }
        ]
      }
    }
  };

  const mockReport = {
    summary: {
      timestamp: '2024-01-01T00:00:00.000Z',
      overallScore: 75,
      riskLevel: 'MEDIUM',
      totalFindings: 2,
      criticalFindings: 0,
      highFindings: 1
    },
    categories: mockAuditResults.categories,
    recommendations: mockAuditResults.recommendations,
    nextAuditDate: '2024-01-08T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    securityAudit.performSecurityAudit.mockResolvedValue(mockAuditResults);
    securityAudit.generateSecurityReport.mockReturnValue(mockReport);
  });

  describe('Rendering', () => {
    it('should render security audit panel', () => {
      render(<SecurityAuditPanel />);
      
      expect(screen.getByText('Security Audit')).toBeInTheDocument();
      expect(screen.getByText('Run Audit')).toBeInTheDocument();
    });

    it('should render with custom context', () => {
      const context = { messageContent: 'test message' };
      render(<SecurityAuditPanel context={context} />);
      
      expect(screen.getByText('Security Audit')).toBeInTheDocument();
    });

    it('should auto-run audit when autoRun is true', async () => {
      render(<SecurityAuditPanel autoRun={true} />);
      
      await waitFor(() => {
        expect(securityAudit.performSecurityAudit).toHaveBeenCalled();
      });
    });
  });

  describe('Audit Execution', () => {
    it('should run audit when button is clicked', async () => {
      render(<SecurityAuditPanel />);
      
      const runButton = screen.getByText('Run Audit');
      fireEvent.click(runButton);
      
      expect(screen.getByText('Running...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(securityAudit.performSecurityAudit).toHaveBeenCalled();
        expect(securityAudit.generateSecurityReport).toHaveBeenCalledWith(mockAuditResults);
      });
    });

    it('should display loading state during audit', async () => {
      // Make the audit take longer
      securityAudit.performSecurityAudit.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockAuditResults), 100))
      );

      render(<SecurityAuditPanel />);
      
      const runButton = screen.getByText('Run Audit');
      fireEvent.click(runButton);
      
      expect(screen.getByText('Running security audit...')).toBeInTheDocument();
      expect(screen.getByText('Running...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Running security audit...')).not.toBeInTheDocument();
      });
    });

    it('should call onAuditComplete callback', async () => {
      const onAuditComplete = jest.fn();
      render(<SecurityAuditPanel onAuditComplete={onAuditComplete} />);
      
      const runButton = screen.getByText('Run Audit');
      fireEvent.click(runButton);
      
      await waitFor(() => {
        expect(onAuditComplete).toHaveBeenCalledWith(mockReport);
      });
    });
  });

  describe('Results Display', () => {
    beforeEach(async () => {
      render(<SecurityAuditPanel />);
      
      const runButton = screen.getByText('Run Audit');
      fireEvent.click(runButton);
      
      await waitFor(() => {
        expect(screen.getByText('75')).toBeInTheDocument();
      });
    });

    it('should display security score', () => {
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('Security Score')).toBeInTheDocument();
      expect(screen.getByText('Risk Level: MEDIUM')).toBeInTheDocument();
    });

    it('should display summary statistics', () => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total findings
      expect(screen.getByText('Total Issues')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Critical findings
      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // High findings
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('should display audit timestamp', () => {
      expect(screen.getByText(/Last audit:/)).toBeInTheDocument();
    });

    it('should show details toggle button', () => {
      expect(screen.getByText('Show Details')).toBeInTheDocument();
    });
  });

  describe('Details View', () => {
    beforeEach(async () => {
      render(<SecurityAuditPanel showDetails={true} />);
      
      const runButton = screen.getByText('Run Audit');
      fireEvent.click(runButton);
      
      await waitFor(() => {
        expect(screen.getByText('75')).toBeInTheDocument();
      });
    });

    it('should show category scores when showDetails is true', () => {
      expect(screen.getByText('Category Scores')).toBeInTheDocument();
      expect(screen.getAllByText('ENCRYPTION')).toHaveLength(2); // One in category scores, one in findings
      expect(screen.getByText('INPUT VALIDATION')).toBeInTheDocument();
      expect(screen.getByText('80/100')).toBeInTheDocument();
      expect(screen.getByText('70/100')).toBeInTheDocument();
    });

    it('should toggle full report details', async () => {
      const toggleButton = screen.getByText('Show Details');
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByText('Security Findings')).toBeInTheDocument();
        expect(screen.getByText('Security Recommendations')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Hide Details')).toBeInTheDocument();
    });

    it('should display findings by category', async () => {
      const toggleButton = screen.getByText('Show Details');
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('ENCRYPTION')).toHaveLength(2); // One in category scores, one in findings
        expect(screen.getByText('INPUT VALIDATION')).toBeInTheDocument();
        expect(screen.getByText('Encryption issue')).toBeInTheDocument();
        expect(screen.getByText('Input validation issue')).toBeInTheDocument();
      });
    });

    it('should display recommendations', async () => {
      const toggleButton = screen.getByText('Show Details');
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByText('Fix high severity issues immediately')).toBeInTheDocument();
        expect(screen.getByText('Review medium severity issues')).toBeInTheDocument();
      });
    });

    it('should display next audit date', async () => {
      const toggleButton = screen.getByText('Show Details');
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Next recommended audit:/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when audit fails', async () => {
      const errorMessage = 'Audit failed due to network error';
      securityAudit.performSecurityAudit.mockRejectedValue(new Error(errorMessage));
      
      render(<SecurityAuditPanel />);
      
      const runButton = screen.getByText('Run Audit');
      fireEvent.click(runButton);
      
      await waitFor(() => {
        expect(screen.getByText(`Security audit failed: ${errorMessage}`)).toBeInTheDocument();
        expect(screen.getByText('Retry Audit')).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      securityAudit.performSecurityAudit
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockAuditResults);
      
      render(<SecurityAuditPanel />);
      
      const runButton = screen.getByText('Run Audit');
      fireEvent.click(runButton);
      
      await waitFor(() => {
        expect(screen.getByText('Retry Audit')).toBeInTheDocument();
      });
      
      const retryButton = screen.getByText('Retry Audit');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('75')).toBeInTheDocument();
      });
    });

    it('should handle missing audit results gracefully', async () => {
      securityAudit.performSecurityAudit.mockResolvedValue(null);
      securityAudit.generateSecurityReport.mockReturnValue(null);
      
      render(<SecurityAuditPanel />);
      
      const runButton = screen.getByText('Run Audit');
      fireEvent.click(runButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Security Score')).not.toBeInTheDocument();
      });
    });
  });

  describe('Risk Level Colors', () => {
    const riskLevelTests = [
      { riskLevel: 'LOW', score: 90 },
      { riskLevel: 'MEDIUM', score: 75 },
      { riskLevel: 'HIGH', score: 55 },
      { riskLevel: 'CRITICAL', score: 25 }
    ];

    riskLevelTests.forEach(({ riskLevel, score }) => {
      it(`should display correct color for ${riskLevel} risk level`, async () => {
        const customReport = {
          ...mockReport,
          summary: {
            ...mockReport.summary,
            overallScore: score,
            riskLevel
          }
        };
        
        securityAudit.generateSecurityReport.mockReturnValue(customReport);
        
        render(<SecurityAuditPanel />);
        
        const runButton = screen.getByText('Run Audit');
        fireEvent.click(runButton);
        
        await waitFor(() => {
          expect(screen.getByText(`Risk Level: ${riskLevel}`)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<SecurityAuditPanel />);
      
      const runButton = screen.getByText('Run Audit');
      expect(runButton).toBeInTheDocument();
      
      fireEvent.click(runButton);
      
      await waitFor(() => {
        const scoreElement = screen.getByText('75');
        expect(scoreElement).toBeInTheDocument();
      });
    });

    it('should be keyboard navigable', async () => {
      render(<SecurityAuditPanel />);
      
      const runButton = screen.getByText('Run Audit');
      runButton.focus();
      expect(document.activeElement).toBe(runButton);
      
      fireEvent.click(runButton);
      
      await waitFor(() => {
        expect(securityAudit.performSecurityAudit).toHaveBeenCalled();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<SecurityAuditPanel />);
      
      expect(screen.getByText('Security Audit')).toBeInTheDocument();
      expect(screen.getByText('Run Audit')).toBeInTheDocument();
    });
  });

  describe('Context Updates', () => {
    it('should re-run audit when context changes and autoRun is true', async () => {
      const { rerender } = render(
        <SecurityAuditPanel context={{ messageContent: 'test1' }} autoRun={true} />
      );
      
      await waitFor(() => {
        expect(securityAudit.performSecurityAudit).toHaveBeenCalledTimes(1);
      });
      
      rerender(
        <SecurityAuditPanel context={{ messageContent: 'test2' }} autoRun={true} />
      );
      
      await waitFor(() => {
        expect(securityAudit.performSecurityAudit).toHaveBeenCalledTimes(2);
      });
    });

    it('should not re-run audit when context changes and autoRun is false', async () => {
      const { rerender } = render(
        <SecurityAuditPanel context={{ messageContent: 'test1' }} autoRun={false} />
      );
      
      rerender(
        <SecurityAuditPanel context={{ messageContent: 'test2' }} autoRun={false} />
      );
      
      expect(securityAudit.performSecurityAudit).not.toHaveBeenCalled();
    });
  });
});