import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageTemplate from '../components/PageTemplate';
import SinglesProfileForm from '../components/singles/SinglesProfileForm';
import SinglesBrowser from '../components/singles/SinglesBrowser';
import { getSinglesProfile, hasSinglesProfile } from '../services/singlesService';
import { getInvitedUserById } from '../services/rsvpService';
import './SinglesPage.css';

const SinglesPage = () => {
    const { userId } = useParams();
    const [currentView, setCurrentView] = useState('loading'); // 'loading', 'browse', 'create', 'edit'
    const [userProfile, setUserProfile] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadUserData();
    }, [userId]);

    const loadUserData = async () => {
        try {
            setIsLoading(true);

            // Load user data from invited users
            const invitedUser = await getInvitedUserById(userId);
            if (!invitedUser) {
                setError('משתמש לא נמצא');
                return;
            }
            setUserData(invitedUser);

            // Check if user has a singles profile
            const existingProfile = await getSinglesProfile(userId);
            setUserProfile(existingProfile);

            // Set initial view based on whether user has profile
            setCurrentView(existingProfile ? 'browse' : 'create');

        } catch (err) {
            console.error('Error loading user data:', err);
            setError('שגיאה בטעינת נתוני המשתמש');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileSuccess = () => {
        // Refresh user data and go to browse view
        loadUserData().then(() => {
            setCurrentView('browse');
        });
    };

    const handleEditProfile = () => {
        setCurrentView('edit');
    };

    const handleCreateProfile = () => {
        setCurrentView('create');
    };

    const handleCancelForm = () => {
        setCurrentView('browse');
    };

    const handleDeleteProfile = async () => {
        // Reset user profile and reload data to ensure clean state
        setUserProfile(null);
        setCurrentView('loading');

        // Reload user data to get fresh state
        await loadUserData();
    };

    if (isLoading) {
        return (
            <PageTemplate title="רווקים? בואו להכיר 💬">
                <div className="singles-loading">
                    <div className="loading-spinner"></div>
                    <p>טוען...</p>
                </div>
            </PageTemplate>
        );
    }

    if (error) {
        return (
            <PageTemplate title="רווקים? בואו להכיר 💬">
                <div className="singles-error">
                    <p>{error}</p>
                </div>
            </PageTemplate>
        );
    }

    const renderCurrentView = () => {
        switch (currentView) {
            case 'create':
                return (
                    <SinglesProfileForm
                        userId={userId}
                        userName={userData?.name}
                        existingProfile={null}
                        onSuccess={handleProfileSuccess}
                        onCancel={handleCancelForm}
                        onDelete={null}
                    />
                );

            case 'edit':
                return (
                    <SinglesProfileForm
                        userId={userId}
                        userName={userData?.name}
                        existingProfile={userProfile}
                        onSuccess={handleProfileSuccess}
                        onCancel={handleCancelForm}
                        onDelete={handleDeleteProfile}
                    />
                );

            case 'browse':
            default:
                return (
                    <div className="singles-main">
                        {/* User's profile status */}
                        <div className="profile-status">
                            {userProfile ? (
                                <div className="profile-exists">
                                    <div className="profile-card-mini">
                                        <img src={userProfile.photoUrl} alt="תמונת פרופיל" />
                                        <div>
                                            <h4>{userProfile.name}</h4>
                                            <p>הפרופיל שלך פעיל</p>
                                        </div>
                                    </div>
                                    <button
                                        className="edit-profile-btn"
                                        onClick={handleEditProfile}
                                    >
                                        ערוך פרופיל
                                    </button>
                                </div>
                            ) : (
                                <div className="no-profile">
                                    <div className="no-profile-message">
                                        <h4>עדיין לא יצרת פרופיל רווק/ה</h4>
                                        <p>צור פרופיל כדי שאחרים יוכלו להכיר אותך!</p>
                                    </div>
                                    <button
                                        className="create-profile-btn"
                                        onClick={handleCreateProfile}
                                    >
                                        צור פרופיל
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Browse other singles */}
                        <SinglesBrowser currentUserId={userId} />
                    </div>
                );
        }
    };

    return (
        <PageTemplate title="רווקים? בואו להכיר 💬">
            {renderCurrentView()}
        </PageTemplate>
    );
};

export default SinglesPage;
