import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../pages/Admin/AdminDashboard';
import UserManagement from '../components/Admin/UserManagement';
import ContentModeration from '../components/Admin/ContentModeration';
import AdminStats from '../components/Admin/AdminStats';
import AuditLog from '../components/Admin/AuditLog';

// Mock the API hook
jest.mock('../hooks/useApi', () => ({
  __esModule: true,
  default: () => ({
    loading: false,
    error: null,
    clearError: jest.fn(),
    getWithRetry: jest.fn().mockImplementation((url) => {
      if (url === '/api/admin/stats') {
        return Promise.resolve({
          totalUsers: 100,
          activeUsers: 90,
          suspendedUsers: 5,
          totalContent: 200,
          flaggedContent: 10,
          recentActions: 15
        });
      } else if (url === '/api/admin/system-stats') {
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
      } else if (url === '/api/users') {
        return Promise.resolve([
          {
            _id: 'user1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'user',
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ]);
      } else if (url === '/api/notices') {
        return Promise.resolve([
          {
            _id: 'notice1',
            title: 'Test Notice',
            content: 'This is a test notice',
            author: { firstName: 'John', lastName: 'Doe' },
            category: 'General',
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ]);
      } else if (url === '/api/reports') {
        return Promise.resolve([
          {
            _id: 'report1',
            title: 'Test Report',
            description: 'This is a test report',
            reporter: { firstName: 'Jane', lastName: 'Smith' },
            severity: 'medium',
            status: 'open',
            createdAt: new Date().toISOString()
          }
        ]);
      } else if (url === '/api/chat/groups') {
        return Promise.resolve([
          {
            _id: 'chat1',
            name: 'Test Chat',
            description: 'This is a test chat group',
            type: 'public',
            memberCount: 5,
            createdAt: new Date().toISOString()
          }
        ]);
      } else if (url.includes('/api/admin/audit-logs')) {
        return Promise.resolve({
          logs: [
            {
              _id: 'log1',
              adminId: { firstName: 'Admin', lastName: 'User', email: 'admin@test.com' },
              action: 'user_role_change',
              targetType: 'user',
              targetId: 'user123',
              details: { oldRole: 'user', newRole: 'moderator' },
              timestamp: new Date().toISOString()
            }
          ],
          total: 1,
          page: 1,
          totalPages: 1
        });
      }
      return Promise.resolve(null);
    }),
    postWithRetry: jest.fn().mockResolvedValue({}),
    putWithRetry: jest.fn().mockResolvedValue({}),
    patchWithRetry: jest.fn().mockResolvedValue({}),
    deleteWithRetry: jest.fn().mockResolvedValue({})
  })
}));

// Mock the auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'admin1', role: 'admin' },
    loading: false
  })
}));

// Test helper function to render components with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Admin Integration Tests', () => {
  test('AdminDashboard renders with stats cards', async () => {
    renderWithRouter(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('Suspended Users')).toBeInTheDocument();
      expect(screen.getByText('Flagged Content')).toBeInTheDocument();
    });
  });

  test('AdminStats renders with all sections', async () => {
    renderWithRouter(<AdminStats />);
    
    await waitFor(() => {
      expect(screen.getByText('System Statistics')).toBeInTheDocument();
      expect(screen.getByText('User Statistics')).toBeInTheDocument();
      expect(screen.getByText('Content Statistics')).toBeInTheDocument();
      expect(screen.getByText('User Engagement')).toBeInTheDocument();
      expect(screen.getByText('System Performance')).toBeInTheDocument();
    });
  });

  test('UserManagement renders user table', async () => {
    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  test('ContentModeration renders content tabs', async () => {
    renderWithRouter(<ContentModeration />);
    
    await waitFor(() => {
      expect(screen.getByText('Content Moderation')).toBeInTheDocument();
      expect(screen.getByText('Test Notice')).toBeInTheDocument();
      expect(screen.getByText('Notices (1)')).toBeInTheDocument();
      expect(screen.getByText('Reports (1)')).toBeInTheDocument();
    });
  });

  test('AuditLog renders audit entries', async () => {
    renderWithRouter(<AuditLog />);
    
    await waitFor(() => {
      expect(screen.getByText('Audit Log')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText(/user role change/i)).toBeInTheDocument();
    });
  });

  test('AdminDashboard handles API errors gracefully', async () => {
    // Override the mock for this specific test
    jest.spyOn(require('../hooks/useApi'), 'default').mockImplementation(() => ({
      loading: false,
      error: 'API Error',
      clearError: jest.fn(),
      getWithRetry: jest.fn().mockRejectedValue(new Error('API Error'))
    }));

    renderWithRouter(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  test('AdminStats handles undefined data gracefully', async () => {
    // Override the mock for this specific test
    jest.spyOn(require('../hooks/useApi'), 'default').mockImplementation(() => ({
      loading: false,
      error: null,
      clearError: jest.fn(),
      getWithRetry: jest.fn().mockResolvedValue(undefined)
    }));

    renderWithRouter(<AdminStats />);
    
    await waitFor(() => {
      expect(screen.getByText('System Statistics')).toBeInTheDocument();
      // Should show 0 for all stats
      expect(screen.getAllByText('0')).toHaveLength(10);
    });
  });
});