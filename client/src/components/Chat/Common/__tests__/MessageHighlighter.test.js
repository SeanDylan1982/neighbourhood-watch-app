import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MessageHighlighter, { useMessageHighlighter } from '../MessageHighlighter';
import { renderHook } from '@testing-library/react';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('MessageHighlighter', () => {
  it('renders text without highlighting when no search query', () => {
    renderWithTheme(
      <MessageHighlighter text="Hello world" searchQuery="" />
    );
    
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.queryByRole('mark')).not.toBeInTheDocument();
  });

  it('highlights matching text', () => {
    renderWithTheme(
      <MessageHighlighter text="Hello world" searchQuery="hello" />
    );
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
    
    // Check that the highlighted text is wrapped in a Box component with mark styling
    const helloElement = screen.getByText('Hello');
    expect(helloElement.closest('.MuiBox-root')).toBeInTheDocument();
  });

  it('highlights multiple matches', () => {
    renderWithTheme(
      <MessageHighlighter text="Hello world, hello again" searchQuery="hello" />
    );
    
    const helloElements = screen.getAllByText(/hello/i);
    expect(helloElements).toHaveLength(2);
    
    helloElements.forEach(element => {
      expect(element.closest('.MuiBox-root')).toBeInTheDocument();
    });
  });

  it('is case insensitive by default', () => {
    renderWithTheme(
      <MessageHighlighter text="Hello World" searchQuery="hello" />
    );
    
    expect(screen.getByText('Hello').closest('.MuiBox-root')).toBeInTheDocument();
  });

  it('handles special regex characters', () => {
    renderWithTheme(
      <MessageHighlighter text="Price: $10.99" searchQuery="$10.99" />
    );
    
    expect(screen.getByText('$10.99')).toBeInTheDocument();
    expect(screen.getByText('$10.99').closest('.MuiBox-root')).toBeInTheDocument();
  });

  it('applies custom highlight styles', () => {
    const customStyle = {
      backgroundColor: 'red',
      color: 'white'
    };

    renderWithTheme(
      <MessageHighlighter 
        text="Hello world" 
        searchQuery="hello" 
        highlightStyle={customStyle}
      />
    );
    
    const markElement = screen.getByText('Hello').closest('.MuiBox-root');
    expect(markElement).toHaveStyle('background-color: red');
    expect(markElement).toHaveStyle('color: white');
  });

  it('handles empty text', () => {
    renderWithTheme(
      <MessageHighlighter text="" searchQuery="hello" />
    );
    
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
  });

  it('handles invalid regex patterns gracefully', () => {
    // This should not throw an error
    renderWithTheme(
      <MessageHighlighter text="Hello world" searchQuery="[invalid" />
    );
    
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('works with Typography component', () => {
    const { Typography } = require('@mui/material');
    
    renderWithTheme(
      <MessageHighlighter 
        text="Hello world" 
        searchQuery="hello" 
        component={Typography}
        variant="body1"
      />
    );
    
    const typographyElement = screen.getByText('Hello').closest('.MuiTypography-root');
    expect(typographyElement).toBeInTheDocument();
    expect(screen.getByText('Hello').closest('.MuiBox-root')).toBeInTheDocument();
  });

  it('works with custom component', () => {
    renderWithTheme(
      <MessageHighlighter 
        text="Hello world" 
        searchQuery="hello" 
        component="p"
        className="custom-class"
      />
    );
    
    const paragraphElement = screen.getByText('Hello').closest('p');
    expect(paragraphElement).toBeInTheDocument();
    expect(paragraphElement).toHaveClass('custom-class');
  });
});

describe('useMessageHighlighter', () => {
  it('returns text and matches for valid search', () => {
    const { result } = renderHook(() => useMessageHighlighter());
    
    const highlighted = result.current.getHighlightedText('Hello world', 'hello');
    
    expect(highlighted.text).toBe('Hello world');
    expect(highlighted.matches).toHaveLength(1);
    expect(highlighted.matches[0]).toEqual({
      text: 'Hello',
      index: 0,
      length: 5
    });
    expect(highlighted.hasMatches).toBe(true);
    expect(highlighted.matchCount).toBe(1);
  });

  it('returns empty matches for no search query', () => {
    const { result } = renderHook(() => useMessageHighlighter());
    
    const highlighted = result.current.getHighlightedText('Hello world', '');
    
    expect(highlighted.text).toBe('Hello world');
    expect(highlighted.matches).toHaveLength(0);
    expect(highlighted.hasMatches).toBe(false);
    expect(highlighted.matchCount).toBe(0);
  });

  it('finds multiple matches', () => {
    const { result } = renderHook(() => useMessageHighlighter());
    
    const highlighted = result.current.getHighlightedText('Hello world, hello again', 'hello');
    
    expect(highlighted.matches).toHaveLength(2);
    expect(highlighted.matches[0]).toEqual({
      text: 'Hello',
      index: 0,
      length: 5
    });
    expect(highlighted.matches[1]).toEqual({
      text: 'hello',
      index: 13,
      length: 5
    });
  });

  it('respects case sensitivity option', () => {
    const { result } = renderHook(() => useMessageHighlighter());
    
    const caseSensitive = result.current.getHighlightedText(
      'Hello world', 
      'hello', 
      { caseSensitive: true }
    );
    
    expect(caseSensitive.matches).toHaveLength(0);
    
    const caseInsensitive = result.current.getHighlightedText(
      'Hello world', 
      'hello', 
      { caseSensitive: false }
    );
    
    expect(caseInsensitive.matches).toHaveLength(1);
  });

  it('respects whole word option', () => {
    const { result } = renderHook(() => useMessageHighlighter());
    
    const wholeWord = result.current.getHighlightedText(
      'Hello world', 
      'ell', 
      { wholeWord: true }
    );
    
    expect(wholeWord.matches).toHaveLength(0);
    
    const partialWord = result.current.getHighlightedText(
      'Hello world', 
      'ell', 
      { wholeWord: false }
    );
    
    expect(partialWord.matches).toHaveLength(1);
  });

  it('respects max matches option', () => {
    const { result } = renderHook(() => useMessageHighlighter());
    
    const limited = result.current.getHighlightedText(
      'hello hello hello', 
      'hello', 
      { maxMatches: 2 }
    );
    
    expect(limited.matches).toHaveLength(2);
    
    const unlimited = result.current.getHighlightedText(
      'hello hello hello', 
      'hello', 
      { maxMatches: -1 }
    );
    
    expect(unlimited.matches).toHaveLength(3);
  });

  it('highlights matches in text', () => {
    const { result } = renderHook(() => useMessageHighlighter());
    
    const matches = [
      { text: 'Hello', index: 0, length: 5 },
      { text: 'world', index: 6, length: 5 }
    ];
    
    const highlighted = result.current.highlightMatches('Hello world', matches);
    
    expect(highlighted).toBe('<span class="highlight">Hello</span> <span class="highlight">world</span>');
  });

  it('uses custom highlight class', () => {
    const { result } = renderHook(() => useMessageHighlighter());
    
    const matches = [
      { text: 'Hello', index: 0, length: 5 }
    ];
    
    const highlighted = result.current.highlightMatches('Hello world', matches, 'custom-highlight');
    
    expect(highlighted).toBe('<span class="custom-highlight">Hello</span> world');
  });

  it('handles empty matches array', () => {
    const { result } = renderHook(() => useMessageHighlighter());
    
    const highlighted = result.current.highlightMatches('Hello world', []);
    
    expect(highlighted).toBe('Hello world');
  });

  it('handles invalid regex patterns gracefully', () => {
    const { result } = renderHook(() => useMessageHighlighter());
    
    const highlighted = result.current.getHighlightedText('Hello world', '[invalid');
    
    expect(highlighted.text).toBe('Hello world');
    expect(highlighted.matches).toHaveLength(0);
  });
});