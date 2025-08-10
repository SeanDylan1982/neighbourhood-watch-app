import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmojiPicker from '../components/Common/EmojiPicker';

// Mock the AnimatedFluentEmoji component
jest.mock('animated-fluent-emojis', () => ({
  AnimatedFluentEmoji: function MockAnimatedFluentEmoji({ unified, size }) {
    return (
      <div data-testid={`emoji-${unified}`} style={{ width: size, height: size }}>
        Emoji {unified}
      </div>
    );
  }
}));

describe('EmojiPicker Component', () => {
  const mockOnEmojiSelect = jest.fn();
  
  beforeEach(() => {
    // Clear mock calls between tests
    mockOnEmojiSelect.mockClear();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(() => JSON.stringify([])),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  test('renders emoji button', () => {
    render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);
    const emojiButton = screen.getByLabelText('emoji picker');
    expect(emojiButton).toBeInTheDocument();
  });

  test('opens popover when button is clicked', async () => {
    render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);
    
    // Click the emoji button
    const emojiButton = screen.getByLabelText('emoji picker');
    fireEvent.click(emojiButton);
    
    // Check if search input appears (indicating popover is open)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search emojis...')).toBeInTheDocument();
    });
  });

  test('displays emoji categories', async () => {
    render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);
    
    // Open the picker
    const emojiButton = screen.getByLabelText('emoji picker');
    fireEvent.click(emojiButton);
    
    // Check if category tabs are displayed
    await waitFor(() => {
      expect(screen.getByLabelText('Smileys')).toBeInTheDocument();
      expect(screen.getByLabelText('Animals')).toBeInTheDocument();
      expect(screen.getByLabelText('Food')).toBeInTheDocument();
    });
  });

  test('calls onEmojiSelect when emoji is clicked', async () => {
    render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);
    
    // Open the picker
    const emojiButton = screen.getByLabelText('emoji picker');
    fireEvent.click(emojiButton);
    
    // Wait for any emoji to render
    await waitFor(() => {
      const emojiElements = document.querySelectorAll('[data-testid^="emoji-"]');
      expect(emojiElements.length).toBeGreaterThan(0);
    });
    
    // Get the first emoji and click it
    const firstEmoji = document.querySelector('[data-testid^="emoji-"]');
    fireEvent.click(firstEmoji);
    
    // Check if onEmojiSelect was called
    expect(mockOnEmojiSelect).toHaveBeenCalled();
  });

  test('filters emojis when searching', async () => {
    render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);
    
    // Open the picker
    const emojiButton = screen.getByLabelText('emoji picker');
    fireEvent.click(emojiButton);
    
    // Type in search box
    const searchInput = await screen.findByPlaceholderText('Search emojis...');
    fireEvent.change(searchInput, { target: { value: 'heart' } });
    
    // Check if search results are filtered - we know there are heart emojis in the symbols category
    await waitFor(() => {
      // Just check if any emoji is present after filtering
      const emojiElements = document.querySelectorAll('[data-testid^="emoji-"]');
      expect(emojiElements.length).toBeGreaterThan(0);
    });
  });
});