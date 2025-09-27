/**
 * Utility functions for song management
 */

/**
 * Filters and sorts songs by rating and activity
 * @param {Array} songs - Array of song objects
 * @returns {Array} - Filtered and sorted songs
 */
export const getSortedSongs = (songs) => {
    const now = new Date();

    const activeSongs = songs.filter(song => {
        if (!song.expiresAt) return true; // Keep songs without expiry
        // Support Firestore Timestamp (has toDate) / Date / string
        let expiryTime;
        if (song.expiresAt?.toDate) {
            try { expiryTime = song.expiresAt.toDate(); } catch { expiryTime = new Date(song.expiresAt); }
        } else {
            expiryTime = song.expiresAt instanceof Date ? song.expiresAt : new Date(song.expiresAt);
        }
        if (Number.isNaN(expiryTime.getTime())) return true; // If invalid, don't drop
        return expiryTime > now;
    });

    // Sort by average rating descending, then by total raters descending
    const sorted = activeSongs.sort((a, b) => {
        if ((b.averageRating || 0) !== (a.averageRating || 0)) {
            return (b.averageRating || 0) - (a.averageRating || 0);
        }
        return (b.totalRaters || 0) - (a.totalRaters || 0);
    });

    return sorted;
};
