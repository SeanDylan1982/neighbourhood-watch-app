import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  Skeleton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  Gavel as ModeratorIcon,
  Person as MemberIcon
} from '@mui/icons-material';

const GroupMembersList = ({
  members = [],
  loading = false,
  error = null,
  onRefresh = null,
  showRoles = true,
  showJoinDate = false,
  compact = false,
  maxHeight = null
}) => {
  // Role configuration
  const getRoleConfig = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return {
          label: 'Admin',
          color: 'error',
          icon: <AdminIcon fontSize="small" />
        };
      case 'moderator':
        return {
          label: 'Moderator',
          color: 'warning',
          icon: <ModeratorIcon fontSize="small" />
        };
      default:
        return {
          label: 'Member',
          color: 'default',
          icon: <MemberIcon fontSize="small" />
        };
    }
  };

  // Format join date
  const formatJoinDate = (joinedAt) => {
    if (!joinedAt) return 'Unknown';
    
    try {
      const date = new Date(joinedAt);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return 'Joined today';
      } else if (diffDays <= 7) {
        return `Joined ${diffDays} days ago`;
      } else if (diffDays <= 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Joined ${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        return `Joined ${date.toLocaleDateString()}`;
      }
    } catch (error) {
      console.warn('Error formatting join date:', error);
      return 'Unknown';
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Loading members...
          </Typography>
        </Box>
        
        {/* Loading skeletons */}
        {[1, 2, 3].map((index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="error" 
          action={
            onRefresh && (
              <IconButton
                color="inherit"
                size="small"
                onClick={onRefresh}
                aria-label="retry"
              >
                <RefreshIcon />
              </IconButton>
            )
          }
        >
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Empty state
  if (!members || members.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No members found
        </Typography>
        {onRefresh && (
          <IconButton
            size="small"
            onClick={onRefresh}
            sx={{ mt: 1 }}
            aria-label="refresh members"
          >
            <RefreshIcon />
          </IconButton>
        )}
      </Box>
    );
  }

  // Sort members: admins first, then moderators, then regular members
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { admin: 0, moderator: 1, member: 2 };
    const aOrder = roleOrder[a.role?.toLowerCase()] ?? 2;
    const bOrder = roleOrder[b.role?.toLowerCase()] ?? 2;
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    // If same role, sort alphabetically by name
    const aName = a.displayName || a.fullName || `${a.firstName} ${a.lastName}`.trim();
    const bName = b.displayName || b.fullName || `${b.firstName} ${b.lastName}`.trim();
    return aName.localeCompare(bName);
  });

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Members ({members.length})
        </Typography>
        {onRefresh && (
          <Tooltip title="Refresh members">
            <IconButton
              size="small"
              onClick={onRefresh}
              aria-label="refresh members"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Members List */}
      <List 
        sx={{ 
          py: 0,
          maxHeight: maxHeight || (compact ? 300 : 400),
          overflow: 'auto'
        }}
      >
        {sortedMembers.map((member) => {
          const roleConfig = getRoleConfig(member.role);
          const displayName = member.displayName || 
                             member.fullName || 
                             `${member.firstName || ''} ${member.lastName || ''}`.trim() ||
                             'Unknown User';
          
          return (
            <ListItem
              key={member._id || member.id}
              sx={{
                py: compact ? 0.5 : 1,
                px: 2,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <ListItemAvatar>
                <Avatar
                  src={member.profileImageUrl}
                  alt={displayName}
                  sx={{ 
                    width: compact ? 32 : 40, 
                    height: compact ? 32 : 40,
                    fontSize: compact ? '0.875rem' : '1rem'
                  }}
                >
                  {member.initials || displayName.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant={compact ? "body2" : "body1"}
                      fontWeight={member.role === 'admin' ? 'bold' : 'normal'}
                    >
                      {displayName}
                    </Typography>
                    
                    {showRoles && (
                      <Chip
                        label={roleConfig.label}
                        color={roleConfig.color}
                        size="small"
                        icon={roleConfig.icon}
                        sx={{ 
                          height: compact ? 20 : 24,
                          fontSize: compact ? '0.625rem' : '0.75rem'
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  showJoinDate && member.joinedAt && (
                    <Typography variant="caption" color="text.secondary">
                      {formatJoinDate(member.joinedAt)}
                    </Typography>
                  )
                }
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default GroupMembersList;