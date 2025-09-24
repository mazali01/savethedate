import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getInvitedUserById,
    getRsvpResponse,
    submitRsvpResponse
} from '../services/rsvpService';

// Query keys for consistent cache management
export const QUERY_KEYS = {
    USER: (userId) => ['user', userId],
    RSVP: (userId) => ['rsvp', userId]
};

/**
 * Custom hook to fetch user data by ID
 * @param {string} userId - User ID
 * @returns {object} Query result with user data
 */
export const useUser = (userId) => {
    return useQuery({
        queryKey: QUERY_KEYS.USER(userId),
        queryFn: () => getInvitedUserById(userId),
        enabled: !!userId,
        staleTime: 1000 * 60 * 10, // 10 minutes - user data rarely changes
        retry: 2,
        meta: {
            errorMessage: 'הקישור אינו תקף או שהמוזמן לא נמצא במערכת'
        }
    });
};

/**
 * Custom hook to fetch RSVP response for a user
 * @param {string} userId - User ID
 * @returns {object} Query result with RSVP data
 */
export const useRsvpResponse = (userId) => {
    return useQuery({
        queryKey: QUERY_KEYS.RSVP(userId),
        queryFn: () => getRsvpResponse(userId),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes - RSVP can change more frequently
        retry: 2,
        meta: {
            errorMessage: 'שגיאה בטעינת פרטי התגובה'
        }
    });
};

/**
 * Custom hook to submit or update RSVP response
 * @returns {object} Mutation object for submitting RSVP
 */
export const useSubmitRsvp = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, rsvpData }) => submitRsvpResponse(userId, rsvpData),
        onSuccess: (data, { userId }) => {
            // Invalidate and refetch RSVP query to ensure UI is up to date
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RSVP(userId) });

            // Optionally update the cache directly for immediate UI feedback
            queryClient.setQueryData(QUERY_KEYS.RSVP(userId), data);
        },
        onError: (error) => {
            console.error('Error submitting RSVP:', error);
        },
        meta: {
            errorMessage: 'שגיאה בשליחת התגובה. אנא נסו שוב.'
        }
    });
};

/**
 * Combined hook for loading both user and RSVP data
 * @param {string} userId - User ID
 * @returns {object} Combined loading states and data
 */
export const useRsvpPageData = (userId) => {
    const userQuery = useUser(userId);
    const rsvpQuery = useRsvpResponse(userId);

    return {
        user: userQuery.data,
        existingRsvp: rsvpQuery.data,
        isLoading: userQuery.isLoading || rsvpQuery.isLoading,
        isError: userQuery.isError || rsvpQuery.isError,
        error: userQuery.error || rsvpQuery.error,
        userError: userQuery.error,
        rsvpError: rsvpQuery.error,
        isUserLoading: userQuery.isLoading,
        isRsvpLoading: rsvpQuery.isLoading,
        refetch: () => {
            userQuery.refetch();
            rsvpQuery.refetch();
        }
    };
};
