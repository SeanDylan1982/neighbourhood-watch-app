import icons from '../Common/Icons'
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Chip,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Announcement as AnnouncementIcon,
  Report as ReportIcon,
  Chat as ChatIcon,
  Message as MessageIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

/**
 * SearchResults component to display grouped search results
 */
const SearchResults = ({
  results,
  onResultSelect,
  activeResultIndex,
  setActiveResultIndex,
  activeSection,
  setActiveSection,
  query
}) => {
  const theme = useTheme();
  const [flattenedResults, setFlattenedResults] = useState([]);
  const [sectionStartIndices, setSectionStartIndices] = useState({});

  // Flatten results for keyboard navigation
  useEffect(() => {
    if (!results) return;

    const flattened = [];
    const indices = {};
    let currentIndex = 0;

    // Process each section
    ['users', 'notices', 'reports', 'chats', 'messages'].forEach(section => {
      if (results[section] && results[section].length > 0) {
        indices[section] = currentIndex;
        flattened.push(...results[section].map(item => ({ item, section })));
        currentIndex += results[section].length;
      }
    });

    setFlattenedResults(flattened);
    setSectionStartIndices(indices);
  }, [results]);

  // Update active section based on active index
  useEffect(() => {
    if (activeResultIndex === -1) {
      setActiveSection(null);
      return;
    }

    // Find which section the active index belongs to
    for (const [section, startIndex] of Object.entries(sectionStartIndices)) {
      const nextSectionKey = Object.keys(sectionStartIndices).find(
        key => sectionStartIndices[key] > startIndex
      );
      const endIndex = nextSectionKey 
        ? sectionStartIndices[nextSectionKey] - 1 
        : flattenedResults.length - 1;

      if (activeResultIndex >= startIndex && activeResultIndex <= endIndex) {
        setActiveSection(section);
        break;
      }
    }
  }, [activeResultIndex, sectionStartIndices, flattenedResults.length, setActiveSection]);

  /**
   * Highlight matching text in search results
   */
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? 
        <Box component="span" key={i} sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>{part}</Box> : 
        part
    );
  };

  /**
   * Render a section of search results
   */
  const renderSection = (title, items, section, icon) => {
    if (!items || items.length === 0) return null;

    const sectionStartIndex = sectionStartIndices[section] || 0;

    return (
      <Box key={section} sx={{ mb: 2 }}>
        <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center' }}>
          {icon}
          <Typography variant="subtitle2" color="text.secondary" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <List dense disablePadding>
          {items.map((item, idx) => {
            const isActive = activeResultIndex === sectionStartIndex + idx;
            
            return (
              <ListItemButton
                key={`${section}-${item._id || idx}`}
                onClick={() => onResultSelect(item, section)}
                selected={isActive}
                onMouseEnter={() => setActiveResultIndex(sectionStartIndex + idx)}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.action.selected,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  },
                }}
              >
                {renderResultItem(item, section, query)}
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    );
  };

  /**
   * Render a specific result item based on its type
   */
  const renderResultItem = (item, section, query) => {
    // Safety function to ensure we render strings, not objects
    const safeString = (value) => {
      if (typeof value === 'string') return value;
      if (value && typeof value === 'object') return JSON.stringify(value);
      return String(value || '');
    };

    switch (section) {
      case 'users':
        return (
          <>
            <ListItemAvatar>
              <Avatar src={item.profileImageUrl}>
                {item.firstName ? safeString(item.firstName)[0] : <icons.Person />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText 
              primary={highlightMatch(`${safeString(item.firstName)} ${safeString(item.lastName)}`, query)}
              secondary={highlightMatch(safeString(item.email), query)}
            />
          </>
        );
        
      case 'notices':
        return (
          <>
            <ListItemAvatar>
              {item.media && item.media.length > 0 ? (
                item.media[0].type === 'image' ? (
                  <Avatar src={item.media[0].url} variant="rounded">
                    <icons.Image />
                  </Avatar>
                ) : (
                  <Avatar variant="rounded">
                    <icons.VideoFile />
                  </Avatar>
                )
              ) : (
                <Avatar>
                  <AnnouncementIcon />
                </Avatar>
              )}
            </ListItemAvatar>
            <ListItemText
              primary={highlightMatch(safeString(item.title), query)}
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  <Typography variant="caption" component="span">
                    {item.author ? `By ${safeString(item.author.firstName)} ${safeString(item.author.lastName)}` : 'Unknown author'}
                  </Typography>
                  <Typography variant="caption" component="span" color="text.secondary">
                    • {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </Typography>
                  {item.category && (
                    <Chip 
                      label={safeString(item.category)} 
                      size="small" 
                      sx={{ height: 20, fontSize: '0.7rem' }} 
                    />
                  )}
                </Box>
              }
            />
          </>
        );
        
      case 'reports':
        return (
          <>
            <ListItemAvatar>
              {item.media && item.media.length > 0 ? (
                item.media[0].type === 'image' ? (
                  <Avatar src={item.media[0].url} variant="rounded">
                    <icons.Image />
                  </Avatar>
                ) : (
                  <Avatar variant="rounded">
                    <icons.VideoFile />
                  </Avatar>
                )
              ) : (
                <Avatar>
                  <icons.Report />
                </Avatar>
              )}
            </ListItemAvatar>
            <ListItemText
              primary={highlightMatch(item.title, query)}
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  {!item.isAnonymous && item.reporter && (
                    <Typography variant="caption" component="span">
                      By {item.reporter.firstName} {item.reporter.lastName}
                    </Typography>
                  )}
                  {item.isAnonymous && (
                    <Typography variant="caption" component="span">
                      Anonymous report
                    </Typography>
                  )}
                  <Typography variant="caption" component="span" color="text.secondary">
                    • {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </Typography>
                  {item.priority && (
                    <Chip 
                      label={item.priority} 
                      size="small" 
                      color={
                        item.priority === 'high' ? 'error' : 
                        item.priority === 'medium' ? 'warning' : 
                        'info'
                      }
                      sx={{ height: 20, fontSize: '0.7rem' }} 
                    />
                  )}
                </Box>
              }
            />
          </>
        );
        
      case 'chats':
        return (
          <>
            <ListItemAvatar>
              <Avatar src={item.profileImageUrl}>
                <icons.Chat />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={highlightMatch(item.name, query)}
              secondary={
                <Typography variant="caption">
                  {item.chatType === 'group' ? 
                    `Group • ${item.memberCount || 0} members` : 
                    'Private chat'}
                </Typography>
              }
            />
          </>
        );
        
      case 'messages':
        return (
          <>
            <ListItemAvatar>
              <Avatar>
                <icons.Message />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
                    {item.chatName}
                  </Typography>
                  <Typography variant="caption" component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </Typography>
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="caption" component="span" sx={{ fontWeight: 500, mr: 0.5 }}>
                    {item.sender.firstName}:
                  </Typography>
                  <Typography variant="caption" component="span" noWrap sx={{ maxWidth: '200px' }}>
                    {highlightMatch(item.content, query)}
                  </Typography>
                </Box>
              }
            />
          </>
        );
        
      default:
        return <ListItemText primary="Unknown result type" />;
    }
  };

  return (
    <Box sx={{ py: 1 }}>
      {renderSection('People', results.users, 'users', <icons.Person fontSize="small" color="action" />)}
      
      {results.users?.length > 0 && (results.notices?.length > 0 || results.reports?.length > 0 || results.chats?.length > 0 || results.messages?.length > 0) && (
        <Divider sx={{ my: 1 }} />
      )}
      
      {renderSection('Notices', results.notices, 'notices', <AnnouncementIcon fontSize="small" color="action" />)}
      
      {results.notices?.length > 0 && (results.reports?.length > 0 || results.chats?.length > 0 || results.messages?.length > 0) && (
        <Divider sx={{ my: 1 }} />
      )}
      
      {renderSection('Reports', results.reports, 'reports', <icons.Report fontSize="small" color="action" />)}
      
      {results.reports?.length > 0 && (results.chats?.length > 0 || results.messages?.length > 0) && (
        <Divider sx={{ my: 1 }} />
      )}
      
      {renderSection('Chats', results.chats, 'chats', <icons.Chat fontSize="small" color="action" />)}
      
      {results.chats?.length > 0 && results.messages?.length > 0 && (
        <Divider sx={{ my: 1 }} />
      )}
      
      {renderSection('Messages', results.messages, 'messages', <icons.Message fontSize="small" color="action" />)}
    </Box>
  );
};

export default SearchResults;