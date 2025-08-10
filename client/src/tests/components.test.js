import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Dashboard from '../pages/Dashboard/Dashboard';
import Profile from '../pages/Profile/Profile';
import Reports from '../pages/Reports/Reports';
import NoticeBoard from '../pages/NoticeBoard/NoticeBoard';
import Chat from '../pages/Chat/Chat';
import { AuthContext } from '../contexts/AuthContext';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock fetch
global.fetch = jest.fn();

// Mock user context
const mockUser = {
  _id: '123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'user'
};

const MockAuthProvider = ({ children }) => (
  <AuthContext.Provider value={{ user: mockUser, loading: false }}>
    {children}
  </AuthContext.Provider>
);

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <MockAuthProvider>
        {component}
      </MockAuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    mockedAxios.get.mockClear();
  });

  test('renders dashboard with real data', async () => {
    const mockStats = {
      activeChats: 5,
      newNotices: 3,
      openReports: 2,
      neighbours: 25
    };

    const mockNotices = [
      {
        id: '1',
        title: 'Community BBQ',
        category: 'event',
        author: 'Sarah Johnson',
        time: '2 hours ago'
      }
    ];

    const mockReports = [
      {
        id: '1',
        title: 'Pothole Report',
        severity: 'medium',
        status: 'open',
        time: '1 hour ago'
      }
    ];

    mockedAxios.get
      .mockResolvedValueOnce({ data: mockStats })
      .mockResolvedValueOnce({ data: mockNotices })
      .mockResolvedValueOnce({ data: mockReports });

    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Welcome back, John!')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Active Chats
      expect(screen.getByText('3')).toBeInTheDocument(); // New Notices
      expect(screen.getByText('2')).toBeInTheDocument(); // Open Reports
      expect(screen.getByText('25')).toBeInTheDocument(); // Neighbours
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/statistics/dashboard');
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/statistics/recent-notices?limit=3');
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/statistics/recent-reports?limit=3');
  });

  test('handles API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Welcome back, John!')).toBeInTheDocument();
    });
  });
});

describe('Profile Component', () => {
  beforeEach(() => {
    mockedAxios.get.mockClear();
  });

  test('renders profile with user stats', async () => {
    const mockStats = {
      reportsFiled: 5,
      messagesSent: 23,
      noticesPosted: 3,
      memberSince: '6 months',
      friendsCount: 12
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockStats });

    renderWithProviders(<Profile />);

    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Reports Filed
      expect(screen.getByText('23')).toBeInTheDocument(); // Messages Sent
      expect(screen.getByText('3')).toBeInTheDocument(); // Notices Posted
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/statistics/profile');
  });
});

describe('Reports Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders reports from API', async () => {
    const mockReports = [
      {
        _id: '1',
        title: 'Security Issue',
        description: 'Suspicious activity reported',
        category: 'security',
        priority: 'high',
        status: 'open',
        location: { address: 'Oak Street' },
        isAnonymous: false,
        reporterId: { firstName: 'Jane', lastName: 'Smith' },
        createdAt: '2024-01-15T10:00:00Z',
        comments: [],
        viewCount: 5,
        likes: []
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReports
    });

    renderWithProviders(<Reports />);

    await waitFor(() => {
      expect(screen.getByText('Security Issue')).toBeInTheDocument();
      expect(screen.getByText('Suspicious activity reported')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/reports');
  });

  test('creates new report', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // Initial fetch
      .mockResolvedValueOnce({ // Create report
        ok: true,
        json: async () => ({
          _id: '2',
          title: 'New Report',
          description: 'Test description',
          category: 'maintenance',
          priority: 'medium',
          status: 'open',
          location: { address: 'Test Location' },
          isAnonymous: false,
          createdAt: '2024-01-15T11:00:00Z'
        })
      });

    renderWithProviders(<Reports />);

    await waitFor(() => {
      expect(screen.getByText('Community Reports')).toBeInTheDocument();
    });

    // Click create report button
    const createButton = screen.getByLabelText('create report');
    fireEvent.click(createButton);

    // Fill form
    fireEvent.change(screen.getByLabelText('Report Title'), {
      target: { value: 'New Report' }
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test description' }
    });

    // Submit form
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/reports', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }));
    });
  });
});

describe('NoticeBoard Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders notices from API', async () => {
    const mockNotices = [
      {
        _id: '1',
        title: 'Community Event',
        content: 'Join us for the community BBQ',
        category: 'event',
        priority: 'normal',
        authorId: { firstName: 'Sarah', lastName: 'Johnson' },
        createdAt: '2024-01-15T10:00:00Z',
        isPinned: true,
        viewCount: 15,
        likes: [],
        comments: []
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockNotices
    });

    renderWithProviders(<NoticeBoard />);

    await waitFor(() => {
      expect(screen.getByText('Community Event')).toBeInTheDocument();
      expect(screen.getByText('Join us for the community BBQ')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/notices');
  });
});

describe('Chat Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders chat groups from API', async () => {
    const mockChatGroups = [
      {
        _id: '1',
        name: 'General Discussion',
        lastMessage: { content: 'Hello everyone', timestamp: '2024-01-15T10:00:00Z' },
        members: [{ _id: '1' }, { _id: '2' }]
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockChatGroups
    });

    renderWithProviders(<Chat />);

    await waitFor(() => {
      expect(screen.getByText('General Discussion')).toBeInTheDocument();
      expect(screen.getByText('Hello everyone')).toBeInTheDocument();
      expect(screen.getByText('2 members')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/chat/groups');
  });

  test('handles empty chat groups', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    renderWithProviders(<Chat />);

    await waitFor(() => {
      expect(screen.getByText('No chat groups available. Join the community to start chatting!')).toBeInTheDocument();
    });
  });
});