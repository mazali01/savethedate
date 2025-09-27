import { useState, useEffect, useCallback } from 'react';
import songService from '../services/songService';

export const useSongManagement = (userId, userName) => {
    const [songs, setSongs] = useState([]);
    const [userVotes, setUserVotes] = useState([]);
    const [userReactions, setUserReactions] = useState({});
    const [userStats, setUserStats] = useState({ votes: 0, proposals: 0, reactions: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Configuration - Unlimited votes and proposals
    const maxVotes = Infinity;
    const maxProposals = Infinity;

    // Load initial data
    const loadData = useCallback(() => {
        try {
            setLoading(true);

            // Initialize mock data if needed (for development)
            songService.initializeMockData();

            // Load songs and user data
            const allSongs = songService.getAllSongs();
            const votes = songService.getUserVotes(userId);
            const reactions = songService.getUserReactions(userId);
            const stats = songService.getUserStats(userId);

            setSongs(allSongs);
            setUserVotes(votes);
            setUserReactions(reactions);
            setUserStats(stats);
            setError(null);
        } catch (err) {
            setError('שגיאה בטעינת הנתונים');
            console.error('Error loading song data:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Load data on mount and when userId changes
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Add a new song proposal
    const proposeSong = useCallback(async (songData) => {
        try {
            const newSong = await songService.proposeSong(songData, userId, userName, maxProposals);

            // Update state
            setSongs(prevSongs => [...prevSongs, newSong]);
            setUserStats(prevStats => ({
                ...prevStats,
                proposals: prevStats.proposals + 1
            }));

            return newSong;
        } catch (error) {
            throw new Error(error.message);
        }
    }, [userId, userName, maxProposals]);

    // Vote for a song
    const voteForSong = useCallback(async (songId) => {
        try {
            const updatedSong = songService.voteForSong(songId, userId, maxVotes);

            // Update state
            setSongs(prevSongs =>
                prevSongs.map(song =>
                    song.id === songId ? updatedSong : song
                )
            );
            setUserVotes(prevVotes => [...prevVotes, songId]);
            setUserStats(prevStats => ({
                ...prevStats,
                votes: prevStats.votes + 1
            }));

            return updatedSong;
        } catch (error) {
            throw new Error(error.message);
        }
    }, [userId, maxVotes]);

    // Remove vote from a song
    const removeVoteFromSong = useCallback(async (songId) => {
        try {
            const updatedSong = songService.removeVoteFromSong(songId, userId);

            // Update state
            setSongs(prevSongs =>
                prevSongs.map(song =>
                    song.id === songId ? updatedSong : song
                )
            );
            setUserVotes(prevVotes => prevVotes.filter(id => id !== songId));
            setUserStats(prevStats => ({
                ...prevStats,
                votes: Math.max(0, prevStats.votes - 1)
            }));

            return updatedSong;
        } catch (error) {
            throw new Error(error.message);
        }
    }, [userId]);

    // Add reaction to a song
    const addReaction = useCallback(async (songId, emoji) => {
        try {
            const updatedSong = songService.addReaction(songId, emoji, userId);

            // Update state
            setSongs(prevSongs =>
                prevSongs.map(song =>
                    song.id === songId ? updatedSong : song
                )
            );
            setUserReactions(prevReactions => ({
                ...prevReactions,
                [songId]: [...(prevReactions[songId] || []), emoji]
            }));
            setUserStats(prevStats => ({
                ...prevStats,
                reactions: prevStats.reactions + 1
            }));

            return updatedSong;
        } catch (error) {
            throw new Error(error.message);
        }
    }, [userId]);

    // Get top 3 songs
    const getTopThreeSongs = useCallback(() => {
        return songService.getTopThreeSongs();
    }, [songs]);

    // Check if user can vote
    const canUserVote = useCallback((songId) => {
        return songService.canUserVote(songId, userId, maxVotes);
    }, [userId, userVotes, maxVotes]);

    // Check if user can propose
    const canUserPropose = useCallback(() => {
        return songService.canUserPropose(userId, maxProposals);
    }, [userId, userStats.proposals, maxProposals]);

    // Get remaining votes/proposals
    const getRemainingVotes = useCallback(() => {
        return Math.max(0, maxVotes - userVotes.length);
    }, [userVotes.length, maxVotes]);

    const getRemainingProposals = useCallback(() => {
        return Math.max(0, maxProposals - userStats.proposals);
    }, [userStats.proposals, maxProposals]);

    // Refresh data (for real-time updates in production)
    const refreshData = useCallback(() => {
        loadData();
    }, [loadData]);

    return {
        // Data
        songs,
        userVotes,
        userReactions,
        userStats,

        // Loading states
        loading,
        error,

        // Actions
        proposeSong,
        voteForSong,
        removeVoteFromSong,
        addReaction,
        refreshData,

        // Computed values
        topThreeSongs: getTopThreeSongs(),
        canUserVote,
        canUserPropose: canUserPropose(),
        remainingVotes: getRemainingVotes(),
        remainingProposals: getRemainingProposals(),

        // Configuration
        maxVotes,
        maxProposals
    };
};
