import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import PageTemplate from '../components/PageTemplate';
import CarpoolOfferForm from '../components/carpool/CarpoolOfferForm';
import CarpoolBrowser from '../components/carpool/CarpoolBrowser';
import './CarpoolPage.css';

const CarpoolPage = () => {
    const { userId } = useParams();
    const [currentView, setCurrentView] = useState('browse'); // 'browse' or 'offer'

    const handleOfferCreated = () => {
        alert('הצעת הטרמפ שלך פורסמה בהצלחה!');
        setCurrentView('browse');
    };

    const renderCurrentView = () => {
        switch (currentView) {
            case 'offer':
                return (
                    <CarpoolOfferForm
                        userId={userId}
                        onOfferCreated={handleOfferCreated}
                        onCancel={() => setCurrentView('browse')}
                    />
                );
            case 'browse':
            default:
                return <CarpoolBrowser userId={userId} />;
        }
    };

    return (
        <PageTemplate title="מחפשים/נותנים טרמפ? 🚗">
            <div className="carpool-page">
                <div className="carpool-intro">
                    <p>כאן תוכלו למצוא טרמפים או להציע טרמפ לאורחים אחרים!</p>
                    <p>צרו קשר ישירות עם הנהגים דרך WhatsApp</p>
                </div>

                <div className="carpool-navigation">
                    <button
                        className={`nav-button ${currentView === 'browse' ? 'active' : ''}`}
                        onClick={() => setCurrentView('browse')}
                    >
                        🔍 חפש טרמפים
                    </button>
                    <button
                        className={`nav-button ${currentView === 'offer' ? 'active' : ''}`}
                        onClick={() => setCurrentView('offer')}
                    >
                        🚗 הצע טרמפ
                    </button>
                </div>

                <div className="carpool-content">
                    {renderCurrentView()}
                </div>
            </div>
        </PageTemplate>
    );
};

export default CarpoolPage;