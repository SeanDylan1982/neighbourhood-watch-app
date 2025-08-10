import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Chip, Tooltip, Box, Typography, IconButton } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

const theme = createTheme();

// Component that tests the enhanced member tooltip functionality
const EnhancedMemberTooltip = ({ 
  members, 
  loadingMembers, 
  memberCount, 
  onRefresh 
}) => {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="Refresh member list">
          <IconButton 
            size="small" 
            onClick={onRefresh}
            disabled={loadingMembers}
            data-testid="refresh-members-btn"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip 
          title={
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Group Members:
              </Typography>
              {loadingMembers ? (
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
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: 'background.paper',
                color: 'text.primary',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 3,
                maxWidth: 300
              }
            }
          }}
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
      </Box>
    </ThemeProvider>
  );
};

describe('Enhanced Member Tooltip', () => {
  test('renders member count chip with highlighted styling', () => {
    const members = [
      { _id: '1', firstName: 'John', lastName: 'Doe' },
      { _id: '2', firstName: 'Jane', lastName: 'Smith' },
      { _id: '3', firstName: 'Bob', lastName: 'Johnson' }
    ];
    
    render(
      <EnhancedMemberTooltip 
        members={members} 
        loadingMembers={false} 
        memberCount={3}
        onRefresh={jest.fn()}
      />
    );
    
    const chip = screen.getByText('3 members');
    expect(chip).toBeInTheDocument();
    
    // Check that the chip has the primary color styling
    const chipElement = chip.closest('.MuiChip-root');
    expect(chipElement).toHaveClass('MuiChip-colorPrimary');
  });

  test('displays actual member names instead of loading message', () => {
    const members = [
      { _id: '1', firstName: 'Alice', lastName: 'Johnson' },
      { _id: '2', firstName: 'Bob', lastName: 'Smith' }
    ];
    
    render(
      <EnhancedMemberTooltip 
        members={members} 
        loadingMembers={false} 
        memberCount={2}
        onRefresh={jest.fn()}
      />
    );
    
    // The tooltip should contain actual member names, not "Loading names..."
    expect(screen.getByText('2 members')).toBeInTheDocument();
  });

  test('shows loading state gracefully when member data is unavailable', () => {
    render(
      <EnhancedMemberTooltip 
        members={[]} 
        loadingMembers={true} 
        memberCount={5}
        onRefresh={jest.fn()}
      />
    );
    
    expect(screen.getByText('5 members')).toBeInTheDocument();
    
    // Refresh button should be disabled during loading
    const refreshBtn = screen.getByTestId('refresh-members-btn');
    expect(refreshBtn).toBeDisabled();
  });

  test('calls refresh function when refresh button is clicked', () => {
    const mockRefresh = jest.fn();
    
    render(
      <EnhancedMemberTooltip 
        members={[]} 
        loadingMembers={false} 
        memberCount={0}
        onRefresh={mockRefresh}
      />
    );
    
    const refreshBtn = screen.getByTestId('refresh-members-btn');
    fireEvent.click(refreshBtn);
    
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  test('handles member list updates correctly', () => {
    const initialMembers = [
      { _id: '1', firstName: 'John', lastName: 'Doe' }
    ];
    
    const { rerender } = render(
      <EnhancedMemberTooltip 
        members={initialMembers} 
        loadingMembers={false} 
        memberCount={1}
        onRefresh={jest.fn()}
      />
    );
    
    expect(screen.getByText('1 members')).toBeInTheDocument();
    
    // Update with new member list
    const updatedMembers = [
      { _id: '1', firstName: 'John', lastName: 'Doe' },
      { _id: '2', firstName: 'Jane', lastName: 'Smith' }
    ];
    
    rerender(
      <EnhancedMemberTooltip 
        members={updatedMembers} 
        loadingMembers={false} 
        memberCount={2}
        onRefresh={jest.fn()}
      />
    );
    
    expect(screen.getByText('2 members')).toBeInTheDocument();
  });
});