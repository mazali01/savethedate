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
            <Box sx={{ textAlign: 'center', color: '#00ffff' }}>
                <Typography variant="h6" sx={{ mb: 1.5, color: '#00ffff', fontSize: '1.1rem' }}>
                    {weddingLocation}
                </Typography>

                <Typography variant="body1" sx={{ mb: 2, color: '#ffffff', fontSize: '0.9rem' }}>
                    {weddingAddress}
                </Typography>

                <Divider sx={{ my: 2, borderColor: 'rgba(0, 255, 255, 0.3)' }} />

                <Typography variant="h6" sx={{ mb: 1.5, color: '#00ffff', fontSize: '1rem' }}>
                    בחרו את אפליקציית הניווט המועדפת עליכם:
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={openWaze}
                        sx={{
                            backgroundColor: '#00c882',
                            '&:hover': {
                                backgroundColor: '#00a571',
                            },
                            color: '#ffffff',
                            fontSize: '1.1rem',
                            padding: '12px 24px',
                        }}
                    >
                        🚗 פתח ב-Waze
                    </Button>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={openGoogleMaps}
                        sx={{
                            backgroundColor: '#00c882',
                            '&:hover': {
                                backgroundColor: '#00a571',
                            },
                            color: '#ffffff',
                            fontSize: '1.1rem',
                            padding: '12px 24px',
                        }}
                    >
                        🗺️ פתח ב-Google Maps
                    </Button>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={openAppleMaps}
                        sx={{
                            backgroundColor: '#00c882',
                            '&:hover': {
                                backgroundColor: '#00a571',
                            },
                            color: '#ffffff',
                            fontSize: '1.1rem',
                            padding: '12px 24px',
                        }}
                    >
                        🍎 פתח ב-Apple Maps
                    </Button>
                </Box>

                <Divider sx={{ my: 3, borderColor: 'rgba(0, 255, 255, 0.3)' }} />

                <Paper
                    elevation={2}
                    sx={{
                        p: 2,
                        mt: 2,
                        backgroundColor: 'rgba(0, 255, 255, 0.1)',
                        border: '1px solid rgba(0, 255, 255, 0.2)'
                    }}
                >
                    <Typography variant="body2" sx={{ color: '#ffffff', mb: 1 }}>
                        🅿️ <strong>חניה:</strong> יש חנייה מול מיקום החתונה
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ffffff', fontSize: '0.9rem' }}>
                        ⚠️ <strong>חשוב:</strong> קחו איתכם את כרטיס החניה לחתימה
                    </Typography>
                </Paper>
            </Box>
        </PageTemplate>
    );
};

export default NavPage;
