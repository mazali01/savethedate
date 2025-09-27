import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { AccessTime } from '@mui/icons-material';

const CountdownTimer = ({ expiresAt, onExpired }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const difference = expiry - now;

            if (difference <= 0) {
                setTimeLeft(0);
                setProgress(0);
                if (onExpired) {
                    onExpired();
                }
                return;
            }

            setTimeLeft(difference);

            // Calculate progress (15 minutes = 900000ms)
            const totalTime = 15 * 60 * 1000; // 15 minutes in ms
            const elapsed = totalTime - difference;
            const progressPercent = Math.min(100, (elapsed / totalTime) * 100);
            setProgress(100 - progressPercent);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [expiresAt, onExpired]);

    const formatTime = (milliseconds) => {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (timeLeft <= 0) {
        return (
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                direction: 'rtl'
            }}>
                <Typography variant="caption" sx={{
                    color: '#ff1744',
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                }}>
                    פג תוקף
                </Typography>
            </Box>
        );
    }

    const getProgressColor = () => {
        if (progress > 50) return '#4caf50'; // Green
        if (progress > 20) return '#ff9800'; // Orange
        return '#f44336'; // Red
    };

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            direction: 'rtl',
            minWidth: 80
        }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                minWidth: 50
            }}>
                <AccessTime sx={{
                    fontSize: '0.8rem',
                    color: getProgressColor()
                }} />
                <Typography variant="caption" sx={{
                    color: getProgressColor(),
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    fontFamily: 'monospace'
                }}>
                    {formatTime(timeLeft)}
                </Typography>
            </Box>

            <Box sx={{ flex: 1, minWidth: 30 }}>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: getProgressColor(),
                            borderRadius: 2,
                        }
                    }}
                />
            </Box>
        </Box>
    );
};

export default CountdownTimer;
