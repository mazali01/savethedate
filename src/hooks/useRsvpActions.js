import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubmitRsvp } from '../api/rsvp';

/**
 * Custom hook for RSVP action handlers
 * Separates business logic from UI components
 */
export const useRsvpActions = (userId, user) => {
    const navigate = useNavigate();
    const submitRsvpMutation = useSubmitRsvp();

    const handleNotComing = useCallback(async () => {
        if (!user) return { success: false, error: 'משתמש לא נמצא' };

        try {
            await submitRsvpMutation.mutateAsync({
                userId,
                rsvpData: {
                    isAttending: false,
                    guestCount: 0,
                    userName: user.name,
                    phoneNumber: user.phoneNumber,
                    timestamp: new Date().toISOString()
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Error in handleNotComing:', error);
            return {
                success: false,
                error: 'שגיאה בשליחת התגובה. אנא נסו שוב.'
            };
        }
    }, [userId, user, submitRsvpMutation]);

    const handleGuestCountSubmit = useCallback(async (guestCount) => {
        if (!user) return { success: false, error: 'משתמש לא נמצא' };

        try {
            await submitRsvpMutation.mutateAsync({
                userId,
                rsvpData: {
                    isAttending: true,
                    guestCount,
                    userName: user.name,
                    phoneNumber: user.phoneNumber,
                    timestamp: new Date().toISOString()
                }
            });

            // Don't navigate automatically - let the UI handle it
            return { success: true };
        } catch (error) {
            console.error('Error in handleGuestCountSubmit:', error);
            return {
                success: false,
                error: 'שגיאה בשליחת התגובה. אנא נסו שוב.'
            };
        }
    }, [userId, user, submitRsvpMutation]);

    const handleCancelAttendance = useCallback(async () => {
        if (!user) return { success: false, error: 'משתמש לא נמצא' };

        try {
            await submitRsvpMutation.mutateAsync({
                userId,
                rsvpData: {
                    isAttending: false,
                    guestCount: 0,
                    userName: user.name,
                    phoneNumber: user.phoneNumber,
                    timestamp: new Date().toISOString()
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Error in handleCancelAttendance:', error);
            return {
                success: false,
                error: 'שגיאה בעדכון התגובה. אנא נסו שוב.'
            };
        }
    }, [userId, user, submitRsvpMutation]);

    return {
        handleNotComing,
        handleGuestCountSubmit,
        handleCancelAttendance,
        isSubmitting: submitRsvpMutation.isPending
    };
};
