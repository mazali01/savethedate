import React from 'react';
import {
    Typography,
    Button,
    Paper,
    Alert,
    Fade
} from '@mui/material';

const CompletedNotAttending = ({ onChangeMind, isSubmitting }) => {
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
                <Alert severity="warning" sx={{ mb: 3 }}>
                    החלטת שלא תוכל להגיע לחתונה
                </Alert>

                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    אם שינית דעתך:
                </Typography>

                <Button
                    variant="outlined"
                    color="primary"
                    onClick={onChangeMind}
                    disabled={isSubmitting}
                    sx={{ minWidth: 200, py: 1.5 }}
                >
                    רוצה להגיע בכל זאת?
                </Button>
            </Paper>
        </Fade>
    );
};

export default CompletedNotAttending;
