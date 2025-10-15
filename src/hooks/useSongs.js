// React Query hooks for song management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import songService from '../services/songService';

// Query keys
export const SONGS_QUERY_KEY = ['songs'];
export const USER_VOTES_QUERY_KEY = ['userVotes'];
export const USER_REACTIONS_QUERY_KEY = ['userReactions'];
export const USER_STATS_QUERY_KEY = ['userStats'];

// Hook for fetching all songs with real-time updates and caching
export const useSongs = (options = {}) => {
    return useQuery({
        queryKey: SONGS_QUERY_KEY,
        queryFn: songService.getAllSongs.bind(songService),
        refetchInterval: 2000, // Poll every 2 seconds
        staleTime: 1000, // Consider data fresh for 1 second
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        ...options
    });
};

// Hook for fetching user votes
export const useUserVotes = (userId, options = {}) => {
    return useQuery({
        queryKey: [...USER_VOTES_QUERY_KEY, userId],
        queryFn: () => songService.getUserVotes(userId),
        enabled: !!userId,
        refetchInterval: 2000, // Poll every 2 seconds
        staleTime: 1000,
        refetchOnWindowFocus: true,
        ...options
    });
};

// Hook for fetching user reactions
export const useUserReactions = (userId, options = {}) => {
    return useQuery({
        queryKey: [...USER_REACTIONS_QUERY_KEY, userId],
        queryFn: () => songService.getUserReactions(userId),
        enabled: !!userId,
        refetchInterval: 2000,
        staleTime: 1000,
        refetchOnWindowFocus: true,
        ...options
    });
};

// Hook for fetching user stats
export const useUserStats = (userId, options = {}) => {
    return useQuery({
        queryKey: [...USER_STATS_QUERY_KEY, userId],
        queryFn: () => songService.getUserStats(userId),
        enabled: !!userId,
        refetchInterval: 2000,
        staleTime: 1000,
        ...options
    });
};

// Hook for proposing a song
export const useProposeSong = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ songData, userId, userName, maxProposals = Infinity }) =>
            songService.proposeSong(songData, userId, userName, maxProposals),
        onSuccess: (newSong, variables) => {
            console.log('✅ Song proposal successful, updating cache:', newSong);

            // Force refresh the songs list
            queryClient.invalidateQueries({ queryKey: SONGS_QUERY_KEY });

            // Also update the cache optimistically
            queryClient.setQueryData(SONGS_QUERY_KEY, (oldSongs = []) => {
                console.log('🔄 Old songs cache:', oldSongs.length);
                const updatedSongs = [newSong, ...oldSongs];
                console.log('🔄 Updated songs cache:', updatedSongs.length);
                return updatedSongs;
            });

            // Invalidate related queries to ensure fresh data
            queryClient.invalidateQueries({
                queryKey: [...USER_STATS_QUERY_KEY, variables.userId]
            });
        },
        onError: (error) => {
            console.error('Failed to propose song:', error);
        }
    });
};

// Hook for voting on a song
export const useVoteSong = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ songId, userId, maxVotes = 5 }) =>
            songService.voteForSong(songId, userId, maxVotes),
        onSuccess: (updatedSong, variables) => {
            // Update songs cache
            queryClient.setQueryData(SONGS_QUERY_KEY, (oldSongs = []) => {
                return oldSongs.map(song =>
                    song.id === variables.songId ? updatedSong : song
                );
            });

            // Update user votes cache
            queryClient.setQueryData([...USER_VOTES_QUERY_KEY, variables.userId], (oldVotes = []) => {
                return [...oldVotes, variables.songId];
            });

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: SONGS_QUERY_KEY });
            queryClient.invalidateQueries({
                queryKey: [...USER_VOTES_QUERY_KEY, variables.userId]
            });
            queryClient.invalidateQueries({
                queryKey: [...USER_STATS_QUERY_KEY, variables.userId]
            });
        },
        onError: (error) => {
            console.error('Failed to vote for song:', error);
        }
    });
};

