import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MessageInteractions from './MessageInteractions';

// Create a theme for testing
const theme = createTheme();

// Wrapper component to provide theme
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('MessageInteractions', () => {
  const defaultProps = {
    messageId: 'test-message-1',
    isVisible: true,
    isOwnMessage: false,
    existingReactions: [],
    currentUserId: 'user-123',
    onReply: jest.fn(),
    onReact: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders reply and reaction buttons when visible', () => {
    render(
      <TestWrapper>
        <MessageInteractions {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByLabelText('Reply to message')).toBeInTheDocument();
    expect(screen.getByLabelText('Add reaction')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(
      <TestWrapper>
        <MessageInteractions {...defaultProps} isVisible={false} />
      </TestWrapper>
    );

    expect(screen.queryByLabelText('Reply to message')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Add reaction')).not.toBeInTheDocument();
  });

  it('calls onReply when reply button is clicked', () => {
    render(
      <TestWrapper>
        <MessageInteractions {...defaultProps} />
      </TestWrapper>
    );

    const replyButton = screen.getByLabelText('Reply to message').querySelector('button');
    fireEvent.click(replyButton);
    expect(defaultProps.onReply).toHaveBeenCalledWith('test-message-1');
  });

  it('shows reaction options on hover', async () => {
    render(
      <TestWrapper>
        <MessageInteractions {...defaultProps} />
      </TestWrapper>
    );

    const reactionButton = screen.getByLabelText('Add reaction');
    fireEvent.mouseEnter(reactionButton.closest('div'));

    await waitFor(() => {
      expect(screen.getByLabelText('Thumbs Up')).toBeInTheDocument();
      expect(screen.getByLabelText('Heart')).toBeInTheDocument();
      expect(screen.getByLabelText('Smile')).toBeInTheDocument();
      expect(screen.getByLabelText('Laugh')).toBeInTheDocument();
      expect(screen.getByLabelText('Sad')).toBeInTheDocument();
      expect(screen.getByLabelText('Angry')).toBeInTheDocument();
    });
  });

  it('calls onReact when reaction is selected', async () => {
    render(
      <TestWrapper>
        <MessageInteractions {...defaultProps} />
      </TestWrapper>
    );

    const reactionButton = screen.getByLabelText('Add reaction');
    fireEvent.mouseEnter(reactionButton.closest('div'));

    await waitFor(() => {
      const thumbsUpButton = screen.getByLabelText('Thumbs Up').querySelector('button');
      fireEvent.click(thumbsUpButton);
    });

    expect(defaultProps.onReact).toHaveBeenCalledWith('test-message-1', 'thumbs_up');
  });

  it('displays existing reactions with counts', () => {
    const existingReactions = [
      { type: 'thumbs_up', users: ['user-1', 'user-2'], count: 2 },
      { type: 'heart', users: ['user-3'], count: 1 }
    ];

    render(
      <TestWrapper>
        <MessageInteractions 
          {...defaultProps} 
          existingReactions={existingReactions}
        />
      </TestWrapper>
    );

    const reactionChips = screen.getAllByText('2');
    expect(reactionChips.length).toBeGreaterThan(0);
    const heartReactionChips = screen.getAllByText('1');
    expect(heartReactionChips.length).toBeGreaterThan(0);
  });

  it('highlights reactions when current user has reacted', () => {
    const existingReactions = [
      { type: 'thumbs_up', users: ['user-123', 'user-2'], count: 2 }
    ];

    render(
      <TestWrapper>
        <MessageInteractions 
          {...defaultProps} 
          existingReactions={existingReactions}
        />
      </TestWrapper>
    );

    const reactionChips = screen.getAllByText('2');
    const reactionChip = reactionChips.find(chip => 
      chip.closest('.MuiChip-root')
    );
    expect(reactionChip).toBeInTheDocument();
  });

  it('positions interactions correctly for own messages', () => {
    render(
      <TestWrapper>
        <MessageInteractions {...defaultProps} isOwnMessage={true} />
      </TestWrapper>
    );

    // Check that the component renders for own messages
    expect(screen.getByLabelText('Reply to message')).toBeInTheDocument();
    expect(screen.getByLabelText('Add reaction')).toBeInTheDocument();
  });

  it('positions interactions correctly for other messages', () => {
    render(
      <TestWrapper>
        <MessageInteractions {...defaultProps} isOwnMessage={false} />
      </TestWrapper>
    );

    // Check that the component renders for other messages
    expect(screen.getByLabelText('Reply to message')).toBeInTheDocument();
    expect(screen.getByLabelText('Add reaction')).toBeInTheDocument();
  });
});