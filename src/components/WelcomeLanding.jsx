import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './WelcomeLanding.css';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

const SLIDE_THRESHOLD = 120; // px

function WelcomeLanding() {
    const navigate = useNavigate();
    const { userId } = useParams();
    const [slideX, setSlideX] = useState(0);
    const [sliding, setSliding] = useState(false);
    const startXRef = useRef(null);

    // Touch events
    const handleTouchStart = (e) => {
        setSliding(true);
        startXRef.current = e.touches[0].clientX;
    };
    const handleTouchMove = (e) => {
        if (!sliding) return;
        const dx = startXRef.current - e.touches[0].clientX;
        setSlideX(Math.max(0, dx));
    };
    const handleTouchEnd = () => {
        setSliding(false);
        if (slideX > SLIDE_THRESHOLD) {
            navigate(`/rsvp/${userId}`);
        } else {
            setSlideX(0);
        }
    };

    // Mouse events (desktop)
    const handleMouseDown = (e) => {
        setSliding(true);
        startXRef.current = e.clientX;
    };
    const handleMouseMove = (e) => {
        if (!sliding) return;
        const dx = startXRef.current - e.clientX;
        setSlideX(Math.max(0, dx));
    };
    const handleMouseUp = () => {
        setSliding(false);
        if (slideX > SLIDE_THRESHOLD) {
            navigate(`/rsvp/${userId}`);
        } else {
            setSlideX(0);
        }
    };

    return (
        <div className="welcome-landing-container">
            <img src={'/welcome.jpeg'} alt="Welcome" className="welcome-image" />
            <div
                className="slide-indicator"
                style={{ transform: `translateX(-${slideX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={sliding ? handleMouseMove : undefined}
                onMouseUp={handleMouseUp}
                onMouseLeave={sliding ? handleMouseUp : undefined}
                tabIndex={0}
                role="button"
                aria-label="Slide to continue"
            >
                <ArrowBack />
                <span className="slide-text">החלק להמשך</span>
                <div className="slide-ripple-container">
                    <div className="slide-ripple-lightning" />
                </div>
            </div>
        </div>
    );
}

export default WelcomeLanding;
