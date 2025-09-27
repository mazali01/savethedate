import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageTemplate from '../components/PageTemplate';
import SinglesProfileForm from '../components/singles/SinglesProfileForm';
import SinglesBrowser from '../components/singles/SinglesBrowser';
import { useInvitedUser, useSinglesProfile, useHasSinglesProfile } from '../api';
import './SinglesPage.css';

const SinglesPage = () => {
    const { userId } = useParams();
    const [currentView, setCurrentView] = useState('loading'); // 'loading', 'browse', 'create', 'edit'

    // Use React Query hooks
    const { data: userData, isLoading: userLoading } = useInvitedUser(userId);
    const { data: userProfile, isLoading: profileLoading } = useSinglesProfile(userId);
    const { data: hasProfile, isLoading: hasProfileLoading } = useHasSinglesProfile(userId);

    const isLoading = userLoading || profileLoading || hasProfileLoading;

    useEffect(() => {
        if (isLoading) {
            setCurrentView('loading');
            return;
        }

        if (!userData) {
            setCurrentView('error');
            return;
        }

        if (hasProfile && userProfile) {
            setCurrentView('browse');
        } else {
            setCurrentView('create');
        }
    }, [isLoading, userData, userProfile, hasProfile]);

    const handleProfileSuccess = () => {
        // React Query will automatically update the cache
        setCurrentView('browse');
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

    const handleDeleteProfile = () => {
        // React Query will automatically update the cache
        setCurrentView('create'); // Go to create view after deletion
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

    if (!userData) {
        return (
            <PageTemplate title="רווקים? בואו להכיר 💬">
                <div className="singles-error">
                    <p>משתמש לא נמצא. יש לוודא שהקישור תקין.</p>
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
                                        <h4>{userProfile.name}</h4>
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
