import React from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarButtons from './AddCalendar';

const weddingStartDate = new Date('2025-10-16T19:00:00');

const MENU_ITEMS = [
    { key: 'rsvp', label: 'כמה תהיו?', emoji: '✅', href: '/rsvp' },
    { key: 'nav', label: 'הוראות הגעה (Waze/Google)', emoji: '📍', href: '/nav' },
    { key: 'gifts', label: 'פה מפנקים אותנו במתנה', emoji: '🎁', href: '/gifts' },
    { key: 'menuImages', label: 'מתלבטים מה לאכול?', emoji: '🍽️', href: '/menu' },
    { key: 'song', label: 'תצביעו לשיר הבא', emoji: '🎶', href: '/songs' },
    { key: 'album', label: 'כאן מעלים תמונות', emoji: '📸', href: 'https://photos.google.com/share/AF1QipMGz2_kVYdc8AoDk7hRvFTW2OIe2CUQYfEVLMPljNqgSQ8e8IEN1nzYPGuXeg0IpQ?pli=1&key=THlxVFhOdWNiMmxHZWxfUW9nbDhqX1NFZDJ1WlRR' },
    { key: 'carpool', label: 'מחפשים/נותנים טרמפ?', emoji: '🚗', href: '/carpool' },
    { key: 'singles', label: 'רווקים? בואו להכיר', emoji: '💬', href: '/singles' },
];

const WeddingMenu = () => {
    const navigate = useNavigate();

    const handleCardClick = (href) => {
        if (!href) return;
        const isExternal = href.startsWith('http') || href.startsWith('https');
        if (isExternal) {
            window.open(href, '_blank');
        } else {
            navigate(href);
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            textAlign: 'center',
            display: 'flex',
            padding: '0',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden' // Prevent main container scroll
        }}>
            <h2 style={{ color: '#2e7d32', margin: '1em 0', flexShrink: 0 }}>ערן & מזל מתחתנים</h2>

            {/* Scrollable grid container */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '1em',
                width: '100%',
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

            <CalendarButtons event={{
                title: 'החתונה של ערן & מזל',
                description: 'החתונה של ערן & מזל',
                location: 'הבית, רעננה',
                start: weddingStartDate,
                end: new Date('2025-10-17T03:00:00'),
            }} />
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
                padding: '0.75em',
                gap: '0.5em',
                fontSize: '1rem',
                borderRadius: '0.75em',
                border: '2px solid rgba(46,125,50,0.3)',
                background: 'rgba(255,255,255,0.9)',
                color: '#2c2c2c',
                cursor: href ? 'pointer' : 'default',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
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