import React from 'react';

const WhiteCurtain = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none',
        }}>
            <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.8,
                    filter: 'contrast(100%) brightness(100%) saturate(20%) blur(4px)',
                }}
            >
                <source src="/white-curtain.mp4" type="video/mp4" />
            </video>
        </div>
    );
};

export default WhiteCurtain;