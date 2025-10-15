// Song service for managing song proposals, votes, and reactions with Firebase
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    setDoc,
    query,
    orderBy,
    arrayUnion,
    arrayRemove,
    increment,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getInvitedUserById } from './invitedUsersService';

class SongService {
    constructor() {
        this.songsCollection = 'songs';
        this.userVotesCollection = 'userVotes';
        this.userReactionsCollection = 'userReactions';
    }

    // Normalize Firestore doc data into app shape (Dates not Timestamps)
    normalizeSong(docId, data) {
        if (!data) return null;
        const createdAt = data.createdAt?.toDate?.() || data.createdAt || new Date();
        const expiresAt = data.expiresAt?.toDate?.() || data.expiresAt || null;
        // Harmonize preview URL field names (legacy docs may have `previewUrl` camelCase)
        // Always prefer snake_case `preview_url` throughout the app.
        const preview_url = data.preview_url || data.previewUrl || '';
        // Defensive defaults: if song somehow lacks ratings after introducing
        // proposer auto-rating, ensure structure consistency (do NOT overwrite
        // existing averageRating if present and > 0). We won't mutate Firestore
        // here, only shape the returned object.
        let ratings = data.ratings || [];
        let averageRating = data.averageRating;
        let totalRaters = data.totalRaters;
        if (!Array.isArray(ratings)) ratings = [];
        if (ratings.length === 0 && (averageRating === undefined || averageRating === 0)) {
            // Provide virtual default (not persisted): treat as a single 3-star baseline
            averageRating = 3;
            totalRaters = totalRaters || 1; // Reflect baseline for UI sorting consistency
        }
        const normalized = {
            id: docId,
            ...data,
            preview_url, // ensured snake_case
            createdAt,
            expiresAt,
            ratings,
            averageRating,
            totalRaters
        };
        // Backwards compatibility: if some part of UI still reads previewUrl, keep it aligned.
        if (!normalized.previewUrl && preview_url) {
            normalized.previewUrl = preview_url;
        }
        return normalized;
    }

    // Get all songs from Firebase
    async getAllSongs() {
        try {
            const songsQuery = query(
                collection(db, this.songsCollection),
                orderBy('createdAt', 'desc') // Order by creation time (newest first)
            );
            const snapshot = await getDocs(songsQuery);
            const songs = snapshot.docs.map(doc => this.normalizeSong(doc.id, doc.data()));

            // Lightweight in-memory migration (do NOT await all updates simultaneously to avoid quota bursts)
            // If a doc has previewUrl but not preview_url, patch it in background.
            songs.forEach(async (s, idx) => {
                try {
                    if (s.previewUrl && !s.preview_url) {
                        // Fire-and-forget
                        const ref = doc(db, this.songsCollection, s.id);
                        await updateDoc(ref, { preview_url: s.previewUrl });
                        console.log('🔧 Migrated previewUrl -> preview_url for song', s.id);
                    }
                } catch (e) {
                    if (idx < 3) { // avoid spamming logs
                        console.warn('Migration preview_url failed for', s.id, e.message);
                    }
                }
            });

            return songs;
        } catch (error) {
            console.error('Error fetching songs:', error);
            return [];
        }
    }

