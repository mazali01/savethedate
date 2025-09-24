import React from 'react';
import {
    Typography,
    Button,
    Paper,
    Fade
} from '@mui/material';

const NotComingBummer = ({ onChangeMind, isSubmitting }) => {
    return (
        <Fade in={true}>
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
                <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'text.primary', direction: 'ltr' }}>
                    אנחנו מצטערים שלא תוכל להגיע 😢
                </Typography>

                <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                    ❤️ נשמח לחגוג איתך בהזדמנות אחרת
                </Typography>

                <Button
                    variant="outlined"
                    color="primary"
                    onClick={onChangeMind}
                    disabled={isSubmitting}
                    sx={{
                        minWidth: 200,
                        py: 1.5,
                        fontSize: '1.1rem'
                    }}
                >
                    שינוי החלטה
                </Button>
            </Paper>
        </Fade>
    );
};

export default NotComingBummer;
