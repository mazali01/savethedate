import React, { useState } from 'react';
import { useSinglesProfile, useMatchingSinglesProfiles } from '../../api';
import SwipeableProfileCards from './SwipeableProfileCards';
import './SinglesBrowser.css';

const SinglesBrowser = ({ currentUserId }) => {
    const [error, setError] = useState('');

    // Get current user's profile to determine matching criteria
    const { data: userProfile, isLoading: profileLoading, error: profileError } = useSinglesProfile(currentUserId);

    // Get matching profiles based on user's preferences
    const {
        data: profiles = [],
        isLoading: profilesLoading,
        error: profilesError
    } = useMatchingSinglesProfiles(
        userProfile?.gender,
        userProfile?.interestedIn,
        currentUserId
    );

    const isLoading = profileLoading || profilesLoading;

    // Handle errors
    React.useEffect(() => {
        if (profileError) {
            setError('לא נמצא פרופיל. יש ליצור פרופיל קודם.');
        } else if (profilesError) {
            setError('שגיאה בטעינת פרופילי הרווקים');
        } else {
            setError('');
        }
    }, [profileError, profilesError]);

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
                    <button onClick={() => window.location.reload()} className="retry-btn">
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