// Hook for removing vote from a song
export const useRemoveVote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ songId, userId }) =>
            songService.removeVoteFromSong(songId, userId),
        onSuccess: (updatedSong, variables) => {
            // Update songs cache
            queryClient.setQueryData(SONGS_QUERY_KEY, (oldSongs = []) => {
                return oldSongs.map(song =>
                    song.id === variables.songId ? updatedSong : song
                );
            });

            // Update user votes cache
            queryClient.setQueryData([...USER_VOTES_QUERY_KEY, variables.userId], (oldVotes = []) => {
                return oldVotes.filter(vote => vote !== variables.songId);
            });

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: SONGS_QUERY_KEY });
            queryClient.invalidateQueries({
                queryKey: [...USER_VOTES_QUERY_KEY, variables.userId]
            });
            queryClient.invalidateQueries({
                queryKey: [...USER_STATS_QUERY_KEY, variables.userId]
            });
        },
        onError: (error) => {
            console.error('Failed to remove vote:', error);
        }
    });
};

// Hook for rating a song
export const useRateSong = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ songId, userId, rating }) =>
            songService.rateSong(songId, userId, rating),
        // Optimistic update - update cache immediately
        onMutate: async ({ songId, userId, rating }) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: SONGS_QUERY_KEY });

            // Snapshot the previous value
            const previousSongs = queryClient.getQueryData(SONGS_QUERY_KEY);

            // Optimistically update the cache
            queryClient.setQueryData(SONGS_QUERY_KEY, (oldSongs = []) => {
                const updated = oldSongs.map(song => {
                    if (song.id !== songId) return song;

                    const currentRatings = Array.isArray(song.ratings) ? song.ratings : [];
                    const filtered = currentRatings.filter(r => r.userId !== userId);
                    const updatedRatings = [...filtered, { userId, rating }];
                    const averageRating = updatedRatings.length
                        ? updatedRatings.reduce((sum, r) => sum + r.rating, 0) / updatedRatings.length
                        : 0;

                    return {
                        ...song,
                        ratings: updatedRatings,
                        averageRating,
                        totalRaters: updatedRatings.length, // keep consistent with sorting util
                        ratingCount: updatedRatings.length // legacy field if used elsewhere
                    };
                });
                return [...updated]; // new array reference
            });
            // Return context object with the snapshotted value
            return { previousSongs };
        },
        onSuccess: (updatedSong, variables) => {
            // Update cache with the actual server response (in case there are differences)
            queryClient.setQueryData(SONGS_QUERY_KEY, (oldSongs = []) => {
                return oldSongs.map(song =>
                    song.id === variables.songId ? updatedSong : song
                );
            });

            // Only invalidate user stats, not the main songs list
            queryClient.invalidateQueries({
                queryKey: [...USER_STATS_QUERY_KEY, variables.userId]
            });
        },
        onError: (error, variables, context) => {
            console.error('Failed to rate song:', error);

            // Revert the optimistic update on error
            if (context?.previousSongs) {
                queryClient.setQueryData(SONGS_QUERY_KEY, context.previousSongs);
            }
        }
    });
};

// Hook for removing a song
export const useRemoveSong = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ songId, userId, userName }) =>
            songService.removeSong(songId, userId, userName),
        onSuccess: (removedSong, variables) => {
            // Remove song from cache
            queryClient.setQueryData(SONGS_QUERY_KEY, (oldSongs = []) => {
                return oldSongs.filter(song => song.id !== variables.songId);
            });

            // Remove from user votes if present
            queryClient.setQueryData([...USER_VOTES_QUERY_KEY, variables.userId], (oldVotes = []) => {
                return oldVotes.filter(vote => vote !== variables.songId);
            });

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: SONGS_QUERY_KEY });
            queryClient.invalidateQueries({
                queryKey: [...USER_VOTES_QUERY_KEY, variables.userId]
            });
            queryClient.invalidateQueries({
                queryKey: [...USER_STATS_QUERY_KEY, variables.userId]
            });
        },
        onError: (error) => {
            console.error('Failed to remove song:', error);
        }
    });
};

