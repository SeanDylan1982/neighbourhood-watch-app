import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInputWithReply from '../MessageInputWithReply';

// Mock CSS imports
jest.mock('../MessageInputWithReply.css', () => ({}));
jest.mock('../ReplyPreview.css', () => ({}));

// Mock Material-UI components
jest.mock('@mui/material', () => ({
  TextField: ({ onChange, onKeyPress, value, placeholder, helperText, InputProps, ...props }) => (
    <div>
      <input
        onChange={onChange}
        onKeyPress={onKeyPress}
        value={value}
        placeholder={placeholder}
        {...props}
      />
      {InputProps?.startAdornment}
      {InputProps?.endAdornment}
      {helperText && <div data-testid="helper-text">{helperText}</div>}
    </div>
  ),
  IconButton: ({ children, onClick, disabled, ...props }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  Box: ({ children, className }) => <div className={className}>{children}</div>,
  InputAdornment: ({ children }) => <div>{children}</div>
}));

jest.mock('@mui/icons-material', () => ({
  Send: () => <span>Send</span>,
  AttachFile: () => <span>Attach</span>,
  EmojiEmotions: () => <span>Emoji</span>
}));

// Mock the useReply hook
const mockUseReply = {
  replyTo: null,
  isReplying: false,
  startReply: jest.fn(),
  cancelReply: jest.fn(),
  clearReply: jest.fn(),
  getReplyData: jest.fn(() => null),
  isValidReply: jest.fn(() => false),
  inputRef: { current: null }
};

jest.mock('../../../hooks/useReply', () => ({
  __esModule: true,
  default: () => mockUseReply
}));

describe('MessageInputWithReply', () => {
  const defaultProps = {
    onSendMessage: jest.fn(),
    placeholder: 'Type a message...'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReply.replyTo = null;
    mockUseReply.isReplying = false;
    mockUseReply.getReplyData.mockReturnValue(null);
    mockUseReply.isValidReply.mockReturnValue(false);
  });

  describe('Rendering', () => {
    it('renders message input field', () => {
      render(<MessageInputWithReply {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    it('renders attach and emoji buttons by default', () => {
      render(<MessageInputWithReply {...defaultProps} />);
      
      expect(screen.getByText('Attach')).toBeInTheDocument();
      expect(screen.getByText('Emoji')).toBeInTheDocument();
    });

    it('renders send button', () => {
      render(<MessageInputWithReply {...defaultProps} />);
      
      expect(screen.getByText('Send')).toBeInTheDocument();
    });

    it('hides attach button when showAttachButton is false', () => {
      render(<MessageInputWithReply {...defaultProps} showAttachButton={false} />);
      
      expect(screen.queryByText('Attach')).not.toBeInTheDocument();
    });

    it('hides emoji button when showEmojiButton is false', () => {
      render(<MessageInputWithReply {...defaultProps} showEmojiButton={false} />);
      
      expect(screen.queryByText('Emoji')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<MessageInputWithReply {...defaultProps} className="custom-class" />);
      
      const container = document.querySelector('.message-input-with-reply');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Message Input', () => {
    it('updates message state when typing', async () => {
      const user = userEvent.setup();
      render(<MessageInputWithReply {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Hello world');
      
      expect(input.value).toBe('Hello world');
    });

    it('respects maxLength prop', async () => {
      const user = userEvent.setup();
      render(<MessageInputWithReply {...defaultProps} maxLength={10} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'This is a very long message');
      
      expect(input.value).toBe('This is a ');
    });

    it('shows character count when near limit', async () => {
      const user = userEvent.setup();
      render(<MessageInputWithReply {...defaultProps} maxLength={10} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Hello wor');
      
      expect(screen.getByTestId('helper-text')).toBeInTheDocument();
      expect(screen.getByText('9/10')).toBeInTheDocument();
    });

    it('calls onTypingStart when user starts typing', async () => {
      const onTypingStart = jest.fn();
      const user = userEvent.setup();
      
      render(
        <MessageInputWithReply 
          {...defaultProps} 
          onTypingStart={onTypingStart}
        />
      );
      
      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'H');
      
      expect(onTypingStart).toHaveBeenCalledTimes(1);
    });

    it('calls onTypingStop when user stops typing', async () => {
      const onTypingStop = jest.fn();
      const user = userEvent.setup();
      
      render(
        <MessageInputWithReply 
          {...defaultProps} 
          onTypingStop={onTypingStop}
        />
      );
      
      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Hello');
      
      // Clear the input to trigger typing stop
      await user.clear(input);
      
      expect(onTypingStop).toHaveBeenCalled();
    });
  });

  describe('Message Sending', () => {
    it('sends message when send button is clicked', async () => {
      const onSendMessage = jest.fn();
      const user = userEvent.setup();
      
      render(<MessageInputWithReply {...defaultProps} onSendMessage={onSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByText('Send');
      
      await user.type(input, 'Hello world');
      await user.click(sendButton);
      
      expect(onSendMessage).toHaveBeenCalledWith({
        content: 'Hello world',
        type: 'text',
        replyTo: null
      });
    });

    it('sends message when Enter key is pressed', async () => {
      const onSendMessage = jest.fn();
      const user = userEvent.setup();
      
      render(<MessageInputWithReply {...defaultProps} onSendMessage={onSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      
      await user.type(input, 'Hello world');
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
      
      expect(onSendMessage).toHaveBeenCalledWith({
        content: 'Hello world',
        type: 'text',
        replyTo: null
      });
    });

    it('does not send message when Shift+Enter is pressed', async () => {
      const onSendMessage = jest.fn();
      const user = userEvent.setup();
      
      render(<MessageInputWithReply {...defaultProps} onSendMessage={onSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      
      await user.type(input, 'Hello world');
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', shiftKey: true });
      
      expect(onSendMessage).not.toHaveBeenCalled();
    });

    it('does not send empty messages', async () => {
      const onSendMessage = jest.fn();
      const user = userEvent.setup();
      
      render(<MessageInputWithReply {...defaultProps} onSendMessage={onSendMessage} />);
      
      const sendButton = screen.getByText('Send');
      await user.click(sendButton);
      
      expect(onSendMessage).not.toHaveBeenCalled();
    });

    it('does not send whitespace-only messages', async () => {
      const onSendMessage = jest.fn();
      const user = userEvent.setup();
      
      render(<MessageInputWithReply {...defaultProps} onSendMessage={onSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByText('Send');
      
      await user.type(input, '   ');
      await user.click(sendButton);
      
      expect(onSendMessage).not.toHaveBeenCalled();
    });

    it('clears input after sending message', async () => {
      const onSendMessage = jest.fn().mockResolvedValue();
      const user = userEvent.setup();
      
      render(<MessageInputWithReply {...defaultProps} onSendMessage={onSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByText('Send');
      
      await user.type(input, 'Hello world');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('does not send message when loading', async () => {
      const onSendMessage = jest.fn();
      const user = userEvent.setup();
      
      render(
        <MessageInputWithReply 
          {...defaultProps} 
          onSendMessage={onSendMessage}
          isLoading={true}
        />
      );
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByText('Send');
      
      await user.type(input, 'Hello world');
      await user.click(sendButton);
      
      expect(onSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Reply Functionality', () => {
    beforeEach(() => {
      mockUseReply.replyTo = {
        id: 'message-123',
        content: 'Original message',
        senderName: 'John Doe',
        type: 'text'
      };
      mockUseReply.isReplying = true;
      mockUseReply.getReplyData.mockReturnValue({
        messageId: 'message-123',
        content: 'Original message',
        senderName: 'John Doe',
        type: 'text'
      });
      mockUseReply.isValidReply.mockReturnValue(true);
    });

    it('shows reply preview when replying', () => {
      render(<MessageInputWithReply {...defaultProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Original message')).toBeInTheDocument();
    });

    it('changes placeholder when replying', () => {
      render(<MessageInputWithReply {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Reply to John Doe...')).toBeInTheDocument();
    });

    it('includes reply data when sending message', async () => {
      const onSendMessage = jest.fn();
      const user = userEvent.setup();
      
      render(<MessageInputWithReply {...defaultProps} onSendMessage={onSendMessage} />);
      
      const input = screen.getByPlaceholderText('Reply to John Doe...');
      const sendButton = screen.getByText('Send');
      
      await user.type(input, 'This is my reply');
      await user.click(sendButton);
      
      expect(onSendMessage).toHaveBeenCalledWith({
        content: 'This is my reply',
        type: 'text',
        replyTo: {
          messageId: 'message-123',
          content: 'Original message',
          senderName: 'John Doe',
          type: 'text'
        }
      });
    });

    it('clears reply after sending message', async () => {
      const onSendMessage = jest.fn().mockResolvedValue();
      const user = userEvent.setup();
      
      render(<MessageInputWithReply {...defaultProps} onSendMessage={onSendMessage} />);
      
      const input = screen.getByPlaceholderText('Reply to John Doe...');
      const sendButton = screen.getByText('Send');
      
      await user.type(input, 'This is my reply');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(mockUseReply.clearReply).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Button Interactions', () => {
    it('calls onAttachClick when attach button is clicked', async () => {
      const onAttachClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <MessageInputWithReply 
          {...defaultProps} 
          onAttachClick={onAttachClick}
        />
      );
      
      const attachButton = screen.getByText('Attach');
      await user.click(attachButton);
      
      expect(onAttachClick).toHaveBeenCalledTimes(1);
    });

    it('calls onEmojiClick when emoji button is clicked', async () => {
      const onEmojiClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <MessageInputWithReply 
          {...defaultProps} 
          onEmojiClick={onEmojiClick}
        />
      );
      
      const emojiButton = screen.getByText('Emoji');
      await user.click(emojiButton);
      
      expect(onEmojiClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(<MessageInputWithReply {...defaultProps} disabled={true} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      expect(input).toBeDisabled();
    });

    it('disables buttons when disabled prop is true', () => {
      render(<MessageInputWithReply {...defaultProps} disabled={true} />);
      
      const attachButton = screen.getByText('Attach');
      const emojiButton = screen.getByText('Emoji');
      const sendButton = screen.getByText('Send');
      
      expect(attachButton).toBeDisabled();
      expect(emojiButton).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('handles send message errors gracefully', async () => {
      const onSendMessage = jest.fn().mockRejectedValue(new Error('Send failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const user = userEvent.setup();
      
      render(<MessageInputWithReply {...defaultProps} onSendMessage={onSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByText('Send');
      
      await user.type(input, 'Hello world');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to send message:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', () => {
      render(<MessageInputWithReply {...defaultProps} />);
      
      expect(screen.getByLabelText('Attach file')).toBeInTheDocument();
      expect(screen.getByLabelText('Add emoji')).toBeInTheDocument();
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });

    it('has proper title attributes for tooltips', () => {
      render(<MessageInputWithReply {...defaultProps} />);
      
      expect(screen.getByTitle('Attach file')).toBeInTheDocument();
      expect(screen.getByTitle('Add emoji')).toBeInTheDocument();
      expect(screen.getByTitle('Send message')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing callback props gracefully', async () => {
      const user = userEvent.setup();
      
      render(<MessageInputWithReply placeholder="Type a message..." />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const attachButton = screen.getByText('Attach');
      const emojiButton = screen.getByText('Emoji');
      const sendButton = screen.getByText('Send');
      
      // Should not throw errors
      await user.type(input, 'Hello');
      await user.click(attachButton);
      await user.click(emojiButton);
      await user.click(sendButton);
      
      expect(input.value).toBe('Hello');
    });

    it('handles very long messages', async () => {
      const user = userEvent.setup();
      const longMessage = 'a'.repeat(2000);
      
      render(<MessageInputWithReply {...defaultProps} maxLength={1000} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, longMessage);
      
      expect(input.value).toHaveLength(1000);
    });
  });

  describe('Performance', () => {
    it('cleans up typing timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      const { unmount } = render(<MessageInputWithReply {...defaultProps} />);
      unmount();
      
      // Should clean up any existing timeouts
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });
  });
});