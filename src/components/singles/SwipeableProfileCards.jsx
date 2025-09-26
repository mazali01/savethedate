import React, { useState } from 'react';
import TinderCard from 'react-tinder-card';
import './SwipeableProfileCards.css';

const SwipeableProfileCards = ({ profiles = [] }) => {
    const [cards, setCards] = useState(profiles.map((profile, index) => ({
        ...profile,
        id: `${profile.name}-${index}-${Date.now()}` // Include timestamp for uniqueness
    })));
    const [lastDirection, setLastDirection] = useState();

    if (!profiles || profiles.length === 0) {
        return (
            <div className="swipeable-cards-container">
                <div className="empty-state">
                    <div className="empty-icon">💫</div>
                    <h3>אין התאמות בינתיים</h3>
                    <p>אולי יופיעו אנשים נוספים שיתאימו לך בקרוב!</p>
                </div>
            </div>
        );
    }

    const swiped = (direction, cardId) => {
        console.log('removing: ' + cardId);
        setLastDirection(direction);

        // Move the swiped card to the beginning of the list (bottom of stack) after a delay
        setCards((prevCards) => {
            const swipedCard = prevCards.find(card => card.id === cardId);
            const remainingCards = prevCards.filter(card => card.id !== cardId);
            // Put recycled card at the beginning with a completely new unique ID
            return [{ ...swipedCard, id: `${swipedCard.name}-recycled-${Date.now()}-${Math.random()}` }, ...remainingCards];
        });
    };

    const outOfFrame = (cardId) => {
        console.log(cardId + ' left the screen!');
    };

    return (
        <div className="swipeable-cards-container">
            <div className="cards-header">
                <h3>התאמות עבורך</h3>
                <p className="trust-message">
                    אם אתם מתביישים אתם מוזמנים בכיף לדבר איתנו ונעזור לכם להתחבר 😊
                </p>
            </div>

            <div className="cards-stack">
                {cards.slice(-3).map((profile) => ( // Only render the top 3 cards
                    <TinderCard
                        className="swipe-card"
                        key={profile.id}
                        onSwipe={(dir) => swiped(dir, profile.id)}
                        onCardLeftScreen={() => outOfFrame(profile.id)}
                        swipeRequirementType="position"
                        swipeThreshold={80}
                        preventSwipe={['up', 'down']}
                    >
                        <ProfileCard profile={profile} />
                    </TinderCard>
                ))}
            </div>

            {/* Swipe hint */}
            <div className="swipe-hint">
                החלק שמאלה או ימינה לכרטיס הבא
            </div>

            {lastDirection && (
                <div className="last-direction">
                    You swiped {lastDirection}
                </div>
            )}
        </div>
    );
};

const ProfileCard = ({ profile }) => {
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
                {!imageError && profile.photoUrl && profile.photoUrl.trim() !== '' ? (
                    <img
                        src={profile.photoUrl}
                        alt={`תמונת פרופיל של ${profile.name}`}
                        onError={handleImageError}
                        loading="lazy"
                        draggable={false}
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

                {profile.aboutMe && (
                    <div className="about-me">
                        <h5>:קצת עליי</h5>
                        <p>{profile.aboutMe}</p>
                    </div>
                )}

                <div className="profile-footer">
                    <span className="meet-message">
                        🥂 !נתראה בחתונה
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SwipeableProfileCards;
