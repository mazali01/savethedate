import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Paper, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarButtons from './AddCalendar';

const weddingStartDate = new Date('2025-10-16T19:00:00');

const PageTemplate = ({ children, title }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/');
    };

    return (
        <Box
            sx={{
                display: 'flex',
                width: '100%',
                padding: '1rem',
                height: '93vh',
                flexDirection: 'column',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
            }}
        >
            {/* Header with back button and title */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.5rem',
                    borderBottom: '1px solid rgba(46, 125, 50, 0.3)',
                }}
            >
                <IconButton
                    onClick={handleBack}
                    sx={{
                        color: '#2e7d32',
                        marginRight: '0.5rem',
                        '&:hover': {
                            backgroundColor: 'rgba(46, 125, 50, 0.1)',
                        },
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#2c2c2c' }}>
                    {title}
                </h1>
            </Box>

            {/* Main content */}
            <Paper
                elevation={3}
                sx={{
                    flex: 1,
                    display: 'flex',
                    overflow: 'auto',
                    backgroundColor: 'rgba(46, 125, 50, 0.05)',
                    border: '1px solid rgba(46, 125, 50, 0.3)',
                    textAlign: 'center',
                    width: '100%',
                }}
            >
                {children}
            </Paper>
        </Box>
    );
};

export default PageTemplate;
