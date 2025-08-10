import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageReactions from '../MessageReactions';

// Mock CSS imports
jest.mock('../MessageReactions.css', () => ({}));

// Mock Material-UI components
jest.mock('@mui/material', () => ({
  Tooltip: ({ children, title, open }) => (
    <div data-testid="tooltip" title={title} style={{ display: open ? 'block' : 'none' }}>
      {children}
    </div>
  ),
  Popper: ({ children, open, anchorEl }) => (
    <div data-testid="popper" style={{ display: open && anchorEl ? 'block' : 'none' }}>
      {typeof children === 'function' ? children({ TransitionProps: {} }) : children}
    </div>
  ),
  Paper: ({ children, className, sx, ...props }) => (
    <div className={className} style={sx} {...props}>
      {children}
    </div>
  ),
  ClickAwayListener: ({ children }) => children,
  Fade: ({ children }) => children
}));

describe('MessageReactions', () => {
  const mockReactions = [
    {
      type: 'thumbs_up',
      users: ['user-1', 'user-2'],
      count: 2
    },
    {
      type: 'heart',
      users: ['user-3'],
      count: 1
    },
    {
      type: 'laugh',
      users: ['user-1', 'user-4', 'user-5'],
      count: 3
    }
  ];

  const defaultProps = {
    messageId: 'message-123',
    reactions: mockReactions,
    currentUserId: 'user-1',
    onReactionClick: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all reactions with correct emojis and counts', () => {
      render(<MessageReactions {...defaultProps} />);
      
      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('😂')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('does not render when reactions array is empty', () => {
      render(<MessageReactions {...defaultProps} reactions={[]} />);
      
      expect(screen.queryByText('👍')).not.toBeInTheDocument();
    });

    it('does not render when reactions is null', () => {
      render(<MessageReactions {...defaultProps} reactions={null} />);
      
      expect(screen.queryByText('👍')).not.toBeInTheDocument();
    });

    it('highlights reactions from current user', () => {
      render(<MessageReactions {...defaultProps} />);
      
      const thumbsUpButton = screen.getByText('👍').closest('button');
      const heartButton = screen.getByText('❤️').closest('button');
      
      expect(thumbsUpButton).toHaveClass('user-reacted');
      expect(heartButton).not.toHaveClass('user-reacted');
    });

    it('applies size classes correctly', () => {
      const { rerender } = render(<MessageReactions {...defaultProps} size="small" />);
      
      let container = document.querySelector('.message-reactions');
      expect(container).toHaveClass('small');
      
      rerender(<MessageReactions {...defaultProps} size="large" />);
      container = document.querySelector('.message-reactions');
      expect(container).toHaveClass('large');
    });

    it('applies variant classes correctly', () => {
      const { rerender } = render(<MessageReactions {...defaultProps} variant="compact" />);
      
      let container = document.querySelector('.message-reactions');
      expect(container).toHaveClass('compact');
      
      rerender(<MessageReactions {...defaultProps} variant="minimal" />);
      container = document.querySelector('.message-reactions');
      expect(container).toHaveClass('minimal');
    });

    it('applies custom className', () => {
      render(<MessageReactions {...defaultProps} className="custom-class" />);
      
      const container = document.querySelector('.message-reactions');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Reaction Sorting and Limiting', () => {
    it('sorts reactions by count (descending)', () => {
      render(<MessageReactions {...defaultProps} />);
      
      const reactionButtons = screen.getAllByRole('button');
      const counts = reactionButtons.map(button => 
        parseInt(button.querySelector('.reaction-count').textContent)
      );
      
      expect(counts).toEqual([3, 2, 1]); // laugh (3), thumbs_up (2), heart (1)
    });

    it('limits visible reactions when maxVisibleReactions is set', () => {
      render(<MessageReactions {...defaultProps} maxVisibleReactions={2} />);
      
      const reactionButtons = screen.getAllByRole('button');
      expect(reactionButtons).toHaveLength(2);
      
      expect(screen.getByText('+1')).toBeInTheDocument(); // Hidden count indicator
    });

    it('filters out reactions with zero count', () => {
      const reactionsWithZero = [
        ...mockReactions,
        { type: 'sad', users: [], count: 0 }
      ];
      
      render(<MessageReactions {...defaultProps} reactions={reactionsWithZero} />);
      
      expect(screen.queryByText('😢')).not.toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onReactionClick when reaction is clicked', async () => {
      const user = userEvent.setup();
      const onReactionClick = jest.fn();
      
      render(<MessageReactions {...defaultProps} onReactionClick={onReactionClick} />);
      
      const thumbsUpButton = screen.getByText('👍').closest('button');
      await user.click(thumbsUpButton);
      
      expect(onReactionClick).toHaveBeenCalledWith('message-123', 'thumbs_up');
    });

    it('does not call onReactionClick when disabled', async () => {
      const user = userEvent.setup();
      const onReactionClick = jest.fn();
      
      render(
        <MessageReactions 
          {...defaultProps} 
          onReactionClick={onReactionClick}
          disabled={true}
        />
      );
      
      const thumbsUpButton = screen.getByText('👍').closest('button');
      await user.click(thumbsUpButton);
      
      expect(onReactionClick).not.toHaveBeenCalled();
    });

    it('does not call onReactionClick when allowToggle is false', async () => {
      const user = userEvent.setup();
      const onReactionClick = jest.fn();
      
      render(
        <MessageReactions 
          {...defaultProps} 
          onReactionClick={onReactionClick}
          allowToggle={false}
        />
      );
      
      const thumbsUpButton = screen.getByText('👍').closest('button');
      await user.click(thumbsUpButton);
      
      expect(onReactionClick).not.toHaveBeenCalled();
    });

    it('stops event propagation when reaction is clicked', async () => {
      const user = userEvent.setup();
      const parentClick = jest.fn();
      const onReactionClick = jest.fn();
      
      render(
        <div onClick={parentClick}>
          <MessageReactions {...defaultProps} onReactionClick={onReactionClick} />
        </div>
      );
      
      const thumbsUpButton = screen.getByText('👍').closest('button');
      await user.click(thumbsUpButton);
      
      expect(onReactionClick).toHaveBeenCalled();
      expect(parentClick).not.toHaveBeenCalled();
    });
  });

  describe('Tooltips', () => {
    it('shows tooltip on hover when showUserTooltips is true', async () => {
      const user = userEvent.setup();
      render(<MessageReactions {...defaultProps} showUserTooltips={true} />);
      
      const thumbsUpButton = screen.getByText('👍').closest('button');
      await user.hover(thumbsUpButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('popper')).toBeVisible();
      });
    });

    it('does not show tooltip when showUserTooltips is false', async () => {
      const user = userEvent.setup();
      render(<MessageReactions {...defaultProps} showUserTooltips={false} />);
      
      const thumbsUpButton = screen.getByText('👍').closest('button');
      await user.hover(thumbsUpButton);
      
      expect(screen.queryByTestId('popper')).not.toBeVisible();
    });

    it('calls onReactionHover when hovering', async () => {
      const user = userEvent.setup();
      const onReactionHover = jest.fn();
      
      render(
        <MessageReactions 
          {...defaultProps} 
          onReactionHover={onReactionHover}
          showUserTooltips={true}
        />
      );
      
      const thumbsUpButton = screen.getByText('👍').closest('button');
      await user.hover(thumbsUpButton);
      
      expect(onReactionHover).toHaveBeenCalledWith('message-123', 'thumbs_up', true);
      
      await user.unhover(thumbsUpButton);
      
      expect(onReactionHover).toHaveBeenCalledWith('message-123', 'thumbs_up', false);
    });

    it('generates correct tooltip content for single user', () => {
      const singleUserReaction = [
        { type: 'heart', users: ['user-1'], count: 1 }
      ];
      
      render(
        <MessageReactions 
          {...defaultProps} 
          reactions={singleUserReaction}
          showUserTooltips={true}
        />
      );
      
      const heartButton = screen.getByText('❤️').closest('button');
      expect(heartButton).toHaveAttribute('title', 'You reacted with ❤️');
    });

    it('generates correct tooltip content for multiple users', () => {
      render(<MessageReactions {...defaultProps} showUserTooltips={true} />);
      
      const thumbsUpButton = screen.getByText('👍').closest('button');
      expect(thumbsUpButton).toHaveAttribute('title', expect.stringContaining('reacted with 👍'));
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for reaction buttons', () => {
      render(<MessageReactions {...defaultProps} />);
      
      const thumbsUpButton = screen.getByText('👍').closest('button');
      expect(thumbsUpButton).toHaveAttribute('aria-label', '👍 2 reactions, you reacted');
      
      const heartButton = screen.getByText('❤️').closest('button');
      expect(heartButton).toHaveAttribute('aria-label', '❤️ 1 reaction');
    });

    it('has proper role attributes for emojis', () => {
      render(<MessageReactions {...defaultProps} />);
      
      const emojiElements = screen.getAllByRole('img');
      expect(emojiElements).toHaveLength(3);
      
      emojiElements.forEach(emoji => {
        expect(emoji).toHaveAttribute('aria-label');
      });
    });

    it('disables buttons when disabled prop is true', () => {
      render(<MessageReactions {...defaultProps} disabled={true} />);
      
      const reactionButtons = screen.getAllByRole('button');
      reactionButtons.forEach(button => {
        expect(button).toBeDisabled();
        expect(button).toHaveClass('disabled');
      });
    });
  });

  describe('Emoji Mapping', () => {
    it('maps reaction types to correct emojis', () => {
      const allReactionTypes = [
        { type: 'thumbs_up', expected: '👍' },
        { type: 'laugh', expected: '😂' },
        { type: 'wow', expected: '😮' },
        { type: 'heart', expected: '❤️' },
        { type: 'sad', expected: '😢' },
        { type: 'angry', expected: '😡' },
        { type: 'like', expected: '👍' },
        { type: 'love', expected: '❤️' },
        { type: 'haha', expected: '😂' },
        { type: 'care', expected: '🤗' },
        { type: 'surprised', expected: '😮' },
        { type: 'cry', expected: '😢' },
        { type: 'mad', expected: '😡' }
      ];

      allReactionTypes.forEach(({ type, expected }) => {
        const reactions = [{ type, users: ['user-1'], count: 1 }];
        
        const { unmount } = render(
          <MessageReactions {...defaultProps} reactions={reactions} />
        );
        
        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });

    it('falls back to thumbs up for unknown reaction types', () => {
      const unknownReaction = [
        { type: 'unknown_reaction', users: ['user-1'], count: 1 }
      ];
      
      render(<MessageReactions {...defaultProps} reactions={unknownReaction} />);
      
      expect(screen.getByText('👍')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles reactions without users array', () => {
      const reactionsWithoutUsers = [
        { type: 'thumbs_up', count: 2 }
      ];
      
      render(<MessageReactions {...defaultProps} reactions={reactionsWithoutUsers} />);
      
      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('handles empty users array', () => {
      const reactionsWithEmptyUsers = [
        { type: 'thumbs_up', users: [], count: 0 }
      ];
      
      render(<MessageReactions {...defaultProps} reactions={reactionsWithEmptyUsers} />);
      
      // Should not render reactions with zero count
      expect(screen.queryByText('👍')).not.toBeInTheDocument();
    });

    it('handles missing currentUserId', () => {
      render(<MessageReactions {...defaultProps} currentUserId={null} />);
      
      const reactionButtons = screen.getAllByRole('button');
      reactionButtons.forEach(button => {
        expect(button).not.toHaveClass('user-reacted');
      });
    });

    it('handles missing callback functions', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageReactions 
          messageId="message-123"
          reactions={mockReactions}
          currentUserId="user-1"
        />
      );
      
      const thumbsUpButton = screen.getByText('👍').closest('button');
      
      // Should not throw errors
      await user.click(thumbsUpButton);
      await user.hover(thumbsUpButton);
      
      expect(screen.getByText('👍')).toBeInTheDocument();
    });

    it('handles very large reaction counts', () => {
      const largeCountReaction = [
        { type: 'thumbs_up', users: Array.from({length: 999}, (_, i) => `user-${i}`), count: 999 }
      ];
      
      render(<MessageReactions {...defaultProps} reactions={largeCountReaction} />);
      
      expect(screen.getByText('999')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily when props do not change', () => {
      const { rerender } = render(<MessageReactions {...defaultProps} />);
      
      const initialButtons = screen.getAllByRole('button');
      
      rerender(<MessageReactions {...defaultProps} />);
      
      const afterButtons = screen.getAllByRole('button');
      expect(initialButtons).toHaveLength(afterButtons.length);
    });

    it('handles large numbers of reactions efficiently', () => {
      const manyReactions = Array.from({length: 20}, (_, i) => ({
        type: `reaction_${i}`,
        users: [`user-${i}`],
        count: i + 1
      }));
      
      render(<MessageReactions {...defaultProps} reactions={manyReactions} />);
      
      // Should limit to maxVisibleReactions (default 6)
      const reactionButtons = screen.getAllByRole('button');
      expect(reactionButtons.length).toBeLessThanOrEqual(6);
      
      // Should show hidden count
      expect(screen.getByText('+14')).toBeInTheDocument();
    });
  });
});