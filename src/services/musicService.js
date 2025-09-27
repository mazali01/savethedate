import axios from 'axios';
import { searchLocalSongs, allPopularSongs, popularHebrewSongs } from '../data/songsDatabase';

// Music service using Spotify API and local database
class MusicService {
    constructor() {
        this.accessToken = null;
        this.tokenExpiresAt = null;
        this.clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
        this.clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
        this.useSpotify = !!(this.clientId && this.clientSecret);
    }

    // Authenticate with Spotify (Client Credentials Flow)
    async authenticate() {
        if (!this.clientId || !this.clientSecret) {
            throw new Error('Spotify credentials not configured');
        }

        console.log('🎵 Authenticating with Spotify...');

        try {
            const response = await axios.post(
                'https://accounts.spotify.com/api/token',
                'grant_type=client_credentials',
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
                    }
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
            console.log('✅ Spotify authentication successful');
        } catch (error) {
            console.error('❌ Spotify authentication failed:', error);
            throw new Error('Failed to authenticate with Spotify');
        }
    }

    // Check if token is valid or refresh it
    async ensureValidToken() {
        if (!this.useSpotify) {
            throw new Error('Spotify not configured');
        }

        if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
            await this.authenticate();
        }
    }

    // Simplified search - Spotify + Local
    async searchTracks(query, limit = 8) {
        console.log('🎵 Searching for:', query, 'limit:', limit);

        if (!query || query.length < 2) {
            return [];
        }

        try {
            let allResults = [];

            // Get local results first (fast)
            const localResults = searchLocalSongs(query, 4);
            console.log('🗃️ Local results:', localResults.length);
            allResults.push(...localResults);

            // Get Spotify results if configured
            if (this.useSpotify) {
                try {
                    const spotifyResults = await this.searchSpotify(query, limit);
                    console.log('🎵 Spotify results:', spotifyResults.length);
                    allResults.push(...spotifyResults);
                } catch (error) {
                    console.warn('🎵 Spotify search failed:', error);
                }
            }

            // Simple deduplication by ID
            const uniqueResults = allResults.filter((track, index, array) => {
                return array.findIndex(t => t.id === track.id) === index;
            });

            console.log('🎵 Final results:', uniqueResults.length, uniqueResults.map(r => `${r.name} - ${r.artist}`));

            // Return top results (local songs have higher popularity so they'll be first)
            return uniqueResults.slice(0, limit);

        } catch (error) {
            console.error('🎵 Search error:', error);
            // Just return local results as fallback
            return searchLocalSongs(query, limit);
        }
    }

    // Spotify search (if credentials available)
    async searchSpotify(query, limit = 10) {
        console.log('🎵 Starting Spotify search for:', query);

        try {
            await this.ensureValidToken();

            const response = await axios.get('https://api.spotify.com/v1/search', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    q: query,
                    type: 'track',
                    limit: limit,
                    market: 'IL'
                }
            });

            const tracks = response.data.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                image: track.album.images[0]?.url || null,
                preview_url: track.preview_url,
                external_urls: track.external_urls,
                uri: track.uri,
                popularity: track.popularity,
                source: 'Spotify'
            }));

            console.log('✅ Spotify returned:', tracks.length, 'tracks');
            return tracks;

        } catch (error) {
            console.error('❌ Spotify search failed:', error);
            throw error;
        }
    }

    // Get track by ID - Spotify only
    async getTrack(trackId, source = null) {
        // Try Spotify if available
        if (this.useSpotify) {
            try {
                await this.ensureValidToken();

                const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        market: 'IL'
                    }
                });

                const track = response.data;
                return {
                    id: track.id,
                    name: track.name,
                    artist: track.artists[0].name,
                    album: track.album.name,
                    image: track.album.images[0]?.url || null,
                    preview_url: track.preview_url,
                    external_urls: track.external_urls,
                    uri: track.uri,
                    popularity: track.popularity,
                    source: 'Spotify'
                };

            } catch (error) {
                console.error('Failed to get Spotify track:', error);
            }
        }

        return null;
    }

    // Get multiple tracks by IDs - Spotify only
    async getTracks(trackIds) {
        if (!trackIds || trackIds.length === 0) return [];

        if (!this.useSpotify) {
            console.warn('Spotify not configured');
            return [];
        }

        try {
            await this.ensureValidToken();

            const response = await axios.get('https://api.spotify.com/v1/tracks', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    ids: trackIds.join(','),
                    market: 'IL'
                }
            });

            return response.data.tracks.filter(track => track).map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                image: track.album.images[0]?.url || null,
                preview_url: track.preview_url,
                external_urls: track.external_urls,
                uri: track.uri,
                popularity: track.popularity,
                source: 'Spotify'
            }));

        } catch (error) {
            console.error('Failed to get tracks:', error);
            return [];
        }
    }

    // Search for Hebrew songs specifically
    async searchHebrewSongs(query, limit = 10) {
        const hebrewQuery = `${query} market:IL`;
        return await this.searchTracks(hebrewQuery, limit);
    }

    // Get popular Israeli tracks - use local database only
    async getPopularIsraeliTracks(limit = 50) {
        try {
            // Start with local Hebrew songs (curated and fast)
            const localHebrew = popularHebrewSongs.slice(0, Math.ceil(limit * 0.8));

            let allTracks = [...localHebrew];

            // Add some from full local database
            const additionalLocal = allPopularSongs
                .filter(song => !localHebrew.find(h => h.id === song.id))
                .slice(0, limit - allTracks.length);

            allTracks.push(...additionalLocal);

            // Remove duplicates and limit
            const uniqueTracks = allTracks.filter((track, index, array) => {
                return array.findIndex(t =>
                    t.name.toLowerCase().trim() === track.name.toLowerCase().trim() &&
                    t.artist.toLowerCase().trim() === track.artist.toLowerCase().trim()
                ) === index;
            });

            return uniqueTracks
                .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                .slice(0, limit);

        } catch (error) {
            console.error('Failed to get popular Israeli tracks:', error);
            // Fallback to local database only
            return popularHebrewSongs.slice(0, limit);
        }
    }
}

export default new MusicService();
