
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Popover,
  Typography,
  Tabs,
  Tab,
  Grid,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  SentimentSatisfiedAlt as SmileIcon,
  Celebration as CelebrationIcon,
  Pets as AnimalsIcon,
  Fastfood as FoodIcon,
  EmojiObjects as ObjectsIcon,
  EmojiSymbols as SymbolsIcon,
  EmojiFlags as FlagsIcon,
  AccessTime as RecentIcon
} from '@mui/icons-material';

// Import Fluent UI web components for emojis
import FluentEmoji from './FluentEmoji';

// Define emoji categories
const CATEGORIES = [
  { id: 'recent', label: 'Recent', icon: <RecentIcon /> },
  { id: 'smileys', label: 'Smileys', icon: <SmileIcon /> },
  { id: 'celebration', label: 'Celebration', icon: <CelebrationIcon /> },
  { id: 'animals', label: 'Animals', icon: <AnimalsIcon /> },
  { id: 'food', label: 'Food', icon: <FoodIcon /> },
  { id: 'objects', label: 'Objects', icon: <ObjectsIcon /> },
  { id: 'symbols', label: 'Symbols', icon: <SymbolsIcon /> },
  { id: 'flags', label: 'Flags', icon: <FlagsIcon /> }
];

// Emoji data by category
const EMOJI_DATA = {
  smileys: [
    { name: 'grinning face', code: '1F600' },
    { name: 'grinning face with big eyes', code: '1F603' },
    { name: 'grinning face with smiling eyes', code: '1F604' },
    { name: 'beaming face with smiling eyes', code: '1F601' },
    { name: 'grinning squinting face', code: '1F606' },
    { name: 'grinning face with sweat', code: '1F605' },
    { name: 'rolling on the floor laughing', code: '1F923' },
    { name: 'face with tears of joy', code: '1F602' },
    { name: 'slightly smiling face', code: '1F642' },
    { name: 'upside-down face', code: '1F643' },
    { name: 'winking face', code: '1F609' },
    { name: 'smiling face with smiling eyes', code: '1F60A' },
    { name: 'smiling face with halo', code: '1F607' },
    { name: 'smiling face with hearts', code: '1F970' },
    { name: 'smiling face with heart-eyes', code: '1F60D' },
    { name: 'star-struck', code: '1F929' },
    { name: 'face blowing a kiss', code: '1F618' },
    { name: 'kissing face', code: '1F617' },
    { name: 'smiling face', code: '263A' },
    { name: 'thinking face', code: '1F914' }
  ],
  celebration: [
    { name: 'party popper', code: '1F389' },
    { name: 'confetti ball', code: '1F38A' },
    { name: 'sparkles', code: '2728' },
    { name: 'balloon', code: '1F388' },
    { name: 'party face', code: '1F973' },
    { name: 'birthday cake', code: '1F382' },
    { name: 'wrapped gift', code: '1F381' },
    { name: 'clinking glasses', code: '1F942' },
    { name: 'bottle with popping cork', code: '1F37E' },
    { name: 'clapping hands', code: '1F44F' }
  ],
  animals: [
    { name: 'dog face', code: '1F436' },
    { name: 'cat face', code: '1F431' },
    { name: 'mouse face', code: '1F42D' },
    { name: 'hamster face', code: '1F439' },
    { name: 'rabbit face', code: '1F430' },
    { name: 'fox face', code: '1F98A' },
    { name: 'bear face', code: '1F43B' },
    { name: 'panda face', code: '1F43C' },
    { name: 'koala face', code: '1F428' },
    { name: 'tiger face', code: '1F42F' }
  ],
  food: [
    { name: 'red apple', code: '1F34E' },
    { name: 'green apple', code: '1F34F' },
    { name: 'pear', code: '1F350' },
    { name: 'tangerine', code: '1F34A' },
    { name: 'lemon', code: '1F34B' },
    { name: 'banana', code: '1F34C' },
    { name: 'watermelon', code: '1F349' },
    { name: 'grapes', code: '1F347' },
    { name: 'strawberry', code: '1F353' },
    { name: 'pizza', code: '1F355' }
  ],
  objects: [
    { name: 'light bulb', code: '1F4A1' },
    { name: 'laptop', code: '1F4BB' },
    { name: 'smartphone', code: '1F4F1' },
    { name: 'camera', code: '1F4F7' },
    { name: 'television', code: '1F4FA' },
    { name: 'radio', code: '1F4FB' },
    { name: 'video game', code: '1F3AE' },
    { name: 'book', code: '1F4D6' },
    { name: 'gem stone', code: '1F48E' },
    { name: 'hammer and wrench', code: '1F6E0' }
  ],
  symbols: [
    { name: 'red heart', code: '2764' },
    { name: 'orange heart', code: '1F9E1' },
    { name: 'yellow heart', code: '1F49B' },
    { name: 'green heart', code: '1F49A' },
    { name: 'blue heart', code: '1F499' },
    { name: 'purple heart', code: '1F49C' },
    { name: 'black heart', code: '1F5A4' },
    { name: 'broken heart', code: '1F494' },
    { name: 'hundred points', code: '1F4AF' },
    { name: 'check mark', code: '2714' }
  ],
  flags: [
    { name: 'United States', code: '1F1FA-1F1F8' },
    { name: 'United Kingdom', code: '1F1EC-1F1E7' },
    { name: 'Canada', code: '1F1E8-1F1E6' },
    { name: 'Japan', code: '1F1EF-1F1F5' },
    { name: 'Germany', code: '1F1E9-1F1EA' },
    { name: 'France', code: '1F1EB-1F1F7' },
    { name: 'Italy', code: '1F1EE-1F1F9' },
    { name: 'Spain', code: '1F1EA-1F1F8' },
    { name: 'Brazil', code: '1F1E7-1F1F7' },
    { name: 'Mexico', code: '1F1F2-1F1FD' }
  ]
};

