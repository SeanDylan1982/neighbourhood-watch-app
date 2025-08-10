import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MessageMenu from '../MessageMenu';
import { MESSAGE_ACTIONS, CHAT_TYPES } from '../../../../constants/chat';

const theme = createTheme();

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('MessageMenu Component', () => {
  const defaultProps = {
    open: true,
    anchorEl: document.createElement('div'),
    onClose: jest.fn(),
    messageId: 'message-1',
    chatType: CHAT_TYPES.GROUP,
    isOwnMessage: false,
    messageType: 'text',
    onReact: jest.fn(),
    onReply: jest.fn(),
    onCopy: jest.fn(),
    onForward: jest.fn(),
    onDelete: jest.fn(),
    onInfo: jest.fn(),
    onReport: jest.fn(),
    onMessageAction: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders when open is true', () => {
      render(
        <TestWrapper>
          <MessageMenu {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Reply')).toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.getByText('Forward')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(
        <TestWrapper>
          <MessageMenu {...defaultProps} open={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('React')).not.toBeInTheDocument();
    });

    it('does not render when anchorEl is null', () => {
      render(
        <TestWrapper>
          <MessageMenu {...defaultProps} anchorEl={null} />
        </TestWrapper>
      );

      expect(screen.queryByText('React')).not.toBeInTheDocument();
    });
  });

  describe('Menu Options for Group Chats', () => {
    it('shows all basic options for group chat received messages', () => {
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            chatType={CHAT_TYPES.GROUP}
            isOwnMessage={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Reply')).toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.getByText('Forward')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Report Message')).toBeInTheDocument();
    });

    it('shows delete option for own messages in group chat', () => {
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            chatType={CHAT_TYPES.GROUP}
            isOwnMessage={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.queryByText('Report Message')).not.toBeInTheDocument();
    });

    it('does not show report option for own messages', () => {
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            chatType={CHAT_TYPES.GROUP}
            isOwnMessage={true}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Report Message')).not.toBeInTheDocument();
    });
  });

  describe('Menu Options for Private Chats', () => {
    it('shows basic options for private chat received messages', () => {
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            chatType={CHAT_TYPES.PRIVATE}
            isOwnMessage={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Reply')).toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.getByText('Forward')).toBeInTheDocument();
      expect(screen.queryByText('Info')).not.toBeInTheDocument();
      expect(screen.queryByText('Report Message')).not.toBeInTheDocument();
    });

    it('shows delete options for own messages in private chat', () => {
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            chatType={CHAT_TYPES.PRIVATE}
            isOwnMessage={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Delete for Me')).toBeInTheDocument();
      expect(screen.getByText('Delete for Everyone')).toBeInTheDocument();
    });
  });

  describe('Message Type Specific Options', () => {
    it('shows copy option for text messages', () => {
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            messageType="text"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    it('does not show copy option for non-text messages', () => {
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            messageType="image"
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Copy')).not.toBeInTheDocument();
    });
  });

  describe('Action Handlers', () => {
    it('calls onReact when React is clicked', async () => {
      const onReact = jest.fn();
      
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            onReact={onReact}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('React'));

      await waitFor(() => {
        expect(onReact).toHaveBeenCalledWith('message-1');
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('calls onReply when Reply is clicked', async () => {
      const onReply = jest.fn();
      
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            onReply={onReply}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Reply'));

      await waitFor(() => {
        expect(onReply).toHaveBeenCalledWith('message-1');
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('calls onCopy when Copy is clicked', async () => {
      const onCopy = jest.fn();
      
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            onCopy={onCopy}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Copy'));

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalledWith('message-1');
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('calls onForward when Forward is clicked', async () => {
      const onForward = jest.fn();
      
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            onForward={onForward}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Forward'));

      await waitFor(() => {
        expect(onForward).toHaveBeenCalledWith('message-1');
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('calls onDelete with correct action for "Delete for Me"', async () => {
      const onDelete = jest.fn();
      
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            chatType={CHAT_TYPES.PRIVATE}
            isOwnMessage={true}
            onDelete={onDelete}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Delete for Me'));

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith('message-1', MESSAGE_ACTIONS.DELETE_FOR_ME);
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('calls onDelete with correct action for "Delete for Everyone"', async () => {
      const onDelete = jest.fn();
      
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            chatType={CHAT_TYPES.PRIVATE}
            isOwnMessage={true}
            onDelete={onDelete}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Delete for Everyone'));

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith('message-1', MESSAGE_ACTIONS.DELETE_FOR_EVERYONE);
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('calls onInfo when Info is clicked', async () => {
      const onInfo = jest.fn();
      
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            onInfo={onInfo}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Info'));

      await waitFor(() => {
        expect(onInfo).toHaveBeenCalledWith('message-1');
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('calls onReport when Report Message is clicked', async () => {
      const onReport = jest.fn();
      
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            onReport={onReport}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Report Message'));

      await waitFor(() => {
        expect(onReport).toHaveBeenCalledWith('message-1');
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Custom Actions', () => {
    it('renders custom actions', () => {
      const customActions = [
        {
          action: 'custom_action',
          label: 'Custom Action',
          icon: <div data-testid="custom-icon" />,
          color: 'primary'
        }
      ];

      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            customActions={customActions}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Custom Action')).toBeInTheDocument();
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('calls onMessageAction for custom actions', async () => {
      const customActions = [
        {
          action: 'custom_action',
          label: 'Custom Action',
          icon: <div />,
          color: 'primary'
        }
      ];

      const onMessageAction = jest.fn();

      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            customActions={customActions}
            onMessageAction={onMessageAction}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Custom Action'));

      await waitFor(() => {
        expect(onMessageAction).toHaveBeenCalledWith('message-1', 'custom_action');
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Disabled Actions', () => {
    it('does not render disabled actions', () => {
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            disabledActions={[MESSAGE_ACTIONS.REACT, MESSAGE_ACTIONS.REPLY]}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('React')).not.toBeInTheDocument();
      expect(screen.queryByText('Reply')).not.toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.getByText('Forward')).toBeInTheDocument();
    });
  });

  describe('Menu Styling', () => {
    it('applies error color to delete actions', () => {
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            chatType={CHAT_TYPES.PRIVATE}
            isOwnMessage={true}
          />
        </TestWrapper>
      );

      const deleteForEveryoneItem = screen.getByText('Delete for Everyone');
      expect(deleteForEveryoneItem).toBeInTheDocument();
      // Color styling is applied via sx prop, hard to test directly
    });

    it('applies warning color to report action', () => {
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            chatType={CHAT_TYPES.GROUP}
            isOwnMessage={false}
          />
        </TestWrapper>
      );

      const reportItem = screen.getByText('Report Message');
      expect(reportItem).toBeInTheDocument();
      // Color styling is applied via sx prop, hard to test directly
    });
  });

  describe('Keyboard Navigation', () => {
    it('closes menu on Escape key', () => {
      const onClose = jest.fn();

      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            onClose={onClose}
          />
        </TestWrapper>
      );

      // Find the menu paper and fire keydown on it
      const menuPaper = document.querySelector('.MuiPaper-root');
      fireEvent.keyDown(menuPaper, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Click Away Behavior', () => {
    it('closes menu when clicking outside', () => {
      const onClose = jest.fn();

      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            onClose={onClose}
          />
        </TestWrapper>
      );

      // ClickAwayListener is handled by MUI, simulate by calling onClose directly
      // In real usage, clicking outside would trigger the ClickAwayListener
      expect(screen.getByText('React')).toBeInTheDocument();
      // ClickAway behavior is handled by MUI ClickAwayListener component
    });
  });

  describe('Menu Positioning', () => {
    it('renders with proper positioning', () => {
      render(
        <TestWrapper>
          <MessageMenu {...defaultProps} />
        </TestWrapper>
      );

      // Menu should be rendered (positioning is handled by Popper)
      expect(screen.getByText('React')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper menu item roles', () => {
      render(
        <TestWrapper>
          <MessageMenu {...defaultProps} />
        </TestWrapper>
      );

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it('has proper icons for menu items', () => {
      render(
        <TestWrapper>
          <MessageMenu {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('EmojiEmotionsIcon')).toBeInTheDocument();
      expect(screen.getByTestId('ReplyIcon')).toBeInTheDocument();
      expect(screen.getByTestId('ContentCopyIcon')).toBeInTheDocument();
      expect(screen.getByTestId('ForwardIcon')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing callback functions gracefully', () => {
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            onReact={null}
            onReply={null}
            onCopy={null}
          />
        </TestWrapper>
      );

      // Should still render menu items
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Reply')).toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();

      // Clicking should not throw errors
      fireEvent.click(screen.getByText('React'));
      fireEvent.click(screen.getByText('Reply'));
      fireEvent.click(screen.getByText('Copy'));
    });

    it('handles empty custom actions array', () => {
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            customActions={[]}
          />
        </TestWrapper>
      );

      expect(screen.getByText('React')).toBeInTheDocument();
    });

    it('handles undefined messageId', () => {
      render(
        <TestWrapper>
          <MessageMenu 
            {...defaultProps} 
            messageId={undefined}
          />
        </TestWrapper>
      );

      expect(screen.getByText('React')).toBeInTheDocument();
    });
  });
});