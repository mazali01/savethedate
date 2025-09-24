import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    IconButton,
    Zoom
} from '@mui/material';
import {
    Person as PersonIcon,
    Add as AddIcon,
    Remove as RemoveIcon
} from '@mui/icons-material';

const GuestCountSelection = ({
    guestCount,
    onGuestCountChange,
    onSubmit,
    isSubmitting
}) => {
    const handleDecrease = () => {
        onGuestCountChange(Math.max(1, guestCount - 1));
    };

    const handleIncrease = () => {
        onGuestCountChange(Math.min(10, guestCount + 1));
    };

    return (
        <Zoom in={true}>
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    width: '100%',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(5px)'
                }}
            >
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                    כמה אנשים יגיעו? (כולל אותך)
                </Typography>

                <Box display="flex" alignItems="center" justifyContent="center" gap={3} mb={4}>
                    <IconButton
                        onClick={handleDecrease}
                        color="primary"
                        size="large"
                        disabled={guestCount <= 1}
                    >
                        <RemoveIcon />
                    </IconButton>

                    <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon color="primary" />
                        <Typography variant="h4" sx={{ minWidth: 40, textAlign: 'center' }}>
                            {guestCount}
                        </Typography>
                    </Box>

                    <IconButton
                        onClick={handleIncrease}
                        color="primary"
                        size="large"
                        disabled={guestCount >= 10}
                    >
                        <AddIcon />
                    </IconButton>
                </Box>

                <Button
                    variant="contained"
                    size="large"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    sx={{
                        minWidth: 200,
                        py: 2,
                        fontSize: '1.1rem',
                        bgcolor: '#2e7d32',
                        '&:hover': {
                            bgcolor: '#1b5e20'
                        }
                    }}
                >
                    {isSubmitting ? 'שומר...' : 'אישור'}
                </Button>
            </Paper>
        </Zoom>
    );
};

export default GuestCountSelection;