    // Real-time listener for songs
    onSongsChange(callback) {
        const songsQuery = query(
            collection(db, this.songsCollection),
            orderBy('votes', 'desc'),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(songsQuery, (snapshot) => {
            const songs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
            }));
            callback(songs);
        }, (error) => {
            console.error('Error listening to songs:', error);
            callback([]);
        });
    }

    // Get user votes from Firebase
    async getUserVotes(userId) {
        try {
            const userVotesDoc = await getDoc(doc(db, this.userVotesCollection, userId));
            if (userVotesDoc.exists()) {
                return userVotesDoc.data().votes || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching user votes:', error);
            return [];
        }
    }

    // Get user reactions from Firebase
    async getUserReactions(userId) {
        try {
            const userReactionsDoc = await getDoc(doc(db, this.userReactionsCollection, userId));
            if (userReactionsDoc.exists()) {
                return userReactionsDoc.data().reactions || {};
            }
            return {};
        } catch (error) {
            console.error('Error fetching user reactions:', error);
            return {};
        }
    }

    // Add a new song proposal
    async proposeSong(songData, userId, userName, maxProposals = Infinity) {
        try {
            console.log('🎵 proposeSong called with:', { songData, userId, userName });

            // Check if song already exists (songs no longer expire)
            const existingSongs = await this.getAllSongs();
            const existingSong = existingSongs.find(song => song.spotifyId === songData.id);
            if (existingSong) {
                console.log('❌ Song already exists:', existingSong);
                throw new Error('This song has already been proposed');
            }

            // Check user proposal count
            const userProposalsCount = await this.getUserProposalsCount(userId);
            console.log('👤 User proposals count:', userProposalsCount);
            if (maxProposals !== Infinity && userProposalsCount >= maxProposals) {
                throw new Error(`You can only propose up to ${maxProposals} songs`);
            }

            // Try to get real user name from Firebase
            let realUserName = userName;
            try {
                const user = await getInvitedUserById(userId);
                if (user && user.name) {
                    realUserName = user.name;
                }
            } catch (error) {
                console.warn('Could not fetch user name from Firebase, using provided name:', error);
            }

            console.log('👤 Using user name:', realUserName);

            // Create new song entry
            const newSong = {
                spotifyId: songData.id,
                name: songData.name,
                artist: songData.artist,
                album: songData.album || '',
                image: songData.image || '',
                preview_url: songData.preview_url || '',
                external_urls: songData.external_urls || {},
                proposedBy: {
                    userId: userId,
                    userName: realUserName,
                    timestamp: serverTimestamp()
                },
                votes: 0, // Keep for backward compatibility
                // Initialize with proposer default rating = 3
                ratings: [{ userId, rating: 3 }], // Array of {userId, rating} objects
                averageRating: 3,
                totalRaters: 1,
                reactions: {
                    '🔥': 0,
                    '😍': 0,
                    '😂': 0,
                    '🎉': 0,
                    '💃': 0,
                    '🕺': 0,
                    '❤️': 0,
                    '🎵': 0
                },
                voters: [], // Keep for backward compatibility
                reactors: {},
                createdAt: serverTimestamp()
                // No longer set expiresAt - songs stay forever
            };

            console.log('💾 Saving new song to Firebase:', newSong);

            const docRef = await addDoc(collection(db, this.songsCollection), newSong);
            console.log('✅ Song saved with ID:', docRef.id);

            // Update user proposals count
            await this.incrementUserProposalsCount(userId);

            const returnSong = {
                id: docRef.id,
                ...newSong,
                createdAt: new Date()
                // No expiresAt field
            };

            console.log('✅ Returning song:', returnSong);
            return returnSong;
        } catch (error) {
            console.error('❌ Error proposing song:', error);
            throw error;
        }
    }

    // Vote for a song
    async voteForSong(songId, userId, maxVotes = 5) {
        try {
            const userVotes = await this.getUserVotes(userId);

            // Check if user has reached max votes
            if (userVotes.length >= maxVotes) {
                throw new Error(`You can only vote for up to ${maxVotes} songs`);
            }

            // Check if user already voted for this song
            if (userVotes.includes(songId)) {
                throw new Error('You have already voted for this song');
            }

            const songRef = doc(db, this.songsCollection, songId);
            const userVotesRef = doc(db, this.userVotesCollection, userId);

            // Ensure user votes document exists
            await this.ensureUserVotesDoc(userId);

            // Update song votes and voters
            await updateDoc(songRef, {
                votes: increment(1),
                voters: arrayUnion(userId)
            });

            // Update user votes
            await updateDoc(userVotesRef, {
                votes: arrayUnion(songId)
            });

            // Get updated song
            const songDoc = await getDoc(songRef);
            return this.normalizeSong(songDoc.id, songDoc.data());
        } catch (error) {
            console.error('Error voting for song:', error);
            throw error;
        }
    }

    // Remove vote from a song
    async removeVoteFromSong(songId, userId) {
        try {
            const userVotes = await this.getUserVotes(userId);

            // Check if user voted for this song
            if (!userVotes.includes(songId)) {
                throw new Error('You have not voted for this song');
            }

            const songRef = doc(db, this.songsCollection, songId);
            const userVotesRef = doc(db, this.userVotesCollection, userId);

            // Ensure user votes document exists
            await this.ensureUserVotesDoc(userId);

            // Update song votes and voters
            await updateDoc(songRef, {
                votes: increment(-1),
                voters: arrayRemove(userId)
            });

            // Update user votes
            await updateDoc(userVotesRef, {
                votes: arrayRemove(songId)
            });

            // Get updated song
            const songDoc = await getDoc(songRef);
            return this.normalizeSong(songDoc.id, songDoc.data());
        } catch (error) {
            console.error('Error removing vote from song:', error);
            throw error;
        }
    }

    // Remove song (by proposer or DJ)
    async removeSong(songId, userId, userName = null) {
        try {
            const songRef = doc(db, this.songsCollection, songId);
            const songDoc = await getDoc(songRef);

            if (!songDoc.exists()) {
                throw new Error('Song not found');
            }

            const songData = songDoc.data();

            const isDJ = userName === 'דיגיי';
            // Allow removal if user is the proposer OR if user is the DJ
            if (songData.proposedBy?.userId !== userId && !isDJ) {
                throw new Error('You can only remove songs you proposed');
            }

            await deleteDoc(songRef);
            return this.normalizeSong(songId, songData);
        } catch (error) {
            console.error('Error removing song:', error);
            throw error;
        }
    }

    // Rate a song (1-5 stars)
    async rateSong(songId, userId, rating) {
        try {
            if (rating < 1 || rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }

            const songRef = doc(db, this.songsCollection, songId);
            const songDoc = await getDoc(songRef);

            if (!songDoc.exists()) {
                throw new Error('Song not found');
            }

            const songData = songDoc.data();
            const ratings = songData.ratings || [];
            const existingRatingIndex = ratings.findIndex(r => r.userId === userId);

            let newRatings;
            if (existingRatingIndex >= 0) {
                // Update existing rating
                newRatings = [...ratings];
                newRatings[existingRatingIndex].rating = rating;
            } else {
                // Add new rating
                newRatings = [...ratings, { userId, rating }];
            }

            // Calculate new average
            const totalRating = newRatings.reduce((sum, r) => sum + r.rating, 0);
            const averageRating = totalRating / newRatings.length;

            await updateDoc(songRef, {
                ratings: newRatings,
                averageRating: averageRating,
                totalRaters: newRatings.length
            });

            // Get updated song
            const updatedSongDoc = await getDoc(songRef);
            return this.normalizeSong(updatedSongDoc.id, updatedSongDoc.data());
        } catch (error) {
            console.error('Error rating song:', error);
            throw error;
        }
    }

    // Get user's rating for a song
    getUserRatingForSong(songData, userId) {
        if (!songData.ratings) return 0;

        // Handle both array format (from server) and object format (from optimistic updates)
        if (Array.isArray(songData.ratings)) {
            // Array format: [{ userId: 'user1', rating: 5 }, ...]
            const userRating = songData.ratings.find(r => r.userId === userId);
            return userRating ? userRating.rating : 0;
        } else if (typeof songData.ratings === 'object') {
            // Object format: { 'user1': 5, 'user2': 3, ... }
            return songData.ratings[userId] || 0;
        }

        return 0;
    }

    // Add reaction to a song
    async addReaction(songId, emoji, userId) {
        try {
            const userReactions = await this.getUserReactions(userId);
            const songReactions = userReactions[songId] || [];

            if (songReactions.includes(emoji)) {
                throw new Error('You have already reacted with this emoji');
            }

            const songRef = doc(db, this.songsCollection, songId);
            const userReactionsRef = doc(db, this.userReactionsCollection, userId);

            // Ensure user reactions document exists
            await this.ensureUserReactionsDoc(userId);

            // Update song reactions
            const reactionField = `reactions.${emoji}`;
            const reactorField = `reactors.${emoji}`;

            await updateDoc(songRef, {
                [reactionField]: increment(1),
                [reactorField]: arrayUnion(userId)
            });

            // Update user reactions
            const newUserReactions = { ...userReactions };
            if (!newUserReactions[songId]) {
                newUserReactions[songId] = [];
            }
            newUserReactions[songId].push(emoji);

            await updateDoc(userReactionsRef, {
                reactions: newUserReactions
            });

            // Get updated song
            const songDoc = await getDoc(songRef);
            return this.normalizeSong(songDoc.id, songDoc.data());
        } catch (error) {
            console.error('Error adding reaction:', error);
            throw error;
        }
    }

    // Get user proposals count
    async getUserProposalsCount(userId) {
        try {
            const songs = await this.getAllSongs();
            // Count all songs proposed by this user (songs no longer expire)
            return songs.filter(song => song.proposedBy?.userId === userId).length;
        } catch (error) {
            console.error('Error getting user proposals count:', error);
            return 0;
        }
    }

    // Increment user proposals count (helper method)
    async incrementUserProposalsCount(userId) {
        // This is handled implicitly by counting proposals in getUserProposalsCount
        // No separate storage needed
    }

    // Get songs sorted by average rating (default)
    async getSongsSortedByRating() {
        const songs = await this.getAllSongs();
        return songs.sort((a, b) => {
            // Sort by average rating descending, then by total raters descending
            if (b.averageRating !== a.averageRating) {
                return (b.averageRating || 0) - (a.averageRating || 0);
            }
            return (b.totalRaters || 0) - (a.totalRaters || 0);
        });
    }

    // Get songs sorted by time remaining (DEPRECATED - songs no longer expire)
    async getSongsSortedByTimeRemaining() {
        // Return all songs sorted by rating instead
        return this.getSongsSortedByRating();
    }

    // Get songs sorted by votes (legacy - keep for backward compatibility)
    async getSongsSortedByVotes() {
        return this.getSongsSortedByRating(); // Default to rating-based sorting
    }

    // Get active songs (DEPRECATED - songs no longer expire, returns all songs)
    async getActiveSongs() {
        return this.getAllSongs();
    }

    // Get top 3 songs
    async getTopThreeSongs() {
        const songs = await this.getSongsSortedByVotes();
        return songs.slice(0, 3);
    }

    // Check if user can vote for a song
    async canUserVote(songId, userId, maxVotes = 5) {
        const userVotes = await this.getUserVotes(userId);
        return userVotes.length < maxVotes && !userVotes.includes(songId);
    }

    // Check if user can propose more songs
    async canUserPropose(userId, maxProposals = 3) {
        const userProposalsCount = await this.getUserProposalsCount(userId);
        return userProposalsCount < maxProposals;
    }

    // Get user's vote and reaction stats
    async getUserStats(userId) {
        try {
            const [userVotes, userReactions] = await Promise.all([
                this.getUserVotes(userId),
                this.getUserReactions(userId)
            ]);
            const userProposalsCount = await this.getUserProposalsCount(userId);

            return {
                votes: userVotes.length,
                proposals: userProposalsCount,
                reactions: Object.values(userReactions).reduce((acc, arr) => acc + arr.length, 0)
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            return {
                votes: 0,
                proposals: 0,
                reactions: 0
            };
        }
    }

    // Initialize with empty data - ensures Firebase collections exist
    async initializeMockData() {
        // No mock data needed - Firebase collections will be created when first document is added
        console.log('Song service initialized with Firebase backend');
    }

    // Ensure user votes document exists
    async ensureUserVotesDoc(userId) {
        try {
            const userVotesRef = doc(db, this.userVotesCollection, userId);
            const userVotesDoc = await getDoc(userVotesRef);

            if (!userVotesDoc.exists()) {
                await setDoc(userVotesRef, {
                    votes: [],
                    createdAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error ensuring user votes document exists:', error);
        }
    }

    // Ensure user reactions document exists
    async ensureUserReactionsDoc(userId) {
        try {
            const userReactionsRef = doc(db, this.userReactionsCollection, userId);
            const userReactionsDoc = await getDoc(userReactionsRef);

            if (!userReactionsDoc.exists()) {
                await setDoc(userReactionsRef, {
                    reactions: {},
                    createdAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error ensuring user reactions document exists:', error);
        }
    }

    // Attempt to enrich a song that lacks preview_url by querying iTunes Search API
    async fetchAndStorePreview(songId) {
        try {
            const songRef = doc(db, this.songsCollection, songId);
            const songDoc = await getDoc(songRef);
            if (!songDoc.exists()) return null;
            const data = songDoc.data();
            if (data.preview_url) {
                return this.normalizeSong(songId, data); // already has
            }
            const query = `${data.name} ${data.artist}`;
            const url = 'https://itunes.apple.com/search';
            const params = new URLSearchParams({ term: query, media: 'music', entity: 'song', limit: '5', country: 'IL' });
            const resp = await fetch(`${url}?${params.toString()}`);
            if (!resp.ok) throw new Error('iTunes request failed');
            const json = await resp.json();
            const match = (json.results || []).find(r => r.previewUrl);
            if (!match) {
                console.log('🎧 No preview found on iTunes for', query);
                return this.normalizeSong(songId, data);
            }
            await updateDoc(songRef, { preview_url: match.previewUrl });
            console.log('🎧 Added preview_url for', songId, '->', match.previewUrl);
            const updatedDoc = await getDoc(songRef);
            return this.normalizeSong(updatedDoc.id, updatedDoc.data());
        } catch (e) {
            console.warn('Preview enrichment failed for', songId, e.message);
            return null;
        }
    }
}

export default new SongService();
