import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook for contact picker functionality
 * Manages contact selection, filtering, and sharing
 * 
 * Requirements addressed:
 * - 7.1: Display options for Camera, Photo & Video Library, Document, Location, and Contact
 * - 7.6: Show name and phone/email information for contacts
 */
const useContactPicker = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);

  // Fetch contacts from API
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch neighbours
      const neighboursResponse = await axios.get('/api/users/neighbours');
      const neighbours = neighboursResponse.data.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        address: user.address,
        type: 'neighbour',
        avatar: user.avatar,
        isOnline: user.isOnline || false
      }));

      // Fetch friends
      let friends = [];
      try {
        const friendsResponse = await axios.get('/api/friends', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        friends = friendsResponse.data.map(friend => ({
          id: friend.id,
          name: `${friend.firstName} ${friend.lastName}`,
          email: friend.email,
          phone: friend.phone,
          address: friend.address,
          type: 'friend',
          avatar: friend.avatar,
          isOnline: friend.isOnline || false
        }));
      } catch (friendsError) {
        console.warn('Could not fetch friends:', friendsError);
      }

      // Combine and deduplicate contacts
      const allContacts = [...neighbours, ...friends];
      const uniqueContacts = allContacts.reduce((acc, contact) => {
        const existing = acc.find(c => c.id === contact.id);
        if (!existing) {
          acc.push(contact);
        } else if (contact.type === 'friend' && existing.type === 'neighbour') {
          // Prefer friend status over neighbour
          existing.type = 'friend';
        }
        return acc;
      }, []);

      // Sort contacts alphabetically
      uniqueContacts.sort((a, b) => a.name.localeCompare(b.name));

      setContacts(uniqueContacts);
      setFilteredContacts(uniqueContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setError('Failed to load contacts. Please try again.');
      setContacts([]);
      setFilteredContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter contacts based on search query
  const filterContacts = useCallback((query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const filtered = contacts.filter(contact => {
      const searchTerm = query.toLowerCase();
      return (
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.email.toLowerCase().includes(searchTerm) ||
        (contact.phone && contact.phone.includes(searchTerm))
      );
    });

    setFilteredContacts(filtered);
  }, [contacts]);

  // Select a contact
  const selectContact = useCallback((contact) => {
    setSelectedContact(contact);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedContact(null);
  }, []);

  // Format contact for sharing
  const formatContactForSharing = useCallback((contact) => {
    if (!contact) return null;

    return {
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
    };
  }, []);

  // Get contact by ID
  const getContactById = useCallback((contactId) => {
    return contacts.find(contact => contact.id === contactId);
  }, [contacts]);

  // Check if contacts are available
  const hasContacts = filteredContacts.length > 0;

  // Load contacts on mount
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Update filtered contacts when search query changes
  useEffect(() => {
    filterContacts(searchQuery);
  }, [searchQuery, filterContacts]);

  return {
    // State
    contacts: filteredContacts,
    allContacts: contacts,
    loading,
    error,
    searchQuery,
    selectedContact,
    hasContacts,

    // Actions
    fetchContacts,
    filterContacts,
    selectContact,
    clearSelection,
    formatContactForSharing,
    getContactById,

    // Utilities
    setSearchQuery
  };
};

export default useContactPicker;