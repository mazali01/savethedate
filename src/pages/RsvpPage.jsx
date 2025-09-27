import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Alert
} from '@mui/material';

import PageTemplate from '../components/PageTemplate';
import { useRsvpPageData } from '../api';
import { useRsvpActions } from '../hooks/useRsvpActions';
import { useRsvpPageState, RSVP_STATES } from '../hooks/useRsvpPageState';
import { motion } from 'framer-motion';
import {
    LoadingState,
    InitialQuestion,
    NotComingBummer,
    GuestCountSelection,
    CompletedAttending,
    CompletedNotAttending
} from '../components/rsvp';

const RsvpPage = () => {
    const { userId } = useParams();

    // Data fetching with React Query
    const { user, existingRsvp, isLoading, isError, error } = useRsvpPageData(userId);

    // State management
    const {
        currentState,
        guestCount,
        setGuestCount,
        shouldShowBackButton,
        transitionTo
    } = useRsvpPageState(userId, user, existingRsvp, isLoading);

    // Action handlers
    const {
        handleNotComing,
        handleGuestCountSubmit,
        handleCancelAttendance,
        isSubmitting
    } = useRsvpActions(userId, user);

    // Local error state for action errors
    const [actionError, setActionError] = useState('');

    // Enhanced action handlers with error handling and state transitions
    const enhancedHandleNotComing = async () => {
        const result = await handleNotComing();
        if (result.success) {
            transitionTo.notComingBummer();
        } else {
            setActionError(result.error);
        }
    };

    const enhancedHandleGuestCountSubmit = async () => {
        const result = await handleGuestCountSubmit(guestCount);
        if (result.success) {
            transitionTo.completedAttending();
        } else {
            setActionError(result.error);
        }
    };

    const enhancedHandleCancelAttendance = async () => {
        const result = await handleCancelAttendance();
        if (result.success) {
            transitionTo.notComingBummer();
        } else {
            setActionError(result.error);
        }
    };

    const handleComing = () => {
        transitionTo.guestCountSelection();
    };

    const handleChangeMind = () => {
        transitionTo.initialQuestion();
    };

    const handleUpdateGuestCount = () => {
        transitionTo.guestCountSelection();
    };



    // Show error page if there's a critical error (user not found)
    if (isError && !user) {
        return (
            <PageTemplate showBackButton={shouldShowBackButton}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <Alert severity="error" sx={{ maxWidth: 400 }}>
                        {error?.message || 'שגיאה בטעינת פרטי ההזמנה'}
                    </Alert>
                </Box>
            </PageTemplate>
        );
    }

    return (
        <PageTemplate showBackButton={shouldShowBackButton} title="אישור הגעה לחתונה">
            <Box
                sx={{
                    backgroundImage: 'url(/rsvp.jpeg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flex: 1,
                    width: '100%',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        zIndex: 1
                    }
                }}
            >
                <Box
                    sx={{
                        maxWidth: 600,
                        mx: 'auto',
                        p: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                        zIndex: 2,
                        width: '100%',
                    }}
                >
                    {(actionError || error) && (
                        <Alert
                            severity="error"
                            sx={{ mb: 3, width: '100%' }}
                            onClose={() => setActionError('')}
                        >
                            {actionError || error?.message || 'שגיאה לא צפויה'}
                        </Alert>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{ width: '100%', textAlign: 'center' }}
                    >
                        <Typography variant="h3" component="h1" gutterBottom sx={{
                            fontWeight: 'bold',
                            color: 'primary.main',
                            direction: 'ltr',
                            mb: 2
                        }}>
                            היי {user?.name}! 👋
                        </Typography>

                        <Typography variant="h5" sx={{ mb: 4, color: 'text.secondary' }}>
                            את/ה מוזמן/ת לחתונה של מזל וערן
                        </Typography>
                    </motion.div>

                    {/* Conditional rendering based on current state */}
                    {currentState === RSVP_STATES.LOADING && <LoadingState />}

                    {currentState === RSVP_STATES.INITIAL_QUESTION && (
                        <InitialQuestion
                            onComing={handleComing}
                            onNotComing={enhancedHandleNotComing}
                            isSubmitting={isSubmitting}
                        />
                    )}

                    {currentState === RSVP_STATES.NOT_COMING_BUMMER && (
                        <NotComingBummer
                            onChangeMind={handleChangeMind}
                            isSubmitting={isSubmitting}
                        />
                    )}

                    {currentState === RSVP_STATES.COMING_GUEST_COUNT && (
                        <GuestCountSelection
                            guestCount={guestCount}
                            onGuestCountChange={setGuestCount}
                            onSubmit={enhancedHandleGuestCountSubmit}
                            isSubmitting={isSubmitting}
                        />
                    )}

                    {currentState === RSVP_STATES.COMPLETED_ATTENDING && (
                        <CompletedAttending
                            guestCount={existingRsvp?.guestCount}
                            onUpdateGuestCount={handleUpdateGuestCount}
                            onCancelAttendance={enhancedHandleCancelAttendance}
                            shouldShowWeddingSiteButton={!shouldShowBackButton}
                            isSubmitting={isSubmitting}
                        />
                    )}

                    {currentState === RSVP_STATES.COMPLETED_NOT_ATTENDING && (
                        <CompletedNotAttending
                            onChangeMind={handleChangeMind}
                            isSubmitting={isSubmitting}
                        />
                    )}
                </Box>
            </Box>
        </PageTemplate>
    );
};

export default RsvpPage;