// Maximum number of recent emojis to store
const MAX_RECENT_EMOJIS = 20;

const EmojiPicker = ({ onEmojiSelect, size = 32 }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef(null);

  // Load recent emojis from localStorage on component mount
  useEffect(() => {
    try {
      const storedRecents = localStorage.getItem('recentEmojis');
      if (storedRecents) {
        setRecentEmojis(JSON.parse(storedRecents));
      }
    } catch (error) {
      console.error('Error loading recent emojis:', error);
    }
  }, []);

  // Save recent emojis to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('recentEmojis', JSON.stringify(recentEmojis));
    } catch (error) {
      console.error('Error saving recent emojis:', error);
    }
  }, [recentEmojis]);

  // Focus search input when popover opens
  useEffect(() => {
    if (anchorEl && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [anchorEl]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchQuery('');
  };

  const handleCategoryChange = (event, newValue) => {
    setSelectedCategory(newValue);
    setSearchQuery('');
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleEmojiSelect = (emoji) => {
    // Add to recent emojis
    setRecentEmojis(prevRecents => {
      // Remove if already exists
      const filteredRecents = prevRecents.filter(e => e.code !== emoji.code);
      // Add to beginning of array
      const newRecents = [emoji, ...filteredRecents];
      // Limit to max number
      return newRecents.slice(0, MAX_RECENT_EMOJIS);
    });

    // Call the parent callback
    onEmojiSelect(emoji);
    handleClose();
  };

  // Filter emojis based on search query
  const getFilteredEmojis = () => {
    if (!searchQuery) {
      if (selectedCategory === 'recent') {
        return recentEmojis || [];
      }
      return EMOJI_DATA[selectedCategory] || [];
    }

    const query = searchQuery.toLowerCase();
    
    // Search across all categories
    return Object.values(EMOJI_DATA)
      .flat()
      .filter(emoji => emoji.name.toLowerCase().includes(query));
  };

  const open = Boolean(anchorEl);
  const id = open ? 'emoji-popover' : undefined;
  const filteredEmojis = getFilteredEmojis();

  return (
    <>
      <IconButton onClick={handleClick} color="primary" aria-label="emoji picker">
        <SmileIcon />
      </IconButton>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiPopover-paper': {
            width: 320,
            maxHeight: 400,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            placeholder="Search emojis..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
            inputRef={searchInputRef}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {!searchQuery && (
          <Tabs
            value={selectedCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
          >
            {CATEGORIES.map(category => (
              <Tab 
                key={category.id} 
                value={category.id} 
                icon={category.icon} 
                aria-label={category.label}
                sx={{ minWidth: 40, minHeight: 40, p: 0 }}
              />
            ))}
          </Tabs>
        )}
        
        <Box sx={{ p: 1, overflow: 'auto', flex: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : filteredEmojis.length === 0 ? (
            <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
              {searchQuery ? 'No emojis found' : 'No emojis in this category'}
            </Typography>
          ) : (
            <Grid container spacing={0.5}>
              {filteredEmojis.map((emoji) => (
                <Grid item key={emoji.code}>
                  <Tooltip title={emoji.name} placement="top">
                    <Box
                      sx={{
                        width: size,
                        height: size,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        borderRadius: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      onClick={() => handleEmojiSelect(emoji)}
                    >
                      <FluentEmoji
                        emoji={emoji.code}
                        size={size}
                        style={{ cursor: 'pointer' }}
                      />
                    </Box>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default EmojiPicker;