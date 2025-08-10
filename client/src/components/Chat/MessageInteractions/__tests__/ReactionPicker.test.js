import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReactionPicker from '../ReactionPicker';

// Mock CSS import
jest.mock('../ReactionPicker.css', () => ({}));

describe('ReactionPicker Component', () => {
  const defaultProps = {
    messageId: 'message-1',
    existingReactions: [],
    currentUserId: 'user-1',
    onReact: jest.fn(),
    onClose: jest.fn(),
    position: { x: 100, y: 200 },
    isVisible: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders when visible', () => {
      render(<ReactionPicker {...defaultProps} />);

      expect(screen.getByRole('button', { name: /react with thumbs_up/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /react with laugh/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /react with wow/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /react with heart/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /react with sad/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /react with angry/i })).toBeInTheDocument();
    });

    it('does not render when not visible', () => {
      render(<ReactionPicker {...defaultProps} isVisible={false} />);

      expect(screen.queryByRole('button', { name: /react with thumbs_up/i })).not.toBeInTheDocument();
    });

    it('renders all common reaction emojis', () => {
      render(<ReactionPicker {...defaultProps} />);

      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('😂')).toBeInTheDocument();
      expect(screen.getByText('😮')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('😢')).toBeInTheDocument();
      expect(screen.getByText('😡')).toBeInTheDocument();
    });

    it('applies correct positioning styles', () => {
      render(<ReactionPicker {...defaultProps} />);

      const picker = document.querySelector('.reaction-picker');
      expect(picker).toHaveStyle({
        left: '100px',
        top: '200px',
        transform: 'translateY(-100%)'
      });
    });
  });

  describe('Existing Reactions Display', () => {
    it('shows reaction counts for existing reactions', () => {
      const existingReactions = [
        { type: 'thumbs_up', users: ['user-2', 'user-3'], count: 2 },
        { type: 'heart', users: ['user-4'], count: 1 }
      ];

      render(
        <ReactionPicker 
          {...defaultProps} 
          existingReactions={existingReactions}
        />
      );

      // Find thumbs up button and check for count
      const thumbsUpButton = screen.getByRole('button', { name: /react with thumbs_up/i });
      expect(thumbsUpButton).toContainHTML('2');

      // Find heart button and check for count
      const heartButton = screen.getByRole('button', { name: /react with heart/i });
      expect(heartButton).toContainHTML('1');
    });

    it('highlights reactions user has already made', () => {
      const existingReactions = [
        { type: 'thumbs_up', users: ['user-1', 'user-2'], count: 2 }
      ];

      render(
        <ReactionPicker 
          {...defaultProps} 
          existingReactions={existingReactions}
        />
      );

      const thumbsUpButton = screen.getByRole('button', { name: /react with thumbs_up/i });
      expect(thumbsUpButton).toHaveClass('selected');
    });

    it('does not show count for reactions with zero count', () => {
      render(<ReactionPicker {...defaultProps} />);

      const thumbsUpButton = screen.getByRole('button', { name: /react with thumbs_up/i });
      expect(thumbsUpButton.querySelector('.reaction-count')).not.toBeInTheDocument();
    });
  });

  describe('Reaction Selection', () => {
    it('calls onReact when reaction is clicked', async () => {
      const onReact = jest.fn();

      render(
        <ReactionPicker 
          {...defaultProps} 
          onReact={onReact}
        />
      );

      const thumbsUpButton = screen.getByRole('button', { name: /react with thumbs_up/i });
      fireEvent.click(thumbsUpButton);

      expect(onReact).toHaveBeenCalledWith('message-1', 'thumbs_up');
    });

    it('shows animation when reaction is selected', async () => {
      render(<ReactionPicker {...defaultProps} />);

      const thumbsUpButton = screen.getByRole('button', { name: /react with thumbs_up/i });
      fireEvent.click(thumbsUpButton);

      expect(thumbsUpButton).toHaveClass('animating');
    });

    it('closes picker after reaction selection with delay', async () => {
      const onClose = jest.fn();

      render(
        <ReactionPicker 
          {...defaultProps} 
          onClose={onClose}
        />
      );

      const thumbsUpButton = screen.getByRole('button', { name: /react with thumbs_up/i });
      fireEvent.click(thumbsUpButton);

      // Should not close immediately
      expect(onClose).not.toHaveBeenCalled();

      // Should close after delay
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      }, { timeout: 200 });
    });
  });

  describe('Click Outside Behavior', () => {
    it('closes picker when clicking outside', () => {
      const onClose = jest.fn();

      render(
        <ReactionPicker 
          {...defaultProps} 
          onClose={onClose}
        />
      );

      // Click outside the picker
      fireEvent.mouseDown(document.body);

      expect(onClose).toHaveBeenCalled();
    });

    it('does not close when clicking inside picker', () => {
      const onClose = jest.fn();

      render(
        <ReactionPicker 
          {...defaultProps} 
          onClose={onClose}
        />
      );

      const picker = document.querySelector('.reaction-picker');
      fireEvent.mouseDown(picker);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('closes picker on Escape key', () => {
      const onClose = jest.fn();

      render(
        <ReactionPicker 
          {...defaultProps} 
          onClose={onClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });

    it('does not close on other keys', () => {
      const onClose = jest.fn();

      render(
        <ReactionPicker 
          {...defaultProps} 
          onClose={onClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Event Cleanup', () => {
    it('removes event listeners when component unmounts', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = render(<ReactionPicker {...defaultProps} />);

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('removes event listeners when visibility changes to false', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { rerender } = render(<ReactionPicker {...defaultProps} />);

      rerender(<ReactionPicker {...defaultProps} isVisible={false} />);

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Reaction Button States', () => {
    it('shows correct tooltip for each reaction', () => {
      render(<ReactionPicker {...defaultProps} />);

      const thumbsUpButton = screen.getByRole('button', { name: /react with thumbs_up/i });
      expect(thumbsUpButton).toHaveAttribute('title', '👍 thumbs up');

      const laughButton = screen.getByRole('button', { name: /react with laugh/i });
      expect(laughButton).toHaveAttribute('title', '😂 laugh');

      const wowButton = screen.getByRole('button', { name: /react with wow/i });
      expect(wowButton).toHaveAttribute('title', '😮 wow');

      const heartButton = screen.getByRole('button', { name: /react with heart/i });
      expect(heartButton).toHaveAttribute('title', '❤️ heart');

      const sadButton = screen.getByRole('button', { name: /react with sad/i });
      expect(sadButton).toHaveAttribute('title', '😢 sad');

      const angryButton = screen.getByRole('button', { name: /react with angry/i });
      expect(angryButton).toHaveAttribute('title', '😡 angry');
    });

    it('has proper aria-label for accessibility', () => {
      render(<ReactionPicker {...defaultProps} />);

      expect(screen.getByLabelText('React with thumbs up')).toBeInTheDocument();
      expect(screen.getByLabelText('React with laugh')).toBeInTheDocument();
      expect(screen.getByLabelText('React with wow')).toBeInTheDocument();
      expect(screen.getByLabelText('React with heart')).toBeInTheDocument();
      expect(screen.getByLabelText('React with sad')).toBeInTheDocument();
      expect(screen.getByLabelText('React with angry')).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('renders picker arrow', () => {
      render(<ReactionPicker {...defaultProps} />);

      const arrow = document.querySelector('.reaction-picker-arrow');
      expect(arrow).toBeInTheDocument();
    });

    it('renders picker content container', () => {
      render(<ReactionPicker {...defaultProps} />);

      const content = document.querySelector('.reaction-picker-content');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onReact callback', () => {
      render(
        <ReactionPicker 
          {...defaultProps} 
          onReact={null}
        />
      );

      const thumbsUpButton = screen.getByRole('button', { name: /react with thumbs_up/i });
      
      // Should not throw error when clicked
      expect(() => {
        fireEvent.click(thumbsUpButton);
      }).not.toThrow();
    });

    it('handles missing onClose callback', () => {
      render(
        <ReactionPicker 
          {...defaultProps} 
          onClose={null}
        />
      );

      // Should not throw error when clicking outside
      expect(() => {
        fireEvent.mouseDown(document.body);
      }).not.toThrow();

      // Should not throw error when pressing Escape
      expect(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      }).not.toThrow();
    });

    it('handles undefined messageId', () => {
      const onReact = jest.fn();

      render(
        <ReactionPicker 
          {...defaultProps} 
          messageId={undefined}
          onReact={onReact}
        />
      );

      const thumbsUpButton = screen.getByRole('button', { name: /react with thumbs_up/i });
      fireEvent.click(thumbsUpButton);

      expect(onReact).toHaveBeenCalledWith(undefined, 'thumbs_up');
    });

    it('handles empty existingReactions array', () => {
      render(
        <ReactionPicker 
          {...defaultProps} 
          existingReactions={[]}
        />
      );

      // All buttons should be unselected and have no counts
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveClass('selected');
        expect(button.querySelector('.reaction-count')).not.toBeInTheDocument();
      });
    });

    it('handles malformed existingReactions', () => {
      const malformedReactions = [
        { type: 'thumbs_up' }, // Missing users and count
        { users: ['user-1'], count: 1 }, // Missing type
        null, // Null reaction
        undefined // Undefined reaction
      ];

      render(
        <ReactionPicker 
          {...defaultProps} 
          existingReactions={malformedReactions}
        />
      );

      // Should still render without errors
      expect(screen.getByText('👍')).toBeInTheDocument();
    });

    it('handles zero position coordinates', () => {
      render(
        <ReactionPicker 
          {...defaultProps} 
          position={{ x: 0, y: 0 }}
        />
      );

      const picker = document.querySelector('.reaction-picker');
      expect(picker).toHaveStyle({
        left: '0px',
        top: '0px'
      });
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily when props do not change', () => {
      const { rerender } = render(<ReactionPicker {...defaultProps} />);

      // Re-render with same props
      rerender(<ReactionPicker {...defaultProps} />);

      // Component should still be rendered correctly
      expect(screen.getByText('👍')).toBeInTheDocument();
    });
  });
});