import React, { useState, useEffect, useRef } from 'react';
import CalendarButtons from './AddCalendar';

const weddingStartDate = new Date('2025-10-16T19:00:00');

const SecretMission = () => {
    const mission = [
        'מה זה? הזמנה לחתונה',
        'של מי? ערן & מזל',
        'מתי? 2025-10-16 19:00',
        'איפה? הבית, רעננה',
        'מה אתם רוצים ממני? כרגע רק לשריין ביומנים!',
        '(אל תעזו לטוס לחו"ל בטעות)',
    ];

    const [text, setText] = useState('');
    const [countdown, setCountdown] = useState('');
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        let lineIndex = 0;
        const revealLine = () => {
            if (lineIndex >= mission.length) {
                setOpacity(1);
                return;
            }
            const chars = mission[lineIndex++].split('');
            let idx = 0;
            const revealChar = () => {
                if (idx < chars.length) {
                    setText(t => t + chars[idx++]);
                    setTimeout(revealChar, 100);
                } else {
                    setText(t => t + '\n');
                    setTimeout(revealLine, 500);
                }
            };
            revealChar();
        };
        setTimeout(() => {
            revealLine();
        }, 1000);

        const updateCountdown = () => {
            const diff = weddingStartDate - new Date();
            if (diff <= 0) {
                setCountdown('🎉 The mission is live! 🎉');
                return;
            }
            const days = Math.floor(diff / 864e5);
            const hours = Math.floor((diff % 864e5) / 36e5);
            const mins = Math.floor((diff % 36e5) / 6e4);
            const secs = Math.floor((diff % 6e4) / 1000);
            setCountdown(`האירוע בעוד: ${days} ימים ${hours} שעות ${mins} דקות ו${secs} שניות`);
        };
        updateCountdown();
        const cdInterval = setInterval(updateCountdown, 1000);

        return () => {
            clearInterval(cdInterval);
            URL.revokeObjectURL(blobUrl);
        };
    }, []);

    return (
        <div className="container">
            <pre>{text}</pre>
            <CalendarButtons event={{
                title: 'החתונה של ערן & מזל',
                description: 'החתונה של ערן & מזל',
                location: 'הבית, רעננה',
                start: weddingStartDate,
                end: new Date('2025-10-17T03:00:00'),
            }}
                style={{ opacity }} />
            <div id="countdown" style={{ transition: "opacity 0.3s ease", opacity }}>{countdown}</div>
        </div>
    );
};

export default SecretMission;