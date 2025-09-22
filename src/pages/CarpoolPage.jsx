import React, { useState } from 'react';
import PageTemplate from '../components/PageTemplate';
import CarpoolOfferForm from '../components/carpool/CarpoolOfferForm';
import CarpoolRequestBrowser from '../components/carpool/CarpoolRequestBrowser';
import './CarpoolPage.css';

const CarpoolPage = () => {
    const [currentView, setCurrentView] = useState('browse'); // 'browse' or 'offer'

    const handleOfferCreated = (offer) => {
        alert('הצעת הטרמפ שלך פורסמה בהצלחה!');
        setCurrentView('browse');
    };

    const renderCurrentView = () => {
        switch (currentView) {
            case 'offer':
                return (
                    <CarpoolOfferForm
                        onOfferCreated={handleOfferCreated}
                        onCancel={() => setCurrentView('browse')}
                    />
                );
            case 'browse':
            default:
                return <CarpoolRequestBrowser />;
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