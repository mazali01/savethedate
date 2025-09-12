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
                height: '93vh',
                flexDirection: 'column',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
            }}
        >
            {/* Header with back button and title */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.5rem',
                    borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
                }}
            >
                <IconButton
                    onClick={handleBack}
                    sx={{
                        color: '#00ffff',
                        marginRight: '0.5rem',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 255, 255, 0.1)',
                        },
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#00ffff' }}>
                    {title}
                </h1>
            </Box>

            {/* Main content */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'auto',
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        backgroundColor: 'rgba(0, 200, 130, 0.1)',
                        border: '1px solid rgba(0, 255, 255, 0.3)',
                        textAlign: 'center',
                        width: '100%',
                    }}
                >
                    {children}
                </Paper>
            </Box>

            <CalendarButtons event={{
                title: 'החתונה של ערן & מזל',
                description: 'החתונה של ערן & מזל',
                location: 'הבית, רעננה',
                start: weddingStartDate,
                end: new Date('2025-10-17T03:00:00'),
            }} />
        </Box>
    );
};

export default PageTemplate;
