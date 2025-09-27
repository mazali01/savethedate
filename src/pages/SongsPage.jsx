import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Alert
} from '@mui/material';
import PageTemplate from '../components/PageTemplate';
import SongsPageHeader from '../components/songs/SongsPageHeader';
import SongSearchBar from '../components/songs/SongSearchBar';
import SongsGrid from '../components/songs/SongsGrid';
import EmptyState from '../components/songs/EmptyState';
import LoadingState from '../components/songs/LoadingState';
import useSongManagement from '../hooks/useSongs';
import songService from '../services/songService';
import { getSortedSongs } from '../utils/songUtils';

const FuturisticSongsPage = () => {
    const { userId } = useParams();

    const [playingTrack, setPlayingTrack] = useState(null);
    const [audioInitialized, setAudioInitialized] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const audioRef = useRef(null);

    // Use React Query hooks for song management
    const {
        songs,
        userVotes,
        songsLoading,
        songsError,
        isProposing,
        isVoting,
        isRating,
        isRemoving,
        handleVote,
        handleAddSong,
        handleRating,
        handleRemoveSong,
        refetchSongs
    } = useSongManagement(userId);

    // Initialize song service (just ensures Firebase collections exist)
    useEffect(() => {
        // No need to call songService.initializeMockData() as it's handled by Firebase
    }, [userId]);

    // Cleanup audio when component unmounts
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const handleSongRating = async (songId, rating) => {
        try {
            await handleRating(songId, rating);
        } catch (error) {
            // Rating failed - could implement user notification here
        }
    };

    const handleRemoveMySong = async (songId) => {
        try {
            await handleRemoveSong(songId);
        } catch (error) {
            // Remove song failed - could implement user notification here
        }
    };

    const handlePlayPause = async (track) => {
        // Initialize audio context on first user interaction
        if (!audioInitialized) {
            setAudioInitialized(true);
        }

        // Check if track has preview URL
        let effectiveTrack = track;
        if (!track.preview_url) {
            console.warn('No preview URL initially for track, attempting enrichment:', track.name, track.id);
            try {
                const enriched = await songService.fetchAndStorePreview(track.id);
                if (enriched?.preview_url) {
                    effectiveTrack = { ...enriched };
                    console.log('✅ Enriched preview URL for track', track.id, enriched.preview_url);
                }
            } catch (e) {
                console.warn('Preview enrichment attempt failed:', e.message);
            }
        }
        if (!effectiveTrack.preview_url) {
            console.warn('Still no preview URL for this track after enrichment:', track.name);
            alert('קדימון אודיו לא זמין לשיר זה');
            return;
        }

        try {
            if (playingTrack === effectiveTrack.id) {
                if (audioRef.current) {
                    audioRef.current.pause();
                }
                setPlayingTrack(null);
                return;
            }

            // If switching tracks, pause previous
            if (audioRef.current) {
                audioRef.current.pause();
            }

            setIsPreviewLoading(true);

            // Reuse existing element or create
            let audio = audioRef.current;
            if (!audio) {
                audio = new Audio();
                audioRef.current = audio;
            }
            audio.src = effectiveTrack.preview_url;
            audio.crossOrigin = 'anonymous';
            audio.preload = 'auto';

            audio.onloadeddata = () => {
                setIsPreviewLoading(false);
            };
            audio.oncanplay = () => {
                setIsPreviewLoading(false);
            };
            audio.onplay = () => {
                setPlayingTrack(effectiveTrack.id);
            };
            audio.onended = () => {
                setPlayingTrack(null);
            };
            audio.onerror = (e) => {
                console.error('Failed to load audio', e);
                setIsPreviewLoading(false);
                setPlayingTrack(null);
                alert('שגיאה בטעינת קדימון השיר');
            };

            await audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
            setPlayingTrack(null);
            audioRef.current = null;
            setIsPreviewLoading(false);

            // Show user-friendly message based on error type
            if (error.name === 'NotAllowedError') {
                alert('הדפדפן חסם את השמעת האודיו. נסה לחזור על הפעולה.');
            } else if (error.name === 'NotSupportedError') {
                alert('סוג קובץ האודיו אינו נתמך בדפדפן זה.');
            } else if (error.name === 'AbortError') {
                console.log('Audio playback was aborted');
            } else {
                alert('שגיאה בהשמעת השיר. ייתכן שהקובץ לא זמין או שיש בעיית רשת.');
            }
        }
    };

    const sortedSongs = getSortedSongs(songs);

    if (songsLoading) {
        return <LoadingState />;
    }

    return (
        <PageTemplate title="🎵 כאן בוחרים שירים 🎵">
            <Box sx={{
                height: '100%',
                width: '100%',
                background: '#1a1a2e',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                direction: 'rtl',
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif'
            }}>
                {/* Header */}
                <SongsPageHeader />

                {/* Search Bar */}
                <SongSearchBar
                    onAddSong={handleAddSong}
                    isProposing={isProposing}
                    existingActiveSpotifyIds={songs.filter(s => {
                        if (!s.expiresAt) return true;
                        return new Date(s.expiresAt).getTime() > Date.now();
                    }).map(s => s.spotifyId)}
                />

                {/* Main Content */}
                <Box sx={{
                    flex: 1,
                    overflow: 'auto',
                    padding: { xs: 2, md: 3 },
                    direction: 'rtl'
                }}>
                    {songsError && (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 3,
                                background: 'rgba(255, 0, 0, 0.1)',
                                border: '1px solid rgba(255, 0, 0, 0.3)',
                                color: '#ff6b6b',
                                direction: 'rtl',
                                textAlign: 'right'
                            }}
                        >
                            שגיאה בטעינת השירים: {songsError?.message || 'שגיאה לא ידועה'}
                        </Alert>
                    )}

                    {/* Songs Grid or Empty State */}
                    {sortedSongs.length > 0 ? (
                        <SongsGrid
                            songs={sortedSongs}
                            userId={userId}
                            playingTrack={playingTrack}
                            onPlayPause={handlePlayPause}
                            onRating={handleSongRating}
                            onRemove={handleRemoveMySong}
                            isRating={isRating}
                            isRemoving={isRemoving}
                            isPreviewLoading={isPreviewLoading}
                        />
                    ) : !songsLoading && (
                        <EmptyState />
                    )}
                </Box>
            </Box>
        </PageTemplate>
    );
};

export default FuturisticSongsPage;
