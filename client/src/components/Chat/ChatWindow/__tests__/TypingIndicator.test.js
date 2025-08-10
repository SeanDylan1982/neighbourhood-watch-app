import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import TypingIndicator from '../TypingIndicator';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('TypingIndicator', () => {
  it('should not render when no users are typing', () => {
    renderWithTheme(<TypingIndicator users={[]} />);
    
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
  });

  it('should render when users are typing', () => {
    const users = [{ id: '1', name: 'John Doe' }];
    
    renderWithTheme(<TypingIndicator users={users} />);
    
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });

  it('should display single user typing correctly', () => {
    const users = [{ id: '1', name: 'John Doe' }];
    
    renderWithTheme(<TypingIndicator users={users} />);
    
    expect(screen.getByText('John Doe is typing')).toBeInTheDocument();
  });

  it('should display two users typing correctly', () => {
    const users = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' }
    ];
    
    renderWithTheme(<TypingIndicator users={users} />);
    
    expect(screen.getByText('John Doe and Jane Smith are typing')).toBeInTheDocument();
  });

  it('should display multiple users typing correctly', () => {
    const users = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
      { id: '3', name: 'Bob Johnson' }
    ];
    
    renderWithTheme(<TypingIndicator users={users} />);
    
    expect(screen.getByText('John Doe and 2 others are typing')).toBeInTheDocument();
  });

  it('should render animated dots', () => {
    const users = [{ id: '1', name: 'John Doe' }];
    
    renderWithTheme(<TypingIndicator users={users} />);
    
    const indicator = screen.getByTestId('typing-indicator');
    const dots = indicator.querySelectorAll('.MuiBox-root');
    
    // Should have at least 3 animated dots (plus other Box elements)
    expect(dots.length).toBeGreaterThanOrEqual(3);
  });

  it('should handle empty user name gracefully', () => {
    const users = [{ id: '1', name: '' }];
    
    renderWithTheme(<TypingIndicator users={users} />);
    
    expect(screen.getByText('is typing')).toBeInTheDocument();
  });

  it('should handle undefined user name gracefully', () => {
    const users = [{ id: '1' }];
    
    renderWithTheme(<TypingIndicator users={users} />);
    
    expect(screen.getByText('undefined is typing')).toBeInTheDocument();
  });

  it('should accept chatType prop', () => {
    const users = [{ id: '1', name: 'John Doe' }];
    
    renderWithTheme(<TypingIndicator users={users} chatType="private" />);
    
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });

  it('should have proper styling for WhatsApp-like appearance', () => {
    const users = [{ id: '1', name: 'John Doe' }];
    
    renderWithTheme(<TypingIndicator users={users} />);
    
    const indicator = screen.getByTestId('typing-indicator');
    const styles = window.getComputedStyle(indicator);
    
    // Should have rounded corners
    expect(styles.borderRadius).toBe('18px');
  });

  it('should display with fade animation', () => {
    const users = [{ id: '1', name: 'John Doe' }];
    
    const { container } = renderWithTheme(<TypingIndicator users={users} />);
    
    // Should have fade transition styles
    const fadeElement = container.querySelector('[style*="transition"]');
    expect(fadeElement).toBeInTheDocument();
  });

  describe('User Name Formatting', () => {
    it('should format single user correctly', () => {
      const users = [{ id: '1', name: 'Alice' }];
      
      renderWithTheme(<TypingIndicator users={users} />);
      
      expect(screen.getByText('Alice is typing')).toBeInTheDocument();
    });

    it('should format two users correctly', () => {
      const users = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' }
      ];
      
      renderWithTheme(<TypingIndicator users={users} />);
      
      expect(screen.getByText('Alice and Bob are typing')).toBeInTheDocument();
    });

    it('should format three users correctly', () => {
      const users = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Charlie' }
      ];
      
      renderWithTheme(<TypingIndicator users={users} />);
      
      expect(screen.getByText('Alice and 2 others are typing')).toBeInTheDocument();
    });

    it('should format four users correctly', () => {
      const users = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Charlie' },
        { id: '4', name: 'David' }
      ];
      
      renderWithTheme(<TypingIndicator users={users} />);
      
      expect(screen.getByText('Alice and 3 others are typing')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive styling', () => {
      const users = [{ id: '1', name: 'John Doe' }];
      
      renderWithTheme(<TypingIndicator users={users} />);
      
      const indicator = screen.getByTestId('typing-indicator');
      
      // Should have max-width for responsive design
      expect(indicator).toHaveStyle({ maxWidth: '70%' });
    });
  });

  describe('Accessibility', () => {
    it('should have proper test id for testing', () => {
      const users = [{ id: '1', name: 'John Doe' }];
      
      renderWithTheme(<TypingIndicator users={users} />);
      
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    });

    it('should have readable text content', () => {
      const users = [{ id: '1', name: 'John Doe' }];
      
      renderWithTheme(<TypingIndicator users={users} />);
      
      const text = screen.getByText('John Doe is typing');
      expect(text).toBeVisible();
    });
  });
});