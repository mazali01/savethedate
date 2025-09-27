import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import PageTemplate from '../PageTemplate';

const LoadingState = () => {
    return (
        <PageTemplate title="🎵 כאן בוחרים שירים 🎵">
            <Box sx={{
                height: '100%',
                width: '100%',
                background: '#1a1a2e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 3
            }}>
                <CircularProgress size={60} sx={{ color: '#00ffff' }} />
                <Typography variant="h6" sx={{ color: '#ffffff', textAlign: 'center' }}>
                    טוען את עולם המוסיקה...
                </Typography>
            </Box>
        </PageTemplate>
    );
};

export default LoadingState;
