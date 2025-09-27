import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';

import { hasCompletedRsvp } from '../services/rsvpService';
import PageTemplate from './PageTemplate';

const UserRouteWrapper = ({ children }) => {
    const { userId } = useParams();
    const [loading, setLoading] = useState(true);
    const [hasRsvp, setHasRsvp] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        checkRsvpStatus();
    }, [userId]);

    const checkRsvpStatus = async () => {
        try {
            setLoading(true);
            const rsvpCompleted = await hasCompletedRsvp(userId);
            setHasRsvp(rsvpCompleted);
        } catch (error) {
            console.error('Error checking RSVP status:', error);
            setError('שגיאה בטעינת נתוני המשתמש');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <PageTemplate>
                <Box
                    width={'100%'}
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="60vh"
                    flexDirection="column"
                    gap={2}
                >
                    <CircularProgress size={60} />
                    <Typography variant="h6" color="text.secondary">
                        טוען...
                    </Typography>
                </Box>
            </PageTemplate>
        );
    }

    if (error) {
        return (
            <PageTemplate>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <Typography variant="h6" color="error">
                        {error}
                    </Typography>
                </Box>
            </PageTemplate>
        );
    }

    // If user hasn't completed RSVP, redirect to RSVP page
    if (!hasRsvp) {
        return <Navigate to={`/rsvp/${userId}`} replace />;
    }

    // User has completed RSVP, show the requested content
    return children;
};

export default UserRouteWrapper;
