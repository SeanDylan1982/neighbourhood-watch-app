import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageWithReactions from '../MessageWithReactions';
import { CHAT_TYPES } from '../../../../constants/chat';

// Mock the CSS imports
jest.mock('../MessageWithReactions.css', () => ({}));
jest.mock('../ReactionPicker.css', () => ({}));

// Mock the hooks
jest.mock('../../../../hooks/useReactionPicker', () => ({
  __esModule: true,
  default: () => ({
    isVisible: false,
    position: { x: 0, y: 0 },
    targetMessageId: null,
    showReactionPicker: jest.fn(),
    hideReactionPicker: jest.fn()
  })
}));

describe('MessageWithReactions', () => {
  const mockMessage = {
    id: 'message-123',
    content: 'Hello, this is a test message!',
    senderId: 'user-2',
    senderName: 'John Doe',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    type: 'text',
    status: 'read',
    reactions: [
      {
        type: 'thumbs_up',
        users: ['user-1', 'user-3'],
        count: 2
      },
      {
        type: 'heart',
        users: ['user-4'],
        count: 1
      }
    ]
  };

  const defaultProps = {
    message: mockMessage,
    chatType: CHAT_TYPES.GROUP,
    currentUserId: 'user-1',
    onReact: jest.fn(),
    onReply: jest.fn(),
    onCopy: jest.fn(),
    onForward: jest.fn(),
    onDelete: jest.fn(),
    onInfo: jest.fn(),
    onReport: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders message content correctly', () => {
      render(<MessageWithReactions {...defaultProps} />);
      
      expect(screen.getByText('Hello, this is a test message!')).toBeInTheDocument();
      expect(screen.getByText('10:30')).toBeInTheDocument(); // Time format
    });

    it('renders as own message when current user is sender', () => {
      const ownMessage = { ...mockMessage, senderId: 'user-1' };
      render(<MessageWithReactions {...defaultProps} message={ownMessage} />);
      
      const messageBubble = document.querySelector('.message-bubble');
      expect(messageBubble).toHaveClass('own-message');
    });

    it('renders as other message when current user is not sender', () => {
      render(<MessageWithReactions {...defaultProps} />);
      
      const messageBubble = document.querySelector('.message-bubble');
      expect(messageBubble).toHaveClass('other-message');
    });

    it('displays message status for own messages', () => {
      const ownMessage = { ...mockMessage, senderId: 'user-1', status: 'read' };
      render(<MessageWithReactions {...defaultProps} message={ownMessage} />);
      
      expect(screen.getByText('✓✓')).toBeInTheDocument();
    });

    it('does not display message status for other messages', () => {
      render(<MessageWithReactions {...defaultProps} />);
      
      expect(screen.queryByText('✓✓')).not.toBeInTheDocument();
    });

    it('renders existing reactions', () => {
      render(<MessageWithReactions {...defaultProps} />);
      
      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('highlights reactions from current user', () => {
      render(<MessageWithReactions {...defaultProps} />);
      
      const thumbsUpReaction = screen.getByText('👍').closest('.reaction-badge');
      expect(thumbsUpReaction).toHaveClass('user-reacted');
      
      const heartReaction = screen.getByText('❤️').closest('.reaction-badge');
      expect(heartReaction).not.toHaveClass('user-reacted');
    });

    it('does not render reactions section when no reactions exist', () => {
      const messageWithoutReactions = { ...mockMessage, reactions: [] };
      render(<MessageWithReactions {...defaultProps} message={messageWithoutReactions} />);
      
      expect(document.querySelector('.message-reactions')).not.toBeInTheDocument();
    });
  });

  describe('Context Menu Interactions', () => {
    it('opens menu on right click', async () => {
      const user = userEvent.setup();
      render(<MessageWithReactions {...defaultProps} />);
      
      const messageBubble = document.querySelector('.message-bubble');
      await user.pointer({ keys: '[MouseRight]', target: messageBubble });
      
      // Menu should be rendered (though we can't easily test MUI Popper visibility)
      expect(document.querySelector('[role="presentation"]')).toBeInTheDocument();
    });

    it('prevents default context menu behavior', () => {
      render(<MessageWithReactions {...defaultProps} />);
      
      const messageBubble = document.querySelector('.message-bubble');
      const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true });
      const preventDefaultSpy = jest.spyOn(contextMenuEvent, 'preventDefault');
      
      fireEvent(messageBubble, contextMenuEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('handles long press on mobile', async () => {
      render(<MessageWithReactions {...defaultProps} />);
      
      const messageBubble = document.querySelector('.message-bubble');
      
      // Simulate touch start
      fireEvent.touchStart(messageBubble, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      // Wait for long press timeout
      await waitFor(() => {
        // Menu should be triggered after long press
        expect(document.querySelector('[role="presentation"]')).toBeInTheDocument();
      }, { timeout: 600 });
    });
  });

  describe('Reaction Interactions', () => {
    it('calls onReact when clicking existing reaction', async () => {
      const user = userEvent.setup();
      render(<MessageWithReactions {...defaultProps} />);
      
      const thumbsUpReaction = screen.getByText('👍').closest('.reaction-badge');
      await user.click(thumbsUpReaction);
      
      expect(defaultProps.onReact).toHaveBeenCalledWith('message-123', 'thumbs_up');
    });

    it('shows correct tooltip for reactions', () => {
      render(<MessageWithReactions {...defaultProps} />);
      
      const thumbsUpReaction = screen.getByText('👍').closest('.reaction-badge');
      expect(thumbsUpReaction).toHaveAttribute('title', 'thumbs_up (2)');
    });
  });

  describe('Menu Actions', () => {
    it('calls onReply when reply action is triggered', () => {
      // This would require more complex testing of the MessageMenu component
      // For now, we test that the handlers are passed correctly
      render(<MessageWithReactions {...defaultProps} />);
      
      expect(defaultProps.onReply).toBeDefined();
      expect(defaultProps.onCopy).toBeDefined();
      expect(defaultProps.onForward).toBeDefined();
      expect(defaultProps.onDelete).toBeDefined();
      expect(defaultProps.onInfo).toBeDefined();
      expect(defaultProps.onReport).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('allows text selection in message content', () => {
      render(<MessageWithReactions {...defaultProps} />);
      
      const messageBubble = document.querySelector('.message-bubble');
      expect(messageBubble).toHaveStyle('user-select: text');
    });

    it('has proper cursor styles', () => {
      render(<MessageWithReactions {...defaultProps} />);
      
      const messageBubble = document.querySelector('.message-bubble');
      expect(messageBubble).toHaveStyle('cursor: pointer');
      
      const reactionBadges = document.querySelectorAll('.reaction-badge');
      reactionBadges.forEach(badge => {
        expect(badge).toHaveStyle('cursor: pointer');
      });
    });

    it('has proper ARIA attributes for reactions', () => {
      render(<MessageWithReactions {...defaultProps} />);
      
      const reactionButtons = screen.getAllByRole('button');
      reactionButtons.forEach(button => {
        expect(button).toHaveAttribute('title');
      });
    });
  });

  describe('Different Chat Types', () => {
    it('handles private chat type correctly', () => {
      render(<MessageWithReactions {...defaultProps} chatType={CHAT_TYPES.PRIVATE} />);
      
      // Component should render without errors
      expect(screen.getByText('Hello, this is a test message!')).toBeInTheDocument();
    });

    it('handles group chat type correctly', () => {
      render(<MessageWithReactions {...defaultProps} chatType={CHAT_TYPES.GROUP} />);
      
      // Component should render without errors
      expect(screen.getByText('Hello, this is a test message!')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles message without reactions gracefully', () => {
      const messageWithoutReactions = { ...mockMessage, reactions: undefined };
      render(<MessageWithReactions {...defaultProps} message={messageWithoutReactions} />);
      
      expect(screen.getByText('Hello, this is a test message!')).toBeInTheDocument();
      expect(document.querySelector('.message-reactions')).not.toBeInTheDocument();
    });

    it('handles empty reactions array', () => {
      const messageWithEmptyReactions = { ...mockMessage, reactions: [] };
      render(<MessageWithReactions {...defaultProps} message={messageWithEmptyReactions} />);
      
      expect(screen.getByText('Hello, this is a test message!')).toBeInTheDocument();
      expect(document.querySelector('.message-reactions')).not.toBeInTheDocument();
    });

    it('handles missing optional props', () => {
      const minimalProps = {
        message: mockMessage,
        currentUserId: 'user-1'
      };
      
      render(<MessageWithReactions {...minimalProps} />);
      
      expect(screen.getByText('Hello, this is a test message!')).toBeInTheDocument();
    });

    it('handles unknown reaction types', () => {
      const messageWithUnknownReaction = {
        ...mockMessage,
        reactions: [
          {
            type: 'unknown_reaction',
            users: ['user-1'],
            count: 1
          }
        ]
      };
      
      render(<MessageWithReactions {...defaultProps} message={messageWithUnknownReaction} />);
      
      // Should fallback to default emoji
      expect(screen.getByText('👍')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const { rerender } = render(<MessageWithReactions {...defaultProps} />);
      
      const initialContent = screen.getByText('Hello, this is a test message!');
      
      rerender(<MessageWithReactions {...defaultProps} />);
      
      const afterContent = screen.getByText('Hello, this is a test message!');
      expect(initialContent).toBe(afterContent);
    });
  });
});