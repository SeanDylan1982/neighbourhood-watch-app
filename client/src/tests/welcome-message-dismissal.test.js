/**
 * Test for Welcome Message Dismissal Functionality
 * 
 * This test verifies that welcome messages can be dismissed and the preference
 * is saved to the user's profile.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import axios from 'axios';
import WelcomeMessage from '../components/Common/WelcomeMessage';
import { AuthProvider } from '../contexts/AuthContext';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock user data
const mockUser = {
  id: 'user123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  settings: {
    dismissedWelcomeMessages: {
      chat: false,
      noticeBoard: false,
      reports: false
    },
    welcomeMessageStates: {
      chat: {
        dismissed: false,
        collapsed: false
      },
      noticeBoard: {
        dismissed: false,
        collapsed: false
      },
      reports: {
        dismissed: false,
        collapsed: false
      }
    }
  }
};

const theme = createTheme();

const TestWrapper = ({ children, user = mockUser }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <AuthProvider value={{ user }}>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Welcome Message Dismissal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render welcome message when not dismissed', () => {
    render(
      <TestWrapper>
        <WelcomeMessage
          type="chat"
          title="Welcome to Chat!"
          severity="info"
        >
          <p>This is a welcome message for chat.</p>
        </WelcomeMessage>
      </TestWrapper>
    );

    expect(screen.getByText('Welcome to Chat!')).toBeInTheDocument();
    expect(screen.getByText('This is a welcome message for chat.')).toBeInTheDocument();
  });

  test('should not render welcome message when dismissed', () => {
    const dismissedUser = {
      ...mockUser,
      settings: {
        ...mockUser.settings,
        dismissedWelcomeMessages: {
          ...mockUser.settings.dismissedWelcomeMessages,
          chat: true
        }
      }
    };

    render(
      <TestWrapper user={dismissedUser}>
        <WelcomeMessage
          type="chat"
          title="Welcome to Chat!"
          severity="info"
        >
          <p>This is a welcome message for chat.</p>
        </WelcomeMessage>
      </TestWrapper>
    );

    expect(screen.queryByText('Welcome to Chat!')).not.toBeInTheDocument();
    expect(screen.getByText('Show welcome message')).toBeInTheDocument();
  });

  test('should dismiss welcome message when close button is clicked', async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: { success: true } });
    mockedAxios.get.mockResolvedValueOnce({ data: mockUser });

    render(
      <TestWrapper>
        <WelcomeMessage
          type="chat"
          title="Welcome to Chat!"
          severity="info"
        >
          <p>This is a welcome message for chat.</p>
        </WelcomeMessage>
      </TestWrapper>
    );

    // Find and click the close button
    const closeButton = screen.getByLabelText('Dismiss');
    fireEvent.click(closeButton);

    // Wait for the API call
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith('/api/users/settings', {
        dismissedWelcomeMessages: {
          chat: true,
          noticeBoard: false,
          reports: false
        }
      });
    });

    // Message should be hidden
    await waitFor(() => {
      expect(screen.queryByText('Welcome to Chat!')).not.toBeInTheDocument();
    });
  });

  test('should show welcome message again when "Show welcome message" is clicked', async () => {
    const dismissedUser = {
      ...mockUser,
      settings: {
        ...mockUser.settings,
        dismissedWelcomeMessages: {
          ...mockUser.settings.dismissedWelcomeMessages,
          chat: true
        }
      }
    };

    mockedAxios.put.mockResolvedValueOnce({ data: { success: true } });
    mockedAxios.get.mockResolvedValueOnce({ data: mockUser });

    render(
      <TestWrapper user={dismissedUser}>
        <WelcomeMessage
          type="chat"
          title="Welcome to Chat!"
          severity="info"
        >
          <p>This is a welcome message for chat.</p>
        </WelcomeMessage>
      </TestWrapper>
    );

    // Find and click the "Show welcome message" button
    const showButton = screen.getByText('Show welcome message');
    fireEvent.click(showButton);

    // Wait for the API call
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith('/api/users/settings', {
        dismissedWelcomeMessages: {
          chat: false,
          noticeBoard: false,
          reports: false
        }
      });
    });

    // Message should be visible again
    await waitFor(() => {
      expect(screen.getByText('Welcome to Chat!')).toBeInTheDocument();
    });
  });

  test('should handle different welcome message types', () => {
    const testCases = [
      { type: 'chat', title: 'Chat Welcome' },
      { type: 'noticeBoard', title: 'Notice Board Welcome' },
      { type: 'reports', title: 'Reports Welcome' }
    ];

    testCases.forEach(({ type, title }) => {
      const { unmount } = render(
        <TestWrapper>
          <WelcomeMessage
            type={type}
            title={title}
            severity="info"
          >
            <p>Welcome message for {type}</p>
          </WelcomeMessage>
        </TestWrapper>
      );

      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText(`Welcome message for ${type}`)).toBeInTheDocument();
      
      unmount();
    });
  });

  test('should handle API errors gracefully', async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error('API Error'));
    
    // Mock console.error to avoid error output in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestWrapper>
        <WelcomeMessage
          type="chat"
          title="Welcome to Chat!"
          severity="info"
        >
          <p>This is a welcome message for chat.</p>
        </WelcomeMessage>
      </TestWrapper>
    );

    // Find and click the close button
    const closeButton = screen.getByLabelText('Dismiss');
    fireEvent.click(closeButton);

    // Wait for the API call and error handling
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Error dismissing welcome message:', expect.any(Error));
    });

    // Message should still be visible since the API call failed
    expect(screen.getByText('Welcome to Chat!')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test('should save collapsed state when expand/collapse button is clicked', async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: { success: true } });

    render(
      <TestWrapper>
        <WelcomeMessage
          type="noticeBoard"
          title="Welcome to Notice Board!"
          severity="info"
          collapsible={true}
        >
          <p>This is a welcome message for notice board.</p>
        </WelcomeMessage>
      </TestWrapper>
    );

    // Find and click the collapse button
    const collapseButton = screen.getByLabelText('Collapse');
    fireEvent.click(collapseButton);

    // Wait for the API call
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith('/api/users/settings', {
        welcomeMessageStates: {
          chat: {
            dismissed: false,
            collapsed: false
          },
          noticeBoard: {
            dismissed: false,
            collapsed: true
          },
          reports: {
            dismissed: false,
            collapsed: false
          }
        }
      });
    });
  });

  test('should load collapsed state from user settings', () => {
    const collapsedUser = {
      ...mockUser,
      settings: {
        ...mockUser.settings,
        welcomeMessageStates: {
          ...mockUser.settings.welcomeMessageStates,
          reports: {
            dismissed: false,
            collapsed: true
          }
        }
      }
    };

    render(
      <TestWrapper user={collapsedUser}>
        <WelcomeMessage
          type="reports"
          title="Welcome to Reports!"
          severity="info"
          collapsible={true}
        >
          <p>This is a welcome message for reports.</p>
        </WelcomeMessage>
      </TestWrapper>
    );

    // Message should be visible but collapsed
    expect(screen.getByText('Welcome to Reports!')).toBeInTheDocument();
    expect(screen.queryByText('This is a welcome message for reports.')).not.toBeInTheDocument();
    
    // Should show expand button
    expect(screen.getByLabelText('Expand')).toBeInTheDocument();
  });

  test('should handle backward compatibility with old dismissedWelcomeMessages format', () => {
    const oldFormatUser = {
      ...mockUser,
      settings: {
        dismissedWelcomeMessages: {
          chat: true,
          noticeBoard: false,
          reports: false
        }
        // No welcomeMessageStates field
      }
    };

    render(
      <TestWrapper user={oldFormatUser}>
        <WelcomeMessage
          type="chat"
          title="Welcome to Chat!"
          severity="info"
        >
          <p>This is a welcome message for chat.</p>
        </WelcomeMessage>
      </TestWrapper>
    );

    // Should be dismissed based on old format
    expect(screen.queryByText('Welcome to Chat!')).not.toBeInTheDocument();
    expect(screen.getByText('Show welcome message')).toBeInTheDocument();
  });

  test('should use new format when both old and new formats are present', () => {
    const mixedFormatUser = {
      ...mockUser,
      settings: {
        dismissedWelcomeMessages: {
          chat: false, // Old format says not dismissed
        },
        welcomeMessageStates: {
          chat: {
            dismissed: true, // New format says dismissed
            collapsed: false
          }
        }
      }
    };

    render(
      <TestWrapper user={mixedFormatUser}>
        <WelcomeMessage
          type="chat"
          title="Welcome to Chat!"
          severity="info"
        >
          <p>This is a welcome message for chat.</p>
        </WelcomeMessage>
      </TestWrapper>
    );

    // Should be dismissed based on new format (takes precedence)
    expect(screen.queryByText('Welcome to Chat!')).not.toBeInTheDocument();
    expect(screen.getByText('Show welcome message')).toBeInTheDocument();
  });
});