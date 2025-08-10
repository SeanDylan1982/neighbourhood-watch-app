import { renderHook, act, waitFor } from '@testing-library/react';
import useContactPicker from '../useContactPicker';

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn()
}));
const axios = require('axios');

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useContactPicker', () => {
  const mockNeighbours = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St',
      avatar: null,
      isOnline: true
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '+0987654321',
      address: '456 Oak Ave',
      avatar: null,
      isOnline: false
    }
  ];

  const mockFriends = [
    {
      id: '3',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@example.com',
      phone: '+1122334455',
      address: '789 Pine St',
      avatar: null,
      isOnline: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    
    // Setup default axios responses
    axios.get.mockImplementation((url) => {
      if (url === '/api/users/neighbours') {
        return Promise.resolve({ data: mockNeighbours });
      }
      if (url === '/api/friends') {
        return Promise.resolve({ data: mockFriends });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  describe('Initial State', () => {
    it('initializes with correct default values', () => {
      const { result } = renderHook(() => useContactPicker());

      expect(result.current.contacts).toEqual([]);
      expect(result.current.allContacts).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe('');
      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedContact).toBe(null);
      expect(result.current.hasContacts).toBe(false);
    });
  });

  describe('fetchContacts', () => {
    it('fetches and combines neighbours and friends successfully', async () => {
      const { result } = renderHook(() => useContactPicker());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.contacts).toHaveLength(3);
      expect(result.current.allContacts).toHaveLength(3);
      expect(result.current.hasContacts).toBe(true);
      expect(result.current.error).toBe('');
    });

    it('handles API failure gracefully', async () => {
      axios.get.mockRejectedValue(new Error('API failed'));

      const { result } = renderHook(() => useContactPicker());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load contacts. Please try again.');
      expect(result.current.contacts).toEqual([]);
      expect(result.current.hasContacts).toBe(false);
    });
  });

  describe('filterContacts', () => {
    it('filters contacts by name', async () => {
      const { result } = renderHook(() => useContactPicker());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.filterContacts('John');
      });

      expect(result.current.contacts).toHaveLength(1);
      expect(result.current.contacts[0].name).toBe('John Doe');
      expect(result.current.searchQuery).toBe('John');
    });
  });

  describe('selectContact', () => {
    it('selects a contact', async () => {
      const { result } = renderHook(() => useContactPicker());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const contactToSelect = result.current.contacts[0];

      act(() => {
        result.current.selectContact(contactToSelect);
      });

      expect(result.current.selectedContact).toEqual(contactToSelect);
    });
  });

  describe('formatContactForSharing', () => {
    it('formats contact data correctly for sharing', async () => {
      const { result } = renderHook(() => useContactPicker());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const contact = result.current.contacts[0];
      const formattedContact = result.current.formatContactForSharing(contact);

      expect(formattedContact).toEqual({
        type: 'contact',
        contactInfo: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          address: contact.address,
          avatar: contact.avatar
        },
        preview: `👤 ${contact.name}`,
        displayText: contact.name,
        metadata: {
          contactType: contact.type,
          isOnline: contact.isOnline
        }
      });
    });
  });
});