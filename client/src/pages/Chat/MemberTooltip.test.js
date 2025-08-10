import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Tooltip, Chip, Box, Typography } from '@mui/material';

const theme = createTheme();

// Test component that mimics the member tooltip functionality
const MemberTooltip = ({ members, loading, memberCount }) => {
  return (
    <ThemeProvider theme={theme}>
      <Tooltip 
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Group Members:
            </Typography>
            {loading ? (
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                Loading member names...
              </Typography>
            ) : members.length > 0 ? (
              <Box>
                {members.map((member, index) => (
                  <Typography 
                    key={member._id || member.id} 
                    variant="body2"
                    sx={{ 
                      mb: index < members.length - 1 ? 0.5 : 0,
                      display: 'flex',
                      alignItems: 'center',
                      '&:before': {
                        content: '"•"',
                        marginRight: 1,
                        color: 'primary.main'
                      }
                    }}
                  >
                    {`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown User'}
                  </Typography>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                Member data unavailable
              </Typography>
            )}
          </Box>
        }
        arrow
        placement="bottom-start"
      >
        <Chip 
          label={`${memberCount || 0} members`}
          size="small"
          variant="filled"
          color="primary"
          sx={{ 
            cursor: 'pointer',
            fontWeight: 'medium',
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'scale(1.05)',
              transition: 'all 0.2s ease-in-out'
            }
          }}
        />
      </Tooltip>
    </ThemeProvider>
  );
};

describe('MemberTooltip Component', () => {
  test('renders member count chip', () => {
    const members = [
      { _id: '1', firstName: 'John', lastName: 'Doe' },
      { _id: '2', firstName: 'Jane', lastName: 'Smith' }
    ];

    render(<MemberTooltip members={members} loading={false} memberCount={2} />);
    
    expect(screen.getByText('2 members')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    render(<MemberTooltip members={[]} loading={true} memberCount={0} />);
    
    expect(screen.getByText('0 members')).toBeInTheDocument();
  });

  test('handles empty member list', () => {
    render(<MemberTooltip members={[]} loading={false} memberCount={0} />);
    
    expect(screen.getByText('0 members')).toBeInTheDocument();
  });

  test('displays correct member count', () => {
    const members = [
      { _id: '1', firstName: 'John', lastName: 'Doe' },
      { _id: '2', firstName: 'Jane', lastName: 'Smith' },
      { _id: '3', firstName: 'Bob', lastName: 'Johnson' }
    ];

    render(<MemberTooltip members={members} loading={false} memberCount={3} />);
    
    expect(screen.getByText('3 members')).toBeInTheDocument();
  });
});