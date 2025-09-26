import React, { useState, useEffect } from 'react';
import { getMatchingSinglesProfiles, getSinglesProfile } from '../../services/singlesService';
import SwipeableProfileCards from './SwipeableProfileCards';
import './SinglesBrowser.css';

const SinglesBrowser = ({ currentUserId }) => {
    const [profiles, setProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMatchingProfiles();
    }, [currentUserId]);

    const fetchMatchingProfiles = async () => {
        try {
            setIsLoading(true);

            // First get current user's profile to know their preferences
            const userProfile = await getSinglesProfile(currentUserId);

            if (!userProfile) {
                setError('לא נמצא פרופיל. יש ליצור פרופיל קודם.');
                return;
            }

            // Get matching profiles based on user's gender and interests
            const matchingProfiles = await getMatchingSinglesProfiles(
                userProfile.gender,
                userProfile.interestedIn,
                currentUserId
            );

            setProfiles(matchingProfiles);
        } catch (err) {
            console.error('Error fetching matching profiles:', err);
            setError('שגיאה בטעינת הפרופילים');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="singles-browser">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>טוען פרופילים...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="singles-browser">
                <div className="error-state">
                    <p>{error}</p>
                    <button onClick={fetchMatchingProfiles} className="retry-btn">
                        נסה שוב
                    </button>
                </div>
            </div>
        );
    }

    if (profiles.length === 0) {
        return (
            <div className="singles-browser">
                <SwipeableProfileCards profiles={[]} />
            </div>
        );
    }

    return (
        <div className="singles-browser">
            <SwipeableProfileCards profiles={profiles} />
        </div>
    );
};

export default SinglesBrowser;