// Hook for adding reaction to a song
export const useAddReaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ songId, emoji, userId }) =>
            songService.addReaction(songId, emoji, userId),
        onSuccess: (updatedSong, variables) => {
            // Update songs cache
            queryClient.setQueryData(SONGS_QUERY_KEY, (oldSongs = []) => {
                return oldSongs.map(song =>
                    song.id === variables.songId ? updatedSong : song
                );
            });

            // Update user reactions cache
            queryClient.setQueryData([...USER_REACTIONS_QUERY_KEY, variables.userId], (oldReactions = {}) => {
                const newReactions = { ...oldReactions };
                if (!newReactions[variables.songId]) {
                    newReactions[variables.songId] = [];
                }
                newReactions[variables.songId].push(variables.emoji);
                return newReactions;
            });

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: SONGS_QUERY_KEY });
            queryClient.invalidateQueries({
                queryKey: [...USER_REACTIONS_QUERY_KEY, variables.userId]
            });
            queryClient.invalidateQueries({
                queryKey: [...USER_STATS_QUERY_KEY, variables.userId]
            });
        },
        onError: (error) => {
            console.error('Failed to add reaction:', error);
        }
    });
};

// Combined hook that provides all song-related functionality
export const useSongManagement = (userId, userName = null) => {
    const songs = useSongs();
    const userVotes = useUserVotes(userId);
    const userReactions = useUserReactions(userId);
    const userStats = useUserStats(userId);

    const proposeSong = useProposeSong();
    const voteSong = useVoteSong();
    const removeVote = useRemoveVote();
    const rateSong = useRateSong();
    const removeSong = useRemoveSong();
    const addReaction = useAddReaction();

    const handleVote = async (songId) => {
        const votes = userVotes.data || [];
        if (votes.includes(songId)) {
            return removeVote.mutateAsync({ songId, userId });
        } else {
            return voteSong.mutateAsync({ songId, userId });
        }
    };

    const handleAddSong = async (track) => {
        console.log('🎵 handleAddSong called with:', track);
        console.log('🎵 userId:', userId);

        const songData = {
            id: track.id,
            name: track.name,
            artist: track.artist,
            album: track.album,
            image: track.image,
            preview_url: track.preview_url,
            external_urls: track.external_urls
        };

        console.log('🎵 songData prepared:', songData);

        const proposalData = {
            songData,
            userId,
            userName: `אורח ${userId?.slice(-4) || 'אנונימי'}`,
            maxProposals: Infinity
        };

        console.log('🎵 Calling proposeSong.mutateAsync with:', proposalData);

        try {
            const result = await proposeSong.mutateAsync(proposalData);
            console.log('✅ proposeSong completed successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ proposeSong failed:', error);
            throw error;
        }
    };

    const handleReaction = async (songId, emoji) => {
        return addReaction.mutateAsync({ songId, emoji, userId });
    };

    const handleRating = async (songId, rating) => {
        return rateSong.mutateAsync({ songId, userId, rating });
    };

    const handleRemoveSong = async (songId) => {
        return removeSong.mutateAsync({ songId, userId, userName });
    };

    return {
        // Data
        songs: songs.data || [],
        userVotes: userVotes.data || [],
        userReactions: userReactions.data || {},
        userStats: userStats.data || { votes: 0, proposals: 0, reactions: 0 },

        // Loading states
        songsLoading: songs.isLoading,
        userVotesLoading: userVotes.isLoading,
        userReactionsLoading: userReactions.isLoading,
        userStatsLoading: userStats.isLoading,

        // Error states
        songsError: songs.error,
        userVotesError: userVotes.error,
        userReactionsError: userReactions.error,
        userStatsError: userStats.error,

        // Mutation states
        isProposing: proposeSong.isPending,
        isVoting: voteSong.isPending || removeVote.isPending,
        isRating: rateSong.isPending,
        isRemoving: removeSong.isPending,
        isAddingReaction: addReaction.isPending,

        // Actions
        handleVote,
        handleAddSong,
        handleReaction,
        handleRating,
        handleRemoveSong,

        // Raw mutations (for advanced usage)
        proposeSong: proposeSong.mutateAsync,
        voteSong: voteSong.mutateAsync,
        removeVote: removeVote.mutateAsync,
        rateSong: rateSong.mutateAsync,
        removeSong: removeSong.mutateAsync,
        addReaction: addReaction.mutateAsync,

        // Refetch functions
        refetchSongs: songs.refetch,
        refetchUserVotes: userVotes.refetch,
        refetchUserReactions: userReactions.refetch,
        refetchUserStats: userStats.refetch
    };
};

export default useSongManagement;
