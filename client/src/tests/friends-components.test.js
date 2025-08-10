import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FriendRequestButton, FriendsList, FriendRequests } from '../components/Friends';

// Mock fetch
global.fetch = jest.fn();

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('FriendRequestButton Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'mock-token');
  });

  test('renders add friend button for non-friend', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'none' })
    });

    renderWithRouter(<FriendRequestButton userId="user123" />);

    await waitFor(() => {
      expect(screen.getByText('Add Friend')).toBeInTheDocument();
    });
  });

  test('renders friends status for existing friend', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'friends' })
    });

    renderWithRouter(<FriendRequestButton userId="user123" />);

    await waitFor(() => {
      expect(screen.getByText('Friends')).toBeInTheDocument();
    });
  });

  test('renders request sent status', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'request_sent', requestId: 'req123' })
    });

    renderWithRouter(<FriendRequestButton userId="user123" />);

    await waitFor(() => {
      expect(screen.getByText('Request Sent')).toBeInTheDocument();
    });
  });

  test('renders accept/decline buttons for received request', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'request_received', requestId: 'req123' })
    });

    renderWithRouter(<FriendRequestButton userId="user123" />);

    await waitFor(() => {
      expect(screen.getByTitle('Accept friend request')).toBeInTheDocument();
      expect(screen.getByTitle('Decline friend request')).toBeInTheDocument();
    });
  });

  test('sends friend request when add friend clicked', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'none' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ request: { _id: 'req123' } })
      });

    renderWithRouter(<FriendRequestButton userId="user123" />);

    await waitFor(() => {
      expect(screen.getByText('Add Friend')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Friend'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/friends/request', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }),
        body: JSON.stringify({ userId: 'user123' })
      }));
    });
  });

  test('accepts friend request when accept clicked', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'request_received', requestId: 'req123' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

    renderWithRouter(<FriendRequestButton userId="user123" />);

    await waitFor(() => {
      expect(screen.getByTitle('Accept friend request')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Accept friend request'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/friends/request/req123/accept', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      }));
    });
  });
});

describe('FriendsList Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'mock-token');
  });

  test('renders empty state when no friends', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([])
    });

    renderWithRouter(<FriendsList />);

    await waitFor(() => {
      expect(screen.getByText('No friends yet. Start connecting with your neighbors!')).toBeInTheDocument();
    });
  });

  test('renders friends list', async () => {
    const mockFriends = [
      {
        _id: 'friend1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'active',
        profileImageUrl: null
      },
      {
        _id: 'friend2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        status: 'active',
        profileImageUrl: 'profile.jpg'
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFriends
    });

    renderWithRouter(<FriendsList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  test('opens context menu when more button clicked', async () => {
    const mockFriends = [
      {
        _id: 'friend1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'active',
        profileImageUrl: null
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFriends
    });

    renderWithRouter(<FriendsList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click the more button
    const moreButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(moreButton);

    await waitFor(() => {
      expect(screen.getByText('Send Message')).toBeInTheDocument();
      expect(screen.getByText('Remove Friend')).toBeInTheDocument();
    });
  });

  test('calls onStartChat when send message clicked', async () => {
    const mockOnStartChat = jest.fn();
    const mockFriends = [
      {
        _id: 'friend1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'active',
        profileImageUrl: null
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFriends
    });

    renderWithRouter(<FriendsList onStartChat={mockOnStartChat} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click the more button
    const moreButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(moreButton);

    await waitFor(() => {
      expect(screen.getByText('Send Message')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Send Message'));

    expect(mockOnStartChat).toHaveBeenCalledWith('friend1');
  });
});

describe('FriendRequests Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'mock-token');
  });

  test('renders empty state when no requests', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      });

    renderWithRouter(<FriendRequests />);

    await waitFor(() => {
      expect(screen.getByText('No friend requests received')).toBeInTheDocument();
    });
  });

  test('renders received friend requests', async () => {
    const mockReceivedRequests = [
      {
        _id: 'req1',
        from: {
          _id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          profileImageUrl: null
        },
        message: 'Let\'s be friends!',
        createdAt: new Date().toISOString(),
        status: 'pending'
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReceivedRequests
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      });

    renderWithRouter(<FriendRequests />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('"Let\'s be friends!"')).toBeInTheDocument();
    });
  });

  test('renders sent friend requests in sent tab', async () => {
    const mockSentRequests = [
      {
        _id: 'req1',
        to: {
          _id: 'user1',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          profileImageUrl: null
        },
        createdAt: new Date().toISOString(),
        status: 'pending'
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSentRequests
      });

    renderWithRouter(<FriendRequests />);

    // Switch to sent tab
    fireEvent.click(screen.getByText(/Sent/));

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  test('accepts friend request when accept clicked', async () => {
    const mockReceivedRequests = [
      {
        _id: 'req1',
        from: {
          _id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          profileImageUrl: null
        },
        createdAt: new Date().toISOString(),
        status: 'pending'
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReceivedRequests
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

    const mockOnRequestUpdate = jest.fn();
    renderWithRouter(<FriendRequests onRequestUpdate={mockOnRequestUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click accept button
    const acceptButton = screen.getByRole('button', { name: /check/i });
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/friends/request/req1/accept', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      }));
      expect(mockOnRequestUpdate).toHaveBeenCalled();
    });
  });

  test('declines friend request when decline clicked', async () => {
    const mockReceivedRequests = [
      {
        _id: 'req1',
        from: {
          _id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          profileImageUrl: null
        },
        createdAt: new Date().toISOString(),
        status: 'pending'
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReceivedRequests
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

    renderWithRouter(<FriendRequests />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click decline button
    const declineButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(declineButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/friends/request/req1/decline', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      }));
    });
  });
});