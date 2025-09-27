import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';

/**
 * Draggable Fistuk rating slider (1-5)
 * Features:
 * - Default visual rating of 3 when user hasn't rated yet (doesn't submit until interaction)
 * - Drag the "fistuk" thumb with pointer / touch (pointer events)
 * - Live optimistic background fill while dragging
 * - Commits rating on pointer up (fires onRating)
 */
const FistukRating = ({
    rating = 0,
    onRating,
    disabled = false,
}) => {
    // Internal visual rating (starts at provided rating or default 3)
    const initial = rating && rating > 0 ? rating : 3;
    const [internalRating, setInternalRating] = useState(initial);
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef(null);

    // If parent rating changes (e.g. optimistic -> server confirm), sync when not dragging
    useEffect(() => {
        if (!isDragging) {
            setInternalRating(rating > 0 ? rating : 3);
        }
    }, [rating, isDragging]);

    const positionToValue = useCallback((clientX) => {
        const track = trackRef.current;
        if (!track) return internalRating; // Return internal rating if track is not found
        const rect = track.getBoundingClientRect();
        // Reserve 30px visual padding on each side (matches CSS left/right for track)
        const innerStart = rect.left;
        const innerEnd = rect.right;
        const innerWidth = innerEnd - innerStart;
        const percent = (clientX - innerStart) / innerWidth; // 0..1 left->right
        const clamped = Math.max(0, Math.min(1, percent));
        // Map to 1..5 (five discrete steps)
        const value = 5 - Math.round(clamped * 4); // 0->1 maps to 1..5
        return value;
    }, [internalRating]);

    const startDrag = useCallback((e) => {
        if (disabled) return;
        e.preventDefault();
        setIsDragging(true);
        const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
        const val = positionToValue(clientX);
        setInternalRating(val);
    }, [disabled, positionToValue]);

    const moveDrag = useCallback((e) => {
        if (!isDragging) return;
        const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
        if (clientX == null) return;
        const val = positionToValue(clientX);
        setInternalRating(val);
    }, [isDragging, positionToValue]);

    const endDrag = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        if (!disabled && onRating) {
            onRating(internalRating);
        }
    }, [isDragging, disabled, onRating, internalRating]);

    // Attach global listeners during drag for smoothness
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('pointermove', moveDrag);
            window.addEventListener('pointerup', endDrag, { once: true });
            window.addEventListener('pointercancel', endDrag, { once: true });
            return () => {
                window.removeEventListener('pointermove', moveDrag);
                window.removeEventListener('pointerup', endDrag);
                window.removeEventListener('pointercancel', endDrag);
            };
        }
    }, [isDragging, moveDrag, endDrag]);

    const currentRating = internalRating;

    return (
        <Box
            ref={trackRef}
            sx={{
                position: 'relative',
                width: "100%",
                padding: '2em 0.5em',
                display: 'flex',
                alignItems: 'center',
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                touchAction: 'none',
                userSelect: 'none'
            }}
            onPointerDown={startDrag}
        >
            {/* Slider Track */}
            <Box sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 3,
                transform: 'translateY(-50%)',
                zIndex: 1,
                transition: 'background-color 0.3s'
            }} />

            {/* Active Track */}
            <Box sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: 6,
                transform: 'translateY(-50%)',
                zIndex: 2,
                '&:before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 3,
                    background: 'linear-gradient(90deg,#16a34a,#22c55e,#4ade80)',
                    boxShadow: '0 0 8px rgba(74,222,128,0.6)',
                    transformOrigin: 'left center',
                    transform: `scaleX(${(currentRating - 1) / 4})`,
                    transition: isDragging ? 'none' : 'transform 0.25s ease'
                }
            }} />

            {/* Fistuk Slider Thumb */}
            {currentRating > 0 && (
                <Box sx={{
                    position: 'absolute',
                    left: `calc(${((currentRating - 1) / 4) * 100}% - 22px)`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 3,
                    transition: isDragging ? 'none' : 'left 0.25s ease',
                }}>
                    <Box
                        sx={{
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle at 30% 30%, rgba(74,222,128,0.35), rgba(34,197,94,0.15))',
                            border: '3px solid #4ade80',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 6px 18px rgba(34,197,94,0.45)',
                            cursor: disabled ? 'default' : 'grab',
                            transition: 'transform 0.15s',
                            ...(isDragging && { cursor: 'grabbing', transform: 'scale(1.05)' })
                        }}
                    >
                        <img
                            src={`/fistuk${currentRating}.png`}
                            alt={`${currentRating} fistuk`}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                filter: 'brightness(1.1) saturate(1.2)',
                                pointerEvents: 'none',
                                userSelect: 'none'
                            }}
                            draggable={false}
                        />
                    </Box>
                </Box>
            )}

            {/* Rating Markers */}
            {[1, 2, 3, 4, 5].map((value) => (
                <Box
                    key={value}
                    sx={{
                        position: 'absolute',
                        left: `calc(${((value - 1) / 4) * 100}%)`,
                        bottom: 8,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: currentRating >= value ? '#4ade80' : 'rgba(255,255,255,0.35)',
                        boxShadow: currentRating >= value ? '0 0 6px rgba(74,222,128,0.7)' : 'none',
                        transition: 'background-color 0.2s, box-shadow 0.2s',
                        zIndex: 1
                    }}
                />
            ))}
        </Box>
    );
};

export default FistukRating;
