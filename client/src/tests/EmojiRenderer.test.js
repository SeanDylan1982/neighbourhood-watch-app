import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmojiRenderer from '../components/Common/EmojiRenderer';

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

describe('EmojiRenderer Component', () => {
  test('renders plain text without emojis', () => {
    render(<EmojiRenderer content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  test('renders text with a single emoji', () => {
    render(<EmojiRenderer content="Hello {{EMOJI:1F600}} world" />);
    
    // Check if text parts are rendered
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
    
    // Check if emoji is rendered
    expect(screen.getByTestId('emoji-1F600')).toBeInTheDocument();
  });

  test('renders text with multiple emojis', () => {
    render(<EmojiRenderer content="Hello {{EMOJI:1F600}} world {{EMOJI:1F60D}}" />);
    
    // Check if text parts are rendered
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
    
    // Check if emojis are rendered
    expect(screen.getByTestId('emoji-1F600')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-1F60D')).toBeInTheDocument();
  });

  test('renders only emojis without text', () => {
    render(<EmojiRenderer content="{{EMOJI:1F600}}{{EMOJI:1F60D}}" />);
    
    // Check if emojis are rendered
    expect(screen.getByTestId('emoji-1F600')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-1F60D')).toBeInTheDocument();
  });

  test('handles null or empty content', () => {
    const { container: container1 } = render(<EmojiRenderer content={null} />);
    expect(container1.firstChild).toBeNull();
    
    const { container: container2 } = render(<EmojiRenderer content="" />);
    expect(container2.firstChild).toBeNull();
  });

  test('applies custom size to emojis', () => {
    render(<EmojiRenderer content="{{EMOJI:1F600}}" size={40} />);
    
    const emoji = screen.getByTestId('emoji-1F600');
    expect(emoji).toHaveStyle('width: 40px');
    expect(emoji).toHaveStyle('height: 40px');
  });
});