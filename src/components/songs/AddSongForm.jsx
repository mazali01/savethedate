import React, { useState, useCallback, useEffect } from 'react';
import {
    Paper,
    TextField,
    Autocomplete,
    Button,
    Box,
    Typography,
    CircularProgress,
    Avatar,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Alert,
    Snackbar,
    Chip,
    Divider
} from '@mui/material';
import { Add, Search, MusicNote, TrendingUp } from '@mui/icons-material';
import debounce from 'debounce';
import musicService from '../../services/musicService';

const AddSongForm = ({ onSongAdd, userId, userName, canPropose, remainingProposals, showSuggestions = true }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSong, setSelectedSong] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
    const [popularSongs, setPopularSongs] = useState([]);
    const [loadingPopular, setLoadingPopular] = useState(false);

    // Load popular Israeli songs on mount
    useEffect(() => {
        if (showSuggestions && canPropose) {
            loadPopularSongs();
        }
    }, [showSuggestions, canPropose]);

    const loadPopularSongs = async () => {
        try {
            setLoadingPopular(true);
            const songs = await musicService.getPopularIsraeliTracks(12);
            setPopularSongs(songs);
        } catch (error) {
            // Don't show error for popular songs - it's not critical
        } finally {
            setLoadingPopular(false);
        }
    };

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (query) => {
            if (!query || query.length < 2) {
                setSearchResults([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const results = await musicService.searchTracks(query, 30);
                setSearchResults(results);
            } catch (error) {
                showNotification('שגיאה בחיפוש השירים. מחפש במאגר מקומי...', 'warning');
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        }, 300),
        []
    );

    const handleSearchChange = (event, newValue) => {
        setSearchTerm(newValue);
        if (typeof newValue === 'string') {
            debouncedSearch(newValue);
        }
    };

    const handleSongSelect = (event, newValue) => {
        setSelectedSong(newValue);
    };

    const handlePopularSongSelect = (song) => {
        setSelectedSong(song);
        setSearchTerm(`${song.name} - ${song.artist}`);
    };

    const handleAddSong = async () => {
        if (!selectedSong) {
            showNotification('אנא בחר שיר מהרשימה', 'warning');
            return;
        }

        try {
            await onSongAdd(selectedSong, userId, userName);
            setSelectedSong(null);
            setSearchTerm('');
            setSearchResults([]);
            showNotification('השיר נוסף בהצלחה!', 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const showNotification = (message, severity) => {
        setNotification({ open: true, message, severity });
    };

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    if (!canPropose) {
        return (
            <Paper sx={{
                padding: 3,
                marginBottom: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(46, 125, 50, 0.2)',
                direction: 'rtl'
            }}>
                <Alert severity="info" sx={{ direction: 'rtl', textAlign: 'right' }}>
                    הגעת למגבלת ההצעות שלך. אתה יכול להציע עד 3 שירים.
                </Alert>
            </Paper>
        );
    }

    return (
        <>
            <Paper sx={{
                padding: 3,
                marginBottom: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(46, 125, 50, 0.2)',
                boxShadow: '0 2px 8px rgba(46, 125, 50, 0.1)',
                direction: 'rtl'
            }}>
                <Typography variant="h6" sx={{
                    marginBottom: 2,
                    color: '#2c2c2c',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    direction: 'rtl',
                    textAlign: 'right',
                    justifyContent: 'flex-end'
                }}>
                    הציעו שיר
                    <MusicNote color="primary" />
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, direction: 'rtl' }}>
                    {/* Search Autocomplete */}
                    <Autocomplete
                        freeSolo
                        options={searchResults}
                        value={selectedSong}
                        inputValue={searchTerm}
                        onInputChange={handleSearchChange}
                        onChange={handleSongSelect}
                        loading={loading}
                        getOptionLabel={(option) =>
                            typeof option === 'string' ? option : `${option.name} - ${option.artist}`
                        }
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="חפש שיר או אמן (מאגר מקומי + iTunes + Spotify)..."
                                variant="outlined"
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            <Search sx={{ marginLeft: 1, color: '#666' }} />
                                            {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                                sx={{
                                    direction: 'rtl',
                                    '& .MuiInputBase-input': {
                                        textAlign: 'right',
                                        direction: 'rtl'
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        '&:hover fieldset': {
                                            borderColor: '#2e7d32',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#2e7d32',
                                        },
                                    },
                                }}
                            />
                        )}
                        renderOption={(props, option) => (
                            <ListItem {...props} key={option.id} sx={{ direction: 'rtl' }}>
                                <ListItemText
                                    primary={option.name}
                                    secondary={`${option.artist} • ${option.album}`}
                                    primaryTypographyProps={{
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold',
                                        textAlign: 'right'
                                    }}
                                    secondaryTypographyProps={{
                                        fontSize: '0.8rem',
                                        color: '#666',
                                        textAlign: 'right'
                                    }}
                                    sx={{
                                        textAlign: 'right',
                                        marginRight: 2
                                    }}
                                />
                                <ListItemAvatar>
                                    <Avatar
                                        src={option.image}
                                        variant="rounded"
                                        sx={{ width: 40, height: 40 }}
                                    >
                                        <MusicNote />
                                    </Avatar>
                                </ListItemAvatar>
                            </ListItem>
                        )}
                        noOptionsText={
                            searchTerm.length < 2
                                ? 'הקלד לפחות 2 תווים לחיפוש'
                                : loading
                                    ? 'מחפש שירים...'
                                    : 'לא נמצאו תוצאות (מחפש במאגר מקומי, iTunes ו-Spotify)'
                        }
                        sx={{
                            '& .MuiAutocomplete-paper': {
                                backgroundColor: 'white',
                                border: '1px solid rgba(46, 125, 50, 0.2)',
                                direction: 'rtl'
                            },
                            '& .MuiAutocomplete-listbox': {
                                direction: 'rtl'
                            }
                        }}
                    />

                    {/* Popular Songs Suggestions */}
                    {showSuggestions && popularSongs.length > 0 && !searchTerm && (
                        <>
                            <Divider sx={{ marginY: 2, direction: 'rtl' }}>
                                <Chip
                                    icon={<TrendingUp />}
                                    label="שירים פופולריים"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ direction: 'rtl' }}
                                />
                            </Divider>

                            <Box sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1,
                                marginBottom: 2,
                                direction: 'rtl',
                                justifyContent: 'flex-end'
                            }}>
                                {popularSongs.slice(0, 8).map((song) => (
                                    <Chip
                                        key={song.id}
                                        label={`${song.name} - ${song.artist}`}
                                        onClick={() => handlePopularSongSelect(song)}
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: 'rgba(46, 125, 50, 0.1)',
                                                borderColor: '#2e7d32'
                                            },
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            direction: 'rtl'
                                        }}
                                    />
                                ))}
                            </Box>
                        </>
                    )}

                    {loadingPopular && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 2, direction: 'rtl', justifyContent: 'flex-end' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ direction: 'rtl' }}>
                                טוען שירים פופולריים...
                            </Typography>
                            <CircularProgress size={20} />
                        </Box>
                    )}

                    {/* Add Button */}
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={handleAddSong}
                        disabled={!selectedSong}
                        sx={{
                            alignSelf: 'flex-end',
                            minWidth: 120,
                            direction: 'rtl',
                            '&:hover': {
                                backgroundColor: '#1b5e20',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 8px rgba(46, 125, 50, 0.3)'
                            },
                            transition: 'all 0.2s ease'
                        }}
                    >
                        הוסף שיר
                    </Button>

                    {/* Selected Song Preview */}
                    {selectedSong && (
                        <Paper sx={{
                            padding: 2,
                            backgroundColor: 'rgba(46, 125, 50, 0.05)',
                            border: '1px solid rgba(46, 125, 50, 0.2)',
                            borderRadius: 2,
                            direction: 'rtl'
                        }}>
                            <Typography variant="subtitle2" sx={{
                                marginBottom: 1,
                                color: '#2e7d32',
                                fontWeight: 'bold',
                                textAlign: 'right',
                                direction: 'rtl'
                            }}>
                                שיר נבחר:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, direction: 'rtl' }}>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#2c2c2c', textAlign: 'right' }}>
                                        {selectedSong.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#666', textAlign: 'right' }}>
                                        {selectedSong.artist} • {selectedSong.album}
                                    </Typography>
                                </Box>
                                <Avatar
                                    src={selectedSong.image}
                                    variant="rounded"
                                    sx={{ width: 50, height: 50 }}
                                >
                                    <MusicNote />
                                </Avatar>
                            </Box>
                        </Paper>
                    )}
                </Box>
            </Paper>

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ direction: 'rtl' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default AddSongForm;
