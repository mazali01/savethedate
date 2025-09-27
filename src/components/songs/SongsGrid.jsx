import React from 'react';
import { Box } from '@mui/material';
import SongCard from './SongCard';
import songService from '../../services/songService';

const SongsGrid = ({
    songs,
    userId,
    playingTrack,
    onPlayPause,
    onRating,
    onRemove,
    isRating,
    isRemoving,
    isPreviewLoading
}) => {
    // Get top 3 songs for special backgrounds (always sorted by rating now)
    const getCardBackground = (index, song) => {
        const backgrounds = [
            'linear-gradient(135deg, rgba(185, 246, 202, 0.1) 0%, rgba(74, 222, 128, 0.1) 100%)', // Diamond (Green)
            'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(218, 165, 32, 0.1) 100%)',     // Gold
            'linear-gradient(135deg, rgba(205, 127, 50, 0.1) 0%, rgba(160, 82, 45, 0.1) 100%)'      // Bronze
        ];

        if (index < 3 && (song.averageRating || 0) > 0) {
            return backgrounds[index];
        }

        return 'rgba(255, 255, 255, 0.05)';
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
        }}>
            {songs.map((song, index) => (
                <SongCard
                    key={song.id}
                    song={song}
                    index={index}
                    userId={userId}
                    isPlaying={playingTrack === song.id}
                    userRating={songService.getUserRatingForSong(song, userId)}
                    onPlayPause={onPlayPause}
                    onRating={(rating) => onRating(song.id, rating)}
                    onRemove={() => onRemove(song.id)}
                    isRating={isRating}
                    isRemoving={isRemoving}
                    cardBackground={getCardBackground(index, song)}
                    isPreviewLoading={isPreviewLoading && playingTrack === song.id}
                />
            ))}
        </Box>
    );
};

export default SongsGrid;
