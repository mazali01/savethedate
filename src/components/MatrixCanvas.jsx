import React, { useRef, useEffect } from 'react';

const MatrixCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        const fontSize = 24;
        let columns = Math.ceil(width / fontSize) + 1;
        const drops = Array(columns).fill(0);
        const emojis = [
            '💍', '🎉', '💌', '🎶', '🍾', '🍰', '🕺', '💃', '❤️', '✨',
            '🔔', '💐', '🎊', '🥂', '🌹', '🌟', '🎆', '🎇', '🥳', '👰',
            '🤵', '🎁', '📅', '🌺', '🕰️', '📍'
        ];
        const dropInterval = 10; // ms between drop updates
        let lastTime = performance.now();

        // setup DPI scaling
        const setupCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            columns = Math.ceil(width / fontSize) + 1;
            drops.length = columns;
            drops.fill(0);
        };
        setupCanvas();

        const drawFrame = (timestamp) => {
            // clear with white background and slight opacity for trailing effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(0, 0, width, height);

            if (timestamp - lastTime > dropInterval) {
                // update drops
                for (let i = 0; i < columns; i++) {
                    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Dark text for visibility on white
                    ctx.font = `${fontSize}px monospace`;
                    ctx.fillText(emoji, i * fontSize, drops[i] * fontSize);

                    if (drops[i] * fontSize > height && Math.random() > 0.975) {
                        drops[i] = 0;
                    } else {
                        drops[i]++;
                    }
                }
                lastTime = timestamp;
            }

            requestAnimationFrame(drawFrame);
        };

        const handleResize = () => {
            // reset scaling and arrays on resize
            ctx.resetTransform();
            setupCanvas();
        };
        window.addEventListener('resize', handleResize);

        requestAnimationFrame(drawFrame);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 0,
                opacity: 0.9,
                backgroundColor: 'white'
            }}
        />
    );
};

export default MatrixCanvas;
