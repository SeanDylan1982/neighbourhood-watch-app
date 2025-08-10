import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';

// Simple debug component to test member tooltip functionality
const DebugMemberTooltip = () => {
  const [groupId, setGroupId] = useState('group1');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateMembersForGroup = (id) => {
    setLoading(true);
    console.log('Generating members for group:', id);
    
    setTimeout(() => {
      const groupHash = id.slice(-2);
      const memberNames = [
        ['Alice', 'Johnson'], ['Bob', 'Smith'], ['Carol', 'Davis'], 
        ['David', 'Wilson'], ['Emma', 'Brown'], ['Frank', 'Miller']
      ];
      
      const hashNum = parseInt(groupHash, 16) || 0;
      const startIndex = hashNum % memberNames.length;
      
      const newMembers = [];
      for (let i = 0; i < 3; i++) {
        const nameIndex = (startIndex + i) % memberNames.length;
        newMembers.push({
          _id: `${id}-member-${i}`,
          firstName: memberNames[nameIndex][0],
          lastName: memberNames[nameIndex][1]
        });
      }
      
      console.log('Generated members:', newMembers);
      setMembers(newMembers);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    generateMembersForGroup(groupId);
  }, [groupId]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Debug Member Tooltip</Typography>
      
      <Box sx={{ my: 2 }}>
        <Button onClick={() => setGroupId('group1')} variant={groupId === 'group1' ? 'contained' : 'outlined'}>
          Group 1
        </Button>
        <Button onClick={() => setGroupId('group2')} variant={groupId === 'group2' ? 'contained' : 'outlined'} sx={{ ml: 1 }}>
          Group 2
        </Button>
        <Button onClick={() => setGroupId('group3')} variant={groupId === 'group3' ? 'contained' : 'outlined'} sx={{ ml: 1 }}>
          Group 3
        </Button>
      </Box>

      <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
        <Typography variant="subtitle1">Current Group: {groupId}</Typography>
        <Typography variant="body2">Loading: {loading ? 'Yes' : 'No'}</Typography>
        <Typography variant="body2">Members Count: {members.length}</Typography>
        
        {loading ? (
          <Typography>Loading member names...</Typography>
        ) : (
          <Box>
            {members.map((member, index) => (
              <Typography key={member._id} variant="body2">
                • {member.firstName} {member.lastName}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DebugMemberTooltip;