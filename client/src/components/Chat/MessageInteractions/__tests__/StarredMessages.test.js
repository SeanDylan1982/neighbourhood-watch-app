import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StarredMessages from '../StarredMessages';
import { useMessageStarring } from '../../../../hooks/useMessageStarring';

// Mock the useMessageStarring hook
jest.mock('../../../../hooks/useMessageStarring');

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago')
}));

const theme = createTheme();

const mockStarredMessages = [
  {
    id: '1',
    content: 'This is a starred message',
    type: 'text',
    sender: {
      id: 'user1',
      name: 'John Doe',
      avatar: 'avatar1.jpg'
    },
    timestamp: '2023-01-01T10:00:00Z',
    starredAt: '2023-01-01T11:00:00Z'
  },
  {
    id: '2',
    content: 'Another important message',
    type: 'text',
    sender: {
      id: 'user2',
      name: 'Jane Smith',
      avatar: 'avatar2.jpg'
    },
    timestamp: '2023-01-01T12:00:00Z',
    starredAt: '2023-01-01T13:00:00Z'
  },
  {
    id: '3',
    type: 'image',
    fileName: 'photo.jpg',
    sender: {
      id: 'user3',
      name: 'Bob Wilson'
    },
    timestamp: '2023-01-01T14:00:00Z',
    starredAt: '2023-01-01T15:00:00Z'
  }
];

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  chatId: 'chat1',
  chatType: 'group',
  onMessageClick: jest.fn(),
  onReplyToMessage: jest.fn(),
  onForwardMessage: jest.fn()
};

const mockUseMessageStarring = {
  getStarredMessages: jest.fn(),
  toggleStar: jest.fn(),
  clearStarredMessages: jest.fn(),
  loading: false,
  isMessageStarred: jest.fn()
};

const renderComponent = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <StarredMessages {...defaultProps} {...props} />
    </ThemeProvider>
  );
};

describe('StarredMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMessageStarring.mockReturnValue(mockUseMessageStarring);
    mockUseMessageStarring.getStarredMessages.mockResolvedValue(mockStarredMessages);
  });

  describe('Rendering', () => {
    it('renders dialog when open', () => {
      renderComponent();
      expect(screen.getByText('Starred Messages')).toBeInTheDocument();
    });

    it('does not render dialog when closed', () => {
      renderComponent({ open: false });
      expect(screen.queryByText('Starred Messages')).not.toBeInTheDocument();
    });

    it('displays message count badge', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('shows loading state', () => {
      useMessageStarring.mockReturnValue({
        ...mockUseMessageStarring,
        loading: true
      });
      renderComponent();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Message Loading', () => {
    it('loads starred messages when dialog opens', async () => {
      renderComponent();
      await waitFor(() => {
        expect(mockUseMessageStarring.getStarredMessages).toHaveBeenCalled();
      });
    });

    it('displays starred messages', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('This is a starred message')).toBeInTheDocument();
        expect(screen.getByText('Another important message')).toBeInTheDocument();
        expect(screen.getByText('📷 Image')).toBeInTheDocument();
      });
    });

    it('displays sender names', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('renders search bar when messages exist', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search starred messages...')).toBeInTheDocument();
      });
    });

    it('filters messages based on search query', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('This is a starred message')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search starred messages...');
      fireEvent.change(searchInput, { target: { value: 'important' } });

      await waitFor(() => {
        expect(screen.getByText('Another important message')).toBeInTheDocument();
        expect(screen.queryByText('This is a starred message')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when search yields no matches', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('This is a starred message')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search starred messages...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('No matching messages')).toBeInTheDocument();
      });
    });
  });

  describe('Message Actions', () => {
    it('calls onMessageClick when message is clicked', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('This is a starred message')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('This is a starred message'));
      expect(defaultProps.onMessageClick).toHaveBeenCalledWith(mockStarredMessages[0]);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('handles reply action', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getAllByTitle('Reply')).toHaveLength(3);
      });

      fireEvent.click(screen.getAllByTitle('Reply')[0]);
      expect(defaultProps.onReplyToMessage).toHaveBeenCalledWith(mockStarredMessages[0]);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('handles forward action', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getAllByTitle('Forward')).toHaveLength(3);
      });

      fireEvent.click(screen.getAllByTitle('Forward')[0]);
      expect(defaultProps.onForwardMessage).toHaveBeenCalledWith(mockStarredMessages[0]);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('handles unstar action', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getAllByTitle('Remove star')).toHaveLength(3);
      });

      fireEvent.click(screen.getAllByTitle('Remove star')[0]);
      expect(mockUseMessageStarring.toggleStar).toHaveBeenCalledWith('1', true);
    });
  });

  describe('Clear All Functionality', () => {
    it('shows clear all button when messages exist', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Clear All')).toBeInTheDocument();
      });
    });

    it('handles clear all with confirmation', async () => {
      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Clear All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clear All'));
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to clear all starred messages?');
      expect(mockUseMessageStarring.clearStarredMessages).toHaveBeenCalled();

      // Restore original confirm
      window.confirm = originalConfirm;
    });

    it('cancels clear all when user declines confirmation', async () => {
      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => false);

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Clear All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clear All'));
      expect(window.confirm).toHaveBeenCalled();
      expect(mockUseMessageStarring.clearStarredMessages).not.toHaveBeenCalled();

      // Restore original confirm
      window.confirm = originalConfirm;
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no starred messages', async () => {
      mockUseMessageStarring.getStarredMessages.mockResolvedValue([]);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No starred messages')).toBeInTheDocument();
        expect(screen.getByText('Star important messages to find them here')).toBeInTheDocument();
      });
    });

    it('does not show search bar when no messages', async () => {
      mockUseMessageStarring.getStarredMessages.mockResolvedValue([]);
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search starred messages...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Message Type Formatting', () => {
    it('formats different message types correctly', async () => {
      const mixedMessages = [
        { ...mockStarredMessages[0], type: 'text', content: 'Text message' },
        { ...mockStarredMessages[1], type: 'image' },
        { ...mockStarredMessages[2], type: 'video' },
        { id: '4', type: 'audio', sender: { name: 'User' }, timestamp: '2023-01-01T16:00:00Z' },
        { id: '5', type: 'document', fileName: 'doc.pdf', sender: { name: 'User' }, timestamp: '2023-01-01T17:00:00Z' },
        { id: '6', type: 'location', sender: { name: 'User' }, timestamp: '2023-01-01T18:00:00Z' },
        { id: '7', type: 'contact', sender: { name: 'User' }, timestamp: '2023-01-01T19:00:00Z' }
      ];

      mockUseMessageStarring.getStarredMessages.mockResolvedValue(mixedMessages);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Text message')).toBeInTheDocument();
        expect(screen.getByText('📷 Image')).toBeInTheDocument();
        expect(screen.getByText('🎥 Video')).toBeInTheDocument();
        expect(screen.getByText('🎙️ Audio')).toBeInTheDocument();
        expect(screen.getByText('📄 doc.pdf')).toBeInTheDocument();
        expect(screen.getByText('📍 Location')).toBeInTheDocument();
        expect(screen.getByText('👤 Contact')).toBeInTheDocument();
      });
    });
  });

  describe('Dialog Controls', () => {
    it('closes dialog when close button is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('CloseIcon').closest('button'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('closes dialog when Close button is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});