import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WelcomeConfetti from './WelcomeConfetti';

// In-memory variable to track if confetti has been shown
let confettiShown = false;

const WeddingMenu = () => {
    const navigate = useNavigate();
    const { userId } = useParams();
    const [showConfetti, setShowConfetti] = useState(false);

    // Check if confetti has been shown using in-memory variable
    useEffect(() => {
        if (!confettiShown) {
            setShowConfetti(true);
            confettiShown = true;
        }
    }, []);

    const MENU_ITEMS = [
        { key: 'nav', label: 'הוראות הגעה (Waze/Google)', emoji: '📍', href: `/user/${userId}/nav` },
        { key: 'carpool', label: 'מחפשים/נותנים טרמפ?', emoji: '🚗', href: `/user/${userId}/carpool` },
        { key: 'song', label: 'תצביעו לשיר הבא', emoji: '🎶', href: `/user/${userId}/songs` },
        { key: 'album', label: 'כאן מעלים תמונות', emoji: '📸', href: 'https://photos.google.com/share/AF1QipMGz2_kVYdc8AoDk7hRvFTW2OIe2CUQYfEVLMPljNqgSQ8e8IEN1nzYPGuXeg0IpQ?pli=1&key=THlxVFhOdWNiMmxHZWxfUW9nbDhqX1NFZDJ1WlRR' },
        { key: 'menuImages', label: 'מתלבטים מה לאכול?', emoji: '🍽️', href: `/user/${userId}/menu` },
        { key: 'singles', label: 'רווקים? בואו להכיר', emoji: '💬', href: `/user/${userId}/singles` },
        { key: 'gifts', label: 'פה כותבים לנו ברכות (וגם נותנים מתנות)', emoji: '🎁', href: `/user/${userId}/gifts` },
        { key: 'rsvp-update', label: 'עדכון אישור הגעה', emoji: '✏️', href: `/rsvp/${userId}` },
    ];

    const handleCardClick = (href) => {
        if (!href) return;
        const isExternal = href.startsWith('http') || href.startsWith('https');
        if (isExternal) {
            window.open(href, '_blank');
        } else {
            // If navigating to RSVP, pass state to indicate coming from menu
            if (href.includes('/rsvp/')) {
                navigate(href, { state: { fromMenu: true } });
            } else {
                navigate(href);
            }
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            textAlign: 'center',
            display: 'flex',
            padding: '0.5em',
            marginTop: '2em',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden' // Prevent main container scroll
        }}>
            {/* Confetti only on wedding menu page and only once per refresh */}
            {showConfetti && <WelcomeConfetti />}

            <h2 style={{ color: '#1eadc2', margin: '0' }}>מזל & ערן</h2>
            <h3 style={{ color: '#1eadc2', margin: '0' }}>מתחתנים</h3>

            {/* Scrollable grid container */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                alignContent: 'start',
                gap: '1em',
                height: '100%',
                width: '100%',
                maxWidth: '600px',
                marginTop: '2em',
                overflowY: 'auto',
                overflowX: 'hidden',
                // Custom scrollbar styling
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(46,125,50,0.5) rgba(0,0,0,0.1)',
            }}>
                {MENU_ITEMS.map(item => (
                    <MenuCard
                        key={item.key}
                        href={item.href}
                        emoji={item.emoji}
                        label={item.label}
                        onClick={() => handleCardClick(item.href)}
                    />
                ))}
            </div>
        </div>
    );
};

const MenuCard = ({ href, emoji, label, onClick }) => {
    return (
        <button
            onClick={onClick}
            aria-label={label}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75em',
                gap: '0.5em',
                fontSize: '1rem',
                borderRadius: '0.75em',
                border: '2px solid rgba(46,125,50,0.3)',
                background: 'rgba(255,255,255,0.9)',
                color: '#2c2c2c',
                cursor: href ? 'pointer' : 'default',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                minHeight: '100px',
                height: 'auto',
                width: '100%',
            }}
            onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 4px 20px rgba(46,125,50,0.4)';
            }}
            onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
            }}
        >
            <div style={{ fontSize: '1.8rem' }}>{emoji}</div>
            <div style={{ fontWeight: 600 }}>{label}</div>
        </button>
    );
};

export default WeddingMenu;