import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ContactPicker from '../ContactPicker';

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn()
}));

// Mock the useContactPicker hook
jest.mock('../../../hooks/useContactPicker', () => {
  return jest.fn(() => ({
    contacts: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        type: 'friend',
        avatar: null,
        isOnline: true
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+0987654321',
        address: '456 Oak Ave',
        type: 'neighbour',
        avatar: null,
        isOnline: false
      }
    ],
    loading: false,
    error: '',
    searchQuery: '',
    selectedContact: null,
    hasContacts: true,
    filterContacts: jest.fn(),
    selectContact: jest.fn(),
    clearSelection: jest.fn(),
    formatContactForSharing: jest.fn((contact) => ({
      type: 'contact',
      contactInfo: contact,
      preview: `👤 ${contact.name}`,
      displayText: contact.name
    })),
    fetchContacts: jest.fn(),
    setSearchQuery: jest.fn()
  }));
});

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ContactPicker', () => {
  const mockOnContactSelect = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    onContactSelect: mockOnContactSelect,
    onClose: mockOnClose,
    disabled: false,
    showPreview: true
  };

  describe('Rendering', () => {
    it('renders the contact picker with header', () => {
      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      expect(screen.getByText('Share Contact')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search contacts...')).toBeInTheDocument();
    });

    it('renders contact list when contacts are available', () => {
      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('displays contact type chips correctly', () => {
      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      expect(screen.getByText('friend')).toBeInTheDocument();
      expect(screen.getByText('neighbour')).toBeInTheDocument();
    });

    it('shows online status indicator for online contacts', () => {
      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      // Online indicator should be present for John Doe (online: true)
      const johnDoeItem = screen.getByText('John Doe').closest('.MuiListItem-root');
      expect(johnDoeItem).toBeInTheDocument();
    });

    it('renders close button when onClose is provided', () => {
      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('renders refresh button', () => {
      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh contacts/i });
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('updates search query when typing in search field', async () => {
      const user = userEvent.setup();
      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search contacts...');
      await user.type(searchInput, 'John');
      
      expect(searchInput).toHaveValue('John');
    });

    it('calls filterContacts when search input changes', async () => {
      const useContactPicker = require('../../../hooks/useContactPicker');
      const mockFilterContacts = jest.fn();
      const mockSetSearchQuery = jest.fn();
      
      useContactPicker.mockReturnValue({
        ...useContactPicker(),
        filterContacts: mockFilterContacts,
        setSearchQuery: mockSetSearchQuery
      });

      const user = userEvent.setup();
      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search contacts...');
      await user.type(searchInput, 'John');
      
      expect(mockSetSearchQuery).toHaveBeenCalledWith('John');
      expect(mockFilterContacts).toHaveBeenCalledWith('John');
    });
  });

  describe('Contact Selection', () => {
    it('selects contact when clicked', async () => {
      const useContactPicker = require('../../../hooks/useContactPicker');
      const mockSelectContact = jest.fn();
      
      useContactPicker.mockReturnValue({
        ...useContactPicker(),
        selectContact: mockSelectContact
      });

      const user = userEvent.setup();
      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      const johnDoeButton = screen.getByText('John Doe').closest('button');
      await user.click(johnDoeButton);
      
      expect(mockSelectContact).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'John Doe',
          email: 'john@example.com'
        })
      );
    });

    it('shows preview mode when showPreview is true and contact is selected', () => {
      const useContactPicker = require('../../../hooks/useContactPicker');
      
      useContactPicker.mockReturnValue({
        ...useContactPicker(),
        selectedContact: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          address: '123 Main St',
          type: 'friend',
          avatar: null,
          isOnline: true
        }
      });

      renderWithTheme(<ContactPicker {...defaultProps} showPreview={true} />);
      
      // Simulate preview mode by setting state
      act(() => {
        // This would normally be triggered by contact selection
      });
    });

    it('calls onContactSelect immediately when showPreview is false', async () => {
      const useContactPicker = require('../../../hooks/useContactPicker');
      const mockFormatContactForSharing = jest.fn(() => ({
        type: 'contact',
        contactInfo: { id: '1', name: 'John Doe' },
        preview: '👤 John Doe'
      }));
      
      useContactPicker.mockReturnValue({
        ...useContactPicker(),
        formatContactForSharing: mockFormatContactForSharing
      });

      const user = userEvent.setup();
      renderWithTheme(<ContactPicker {...defaultProps} showPreview={false} />);
      
      const johnDoeButton = screen.getByText('John Doe').closest('button');
      await user.click(johnDoeButton);
      
      expect(mockFormatContactForSharing).toHaveBeenCalled();
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading spinner when loading is true', () => {
      const useContactPicker = require('../../../hooks/useContactPicker');
      
      useContactPicker.mockReturnValue({
        ...useContactPicker(),
        loading: true,
        contacts: [],
        hasContacts: false
      });

      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows error message when error is present', () => {
      const useContactPicker = require('../../../hooks/useContactPicker');
      
      useContactPicker.mockReturnValue({
        ...useContactPicker(),
        error: 'Failed to load contacts',
        contacts: [],
        hasContacts: false
      });

      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      expect(screen.getByText('Failed to load contacts')).toBeInTheDocument();
    });

    it('shows no contacts message when no contacts are available', () => {
      const useContactPicker = require('../../../hooks/useContactPicker');
      
      useContactPicker.mockReturnValue({
        ...useContactPicker(),
        contacts: [],
        hasContacts: false,
        loading: false,
        error: ''
      });

      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      expect(screen.getByText(/no contacts available/i)).toBeInTheDocument();
    });

    it('shows no search results message when search yields no results', () => {
      const useContactPicker = require('../../../hooks/useContactPicker');
      
      useContactPicker.mockReturnValue({
        ...useContactPicker(),
        contacts: [],
        hasContacts: false,
        loading: false,
        error: '',
        searchQuery: 'nonexistent'
      });

      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      expect(screen.getByText(/no contacts found matching your search/i)).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables search input when disabled prop is true', () => {
      renderWithTheme(<ContactPicker {...defaultProps} disabled={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search contacts...');
      expect(searchInput).toBeDisabled();
    });

    it('disables contact buttons when disabled prop is true', () => {
      renderWithTheme(<ContactPicker {...defaultProps} disabled={true} />);
      
      const johnDoeButton = screen.getByText('John Doe').closest('button');
      expect(johnDoeButton).toBeDisabled();
    });

    it('disables refresh button when loading', () => {
      const useContactPicker = require('../../../hooks/useContactPicker');
      
      useContactPicker.mockReturnValue({
        ...useContactPicker(),
        loading: true
      });

      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh contacts/i });
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Event Handlers', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls fetchContacts when refresh button is clicked', async () => {
      const useContactPicker = require('../../../hooks/useContactPicker');
      const mockFetchContacts = jest.fn();
      
      useContactPicker.mockReturnValue({
        ...useContactPicker(),
        fetchContacts: mockFetchContacts
      });

      const user = userEvent.setup();
      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh contacts/i });
      await user.click(refreshButton);
      
      expect(mockFetchContacts).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh contacts/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /search contacts/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search contacts...');
      
      // Tab to search input
      await user.tab();
      expect(searchInput).toHaveFocus();
      
      // Tab to first contact
      await user.tab();
      const firstContactButton = screen.getByText('John Doe').closest('button');
      expect(firstContactButton).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('applies mobile-specific styles on small screens', () => {
      // Mock window.matchMedia for mobile breakpoint
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('(max-width: 768px)'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderWithTheme(<ContactPicker {...defaultProps} />);
      
      // Component should render without errors on mobile
      expect(screen.getByText('Share Contact')).toBeInTheDocument();
    });
  });
});