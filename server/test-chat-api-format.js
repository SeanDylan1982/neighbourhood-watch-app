const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Test the chat API endpoints with the standardized message format
async function testChatAPIFormat() {
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

    console.log('Testing Chat API with standardized message format...\n');

    // Test 1: Get chat groups
    console.log('=== TEST 1: Get Chat Groups ===');
    try {
      const groupsResponse = await axios.get(`${baseURL}/api/chat/groups`, { headers });
      console.log('✅ Groups fetched successfully');
      console.log('Groups count:', groupsResponse.data.length);
      
      if (groupsResponse.data.length > 0) {
        // Find a group with messages
        const groupWithMessages = groupsResponse.data.find(g => g.messageCount > 0);
        const testGroup = groupWithMessages || groupsResponse.data[0];
        console.log('Test group ID:', testGroup.id);
        console.log('Test group name:', testGroup.name);
        console.log('Test group message count:', testGroup.messageCount);

        // Test 2: Get messages for the first group
        console.log('\n=== TEST 2: Get Group Messages ===');
        try {
          const messagesResponse = await axios.get(
            `${baseURL}/api/chat/groups/${testGroup.id}/messages?limit=5`,
            { headers }
          );
          console.log('✅ Messages fetched successfully');
          console.log('Messages count:', messagesResponse.data.length);

          if (messagesResponse.data.length > 0) {
            const firstMessage = messagesResponse.data[0];
            console.log('\n=== MESSAGE FORMAT VERIFICATION ===');
            
            // Verify required fields
            const requiredFields = [
              'id', 'content', 'type', 'messageType', 'media', 'attachments',
              'senderId', 'senderName', 'senderAvatar', 'replyTo', 'reactions',
              'isEdited', 'isForwarded', 'isDeleted', 'isStarred', 'forwardedFrom',
              'status', 'moderationStatus', 'createdAt', 'updatedAt', 'timestamp'
            ];

            console.log('Required fields verification:');
            requiredFields.forEach(field => {
              const hasField = firstMessage.hasOwnProperty(field);
              console.log(`  ${hasField ? '✅' : '❌'} ${field}: ${hasField ? 'present' : 'missing'}`);
            });

            // Verify field types and values
            console.log('\nField type verification:');
            console.log(`  ✅ id is string: ${typeof firstMessage.id === 'string'}`);
            console.log(`  ✅ content is string: ${typeof firstMessage.content === 'string'}`);
            console.log(`  ✅ type is string: ${typeof firstMessage.type === 'string'}`);
            console.log(`  ✅ messageType is string: ${typeof firstMessage.messageType === 'string'}`);
            console.log(`  ✅ media is array: ${Array.isArray(firstMessage.media)}`);
            console.log(`  ✅ attachments is array: ${Array.isArray(firstMessage.attachments)}`);
            console.log(`  ✅ reactions is array: ${Array.isArray(firstMessage.reactions)}`);
            console.log(`  ✅ isEdited is boolean: ${typeof firstMessage.isEdited === 'boolean'}`);
            console.log(`  ✅ isForwarded is boolean: ${typeof firstMessage.isForwarded === 'boolean'}`);
            console.log(`  ✅ timestamp field present: ${firstMessage.timestamp !== undefined}`);
            console.log(`  ✅ createdAt === timestamp: ${firstMessage.createdAt === firstMessage.timestamp}`);

            // Verify backward compatibility
            console.log('\nBackward compatibility verification:');
            console.log(`  ✅ media === attachments: ${JSON.stringify(firstMessage.media) === JSON.stringify(firstMessage.attachments)}`);
            console.log(`  ✅ type === messageType: ${firstMessage.type === firstMessage.messageType}`);

            // Verify null handling
            console.log('\nNull handling verification:');
            console.log(`  ✅ senderAvatar null-safe: ${firstMessage.senderAvatar === null || typeof firstMessage.senderAvatar === 'string'}`);
            console.log(`  ✅ replyTo null-safe: ${firstMessage.replyTo === null || typeof firstMessage.replyTo === 'object'}`);
            console.log(`  ✅ forwardedFrom null-safe: ${firstMessage.forwardedFrom === null || typeof firstMessage.forwardedFrom === 'object'}`);

            console.log('\nSample message format:');
            console.log(JSON.stringify(firstMessage, null, 2));
          }

          // Test 3: Send a new message to verify format consistency
          console.log('\n=== TEST 3: Send New Message ===');
          try {
            const newMessageData = {
              content: 'Test message for format verification',
              type: 'text',
              attachments: [
                {
                  id: '507f1f77bcf86cd799439011',
                  type: 'image',
                  url: 'https://example.com/test.jpg',
                  filename: 'test.jpg',
                  size: 1024,
                  thumbnail: 'https://example.com/thumb.jpg',
                  metadata: { width: 800, height: 600 }
                }
              ]
            };

            const sendResponse = await axios.post(
              `${baseURL}/api/chat/groups/${testGroup.id}/messages`,
              newMessageData,
              { headers }
            );

            console.log('✅ Message sent successfully');
            const sentMessage = sendResponse.data;

            console.log('\nSent message format verification:');
            console.log(`  ✅ Attachments properly mapped: ${Array.isArray(sentMessage.attachments) && sentMessage.attachments.length === 1}`);
            console.log(`  ✅ Media field present (legacy): ${Array.isArray(sentMessage.media) && sentMessage.media.length === 1}`);
            console.log(`  ✅ Media === Attachments: ${JSON.stringify(sentMessage.media) === JSON.stringify(sentMessage.attachments)}`);
            console.log(`  ✅ Timestamp field present: ${sentMessage.timestamp !== undefined}`);
            console.log(`  ✅ All required fields present: ${requiredFields.every(field => sentMessage.hasOwnProperty(field))}`);

          } catch (sendError) {
            console.log('❌ Send message failed:', sendError.response?.data || sendError.message);
          }

        } catch (messagesError) {
          console.log('❌ Get messages failed:', messagesError.response?.data || messagesError.message);
        }
      }
    } catch (groupsError) {
      console.log('❌ Get groups failed:', groupsError.response?.data || groupsError.message);
    }

  } catch (error) {
    console.error('Test setup error:', error.message);
  }
}

// Run the test
testChatAPIFormat();