const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function debugSendMessage() {
  try {
    // Create a JWT token for the admin user
    const adminUserId = '688d5961e715295e76c93f17'; // Sarah Administrator
    const token = jwt.sign(
      { userId: adminUserId, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const baseURL = 'http://localhost:5001';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Get groups first
    const groupsResponse = await axios.get(`${baseURL}/api/chat/groups`, { headers });
    const testGroup = groupsResponse.data.find(g => g.messageCount > 0) || groupsResponse.data[0];
    
    console.log('Using group:', testGroup.name, testGroup.id);

    // Try sending a simple message first
    console.log('\n=== Testing Simple Message ===');
    try {
      const simpleMessage = {
        content: 'Simple test message'
      };

      const response = await axios.post(
        `${baseURL}/api/chat/groups/${testGroup.id}/messages`,
        simpleMessage,
        { headers }
      );

      console.log('✅ Simple message sent successfully');
      console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
      console.log('❌ Simple message failed');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
      console.log('Full error:', error.message);
    }

    // Try with attachments
    console.log('\n=== Testing Message with Attachments ===');
    try {
      const messageWithAttachments = {
        content: 'Message with attachments',
        attachments: [
          {
            type: 'image',
            url: 'https://example.com/test.jpg',
            filename: 'test.jpg'
          }
        ]
      };

      const response = await axios.post(
        `${baseURL}/api/chat/groups/${testGroup.id}/messages`,
        messageWithAttachments,
        { headers }
      );

      console.log('✅ Message with attachments sent successfully');
      console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
      console.log('❌ Message with attachments failed');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
    }

  } catch (error) {
    console.error('Setup error:', error.message);
  }
}

debugSendMessage();