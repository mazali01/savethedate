import React from 'react';
import { Box, Typography } from '@mui/material';
import { MusicNote } from '@mui/icons-material';

const EmptyState = () => {
    return (
        <Box sx={{
            textAlign: 'center',
            py: 8,
            color: 'rgba(255, 255, 255, 0.7)',
            direction: 'rtl'
        }}>
            <MusicNote sx={{ fontSize: '4rem', mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{
                direction: 'rtl',
                textAlign: 'center',
                fontFamily: 'inherit'
            }}>
                עדיין אין שירים ברשימה
            </Typography>
            <Typography variant="body1" sx={{
                direction: 'rtl',
                textAlign: 'center',
                fontFamily: 'inherit'
            }}>
                השתמש בחיפוש למעלה כדי להוסיף שירים
            </Typography>
        </Box>
    );
};

export default EmptyState;
