import React from 'react';
import {
    Box,
    Typography,
    CircularProgress
} from '@mui/material';

const LoadingState = () => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            minHeight="60vh"
            gap={2}
        >
            <CircularProgress size={60} color="primary" />
            <Typography variant="h6" color="text.secondary">
                טוען פרטי הזמנה...
            </Typography>
        </Box>
    );
};

export default LoadingState;
