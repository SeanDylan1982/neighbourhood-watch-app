import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReplyPreview from '../ReplyPreview';

// Mock CSS imports
jest.mock('../ReplyPreview.css', () => ({}));

// Mock Material-UI components
jest.mock('@mui/material', () => ({
  IconButton: ({ children, onClick, className, ...props }) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  )
}));

jest.mock('@mui/icons-material', () => ({
  Close: () => <span>×</span>
}));

describe('ReplyPreview', () => {
  const mockTextReply = {
    id: 'message-123',
    content: 'This is the original message that we are replying to',
    senderName: 'John Doe',
    type: 'text'
  };

  const defaultProps = {
    replyTo: mockTextReply,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders reply preview with text message', () => {
      render(<ReplyPreview {...defaultProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('This is the original message that we are replying to')).toBeInTheDocument();
    });

    it('does not render when replyTo is null', () => {
      render(<ReplyPreview replyTo={null} onClose={jest.fn()} />);
      
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('renders close button by default', () => {
      render(<ReplyPreview {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /cancel reply/i })).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(<ReplyPreview {...defaultProps} showCloseButton={false} />);
      
      expect(screen.queryByRole('button', { name: /cancel reply/i })).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<ReplyPreview {...defaultProps} className="custom-class" />);
      
      const replyPreview = document.querySelector('.reply-preview');
      expect(replyPreview).toHaveClass('custom-class');
    });

    it('applies variant classes', () => {
      const { rerender } = render(<ReplyPreview {...defaultProps} variant="compact" />);
      
      let replyPreview = document.querySelector('.reply-preview');
      expect(replyPreview).toHaveClass('compact');
      
      rerender(<ReplyPreview {...defaultProps} variant="inline" />);
      replyPreview = document.querySelector('.reply-preview');
      expect(replyPreview).toHaveClass('inline');
    });

    it('applies position classes', () => {
      const { rerender } = render(<ReplyPreview {...defaultProps} position="bottom" />);
      
      let replyPreview = document.querySelector('.reply-preview');
      expect(replyPreview).toHaveClass('bottom');
      
      rerender(<ReplyPreview {...defaultProps} position="top" />);
      replyPreview = document.querySelector('.reply-preview');
      expect(replyPreview).toHaveClass('top');
    });
  });

  describe('Text Truncation', () => {
    it('truncates long text messages', () => {
      const longMessage = {
        ...mockTextReply,
        content: 'This is a very long message that should be truncated because it exceeds the maximum length limit that we have set for the reply preview component'
      };

      render(<ReplyPreview replyTo={longMessage} onClose={jest.fn()} maxLength={50} />);
      
      const excerpt = screen.getByText(/This is a very long message that should be.../);
      expect(excerpt).toBeInTheDocument();
      expect(excerpt.textContent.length).toBeLessThanOrEqual(53); // 50 + "..."
    });

    it('does not truncate short messages', () => {
      const shortMessage = {
        ...mockTextReply,
        content: 'Short message'
      };

      render(<ReplyPreview replyTo={shortMessage} onClose={jest.fn()} maxLength={50} />);
      
      expect(screen.getByText('Short message')).toBeInTheDocument();
    });

    it('truncates at word boundaries when possible', () => {
      const message = {
        ...mockTextReply,
        content: 'This is a message with multiple words that should be truncated properly'
      };

      render(<ReplyPreview replyTo={message} onClose={jest.fn()} maxLength={30} />);
      
      const excerpt = screen.getByText(/This is a message with.../);
      expect(excerpt).toBeInTheDocument();
      // Should not cut in the middle of "multiple"
      expect(excerpt.textContent).not.toContain('mult...');
    });
  });

  describe('Media Type Indicators', () => {
    it('displays image indicator for image messages', () => {
      const imageMessage = {
        ...mockTextReply,
        type: 'image',
        content: 'image.jpg'
      };

      render(<ReplyPreview replyTo={imageMessage} onClose={jest.fn()} />);
      
      expect(screen.getByText('🖼️ Photo')).toBeInTheDocument();
    });

    it('displays video indicator for video messages', () => {
      const videoMessage = {
        ...mockTextReply,
        type: 'video',
        content: 'video.mp4'
      };

      render(<ReplyPreview replyTo={videoMessage} onClose={jest.fn()} />);
      
      expect(screen.getByText('🎥 Video')).toBeInTheDocument();
    });

    it('displays audio indicator for audio messages', () => {
      const audioMessage = {
        ...mockTextReply,
        type: 'audio',
        content: 'audio.mp3'
      };

      render(<ReplyPreview replyTo={audioMessage} onClose={jest.fn()} />);
      
      expect(screen.getByText('🎙️ Audio')).toBeInTheDocument();
    });

    it('displays document indicator with filename', () => {
      const documentMessage = {
        ...mockTextReply,
        type: 'document',
        filename: 'document.pdf'
      };

      render(<ReplyPreview replyTo={documentMessage} onClose={jest.fn()} />);
      
      expect(screen.getByText('📄 document.pdf')).toBeInTheDocument();
    });

    it('displays document indicator without filename', () => {
      const documentMessage = {
        ...mockTextReply,
        type: 'document'
      };

      render(<ReplyPreview replyTo={documentMessage} onClose={jest.fn()} />);
      
      expect(screen.getByText('📄 Document')).toBeInTheDocument();
    });

    it('displays location indicator for location messages', () => {
      const locationMessage = {
        ...mockTextReply,
        type: 'location'
      };

      render(<ReplyPreview replyTo={locationMessage} onClose={jest.fn()} />);
      
      expect(screen.getByText('📍 Location')).toBeInTheDocument();
    });

    it('displays contact indicator for contact messages', () => {
      const contactMessage = {
        ...mockTextReply,
        type: 'contact'
      };

      render(<ReplyPreview replyTo={contactMessage} onClose={jest.fn()} />);
      
      expect(screen.getByText('👤 Contact')).toBeInTheDocument();
    });

    it('handles unknown message types', () => {
      const unknownMessage = {
        ...mockTextReply,
        type: 'unknown',
        content: 'Unknown message type'
      };

      render(<ReplyPreview replyTo={unknownMessage} onClose={jest.fn()} />);
      
      expect(screen.getByText('Unknown message type')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<ReplyPreview {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByRole('button', { name: /cancel reply/i });
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
      const onClose = jest.fn();
      
      render(<ReplyPreview {...defaultProps} onClose={onClose} />);
      
      const replyPreview = document.querySelector('.reply-preview');
      fireEvent.keyDown(replyPreview, { key: 'Escape' });
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose for other keys', () => {
      const onClose = jest.fn();
      
      render(<ReplyPreview {...defaultProps} onClose={onClose} />);
      
      const replyPreview = document.querySelector('.reply-preview');
      fireEvent.keyDown(replyPreview, { key: 'Enter' });
      fireEvent.keyDown(replyPreview, { key: 'Space' });
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('prevents event propagation when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      const parentClick = jest.fn();
      
      render(
        <div onClick={parentClick}>
          <ReplyPreview {...defaultProps} onClose={onClose} />
        </div>
      );
      
      const closeButton = screen.getByRole('button', { name: /cancel reply/i });
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(parentClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ReplyPreview {...defaultProps} />);
      
      const replyPreview = document.querySelector('.reply-preview');
      expect(replyPreview).toHaveAttribute('role', 'region');
      expect(replyPreview).toHaveAttribute('aria-label', 'Replying to message from John Doe');
    });

    it('has proper title attributes for tooltips', () => {
      render(<ReplyPreview {...defaultProps} />);
      
      const senderElement = screen.getByText('John Doe');
      expect(senderElement).toHaveAttribute('title', 'John Doe');
      
      const excerptElement = screen.getByText('This is the original message that we are replying to');
      expect(excerptElement).toHaveAttribute('title', 'This is the original message that we are replying to');
    });

    it('has accessible close button', () => {
      render(<ReplyPreview {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /cancel reply/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Cancel reply');
      expect(closeButton).toHaveAttribute('title', 'Cancel reply');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing senderName', () => {
      const messageWithoutSender = {
        ...mockTextReply,
        senderName: undefined
      };

      render(<ReplyPreview replyTo={messageWithoutSender} onClose={jest.fn()} />);
      
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('handles empty content', () => {
      const emptyMessage = {
        ...mockTextReply,
        content: ''
      };

      render(<ReplyPreview replyTo={emptyMessage} onClose={jest.fn()} />);
      
      // Should render without crashing
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('handles null content', () => {
      const nullContentMessage = {
        ...mockTextReply,
        content: null
      };

      render(<ReplyPreview replyTo={nullContentMessage} onClose={jest.fn()} />);
      
      // Should render without crashing
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('handles missing onClose callback', () => {
      render(<ReplyPreview replyTo={mockTextReply} />);
      
      // Should render without crashing
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      
      // Close button should still be clickable without errors
      const closeButton = screen.getByRole('button', { name: /cancel reply/i });
      fireEvent.click(closeButton);
    });

    it('handles very long sender names', () => {
      const longSenderMessage = {
        ...mockTextReply,
        senderName: 'This is a very long sender name that should be truncated properly'
      };

      render(<ReplyPreview replyTo={longSenderMessage} onClose={jest.fn()} />);
      
      const senderElement = screen.getByText('This is a very long sender name that should be truncated properly');
      expect(senderElement).toBeInTheDocument();
      expect(senderElement).toHaveClass('reply-sender');
    });
  });

  describe('Custom Props', () => {
    it('respects custom maxLength', () => {
      const message = {
        ...mockTextReply,
        content: 'This message should be truncated at custom length'
      };

      render(<ReplyPreview replyTo={message} onClose={jest.fn()} maxLength={20} />);
      
      const excerpt = screen.getByText(/This message should.../);
      expect(excerpt).toBeInTheDocument();
      expect(excerpt.textContent.length).toBeLessThanOrEqual(23); // 20 + "..."
    });

    it('handles zero maxLength', () => {
      render(<ReplyPreview {...defaultProps} maxLength={0} />);
      
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('handles negative maxLength', () => {
      render(<ReplyPreview {...defaultProps} maxLength={-10} />);
      
      expect(screen.getByText('...')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily when props do not change', () => {
      const { rerender } = render(<ReplyPreview {...defaultProps} />);
      
      const initialSender = screen.getByText('John Doe');
      
      rerender(<ReplyPreview {...defaultProps} />);
      
      const afterSender = screen.getByText('John Doe');
      expect(initialSender).toBe(afterSender);
    });
  });
});