import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import InChatSearchBar from '../InChatSearchBar';

const theme = createTheme();

const mockMessages = [
  {
    id: '1',
    content: 'Hello world, this is a test message',
    senderName: 'John Doe',
    timestamp: new Date('2023-01-01T10:00:00Z')
  },
  {
    id: '2',
    content: 'Another message with different content',
    senderName: 'Jane Smith',
    timestamp: new Date('2023-01-01T11:00:00Z')
  },
  {
    id: '3',
    content: 'Hello again from John',
    senderName: 'John Doe',
    timestamp: new Date('2023-01-01T12:00:00Z')
  }
];

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('InChatSearchBar', () => {
  const defaultProps = {
    messages: mockMessages,
    onSearchResults: jest.fn(),
    onHighlightMessage: jest.fn(),
    onClose: jest.fn(),
    isVisible: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible', () => {
    renderWithTheme(<InChatSearchBar {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Search in this chat...')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    renderWithTheme(<InChatSearchBar {...defaultProps} isVisible={false} />);
    
    expect(screen.queryByPlaceholderText('Search in this chat...')).not.toBeInTheDocument();
  });

  it('searches messages and shows results', async () => {
    renderWithTheme(<InChatSearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search in this chat...');
    fireEvent.change(searchInput, { target: { value: 'hello' } });

    await waitFor(() => {
      expect(defaultProps.onSearchResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            messageId: '1',
            type: 'content'
          }),
          expect.objectContaining({
            messageId: '3',
            type: 'content'
          })
        ])
      );
    });

    expect(screen.getByText('1 of 2 results')).toBeInTheDocument();
  });

  it('searches in sender names', async () => {
    renderWithTheme(<InChatSearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search in this chat...');
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(defaultProps.onSearchResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            messageId: '1',
            type: 'sender'
          }),
          expect.objectContaining({
            messageId: '3',
            type: 'sender'
          })
        ])
      );
    });
  });

  it('shows no results message when no matches found', async () => {
    renderWithTheme(<InChatSearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search in this chat...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('navigates between search results', async () => {
    renderWithTheme(<InChatSearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search in this chat...');
    fireEvent.change(searchInput, { target: { value: 'hello' } });

    await waitFor(() => {
      expect(screen.getByText('1 of 2 results')).toBeInTheDocument();
    });

    // Click next button
    const nextButton = screen.getByRole('button', { name: /next result/i });
    fireEvent.click(nextButton);

    expect(defaultProps.onHighlightMessage).toHaveBeenCalledWith('3', 'hello');

    // Click previous button
    const prevButton = screen.getByRole('button', { name: /previous result/i });
    fireEvent.click(prevButton);

    expect(defaultProps.onHighlightMessage).toHaveBeenCalledWith('1', 'hello');
  });

  it('handles keyboard navigation', async () => {
    renderWithTheme(<InChatSearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search in this chat...');
    fireEvent.change(searchInput, { target: { value: 'hello' } });

    await waitFor(() => {
      expect(screen.getByText('1 of 2 results')).toBeInTheDocument();
    });

    // Press Enter to go to next result
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    expect(defaultProps.onHighlightMessage).toHaveBeenCalledWith('3', 'hello');

    // Press Shift+Enter to go to previous result
    fireEvent.keyDown(searchInput, { key: 'Enter', shiftKey: true });
    expect(defaultProps.onHighlightMessage).toHaveBeenCalledWith('1', 'hello');
  });

  it('handles escape key to close', async () => {
    renderWithTheme(<InChatSearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search in this chat...');
    
    fireEvent.keyDown(searchInput, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('clears search when clear button is clicked', async () => {
    renderWithTheme(<InChatSearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search in this chat...');
    fireEvent.change(searchInput, { target: { value: 'hello' } });

    await waitFor(() => {
      expect(screen.getByText('1 of 2 results')).toBeInTheDocument();
    });

    // Click clear button
    const clearButton = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(clearButton);

    expect(searchInput.value).toBe('');
    expect(defaultProps.onSearchResults).toHaveBeenCalledWith([]);
  });

  it('closes search when close button is clicked', async () => {
    renderWithTheme(<InChatSearchBar {...defaultProps} />);
    
    // Click close button
    const closeButton = screen.getByRole('button', { name: /close search/i });
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows current result context', async () => {
    renderWithTheme(<InChatSearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search in this chat...');
    fireEvent.change(searchInput, { target: { value: 'hello' } });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      // The context shows the first result which is "Hello again from John"
      expect(screen.getByText(/Hello again from John/)).toBeInTheDocument();
    });
  });

  it('formats timestamps correctly', async () => {
    renderWithTheme(<InChatSearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search in this chat...');
    fireEvent.change(searchInput, { target: { value: 'hello' } });

    await waitFor(() => {
      // Should show formatted time - the first result shows 14:00 (2 PM)
      expect(screen.getByText(/14:00/)).toBeInTheDocument();
    });
  });

  it('handles empty messages array', () => {
    renderWithTheme(
      <InChatSearchBar 
        {...defaultProps} 
        messages={[]} 
      />
    );
    
    expect(screen.getByPlaceholderText('Search in this chat...')).toBeInTheDocument();
  });

  it('handles messages without timestamps', async () => {
    const messagesWithoutTimestamp = [
      {
        id: '1',
        content: 'Hello world',
        senderName: 'John Doe'
      }
    ];

    renderWithTheme(
      <InChatSearchBar 
        {...defaultProps} 
        messages={messagesWithoutTimestamp}
      />
    );
    
    const searchInput = screen.getByPlaceholderText('Search in this chat...');
    fireEvent.change(searchInput, { target: { value: 'hello' } });

    await waitFor(() => {
      expect(defaultProps.onSearchResults).toHaveBeenCalled();
    });
  });

  it('debounces search input', async () => {
    renderWithTheme(<InChatSearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search in this chat...');
    
    // Type quickly
    fireEvent.change(searchInput, { target: { value: 'h' } });
    fireEvent.change(searchInput, { target: { value: 'he' } });
    fireEvent.change(searchInput, { target: { value: 'hel' } });
    fireEvent.change(searchInput, { target: { value: 'hell' } });
    fireEvent.change(searchInput, { target: { value: 'hello' } });

    // Should not call onSearchResults immediately
    expect(defaultProps.onSearchResults).not.toHaveBeenCalled();

    // Wait for debounce
    await waitFor(() => {
      expect(defaultProps.onSearchResults).toHaveBeenCalled();
    }, { timeout: 500 });
  });
});