import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider } from '../contexts/AuthContext';
import SearchBar from '../components/Search/SearchBar';
import SearchResults from '../components/Search/SearchResults';
import useSearchHistory from '../hooks/useSearchHistory';
import useSearchNavigation from '../hooks/useSearchNavigation';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock hooks
jest.mock('../hooks/useSearchHistory', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../hooks/useSearchNavigation', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token',
    user: { userId: '123', neighbourhoodId: '456' },
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

const theme = createTheme();

// Test data
const mockSearchResults = {
  users: [
    { _id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    { _id: 'user2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
  ],
  notices: [
    { 
      _id: 'notice1', 
      title: 'Community Meeting', 
      content: 'Join us for a community meeting', 
      createdAt: new Date().toISOString(),
      author: { firstName: 'Admin', lastName: 'User' }
    },
  ],
  reports: [
    { 
      _id: 'report1', 
      title: 'Broken Streetlight', 
      description: 'Streetlight not working on Main St', 
      createdAt: new Date().toISOString(),
      reporter: { firstName: 'Jane', lastName: 'Smith' }
    },
  ],
  chats: [
    { _id: 'chat1', name: 'Neighborhood Chat', chatType: 'group', memberCount: 15 },
  ],
  messages: [
    { 
      _id: 'message1', 
      content: 'Hello everyone!', 
      chatId: 'chat1', 
      chatType: 'group',
      chatName: 'Neighborhood Chat',
      createdAt: new Date().toISOString(),
      sender: { firstName: 'John', lastName: 'Doe' }
    },
  ],
};

describe('Search Components', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock hooks
    useSearchHistory.mockReturnValue({
      addToHistory: jest.fn(),
      getHistory: jest.fn().mockReturnValue(['previous search']),
      clearHistory: jest.fn(),
    });
    
    useSearchNavigation.mockReturnValue({
      navigateToResult: jest.fn(),
    });
    
    // Setup axios mock
    axios.get.mockResolvedValue({ data: mockSearchResults });
  });

  describe('SearchBar Component', () => {
    test('renders search input', () => {
      render(
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <SearchBar placeholder="Search..." />
          </BrowserRouter>
        </ThemeProvider>
      );
      
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });
    
    test('shows search history when focused with empty query', async () => {
      render(
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <SearchBar placeholder="Search..." />
          </BrowserRouter>
        </ThemeProvider>
      );
      
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.focus(searchInput);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Searches')).toBeInTheDocument();
        expect(screen.getByText('previous search')).toBeInTheDocument();
      });
    });
    
    test('performs search when query is entered', async () => {
      render(
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <SearchBar placeholder="Search..." />
          </BrowserRouter>
        </ThemeProvider>
      );
      
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/search/autocomplete', {
          params: { q: 'test query' },
          headers: { Authorization: 'Bearer mock-token' }
        });
      });
    });
  });

  describe('SearchResults Component', () => {
    test('renders grouped search results', () => {
      render(
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <SearchResults 
              results={mockSearchResults} 
              onResultSelect={jest.fn()}
              activeResultIndex={-1}
              setActiveResultIndex={jest.fn()}
              activeSection={null}
              setActiveSection={jest.fn()}
              query="test"
            />
          </BrowserRouter>
        </ThemeProvider>
      );
      
      expect(screen.getByText('People')).toBeInTheDocument();
      expect(screen.getByText('Notices')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Chats')).toBeInTheDocument();
      expect(screen.getByText('Messages')).toBeInTheDocument();
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Community Meeting')).toBeInTheDocument();
      expect(screen.getByText('Broken Streetlight')).toBeInTheDocument();
      expect(screen.getByText('Neighborhood Chat')).toBeInTheDocument();
    });
    
    test('calls onResultSelect when a result is clicked', () => {
      const mockOnResultSelect = jest.fn();
      
      render(
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <SearchResults 
              results={mockSearchResults} 
              onResultSelect={mockOnResultSelect}
              activeResultIndex={-1}
              setActiveResultIndex={jest.fn()}
              activeSection={null}
              setActiveSection={jest.fn()}
              query="test"
            />
          </BrowserRouter>
        </ThemeProvider>
      );
      
      fireEvent.click(screen.getByText('John Doe'));
      
      expect(mockOnResultSelect).toHaveBeenCalledWith(
        mockSearchResults.users[0],
        'users'
      );
    });
  });

  describe('useSearchHistory Hook', () => {
    test('adds search query to history', () => {
      const mockAddToHistory = jest.fn();
      const mockGetHistory = jest.fn().mockReturnValue(['previous search']);
      
      useSearchHistory.mockReturnValue({
        addToHistory: mockAddToHistory,
        getHistory: mockGetHistory,
        clearHistory: jest.fn(),
      });
      
      render(
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <SearchBar placeholder="Search..." />
          </BrowserRouter>
        </ThemeProvider>
      );
      
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'new search' } });
      fireEvent.submit(searchInput.closest('form'));
      
      expect(mockAddToHistory).toHaveBeenCalledWith('new search');
    });
  });

  describe('useSearchNavigation Hook', () => {
    test('navigates to result when selected', () => {
      const mockNavigateToResult = jest.fn();
      
      useSearchNavigation.mockReturnValue({
        navigateToResult: mockNavigateToResult,
      });
      
      render(
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <SearchBar 
              placeholder="Search..." 
              onResultSelect={(item, type) => mockNavigateToResult(item, type)}
            />
          </BrowserRouter>
        </ThemeProvider>
      );
      
      // Simulate search and result selection
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      // Wait for results to appear and select one
      waitFor(() => {
        const result = screen.getByText('John Doe');
        fireEvent.click(result);
        
        expect(mockNavigateToResult).toHaveBeenCalledWith(
          mockSearchResults.users[0],
          'users'
        );
      });
    });
  });
});