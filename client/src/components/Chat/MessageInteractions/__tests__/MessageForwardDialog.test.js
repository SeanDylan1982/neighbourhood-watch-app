import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MessageForwardDialog from '../MessageForwardDialog';
import { CHAT_TYPES } from '../../../../constants/chat';

// Mock data
const mockChats = [
  {
    id: 'chat1',
    type: CHAT_TYPES.GROUP,
    name: 'Test Group',
    memberCount: 5,
    description: 'A test group chat'
  },
  {
    id: 'chat2',
    type: CHAT_TYPES.PRIVATE,
    name: 'Private Chat',
    participantId: 'user2',
    participantName: 'John Doe',
    participantAvatar: 'avatar.jpg',
    isOnline: true
  },
  {
    id: 'chat3',
    type: CHAT_TYPES.GROUP,
    name: 'Another Group',
    memberCount: 3
  }
];

const mockMessage = {
  id: 'msg1',
  content: 'Hello, this is a test message',
  type: 'text',
  senderId: 'user1',
  senderName: 'Test User',
  timestamp: new Date('2024-01-01T10:00:00Z')
};

// Mock hooks
jest.mock('../../../../contexts/ChatContext', () => ({
  useChat: () => ({
    chats: mockChats
  })
}));

const theme = createTheme();

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('MessageForwardDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnForward = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderDialog = (props = {}) => {
    return render(
      <TestWrapper>
        <MessageForwardDialog
          open={true}
          onClose={mockOnClose}
          message={mockMessage}
          onForward={mockOnForward}
          {...props}
        />
      </TestWrapper>
    );
  };

  describe('Rendering', () => {
    it('renders dialog when open', () => {
      renderDialog();
      
      expect(screen.getByText('Forward Message')).toBeInTheDocument();
      expect(screen.getByText('Message to forward:')).toBeInTheDocument();
      expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderDialog({ open: false });
      
      expect(screen.queryByText('Forward Message')).not.toBeInTheDocument();
    });

    it('does not render without message', () => {
      renderDialog({ message: null });
      
      expect(screen.queryByText('Forward Message')).not.toBeInTheDocument();
    });

    it('displays message preview correctly for text messages', () => {
      renderDialog();
      
      expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
      expect(screen.getByText('From: Test User')).toBeInTheDocument();
    });

    it('displays message preview correctly for media messages', () => {
      const mediaMessage = {
        ...mockMessage,
        type: 'image',
        content: ''
      };
      
      renderDialog({ message: mediaMessage });
      
      expect(screen.getByText('🖼️ Photo')).toBeInTheDocument();
    });
  });

  describe('Chat List', () => {
    it('displays all available chats', () => {
      renderDialog();
      
      expect(screen.getByText('Test Group')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Another Group')).toBeInTheDocument();
    });

    it('shows correct chat subtitles', () => {
      renderDialog();
      
      expect(screen.getByText('5 members')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('3 members')).toBeInTheDocument();
    });

    it('shows group indicators for group chats', () => {
      renderDialog();
      
      const groupChips = screen.getAllByText('Group');
      expect(groupChips).toHaveLength(2); // Two group chats
    });
  });

  describe('Chat Selection', () => {
    it('allows selecting chats', async () => {
      renderDialog();
      
      const testGroupCheckbox = screen.getByRole('checkbox', { name: /test group/i });
      fireEvent.click(testGroupCheckbox);
      
      await waitFor(() => {
        expect(testGroupCheckbox).toBeChecked();
      });
      expect(screen.getByText('Selected chats (1/5):')).toBeInTheDocument();
      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });

    it('allows deselecting chats', async () => {
      renderDialog();
      
      const testGroupCheckbox = screen.getByRole('checkbox', { name: /test group/i });
      
      // Select
      fireEvent.click(testGroupCheckbox);
      await waitFor(() => {
        expect(testGroupCheckbox).toBeChecked();
      });
      
      // Deselect
      fireEvent.click(testGroupCheckbox);
      await waitFor(() => {
        expect(testGroupCheckbox).not.toBeChecked();
      });
      expect(screen.queryByText('Selected chats')).not.toBeInTheDocument();
    });

    it('enforces maximum selection limit', async () => {
      renderDialog({ maxSelections: 2 });
      
      // Select first two chats
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);
      
      await waitFor(() => {
        expect(screen.getByText('Selected chats (2/2):')).toBeInTheDocument();
      });
      
      // Try to select third chat
      fireEvent.click(checkboxes[2]);
      
      await waitFor(() => {
        expect(screen.getByText('You can only forward to 2 chats at once')).toBeInTheDocument();
      });
      expect(screen.getByText('Selected chats (2/2):')).toBeInTheDocument();
    });

    it('allows removing selected chats via chips', async () => {
      renderDialog();
      
      // Select a chat
      const testGroupCheckbox = screen.getByRole('checkbox', { name: /test group/i });
      fireEvent.click(testGroupCheckbox);
      
      await waitFor(() => {
        expect(screen.getByText('Selected chats (1/5):')).toBeInTheDocument();
      });
      
      // Remove via chip
      const removeButton = screen.getByLabelText(/delete/i);
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Selected chats')).not.toBeInTheDocument();
      });
      expect(testGroupCheckbox).not.toBeChecked();
    });
  });

  describe('Search Functionality', () => {
    it('filters chats based on search query', async () => {
      renderDialog();
      
      const searchInput = screen.getByPlaceholderText('Search chats...');
      fireEvent.change(searchInput, { target: { value: 'Test Group' } });
      
      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('Another Group')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when no chats match', async () => {
      renderDialog();
      
      const searchInput = screen.getByPlaceholderText('Search chats...');
      fireEvent.change(searchInput, { target: { value: 'Nonexistent Chat' } });
      
      await waitFor(() => {
        expect(screen.getByText('No chats found')).toBeInTheDocument();
        expect(screen.getByText('Try a different search term')).toBeInTheDocument();
      });
    });

    it('allows clearing search', async () => {
      renderDialog();
      
      const searchInput = screen.getByPlaceholderText('Search chats...');
      fireEvent.change(searchInput, { target: { value: 'Test' } });
      
      const clearButton = screen.getByLabelText(/clear search/i);
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('');
        expect(screen.getByText('Test Group')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Forwarding Actions', () => {
    it('enables forward button when chats are selected', async () => {
      renderDialog();
      
      const forwardButton = screen.getByRole('button', { name: /forward/i });
      expect(forwardButton).toBeDisabled();
      
      // Select a chat
      const testGroupCheckbox = screen.getByRole('checkbox', { name: /test group/i });
      fireEvent.click(testGroupCheckbox);
      
      await waitFor(() => {
        expect(forwardButton).toBeEnabled();
        expect(forwardButton).toHaveTextContent('Forward');
      });
    });

    it('shows count in forward button for multiple selections', async () => {
      renderDialog();
      
      // Select multiple chats
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);
      
      const forwardButton = screen.getByRole('button', { name: /forward/i });
      await waitFor(() => {
        expect(forwardButton).toHaveTextContent('Forward (2)');
      });
    });

    it('calls onForward with correct parameters', async () => {
      mockOnForward.mockResolvedValue({ success: true });
      renderDialog();
      
      // Select a chat
      const testGroupCheckbox = screen.getByRole('checkbox', { name: /test group/i });
      fireEvent.click(testGroupCheckbox);
      
      // Click forward
      const forwardButton = screen.getByRole('button', { name: /forward/i });
      fireEvent.click(forwardButton);
      
      await waitFor(() => {
        expect(mockOnForward).toHaveBeenCalledWith(
          mockMessage,
          [expect.objectContaining({ id: 'chat1', name: 'Test Group' })]
        );
      });
    });

    it('shows loading state during forwarding', async () => {
      let resolveForward;
      mockOnForward.mockImplementation(() => new Promise(resolve => {
        resolveForward = resolve;
      }));
      
      renderDialog();
      
      // Select and forward
      const testGroupCheckbox = screen.getByRole('checkbox', { name: /test group/i });
      fireEvent.click(testGroupCheckbox);
      
      const forwardButton = screen.getByRole('button', { name: /forward/i });
      fireEvent.click(forwardButton);
      
      await waitFor(() => {
        expect(screen.getByText('Forwarding...')).toBeInTheDocument();
        expect(forwardButton).toBeDisabled();
      });
      
      // Resolve the promise
      resolveForward({ success: true });
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('handles forwarding errors', async () => {
      mockOnForward.mockRejectedValue(new Error('Network error'));
      renderDialog();
      
      // Select and forward
      const testGroupCheckbox = screen.getByRole('checkbox', { name: /test group/i });
      fireEvent.click(testGroupCheckbox);
      
      const forwardButton = screen.getByRole('button', { name: /forward/i });
      fireEvent.click(forwardButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Dialog Controls', () => {
    it('closes dialog when cancel is clicked', async () => {
      renderDialog();
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes dialog when close icon is clicked', async () => {
      renderDialog();
      
      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('prevents closing during forwarding', async () => {
      mockOnForward.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderDialog();
      
      // Start forwarding
      const testGroupCheckbox = screen.getByRole('checkbox', { name: /test group/i });
      fireEvent.click(testGroupCheckbox);
      
      const forwardButton = screen.getByRole('button', { name: /forward/i });
      fireEvent.click(forwardButton);
      
      await waitFor(() => {
        // Try to close
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        const closeButton = screen.getByLabelText(/close/i);
        
        expect(cancelButton).toBeDisabled();
        expect(closeButton).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderDialog();
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /search chats/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      renderDialog();
      
      // Tab through elements
      const closeButton = screen.getByLabelText(/close/i);
      const searchInput = screen.getByPlaceholderText('Search chats...');
      
      closeButton.focus();
      expect(closeButton).toHaveFocus();
      
      // Simulate tab to next element
      fireEvent.keyDown(closeButton, { key: 'Tab' });
      searchInput.focus();
      expect(searchInput).toHaveFocus();
    });
  });
});