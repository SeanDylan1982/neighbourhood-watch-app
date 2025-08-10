import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AdminStats from '../components/Admin/AdminStats';

// Mock the API hook
jest.mock('../hooks/useApi', () => ({
  __esModule: true,
  default: () => ({
    loading: false,
    error: null,
    clearError: jest.fn(),
    getWithRetry: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        users: {
          total: 100,
          active: 90,
          newThisWeek: 10,
          suspended: 5
        },
        content: {
          notices: 50,
          reports: 20,
          chatGroups: 15,
          messages: 500
        },
        engagement: {
          dailyActiveUsers: 30,
          weeklyActiveUsers: 60,
          monthlyActiveUsers: 80
        },
        performance: {
          serverUptime: '99.9%',
          responseTime: '120ms',
          errorRate: '0.1%'
        }
      });
    })
  })
}));

describe('AdminStats Component', () => {
  test('renders all statistics sections', async () => {
    render(<AdminStats />);
    
    await waitFor(() => {
      expect(screen.getByText('System Statistics')).toBeInTheDocument();
      expect(screen.getByText('User Statistics')).toBeInTheDocument();
      expect(screen.getByText('Content Statistics')).toBeInTheDocument();
      expect(screen.getByText('User Engagement')).toBeInTheDocument();
      expect(screen.getByText('System Performance')).toBeInTheDocument();
    });
  });

  test('displays user statistics correctly', async () => {
    render(<AdminStats />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('90 (90.0%)')).toBeInTheDocument();
      expect(screen.getByText('New This Week')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Suspended Users')).toBeInTheDocument();
      expect(screen.getByText('5 (5.0%)')).toBeInTheDocument();
    });
  });

  test('displays content statistics correctly', async () => {
    render(<AdminStats />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Notices')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('Total Reports')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('Chat Groups')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Total Messages')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });

  test('displays engagement statistics correctly', async () => {
    render(<AdminStats />);
    
    await waitFor(() => {
      expect(screen.getByText('Daily Active Users')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('Weekly Active Users')).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument();
      expect(screen.getByText('Monthly Active Users')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
    });
  });

  test('displays performance statistics correctly', async () => {
    render(<AdminStats />);
    
    await waitFor(() => {
      expect(screen.getByText('Server Uptime')).toBeInTheDocument();
      expect(screen.getByText('99.9%')).toBeInTheDocument();
      expect(screen.getByText('Average Response Time')).toBeInTheDocument();
      expect(screen.getByText('120ms')).toBeInTheDocument();
      expect(screen.getByText('Error Rate')).toBeInTheDocument();
      expect(screen.getByText('0.1%')).toBeInTheDocument();
    });
  });

  test('handles loading state correctly', async () => {
    // Override the mock for this specific test
    jest.spyOn(require('../hooks/useApi'), 'default').mockImplementation(() => ({
      loading: true,
      error: null,
      clearError: jest.fn(),
      getWithRetry: jest.fn().mockResolvedValue({})
    }));

    render(<AdminStats />);
    
    // Should show loading skeleton
    expect(screen.queryByText('System Statistics')).not.toBeInTheDocument();
  });

  test('handles error state correctly', async () => {
    // Override the mock for this specific test
    jest.spyOn(require('../hooks/useApi'), 'default').mockImplementation(() => ({
      loading: false,
      error: 'Failed to load statistics',
      clearError: jest.fn(),
      getWithRetry: jest.fn().mockRejectedValue(new Error('API Error'))
    }));

    render(<AdminStats />);
    
    await waitFor(() => {
      expect(screen.getByText('System Statistics')).toBeInTheDocument();
      expect(screen.getByText('Failed to load statistics')).toBeInTheDocument();
    });
  });

  test('handles undefined data correctly', async () => {
    // Override the mock for this specific test
    jest.spyOn(require('../hooks/useApi'), 'default').mockImplementation(() => ({
      loading: false,
      error: null,
      clearError: jest.fn(),
      getWithRetry: jest.fn().mockResolvedValue(undefined)
    }));

    render(<AdminStats />);
    
    await waitFor(() => {
      expect(screen.getByText('System Statistics')).toBeInTheDocument();
      // Should show 0 for all stats
      expect(screen.getAllByText('0')).toHaveLength(10);
    });
  });

  test('handles partial data correctly', async () => {
    // Override the mock for this specific test
    jest.spyOn(require('../hooks/useApi'), 'default').mockImplementation(() => ({
      loading: false,
      error: null,
      clearError: jest.fn(),
      getWithRetry: jest.fn().mockResolvedValue({
        users: {
          total: 100
          // Missing other user properties
        },
        // Missing other sections
      })
    }));

    render(<AdminStats />);
    
    await waitFor(() => {
      expect(screen.getByText('System Statistics')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument(); // Should show the one value we provided
      expect(screen.getByText('0 (0.0%)')).toBeInTheDocument(); // Should show 0 for missing active users
    });
  });
});