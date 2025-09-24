import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Define clear RSVP states
export const RSVP_STATES = {
    LOADING: 'loading',
    INITIAL_QUESTION: 'initial_question',
    NOT_COMING_BUMMER: 'not_coming_bummer',
    COMING_GUEST_COUNT: 'coming_guest_count',
    COMPLETED_ATTENDING: 'completed_attending',
    COMPLETED_NOT_ATTENDING: 'completed_not_attending'
};

/**
 * Custom hook for managing RSVP page state and navigation
 * Handles the complex state transitions based on user data and existing RSVP
 */
export const useRsvpPageState = (userId, user, existingRsvp, isLoading) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if user came from wedding menu (for updates)
    const fromMenu = location.state?.fromMenu || false;

    const [currentState, setCurrentState] = useState(RSVP_STATES.LOADING);
    const [guestCount, setGuestCount] = useState(1);

    // Initialize state based on data
    useEffect(() => {
        if (isLoading) {
            setCurrentState(RSVP_STATES.LOADING);
            return;
        }

        if (!user) {
            return; // Error state will be handled by parent
        }

        // Set initial guest count (default to 1)
        setGuestCount(1);

        // Determine initial state based on existing RSVP and navigation context
        if (!existingRsvp) {
            setCurrentState(RSVP_STATES.INITIAL_QUESTION);
            return;
        }

        // Update guest count from existing RSVP
        setGuestCount(existingRsvp.guestCount || 1);

        if (fromMenu) {
            // Coming from menu - show update options (this will show back button)
            if (existingRsvp.isAttending) {
                setCurrentState(RSVP_STATES.COMPLETED_ATTENDING);
            } else {
                setCurrentState(RSVP_STATES.COMPLETED_NOT_ATTENDING);
            }
        } else {
            // Direct link with existing RSVP
            if (existingRsvp.isAttending) {
                // Already attending - show completed state instead of redirecting
                setCurrentState(RSVP_STATES.COMPLETED_ATTENDING);
            } else {
                // Already declined - show bummer message with change mind option (NO back button)
                setCurrentState(RSVP_STATES.NOT_COMING_BUMMER);
            }
        }
    }, [user, existingRsvp, isLoading, fromMenu, navigate, userId]);

    // State transition handlers
    const transitionTo = {
        initialQuestion: () => setCurrentState(RSVP_STATES.INITIAL_QUESTION),
        notComingBummer: () => setCurrentState(RSVP_STATES.NOT_COMING_BUMMER),
        guestCountSelection: () => setCurrentState(RSVP_STATES.COMING_GUEST_COUNT),
        completedAttending: () => setCurrentState(RSVP_STATES.COMPLETED_ATTENDING),
        completedNotAttending: () => setCurrentState(RSVP_STATES.COMPLETED_NOT_ATTENDING)
    };

    // Determine if back button should be shown
    const shouldShowBackButton = fromMenu && ![RSVP_STATES.NOT_COMING_BUMMER, RSVP_STATES.COMPLETED_NOT_ATTENDING].includes(currentState);

    return {
        currentState,
        guestCount,
        setGuestCount,
        shouldShowBackButton,
        fromMenu,
        transitionTo
    };
};
