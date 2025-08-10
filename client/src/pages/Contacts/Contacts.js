import React, { useState, useEffect } from 'react';
import { FriendsList, FriendRequests, FriendRequestButton } from '../../components/Friends';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  Tabs,
  Tab,
  Alert,
  Grid
} from '@mui/material';
import axios from 'axios';
import icons from '../../components/Common/Icons';
import { useToast } from '../../components/Common/Toast';

const Contacts = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendsCount, setFriendsCount] = useState(0);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const [addContactDialog, setAddContactDialog] = useState(false);
  const [addEmergencyDialog, setAddEmergencyDialog] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    relationship: 'neighbour'
  });
  const [newEmergencyContact, setNewEmergencyContact] = useState({
    name: '',
    phone: '',
    email: '',
    serviceType: 'police',
    description: ''
  });

  // Fetch real data from API
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await axios.get('/api/users/neighbours');
        const formattedContacts = response.data.map(user => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
          address: user.address,
          relationship: 'neighbour',
          isOnline: Math.random() > 0.5, // Random online status for now
          role: user.role,
          joinedDate: new Date(user.joinedAt).toISOString().split('T')[0]
        }));
        setContacts(formattedContacts);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        // Fallback to empty array
        setContacts([]);
      }
      setLoading(false);
    };

    // Benoni area emergency contacts
    const staticEmergencyContacts = [
      {
        id: 1,
        name: '🚓 Local Police Department - Benoni SAPS Station',
        phone: '10111',
        alternatePhones: ['011 747 0014', '011 747 0015', '065 740 2159'],
        email: 'jpjacobs@saps.gov.za',
        serviceType: 'police',
        address: '117 Harpur Avenue, Benoni, Gauteng, 1501',
        description: 'Emergency police response, crime reporting',
        services: 'Emergency police response, crime reporting'
      },
      {
        id: 2,
        name: '🚒 Fire Department - Benoni Central Fire Station',
        phone: '10111',
        alternatePhones: ['+27 11 422 2509'],
        email: '',
        serviceType: 'fire',
        address: '1 Liverpool Road, Benoni South, 1501',
        description: 'Fire and rescue operations, including ambulance backup via EMS',
        services: 'Fire and rescue operations, including ambulance backup via EMS'
      },
      {
        id: 3,
        name: '🚒 Rynfield/Ted Barber Fire Station',
        phone: '011 458 0911',
        alternatePhones: [],
        email: '',
        serviceType: 'fire',
        address: '179 Pretoria Road (M44), Rynfield, Benoni (~3 km from Airfield)',
        description: 'Local fire station serving Rynfield area',
        services: 'Fire and rescue operations'
      },
      {
        id: 4,
        name: '🚑 Gauteng Provincial Ambulance Services',
        phone: '011 564 2210',
        alternatePhones: ['011 564 2211'],
        email: '',
        serviceType: 'medical',
        address: '',
        description: 'Provincial emergency medical services',
        services: 'Emergency medical services'
      },
      {
        id: 5,
        name: '🚑 Netcare 911 (Private Ambulance)',
        phone: '10177',
        alternatePhones: ['0860 638 2273'],
        email: '',
        serviceType: 'medical',
        address: '',
        description: 'Private ambulance service',
        services: 'Private emergency medical services'
      },
      {
        id: 6,
        name: '🚑 ER24',
        phone: '084 124',
        alternatePhones: [],
        email: '',
        serviceType: 'medical',
        address: '',
        description: 'State-of-the-art emergency medical call centre',
        services: 'Emergency medical services'
      },
      {
        id: 7,
        name: '🚑 Nitro-Med EMS – Brentwood Park',
        phone: '086 142 5911',
        alternatePhones: [],
        email: '',
        serviceType: 'medical',
        address: 'Corner Louisa & Great North Rd, Brentwood Park, Benoni, 1501 (~4 km)',
        description: 'Local emergency medical services',
        services: 'Emergency medical services'
      },
      {
        id: 8,
        name: '🏥 Tambo Memorial Hospital (Public)',
        phone: '011 898 8000',
        alternatePhones: [],
        email: '',
        serviceType: 'medical',
        address: 'Hospital Road, Boksburg, 1459 (~10 km)',
        description: 'Public hospital serving the area',
        services: 'Hospital services'
      },
      {
        id: 9,
        name: '🏥 Life – The Glynnwood Hospital (Private)',
        phone: '011 741 5000',
        alternatePhones: ['0860 123 367'],
        email: '',
        serviceType: 'medical',
        address: '',
        description: 'Private hospital',
        services: 'Private hospital services'
      },
      {
        id: 10,
        name: '🏥 Linmed Rynfield Clinic',
        phone: '011 425 2331',
        alternatePhones: [],
        email: '',
        serviceType: 'medical',
        address: 'Rynfield (~3 km)',
        description: 'Local medical clinic',
        services: 'Medical clinic services'
      },
      {
        id: 11,
        name: '🛡️ AfriForum Neighbourhood Watch',
        phone: '063 639 7170',
        alternatePhones: [],
        email: '',
        serviceType: 'security',
        address: 'Covers Benoni including Airfield',
        description: 'Works closely with CPF and SAPS through local patrol groups and WhatsApp-based crime watch networks',
        services: 'Neighbourhood security and crime watch'
      },
      {
        id: 12,
        name: '⚡ City of Ekurhuleni Utilities',
        phone: '0860 543 000',
        alternatePhones: ['086 054 3000'],
        email: '',
        serviceType: 'utility',
        address: '',
        description: 'Power/water/sewer emergencies and electricity load shedding reports',
        services: 'Utility emergencies, power outages, water/sewer issues'
      }
    ];

    try {
      setEmergencyContacts(staticEmergencyContacts);
    } catch (error) {
      console.error('Error setting emergency contacts:', error);
      showToast('Failed to load emergency contacts', 'error');
      setEmergencyContacts([]);
    }
    
    fetchContacts();
    fetchFriendsCount();
    fetchFriendRequestsCount();
  }, [showToast]);

  // Fetch friends count
  const fetchFriendsCount = async () => {
    try {
      const response = await axios.get('/api/friends', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setFriendsCount(response.data.length || 0);
    } catch (error) {
      console.error('Error fetching friends count:', error);
      setFriendsCount(0);
    }
  };

  // Fetch friend requests count
  const fetchFriendRequestsCount = async () => {
    try {
      const response = await axios.get('/api/friends/requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setFriendRequestsCount(response.data.length || 0);
    } catch (error) {
      console.error('Error fetching friend requests count:', error);
      setFriendRequestsCount(0);
    }
  };

  const handleAddContact = () => {
    const contact = {
      id: Date.now(),
      ...newContact,
      isOnline: false,
      role: 'user',
      joinedDate: new Date().toISOString().split('T')[0]
    };
    setContacts([...contacts, contact]);
    setNewContact({
      name: '',
      email: '',
      phone: '',
      address: '',
      relationship: 'neighbour'
    });
    setAddContactDialog(false);
  };

  const handleAddEmergencyContact = () => {
    const contact = {
      id: Date.now(),
      ...newEmergencyContact
    };
    setEmergencyContacts([...emergencyContacts, contact]);
    setNewEmergencyContact({
      name: '',
      phone: '',
      email: '',
      serviceType: 'police',
      description: ''
    });
    setAddEmergencyDialog(false);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEmergencyContacts = emergencyContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role) => {
    const colors = {
      admin: '#f44336',
      moderator: '#ff9800',
      user: '#4caf50'
    };
    return colors[role] || '#607d8b';
  };

  const getServiceIcon = (serviceType) => {
    const iconComponents = {
      police: icons.LocalPolice,
      fire: icons.LocalFireDepartment,
      medical: icons.LocalHospital,
      security: icons.Security,
      utility: icons.Build
    };
    const IconComponent = iconComponents[serviceType] || icons.Emergency;
    return <IconComponent />;
  };

  const getServiceColor = (serviceType) => {
    const colors = {
      police: '#1976d2',
      fire: '#f44336',
      medical: '#4caf50',
      security: '#ff9800',
      utility: '#9c27b0'
    };
    return colors[serviceType] || '#607d8b';
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Contacts
      </Typography>

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search contacts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <icons.Search />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label={`Neighbours (${filteredContacts.length})`} />
        <Tab label={`Friends (${friendsCount})`} />
        <Tab label={`Friend Requests (${friendRequestsCount})`} />
        <Tab label={`Emergency (${filteredEmergencyContacts.length})`} />
      </Tabs>

      {/* Neighbours Tab */}
      {activeTab === 0 && (
        <Box>
          {filteredContacts.length === 0 ? (
            <Alert severity="info">
              No neighbours found. Start connecting with your community!
            </Alert>
          ) : (
            <List>
              {filteredContacts.map((contact, index) => (
                <React.Fragment key={contact.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Box position="relative">
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        {contact.isOnline && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: 12,
                              height: 12,
                              bgcolor: '#4caf50',
                              borderRadius: '50%',
                              border: '2px solid white'
                            }}
                          />
                        )}
                      </Box>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {contact.name}
                          </Typography>
                          <Chip
                            label={contact.role}
                            size="small"
                            sx={{
                              backgroundColor: getRoleColor(contact.role),
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                            <icons.Email size={16} />
                            <Typography variant="body2" color="text.secondary">
                              {contact.email}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                            <icons.Phone size={16} />
                            <Typography variant="body2" color="text.secondary">
                              {contact.phone}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <icons.LocationOn size={16} />
                            <Typography variant="body2" color="text.secondary">
                              {contact.address}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box display="flex" gap={1} alignItems="center">
                        <FriendRequestButton 
                          userId={contact.id}
                          size="small"
                          showLabel={false}
                        />
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => {
                            // Create or get private chat with this user
                            axios.post('/api/chat/private', {
                              participantId: contact.id
                            })
                            .then(response => {
                              // Navigate to unified chat with private tab and specific chat
                              window.location.href = `/chat?tab=private&chatId=${response.data.id || response.data._id}`;
                            })
                            .catch(error => {
                              console.error('Error creating private chat:', error);
                              showToast('Failed to create private chat', 'error');
                            });
                          }}
                        >
                          <icons.Message />
                        </IconButton>
                        <IconButton size="small" color="primary">
                          <icons.Phone />
                        </IconButton>
                        <IconButton size="small">
                          <icons.MoreVert />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredContacts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* Friends Tab */}
      {activeTab === 1 && (
        <FriendsList 
          onStartChat={(friendId) => {
            // Create or get private chat with this friend
            axios.post('/api/chat/private', {
              participantId: friendId
            })
            .then(response => {
              // Navigate to unified chat with private tab and specific chat
              window.location.href = `/chat?tab=private&chatId=${response.data.id || response.data._id}`;
            })
            .catch(error => {
              console.error('Error creating private chat:', error);
              showToast('Failed to create private chat', 'error');
            });
          }}
          onFriendsChange={() => {
            // Refresh friends count when friends list changes
            fetchFriendsCount();
          }}
        />
      )}

      {/* Friend Requests Tab */}
      {activeTab === 2 && (
        <FriendRequests 
          onRequestUpdate={() => {
            console.log('Friend request updated');
            // Refresh both friends and friend requests counts
            fetchFriendsCount();
            fetchFriendRequestsCount();
          }}
        />
      )}

      {/* Emergency Contacts Tab */}
      {activeTab === 3 && (
        <Box>
          <Alert severity="warning" sx={{ mb: 2 }}>
            For immediate emergencies, always call 10111 (Police) or 10177 (Medical) first.
          </Alert>
          
          {filteredEmergencyContacts.length === 0 ? (
            <Alert severity="info">
              No emergency contacts found.
            </Alert>
          ) : (
            <Box>
              {/* Group contacts by service type */}
              {['police', 'fire', 'medical', 'security', 'utility'].map((serviceType) => {
                const contactsOfType = filteredEmergencyContacts.filter(
                  contact => contact.serviceType === serviceType
                );
                
                if (contactsOfType.length === 0) return null;
                
                const serviceLabels = {
                  police: '🚓 Police Services',
                  fire: '🚒 Fire & Rescue Services',
                  medical: '🚑 Medical & Hospital Services',
                  security: '🛡️ Security Services',
                  utility: '⚡ Utility Services'
                };
                
                return (
                  <Box key={serviceType} mb={3}>
                    <Typography variant="h6" fontWeight="bold" mb={2} 
                      sx={{ color: getServiceColor(serviceType) }}>
                      {serviceLabels[serviceType]}
                    </Typography>
                    <Grid container spacing={2}>
                      {contactsOfType.map((contact) => {
                        try {
                          return (
                            <Grid item xs={12} key={contact.id}>
                              <Card>
                                <CardContent>
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Box
                                      sx={{
                                        p: 1,
                                        borderRadius: 2,
                                        bgcolor: `${getServiceColor(contact.serviceType)}20`,
                                        color: getServiceColor(contact.serviceType)
                                      }}
                                    >
                                      {getServiceIcon(contact.serviceType)}
                                    </Box>
                                    
                                    <Box flex={1}>
                                      <Typography variant="h6" fontWeight="bold">
                                        {contact.name}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" mb={1}>
                                        {contact.description}
                                      </Typography>
                                      
                                      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                          <icons.Phone size={16} />
                                          <Typography variant="body2">
                                            {contact.phone}
                                          </Typography>
                                        </Box>
                                        {contact.alternatePhones && contact.alternatePhones.length > 0 && (
                                          <Box display="flex" alignItems="center" gap={0.5}>
                                            <Typography variant="body2" color="text.secondary">
                                              Alt: {contact.alternatePhones.join(', ')}
                                            </Typography>
                                          </Box>
                                        )}
                                        {contact.email && (
                                          <Box display="flex" alignItems="center" gap={0.5}>
                                            <icons.Email size={16} />
                                            <Typography variant="body2">
                                              {contact.email}
                                            </Typography>
                                          </Box>
                                        )}
                                      </Box>
                                      {contact.address && (
                                        <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                          <icons.LocationOn size={16} />
                                          <Typography variant="body2" color="text.secondary">
                                            {contact.address}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                    
                                    <Button
                                      variant="contained"
                                      color={contact.phone === '10111' || contact.phone === '10177' ? 'error' : 'primary'}
                                      startIcon={<icons.Phone />}
                                      href={`tel:${contact.phone}`}
                                    >
                                      Call
                                    </Button>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        } catch (error) {
                          console.error('Error rendering emergency contact:', error);
                          return (
                            <Grid item xs={12} key={contact.id || 'error'}>
                              <Alert severity="error">
                                Error loading contact: {contact.name || 'Unknown'}
                              </Alert>
                            </Grid>
                          );
                        }
                      })}
                    </Grid>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}



      {/* Add Neighbour Dialog */}
      <Dialog open={addContactDialog} onClose={() => setAddContactDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Neighbour</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={newContact.name}
            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={newContact.email}
            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Phone"
            value={newContact.phone}
            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Address"
            value={newContact.address}
            onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddContactDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddContact}
            variant="contained"
            disabled={!newContact.name || !newContact.email || !newContact.phone}
          >
            Add Contact
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Emergency Contact Dialog */}
      <Dialog open={addEmergencyDialog} onClose={() => setAddEmergencyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Emergency Contact</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Service Name"
            value={newEmergencyContact.name}
            onChange={(e) => setNewEmergencyContact({ ...newEmergencyContact, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Phone Number"
            value={newEmergencyContact.phone}
            onChange={(e) => setNewEmergencyContact({ ...newEmergencyContact, phone: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email (Optional)"
            type="email"
            value={newEmergencyContact.email}
            onChange={(e) => setNewEmergencyContact({ ...newEmergencyContact, email: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={newEmergencyContact.description}
            onChange={(e) => setNewEmergencyContact({ ...newEmergencyContact, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddEmergencyDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddEmergencyContact}
            variant="contained"
            disabled={!newEmergencyContact.name || !newEmergencyContact.phone}
          >
            Add Contact
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Contacts;