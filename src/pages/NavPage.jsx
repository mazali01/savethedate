import React from 'react';
import { Box, Button, Typography, Paper, Divider } from '@mui/material';
import PageTemplate from '../components/PageTemplate';

const NavPage = () => {
    const weddingLocation = "בית - חלל אירועים אורבני";
    const weddingAddress = "התעשייה 10, רעננה";
    const venueName = "בית - חלל אירועים אורבני";

    const openWaze = () => {
        // Search for venue name in Waze - shows business details
        const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(venueName + " " + weddingAddress)}`;
        window.open(wazeUrl, '_blank');
    };

    const openGoogleMaps = () => {
        // Search for venue name in Google Maps - shows business info, reviews, photos
        const googleMapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(venueName + " " + weddingAddress)}`;
        window.open(googleMapsUrl, '_blank');
    };

    const openAppleMaps = () => {
        // Search for venue name in Apple Maps - shows business details
        const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(venueName + " " + weddingAddress)}`;
        window.open(appleMapsUrl, '_blank');
    };

    return (
        <PageTemplate title="הוראות הגעה 📍">
            <Box sx={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ mb: 1.5, color: '#2e7d32', fontSize: '1.1rem' }}>
                    {weddingLocation}
                </Typography>

                <Typography variant="body1" sx={{ mb: 2, color: '#555555', fontSize: '0.9rem' }}>
                    {weddingAddress}
                </Typography>

                <Divider sx={{ my: 2, borderColor: 'rgba(46, 125, 50, 0.3)' }} />

                <Typography variant="h6" sx={{ mb: 1.5, color: '#2e7d32', fontSize: '1rem' }}>
                    :בחרו את אפליקציית הניווט המועדפת עליכם
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={openWaze}
                        sx={{
                            backgroundColor: '#2e7d32',
                            '&:hover': {
                                backgroundColor: '#1b5e20',
                            },
                            color: '#ffffff',
                            fontSize: '1.1rem',
                            padding: '12px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <img
                            src="https://www.waze.com/favicon.ico"
                            alt="Waze"
                            style={{ width: '20px', height: '20px' }}
                        />
                        פתח ב-Waze
                    </Button>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={openGoogleMaps}
                        sx={{
                            backgroundColor: '#2e7d32',
                            '&:hover': {
                                backgroundColor: '#1b5e20',
                            },
                            color: '#ffffff',
                            fontSize: '1.1rem',
                            padding: '12px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <img
                            src="https://maps.google.com/favicon.ico"
                            alt="Google Maps"
                            style={{ width: '20px', height: '20px' }}
                        />
                        פתח ב-Google Maps
                    </Button>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={openAppleMaps}
                        sx={{
                            backgroundColor: '#2e7d32',
                            '&:hover': {
                                backgroundColor: '#1b5e20',
                            },
                            color: '#ffffff',
                            fontSize: '1.1rem',
                            padding: '12px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <img
                            src="https://www.apple.com/favicon.ico"
                            alt="Apple Maps"
                            style={{ width: '20px', height: '20px' }}
                        />
                        פתח ב-Apple Maps
                    </Button>
                </Box>

                <Divider sx={{ my: 3, borderColor: 'rgba(46, 125, 50, 0.3)' }} />

                <Paper
                    elevation={2}
                    sx={{
                        p: 2,
                        mt: 2,
                        backgroundColor: 'rgba(46, 125, 50, 0.1)',
                        border: '1px solid rgba(46, 125, 50, 0.2)'
                    }}
                >
                    <Typography variant="body2" sx={{ color: '#2c2c2c', mb: 1 }}>
                        🅿️ <strong>חניה:</strong> יש חניון מול האולם
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#555555', fontSize: '0.9rem' }}>
                        ⚠️ <strong>חשוב:</strong> תביאו איתכם את כרטיס החניה לחתימה
                    </Typography>
                </Paper>
            </Box>
        </PageTemplate>
    );
};

export default NavPage;
