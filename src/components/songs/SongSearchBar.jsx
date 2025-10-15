import React, { useState, useCallback, useRef } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Paper,
    InputAdornment,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemAvatar,
    ClickAwayListener,
    CircularProgress,
    Avatar
} from '@mui/material';
import {
    Search,
    Add,
    MusicNote
} from '@mui/icons-material';
import debounce from 'debounce';
import musicService from '../../services/musicService';

const SongSearchBar = ({ onAddSong, isProposing, existingActiveSpotifyIds = [] }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (query) => {
            if (!query.trim()) {
                setSearchResults([]);
                setShowResults(false);
                return;
            }

            setIsSearching(true);
            try {
                const results = await musicService.searchTracks(query, 30);
                setSearchResults(results);
                setShowResults(true);
            } catch (error) {
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300),
        []
    );

    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchQuery(value);
        debouncedSearch(value);
    };

    const handleAddSongWithSearch = async (track) => {
        try {
            const result = await onAddSong(track);

            // Clear search after successful addition
            setSearchQuery('');
            setSearchResults([]);
            setShowResults(false);
        } catch (error) {
            // Show error to user
            alert(`Failed to add song: ${error.message}`);
        }
    };

    const handleClickAway = () => {
        setShowResults(false);
    };

    return (
        <Box sx={{
            padding: { xs: 2, md: 3 },
            position: 'relative',
            direction: 'rtl'
        }}>
            <ClickAwayListener onClickAway={handleClickAway}>
                <Box>
                    <TextField
                        ref={searchRef}
                        fullWidth
                        size="small"
                        placeholder="חפש שירים לפי שם או מילים..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        inputProps={{
                            style: {
                                textAlign: 'right',
                                direction: 'rtl',
                                fontFamily: 'inherit',
                                fontSize: '1rem'
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: '#00ffff' }} />
                                </InputAdornment>
                            ),
                            endAdornment: isSearching && (
                                <InputAdornment position="end">
                                    <CircularProgress size={20} sx={{ color: '#00ffff' }} />
                                </InputAdornment>
                            ),
                            sx: {
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(0, 255, 255, 0.3)',
                                borderRadius: '20px',
                                color: '#ffffff',
                                direction: 'rtl',
                                '& .MuiInputBase-input': {
                                    color: '#ffffff',
                                    direction: 'rtl',
                                    textAlign: 'right'
                                },
                                '&:hover': {
                                    border: '1px solid rgba(0, 255, 255, 0.5)'
                                }
                            }
                        }}
                    />

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <Paper sx={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            mt: 1,
                            background: 'rgba(26, 26, 46, 0.95)',
                            border: '1px solid rgba(0, 255, 255, 0.3)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            zIndex: 1001,
                            direction: 'rtl',
                            '&::-webkit-scrollbar': {
                                width: '6px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: 'rgba(255, 255, 255, 0.1)',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: 'rgba(0, 255, 255, 0.3)',
                                borderRadius: '3px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: 'rgba(0, 255, 255, 0.5)',
                            },
                        }}>
                            <List sx={{ p: 0 }}>
                                {searchResults.map((track, index) => {
                                    const alreadyExists = existingActiveSpotifyIds.includes(track.id);
                                    return (
                                        <ListItem key={`${track.id}-${index}`} disablePadding sx={{ position: 'relative' }}>
                                            <ListItemButton
                                                onClick={() => !alreadyExists && handleAddSongWithSearch(track)}
                                                sx={{
                                                    '&:hover': {
                                                        background: alreadyExists ? 'transparent' : 'rgba(0, 255, 255, 0.1)'
                                                    },
                                                    transition: 'all 0.3s ease',
                                                    direction: 'rtl',
                                                    display: 'flex',
                                                    flexDirection: 'row-reverse',
                                                    opacity: alreadyExists ? 0.4 : 1,
                                                    cursor: alreadyExists ? 'not-allowed' : 'pointer'
                                                }}
                                                disabled={alreadyExists}
                                            >
                                                <IconButton
                                                    size="small"
                                                    disabled={isProposing || alreadyExists}
                                                    sx={{
                                                        color: '#00ffff',
                                                        mr: 1,
                                                        '&:hover': {
                                                            background: 'rgba(0, 255, 255, 0.2)'
                                                        },
                                                        '&:disabled': {
                                                            color: 'rgba(0, 255, 255, 0.3)'
                                                        }
                                                    }}
                                                >
                                                    {isProposing ? (
                                                        <CircularProgress size={16} sx={{ color: 'inherit' }} />
                                                    ) : (
                                                        alreadyExists ? <MusicNote /> : <Add />
                                                    )}
                                                </IconButton>
                                                <ListItemText
                                                    primary={track.name}
                                                    secondary={track.artist}
                                                    sx={{
                                                        '& .MuiListItemText-primary': {
                                                            color: '#ffffff',
                                                            fontWeight: 'bold',
                                                            textAlign: 'right',
                                                            direction: 'rtl',
                                                            fontFamily: 'inherit'
                                                        },
                                                        '& .MuiListItemText-secondary': {
                                                            color: 'rgba(255, 255, 255, 0.7)',
                                                            textAlign: 'right',
                                                            direction: 'rtl',
                                                            fontFamily: 'inherit'
                                                        },
                                                        flex: 1,
                                                        textAlign: 'right',
                                                        mr: 1
                                                    }}
                                                />
                                                <ListItemAvatar sx={{ minWidth: 'auto', ml: 1 }}>
                                                    <Avatar
                                                        src={track.image}
                                                        sx={{
                                                            width: 48,
                                                            height: 48,
                                                            border: '1px solid rgba(0, 255, 255, 0.3)'
                                                        }}
                                                    >
                                                        <MusicNote />
                                                    </Avatar>
                                                </ListItemAvatar>
                                            </ListItemButton>
                                            {alreadyExists && (
                                                <Box sx={{
                                                    position: 'absolute',
                                                    left: 12,
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    color: '#ffc107',
                                                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(255, 193, 7, 0.3)',
                                                    direction: 'rtl'
                                                }}>
                                                    כבר קיים
                                                </Box>
                                            )}
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </Paper>
                    )}
                </Box>
            </ClickAwayListener>
        </Box>
    );
};

export default SongSearchBar;
