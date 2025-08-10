import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  ContactPhone as ContactIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import ContactPicker from './ContactPicker';

/**
 * ContactPickerExample - Demonstrates how to use the ContactPicker component
 * 
 * This example shows:
 * - Basic ContactPicker usage
 * - Handling contact selection
 * - Displaying selected contact information
 * - Integration with chat attachment system
 */
const ContactPickerExample = () => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedContactData, setSelectedContactData] = useState(null);
  const [message, setMessage] = useState('');

  // Handle contact selection from picker
  const handleContactSelect = (contactData) => {
    console.log('Contact selected:', contactData);
    setSelectedContactData(contactData);
    setMessage(`Contact "${contactData.displayText}" selected for sharing!`);
    setShowPicker(false);
  };

  // Handle picker close
  const handlePickerClose = () => {
    setShowPicker(false);
    setMessage('Contact picker closed without selection.');
  };

  // Handle share contact (simulate sending in chat)
  const handleShareContact = () => {
    if (selectedContactData) {
      console.log('Sharing contact in chat:', selectedContactData);
      setMessage(`Contact "${selectedContactData.displayText}" shared in chat!`);
      
      // In a real implementation, this would:
      // 1. Send the contact data to the chat API
      // 2. Display the contact in the message thread
      // 3. Clear the selection
      
      // Simulate API call
      setTimeout(() => {
        setSelectedContactData(null);
        setMessage('Contact shared successfully!');
      }, 1000);
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedContactData(null);
    setMessage('Selection cleared.');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ContactIcon color="primary" />
        ContactPicker Example
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This example demonstrates how to use the ContactPicker component for sharing contacts in chat.
        Click "Open Contact Picker" to select a contact from your neighbours and friends.
      </Typography>

      {/* Status Message */}
      {message && (
        <Alert 
          severity={selectedContactData ? 'success' : 'info'} 
          sx={{ mb: 2 }}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      {/* Control Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<ContactIcon />}
          onClick={() => setShowPicker(true)}
          disabled={showPicker}
        >
          Open Contact Picker
        </Button>
        
        {selectedContactData && (
          <>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShareContact}
              color="success"
            >
              Share in Chat
            </Button>
            
            <Button
              variant="text"
              onClick={handleClearSelection}
            >
              Clear Selection
            </Button>
          </>
        )}
      </Box>

      {/* Selected Contact Display */}
      {selectedContactData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Selected Contact
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">
                <strong>Type:</strong> {selectedContactData.type}
              </Typography>
              
              <Typography variant="body2">
                <strong>Preview:</strong> {selectedContactData.preview}
              </Typography>
              
              <Typography variant="body2">
                <strong>Display Text:</strong> {selectedContactData.displayText}
              </Typography>
              
              <Divider sx={{ my: 1 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Contact Information:
              </Typography>
              
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2">
                  <strong>Name:</strong> {selectedContactData.contactInfo.name}
                </Typography>
                
                {selectedContactData.contactInfo.email && (
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedContactData.contactInfo.email}
                  </Typography>
                )}
                
                {selectedContactData.contactInfo.phone && (
                  <Typography variant="body2">
                    <strong>Phone:</strong> {selectedContactData.contactInfo.phone}
                  </Typography>
                )}
                
                {selectedContactData.contactInfo.address && (
                  <Typography variant="body2">
                    <strong>Address:</strong> {selectedContactData.contactInfo.address}
                  </Typography>
                )}
              </Box>
              
              {selectedContactData.metadata && (
                <>
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Metadata:
                  </Typography>
                  
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2">
                      <strong>Contact Type:</strong> {selectedContactData.metadata.contactType}
                    </Typography>
                    
                    <Typography variant="body2">
                      <strong>Online Status:</strong> {selectedContactData.metadata.isOnline ? 'Online' : 'Offline'}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Contact Picker */}
      {showPicker && (
        <Paper elevation={3} sx={{ p: 2 }}>
          <ContactPicker
            onContactSelect={handleContactSelect}
            onClose={handlePickerClose}
            showPreview={true}
            maxHeight={400}
          />
        </Paper>
      )}

      {/* Usage Instructions */}
      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Usage Instructions
          </Typography>
          
          <Typography variant="body2" paragraph>
            <strong>Basic Usage:</strong>
          </Typography>
          
          <Box component="pre" sx={{ 
            bgcolor: 'grey.100', 
            p: 2, 
            borderRadius: 1, 
            overflow: 'auto',
            fontSize: '0.875rem'
          }}>
{`import { ContactPicker } from './components/Chat/Attachments';

<ContactPicker
  onContactSelect={(contactData) => {
    console.log('Selected contact:', contactData);
    // Handle contact selection
  }}
  onClose={() => {
    console.log('Picker closed');
    // Handle picker close
  }}
  showPreview={true}
  maxHeight={400}
  disabled={false}
/>`}
          </Box>
          
          <Typography variant="body2" paragraph sx={{ mt: 2 }}>
            <strong>Props:</strong>
          </Typography>
          
          <Box sx={{ pl: 2 }}>
            <Typography variant="body2">
              • <strong>onContactSelect:</strong> Callback when a contact is selected
            </Typography>
            <Typography variant="body2">
              • <strong>onClose:</strong> Callback when picker is closed
            </Typography>
            <Typography variant="body2">
              • <strong>showPreview:</strong> Whether to show contact preview before sharing
            </Typography>
            <Typography variant="body2">
              • <strong>maxHeight:</strong> Maximum height of the contact list
            </Typography>
            <Typography variant="body2">
              • <strong>disabled:</strong> Whether the picker is disabled
            </Typography>
            <Typography variant="body2">
              • <strong>className:</strong> Additional CSS class name
            </Typography>
          </Box>
          
          <Typography variant="body2" paragraph sx={{ mt: 2 }}>
            <strong>Contact Data Format:</strong>
          </Typography>
          
          <Box component="pre" sx={{ 
            bgcolor: 'grey.100', 
            p: 2, 
            borderRadius: 1, 
            overflow: 'auto',
            fontSize: '0.875rem'
          }}>
{`{
  type: 'contact',
  contactInfo: {
    id: 'contact-id',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    avatar: 'avatar-url'
  },
  preview: '👤 John Doe',
  displayText: 'John Doe',
  metadata: {
    contactType: 'friend', // or 'neighbour'
    isOnline: true
  }
}`}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ContactPickerExample;