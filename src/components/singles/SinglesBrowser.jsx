import React, { useState, useEffect } from 'react';
import { getMatchingSinglesProfiles, getSinglesProfile } from '../../services/singlesService';
import './SinglesBrowser.css';

const SinglesBrowser = ({ currentUserId }) => {
    const [profiles, setProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUserProfile, setCurrentUserProfile] = useState(null);

    useEffect(() => {
        fetchMatchingProfiles();
    }, [currentUserId]);

    const fetchMatchingProfiles = async () => {
        try {
            setIsLoading(true);

            // First get current user's profile to know their preferences
            const userProfile = await getSinglesProfile(currentUserId);
            setCurrentUserProfile(userProfile);

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
                <div className="empty-state">
                    <div className="empty-icon">💫</div>
                    <h3>אין התאמות בינתיים</h3>
                    <p>אולי יופיעו אנשים נוספים שיתאימו לך בקרוב!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="singles-browser">
            <div className="browser-header">
                <h3>התאמות עבורך</h3>
                <p className="trust-message">
                    אם אתם מתביישים אתם מוזמנים בכיף לדבר איתנו ונעזור לכם להתחבר 😊
                </p>

                <div className="profiles-count">
                    {profiles.length} התאמ{profiles.length === 1 ? 'ה' : 'ות'} נמצא{profiles.length === 1 ? 'ה' : 'ו'}
                </div>
            </div>

            <div className="profiles-grid">
                {profiles.map((profile) => (
                    <SingleProfileCard key={profile.id} profile={profile} />
                ))}
            </div>
        </div>
    );
};

const SingleProfileCard = ({ profile }) => {
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
        setImageError(true);
    };

    const calculateAge = (age, gender) => {
        if (gender === 'female') {
            return `בת ${age}`;
        } else {
            return `בן ${age}`;
        }
    };

    const getGenderEmoji = (gender) => {
        return gender === 'female' ? '👩' : '👨';
    };

    return (
        <div className="profile-card">
            <div className="profile-photo">
                {!imageError ? (
                    <img
                        src={profile.photoUrl}
                        alt={`תמונת פרופיל של ${profile.name}`}
                        onError={handleImageError}
                    />
                ) : (
                    <div className="photo-placeholder">
                        <span>{getGenderEmoji(profile.gender)}</span>
                    </div>
                )}
            </div>

            <div className="profile-info">
                <h4 className="profile-name">{profile.name}</h4>

                <div className="profile-details">
                    <div className="detail-item">
                        <span className="detail-icon">🎂</span>
                        <span>{calculateAge(profile.age, profile.gender)}</span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <span>{profile.location}</span>
                    </div>
                </div>

                <div className="how-we-know">
                    <h5>:איך מכיר אותנו</h5>
                    <p>{profile.howWeKnow}</p>
                </div>

                {(profile.aboutMe || profile.interests) && (
                    <div className="about-me">
                        <h5>:קצת עליי</h5>
                        <p>{profile.aboutMe || profile.interests}</p>
                    </div>
                )}

                <div className="profile-footer">
                    <span className="meet-message">
                        נתראה בחתונה! 🥂
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SinglesBrowser;
