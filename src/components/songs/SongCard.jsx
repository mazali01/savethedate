import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    Skeleton,
    Fade,
    IconButton,
    Chip,
    CircularProgress,
    Button
} from '@mui/material';
import {
    PlayArrow,
    Pause,
    Delete,
    CheckCircle
} from '@mui/icons-material';
import FistukRating from '../RatingSlider';
import songService from '../../services/songService';

const SongCard = ({
    song,
    index,
    userId,
    userName,
    isPlaying,
    userRating,
    onPlayPause,
    onRating,
    onRemove,
    isRating = false,
    isRemoving = false,
    cardBackground,
    isPreviewLoading = false
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const isMySong = song.proposedBy?.userId === userId;
    const isDJ = userName === 'דיגיי';
    // Support both snake_case and legacy camelCase
    const effectivePreviewUrl = song.preview_url || song.previewUrl || '';

    const handlePlayClick = (e) => {
        if (e) e.stopPropagation();
        if (!effectivePreviewUrl) {
            console.log('🚫 No preview available initially for', song.name, '- requesting enrichment attempt. Fields:', { preview_url: song.preview_url, previewUrl: song.previewUrl });
            // Still invoke parent so it can attempt enrichment (SongsPage logic)
            onPlayPause({ ...song, preview_url: '' });
            return;
        }
        console.log('▶️ Album art clicked. Attempting playback for', song.name, 'Preview URL:', effectivePreviewUrl);
        onPlayPause({ ...song, preview_url: effectivePreviewUrl });
    };

    const handleExpired = () => {
        // Optionally handle expired songs
    };

    return (
        <Fade in timeout={300 + index * 100}>
            <Card sx={{
                background: cardBackground,
                border: '1px solid rgba(0, 255, 255, 0.2)',
                borderRadius: '20px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                direction: 'rtl',
                width: '100%',
                position: 'relative'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 1, direction: 'ltr' }}>
                    {/* Song Info */}
                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: "0.5em" }}>
                            <Typography variant="h6" sx={{
                                color: '#ffffff',
                                fontWeight: 'bold',
                                overflow: 'hidden',
                                textAlign: 'left',
                                fontFamily: 'inherit',
                                flex: 1
                            }}>
                                {song.name}
                            </Typography>
                            {song.proposedBy && (
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: 0.1,
                                    ml: 1
                                }}>
                                    <Typography variant="caption" sx={{
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        fontSize: '0.7rem',
                                        direction: 'rtl',
                                        textAlign: 'right',
                                        fontFamily: 'inherit',
                                    }}>
                                        הוצע על ידי
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        fontSize: '0.7rem',
                                        direction: 'rtl',
                                        textAlign: 'right',
                                        fontFamily: 'inherit',
                                    }}>
                                        {song.proposedBy.userName}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        <Typography variant="body2" sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            direction: 'rtl',
                            textAlign: 'right',
                            fontFamily: 'inherit'
                        }}>
                            {song.artist}
                        </Typography>

                        {/* Rating Component */}
                        <Box sx={{ width: '80%', marginRight: '1em' }}>
                            <FistukRating
                                rating={userRating}
                                onRating={onRating}
                                disabled={isRating}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between', direction: 'rtl' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, direction: 'rtl' }}>
                                    <Chip
                                        label={`${(song.averageRating || 0).toFixed(1)} ⭐`}
                                        size="small"
                                        sx={{
                                            background: 'rgba(255, 193, 7, 0.2)',
                                            color: '#ffc107',
                                            border: '1px solid rgba(255, 193, 7, 0.3)',
                                            direction: 'rtl',
                                            fontSize: '0.7rem',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                    <Chip
                                        label={`${song.totalRaters || 0} דירוגים`}
                                        size="small"
                                        sx={{
                                            background: 'rgba(0, 255, 255, 0.2)',
                                            color: '#00ffff',
                                            border: '1px solid rgba(0, 255, 255, 0.3)',
                                            direction: 'rtl',
                                            fontSize: '0.7rem',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Album Art */}
                    <Box sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                    }}>
                        <Box sx={{
                            position: 'relative',
                            width: 80,
                            height: 80,
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '2px solid rgba(0, 255, 255, 0.3)',
                            cursor: effectivePreviewUrl ? 'pointer' : 'not-allowed'
                        }}
                            role="button"
                            tabIndex={0}
                            aria-label={effectivePreviewUrl ? `נגן תצוגה מקדימה של ${song.name}` : 'אין תצוגה מקדימה'}
                            onClick={handlePlayClick}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlayClick(e); } }}
                        >
                            {!imageLoaded && (
                                <Skeleton
                                    variant="rectangular"
                                    width={80}
                                    height={80}
                                    sx={{ background: 'rgba(255, 255, 255, 0.1)' }}
                                />
                            )}
                            {song.image && (
                                <img
                                    src={song.image}
                                    alt={`${song.name} cover`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: imageLoaded ? 'block' : 'none'
                                    }}
                                    onLoad={() => setImageLoaded(true)}
                                />
                            )}

                            {/* Play/Pause Overlay */}
                            <Box onClick={handlePlayClick} sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.8
                            }}>
                                <IconButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('🎵 Play button clicked for song:', song.name, 'Preview URL:', effectivePreviewUrl, 'Raw fields:', { preview_url: song.preview_url, previewUrl: song.previewUrl });
                                        onPlayPause({ ...song, preview_url: effectivePreviewUrl });
                                    }}
                                    disabled={!effectivePreviewUrl}
                                    title={effectivePreviewUrl ? (isPlaying ? 'השהה' : 'השמע') : 'אין קדימון זמין'}
                                    sx={{
                                        color: '#ffffff',
                                        background: effectivePreviewUrl
                                            ? 'rgba(0, 255, 255, 0.2)'
                                            : 'rgba(255, 255, 255, 0.1)',
                                        '&:hover': {
                                            background: effectivePreviewUrl
                                                ? 'rgba(0, 255, 255, 0.4)'
                                                : 'rgba(255, 255, 255, 0.2)'
                                        },
                                        '&:disabled': {
                                            color: 'rgba(255, 255, 255, 0.3)',
                                            background: 'rgba(255, 255, 255, 0.1)'
                                        }
                                    }}
                                >
                                    {isPreviewLoading ? (
                                        <CircularProgress size={22} sx={{ color: 'white' }} />
                                    ) : isPlaying ? <Pause /> : <PlayArrow />}
                                </IconButton>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Playing Indicator */}
                {isPlaying && (
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: '#00ffff'
                    }} />
                )}
                {/* DJ Played Button */}
                {isDJ && (
                    <Button
                        size="small"
                        onClick={onRemove}
                        disabled={isRemoving}
                        startIcon={isRemoving ? <CircularProgress size={16} /> : <CheckCircle sx={{ ml: 1 }} />}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: '#4caf50',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            border: '1px solid rgba(76, 175, 80, 0.3)',
                            '&:hover': {
                                background: 'rgba(76, 175, 80, 0.2)',
                                borderColor: 'rgba(76, 175, 80, 0.5)'
                            },
                            '&:disabled': {
                                color: 'rgba(76, 175, 80, 0.3)',
                                borderColor: 'rgba(76, 175, 80, 0.1)'
                            },
                            fontSize: '0.75rem',
                            padding: '4px 8px'
                        }}
                    >
                        נוגן
                    </Button>
                )}
                {/* Remove Button for Song Owner (not DJ) */}
                {isMySong && !isDJ && (
                    <IconButton
                        size="small"
                        onClick={onRemove}
                        disabled={isRemoving}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: '#ff6b6b',
                            mr: 1,
                            '&:hover': {
                                background: 'rgba(255, 107, 107, 0.1)'
                            },
                            '&:disabled': {
                                color: 'rgba(255, 107, 107, 0.3)'
                            }
                        }}
                    >
                        {isRemoving ? (
                            <CircularProgress size={16} sx={{ color: 'inherit' }} />
                        ) : (
                            <Delete fontSize="small" />
                        )}
                    </IconButton>
                )}
            </Card>
        </Fade >
    );
};

export default SongCard;
