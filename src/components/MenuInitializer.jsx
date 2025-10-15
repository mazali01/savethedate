import React, { useState } from 'react';
import { Button, Alert, Box, Typography, CircularProgress } from '@mui/material';
import { Restaurant as RestaurantIcon } from '@mui/icons-material';
import { initializeDefaultMenu } from '../api';

const MenuInitializer = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleInitialize = async () => {
        if (!window.confirm('האם לאתחל את התפריט עם 11 מנות ברירת מחדל?')) {
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            await initializeDefaultMenu();
            setResult({
                type: 'success',
                message: '🎉 התפריט אותחל בהצלחה! נוספו 11 מנות עם תיאורים מצחיקים.'
            });
        } catch (error) {
            console.error('Error initializing menu:', error);
            setResult({
                type: 'error',
                message: 'שגיאה באתחול התפריט: ' + error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
            <RestaurantIcon sx={{ fontSize: 80, color: '#2e7d32', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
                אתחול תפריט החתונה
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                לחץ על הכפתור כדי להוסיף 11 מנות עם תיאורים מצחיקים ומפורטים
            </Typography>

            <Button
                variant="contained"
                size="large"
                onClick={handleInitialize}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <RestaurantIcon />}
                sx={{ mb: 2 }}
            >
                {loading ? 'מאתחל...' : 'אתחל תפריט'}
            </Button>

            {result && (
                <Alert severity={result.type} sx={{ mt: 2, textAlign: 'right' }}>
                    {result.message}
                </Alert>
            )}

            <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                    המנות שיתווספו:
                </Typography>
                <Typography variant="body2" color="text.secondary" component="div">
                    <ul style={{ marginTop: 8 }}>
                        <li><strong>סלטים (5):</strong> עגבניות מהעוטף, קיסר חקלאים, סלקים ופירות, קרוקט פולנטה, קרפצ'יו חציל</li>
                        <li><strong>מנות לשיתוף (3):</strong> רוסט פיקניה, לברק וניוקי, נאמס עוף</li>
                        <li><strong>עיקריות (3):</strong> טורטליני פולנטה, שיפוד קצבים, פרגית עם קשיו</li>
                    </ul>
                </Typography>
            </Box>
        </Box>
    );
};

export default MenuInitializer;
