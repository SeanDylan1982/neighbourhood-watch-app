import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  useTheme
} from '@mui/material';
import {
  Group as GroupIcon,
  Settings as SettingsIcon,
  ExitToApp as LeaveIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import GroupMembersList from './GroupMembersList';
import { useGroupMembers } from '../../hooks/useGroupMembers';

const GroupInfoPanel = ({
  group,
  currentUserId,
  onLeaveGroup = null,
  onGroupSettings = null,
  showActions = true,
  compact = false
}) => {
  const theme = useTheme();
  const {
    groupMembers,
    loadingMembers,
    memberError,
    fetchGroupMembers,
    refreshGroupMembers,
    getMemberById,
    memberCount
  } = useGroupMembers();

  // Fetch members when group changes
  useEffect(() => {
    if (group?.id || group?._id) {
      const groupId = group.id || group._id;
      fetchGroupMembers(groupId);
    }
  }, [group?.id, group?._id, fetchGroupMembers]);

  // Get current user's role in the group
  const currentUserMember = getMemberById(currentUserId);
  const currentUserRole = currentUserMember?.role || 'member';
  const isAdmin = currentUserRole === 'admin';
  const isModerator = currentUserRole === 'moderator' || isAdmin;

  // Handle refresh members
  const handleRefreshMembers = () => {
    if (group?.id || group?._id) {
      const groupId = group.id || group._id;
      refreshGroupMembers(groupId);
    }
  };

  // Format group type
  const getGroupTypeConfig = (type) => {
    switch (type?.toLowerCase()) {
      case 'private':
        return { label: 'Private', color: 'secondary' };
      case 'announcement':
        return { label: 'Announcement', color: 'info' };
      default:
        return { label: 'Public', color: 'primary' };
    }
  };

  if (!group) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%'
        }}>
          <Typography variant="body2" color="text.secondary">
            Select a group to view details
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const typeConfig = getGroupTypeConfig(group.type);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Group Header */}
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar
            sx={{ 
              width: compact ? 48 : 56, 
              height: compact ? 48 : 56,
              bgcolor: 'primary.main'
            }}
          >
            <GroupIcon />
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant={compact ? "h6" : "h5"} 
              fontWeight="bold"
              sx={{ mb: 0.5 }}
              noWrap
            >
              {group.name}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                label={typeConfig.label}
                color={typeConfig.color}
                size="small"
              />
              
              <Typography variant="caption" color="text.secondary">
                {memberCount} member{memberCount !== 1 ? 's' : ''}
              </Typography>
            </Box>
            
            {group.description && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: compact ? 2 : 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {group.description}
              </Typography>
            )}
          </Box>
          
          {showActions && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {isModerator && onGroupSettings && (
                <Tooltip title="Group Settings">
                  <IconButton
                    size="small"
                    onClick={() => onGroupSettings(group)}
                    aria-label="group settings"
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              )}
              
              {onLeaveGroup && (
                <Tooltip title="Leave Group">
                  <IconButton
                    size="small"
                    onClick={() => onLeaveGroup(group)}
                    color="error"
                    aria-label="leave group"
                  >
                    <LeaveIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>
      </CardContent>

      <Divider />

      {/* Group Members */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <GroupMembersList
          members={groupMembers}
          loading={loadingMembers}
          error={memberError}
          onRefresh={handleRefreshMembers}
          showRoles={true}
          showJoinDate={!compact}
          compact={compact}
          maxHeight={compact ? 200 : 300}
        />
      </Box>

      {/* Group Stats */}
      {!compact && (
        <>
          <Divider />
          <CardContent sx={{ pt: 1, pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Created: {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'Unknown'}
              </Typography>
              
              {group.lastActivity && (
                <Typography variant="caption" color="text.secondary">
                  Last activity: {new Date(group.lastActivity).toLocaleDateString()}
                </Typography>
              )}
            </Box>
            
            {currentUserMember && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Your role: {currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1)}
              </Typography>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
};

export default GroupInfoPanel;